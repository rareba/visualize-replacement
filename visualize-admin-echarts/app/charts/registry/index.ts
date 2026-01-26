/**
 * Charts Registry
 *
 * Centralized registry for chart types, categories, and metadata.
 *
 * Usage:
 * import { chartTypes, regularChartTypes, comboChartTypes } from "@/charts/registry";
 * import { chartTypeCategories, ChartCategory } from "@/charts/registry";
 */

export {
  chartTypes,
  regularChartTypes,
  comboChartTypes,
  comboDifferentUnitChartTypes,
  comboSameUnitChartTypes,
  getChartTypeOrder,
} from "./chart-types";

export {
  type ChartCategory,
  type ChartCategoryConfig,
  chartTypeCategories,
  getChartCategory,
  getChartTypesForCategory,
} from "./chart-categories";
