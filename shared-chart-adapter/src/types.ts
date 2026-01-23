/**
 * Shared Chart Adapter Types
 *
 * Common interfaces for chart implementations across different libraries
 * (ECharts, Observable Plot, Plotly.js)
 */

// Base observation type from SPARQL data
export interface Observation {
  [key: string]: string | number | null | undefined;
}

// Chart bounds and dimensions
export interface ChartBounds {
  width: number;
  height: number;
  chartWidth: number;
  chartHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Color scale interface
export interface ColorScale {
  (value: string): string;
  domain(): string[];
  range(): string[];
}

// Numeric scale interface
export interface NumericScale {
  (value: number | null): number;
  domain(): [number, number];
  range(): [number, number];
  ticks(count?: number): number[];
}

// Band scale interface
export interface BandScale {
  (value: string): number | undefined;
  domain(): string[];
  range(): [number, number];
  bandwidth(): number;
  step(): number;
}

// Time scale interface
export interface TimeScale {
  (value: Date): number;
  domain(): [Date, Date];
  range(): [number, number];
  ticks(count?: number): Date[];
}

// Supported chart types
export type ChartType =
  | 'column'
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatterplot'
  | 'comboLineSingle'
  | 'comboLineDual'
  | 'comboLineColumn'
  | 'map'
  | 'table';

// Animation configuration
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing?: string;
}

// Tooltip configuration
export interface TooltipConfig {
  enabled: boolean;
  formatter?: (observation: Observation) => string;
}

// Legend configuration
export interface LegendConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  interactive: boolean;
}

// Axis configuration
export interface AxisConfig {
  label: string;
  visible: boolean;
  gridLines: boolean;
  tickFormatter?: (value: any) => string;
}

// Theme configuration matching Swiss Federal Design
export interface ChartTheme {
  fontFamily: string;
  fontSize: {
    label: number;
    axis: number;
    title: number;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    grid: string;
    axis: string;
  };
}

// Default Swiss Federal theme
export const SWISS_FEDERAL_THEME: ChartTheme = {
  fontFamily: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    label: 12,
    axis: 11,
    title: 14,
  },
  colors: {
    primary: '#d32f2f',
    secondary: '#1976d2',
    background: '#ffffff',
    text: '#333333',
    grid: '#e0e0e0',
    axis: '#666666',
  },
};

// Enhanced Swiss Federal theme with extended properties
export interface ChartThemeExtended extends ChartTheme {
  fontWeight: {
    normal: number;
    medium: number;
    bold: number;
  };
  spacing: {
    chartPadding: number;
    legendGap: number;
    axisLabelGap: number;
    tooltipPadding: number;
  };
  borderRadius: number;
  categorical: string[];
  sequential: {
    start: string;
    end: string;
  };
  diverging: {
    negative: string;
    neutral: string;
    positive: string;
  };
}

export const SWISS_FEDERAL_THEME_V2: ChartThemeExtended = {
  fontFamily: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    label: 12,
    axis: 11,
    title: 16,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 600,
  },
  colors: {
    primary: '#dc0018',    // Swiss Federal Red
    secondary: '#006699',  // Swiss Federal Blue
    background: '#ffffff',
    text: '#333333',
    grid: 'rgba(0, 0, 0, 0.08)',
    axis: 'rgba(0, 0, 0, 0.54)',
  },
  spacing: {
    chartPadding: 16,
    legendGap: 12,
    axisLabelGap: 8,
    tooltipPadding: 12,
  },
  borderRadius: 2,
  categorical: [
    '#006699', // Blue
    '#dc0018', // Red
    '#3ea100', // Green
    '#f7a800', // Orange
    '#8c4a9e', // Purple
    '#00a4b4', // Teal
    '#d63384', // Pink
    '#495057', // Grey
    '#0d6efd', // Light Blue
    '#198754', // Dark Green
  ],
  sequential: {
    start: '#e8f4fc',
    end: '#003366',
  },
  diverging: {
    negative: '#dc0018',
    neutral: '#ffffff',
    positive: '#3ea100',
  },
};

// Value getter functions
export type ValueGetter<T> = (observation: Observation) => T;

// Chart data configuration
export interface ChartDataConfig {
  data: Observation[];
  getX: ValueGetter<string | number | Date>;
  getY: ValueGetter<number | null>;
  getSegment?: ValueGetter<string>;
  getColor?: ValueGetter<string>;
  getSize?: ValueGetter<number>;
}

// Error/uncertainty range
export interface ErrorRange {
  low: number;
  high: number;
}

// Annotation configuration
export interface AnnotationConfig {
  enabled: boolean;
  annotations: Array<{
    type: 'point' | 'line' | 'area';
    value: number | Date | string;
    label?: string;
    color?: string;
  }>;
}

// Base props for all chart components
export interface BaseChartProps {
  // Data
  data: Observation[];

  // Dimensions
  width: number;
  height: number;

  // Theme
  theme?: ChartTheme;

  // Animation
  animation?: AnimationConfig;

  // Interactions
  tooltip?: TooltipConfig;
  legend?: LegendConfig;

  // Callbacks
  onDataPointClick?: (observation: Observation, event: MouseEvent) => void;
  onDataPointHover?: (observation: Observation | null, event: MouseEvent) => void;
}

