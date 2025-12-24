/**
 * Type definitions for LINDAS Dataset Catalog
 *
 * Re-exports types from the sparql module for backward compatibility.
 */

// Re-export all types from sparql module
export type {
  Language,
  SparqlBinding,
  SparqlResult,
  Dataset,
  CubeDimension,
  CubeMeasure,
  CubeMetadata,
  ChartConfig,
  VisualizerState,
} from './sparql';

// Re-export functions
export {
  executeSparql,
  sparqlToDataFrame,
  fetchDatasets,
  fetchCubeMetadata,
  fetchCubeData,
  fetchDimensionValues,
  parseStateFromUrl,
  serializeStateToUrl,
} from './sparql';
