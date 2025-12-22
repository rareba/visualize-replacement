import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  MutableDataFrame,
  FieldType,
  MetricFindValue,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import {
  LindasQuery,
  LindasDataSourceOptions,
  CubeInfo,
  CubeMetadata,
  SparqlResult,
  DEFAULT_QUERY,
} from './types';

// LINDAS SPARQL endpoint - use cached version for better performance
const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

// Standard SPARQL prefixes (based on visualize-tool)
const PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX cube: <https://cube.link/>
PREFIX cubeMeta: <https://cube.link/meta/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX time: <http://www.w3.org/2006/time#>
`;

/**
 * LINDAS Datasource
 *
 * Provides access to Swiss Linked Data without exposing SPARQL to users.
 * Users simply select a dataset from a dropdown, and the datasource
 * handles all query generation internally.
 *
 * SPARQL queries based on visualize.admin.ch patterns.
 */
export class LindasDataSource extends DataSourceApi<LindasQuery, LindasDataSourceOptions> {
  private endpoint: string;

  // Cache for cube list and metadata
  private cubesCache: CubeInfo[] | null = null;
  private cubesCacheTime: number = 0;
  private metadataCache: Map<string, CubeMetadata> = new Map();
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
      const query = `${PREFIXES} SELECT ?cube WHERE { ?cube a cube:Cube } LIMIT 1`;
      const result = await this.executeSparql(query);
      if (result.results.bindings.length > 0) {
        return {
          status: 'success',
          message: 'Successfully connected to LINDAS',
        };
      }
      return {
        status: 'error',
        message: 'Connected but no cubes found',
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
    try {
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
    } catch (error: any) {
      console.error('SPARQL query failed:', error);
      console.error('Query was:', query);
      throw error;
    }
  }

  /**
   * Get list of available cubes (for dropdown in query editor)
   * Query pattern based on visualize-tool's searchCubes
   */
  async getCubes(): Promise<CubeInfo[]> {
    // Return cached if fresh
    if (this.cubesCache && Date.now() - this.cubesCacheTime < this.CACHE_TTL) {
      return this.cubesCache;
    }

    // Query based on visualize-tool pattern - get published cubes
    const query = `${PREFIXES}
SELECT DISTINCT ?cube ?title ?description ?publisher ?datePublished WHERE {
  ?cube a cube:Cube .

  # Get title (with language fallback)
  OPTIONAL {
    ?cube schema:name ?titleDe .
    FILTER(LANG(?titleDe) = "de")
  }
  OPTIONAL {
    ?cube schema:name ?titleEn .
    FILTER(LANG(?titleEn) = "en")
  }
  OPTIONAL {
    ?cube schema:name ?titleAny .
    FILTER(LANG(?titleAny) = "")
  }
  BIND(COALESCE(?titleDe, ?titleEn, ?titleAny, STR(?cube)) AS ?title)

  # Get description
  OPTIONAL {
    ?cube schema:description ?descDe .
    FILTER(LANG(?descDe) = "de")
  }
  OPTIONAL {
    ?cube schema:description ?descEn .
    FILTER(LANG(?descEn) = "en")
  }
  BIND(COALESCE(?descDe, ?descEn, "") AS ?description)

  # Get publisher/creator
  OPTIONAL {
    ?cube dcterms:creator ?creatorIri .
    ?creatorIri schema:name ?publisherName .
    FILTER(LANG(?publisherName) = "de" || LANG(?publisherName) = "en" || LANG(?publisherName) = "")
  }
  BIND(COALESCE(?publisherName, "") AS ?publisher)

  # Get date published
  OPTIONAL { ?cube schema:datePublished ?datePublished }

  # Filter: must have observations (not empty cubes)
  FILTER EXISTS { ?cube cube:observationSet/cube:observation ?obs }
}
ORDER BY DESC(?datePublished) ?title
LIMIT 500`;

    try {
      console.log('Fetching cubes from LINDAS...');
      const result = await this.executeSparql(query);
      console.log('Got cubes result:', result.results.bindings.length, 'cubes');

      this.cubesCache = result.results.bindings.map((binding) => ({
        uri: binding.cube?.value || '',
        label: binding.title?.value || 'Unknown',
        description: binding.description?.value,
        publisher: binding.publisher?.value,
        datePublished: binding.datePublished?.value,
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
   * Query pattern based on visualize-tool's getCubeComponents
   */
  async getCubeMetadata(cubeUri: string): Promise<CubeMetadata | null> {
    // Check cache
    if (this.metadataCache.has(cubeUri)) {
      return this.metadataCache.get(cubeUri)!;
    }

    // Query for cube structure - dimensions and measures
    // Based on visualize-tool's pattern using sh:property
    const structureQuery = `${PREFIXES}
