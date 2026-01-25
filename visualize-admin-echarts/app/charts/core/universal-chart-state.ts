/**
 * Universal Chart State - Core interfaces for the universal ECharts architecture
 *
 * This file defines the state interface that all ECharts adapters receive.
 * The key insight is that ECharts handles its own scaling, so we don't need
 * D3 scales - just raw data and field accessors.
 */

import type { ScaleOrdinal } from "d3-scale";

import type { ChartConfig, ChartType, InteractiveFiltersConfig } from "@/config-types";
import type { Dimension, Measure, Observation } from "@/domain/data";
import type { Bounds } from "@/charts/shared/use-size";

// ============================================================================
// Value Getter Types
// ============================================================================

/** Gets a numeric value from an observation (may be null for missing data) */
export type NumericalValueGetter = (d: Observation) => number | null;

/** Gets a string value from an observation */
export type StringValueGetter = (d: Observation) => string;

/** Gets a Date value from an observation */
export type TemporalValueGetter = (d: Observation) => Date;

// ============================================================================
// Field Accessors Interface
// ============================================================================

/**
 * Field accessors created from chartConfig.
 * These provide type-safe ways to extract values from observations
 * based on the chart's field configuration.
 */
export interface FieldAccessors {
  // X-axis field (for axis-based charts)
  getX?: StringValueGetter;
  getXAsDate?: TemporalValueGetter;
  getXNumeric?: NumericalValueGetter;
  xLabel?: string;
  xDimension?: Dimension;

  // Y-axis field (for axis-based charts and measures)
  getY?: NumericalValueGetter;
  yLabel?: string;
  yMeasure?: Measure;

  // Segment field (for grouped/stacked charts)
  getSegment?: StringValueGetter;
  getSegmentLabel?: (segment: string) => string;
  segmentDimension?: Dimension;

  // Additional fields for specific chart types
  getSize?: NumericalValueGetter;     // For bubble charts
  getValue?: NumericalValueGetter;    // For Heatmap

  // Rendering key (for consistent identification)
  getRenderingKey?: (d: Observation, segment?: string) => string;
}

// ============================================================================
// Color Accessors Interface
// ============================================================================

/**
 * Color accessors for consistent coloring across charts.
 */
export interface ColorAccessors {
  /** Get color for a segment/category value */
  getColor: (segment: string) => string;

  /** The color domain (ordered list of segment values) */
  colorDomain: string[];

  /** D3 color scale (for compatibility with existing code) */
  colorScale: ScaleOrdinal<string, string>;

  /** Get color for an observation based on its segment */
  getColorForObservation?: (d: Observation) => string;
}

// ============================================================================
// Field Metadata Interface
// ============================================================================

/**
 * Metadata about fields for labels, formatting, etc.
 */
export interface FieldMetadata {
  xAxisLabel: string;
  yAxisLabel: string;
  segmentLabel?: string;

  // Formatting functions
  formatXAxisTick?: (value: string) => string;
  formatYAxisTick?: (value: number) => string;
  formatValue?: (value: number) => string;
  formatNumber: (value: number) => string;
}

// ============================================================================
// Chart Options from Config
// ============================================================================

/**
 * Display options extracted from chartConfig.
 */
export interface ChartDisplayOptions {
  showValues?: boolean;
  showTitle?: boolean;
  rotateValues?: boolean;

  // Error/uncertainty display
  showYUncertainty?: boolean;
  getYErrorRange?: (d: Observation) => [number, number] | null;
  getYErrorPresent?: (d: Observation) => boolean;

  // Animation settings
  animationType?: string;
  animationDuration?: number;

  // Pie/Donut specific
  innerRadius?: number;

  // Segment type (for column/bar)
  segmentType?: "stacked" | "grouped";
}

// ============================================================================
// Universal Chart State Interface
// ============================================================================

/**
 * The universal state interface that all ECharts adapters receive.
 *
 * Key design principles:
 * 1. NO D3 scales - ECharts handles its own scaling
 * 2. Raw observations for adapters to transform
 * 3. Field accessors based on chartConfig
 * 4. Colors handled consistently
 * 5. All necessary context without chart-specific coupling
 */
export interface UniversalChartState {
  // Chart identification
  chartType: ChartType;
  chartConfig: ChartConfig;

  // Raw data
  observations: Observation[];
  allObservations: Observation[];

  // Dimensions and measures from the cube
  dimensions: Dimension[];
  measures: Measure[];
  dimensionsById: Record<string, Dimension>;
  measuresById: Record<string, Measure>;

  // Field accessors (created from chartConfig)
  fields: FieldAccessors;

  // Colors
  colors: ColorAccessors;

  // Layout
  bounds: Bounds;

  // Derived data
  segments: string[];
  categories: string[];

  // Field metadata and formatting
  metadata: FieldMetadata;

  // Display options
  options: ChartDisplayOptions;

  // Interactive filters configuration
  interactiveFiltersConfig: InteractiveFiltersConfig;

  // Value label formatter (for tooltips and labels)
  valueLabelFormatter?: (value: number) => string;
}

// ============================================================================
// Chart Adapter Type
// ============================================================================

import type { EChartsOption } from "echarts";

/**
 * A chart adapter is a pure function that transforms UniversalChartState
 * into an EChartsOption configuration object.
 */
export type ChartAdapter = (state: UniversalChartState) => EChartsOption;

/**
 * A chart adapter React component receives no props
 * and reads from UniversalChartContext.
 */
export type ChartAdapterComponent = React.ComponentType<Record<string, never>>;

// ============================================================================
// Sub-state Types (for specific chart type adapters)
// ============================================================================

/**
 * State subset for pie/donut charts
 */
export interface PieChartState extends UniversalChartState {
  chartType: "pie" | "donut";
  options: ChartDisplayOptions & {
    innerRadius?: number;
  };
}

/**
 * State subset for axis-based charts (column, bar, line, area)
 */
export interface AxisChartState extends UniversalChartState {
  chartType: "column" | "bar" | "line" | "area";
  options: ChartDisplayOptions & {
    segmentType?: "stacked" | "grouped";
  };
}

