/**
 * Universal Adapters Index
 *
 * This file exports all universal adapters and auto-registers them
 * with the chart adapter registry.
 *
 * To add a new chart type:
 * 1. Create a new adapter file (e.g., myChart-universal-adapter.ts)
 * 2. Export and register the adapter in that file
 * 3. Import the file here to ensure registration happens
 *
 * Benefits:
 * - Single import to register all adapters
 * - Each adapter is ~50-150 lines (vs ~400+ for old architecture)
 * - Adding new chart types requires minimal boilerplate
 */

// ============================================================================
// Import all adapters (importing triggers registration)
// ============================================================================

// Part of Whole Charts
import "./pie-universal-adapter";
import "./donut-universal-adapter";

// Axis-based Charts
import "./column-universal-adapter";
import "./bar-universal-adapter";
import "./line-universal-adapter";
import "./area-universal-adapter";
import "./scatterplot-universal-adapter";
import "./boxplot-universal-adapter";
import "./waterfall-universal-adapter";
import "./heatmap-universal-adapter";
import "./candlestick-universal-adapter";

// Time Series / Stream Charts
import "./themeriver-universal-adapter";

// Multi-variable Charts
import "./radar-universal-adapter";

// Combo Charts
import "./combo-line-single-universal-adapter";
import "./combo-line-dual-universal-adapter";
import "./combo-line-column-universal-adapter";

// 3D Charts (ECharts GL)
import "./bar3d-universal-adapter";
import "./scatter3d-universal-adapter";
import "./surface-universal-adapter";
import "./line3d-universal-adapter";
import "./globe-universal-adapter";
import "./pie3d-universal-adapter";

// ============================================================================
// Export adapter functions for direct use
// ============================================================================

export { pieUniversalAdapter } from "./pie-universal-adapter";
export { donutUniversalAdapter } from "./donut-universal-adapter";
export { columnUniversalAdapter } from "./column-universal-adapter";
export { barUniversalAdapter } from "./bar-universal-adapter";
export { lineUniversalAdapter } from "./line-universal-adapter";
export { areaUniversalAdapter } from "./area-universal-adapter";
export { scatterplotUniversalAdapter } from "./scatterplot-universal-adapter";
export { boxplotUniversalAdapter } from "./boxplot-universal-adapter";
export { waterfallUniversalAdapter } from "./waterfall-universal-adapter";
export { heatmapUniversalAdapter } from "./heatmap-universal-adapter";
export { candlestickUniversalAdapter } from "./candlestick-universal-adapter";
export { themeriverUniversalAdapter } from "./themeriver-universal-adapter";
export { radarUniversalAdapter } from "./radar-universal-adapter";

// Combo Charts
export { comboLineSingleUniversalAdapter } from "./combo-line-single-universal-adapter";
export { comboLineDualUniversalAdapter } from "./combo-line-dual-universal-adapter";
export { comboLineColumnUniversalAdapter } from "./combo-line-column-universal-adapter";

// 3D Charts (ECharts GL)
export { bar3dUniversalAdapter } from "./bar3d-universal-adapter";
export { scatter3dUniversalAdapter } from "./scatter3d-universal-adapter";
export { surfaceUniversalAdapter } from "./surface-universal-adapter";
export { line3dUniversalAdapter } from "./line3d-universal-adapter";
export { globeUniversalAdapter } from "./globe-universal-adapter";
export { pie3dUniversalAdapter } from "./pie3d-universal-adapter";

// ============================================================================
// Chart Types with Universal Adapters
// ============================================================================

/**
 * List of chart types that have universal adapters.
 * Used for feature flags and routing decisions.
 */
export const UNIVERSAL_ADAPTER_CHART_TYPES = [
  "pie",
  "donut",
  "column",
  "bar",
  "line",
  "area",
  "scatterplot",
  "boxplot",
  "waterfall",
  "heatmap",
  "candlestick",
  "themeriver",
  "radar",
  // Combo Charts
  "comboLineSingle",
  "comboLineDual",
  "comboLineColumn",
  // 3D Charts (ECharts GL)
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "globe",
  "pie3d",
] as const;

export type UniversalAdapterChartType = typeof UNIVERSAL_ADAPTER_CHART_TYPES[number];

/**
 * Checks if a chart type has a universal adapter.
 */
export const hasUniversalAdapter = (chartType: string): chartType is UniversalAdapterChartType => {
  return UNIVERSAL_ADAPTER_CHART_TYPES.includes(chartType as UniversalAdapterChartType);
};
