/**
 * Domain models for the SPARQL Data Explorer
 * These interfaces define the structure of RDF Data Cubes and query configuration
 */

/**
 * Metadata for an RDF Data Cube discovered from a catalog
 */
export interface CubeMetadata {
  /** The URI identifier of the cube */
  uri: string;
  /** Human-readable label for the cube */
  label: string;
  /** Optional description of the cube's contents */
  description?: string;
  /** Publisher organization */
  publisher?: string;
  /** Date the cube was last modified */
  dateModified?: string;
}

/**
 * A dimension of an RDF Data Cube (categorical or temporal axis)
 */
export interface CubeDimension {
  /** The URI identifier of the dimension property */
  uri: string;
  /** Human-readable label for the dimension */
  label: string;
  /** Optional XSD data type range (e.g., xsd:date, xsd:string) */
  range?: string;
  /** Scale type for visualization purposes */
  scaleType?: 'nominal' | 'ordinal' | 'temporal' | 'numerical';
  /** Order hint for display */
  order?: number;
  /** Whether this dimension represents time */
  isTemporal?: boolean;
  /** Whether this dimension has numeric values */
  isNumerical?: boolean;
}

/**
 * A measure of an RDF Data Cube (numeric value to be aggregated/displayed)
 */
export interface CubeMeasure {
  /** The URI identifier of the measure property */
  uri: string;
  /** Human-readable label for the measure */
  label: string;
  /** Optional unit of measurement */
  unit?: string;
  /** Optional XSD data type */
  dataType?: string;
}

/**
 * Full metadata for a cube including its dimensions and measures
 */
export interface CubeFullMetadata extends CubeMetadata {
  /** Available dimensions in this cube */
  dimensions: CubeDimension[];
  /** Available measures in this cube */
  measures: CubeMeasure[];
}

/**
 * Filter applied to a dimension
 */
export interface DimensionFilter {
  /** URI of the dimension to filter */
  dimensionUri: string;
  /** Selected values (URIs or literals) */
  values: string[];
  /** Filter operator */
  operator: 'in' | 'equals' | 'notEquals';
}

/**
 * Internal state of the SPARQL query builder
 */
export interface SparqlQueryConfig {
  /** The selected cube URI */
  cubeUri: string;
  /** Selected dimensions to include in the query */
  selectedDimensions: string[];
  /** Selected measures to include in the query */
  selectedMeasures: string[];
  /** Filters applied to dimensions */
  filters: DimensionFilter[];
  /** Maximum number of results */
  limit: number;
  /** Ordering configuration */
  orderBy?: {
    variable: string;
    direction: 'ASC' | 'DESC';
  };
}

/**
 * Result of a dimension value lookup
 */
export interface DimensionValue {
  /** URI or literal value */
  value: string;
  /** Display label */
  label: string;
}

/**
 * SPARQL result binding from a query
 */
export interface SparqlBinding {
  [variable: string]: {
    type: 'uri' | 'literal' | 'bnode';
    value: string;
    datatype?: string;
    'xml:lang'?: string;
  };
}

/**
 * SPARQL query result structure
 */
export interface SparqlResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: SparqlBinding[];
  };
}

/**
 * Configuration for the Explorer Scene
 */
export interface ExplorerConfig {
  /** UID of the pre-configured SPARQL datasource */
  datasourceUid: string;
  /** Default limit for queries */
  defaultLimit?: number;
  /** Whether to show advanced options */
  showAdvancedOptions?: boolean;
}

/**
 * State for the Explorer Scene
 */
export interface ExplorerState {
  /** Currently selected cube */
  selectedCube: CubeFullMetadata | null;
  /** Current query configuration */
  queryConfig: SparqlQueryConfig | null;
  /** Whether the query is currently running */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Search term for cube discovery */
  searchTerm: string;
  /** Search results */
  searchResults: CubeMetadata[];
}

/**
 * Event types for scene state changes
 */
export type ExplorerEvent =
  | { type: 'SEARCH_CUBES'; term: string }
  | { type: 'SELECT_CUBE'; cube: CubeMetadata }
  | { type: 'TOGGLE_DIMENSION'; dimensionUri: string }
  | { type: 'TOGGLE_MEASURE'; measureUri: string }
  | { type: 'SET_FILTER'; filter: DimensionFilter }
  | { type: 'REMOVE_FILTER'; dimensionUri: string }
  | { type: 'RUN_QUERY' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; loading: boolean };
