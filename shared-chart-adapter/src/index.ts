/**
 * Shared Chart Adapter
 *
 * Common types, utilities, and interfaces for charting library implementations.
 * This package provides the foundation for ECharts, Observable Plot, and Plotly.js
 * implementations.
 */

// Types
export * from './types';

// Scale utilities
export * from './scales';

// Re-export d3-scale types for convenience
export {
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  scaleTime,
} from 'd3-scale';

export {
  extent,
  max,
  min,
  sum,
  mean,
  median,
} from 'd3-array';

// Version
export const VERSION = '1.0.0';
