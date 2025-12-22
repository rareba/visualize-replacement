/**
 * SPARQL Query Builder for RDF Data Cubes
 *
 * Generates SPARQL queries based on selected cube, dimensions, and measures.
 * Follows the RDF Data Cube vocabulary (QB) and cube.link conventions.
 */

import type {
  SparqlQueryConfig,
  CubeDimension,
  CubeMeasure,
  DimensionFilter,
} from '../types';

/**
 * Standard prefixes for SPARQL queries
 */
const PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
`;

/**
 * SPARQL Query Builder class
 * Generates optimized SPARQL queries for RDF Data Cubes
 */
export class SparqlBuilder {
  private config: SparqlQueryConfig;
  private dimensions: CubeDimension[];
  private measures: CubeMeasure[];

  constructor(
    config: SparqlQueryConfig,
    dimensions: CubeDimension[] = [],
    measures: CubeMeasure[] = []
  ) {
    this.config = config;
    this.dimensions = dimensions;
    this.measures = measures;
  }

  /**
   * Generate variable name from URI
   * Extracts the last path segment and makes it SPARQL-safe
   */
  private uriToVariable(uri: string): string {
    const parts = uri.split(/[/#]/);
    const name = parts[parts.length - 1] || 'var';
    // Make SPARQL-safe: replace non-alphanumeric with underscore
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Escape a string value for SPARQL
   */
  private escapeString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /**
   * Build a FILTER clause for a dimension filter
   */
  private buildFilterClause(filter: DimensionFilter, varName: string): string {
    if (filter.values.length === 0) {
      return '';
    }

    const values = filter.values.map((v) => {
      // Check if it's a URI (starts with http) or a literal
      if (v.startsWith('http://') || v.startsWith('https://')) {
        return `<${v}>`;
      }
      return `"${this.escapeString(v)}"`;
    });

    switch (filter.operator) {
      case 'in':
        return `FILTER(?${varName} IN (${values.join(', ')}))`;
      case 'equals':
        return `FILTER(?${varName} = ${values[0]})`;
      case 'notEquals':
        return `FILTER(?${varName} != ${values[0]})`;
      default:
        return '';
    }
  }

  /**
   * Generate the main observation query
   * Returns tabular data suitable for Grafana visualization
   */
  buildObservationQuery(): string {
    const { cubeUri, selectedDimensions, selectedMeasures, filters, limit, orderBy } = this.config;

    // Build SELECT variables
    const selectVars: string[] = [];
    const wherePatterns: string[] = [];
    const filterClauses: string[] = [];

    // Observation pattern using cube.link vocabulary
    wherePatterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

    // Add dimension patterns
    selectedDimensions.forEach((dimUri, index) => {
      const dim = this.dimensions.find((d) => d.uri === dimUri);
      const varName = dim ? this.uriToVariable(dim.uri) : `dim${index}`;
      const rawVarName = `${varName}_raw`;
      const labelVarName = `${varName}_label`;

      selectVars.push(`?${varName}`);

      // Pattern to get dimension value
      wherePatterns.push(`OPTIONAL { ?obs <${dimUri}> ?${rawVarName} . }`);

      // Try to get human-readable label for dimension values
      wherePatterns.push(
        `OPTIONAL { ?${rawVarName} schema:name ?${labelVarName} . FILTER(LANG(?${labelVarName}) = "en" || LANG(?${labelVarName}) = "de" || LANG(?${labelVarName}) = "") }`
      );

      // Bind the display value (prefer label over raw)
      wherePatterns.push(`BIND(COALESCE(?${labelVarName}, STR(?${rawVarName})) AS ?${varName})`);

      // Add filter if applicable
      const filter = filters.find((f) => f.dimensionUri === dimUri);
      if (filter) {
        filterClauses.push(this.buildFilterClause(filter, rawVarName));
      }
    });

    // Add measure patterns
    selectedMeasures.forEach((measureUri, index) => {
      const measure = this.measures.find((m) => m.uri === measureUri);
      const varName = measure ? this.uriToVariable(measure.uri) : `measure${index}`;

      selectVars.push(`?${varName}`);
      wherePatterns.push(`OPTIONAL { ?obs <${measureUri}> ?${varName} . }`);
    });

    // Handle case where nothing is selected - return all properties
    if (selectVars.length === 0) {
      selectVars.push('?property', '?value');
      wherePatterns.push('?obs ?property ?value .');
      wherePatterns.push('FILTER(?property != rdf:type)');
      wherePatterns.push('FILTER(?property != cube:observedBy)');
      wherePatterns.push('FILTER(?property != <https://cube.link/observedBy>)');
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (orderBy) {
      const varName = this.uriToVariable(orderBy.variable);
      if (selectVars.some((v) => v.includes(varName))) {
        orderByClause = `ORDER BY ${orderBy.direction}(?${varName})`;
      }
    }

    // Build the final query
    const query = `${PREFIXES}
