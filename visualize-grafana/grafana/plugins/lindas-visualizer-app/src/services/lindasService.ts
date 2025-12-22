/**
 * LINDAS Service
 *
 * Fetches data from the Swiss Linked Data Service (LINDAS)
 * All SPARQL complexity is hidden from the UI components
 */

import { getBackendSrv } from '@grafana/runtime';
import type {
  CubeMetadata,
  CubeFullMetadata,
  CubeDimension,
  CubeMeasure,
  DataRow,
  SparqlResult,
} from '../types';

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

const PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
PREFIX meta: <https://cube.link/meta/>
`;

/**
 * Execute SPARQL query against LINDAS
 */
async function executeSparql(query: string): Promise<SparqlResult> {
  const response = await getBackendSrv().post(
    LINDAS_ENDPOINT,
    `query=${encodeURIComponent(query)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
      },
    }
  );
  return response;
}

/**
 * Search for cubes in LINDAS
 */
export async function searchCubes(searchTerm: string = ''): Promise<CubeMetadata[]> {
  const searchFilter = searchTerm
    ? `FILTER(CONTAINS(LCASE(?label), LCASE("${searchTerm.replace(/"/g, '\\"')}")) || CONTAINS(LCASE(?description), LCASE("${searchTerm.replace(/"/g, '\\"')}")))`
    : '';

  const query = `${PREFIXES}
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
ORDER BY DESC(?dateModified) ?label
LIMIT 200`;

  try {
    const result = await executeSparql(query);
    return result.results.bindings.map((binding) => ({
      uri: binding.cube?.value || '',
      label: binding.label?.value || 'Unknown',
      description: binding.description?.value || undefined,
      publisher: binding.publisher?.value || undefined,
      dateModified: binding.dateModified?.value || undefined,
    }));
  } catch (error) {
    console.error('Failed to search cubes:', error);
    return [];
  }
}

/**
 * Get full metadata for a cube (dimensions and measures)
 */
export async function getCubeMetadata(cubeUri: string): Promise<CubeFullMetadata | null> {
  // Query for cube info
  const infoQuery = `${PREFIXES}
SELECT ?label ?description ?publisher WHERE {
  <${cubeUri}> a cube:Cube .
  OPTIONAL { <${cubeUri}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "") }
  OPTIONAL { <${cubeUri}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "de" || LANG(?description) = "") }
  OPTIONAL { <${cubeUri}> schema:creator/schema:name ?publisher . FILTER(LANG(?publisher) = "en" || LANG(?publisher) = "de" || LANG(?publisher) = "") }
} LIMIT 1`;

  // Query for dimensions
  const dimensionsQuery = `${PREFIXES}
SELECT DISTINCT ?dimension ?label ?scaleType WHERE {
  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  # Exclude measures
  FILTER NOT EXISTS { ?prop qudt:unit ?unit }
  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }
  FILTER NOT EXISTS { ?prop qudt:hasUnit ?hasUnit }

  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }
  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }
  OPTIONAL { ?prop meta:scaleType ?scaleTypeUri }

  BIND(COALESCE(?propLabel, ?rdfsLabel, STRAFTER(STR(?dimension), "#"), REPLACE(STR(?dimension), "^.*/", "")) AS ?label)
  BIND(STRAFTER(STR(?scaleTypeUri), "scaleType/") AS ?scaleType)
}
ORDER BY ?label`;

  // Query for measures
  const measuresQuery = `${PREFIXES}
SELECT DISTINCT ?measure ?label ?unit WHERE {
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

  BIND(COALESCE(?propLabel, ?rdfsLabel, STRAFTER(STR(?measure), "#"), REPLACE(STR(?measure), "^.*/", "")) AS ?label)
  BIND(COALESCE(?unitLabel, ?unitCode, "") AS ?unit)
}
ORDER BY ?label`;

  try {
    const [infoResult, dimensionsResult, measuresResult] = await Promise.all([
      executeSparql(infoQuery),
      executeSparql(dimensionsQuery),
      executeSparql(measuresQuery),
    ]);

    const info = infoResult.results.bindings[0];

    const dimensions: CubeDimension[] = dimensionsResult.results.bindings.map((b) => {
      const scaleType = b.scaleType?.value?.toLowerCase();
      return {
        uri: b.dimension?.value || '',
        label: b.label?.value || 'Unknown',
        scaleType: scaleType as CubeDimension['scaleType'],
        isTemporal: scaleType === 'temporal',
        isNumerical: scaleType === 'ratio' || scaleType === 'interval',
      };
    });

    const measures: CubeMeasure[] = measuresResult.results.bindings.map((b) => ({
      uri: b.measure?.value || '',
      label: b.label?.value || 'Unknown',
      unit: b.unit?.value || undefined,
    }));

    return {
      uri: cubeUri,
      label: info?.label?.value || cubeUri,
      description: info?.description?.value,
      publisher: info?.publisher?.value,
      dimensions,
      measures,
    };
  } catch (error) {
    console.error('Failed to get cube metadata:', error);
    return null;
  }
}

