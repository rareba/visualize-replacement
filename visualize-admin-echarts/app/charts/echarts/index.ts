/**
 * ECharts Chart Components
 *
 * This module provides ECharts-based implementations of all chart types.
 * These components replace the D3-based implementations for improved
 * maintainability and faster development cycles.
 *
 * Usage:
 * ```tsx
 * import { ColumnChartAdapter } from "@/charts/echarts";
 *
 * // Use adapters with existing ChartContext state
 * <ColumnChartAdapter />
 * ```
 */

// Core wrapper
export { EChartsWrapper } from "./EChartsWrapper";
export type { EChartsWrapperProps, EChartsWrapperRef } from "./EChartsWrapper";

// Theme
export {
  getSwissFederalTheme,
  mergeWithTheme,
  SWISS_FEDERAL_ANIMATION,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "./theme";

// Adapter utilities
export {
  // Safe accessors
  safeGetDomain,
  safeGetNumericDomain,
  safeGetBounds,
  // Axis builders (generic)
  createCategoryAxis,
  createValueAxis,
  // Axis builders (typed for X axis)
  createXCategoryAxis,
  createXValueAxis,
  // Axis builders (typed for Y axis)
  createYCategoryAxis,
  createYValueAxis,
  // Configuration builders
  createGridConfig,
  createAxisTooltip,
  createItemTooltip,
  createLegend,
  // Error whiskers
  renderVerticalErrorWhisker,
  renderHorizontalErrorWhisker,
  // Data transformation
  groupDataBySegment,
  buildSeriesDataFromMap,
  // Common properties
  getDefaultAnimation,
  createNoDataGraphic,
  calculateChartDimensions,
  // Types
  type ChartBounds,
  type AxisLabelConfig,
  type ValueAxisConfig,
  type CategoryAxisConfig,
  type XAXisComponentOption,
  type YAXisComponentOption,
} from "./adapter-utils";

// Series builders
export {
  // Bar series
  createBarSeries,
  createBarSeriesGroup,
  // Line series
  createLineSeries,
  createLineSeriesGroup,
  // Scatter series
  createScatterSeries,
  createScatterSeriesGroup,
  // Pie series
  createPieSeries,
  // Area series
  createAreaSeries,
  createAreaSeriesGroup,
  // Custom series
  createCustomSeries,
  // Types
  type BarSeriesConfig,
  type LineSeriesConfig,
  type ScatterSeriesConfig,
  type PieSeriesConfig,
} from "./series-builders";

// Dual axis utilities (for combo charts)
export {
  createDualYAxis,
  createTimeAxis,
  createCrossTooltip,
  createComboGrid,
  createCategoryComboTooltipFormatter,
  createTimeComboTooltipFormatter,
  type DualYAxisConfig,
  type TimeAxisConfig,
  type ComboGridConfig,
} from "./dual-axis-utils";

// Hooks
export { useDataZoom, useDataZoomEvents } from "./hooks";

// Data utilities
export {
  // Time series grouping
  groupTimeSeriesData,
  buildTimeSeriesData,
  // Category grouping
  groupCategoryData,
  // Error whisker data
  buildErrorWhiskerData,
  buildGroupedErrorWhiskerData,
  // Series data building
  buildCategorySeriesData,
  // Scatter data
  buildScatterData,
  groupScatterDataBySegment,
  // Validation
  isDataValid,
  filterNullValues,
  getDataRange,
  // Types
  type TimeSeriesGroupResult,
  type CategoryGroupResult,
  type ErrorWhiskerConfig,
  type GroupedErrorWhiskerConfig,
  type CategorySeriesDataConfig,
  type ScatterDataPoint,
} from "./data-utils";

// Tooltip formatters
export {
  // Config factories
  createBaseTooltipConfig,
  // Category tooltips
  createCategoryTooltipFormatter,
  // Time series tooltips
  createTimeSeriesFormatter,
  // Scatter tooltips
  createScatterTooltipFormatter,
  // Pie tooltips
  createPieTooltipFormatter,
  // Item tooltips
  createItemTooltipFormatter,
  // Dual axis tooltips
  createDualAxisCategoryFormatter,
  createDualAxisTimeFormatter,
  // Pre-built formatters
  defaultNumberFormatter,
  percentFormatter,
  chfFormatter,
  compactFormatter,
  // Types
  type TooltipConfig,
} from "./tooltip-formatters";

// Chart container
export {
  ChartContainer,
  useChartContainer,
  withChartContainer,
  renderChart,
  type ChartContainerProps,
  type UseChartContainerProps,
  type UseChartContainerResult,
  type RenderChartProps,
  type AdapterConfig,
} from "./ChartContainer";

// Adapters for integrating with existing state management
export {
  // Area adapter
  AreaChartAdapter,
  // Bar adapters
  BarChartAdapter,
  // Column adapters
  ColumnChartAdapter,
  GroupedBarChartAdapter,
  GroupedColumnChartAdapter,
  // Line adapter
  LineChartAdapter,
  // Pie adapter
  PieChartAdapter,
  // Scatterplot adapter
  ScatterplotChartAdapter,
  StackedBarChartAdapter,
  StackedColumnChartAdapter,
} from "./adapters";