SELECT DISTINCT
  ?dimension
  ?label
  ?dataKind
  ?scaleType
  ?unit
  ?order
WHERE {
  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  # Skip rdf:type and cube:observedBy
  FILTER(?dimension != rdf:type && ?dimension != cube:observedBy)

  # Get label
  OPTIONAL {
    ?prop schema:name ?labelDe .
    FILTER(LANG(?labelDe) = "de")
  }
  OPTIONAL {
    ?prop schema:name ?labelEn .
    FILTER(LANG(?labelEn) = "en")
  }
  OPTIONAL {
    ?prop rdfs:label ?labelRdfs .
  }
  BIND(COALESCE(?labelDe, ?labelEn, ?labelRdfs, STRAFTER(STR(?dimension), "#"), REPLACE(STR(?dimension), "^.*/", "")) AS ?label)

  # Get data kind (for temporal detection)
  OPTIONAL {
    ?prop cubeMeta:dataKind/a ?dataKindType .
    BIND(STRAFTER(STR(?dataKindType), "cube.link/") AS ?dataKind)
  }

  # Get scale type
  OPTIONAL {
    ?prop qudt:scaleType ?scaleTypeIri .
    BIND(STRAFTER(STR(?scaleTypeIri), "qudt.org/vocab/scales/") AS ?scaleType)
  }

  # Get unit (indicates this is a measure)
  OPTIONAL { ?prop qudt:unit ?unitIri . BIND(STR(?unitIri) AS ?unit) }
  OPTIONAL { ?prop qudt:hasUnit ?hasUnitIri . BIND(STR(?hasUnitIri) AS ?unit) }
  OPTIONAL { ?prop schema:unitCode ?unitCode . BIND(?unitCode AS ?unit) }

  # Get order
  OPTIONAL { ?prop sh:order ?order }
}
ORDER BY ?order ?label`;

    try {
      console.log('Fetching metadata for cube:', cubeUri);
      const result = await this.executeSparql(structureQuery);
      console.log('Got structure result:', result.results.bindings.length, 'properties');

      // Separate dimensions and measures
      const dimensions: Array<{ uri: string; label: string; scaleType?: string; dataKind?: string }> = [];
      const measures: Array<{ uri: string; label: string; unit?: string }> = [];

      for (const binding of result.results.bindings) {
        const uri = binding.dimension?.value || '';
        const label = binding.label?.value || uri;
        const unit = binding.unit?.value;
        const scaleType = binding.scaleType?.value;
        const dataKind = binding.dataKind?.value;

        // If it has a unit, it's a measure
        if (unit) {
          measures.push({ uri, label, unit });
        } else {
          dimensions.push({ uri, label, scaleType, dataKind });
        }
      }

      // Get cube info from cache
      const cubes = await this.getCubes();
      const cubeInfo = cubes.find((c) => c.uri === cubeUri);

      const metadata: CubeMetadata = {
        uri: cubeUri,
        label: cubeInfo?.label || cubeUri,
        description: cubeInfo?.description,
        publisher: cubeInfo?.publisher,
        dimensions,
        measures,
      };

      this.metadataCache.set(cubeUri, metadata);
      return metadata;
    } catch (error) {
      console.error('Failed to fetch cube metadata:', error);
      return null;
    }
  }

  /**
   * Build SPARQL query to fetch observation data
   * Based on visualize-tool's getCubeObservations pattern
   */
  private buildDataQuery(cubeUri: string, metadata: CubeMetadata, limit: number): string {
    const selectVars: string[] = [];
    const patterns: string[] = [];

    // Main observation pattern
    patterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

    // Add all dimensions
    metadata.dimensions.forEach((dim, index) => {
      const varName = this.uriToVarName(dim.uri, `dim${index}`);
      const rawVar = `${varName}_raw`;
      const labelVar = `${varName}_label`;

      selectVars.push(`?${varName}`);

      // Get the raw value
      patterns.push(`OPTIONAL { ?obs <${dim.uri}> ?${rawVar} . }`);

      // Try to get a label for the value (for named things like cantons, categories)
      patterns.push(`OPTIONAL {`);
      patterns.push(`  ?${rawVar} schema:name ?${labelVar}_de .`);
      patterns.push(`  FILTER(LANG(?${labelVar}_de) = "de")`);
      patterns.push(`}`);
      patterns.push(`OPTIONAL {`);
      patterns.push(`  ?${rawVar} schema:name ?${labelVar}_en .`);
      patterns.push(`  FILTER(LANG(?${labelVar}_en) = "en")`);
      patterns.push(`}`);
      patterns.push(`OPTIONAL {`);
      patterns.push(`  ?${rawVar} schema:name ?${labelVar}_any .`);
      patterns.push(`  FILTER(LANG(?${labelVar}_any) = "")`);
      patterns.push(`}`);
      patterns.push(`BIND(COALESCE(?${labelVar}_de, ?${labelVar}_en, ?${labelVar}_any, STR(?${rawVar})) AS ?${varName})`);
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
    // Clean up the name to be a valid SPARQL variable
    return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^[0-9]/, '_$&').toLowerCase();
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

          if (metadata.dimensions.length === 0 && metadata.measures.length === 0) {
            throw new Error(`Cube has no dimensions or measures: ${query.cubeUri}`);
          }

          // Build and execute the data query
          const sparqlQuery = this.buildDataQuery(query.cubeUri, metadata, query.limit || 10000);
          console.log('Executing data query for:', query.cubeUri);
          const result = await this.executeSparql(sparqlQuery);
          console.log('Got data result:', result.results.bindings.length, 'rows');

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
      console.log('No data returned from query');
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
        labelMap[varName] = measure.unit ? `${measure.label} (${measure.unit})` : measure.label;
      }
    });

    // Determine field types from data
    const vars = result.head.vars;
    const typeMap: Record<string, FieldType> = {};

    for (const varName of vars) {
      let isNumeric = true;
      let isTime = false;
      let hasValue = false;

      // Sample rows to determine type
      for (let i = 0; i < Math.min(20, result.results.bindings.length); i++) {
        const binding = result.results.bindings[i];
        const value = binding[varName];

        if (value && value.value) {
          hasValue = true;
          const datatype = value.datatype || '';

          if (datatype.includes('integer') || datatype.includes('decimal') ||
              datatype.includes('float') || datatype.includes('double')) {
            // Explicitly numeric
          } else if (datatype.includes('date') || datatype.includes('dateTime') ||
                     datatype.includes('gYear')) {
            isTime = true;
            isNumeric = false;
          } else if (isNaN(Number(value.value))) {
            isNumeric = false;
          }
        }
      }

      if (!hasValue) {
        typeMap[varName] = FieldType.string;
      } else if (isTime) {
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
          // Handle various date formats
          if (/^\d{4}$/.test(value)) {
            // Year only (gYear)
            row.push(new Date(parseInt(value, 10), 0, 1).getTime());
          } else {
            row.push(new Date(value).getTime());
          }
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
    const cubes = await this.getCubes();
    return cubes.map((cube) => ({
      text: cube.label,
      value: cube.uri,
    }));
  }
}
