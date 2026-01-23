/**
 * Dual Axis Utilities
 *
 * Utilities for creating dual Y-axis configurations used in combo charts.
 */

import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";

import type { YAXisComponentOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

export interface DualYAxisConfig {
  left: {
    name: string;
    min: number;
    max: number;
    color?: string;
  };
  right: {
    name: string;
    min: number;
    max: number;
    color?: string;
  };
}

// ============================================================================
// Base Dual Axis Style
// ============================================================================

const getBaseDualAxisStyle = () => ({
  type: "value" as const,
  nameLocation: "middle" as const,
  nameGap: 50,
  axisLabel: {
    fontFamily: SWISS_FEDERAL_FONT.family,
    fontSize: 12,
    color: SWISS_FEDERAL_COLORS.text,
  },
});

// ============================================================================
// Dual Y-Axis Builder
// ============================================================================

/**
 * Creates a dual Y-axis configuration for combo charts.
 * Left axis shows grid lines, right axis does not (to avoid visual clutter).
 */
export const createDualYAxis = (
  config: DualYAxisConfig
): [YAXisComponentOption, YAXisComponentOption] => {
  const { left, right } = config;

  const leftAxis: YAXisComponentOption = {
    ...getBaseDualAxisStyle(),
    name: left.name,
    position: "left",
    min: left.min,
    max: left.max,
    axisLine: {
      show: true,
      lineStyle: {
        color: left.color ?? SWISS_FEDERAL_COLORS.axis,
      },
    },
    splitLine: {
      lineStyle: {
        color: SWISS_FEDERAL_COLORS.grid,
      },
    },
  };

  const rightAxis: YAXisComponentOption = {
    ...getBaseDualAxisStyle(),
    name: right.name,
    position: "right",
    min: right.min,
    max: right.max,
    axisLine: {
      show: true,
      lineStyle: {
        color: right.color ?? SWISS_FEDERAL_COLORS.axis,
      },
    },
    splitLine: {
      show: false, // Only show grid lines from left axis
    },
  };

  return [leftAxis, rightAxis];
};

// ============================================================================
// Time X-Axis Builder
// ============================================================================

export interface TimeAxisConfig {
  name?: string;
  nameGap?: number;
  min: number; // timestamp
  max: number; // timestamp
}

/**
 * Creates a time-based X-axis configuration.
 */
export const createTimeAxis = (config: TimeAxisConfig) => ({
  type: "time" as const,
  name: config.name ?? "",
  nameLocation: "middle" as const,
  nameGap: config.nameGap ?? 35,
  min: config.min,
  max: config.max,
  axisLabel: {
    fontFamily: SWISS_FEDERAL_FONT.family,
    fontSize: 12,
    color: SWISS_FEDERAL_COLORS.text,
  },
  axisLine: {
    lineStyle: {
      color: SWISS_FEDERAL_COLORS.axis,
    },
  },
});

// ============================================================================
// Cross Tooltip Builder
// ============================================================================

/**
 * Creates a cross-style tooltip for combo charts.
 */
export const createCrossTooltip = () => ({
  trigger: "axis" as const,
  axisPointer: {
    type: "cross" as const,
    crossStyle: {
      color: SWISS_FEDERAL_COLORS.grid,
    },
  },
});

// ============================================================================
// Combo Chart Grid Builder
// ============================================================================

export interface ComboGridConfig {
  left: number;
  right: number;
  top: number;
  bottom: number;
  extraRight?: number; // For right axis tick labels
}

/**
 * Creates a grid configuration for combo charts with extra right margin for dual axis.
 */
export const createComboGrid = (config: ComboGridConfig) => ({
  left: config.left,
  right: config.right + (config.extraRight ?? 0),
  top: config.top,
  bottom: config.bottom,
  containLabel: false,
});

// ============================================================================
// Tooltip Formatters
// ============================================================================

/**
 * Creates a tooltip formatter for category-based combo charts.
 */
export const createCategoryComboTooltipFormatter =
  (categories: string[]) => (params: unknown) => {
    const paramArray = params as Array<{
      seriesName: string;
      value: number | null;
      marker: string;
      dataIndex: number;
    }>;

    if (!Array.isArray(paramArray) || paramArray.length === 0) return "";

    let result = `<strong>${categories[paramArray[0]?.dataIndex ?? 0]}</strong><br/>`;
    paramArray.forEach((param) => {
      if (param.value !== null && param.value !== undefined) {
        result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
      }
    });
    return result;
  };

/**
 * Creates a tooltip formatter for time-based combo charts.
 */
export const createTimeComboTooltipFormatter = () => (params: unknown) => {
  const paramArray = params as Array<{
    seriesName: string;
    value: [number, number | null];
    marker: string;
  }>;

  if (!Array.isArray(paramArray) || paramArray.length === 0) return "";

  const date = new Date(paramArray[0]?.value?.[0] ?? 0);
  let result = `<strong>${date.toLocaleDateString()}</strong><br/>`;
  paramArray.forEach((param) => {
    const value = param.value?.[1];
    if (value !== null && value !== undefined) {
      result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
    }
  });
  return result;
};
