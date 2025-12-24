/**
 * SPARQL Utilities for LINDAS RDF Integration
 *
 * This module handles all SPARQL communication with the LINDAS triplestore
 * and transforms RDF results into Grafana DataFrames.
 *
 * Key features:
 * - Proper RDF datatype to Grafana FieldType mapping
 * - Language-aware label fetching
 * - Efficient query building
 */

import {
  DataFrame,
  FieldType,
  MutableDataFrame,
  Field
} from '@grafana/data';

// ============================================================================
// Types
// ============================================================================

export type Language = 'de' | 'fr' | 'it' | 'en';

export interface SparqlBinding {
  type: 'uri' | 'literal' | 'bnode';
  value: string;
  datatype?: string;
  'xml:lang'?: string;
}

export interface SparqlResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<Record<string, SparqlBinding>>;
  };
}

export interface Dataset {
  uri: string;
  label: string;
  description?: string;
  publisher?: string;
}

export interface CubeDimension {
  uri: string;
  label: string;
  scaleType?: string;
  dataKind?: 'Temporal' | 'GeoShape' | 'GeoCoordinates';
  order?: number;
}

export interface CubeMeasure {
  uri: string;
  label: string;
  unit?: string;
}

export interface CubeMetadata {
  uri: string;
  label: string;
  description?: string;
  dimensions: CubeDimension[];
  measures: CubeMeasure[];
}

export interface ChartConfig {
  cubeUri: string;
  xAxis: string | null;
  yAxis: string | null;
  groupBy: string | null;
  filters: Record<string, string[]>;
  limit: number;
}

// ============================================================================
// Constants
// ============================================================================

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

const PREFIXES = `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
PREFIX cubeMeta: <https://cube.link/meta/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
`;

const LANGUAGE_PRIORITY: Record<Language, Language[]> = {
  de: ['de', 'en', 'fr', 'it'],
  fr: ['fr', 'de', 'en', 'it'],
  it: ['it', 'de', 'fr', 'en'],
  en: ['en', 'de', 'fr', 'it'],
};

// XSD datatype to Grafana FieldType mapping
const XSD_TO_FIELD_TYPE: Record<string, FieldType> = {
  'http://www.w3.org/2001/XMLSchema#integer': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#int': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#long': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#short': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#byte': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#decimal': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#float': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#double': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#nonNegativeInteger': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#positiveInteger': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#negativeInteger': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#nonPositiveInteger': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#unsignedLong': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#unsignedInt': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#unsignedShort': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#unsignedByte': FieldType.number,
  'http://www.w3.org/2001/XMLSchema#dateTime': FieldType.time,
  'http://www.w3.org/2001/XMLSchema#date': FieldType.time,
  'http://www.w3.org/2001/XMLSchema#time': FieldType.time,
  'http://www.w3.org/2001/XMLSchema#gYear': FieldType.time,
  'http://www.w3.org/2001/XMLSchema#gYearMonth': FieldType.time,
  'http://www.w3.org/2001/XMLSchema#boolean': FieldType.boolean,
  'http://www.w3.org/2001/XMLSchema#string': FieldType.string,
};

// ============================================================================
// SPARQL Client
// ============================================================================

/**
 * Execute a SPARQL query against LINDAS
 */
export async function executeSparql(query: string): Promise<SparqlResult> {
  const response = await fetch(LINDAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
    },
    body: `query=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SPARQL query failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.json();
}

// ============================================================================
// DataFrame Transformation
// ============================================================================

/**
 * Detect the Grafana FieldType from an RDF binding
 */
function detectFieldType(binding: SparqlBinding): FieldType {
  if (binding.type === 'uri') {
    return FieldType.string;
  }

  if (binding.datatype) {
    const mappedType = XSD_TO_FIELD_TYPE[binding.datatype];
    if (mappedType) {
      return mappedType;
    }
  }

  // Try to infer from value
  const value = binding.value;

  // Check if it looks like a number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return FieldType.number;
  }

  // Check if it looks like a date/datetime
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
    return FieldType.time;
  }

  // Check for year-only values (common in RDF data)
  if (/^\d{4}$/.test(value)) {
    return FieldType.time;
  }

  return FieldType.string;
}

/**
 * Convert an RDF binding value to the appropriate JavaScript type
 */
function convertValue(binding: SparqlBinding | undefined, fieldType: FieldType): any {
  if (!binding) {
    return null;
  }

  const value = binding.value;

  switch (fieldType) {
    case FieldType.number:
      const num = parseFloat(value);
      return isNaN(num) ? null : num;

    case FieldType.time:
      // Handle year-only values
      if (/^\d{4}$/.test(value)) {
        return new Date(`${value}-01-01T00:00:00Z`).getTime();
      }
      // Handle date values
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00Z`).getTime();
      }
      // Handle full datetime
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.getTime();

    case FieldType.boolean:
      return value === 'true' || value === '1';

    default:
      return value;
  }
}