// Column/Bar chart specific props
export interface ColumnBarChartProps extends BaseChartProps {
  chartType: 'column' | 'bar';
  getX: ValueGetter<string>;
  getY: ValueGetter<number | null>;
  getSegment?: ValueGetter<string>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colorScale?: ColorScale;
  showValues?: boolean;
  stacked?: boolean;
  grouped?: boolean;
  errorWhiskers?: ErrorWhiskerConfig;
}

// Line chart specific props
export interface LineChartProps extends BaseChartProps {
  chartType: 'line';
  getX: ValueGetter<Date | number>;
  getY: ValueGetter<number | null>;
  getSegment?: ValueGetter<string>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colorScale?: ColorScale;
  showDots?: boolean;
  dotSize?: 'small' | 'medium' | 'large';
  interpolation?: 'linear' | 'monotone' | 'step';
  errorWhiskers?: ErrorWhiskerConfig;
}

// Area chart specific props
export interface AreaChartProps extends BaseChartProps {
  chartType: 'area';
  getX: ValueGetter<Date | number>;
  getY: ValueGetter<number | null>;
  getSegment?: ValueGetter<string>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colorScale?: ColorScale;
  stacked?: boolean;
  opacity?: number;
}

// Pie chart specific props
export interface PieChartProps extends BaseChartProps {
  chartType: 'pie';
  getValue: ValueGetter<number | null>;
  getLabel: ValueGetter<string>;
  colorScale?: ColorScale;
  innerRadius?: number; // For donut charts
  showLabels?: boolean;
  showValues?: boolean;
}

// Scatterplot specific props
export interface ScatterplotChartProps extends BaseChartProps {
  chartType: 'scatterplot';
  getX: ValueGetter<number | null>;
  getY: ValueGetter<number | null>;
  getSegment?: ValueGetter<string>;
  getSize?: ValueGetter<number>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colorScale?: ColorScale;
  sizeRange?: [number, number];
}

// Error/Whisker configuration for uncertainty visualization
export interface ErrorWhiskerConfig {
  enabled: boolean;
  getErrorLow?: ValueGetter<number | null>;
  getErrorHigh?: ValueGetter<number | null>;
  capWidth?: number;
  color?: string;
  lineWidth?: number;
}

// Combo Line-Single chart props (multiple lines on same axis)
export interface ComboLineSingleChartProps extends BaseChartProps {
  chartType: 'comboLineSingle';
  getX: ValueGetter<Date | number>;
  getY: ValueGetter<number | null>;
  getSegment: ValueGetter<string>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colorScale?: ColorScale;
  showDots?: boolean;
  interpolation?: 'linear' | 'monotone' | 'step';
  errorWhiskers?: ErrorWhiskerConfig;
}

// Combo Line-Dual chart props (dual Y-axis)
export interface ComboLineDualChartProps extends BaseChartProps {
  chartType: 'comboLineDual';
  getX: ValueGetter<Date | number>;
  getY: ValueGetter<number | null>;
  getSegment: ValueGetter<string>;
  // Which segments go to which axis
  leftAxisSegments: string[];
  rightAxisSegments: string[];
  xAxis?: AxisConfig;
  yAxisLeft?: AxisConfig;
  yAxisRight?: AxisConfig;
  colorScale?: ColorScale;
  showDots?: boolean;
  interpolation?: 'linear' | 'monotone' | 'step';
}

// Combo Line-Column chart props (line + bar combination)
export interface ComboLineColumnChartProps extends BaseChartProps {
  chartType: 'comboLineColumn';
  getX: ValueGetter<string>;
  getY: ValueGetter<number | null>;
  getSegment: ValueGetter<string>;
  // Which segments are lines vs columns
  lineSegments: string[];
  columnSegments: string[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colorScale?: ColorScale;
  showDots?: boolean;
  stacked?: boolean;
}

// Union type of all chart props
export type ChartProps =
  | ColumnBarChartProps
  | LineChartProps
  | AreaChartProps
  | PieChartProps
  | ScatterplotChartProps
  | ComboLineSingleChartProps
  | ComboLineDualChartProps
  | ComboLineColumnChartProps;

// Chart render result for testing/comparison
export interface ChartRenderResult {
  svg?: SVGElement;
  canvas?: HTMLCanvasElement;
  container: HTMLElement;
  destroy: () => void;
}

// Chart adapter interface that all implementations must follow
export interface ChartAdapter {
  // Library identifier
  readonly libraryName: string;
  readonly version: string;

  // Render a chart
  render(
    container: HTMLElement,
    props: ChartProps
  ): ChartRenderResult;

  // Update existing chart
  update(
    result: ChartRenderResult,
    props: Partial<ChartProps>
  ): void;

  // Resize chart
  resize(
    result: ChartRenderResult,
    width: number,
    height: number
  ): void;

  // Export chart as image
  exportImage(
    result: ChartRenderResult,
    format: 'png' | 'svg' | 'jpeg'
  ): Promise<Blob>;

  // Get chart data for accessibility
  getAccessibleDescription(
    result: ChartRenderResult
  ): string;
}

// React component props for chart wrapper
export interface ReactChartWrapperProps extends BaseChartProps {
  chartType: ChartType;
  [key: string]: any; // Allow chart-type specific props
}