/**
 * Fetch data from a cube
 */
export async function fetchCubeData(
  cubeUri: string,
  dimensions: CubeDimension[],
  measures: CubeMeasure[],
  limit: number = 10000
): Promise<{ data: DataRow[]; columns: string[] }> {
  const selectVars: string[] = [];
  const patterns: string[] = [];

  // Observation pattern
  patterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

  // Add dimensions
  dimensions.forEach((dim) => {
    const varName = uriToVarName(dim.uri);
    const rawVar = `${varName}_raw`;
    const labelVar = `${varName}_label`;

    selectVars.push(`?${varName}`);
    patterns.push(`OPTIONAL { ?obs <${dim.uri}> ?${rawVar} . }`);
    patterns.push(`OPTIONAL { ?${rawVar} schema:name ?${labelVar} . FILTER(LANG(?${labelVar}) = "en" || LANG(?${labelVar}) = "de" || LANG(?${labelVar}) = "") }`);
    patterns.push(`BIND(COALESCE(?${labelVar}, STR(?${rawVar})) AS ?${varName})`);
  });

  // Add measures
  measures.forEach((measure) => {
    const varName = uriToVarName(measure.uri);
    selectVars.push(`?${varName}`);
    patterns.push(`OPTIONAL { ?obs <${measure.uri}> ?${varName} . }`);
  });

  const query = `${PREFIXES}
SELECT ${selectVars.join(' ')} WHERE {
  ${patterns.join('\n  ')}
}
LIMIT ${limit}`;

  try {
    const result = await executeSparql(query);

    const columns = result.head.vars;
    const data: DataRow[] = result.results.bindings.map((binding) => {
      const row: DataRow = {};
      for (const varName of columns) {
        const value = binding[varName]?.value;
        const datatype = binding[varName]?.datatype;

        if (value === undefined) {
          row[varName] = null;
        } else if (
          datatype?.includes('integer') ||
          datatype?.includes('decimal') ||
          datatype?.includes('float') ||
          datatype?.includes('double')
        ) {
          row[varName] = Number(value);
        } else {
          row[varName] = value;
        }
      }
      return row;
    });

    return { data, columns };
  } catch (error) {
    console.error('Failed to fetch cube data:', error);
    return { data: [], columns: [] };
  }
}

/**
 * Convert URI to variable name
 */
function uriToVarName(uri: string): string {
  const parts = uri.split(/[/#]/);
  const name = parts[parts.length - 1] || 'var';
  return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

/**
 * Get column label from dimension/measure
 */
export function getColumnLabel(
  columnName: string,
  dimensions: CubeDimension[],
  measures: CubeMeasure[]
): string {
  // Find matching dimension
  const dim = dimensions.find((d) => uriToVarName(d.uri) === columnName);
  if (dim) {
    return dim.label;
  }

  // Find matching measure
  const measure = measures.find((m) => uriToVarName(m.uri) === columnName);
  if (measure) {
    return measure.unit ? `${measure.label} (${measure.unit})` : measure.label;
  }

  return columnName;
}
