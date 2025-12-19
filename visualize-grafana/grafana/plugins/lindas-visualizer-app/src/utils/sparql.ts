// SPARQL utilities using Grafana's backend proxy

import { getBackendSrv } from '@grafana/runtime';

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

import { DataFrame, FieldType, MutableDataFrame } from '@grafana/data';

export interface Dimension {
  iri: string;
  label: string;
  order?: number;
  dataType?: string;
  scaleType?: 'nominal' | 'ordinal' | 'temporal' | 'numerical';
  isTemporal?: boolean;
  isNumerical?: boolean;
}

export interface Measure {
  iri: string;
  label: string;
  unit?: string;
  dataType?: string;
}

export interface CubeMetadata {
  iri: string;
  label: string;
  description?: string;
  dimensions: Dimension[];
  measures: Measure[];
  publisher?: string;
  dateModified?: string;
}

export interface CubeSearchResult {
  iri: string;
  label: string;
  description?: string;
  publisher?: string;
  dateModified?: string;
}

// Use Grafana's backend proxy to avoid CORS issues
async function executeSparql(query: string): Promise<any> {
  try {
    // Use datasource proxy if available, otherwise direct fetch through backend
    const response = await getBackendSrv().fetch({
      url: `/api/datasources/proxy/uid/lindas-datasource`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
      },
      data: query,
    }).toPromise();

    return response?.data;
  } catch (proxyError) {
    // Fallback to direct fetch if proxy fails
    console.log('Proxy failed, trying direct fetch:', proxyError);
    try {
      const response = await fetch(LINDAS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/sparql-results+json',
        },
        body: query,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }

      return response.json();
    } catch (fetchError) {
      throw new Error(`SPARQL request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }
  }
}

// Search for cubes by keyword
export async function searchCubes(keyword: string = '', limit: number = 50): Promise<CubeSearchResult[]> {
  const searchFilter = keyword
    ? `FILTER(CONTAINS(LCASE(?label), LCASE("${keyword}")) || CONTAINS(LCASE(?description), LCASE("${keyword}")))`
    : '';

  const query = `
PREFIX schema: <http://schema.org/>
PREFIX cube: <https://cube.link/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>

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
LIMIT ${limit}
  `.trim();

  try {
    const result = await executeSparql(query);
    const bindings = result?.results?.bindings || [];

    return bindings.map((b: any) => ({
      iri: b.cube?.value,
      label: b.label?.value || b.cube?.value?.split('/').pop() || 'Unnamed',
      description: b.description?.value,
      publisher: b.publisher?.value,
      dateModified: b.dateModified?.value,
    }));
  } catch (error) {
    console.error('Failed to search cubes:', error);
    return [];
  }
}

export async function fetchCubeMetadata(cubeIri: string): Promise<CubeMetadata> {
  // Query for cube label and metadata
  const metadataQuery = `
PREFIX schema: <http://schema.org/>
PREFIX cube: <https://cube.link/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?label ?description ?publisher ?dateModified WHERE {
  <${cubeIri}> a cube:Cube .
  OPTIONAL { <${cubeIri}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "") }
  OPTIONAL { <${cubeIri}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "de" || LANG(?description) = "") }
  OPTIONAL { <${cubeIri}> schema:creator/schema:name ?publisher . FILTER(LANG(?publisher) = "en" || LANG(?publisher) = "de" || LANG(?publisher) = "") }
  OPTIONAL { <${cubeIri}> schema:dateModified ?dateModified }
} LIMIT 1
  `.trim();

  // Query for dimensions with data types
  const dimensionsQuery = `
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX cube: <https://cube.link/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX meta: <https://cube.link/meta/>