/**
 * Transform SPARQL results into a Grafana DataFrame
 */
export function sparqlToDataFrame(
  result: SparqlResult,
  options?: {
    name?: string;
    fieldLabels?: Record<string, string>;
  }
): DataFrame {
  const { head, results } = result;
  const bindings = results.bindings;

  if (bindings.length === 0) {
    return new MutableDataFrame({
      name: options?.name || 'SPARQL Result',
      fields: head.vars.map(varName => ({
        name: options?.fieldLabels?.[varName] || varName,
        type: FieldType.string,
        values: [],
      })),
    });
  }

  // Detect field types from first few rows
  const fieldTypes: Record<string, FieldType> = {};
  const sampleSize = Math.min(10, bindings.length);

  for (const varName of head.vars) {
    let detectedType = FieldType.string;

    for (let i = 0; i < sampleSize; i++) {
      const binding = bindings[i][varName];
      if (binding) {
        detectedType = detectFieldType(binding);
        // Prefer number/time over string if detected
        if (detectedType !== FieldType.string) {
          break;
        }
      }
    }

    fieldTypes[varName] = detectedType;
  }

  // Build fields with converted values
  const fields: Field[] = head.vars.map(varName => ({
    name: options?.fieldLabels?.[varName] || varName,
    type: fieldTypes[varName],
    values: bindings.map(binding => convertValue(binding[varName], fieldTypes[varName])),
    config: {},
  }));

  return {
    name: options?.name || 'SPARQL Result',
    length: bindings.length,
    fields,
  };
}

// ============================================================================
// Cube Metadata Queries
// ============================================================================

/**
 * Build a label selection pattern with language fallback
 */
function buildLabelPattern(
  subject: string,
  predicate: string,
  outputVar: string,
  langs: Language[],
  fallback?: string
): string {
  const optionals = langs.map((lang, i) =>
    `OPTIONAL { ${subject} ${predicate} ?${outputVar}_${i} . FILTER(LANG(?${outputVar}_${i}) = "${lang}") }`
  ).join('\n  ');

  const coalesceArgs = langs.map((_, i) => `?${outputVar}_${i}`).join(', ');
  const fallbackExpr = fallback || `STR(${subject})`;

  return `${optionals}
  BIND(COALESCE(${coalesceArgs}, ${fallbackExpr}) AS ?${outputVar})`;
}

/**
 * Fetch list of available cubes (datasets)
 */
export async function fetchDatasets(lang: Language, searchTerm?: string): Promise<Dataset[]> {
  const langs = LANGUAGE_PRIORITY[lang];

  const query = `${PREFIXES}
SELECT DISTINCT ?cube ?label ?description ?publisher WHERE {
  ?cube a cube:Cube .

  # Only cubes marked for visualize application
  ?cube schema:workExample <https://ld.admin.ch/application/visualize> .

  # Only published cubes
  ?cube schema:creativeWorkStatus <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .

  # Must have observation constraint
  ?cube cube:observationConstraint ?shape .

  # Exclude expired
  FILTER NOT EXISTS { ?cube schema:expires ?expires }

  # Label with language fallback
  ${buildLabelPattern('?cube', 'schema:name', 'label', langs)}

  # Description with language fallback
  OPTIONAL {
    ${buildLabelPattern('?cube', 'schema:description', 'description', langs, '""')}
  }

  # Publisher with language fallback
  OPTIONAL {
    ?cube dcterms:creator ?creatorIri .
    ${buildLabelPattern('?creatorIri', 'schema:name', 'publisher', langs, '""')}
  }
}
ORDER BY ?label`;

  const result = await executeSparql(query);

  let datasets = result.results.bindings.map(binding => ({
    uri: binding.cube?.value || '',
    label: binding.label?.value || 'Unknown',
    description: binding.description?.value || undefined,
    publisher: binding.publisher?.value || undefined,
  }));

  // Client-side filtering (SPARQL FILTER can be slow)
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    datasets = datasets.filter(d =>
      d.label.toLowerCase().includes(term) ||
      d.description?.toLowerCase().includes(term) ||
      d.publisher?.toLowerCase().includes(term)
    );
  }

  return datasets;
}

/**
 * Fetch metadata for a specific cube (dimensions and measures)
 */
