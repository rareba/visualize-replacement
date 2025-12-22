import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  MutableDataFrame,
  FieldType,
  MetricFindValue,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

import {
  LindasQuery,
  LindasDataSourceOptions,
  CubeInfo,
  CubeMetadata,
  SparqlResult,
  DEFAULT_QUERY,
} from './types';

// LINDAS SPARQL endpoint - fixed, not configurable by users
const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

// Standard SPARQL prefixes
const PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
`;

/**
 * LINDAS Datasource
 *
 * Provides access to Swiss Linked Data without exposing SPARQL to users.
 * Users simply select a dataset from a dropdown, and the datasource
 * handles all query generation internally.
 */
export class LindasDataSource extends DataSourceApi<LindasQuery, LindasDataSourceOptions> {
  private endpoint: string;

  // Cache for cube list and metadata
  private cubesCache: CubeInfo[] | null = null;
  private cubesCacheTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(instanceSettings: DataSourceInstanceSettings<LindasDataSourceOptions>) {
    super(instanceSettings);
    this.endpoint = instanceSettings.jsonData?.endpoint || LINDAS_ENDPOINT;
  }

  /**
   * Test datasource connection
   */
  async testDatasource(): Promise<{ status: string; message: string }> {
    try {
      // Simple query to verify endpoint is reachable
      const query = `${PREFIXES} SELECT ?cube WHERE { ?cube a cube:Cube } LIMIT 1`;
      await this.executeSparql(query);
      return {
        status: 'success',
        message: 'Successfully connected to LINDAS',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to connect to LINDAS: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Execute SPARQL query against LINDAS
   */
  private async executeSparql(query: string): Promise<SparqlResult> {
    const response = await getBackendSrv().post(
      this.endpoint,
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
   * Get list of available cubes (for dropdown in query editor)
   */
  async getCubes(): Promise<CubeInfo[]> {
    // Return cached if fresh
    if (this.cubesCache && Date.now() - this.cubesCacheTime < this.CACHE_TTL) {
      return this.cubesCache;
    }

    const query = `${PREFIXES}
SELECT DISTINCT ?cube ?label ?description ?publisher WHERE {
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

  BIND(COALESCE(?labelRaw, STR(?cube)) AS ?label)
  BIND(COALESCE(?descRaw, "") AS ?description)
  BIND(COALESCE(?publisherName, "") AS ?publisher)
}
ORDER BY ?label
LIMIT 500`;

    try {
      const result = await this.executeSparql(query);
      this.cubesCache = result.results.bindings.map((binding) => ({
        uri: binding.cube?.value || '',
        label: binding.label?.value || 'Unknown',
        description: binding.description?.value,
        publisher: binding.publisher?.value,
      }));
      this.cubesCacheTime = Date.now();
      return this.cubesCache;
    } catch (error) {
      console.error('Failed to fetch cubes:', error);
      return [];
    }
  }

  /**
   * Get metadata for a specific cube (dimensions and measures)
   */
  async getCubeMetadata(cubeUri: string): Promise<CubeMetadata | null> {
    // Get dimensions
    const dimensionsQuery = `${PREFIXES}