SELECT ${selectVars.join(' ')} WHERE {
  ${wherePatterns.join('\n  ')}
  ${filterClauses.join('\n  ')}
}
${orderByClause}
LIMIT ${limit}`;

    return query.trim();
  }

  /**
   * Generate a time-series optimized query
   * Used when a temporal dimension is detected
   */
  buildTimeSeriesQuery(temporalDimUri: string): string {
    const { cubeUri, selectedDimensions, selectedMeasures, filters, limit } = this.config;

    const selectVars: string[] = ['?time'];
    const wherePatterns: string[] = [];
    const filterClauses: string[] = [];

    // Observation pattern
    wherePatterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

    // Temporal dimension (required for time series)
    wherePatterns.push(`?obs <${temporalDimUri}> ?time .`);

    // Add filter for temporal dimension if present
    const temporalFilter = filters.find((f) => f.dimensionUri === temporalDimUri);
    if (temporalFilter) {
      filterClauses.push(this.buildFilterClause(temporalFilter, 'time'));
    }

    // Add other dimensions as series keys
    selectedDimensions
      .filter((uri) => uri !== temporalDimUri)
      .forEach((dimUri, index) => {
        const dim = this.dimensions.find((d) => d.uri === dimUri);
        const varName = dim ? this.uriToVariable(dim.uri) : `dim${index}`;
        const rawVarName = `${varName}_raw`;
        const labelVarName = `${varName}_label`;

        selectVars.push(`?${varName}`);
        wherePatterns.push(`OPTIONAL { ?obs <${dimUri}> ?${rawVarName} . }`);
        wherePatterns.push(
          `OPTIONAL { ?${rawVarName} schema:name ?${labelVarName} . FILTER(LANG(?${labelVarName}) = "en" || LANG(?${labelVarName}) = "") }`
        );
        wherePatterns.push(`BIND(COALESCE(?${labelVarName}, STR(?${rawVarName})) AS ?${varName})`);

        const filter = filters.find((f) => f.dimensionUri === dimUri);
        if (filter) {
          filterClauses.push(this.buildFilterClause(filter, rawVarName));
        }
      });

    // Add measures as values
    selectedMeasures.forEach((measureUri, index) => {
      const measure = this.measures.find((m) => m.uri === measureUri);
      const varName = measure ? this.uriToVariable(measure.uri) : `value${index}`;

      selectVars.push(`?${varName}`);
      wherePatterns.push(`OPTIONAL { ?obs <${measureUri}> ?${varName} . }`);
    });

    const query = `${PREFIXES}
SELECT ${selectVars.join(' ')} WHERE {
  ${wherePatterns.join('\n  ')}
  ${filterClauses.join('\n  ')}
}
ORDER BY ASC(?time)
LIMIT ${limit}`;

    return query.trim();
  }

  /**
   * Generate a query optimized for table display
   * Returns pivoted data with property names as columns
   */
  buildTableQuery(): string {
    return this.buildObservationQuery();
  }

  /**
   * Get the raw SPARQL string based on query type
   */
  build(queryType: 'observation' | 'timeseries' | 'table' = 'observation'): string {
    switch (queryType) {
      case 'timeseries': {
        // Find temporal dimension
        const temporalDim = this.dimensions.find((d) => d.isTemporal || d.scaleType === 'temporal');
        if (temporalDim && this.config.selectedDimensions.includes(temporalDim.uri)) {
          return this.buildTimeSeriesQuery(temporalDim.uri);
        }
        // Fall back to observation query if no temporal dimension
        return this.buildObservationQuery();
      }
      case 'table':
        return this.buildTableQuery();
      case 'observation':
      default:
        return this.buildObservationQuery();
    }
  }
}

/**
 * Helper function to create a simple query config
 */
export function createQueryConfig(
  cubeUri: string,
  options?: Partial<SparqlQueryConfig>
): SparqlQueryConfig {
  return {
    cubeUri,
    selectedDimensions: [],
    selectedMeasures: [],
    filters: [],
    limit: 10000,
    ...options,
  };
}

/**
 * Generate a cube search query for discovering cubes in a catalog
 */
export function buildCubeSearchQuery(searchTerm: string = '', limit: number = 50): string {
  const searchFilter = searchTerm
    ? `FILTER(CONTAINS(LCASE(?label), LCASE("${searchTerm}")) || CONTAINS(LCASE(?description), LCASE("${searchTerm}")))`
    : '';

  return `${PREFIXES}