export async function fetchCubeMetadata(cubeUri: string, lang: Language): Promise<CubeMetadata> {
  const langs = LANGUAGE_PRIORITY[lang];

  // Query for cube label and structure
  const query = `${PREFIXES}
SELECT DISTINCT
  ?cubeLabel
  ?dimension
  ?dimLabel
  ?unit
  ?dataKind
  ?scaleType
  ?order
WHERE {
  <${cubeUri}> schema:name ?cubeLabelRaw .
  FILTER(LANG(?cubeLabelRaw) = "${langs[0]}" || LANG(?cubeLabelRaw) = "${langs[1]}" || LANG(?cubeLabelRaw) = "")
  BIND(STR(?cubeLabelRaw) AS ?cubeLabel)

  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  # Exclude internal properties
  FILTER(?dimension != rdf:type && ?dimension != cube:observedBy)

  # Dimension label
  OPTIONAL { ?prop schema:name ?dimLabel0 . FILTER(LANG(?dimLabel0) = "${langs[0]}") }
  OPTIONAL { ?prop schema:name ?dimLabel1 . FILTER(LANG(?dimLabel1) = "${langs[1]}") }
  OPTIONAL { ?prop schema:name ?dimLabel2 . FILTER(LANG(?dimLabel2) = "${langs[2]}") }
  OPTIONAL { ?prop rdfs:label ?dimLabelRdfs }
  BIND(COALESCE(?dimLabel0, ?dimLabel1, ?dimLabel2, ?dimLabelRdfs,
    STRAFTER(STR(?dimension), "#"),
    REPLACE(STR(?dimension), "^.*/", "")) AS ?dimLabel)

  # Unit (indicates a measure)
  OPTIONAL { ?prop qudt:unit ?unitIri . BIND(STRAFTER(STR(?unitIri), "unit/") AS ?unit) }
  OPTIONAL { ?prop qudt:hasUnit ?hasUnitIri . BIND(STRAFTER(STR(?hasUnitIri), "unit/") AS ?unit) }
  OPTIONAL { ?prop schema:unitCode ?unitCode . BIND(?unitCode AS ?unit) }

  # Data kind (Temporal, GeoShape, etc.)
  OPTIONAL {
    ?prop cubeMeta:dataKind/a ?dataKindType .
    BIND(STRAFTER(STR(?dataKindType), "cube.link/") AS ?dataKind)
  }

  # Scale type
  OPTIONAL {
    ?prop qudt:scaleType ?scaleTypeIri .
    BIND(STRAFTER(STR(?scaleTypeIri), "scales/") AS ?scaleType)
  }

  # Order
  OPTIONAL { ?prop sh:order ?order }
}
ORDER BY ?order ?dimLabel`;

  const result = await executeSparql(query);

  if (result.results.bindings.length === 0) {
    throw new Error(`Cube not found or has no properties: ${cubeUri}`);
  }

  const cubeLabel = result.results.bindings[0]?.cubeLabel?.value || cubeUri;

  const dimensions: CubeDimension[] = [];
  const measures: CubeMeasure[] = [];
  const seen = new Set<string>();

  for (const binding of result.results.bindings) {
    const uri = binding.dimension?.value;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);

    const label = binding.dimLabel?.value || uri.split(/[/#]/).pop() || uri;
    const unit = binding.unit?.value;
    const dataKind = binding.dataKind?.value as CubeDimension['dataKind'];
    const scaleType = binding.scaleType?.value;
    const order = binding.order?.value ? parseInt(binding.order.value, 10) : undefined;

    if (unit) {
      measures.push({ uri, label, unit });
    } else {
      dimensions.push({ uri, label, dataKind, scaleType, order });
    }
  }

  return {
    uri: cubeUri,
    label: cubeLabel,
    dimensions,
    measures,
  };
}

/**
 * Fetch distinct values for a dimension (for filters)
 */
export async function fetchDimensionValues(
  cubeUri: string,
  dimensionUri: string,
  lang: Language,
  limit = 100
): Promise<Array<{ value: string; label: string }>> {
  const langs = LANGUAGE_PRIORITY[lang];

  const query = `${PREFIXES}
SELECT DISTINCT ?value ?label WHERE {
  <${cubeUri}> cube:observationSet/cube:observation ?obs .
  ?obs <${dimensionUri}> ?value .

  # Try to get label
  OPTIONAL { ?value schema:name ?label0 . FILTER(LANG(?label0) = "${langs[0]}") }
  OPTIONAL { ?value schema:name ?label1 . FILTER(LANG(?label1) = "${langs[1]}") }
  OPTIONAL { ?value rdfs:label ?labelRdfs }
  BIND(COALESCE(?label0, ?label1, ?labelRdfs, STR(?value)) AS ?label)
}
ORDER BY ?label
LIMIT ${limit}`;

  const result = await executeSparql(query);

  return result.results.bindings.map(binding => ({
    value: binding.value?.value || '',
    label: binding.label?.value || binding.value?.value || '',
  }));
}

// ============================================================================
// Data Queries
// ============================================================================

/**
 * Build and execute a data query, returning a DataFrame
 */
export async function fetchCubeData(
  config: ChartConfig,
  metadata: CubeMetadata,
  lang: Language
): Promise<DataFrame> {
  const { cubeUri, xAxis, yAxis, groupBy, filters, limit } = config;
  const langs = LANGUAGE_PRIORITY[lang];

  if (!xAxis && !yAxis) {
    return new MutableDataFrame({ name: 'Empty', fields: [] });
  }

  // Build SELECT clause and patterns
  const selectVars: string[] = [];
  const patterns: string[] = [];
  const fieldLabels: Record<string, string> = {};

  patterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

  // Helper to add a dimension/measure
  const addField = (uri: string, varName: string, isMeasure: boolean) => {
    selectVars.push(`?${varName}`);

    if (isMeasure) {
      // Measures are numeric, no label lookup needed
      patterns.push(`OPTIONAL { ?obs <${uri}> ?${varName} . }`);
      const measure = metadata.measures.find(m => m.uri === uri);
      fieldLabels[varName] = measure?.label || varName;
    } else {
      // Dimensions may need label lookup
      patterns.push(`OPTIONAL { ?obs <${uri}> ?${varName}_raw . }`);
      patterns.push(`OPTIONAL { ?${varName}_raw schema:name ?${varName}_l0 . FILTER(LANG(?${varName}_l0) = "${langs[0]}") }`);
      patterns.push(`OPTIONAL { ?${varName}_raw schema:name ?${varName}_l1 . FILTER(LANG(?${varName}_l1) = "${langs[1]}") }`);
      patterns.push(`BIND(COALESCE(?${varName}_l0, ?${varName}_l1, STR(?${varName}_raw)) AS ?${varName})`);
      const dim = metadata.dimensions.find(d => d.uri === uri);
      fieldLabels[varName] = dim?.label || varName;
    }
  };

  // Add fields
  const isMeasure = (uri: string) => metadata.measures.some(m => m.uri === uri);

  if (xAxis) {
    addField(xAxis, 'x', isMeasure(xAxis));
  }
  if (yAxis) {
    addField(yAxis, 'y', isMeasure(yAxis));
  }
  if (groupBy && groupBy !== xAxis) {
    addField(groupBy, 'group', isMeasure(groupBy));
  }

  // Add filter conditions
  for (const [dimUri, values] of Object.entries(filters)) {
    if (values.length > 0) {
      const valueList = values.map(v => `<${v}>`).join(', ');
      patterns.push(`?obs <${dimUri}> ?filterVal_${patterns.length} .`);
      patterns.push(`FILTER(?filterVal_${patterns.length} IN (${valueList}))`);
    }
  }

  const query = `${PREFIXES}
SELECT ${selectVars.join(' ')} WHERE {
  ${patterns.join('\n  ')}
}
LIMIT ${limit}`;

  const result = await executeSparql(query);

  return sparqlToDataFrame(result, {
    name: metadata.label,
    fieldLabels,
  });
}

// ============================================================================
// URL State Serialization (for Deep Linking)
// ============================================================================

export interface VisualizerState {
  cube?: string;
  x?: string;
  y?: string;
  group?: string;
  chart?: string;
  lang?: Language;
  limit?: number;
  filters?: Record<string, string[]>;
}

/**
 * Parse state from URL search params
 */
export function parseStateFromUrl(searchParams: URLSearchParams): VisualizerState {
  const state: VisualizerState = {};

  const cube = searchParams.get('cube');
  if (cube) state.cube = cube;

  const x = searchParams.get('x');
  if (x) state.x = x;

  const y = searchParams.get('y');
  if (y) state.y = y;

  const group = searchParams.get('group');
  if (group) state.group = group;

  const chart = searchParams.get('chart');
  if (chart) state.chart = chart;

  const lang = searchParams.get('lang') as Language;
  if (lang && ['de', 'fr', 'it', 'en'].includes(lang)) state.lang = lang;

  const limit = searchParams.get('limit');
  if (limit) state.limit = parseInt(limit, 10);

  // Parse filters (format: filter_<encoded-uri>=value1,value2)
  const filters: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter_')) {
      const dimUri = decodeURIComponent(key.slice(7));
      filters[dimUri] = value.split(',').filter(Boolean);
    }
  });
  if (Object.keys(filters).length > 0) {
    state.filters = filters;
  }

  return state;
}

/**
 * Serialize state to URL search params
 */
export function serializeStateToUrl(state: VisualizerState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.cube) params.set('cube', state.cube);
  if (state.x) params.set('x', state.x);
  if (state.y) params.set('y', state.y);
  if (state.group) params.set('group', state.group);
  if (state.chart) params.set('chart', state.chart);
  if (state.lang) params.set('lang', state.lang);
  if (state.limit) params.set('limit', String(state.limit));

  if (state.filters) {
    for (const [dimUri, values] of Object.entries(state.filters)) {
      if (values.length > 0) {
        params.set(`filter_${encodeURIComponent(dimUri)}`, values.join(','));
      }
    }
  }

  return params;
}
