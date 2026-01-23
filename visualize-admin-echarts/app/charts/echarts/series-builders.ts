/**
 * Series Builders
 *
 * Factory functions for creating ECharts series configurations.
 * These provide consistent, type-safe ways to build series with Swiss Federal styling.
 */

import { SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";

import type {
  BarSeriesOption,
  CustomSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  ScatterSeriesOption,
} from "echarts";

// ============================================================================
// Types
// ============================================================================

// ECharts animation easing values
type AnimationEasing = "linear" | "quadraticIn" | "quadraticOut" | "quadraticInOut" |
  "cubicIn" | "cubicOut" | "cubicInOut" | "quarticIn" | "quarticOut" | "quarticInOut" |
  "quinticIn" | "quinticOut" | "quinticInOut" | "sinusoidalIn" | "sinusoidalOut" |
  "sinusoidalInOut" | "exponentialIn" | "exponentialOut" | "exponentialInOut" |
  "circularIn" | "circularOut" | "circularInOut" | "elasticIn" | "elasticOut" |
  "elasticInOut" | "backIn" | "backOut" | "backInOut" | "bounceIn" | "bounceOut" | "bounceInOut";

export interface SeriesBaseConfig {
  name?: string;
  color?: string;
  animationDuration?: number;
  animationEasing?: AnimationEasing;
}

export interface BarSeriesConfig extends SeriesBaseConfig {
  data: Array<number | null | { value: number | null; itemStyle?: { color: string } }>;
  stack?: string;
  barMaxWidth?: number;
  yAxisIndex?: number;
  showLabel?: boolean;
  labelPosition?: "top" | "right" | "inside";
  labelRotate?: number;
}

export interface LineSeriesConfig extends SeriesBaseConfig {
  data: Array<number | null | [number, number | null]>;
  yAxisIndex?: number;
  showSymbol?: boolean;
  symbolSize?: number;
  lineWidth?: number;
  smooth?: boolean;
  stack?: string;
  areaStyle?: boolean | { opacity: number };
  connectNulls?: boolean;
}

export interface ScatterSeriesConfig extends SeriesBaseConfig {
  data: Array<[number, number]>;
  symbolSize?: number;
}

export interface PieSeriesConfig extends SeriesBaseConfig {
  data: Array<{ name: string; value: number; itemStyle?: { color: string } }>;
  radius?: [string, string];
  center?: [string, string];
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  startAngle?: number;
}

// ============================================================================
// Default Animation
// ============================================================================

const DEFAULT_ANIMATION = {
  animationDuration: 500,
  animationEasing: "cubicOut" as const,
};

// ============================================================================
// Bar Series Builder
// ============================================================================

/**
 * Creates a bar series configuration.
 */
export const createBarSeries = (config: BarSeriesConfig): BarSeriesOption => {
  const {
    name = "",
    data,
    color = SWISS_FEDERAL_COLORS.palette[0],
    stack,
    barMaxWidth,
    yAxisIndex,
    showLabel = false,
    labelPosition = "top",
    labelRotate = 0,
    animationDuration = DEFAULT_ANIMATION.animationDuration,
    animationEasing = DEFAULT_ANIMATION.animationEasing,
  } = config;

  return {
    name,
    type: "bar",
    data,
    stack,
    barMaxWidth,
    yAxisIndex,
    itemStyle: {
      color,
    },
    label: showLabel
      ? {
          show: true,
          position: labelPosition,
          rotate: labelRotate,
          fontSize: 11,
        }
      : undefined,
    emphasis: stack
      ? {
          focus: "series",
        }
      : undefined,
    animationDuration,
    animationEasing,
  };
};

/**
 * Creates multiple bar series for grouped/stacked charts.
 */
export const createBarSeriesGroup = (
  segments: string[],
  getData: (segment: string) => Array<number | null>,
  getColor: (segment: string) => string,
  options: {
    stack?: string;
    barMaxWidth?: number;
  } = {}
): BarSeriesOption[] => {
  return segments.map((segment) =>
    createBarSeries({
      name: segment,
      data: getData(segment),
      color: getColor(segment),
      stack: options.stack,
      barMaxWidth: options.barMaxWidth,
    })
  );
};

// ============================================================================
// Line Series Builder
// ============================================================================

/**
 * Creates a line series configuration.
 */
export const createLineSeries = (config: LineSeriesConfig): LineSeriesOption => {
  const {
    name = "",
    data,
    color = SWISS_FEDERAL_COLORS.palette[0],
    yAxisIndex,
    showSymbol = true,
    symbolSize = 6,
    lineWidth = 2,
    smooth = false,
    stack,
    areaStyle,
    connectNulls = false,
    animationDuration = DEFAULT_ANIMATION.animationDuration,
    animationEasing = DEFAULT_ANIMATION.animationEasing,
  } = config;

  const areaStyleConfig = areaStyle
    ? typeof areaStyle === "object"
      ? areaStyle
      : { opacity: 0.7 }
    : undefined;

  return {
    name,
    type: "line",
    data,
    yAxisIndex,
    symbol: showSymbol ? "circle" : "none",
    symbolSize,
    smooth,
    stack,
    connectNulls,
    lineStyle: {
      width: lineWidth,
      color,
    },
    itemStyle: {
      color,
    },
    areaStyle: areaStyleConfig,
    animationDuration,
    animationEasing,
  };
};

/**
 * Creates multiple line series for multi-line charts.
 */
export const createLineSeriesGroup = (
  segments: string[],
  getData: (segment: string) => Array<number | null | [number, number | null]>,
  getColor: (segment: string) => string,
  options: {
    stack?: string;
    areaStyle?: boolean | { opacity: number };
    smooth?: boolean;
    lineWidth?: number;
  } = {}
): LineSeriesOption[] => {
  return segments.map((segment) =>
    createLineSeries({
      name: segment,
      data: getData(segment),
      color: getColor(segment),
      stack: options.stack,
      areaStyle: options.areaStyle,
      smooth: options.smooth,
      lineWidth: options.lineWidth,
    })
  );
};

// ============================================================================
// Scatter Series Builder
// ============================================================================

/**
 * Creates a scatter series configuration.
 */
export const createScatterSeries = (
  config: ScatterSeriesConfig
): ScatterSeriesOption => {
  const {
    name = "",
    data,
    color = SWISS_FEDERAL_COLORS.palette[0],
    symbolSize = 10,
    animationDuration = DEFAULT_ANIMATION.animationDuration,
    animationEasing = DEFAULT_ANIMATION.animationEasing,
  } = config;

  return {
    name,
    type: "scatter",
    data,
    symbolSize,
    itemStyle: {
      color,
    },
    animationDuration,
    animationEasing,
  };
};

/**
 * Creates multiple scatter series for segmented scatterplots.
 */
export const createScatterSeriesGroup = (
  segments: string[],
  getData: (segment: string) => Array<[number, number]>,
  getColor: (segment: string) => string,
  options: {
    symbolSize?: number;
  } = {}
): ScatterSeriesOption[] => {
  return segments.map((segment) =>
    createScatterSeries({
      name: segment,
      data: getData(segment),
      color: getColor(segment),
      symbolSize: options.symbolSize,
    })
  );
};

// ============================================================================
// Pie Series Builder
// ============================================================================

/**
 * Creates a pie series configuration with Swiss Federal styling.
 */
export const createPieSeries = (config: PieSeriesConfig): PieSeriesOption => {
  const {
    data,
    radius = ["0%", "70%"],
    center = ["50%", "50%"],
    showLabel = true,
    labelPosition = "inside",
    startAngle = 90,
    animationDuration = DEFAULT_ANIMATION.animationDuration,
    animationEasing = DEFAULT_ANIMATION.animationEasing,
  } = config;

  return {
    type: "pie",
    radius,
    center,
    data,
    startAngle,
    label: {
      show: showLabel,
      position: labelPosition,
      fontSize: 11,
      color: labelPosition === "inside" ? "#fff" : SWISS_FEDERAL_COLORS.text,
    },
    labelLine: {
      show: labelPosition === "outside" && showLabel,
      length: 15,
      length2: 25,
      smooth: 0.2,
      lineStyle: {
        color: SWISS_FEDERAL_COLORS.axis,
        width: 1,
      },
    },
    emphasis: {
      scale: true,
      scaleSize: 8,
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: "rgba(0, 0, 0, 0.3)",
      },
    },
    avoidLabelOverlap: true,
    animationDuration,
    animationEasing,
    animationType: "expansion",
  };
};

