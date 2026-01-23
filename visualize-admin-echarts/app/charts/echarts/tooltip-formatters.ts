/**
 * Tooltip Formatters
 *
 * Factory functions for creating ECharts tooltip formatters.
 * Provides consistent, reusable tooltip formatting across chart types.
 */

import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";

// ============================================================================
// Types
// ============================================================================

interface BaseTooltipParam {
  seriesName: string;
  name: string;
  value: number | null | [number, number | null];
  marker: string;
  color: string;
  dataIndex: number;
  percent?: number;
}

type ValueFormatter = (value: number) => string;
type LabelFormatter = (name: string) => string;

// ============================================================================
// Tooltip Configuration Factories
// ============================================================================

export interface TooltipConfig {
  trigger: "axis" | "item";
  formatter?: (params: unknown) => string;
  backgroundColor?: string;
  borderColor?: string;
  textStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
  axisPointer?: {
    type: "line" | "cross" | "shadow";
    crossStyle?: { color: string };
    lineStyle?: { color: string };
  };
}

/**
 * Creates base tooltip configuration with Swiss Federal styling.
 */
export const createBaseTooltipConfig = (): Partial<TooltipConfig> => ({
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderColor: SWISS_FEDERAL_COLORS.grid,
  textStyle: {
    fontFamily: SWISS_FEDERAL_FONT.family,
    fontSize: 12,
    color: SWISS_FEDERAL_COLORS.text,
  },
});

// ============================================================================
// Axis-Trigger Tooltip Formatters
// ============================================================================

/**
 * Creates a formatter for category-based charts (bar, column).
 * Shows category name and all series values.
 */
export const createCategoryTooltipFormatter = (
  valueFormatter?: ValueFormatter,
  labelFormatter?: LabelFormatter
) => {
  return (params: unknown): string => {
    const paramArray = normalizeTooltipParams(params);
    if (paramArray.length === 0) return "";

    const categoryName = labelFormatter
      ? labelFormatter(paramArray[0].name)
      : paramArray[0].name;

    let result = `<strong>${escapeHtml(categoryName)}</strong><br/>`;

    paramArray.forEach((param) => {
      const value = extractValue(param.value);
      if (value !== null) {
        const formattedValue = valueFormatter ? valueFormatter(value) : value;
        result += `${param.marker} ${escapeHtml(param.seriesName)}: ${formattedValue}<br/>`;
      }
    });

    return result;
  };
};

/**
 * Creates a formatter for time-series charts (line, area).
 * Shows date and all series values.
 */
export const createTimeSeriesFormatter = (
  dateFormatter?: (date: Date) => string,
  valueFormatter?: ValueFormatter
) => {
  return (params: unknown): string => {
    const paramArray = normalizeTooltipParams(params);
    if (paramArray.length === 0) return "";

    // Extract timestamp from first param
    const timestamp = extractTimestamp(paramArray[0].value);
    const date = timestamp ? new Date(timestamp) : new Date();
    const formattedDate = dateFormatter
      ? dateFormatter(date)
      : date.toLocaleDateString();

    let result = `<strong>${formattedDate}</strong><br/>`;

    paramArray.forEach((param) => {
      const value = extractTimeSeriesValue(param.value);
      if (value !== null) {
        const formattedValue = valueFormatter ? valueFormatter(value) : value;
        const name = param.seriesName || param.name;
        if (name) {
          result += `${param.marker} ${escapeHtml(name)}: ${formattedValue}<br/>`;
        }
      }
    });

    return result;
  };
};

/**
 * Creates a formatter for scatter charts.
 * Shows point coordinates and optional label.
 */
export const createScatterTooltipFormatter = (
  xLabel: string,
  yLabel: string,
  xFormatter?: ValueFormatter,
  yFormatter?: ValueFormatter
) => {
  return (params: unknown): string => {
    const param = normalizeSingleParam(params);
    if (!param) return "";

    const [x, y] = extractScatterValue(param.value);
    if (x === null || y === null) return "";

    const formattedX = xFormatter ? xFormatter(x) : x;
    const formattedY = yFormatter ? yFormatter(y) : y;

    let result = "";

    if (param.seriesName) {
      result += `<strong>${escapeHtml(param.seriesName)}</strong><br/>`;
    }

    result += `${escapeHtml(xLabel)}: ${formattedX}<br/>`;
    result += `${escapeHtml(yLabel)}: ${formattedY}`;

    return result;
  };
};

// ============================================================================
// Item-Trigger Tooltip Formatters
// ============================================================================

/**
 * Creates a formatter for pie charts.
 * Shows segment name, value, and percentage.
 */
export const createPieTooltipFormatter = (valueFormatter?: ValueFormatter) => {
  return (params: unknown): string => {
    const param = normalizeSingleParam(params);
    if (!param) return "";

    const value = extractValue(param.value);
    if (value === null) return "";

    const formattedValue = valueFormatter ? valueFormatter(value) : value;
    const percent = param.percent?.toFixed(1) ?? "0";

    return `${param.marker} ${escapeHtml(param.name)}: ${formattedValue} (${percent}%)`;
  };
};

