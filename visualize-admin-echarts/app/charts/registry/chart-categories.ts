/**
 * Chart Categories
 *
 * Groups chart types by their primary visualization purpose.
 * Used in the compact chart selector UI.
 */

import type { ChartType } from "@/config-types";

/**
 * Available chart category identifiers.
 */
export type ChartCategory =
  | "basic"
  | "partOfWhole"
  | "statistical"
  | "financial"
  | "stream"
  | "specialized"
  | "comparison";

/**
 * Configuration for a chart category.
 */
export interface ChartCategoryConfig {
  /** Unique identifier for the category */
  id: ChartCategory;
  /** Translation key for the category label */
  labelKey: string;
  /** Chart types included in this category */
  chartTypes: ChartType[];
}

/**
 * Chart type categories for the compact chart selector.
 * Groups chart types by their primary visualization purpose.
 */
export const chartTypeCategories: ChartCategoryConfig[] = [
  {
    id: "basic",
    labelKey: "controls.chart.category.basic",
    chartTypes: [
      "column",
      "bar",
      "line",
      "area",
      "scatterplot",
      "bar3d",
      "scatter3d",
      "line3d",
      "surface",
      "globe",
      "pie3d",
    ],
  },
  {
    id: "partOfWhole",
    labelKey: "controls.chart.category.partOfWhole",
    chartTypes: ["pie", "donut", "waterfall"],
  },
  {
    id: "statistical",
    labelKey: "controls.chart.category.statistical",
    chartTypes: ["boxplot", "heatmap"],
  },
  {
    id: "financial",
    labelKey: "controls.chart.category.financial",
    chartTypes: ["candlestick"],
  },
  {
    id: "stream",
    labelKey: "controls.chart.category.stream",
    chartTypes: ["themeriver"],
  },
  {
    id: "specialized",
    labelKey: "controls.chart.category.specialized",
    chartTypes: ["radar", "map", "table"],
  },
  {
    id: "comparison",
    labelKey: "controls.chart.category.comparison",
    chartTypes: ["comboLineSingle", "comboLineDual", "comboLineColumn"],
  },
];

/**
 * Get the category for a given chart type.
 */
export function getChartCategory(chartType: ChartType): ChartCategory | undefined {
  const category = chartTypeCategories.find((cat) =>
    cat.chartTypes.includes(chartType)
  );
  return category?.id;
}

/**
 * Get all chart types for a given category.
 */
export function getChartTypesForCategory(category: ChartCategory): ChartType[] {
  const config = chartTypeCategories.find((cat) => cat.id === category);
  return config?.chartTypes ?? [];
}