// ============================================================================
// Area Series Builder (Line with areaStyle)
// ============================================================================

/**
 * Creates an area series (line with fill).
 */
export const createAreaSeries = (
  config: Omit<LineSeriesConfig, "areaStyle"> & { opacity?: number }
): LineSeriesOption => {
  const { opacity = 0.7, ...rest } = config;
  return createLineSeries({
    ...rest,
    areaStyle: { opacity },
    showSymbol: false,
    smooth: true,
    lineWidth: 1,
  });
};

/**
 * Creates multiple area series for stacked area charts.
 */
export const createAreaSeriesGroup = (
  segments: string[],
  getData: (segment: string) => Array<number | null>,
  getColor: (segment: string) => string,
  options: {
    stack?: string;
    opacity?: number;
  } = {}
): LineSeriesOption[] => {
  return segments.map((segment) =>
    createAreaSeries({
      name: segment,
      data: getData(segment),
      color: getColor(segment),
      stack: options.stack,
      opacity: options.opacity,
    })
  );
};

// ============================================================================
// Custom Series Builder (for error whiskers, etc.)
// ============================================================================

export interface CustomSeriesConfig {
  data: CustomSeriesOption["data"];
  renderItem: CustomSeriesOption["renderItem"];
  z?: number;
}

/**
 * Creates a custom series for advanced rendering like error whiskers.
 */
export const createCustomSeries = (config: CustomSeriesConfig): CustomSeriesOption => ({
  type: "custom",
  data: config.data,
  renderItem: config.renderItem,
  z: config.z ?? 10,
});
