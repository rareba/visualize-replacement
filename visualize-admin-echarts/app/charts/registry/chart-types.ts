/**
 * Chart Types Registry
 *
 * Defines all available chart types and their classifications.
 * This is the authoritative source for chart type definitions.
 */

import type { ChartType, ComboChartType, RegularChartType } from "@/config-types";

/**
 * All available chart types in the application.
 * Used for type guards and iteration.
 */
export const chartTypes: ChartType[] = [
  "column",
  "bar",
  "line",
  "area",
  "scatterplot",
  "pie",
  "donut",
  "table",
  "map",
  "radar",
  "heatmap",
  "boxplot",
  "waterfall",
  "candlestick",
  "themeriver",
  // 3D Charts (ECharts GL)
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "globe",
  "pie3d",
  // Combo charts
  "comboLineSingle",
  "comboLineDual",
  "comboLineColumn",
];

/**
 * Regular (non-combo) chart types.
 * These are chart types that work with a single data series or grouped data.
 */
export const regularChartTypes: RegularChartType[] = [
  "column",
  "bar",
  "line",
  "area",
  "scatterplot",
  "pie",
  "donut",
  "table",
  "map",
  "radar",
  "heatmap",
  "boxplot",
  "waterfall",
  "candlestick",
  "themeriver",
  // 3D Charts (ECharts GL)
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "globe",
  "pie3d",
];

/**
 * Combo chart types that support different units on each axis.
 */
export const comboDifferentUnitChartTypes: ComboChartType[] = [
  "comboLineDual",
  "comboLineColumn",
];

/**
 * Combo chart types that use the same unit on both axes.
 */
export const comboSameUnitChartTypes: ComboChartType[] = ["comboLineSingle"];

/**
 * All combo chart types.
 */
export const comboChartTypes: ComboChartType[] = [
  ...comboSameUnitChartTypes,
  ...comboDifferentUnitChartTypes,
];

/**
 * Chart type ordering for display in the chart type selector.
 * Lower numbers appear first. Combo charts get a boost when multiple cubes are selected.
 */
type ChartOrder = { [k in ChartType]: number };

export function getChartTypeOrder({ cubeCount }: { cubeCount: number }): ChartOrder {
  const multiCubeBoost = cubeCount > 1 ? -100 : 0;
  return {
    column: 0,
    bar: 1,
    line: 2,
    area: 3,
    scatterplot: 4,
    pie: 5,
    donut: 6,
    map: 7,
    table: 8,
    radar: 9,
    heatmap: 10,
    boxplot: 13,
    waterfall: 14,
    candlestick: 15,
    themeriver: 16,
    comboLineSingle: 17 + multiCubeBoost,
    comboLineDual: 18 + multiCubeBoost,
    comboLineColumn: 19 + multiCubeBoost,
    // 3D Charts
    bar3d: 20,
    scatter3d: 21,
    line3d: 22,
    surface: 23,
    globe: 24,
    pie3d: 25,
  };
}
