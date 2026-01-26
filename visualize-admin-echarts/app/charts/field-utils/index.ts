/**
 * Field Utilities
 *
 * Utilities for working with chart configuration fields.
 * Extracts component IDs, grouped fields, hidden fields, and chart symbols.
 */

import type { ChartConfig, ChartType, GenericFields } from "@/config-types";

/**
 * Gets all component IDs from a chart's fields configuration.
 */
export const getFieldComponentIds = (fields: ChartConfig["fields"]) => {
  return new Set(
    Object.values(fields).flatMap((f) =>
      f?.componentId ? [f.componentId] : []
    )
  );
};

/**
 * Gets component IDs for fields that are marked as grouped.
 */
export const getGroupedFieldIds = (fields: GenericFields) => {
  return new Set(
    Object.values(fields).flatMap((f) =>
      f && (f as $IntentionalAny).isGroup ? [f.componentId] : []
    )
  );
};

/**
 * Gets component IDs for fields that are marked as hidden.
 */
export const getHiddenFieldIds = (fields: GenericFields) => {
  return new Set(
    Object.values(fields).flatMap((f) =>
      f && (f as $IntentionalAny).isHidden ? [f.componentId] : []
    )
  );
};

/**
 * Gets the component ID for a specific field in a chart config.
 */
export const getFieldComponentId = (
  fields: ChartConfig["fields"],
  field: string
): string | undefined => {
  // Multi axis charts have multiple component ids in the y field.
  return (fields as $IntentionalAny)[field]?.componentId;
};

/**
 * Gets the appropriate symbol type for a chart type.
 * Used in legends and other UI elements.
 */
export const getChartSymbol = (
  chartType: ChartType
): "square" | "line" | "circle" => {
  switch (chartType) {
    case "area":
    case "column":
    case "bar":
    case "comboLineColumn":
    case "pie":
    case "donut":
    case "heatmap":
    case "map":
    case "table":
    case "boxplot":
    case "waterfall":
    case "bar3d":
    case "pie3d":
    case "surface":
    case "candlestick":
      return "square";
    case "comboLineDual":
    case "comboLineSingle":
    case "line":
    case "radar":
    case "line3d":
    case "themeriver":
      return "line";
    case "scatterplot":
    case "scatter3d":
    case "globe":
      return "circle";
    default:
      const _exhaustiveCheck: never = chartType;
      return _exhaustiveCheck;
  }
};