SELECT DISTINCT ?cube ?label ?description ?publisher ?dateModified WHERE {
  ?cube a cube:Cube .
  OPTIONAL {
    ?cube schema:name ?labelRaw .
    FILTER(LANG(?labelRaw) = "en" || LANG(?labelRaw) = "de" || LANG(?labelRaw) = "")
  }
  OPTIONAL {
    ?cube schema:description ?descRaw .
    FILTER(LANG(?descRaw) = "en" || LANG(?descRaw) = "de" || LANG(?descRaw) = "")
  }
  OPTIONAL {
    ?cube schema:creator/schema:name ?publisherName .
    FILTER(LANG(?publisherName) = "en" || LANG(?publisherName) = "de" || LANG(?publisherName) = "")
  }
  OPTIONAL { ?cube schema:dateModified ?dateModified }

  BIND(COALESCE(?labelRaw, STR(?cube)) AS ?label)
  BIND(COALESCE(?descRaw, "") AS ?description)
  BIND(COALESCE(?publisherName, "") AS ?publisher)

  ${searchFilter}
}
ORDER BY DESC(?dateModified)
LIMIT ${limit}`;
}

/**
 * Generate a query to fetch cube metadata (dimensions and measures)
 */
export function buildCubeMetadataQuery(cubeUri: string): string {
  return `${PREFIXES}
SELECT ?label ?description ?publisher ?dateModified WHERE {
  <${cubeUri}> a cube:Cube .
  OPTIONAL { <${cubeUri}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "") }
  OPTIONAL { <${cubeUri}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "de" || LANG(?description) = "") }
  OPTIONAL { <${cubeUri}> schema:creator/schema:name ?publisher . FILTER(LANG(?publisher) = "en" || LANG(?publisher) = "de" || LANG(?publisher) = "") }
  OPTIONAL { <${cubeUri}> schema:dateModified ?dateModified }
} LIMIT 1`;
}

/**
 * Generate a query to fetch dimensions for a cube (SHACL-based)
 */
export function buildDimensionsQuery(cubeUri: string): string {
  return `${PREFIXES}
PREFIX meta: <https://cube.link/meta/>

SELECT DISTINCT ?dimension ?label ?order ?datatype ?scaleType WHERE {
  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  # Exclude measures (properties with units)
  FILTER NOT EXISTS { ?prop qudt:unit ?unit }
  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }
  FILTER NOT EXISTS { ?prop qudt:hasUnit ?hasUnit }

  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }
  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }
  OPTIONAL { ?prop sh:order ?order }
  OPTIONAL { ?prop sh:datatype ?datatype }
  OPTIONAL { ?prop meta:scaleType ?scaleType }

  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)
}
ORDER BY ?order ?label`;
}

/**
 * Generate a query to fetch measures for a cube (SHACL-based)
 */
export function buildMeasuresQuery(cubeUri: string): string {
  return `${PREFIXES}
SELECT DISTINCT ?measure ?label ?unit ?datatype WHERE {
  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?measure .

  # Measures have units
  { ?prop qudt:unit ?unitUri }
  UNION { ?prop schema:unitCode ?unitCode }
  UNION { ?prop qudt:hasUnit ?hasUnit }

  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }
  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }
  OPTIONAL { ?unitUri rdfs:label ?unitLabel }
  OPTIONAL { ?prop sh:datatype ?datatype }

  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)
  BIND(COALESCE(?unitLabel, ?unitCode, STR(?unitUri)) AS ?unit)
}
ORDER BY ?label`;
}

/**
 * Generate a query to fetch distinct values for a dimension
 */
export function buildDimensionValuesQuery(cubeUri: string, dimensionUri: string, limit: number = 100): string {
  return `${PREFIXES}
SELECT DISTINCT ?value ?displayLabel WHERE {
  <${cubeUri}> cube:observationSet/cube:observation ?obs .
  ?obs <${dimensionUri}> ?value .
  OPTIONAL { ?value schema:name ?schemaLabel . FILTER(LANG(?schemaLabel) = "en" || LANG(?schemaLabel) = "") }
  OPTIONAL { ?value rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }
  BIND(COALESCE(?schemaLabel, ?rdfsLabel, STR(?value)) AS ?displayLabel)
}
ORDER BY ?displayLabel
LIMIT ${limit}`;
}

export default SparqlBuilder;