SELECT DISTINCT ?dimension ?label ?order ?datatype ?scaleType WHERE {
  <${cubeIri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

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
ORDER BY ?order ?label
  `.trim();

  // Query for measures with units
  const measuresQuery = `
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX cube: <https://cube.link/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>

SELECT DISTINCT ?measure ?label ?unit ?datatype WHERE {
  <${cubeIri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?measure .

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
ORDER BY ?label
  `.trim();

  // Execute queries
  const [metadataResult, dimensionsResult, measuresResult] = await Promise.all([
    executeSparql(metadataQuery),
    executeSparql(dimensionsQuery),
    executeSparql(measuresQuery),
  ]);

  // Parse metadata
  const metadataBindings = metadataResult?.results?.bindings || [];
  const label = metadataBindings[0]?.label?.value || cubeIri.split('/').pop() || 'Unnamed Cube';
  const description = metadataBindings[0]?.description?.value;
  const publisher = metadataBindings[0]?.publisher?.value;
  const dateModified = metadataBindings[0]?.dateModified?.value;

  // Helper to detect temporal data types
  const isTemporalDatatype = (datatype?: string): boolean => {
    if (!datatype) return false;
    const temporalTypes = ['date', 'dateTime', 'gYear', 'gYearMonth', 'time'];
    return temporalTypes.some(t => datatype.toLowerCase().includes(t.toLowerCase()));
  };

  // Helper to detect numerical data types
  const isNumericalDatatype = (datatype?: string): boolean => {
    if (!datatype) return false;
    const numTypes = ['decimal', 'integer', 'float', 'double', 'int', 'long', 'short'];
    return numTypes.some(t => datatype.toLowerCase().includes(t.toLowerCase()));
  };

  // Parse dimensions - deduplicate and detect types
  const dimensionMap = new Map<string, Dimension>();
  (dimensionsResult?.results?.bindings || []).forEach((b: any) => {
    const iri = b.dimension?.value;
    if (iri && !dimensionMap.has(iri)) {
      const dataType = b.datatype?.value;
      const scaleTypeRaw = b.scaleType?.value;
      const isTemporal = isTemporalDatatype(dataType);
      const isNumerical = isNumericalDatatype(dataType);

      let scaleType: Dimension['scaleType'] = 'nominal';
      if (isTemporal) {
        scaleType = 'temporal';
      } else if (isNumerical) {
        scaleType = 'numerical';
      } else if (scaleTypeRaw?.includes('Ordinal')) {
        scaleType = 'ordinal';
      }

      dimensionMap.set(iri, {
        iri,
        label: b.label?.value || iri.split('/').pop() || iri,
        order: b.order?.value ? parseInt(b.order.value, 10) : undefined,
        dataType,
        scaleType,
        isTemporal,
        isNumerical,
      });
    }
  });

  // Parse measures - deduplicate
  const measureMap = new Map<string, Measure>();
  (measuresResult?.results?.bindings || []).forEach((b: any) => {
    const iri = b.measure?.value;
    if (iri && !measureMap.has(iri)) {
      measureMap.set(iri, {
        iri,
        label: b.label?.value || iri.split('/').pop() || iri,
        unit: b.unit?.value,
        dataType: b.datatype?.value,
      });
    }
  });

  return {
    iri: cubeIri,
    label,
    description,
    dimensions: Array.from(dimensionMap.values()),
    measures: Array.from(measureMap.values()),
    publisher,
    dateModified,
  };
}

export interface DimensionValue {
  iri: string;
  label: string;
}

export async function fetchDimensionValues(cubeIri: string, dimensionIri: string): Promise<DimensionValue[]> {
  const query = `
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX cube: <https://cube.link/>

SELECT DISTINCT ?value ?displayLabel WHERE {
  <${cubeIri}> <https://cube.link/observationSet>/<https://cube.link/observation> ?obs .
  ?obs <${dimensionIri}> ?value .
  OPTIONAL { ?value schema:name ?schemaLabel . FILTER(LANG(?schemaLabel) = "en" || LANG(?schemaLabel) = "") }
  OPTIONAL { ?value rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }
  BIND(COALESCE(?schemaLabel, ?rdfsLabel, STR(?value)) AS ?displayLabel)
}
ORDER BY ?displayLabel
LIMIT 100
  `.trim();

  const result = await executeSparql(query);
  const bindings = result?.results?.bindings || [];

  return bindings.map((b: any) => ({
    iri: b.value?.value,
    label: b.displayLabel?.value || b.value?.value,
  }));
}

export async function executeSparqlQuery(query: string): Promise<any> {
  return executeSparql(query);
}

// Generate a query that returns data in tabular format for Grafana
// This uses the obs/column/value pattern that can be pivoted by Grafana
export function generateTabularQuery(cubeIri: string, options?: {
  filters?: Record<string, string[]>;
  limit?: number;
}): string {
  const filterClauses: string[] = [];

  if (options?.filters) {
    Object.entries(options.filters).forEach(([dimIri, values]) => {
      if (values && values.length > 0) {
        const filterVals = values.map(v => `<${v}>`).join(', ');
        filterClauses.push(`
  ?obs <${dimIri}> ?filterVal_${Math.random().toString(36).substring(7)} .
  FILTER(?filterVal_${Math.random().toString(36).substring(7)} IN (${filterVals}))`);
      }
    });
  }

  const limit = options?.limit || 10000;

  return `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?obs ?column ?value WHERE {
  <${cubeIri}> cube:observationSet/cube:observation ?obs .
  ?obs ?property ?rawValue .

  FILTER(?property != rdf:type)
  FILTER(?property != cube:observedBy)
  FILTER(?property != <https://cube.link/observedBy>)
  ${filterClauses.join('\n')}

  OPTIONAL {
    ?rawValue schema:name ?label .
    FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "")
  }

  BIND(COALESCE(
    ?label,
    IF(isLiteral(?rawValue), STR(?rawValue), REPLACE(STR(?rawValue), "^.*/", ""))
  ) AS ?value)
  BIND(REPLACE(STR(?property), "^.*/", "") AS ?column)
}
ORDER BY ?obs ?column
LIMIT ${limit}
  `.trim();
}

// Fetch tabular data and pivot it into a proper table structure
export async function fetchTabularData(cubeIri: string, options?: {
  filters?: Record<string, string[]>;
  limit?: number;
}): Promise<{ columns: string[]; rows: Record<string, any>[] }> {
  const query = generateTabularQuery(cubeIri, options);
  const result = await executeSparql(query);
  const bindings = result?.results?.bindings || [];

  // Pivot the obs/column/value format into rows
  const rowMap = new Map<string, Record<string, any>>();
  const columnSet = new Set<string>();

  bindings.forEach((b: any) => {
    const obs = b.obs?.value;
    const column = b.column?.value;
    const value = b.value?.value;

    if (obs && column) {
      columnSet.add(column);
      if (!rowMap.has(obs)) {
        rowMap.set(obs, {});
      }
      rowMap.get(obs)![column] = value;
    }
  });

  const columns = Array.from(columnSet).sort();
  const rows = Array.from(rowMap.values());

  return { columns, rows };
}

export function transformToDataFrame(sparqlResult: any): DataFrame {
  const vars = sparqlResult?.head?.vars || [];
  const bindings = sparqlResult?.results?.bindings || [];

  const frame = new MutableDataFrame({
    fields: vars.map((v: string) => {
      // Guess type based on first binding
      let type = FieldType.string;
      if (bindings.length > 0) {
        const val = bindings[0][v];
        if (val?.datatype?.includes('decimal') || val?.datatype?.includes('integer') || val?.datatype?.includes('float') || val?.datatype?.includes('double')) {
          type = FieldType.number;
        } else if (val?.datatype?.includes('date') || val?.datatype?.includes('dateTime')) {
          type = FieldType.time;
        }
      }
      
      // Override for specific names used in generateSparqlQuery
      if (v === 'y' || v === 'value' || v.startsWith('measure')) {
        type = FieldType.number;
      }
      if (v === 'x' && (bindings[0]?.x?.datatype?.includes('date') || bindings[0]?.x?.datatype?.includes('dateTime'))) {
        type = FieldType.time;
      }

      return {
        name: v,
        type: type,
        config: {
          displayName: v.charAt(0).toUpperCase() + v.slice(1),
        },
      };
    }),
  });

  bindings.forEach((b: any) => {
    const row: any = {};
    vars.forEach((v: string) => {
      const val = b[v]?.value;
      const type = frame.fields.find(f => f.name === v)?.type;
      
      if (type === FieldType.number) {
        row[v] = parseFloat(val);
      } else if (type === FieldType.time) {
        row[v] = new Date(val).getTime();
      } else {
        row[v] = val;
      }
    });
    frame.add(row);
  });

  return frame;
}