/**
 * Creates a formatter for single-value items.
 */
export const createItemTooltipFormatter = (valueFormatter?: ValueFormatter) => {
  return (params: unknown): string => {
    const param = normalizeSingleParam(params);
    if (!param) return "";

    const value = extractValue(param.value);
    if (value === null) return "";

    const formattedValue = valueFormatter ? valueFormatter(value) : value;

    return `${param.marker} ${escapeHtml(param.name)}: ${formattedValue}`;
  };
};

// ============================================================================
// Dual-Axis Tooltip Formatters
// ============================================================================

/**
 * Creates a formatter for dual-axis combo charts with categories.
 */
export const createDualAxisCategoryFormatter = (
  categories: string[],
  leftFormatter?: ValueFormatter,
  rightFormatter?: ValueFormatter
) => {
  return (params: unknown): string => {
    const paramArray = normalizeTooltipParams(params);
    if (paramArray.length === 0) return "";

    const category = categories[paramArray[0].dataIndex] ?? "";
    let result = `<strong>${escapeHtml(category)}</strong><br/>`;

    paramArray.forEach((param, index) => {
      const value = extractValue(param.value);
      if (value !== null) {
        const formatter = index === 0 ? leftFormatter : rightFormatter;
        const formattedValue = formatter ? formatter(value) : value;
        result += `${param.marker} ${escapeHtml(param.seriesName)}: ${formattedValue}<br/>`;
      }
    });

    return result;
  };
};

/**
 * Creates a formatter for dual-axis time-series combo charts.
 */
export const createDualAxisTimeFormatter = (
  dateFormatter?: (date: Date) => string,
  leftFormatter?: ValueFormatter,
  rightFormatter?: ValueFormatter
) => {
  return (params: unknown): string => {
    const paramArray = normalizeTooltipParams(params);
    if (paramArray.length === 0) return "";

    const timestamp = extractTimestamp(paramArray[0].value);
    const date = timestamp ? new Date(timestamp) : new Date();
    const formattedDate = dateFormatter
      ? dateFormatter(date)
      : date.toLocaleDateString();

    let result = `<strong>${formattedDate}</strong><br/>`;

    paramArray.forEach((param, index) => {
      const value = extractTimeSeriesValue(param.value);
      if (value !== null) {
        const formatter = index === 0 ? leftFormatter : rightFormatter;
        const formattedValue = formatter ? formatter(value) : value;
        result += `${param.marker} ${escapeHtml(param.seriesName)}: ${formattedValue}<br/>`;
      }
    });

    return result;
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes tooltip params to an array.
 */
const normalizeTooltipParams = (params: unknown): BaseTooltipParam[] => {
  if (!params) return [];
  if (Array.isArray(params)) return params as BaseTooltipParam[];
  return [params as BaseTooltipParam];
};

/**
 * Gets a single tooltip param.
 */
const normalizeSingleParam = (params: unknown): BaseTooltipParam | null => {
  if (!params) return null;
  if (Array.isArray(params)) return params[0] as BaseTooltipParam;
  return params as BaseTooltipParam;
};

/**
 * Extracts numeric value from various formats.
 */
const extractValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return value[1] as number | null;
  if (typeof value === "object" && "value" in value) {
    return (value as { value: number | null }).value;
  }
  return null;
};

/**
 * Extracts timestamp from time-series value.
 */
const extractTimestamp = (value: unknown): number | null => {
  if (Array.isArray(value) && typeof value[0] === "number") {
    return value[0];
  }
  return null;
};

/**
 * Extracts Y value from time-series [timestamp, value] format.
 */
const extractTimeSeriesValue = (value: unknown): number | null => {
  if (Array.isArray(value) && value.length >= 2) {
    return value[1] as number | null;
  }
  if (typeof value === "number") {
    return value;
  }
  return null;
};

/**
 * Extracts scatter point [x, y] values.
 */
const extractScatterValue = (value: unknown): [number | null, number | null] => {
  if (Array.isArray(value) && value.length >= 2) {
    return [value[0] as number | null, value[1] as number | null];
  }
  return [null, null];
};

/**
 * Escapes HTML special characters.
 */
const escapeHtml = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ============================================================================
// Pre-built Formatters
// ============================================================================

/**
 * Default number formatter with thousand separators.
 */
export const defaultNumberFormatter: ValueFormatter = (value) => {
  return value.toLocaleString();
};

/**
 * Percentage formatter.
 */
export const percentFormatter: ValueFormatter = (value) => {
  return `${value.toFixed(1)}%`;
};

/**
 * Currency formatter (CHF).
 */
export const chfFormatter: ValueFormatter = (value) => {
  return `CHF ${value.toLocaleString()}`;
};

/**
 * Compact number formatter (K, M, B).
 */
export const compactFormatter: ValueFormatter = (value) => {
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(0);
};
