import { DataQuery, DataSourceJsonData, SelectableValue } from '@grafana/data';

/**
 * Query model - what gets saved when user configures a panel
 * Note: NO queryText field - users never see or write SPARQL
 */
export interface LindasQuery extends DataQuery {
  /** Selected cube URI */
  cubeUri?: string;
  /** Selected cube label (for display) */
  cubeLabel?: string;
  /** Maximum number of rows to return */
  limit?: number;
}

/**
 * Default query values
 */
export const DEFAULT_QUERY: Partial<LindasQuery> = {
  limit: 10000,
};

/**
 * Datasource configuration (minimal - endpoint is fixed to LINDAS)
 */
export interface LindasDataSourceOptions extends DataSourceJsonData {
  /** SPARQL endpoint URL - defaults to LINDAS */
  endpoint?: string;
}

/**
 * Secure configuration (not used - no auth needed for LINDAS)
 */
export interface LindasSecureJsonData {
  // No secure fields needed for public LINDAS endpoint
}

/**
 * Cube metadata from LINDAS catalog
 */
export interface CubeInfo {
  uri: string;
  label: string;
  description?: string;
  publisher?: string;
  datePublished?: string;
}

/**
 * Dimension metadata
 */
export interface DimensionInfo {
  uri: string;
  label: string;
  scaleType?: string;
  dataKind?: string;
}

/**
 * Measure metadata
 */
export interface MeasureInfo {
  uri: string;
  label: string;
  unit?: string;
}

/**
 * Full cube metadata with dimensions and measures
 */
export interface CubeMetadata {
  uri: string;
  label: string;
  description?: string;
  publisher?: string;
  dimensions: DimensionInfo[];
  measures: MeasureInfo[];
}

/**
 * SPARQL result structure
 */
export interface SparqlResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<{
      [key: string]: {
        type: string;
        value: string;
        datatype?: string;
      };
    }>;
  };
}
