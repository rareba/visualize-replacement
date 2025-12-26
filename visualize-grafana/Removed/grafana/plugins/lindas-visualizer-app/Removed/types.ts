/**
 * Type definitions for LINDAS Chart Studio
 */

/**
 * Available chart types
 */
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'table';

/**
 * Chart type metadata for UI
 */
export interface ChartTypeInfo {
  id: ChartType;
  label: string;
  icon: string;
  description: string;
  requiresTimeDimension?: boolean;
  supportsSeries?: boolean;
}

/**
 * All available chart types
 */
export const CHART_TYPES: ChartTypeInfo[] = [
  {
    id: 'bar',
    label: 'Bar Chart',
    icon: 'graph-bar',
    description: 'Compare values across categories',
    supportsSeries: true,
  },
  {
    id: 'line',
    label: 'Line Chart',
    icon: 'gf-interpolation-linear',
    description: 'Show trends over time',
    requiresTimeDimension: true,
    supportsSeries: true,
  },
  {
    id: 'area',
    label: 'Area Chart',
    icon: 'gf-interpolation-linear',
    description: 'Show cumulative trends',
    requiresTimeDimension: true,
    supportsSeries: true,
  },
  {
    id: 'pie',
    label: 'Pie Chart',
    icon: 'pie-chart',
    description: 'Show proportions of a whole',
    supportsSeries: false,
  },
  {
    id: 'scatter',
    label: 'Scatter Plot',
    icon: 'gf-landscape',
    description: 'Show correlation between two measures',
    supportsSeries: true,
  },
  {
    id: 'table',
    label: 'Table',
    icon: 'table',
    description: 'Display raw data in rows and columns',
    supportsSeries: false,
  },
];

/**
 * Cube metadata from LINDAS
 */
export interface CubeMetadata {
  uri: string;
  label: string;
  description?: string;
  publisher?: string;
  dateModified?: string;
}

/**
 * Dimension of a cube
 */
export interface CubeDimension {
  uri: string;
  label: string;
  scaleType?: 'nominal' | 'ordinal' | 'temporal' | 'numerical';
  isTemporal?: boolean;
  isNumerical?: boolean;
}

/**
 * Measure of a cube
 */
export interface CubeMeasure {
  uri: string;
  label: string;
  unit?: string;
}

/**
 * Full cube data including dimensions and measures
 */
export interface CubeFullMetadata extends CubeMetadata {
  dimensions: CubeDimension[];
  measures: CubeMeasure[];
}

/**
 * Chart configuration state
 */
export interface ChartConfig {
  /** Selected chart type */
  chartType: ChartType;
  /** Dimension for X-axis (or categories) */
  xAxis?: string;
  /** Measure for Y-axis (or values) */
  yAxis?: string;
  /** Optional: dimension for grouping/series */
  groupBy?: string;
  /** Optional: second measure for scatter plots */
  yAxis2?: string;
  /** Chart title */
  title?: string;
  /** Row limit */
  limit: number;
  /** Show legend */
  showLegend: boolean;
  /** Color scheme */
  colorScheme?: string;
}

/**
 * Default chart configuration
 */
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  chartType: 'bar',
  limit: 10000,
  showLegend: true,
};

/**
 * Data row from SPARQL result
 */
export interface DataRow {
  [key: string]: string | number | null;
}

/**
 * Dataset with data and metadata
 */
export interface DatasetWithData {
  metadata: CubeFullMetadata;
  data: DataRow[];
  columns: string[];
}

/**
 * SPARQL result binding
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
 * SPARQL query result
 */
export interface SparqlResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: SparqlBinding[];
  };
}
