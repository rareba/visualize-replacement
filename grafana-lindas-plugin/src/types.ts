/* LINDAS SPARQL Datasource Plugin for Grafana
 * Based on Flanders Make SPARQL plugin, extended for LINDAS dataset browsing
 */

import { DataQuery, DataSourceJsonData } from '@grafana/data';

// Query configuration
export interface LindasQuery extends DataQuery {
  queryText?: string;
  cubeIri?: string;
  cubeName?: string;
  selectedDimensions?: DimensionConfig[];
  selectedMeasures?: string[];
  filters?: FilterConfig[];
  queryMode: 'manual' | 'builder';
}

// Dimension configuration
export interface DimensionConfig {
  iri: string;
  label: string;
  dataType?: string;
  isTime?: boolean;
  isMeasure?: boolean;
}

// Filter configuration
export interface FilterConfig {
  dimensionIri: string;
  operator: 'eq' | 'in' | 'range';
  value: string | string[];
}

// Cube metadata from LINDAS
export interface CubeMetadata {
  iri: string;
  title: string;
  description?: string;
  creator?: string;
  creatorLabel?: string;
  datePublished?: string;
  themes?: string[];
  dimensions?: DimensionConfig[];
}

// Datasource configuration
export interface LindasDataSourceOptions extends DataSourceJsonData {
  sparqlEndpoint?: string;
  defaultLocale?: string;
}

// Secure configuration (credentials)
export interface LindasSecureJsonData {
  apiKey?: string;
}

// Default values
export const DEFAULT_QUERY: Partial<LindasQuery> = {
  queryMode: 'builder',
  selectedDimensions: [],
  selectedMeasures: [],
  filters: [],
};

// LINDAS endpoints
export const LINDAS_ENDPOINTS = {
  production: 'https://lindas.admin.ch/query',
  test: 'https://lindas-int.admin.ch/query',
} as const;
