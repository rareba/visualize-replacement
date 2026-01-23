/**
 * Shared Utilities for ECharts Adapters
 *
 * This module contains reusable configuration builders and helpers
 * to reduce code duplication across chart adapters and improve maintainability.
 */

import {
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";

import type {
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemReturn,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";

// Re-export axis types for adapters
export type { XAXisComponentOption, YAXisComponentOption };

// ============================================================================
// Types
// ============================================================================

export interface ChartBounds {
  width: number;
  chartHeight: number;
  margins: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface AxisLabelConfig {
  name?: string;
  nameGap?: number;
  formatter?: (value: string) => string;
}

export interface ValueAxisConfig extends AxisLabelConfig {
  min?: number;
  max?: number;
}

export interface CategoryAxisConfig extends AxisLabelConfig {
  categories: string[];
  boundaryGap?: boolean;
}

// ============================================================================
// Safe Scale Helpers
// ============================================================================

/**
 * Safely retrieves domain from a D3 scale with fallback values.
 * Handles undefined scales, NaN values, and invalid domains.
 */
export const safeGetDomain = <T = number>(
  scale: { domain: () => T[] } | undefined,
  fallback: [T, T]
): [T, T] => {
  if (!scale || typeof scale.domain !== "function") {
    return fallback;
  }
  const domain = scale.domain();
  if (!Array.isArray(domain) || domain.length < 2) {
    return fallback;
  }
  const [min, max] = domain;
  // For numeric domains, check for NaN
  if (typeof min === "number" && typeof max === "number") {
    const safeMin = Number.isFinite(min) ? min : (fallback[0] as number);
    const safeMax = Number.isFinite(max) ? max : (fallback[1] as number);
    return [safeMin as T, safeMax as T];
  }
  return [min, max];
};

/**
 * Safely retrieves numeric domain with default 0-100 fallback.
 * Works with D3 scales that return number[] from domain().
 */
export const safeGetNumericDomain = (
  scale: { domain: () => number[] } | undefined
): [number, number] => {
  if (!scale || typeof scale.domain !== "function") {
    return [0, 100];
  }
  const domain = scale.domain();
  if (!Array.isArray(domain) || domain.length < 2) {
    return [0, 100];
  }
  const [min, max] = domain;
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  return [safeMin, safeMax];
};

/**
 * Safely retrieves bounds with default fallbacks.
 */
export const safeGetBounds = (
  bounds: Partial<ChartBounds> | undefined
): ChartBounds => ({
  width: bounds?.width ?? 500,
  chartHeight: bounds?.chartHeight ?? 300,
  margins: bounds?.margins ?? { left: 60, right: 40, top: 40, bottom: 60 },
});

// ============================================================================
// Axis Configuration Builders
// ============================================================================

/**
 * Base axis label styling following Swiss Federal design system.
 */
const getBaseAxisLabelStyle = () => ({
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 12,
  color: SWISS_FEDERAL_COLORS.text,
});

/**
 * Base axis line styling following Swiss Federal design system.
 */
const getBaseAxisLineStyle = () => ({
  lineStyle: {
    color: SWISS_FEDERAL_COLORS.axis,
  },
});

/**
 * Base split line (grid) styling following Swiss Federal design system.
 */
const getBaseSplitLineStyle = () => ({
  lineStyle: {
    color: SWISS_FEDERAL_COLORS.grid,
  },
});

/**
 * Base category axis options (internal).
 */
const getCategoryAxisOptions = (config: CategoryAxisConfig) => ({
  type: "category" as const,
  data: config.categories,
  name: config.name ?? "",
  nameLocation: "middle" as const,
  nameGap: config.nameGap ?? 35,
  boundaryGap: config.boundaryGap ?? true,
  axisLabel: {
    ...getBaseAxisLabelStyle(),
    ...(config.formatter && { formatter: config.formatter }),
  },
  axisLine: getBaseAxisLineStyle(),
});

/**
 * Creates a category X axis configuration.
 */
export const createXCategoryAxis = (
  config: CategoryAxisConfig
): XAXisComponentOption => getCategoryAxisOptions(config);

/**
 * Creates a category Y axis configuration.
 */
export const createYCategoryAxis = (
  config: CategoryAxisConfig
): YAXisComponentOption => getCategoryAxisOptions(config);

/**
 * Creates a category axis configuration (for bar/column x-axis or bar y-axis).
 * @deprecated Use createXCategoryAxis or createYCategoryAxis for proper typing.
 */
export const createCategoryAxis = (
  config: CategoryAxisConfig
): XAXisComponentOption | YAXisComponentOption => getCategoryAxisOptions(config);

/**
 * Base value axis options (internal).
 */
const getValueAxisOptions = (config: ValueAxisConfig) => ({
  type: "value" as const,
  name: config.name ?? "",
  nameLocation: "middle" as const,
  nameGap: config.nameGap ?? 50,
  min: config.min,
  max: config.max,
  axisLabel: getBaseAxisLabelStyle(),
  axisLine: getBaseAxisLineStyle(),
  splitLine: getBaseSplitLineStyle(),
});

/**
 * Creates a value X axis configuration.
 */
export const createXValueAxis = (
  config: ValueAxisConfig
): XAXisComponentOption => getValueAxisOptions(config);

/**
 * Creates a value Y axis configuration.
 */
export const createYValueAxis = (
  config: ValueAxisConfig
): YAXisComponentOption => getValueAxisOptions(config);

/**
 * Creates a value axis configuration (for continuous numeric data).
 * @deprecated Use createXValueAxis or createYValueAxis for proper typing.
 */
export const createValueAxis = (
  config: ValueAxisConfig
): XAXisComponentOption | YAXisComponentOption => getValueAxisOptions(config);

// ============================================================================
// Grid Configuration
// ============================================================================

/**
 * Creates a grid configuration from chart bounds.
 */
export const createGridConfig = (
  bounds: ChartBounds,
  extraBottom = 0
) => ({
  left: bounds.margins.left,
  right: bounds.margins.right,
  top: bounds.margins.top,
  bottom: bounds.margins.bottom + extraBottom,
  containLabel: false,
});

// ============================================================================
// Tooltip Configuration
// ============================================================================

/**
 * Creates a tooltip configuration for axis-triggered tooltips (bar/column/line).
 */
export const createAxisTooltip = () => ({
  trigger: "axis" as const,
  axisPointer: {
    type: "shadow" as const,
  },
});

/**
 * Creates a tooltip configuration for item-triggered tooltips (scatter/pie).
 */
export const createItemTooltip = () => ({
  trigger: "item" as const,
});

// ============================================================================
// Legend Configuration
// ============================================================================

/**
 * Creates a legend configuration. Hidden by default as visualize handles legends separately.
 */
export const createLegend = (show = false) => ({
  show,
  textStyle: {
    fontFamily: SWISS_FEDERAL_FONT.family,
    fontSize: 12,
  },
});

// ============================================================================
// Error Whisker Rendering
// ============================================================================

type EChartsApi = {
  value: (dim: number) => number;
  coord: (point: [number, number]) => [number, number];
  size: (size: [number, number]) => [number, number];
  style: () => Record<string, unknown>;
};

/**
 * Error whisker style following Swiss Federal design.
 */
const getErrorWhiskerStyle = () => ({
  stroke: SWISS_FEDERAL_COLORS.text,
  lineWidth: 1.5,
});

/**
 * Creates a vertical error whisker renderer for column charts.
 * Data format: [xIndex, yLow, yHigh]
 */
export const renderVerticalErrorWhisker = (
  _params: CustomSeriesRenderItemParams,
  api: EChartsApi
): CustomSeriesRenderItemReturn => {
  const xValue = api.value(0);
  const yLow = api.value(1);
  const yHigh = api.value(2);

  const coordLow = api.coord([xValue, yLow]);
  const coordHigh = api.coord([xValue, yHigh]);
  const capWidth = Math.min(api.size([1, 0])[0] * 0.3, 15);

  const style = getErrorWhiskerStyle();

  return {
    type: "group",
    children: [
      // Vertical line
      {
        type: "line",
        shape: {
          x1: coordLow[0],
          y1: coordLow[1],
          x2: coordHigh[0],
          y2: coordHigh[1],
        },
        style,
      },
      // Top cap
      {
        type: "line",
        shape: {
          x1: coordHigh[0] - capWidth / 2,
          y1: coordHigh[1],
          x2: coordHigh[0] + capWidth / 2,
          y2: coordHigh[1],
        },
        style,
      },
      // Bottom cap
      {
        type: "line",
        shape: {
          x1: coordLow[0] - capWidth / 2,
          y1: coordLow[1],
          x2: coordLow[0] + capWidth / 2,
          y2: coordLow[1],
        },
        style,
      },
    ],
  };
};

/**
 * Creates a horizontal error whisker renderer for bar charts.
 * Data format: [yIndex, xLow, xHigh]
 */
export const renderHorizontalErrorWhisker = (
  _params: CustomSeriesRenderItemParams,
  api: EChartsApi
): CustomSeriesRenderItemReturn => {
  const yValue = api.value(0);
  const xLow = api.value(1);
  const xHigh = api.value(2);

  const coordLow = api.coord([xLow, yValue]);
  const coordHigh = api.coord([xHigh, yValue]);
  const capHeight = Math.min(api.size([0, 1])[1] * 0.3, 15);

  const style = getErrorWhiskerStyle();

  return {
    type: "group",
    children: [
      // Horizontal line
      {
        type: "line",
        shape: {
          x1: coordLow[0],
          y1: coordLow[1],
          x2: coordHigh[0],
          y2: coordHigh[1],
        },
        style,
      },
      // Left cap
      {
        type: "line",
        shape: {
          x1: coordLow[0],
          y1: coordLow[1] - capHeight / 2,
          x2: coordLow[0],
          y2: coordLow[1] + capHeight / 2,
        },
        style,
      },
      // Right cap
      {
        type: "line",
        shape: {
          x1: coordHigh[0],
          y1: coordHigh[1] - capHeight / 2,
          x2: coordHigh[0],
          y2: coordHigh[1] + capHeight / 2,
        },
        style,
      },
    ],
  };
};

// ============================================================================
// Data Transformation Helpers
// ============================================================================

/**
 * Groups chart data by segment for multi-series charts.
 * Returns a map of segment -> (category -> value).
 */
export const groupDataBySegment = <T, K extends string | number>(
  data: T[],
  segments: string[],
  getSegment: (d: T) => string,
  getCategory: (d: T) => K,
  getValue: (d: T) => number | null
): Map<string, Map<K, number | null>> => {
  const segmentDataMap = new Map<string, Map<K, number | null>>();

  segments.forEach((segment) => {
    segmentDataMap.set(segment, new Map());
  });

  data.forEach((d) => {
    const segment = getSegment(d);
    const category = getCategory(d);
    const value = getValue(d);
    segmentDataMap.get(segment)?.set(category, value);
  });

  return segmentDataMap;
};

/**
 * Builds series data array from a segment data map for a list of categories.
 */
export const buildSeriesDataFromMap = <K extends string | number>(
  segmentData: Map<K, number | null> | undefined,
  categories: K[]
): (number | null)[] => {
  return categories.map((category) => segmentData?.get(category) ?? null);
};

// ============================================================================
// Common Series Properties
// ============================================================================

/**
 * Default animation settings for smooth transitions.
 */
export const getDefaultAnimation = () => ({
  animationDuration: 500,
  animationEasing: "cubicOut" as const,
});

/**
 * Creates a "no data available" graphic element.
 */
export const createNoDataGraphic = () => ({
  type: "text" as const,
  left: "center" as const,
  top: "middle" as const,
  style: {
    text: "No data available",
    fontSize: 14,
    fontFamily: SWISS_FEDERAL_FONT.family,
    fill: SWISS_FEDERAL_COLORS.text,
  },
});

// ============================================================================
// Dimension Calculations
// ============================================================================

/**
 * Calculates chart container dimensions from bounds.
 */
export const calculateChartDimensions = (
  bounds: ChartBounds | undefined,
  extraHeight = 0
) => {
  const safeBounds = safeGetBounds(bounds);
  return {
    width: safeBounds.width,
    height: safeBounds.chartHeight + safeBounds.margins.top + safeBounds.margins.bottom + extraHeight,
  };
};
