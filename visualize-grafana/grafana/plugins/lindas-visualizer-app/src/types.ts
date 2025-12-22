/**
 * Type definitions for LINDAS Dataset Catalog
 * Simplified types for the new Grafana-native interface
 */

/**
 * Basic dataset info from LINDAS
 */
export interface Dataset {
  uri: string;
  label: string;
  description?: string;
  publisher?: string;
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
