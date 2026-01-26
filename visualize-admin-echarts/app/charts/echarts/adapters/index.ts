/**
 * ECharts Adapters (LEGACY)
 *
 * @deprecated These component-based adapters are deprecated in favor of the
 * universal adapters in `@/charts/echarts/universal-adapters/`.
 *
 * Universal adapters provide:
 * - Simpler pure-function architecture
 * - No dependency on D3 scales
 * - Single unified state provider (UniversalChartProvider)
 * - Easier testing and maintenance
 *
 * For new chart development, use:
 * - `UniversalEChartsChart` component
 * - `registerChartAdapter()` to add new adapters
 *
 * These legacy adapters are maintained for backward compatibility
 * and will be removed in a future major version.
 */

// Column chart adapters
export {
  ColumnChartAdapter,
  GroupedColumnChartAdapter,
  StackedColumnChartAdapter,
} from "./column-adapter";

// Bar chart adapters (horizontal)
export {
  BarChartAdapter,
  GroupedBarChartAdapter,
  StackedBarChartAdapter,
} from "./bar-adapter";

// Line chart adapter
export { LineChartAdapter } from "./line-adapter";

// Area chart adapter
export { AreaChartAdapter } from "./area-adapter";

// Pie chart adapter
export { PieChartAdapter } from "./pie-adapter";

// Scatterplot chart adapter
export { ScatterplotChartAdapter } from "./scatterplot-adapter";

// Combo chart adapters
export { ComboLineColumnChartAdapter } from "./combo-line-column-adapter";
export { ComboLineDualChartAdapter } from "./combo-line-dual-adapter";
export { ComboLineSingleChartAdapter } from "./combo-line-single-adapter";

// Donut chart adapter (pie variant)
export { DonutChartAdapter } from "./donut-adapter";

// Radar chart adapter
export { RadarChartAdapter } from "./radar-adapter";

// Heatmap chart adapter
export { HeatmapChartAdapter } from "./heatmap-adapter";

// Boxplot chart adapter
export { BoxplotChartAdapter } from "./boxplot-adapter";

// Waterfall chart adapter
export { WaterfallChartAdapter } from "./waterfall-adapter";