SELECT DISTINCT ?dimension ?label ?scaleType WHERE {
  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  # Exclude measures (properties with units)
  FILTER NOT EXISTS { ?prop qudt:unit ?unit }
  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }

  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }
  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }
  OPTIONAL { ?prop <https://cube.link/meta/scaleType> ?scaleType }

  BIND(COALESCE(?propLabel, ?rdfsLabel, STR(?dimension)) AS ?label)
}
ORDER BY ?label`;

    // Get measures
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

  BIND(COALESCE(?propLabel, ?rdfsLabel, STR(?measure)) AS ?label)
  BIND(COALESCE(?unitLabel, ?unitCode, STR(?unitUri)) AS ?unit)
}
ORDER BY ?label`;

    try {
      const [dimensionsResult, measuresResult] = await Promise.all([
        this.executeSparql(dimensionsQuery),
        this.executeSparql(measuresQuery),
      ]);

      // Find cube info from cache
      const cubes = await this.getCubes();
      const cubeInfo = cubes.find((c) => c.uri === cubeUri);

      return {
        uri: cubeUri,
        label: cubeInfo?.label || cubeUri,
        description: cubeInfo?.description,
        publisher: cubeInfo?.publisher,
        dimensions: dimensionsResult.results.bindings.map((b) => ({
          uri: b.dimension?.value || '',
          label: b.label?.value || 'Unknown',
          scaleType: b.scaleType?.value,
        })),
        measures: measuresResult.results.bindings.map((b) => ({
          uri: b.measure?.value || '',
          label: b.label?.value || 'Unknown',
          unit: b.unit?.value,
        })),
      };
    } catch (error) {
      console.error('Failed to fetch cube metadata:', error);
      return null;
    }
  }

  /**
   * Build SPARQL query to fetch all data for a cube
   * This is the key method - generates SPARQL internally, hidden from users
   */
  private buildDataQuery(cubeUri: string, metadata: CubeMetadata, limit: number): string {
    const selectVars: string[] = [];
    const patterns: string[] = [];

    // Observation pattern
    patterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

    // Add all dimensions
    metadata.dimensions.forEach((dim, index) => {
      const varName = this.uriToVarName(dim.uri, `dim${index}`);
      const rawVar = `${varName}_raw`;
      const labelVar = `${varName}_label`;

      selectVars.push(`?${varName}`);
      patterns.push(`OPTIONAL { ?obs <${dim.uri}> ?${rawVar} . }`);
      patterns.push(`OPTIONAL { ?${rawVar} schema:name ?${labelVar} . FILTER(LANG(?${labelVar}) = "en" || LANG(?${labelVar}) = "de" || LANG(?${labelVar}) = "") }`);
      patterns.push(`BIND(COALESCE(?${labelVar}, STR(?${rawVar})) AS ?${varName})`);
    });

    // Add all measures
    metadata.measures.forEach((measure, index) => {
      const varName = this.uriToVarName(measure.uri, `measure${index}`);
      selectVars.push(`?${varName}`);
      patterns.push(`OPTIONAL { ?obs <${measure.uri}> ?${varName} . }`);
    });

    return `${PREFIXES}
SELECT ${selectVars.join(' ')} WHERE {
  ${patterns.join('\n  ')}
}
LIMIT ${limit}`;
  }

  /**
   * Convert URI to a valid SPARQL variable name
   */
  private uriToVarName(uri: string, fallback: string): string {
    const parts = uri.split(/[/#]/);
    const name = parts[parts.length - 1] || fallback;
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Main query method - called when Grafana needs data
   */
  async query(request: DataQueryRequest<LindasQuery>): Promise<DataQueryResponse> {
    const promises = request.targets
      .filter((target) => !target.hide && target.cubeUri)
      .map(async (target) => {
        const query = { ...DEFAULT_QUERY, ...target };

        if (!query.cubeUri) {
          return new MutableDataFrame({
            refId: target.refId,
            fields: [],
          });
        }

        try {
          // Get cube metadata (dimensions and measures)
          const metadata = await this.getCubeMetadata(query.cubeUri);
          if (!metadata) {
            throw new Error(`Could not load metadata for cube: ${query.cubeUri}`);
          }

          // Build and execute the data query
          const sparqlQuery = this.buildDataQuery(query.cubeUri, metadata, query.limit || 10000);
          const result = await this.executeSparql(sparqlQuery);

          // Convert to DataFrame
          return this.toDataFrame(result, target.refId, metadata);
        } catch (error: any) {
          console.error('Query failed:', error);
          throw error;
        }
      });

    const data = await Promise.all(promises);
    return { data };
  }

  /**
   * Convert SPARQL result to Grafana DataFrame
   */
  private toDataFrame(result: SparqlResult, refId: string, metadata: CubeMetadata): MutableDataFrame {
    const frame = new MutableDataFrame({
      refId,
      fields: [],
    });

    if (!result.results.bindings.length) {
      return frame;
    }

    // Create a map from variable name to display label
    const labelMap: Record<string, string> = {};
    metadata.dimensions.forEach((dim) => {
      const varName = this.uriToVarName(dim.uri, '');
      if (varName) {
        labelMap[varName] = dim.label;
      }
    });
    metadata.measures.forEach((measure) => {
      const varName = this.uriToVarName(measure.uri, '');
      if (varName) {
        labelMap[varName] = measure.label;
      }
    });

    // Determine field types from first few rows
    const vars = result.head.vars;
    const typeMap: Record<string, FieldType> = {};

    for (const varName of vars) {
      // Sample first 10 rows to determine type
      let isNumeric = true;
      let isTime = false;

      for (let i = 0; i < Math.min(10, result.results.bindings.length); i++) {
        const binding = result.results.bindings[i];
        const value = binding[varName];

        if (value) {
          // Check if it's a number
          if (value.datatype?.includes('integer') || value.datatype?.includes('decimal') || value.datatype?.includes('float') || value.datatype?.includes('double')) {
            isNumeric = true;
          } else if (value.datatype?.includes('date') || value.datatype?.includes('dateTime')) {
            isTime = true;
            isNumeric = false;
          } else if (isNaN(Number(value.value))) {
            isNumeric = false;
          }
        }
      }

      if (isTime) {
        typeMap[varName] = FieldType.time;
      } else if (isNumeric) {
        typeMap[varName] = FieldType.number;
      } else {
        typeMap[varName] = FieldType.string;
      }
    }

    // Create fields with proper labels
    for (const varName of vars) {
      frame.addField({
        name: varName,
        type: typeMap[varName] || FieldType.string,
        config: {
          displayName: labelMap[varName] || varName,
        },
      });
    }

    // Add data rows
    for (const binding of result.results.bindings) {
      const row: any[] = [];
      for (const varName of vars) {
        const value = binding[varName]?.value;
        const fieldType = typeMap[varName];

        if (value === undefined || value === null) {
          row.push(null);
        } else if (fieldType === FieldType.number) {
          row.push(Number(value));
        } else if (fieldType === FieldType.time) {
          row.push(new Date(value).getTime());
        } else {
          row.push(value);
        }
      }
      frame.appendRow(row);
    }

    return frame;
  }

  /**
   * For variable support in dashboards
   */
  async metricFindQuery(query: string, options?: any): Promise<MetricFindValue[]> {
    // Return list of cubes for variable dropdown
    const cubes = await this.getCubes();
    return cubes.map((cube) => ({
      text: cube.label,
      value: cube.uri,
    }));
  }
}
