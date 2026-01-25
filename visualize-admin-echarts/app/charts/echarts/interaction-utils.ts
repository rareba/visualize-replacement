/**
 * Shared Interaction, Animation, Responsive, and Validation Utilities
 *
 * This module provides reusable utilities for:
 * - Chart interactions (click, hover, brush)
 * - Coordinated animations
 * - Responsive sizing
 * - Runtime data validation
 */

import type { ECharts, EChartsOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

export interface ChartInteractionEvent {
  componentType: "series" | "xAxis" | "yAxis" | "grid" | "legend";
  seriesType?: string;
  seriesIndex?: number;
  seriesName?: string;
  name?: string;
  dataIndex?: number;
  data?: unknown;
  value?: unknown;
  event?: MouseEvent;
}

export interface BrushSelection {
  type: "rect" | "polygon" | "lineX" | "lineY";
  areas: Array<{
    brushType: string;
    coordRange: number[][];
    coordRanges?: number[][][];
  }>;
}

export interface ResponsiveBreakpoint {
  minWidth: number;
  config: Partial<EChartsOption>;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Interaction Utilities
// ============================================================================

/**
 * Creates a click handler for ECharts that extracts relevant data.
 * Use this to handle series clicks with type-safe extraction.
 */
export const createClickHandler = <T = unknown>(
  chart: ECharts,
  callback: (data: T, event: ChartInteractionEvent) => void
) => {
  const handler = (params: ChartInteractionEvent) => {
    if (params.componentType === "series" && params.data !== undefined) {
      callback(params.data as T, params);
    }
  };

  chart.on("click", handler);

  // Return cleanup function
  return () => {
    chart.off("click", handler);
  };
};

/**
 * Creates a hover handler for ECharts with debouncing.
 */
export const createHoverHandler = <T = unknown>(
  chart: ECharts,
  callback: (data: T | null, event: ChartInteractionEvent | null) => void,
  debounceMs = 50
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const mouseoverHandler = (params: ChartInteractionEvent) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (params.componentType === "series" && params.data !== undefined) {
        callback(params.data as T, params);
      }
    }, debounceMs);
  };

  const mouseoutHandler = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(null, null);
    }, debounceMs);
  };

  chart.on("mouseover", mouseoverHandler);
  chart.on("mouseout", mouseoutHandler);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    chart.off("mouseover", mouseoverHandler);
    chart.off("mouseout", mouseoutHandler);
  };
};

/**
 * Creates a brush selection handler for range selection.
 */
export const createBrushHandler = (
  chart: ECharts,
  callback: (selection: BrushSelection | null) => void
) => {
  const brushSelectedHandler = (params: { batch?: BrushSelection[] }) => {
    if (params.batch && params.batch.length > 0) {
      callback(params.batch[0]);
    }
  };

  const brushEndHandler = (params: BrushSelection) => {
    if (params.areas && params.areas.length > 0) {
      callback(params);
    } else {
      callback(null);
    }
  };

  chart.on("brushSelected", brushSelectedHandler);
  chart.on("brushEnd", brushEndHandler);

  return () => {
    chart.off("brushSelected", brushSelectedHandler);
    chart.off("brushEnd", brushEndHandler);
  };
};

/**
 * Highlights a specific series/data point programmatically.
 */
export const highlightSeries = (
  chart: ECharts,
  options: {
    seriesIndex?: number;
    seriesName?: string;
    dataIndex?: number;
    name?: string;
  }
) => {
  chart.dispatchAction({
    type: "highlight",
    ...options,
  });
};

/**
 * Removes highlight from series/data point.
 */
export const downplaySeries = (
  chart: ECharts,
  options: {
    seriesIndex?: number;
    seriesName?: string;
    dataIndex?: number;
    name?: string;
  }
) => {
  chart.dispatchAction({
    type: "downplay",
    ...options,
  });
};

/**
 * Shows tooltip at a specific data point.
 */
export const showTooltipAt = (
  chart: ECharts,
  options: {
    seriesIndex?: number;
    dataIndex?: number;
    position?: [number, number];
  }
) => {
  chart.dispatchAction({
    type: "showTip",
    ...options,
  });
};

/**
 * Hides the currently shown tooltip.
 */
export const hideTooltip = (chart: ECharts) => {
  chart.dispatchAction({
    type: "hideTip",
  });
};

// ============================================================================
// Coordinated Animation Utilities
// ============================================================================

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number | ((dataIndex: number) => number);
}

/**
 * Default animation configurations for different chart types.
 */
export const ANIMATION_PRESETS = {
  /** Fast fade-in for simple data updates */
  fast: {
    duration: 200,
    easing: "linear",
  },
  /** Standard smooth animation */
  standard: {
    duration: 500,
    easing: "cubicOut",
  },
  /** Slower animation for emphasis */
  emphasis: {
    duration: 750,
    easing: "elasticOut",
  },
  /** Staggered animation for multi-series */
  staggered: {
    duration: 400,
    easing: "cubicOut",
    delay: (idx: number) => idx * 50,
  },
  /** No animation for immediate updates */
  none: {
    duration: 0,
    easing: "linear",
  },
} as const;

/**
 * Creates animation config for a series with optional staggering.
 */
export const createSeriesAnimation = (
  preset: keyof typeof ANIMATION_PRESETS = "standard",
  seriesIndex = 0
): AnimationConfig => {
  const base = ANIMATION_PRESETS[preset];
  return {
    ...base,
    delay: typeof base.delay === "function"
      ? (dataIndex: number) => base.delay(dataIndex) + seriesIndex * 100
      : seriesIndex * 100,
  };
};

/**
 * Applies coordinated animation to multiple series.
 * Each series starts slightly after the previous one for a cascading effect.
 */
export const createCoordinatedAnimation = (
  seriesCount: number,
  basePreset: keyof typeof ANIMATION_PRESETS = "standard",
  staggerMs = 100
): AnimationConfig[] => {
  const base = ANIMATION_PRESETS[basePreset];
  return Array.from({ length: seriesCount }, (_, i) => ({
    duration: base.duration,
    easing: base.easing,
    delay: i * staggerMs,
  }));
};

/**
 * Creates enter animation for new data points.
 */
export const createEnterAnimation = () => ({
  animationDuration: 500,
  animationEasing: "cubicOut",
  animationDurationUpdate: 300,
  animationEasingUpdate: "cubicInOut",
});

/**
 * Creates exit animation for removed data points.
 */
export const createExitAnimation = () => ({
  animationDuration: 300,
  animationEasing: "cubicIn",
});

// ============================================================================
// Responsive Sizing Utilities
// ============================================================================

/**
 * Default responsive breakpoints following common device widths.
 */
export const RESPONSIVE_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1280,
} as const;

/**
 * Gets the current breakpoint name based on container width.
 */
export const getBreakpoint = (width: number): keyof typeof RESPONSIVE_BREAKPOINTS | "xlarge" => {
  if (width < RESPONSIVE_BREAKPOINTS.mobile) return "mobile";
  if (width < RESPONSIVE_BREAKPOINTS.tablet) return "tablet";
  if (width < RESPONSIVE_BREAKPOINTS.desktop) return "desktop";
  if (width < RESPONSIVE_BREAKPOINTS.large) return "large";
  return "xlarge";
};

/**
 * Calculates optimal chart margins based on container size.
 */
export const calculateResponsiveMargins = (
  containerWidth: number,
  containerHeight: number
) => {
  const breakpoint = getBreakpoint(containerWidth);

  const marginConfigs = {
    mobile: { left: 40, right: 20, top: 30, bottom: 40 },
    tablet: { left: 50, right: 30, top: 35, bottom: 50 },
    desktop: { left: 60, right: 40, top: 40, bottom: 60 },
    large: { left: 70, right: 50, top: 45, bottom: 70 },
    xlarge: { left: 80, right: 60, top: 50, bottom: 80 },
  };

  return marginConfigs[breakpoint];
};

/**
 * Calculates optimal font sizes based on container size.
 */
export const calculateResponsiveFontSizes = (containerWidth: number) => {
  const breakpoint = getBreakpoint(containerWidth);

  const fontConfigs = {
    mobile: { label: 10, axis: 9, title: 14, legend: 10 },
    tablet: { label: 11, axis: 10, title: 15, legend: 11 },
    desktop: { label: 12, axis: 11, title: 16, legend: 12 },
    large: { label: 13, axis: 12, title: 18, legend: 13 },
    xlarge: { label: 14, axis: 13, title: 20, legend: 14 },
  };

  return fontConfigs[breakpoint];
};

/**
 * Calculates optimal symbol/marker sizes based on container size.
 */
export const calculateResponsiveSymbolSize = (
  containerWidth: number,
  dataPointCount: number
) => {
  const breakpoint = getBreakpoint(containerWidth);

  // Base sizes per breakpoint
  const baseSizes = {
    mobile: 4,
    tablet: 6,
    desktop: 8,
    large: 10,
    xlarge: 12,
  };

  const baseSize = baseSizes[breakpoint];

  // Reduce size for large datasets to avoid overlap
  if (dataPointCount > 500) return Math.max(2, baseSize * 0.5);
  if (dataPointCount > 200) return Math.max(3, baseSize * 0.7);
  if (dataPointCount > 100) return Math.max(4, baseSize * 0.85);

  return baseSize;
};

/**
 * Determines whether to show axis labels based on available space.
 */
export const shouldShowAxisLabels = (
  containerWidth: number,
  labelCount: number,
  avgLabelLength: number
): boolean => {
  const estimatedLabelWidth = avgLabelLength * 7; // ~7px per character
  const totalLabelWidth = labelCount * estimatedLabelWidth;
  const availableWidth = containerWidth * 0.8; // 80% of container for labels

  return totalLabelWidth <= availableWidth;
};

/**
 * Calculates optimal axis label rotation based on space constraints.
 */
export const calculateAxisLabelRotation = (
  containerWidth: number,
  labelCount: number,
  avgLabelLength: number
): number => {
  const estimatedLabelWidth = avgLabelLength * 7;
  const spacePerLabel = containerWidth / labelCount;

  if (spacePerLabel >= estimatedLabelWidth * 1.2) return 0;
  if (spacePerLabel >= estimatedLabelWidth * 0.8) return -30;
  if (spacePerLabel >= estimatedLabelWidth * 0.5) return -45;
  return -90;
};

/**
 * Applies responsive configuration to an ECharts option.
 */
export const applyResponsiveConfig = (
  option: EChartsOption,
  containerWidth: number,
  containerHeight: number
): EChartsOption => {
  const margins = calculateResponsiveMargins(containerWidth, containerHeight);
  const fonts = calculateResponsiveFontSizes(containerWidth);

  return {
    ...option,
    grid: {
      ...(option.grid as object || {}),
      left: margins.left,
      right: margins.right,
      top: margins.top,
      bottom: margins.bottom,
    },
    xAxis: Array.isArray(option.xAxis)
      ? option.xAxis.map(axis => ({
          ...axis,
          axisLabel: {
            ...(axis.axisLabel as object || {}),
            fontSize: fonts.axis,
          },
        }))
      : option.xAxis
        ? {
            ...option.xAxis,
            axisLabel: {
              ...(option.xAxis.axisLabel as object || {}),
              fontSize: fonts.axis,
            },
          }
        : option.xAxis,
    yAxis: Array.isArray(option.yAxis)
      ? option.yAxis.map(axis => ({
          ...axis,
          axisLabel: {
            ...(axis.axisLabel as object || {}),
            fontSize: fonts.axis,
          },
        }))
      : option.yAxis
        ? {
            ...option.yAxis,
            axisLabel: {
              ...(option.yAxis.axisLabel as object || {}),
              fontSize: fonts.axis,
            },
          }
        : option.yAxis,
  };
};

// ============================================================================
// Runtime Data Validation
// ============================================================================

/**
 * Validates that data is an array with at least one element.
 */
export const validateDataArray = (
  data: unknown,
  fieldName = "data"
): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(data)) {
    errors.push(`${fieldName} must be an array`);
    return { isValid: false, errors, warnings };
  }

  if (data.length === 0) {
    warnings.push(`${fieldName} is empty`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validates that required numeric values are finite numbers.
 */
export const validateNumericValue = (
  value: unknown,
  fieldName = "value"
): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value === null || value === undefined) {
    warnings.push(`${fieldName} is null/undefined`);
    return { isValid: true, errors, warnings };
  }

  if (typeof value !== "number") {
    errors.push(`${fieldName} must be a number, got ${typeof value}`);
    return { isValid: false, errors, warnings };
  }

  if (!Number.isFinite(value)) {
    errors.push(`${fieldName} must be finite, got ${value}`);
    return { isValid: false, errors, warnings };
  }

  return { isValid: true, errors, warnings };
};

/**
 * Validates chart data observations.
 */
export const validateObservations = (
  observations: unknown[],
  getters: {
    getX?: (d: unknown) => unknown;
    getY?: (d: unknown) => unknown;
    getSegment?: (d: unknown) => unknown;
  }
): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!observations || observations.length === 0) {
    warnings.push("No observations provided");
    return { isValid: true, errors, warnings };
  }

  const { getX, getY, getSegment } = getters;

  // Sample first few items for validation
  const sampleSize = Math.min(5, observations.length);

  for (let i = 0; i < sampleSize; i++) {
    const obs = observations[i];

    if (getX) {
      const x = getX(obs);
      if (x === null || x === undefined) {
        warnings.push(`Observation ${i} has null/undefined X value`);
      }
    }

    if (getY) {
      const y = getY(obs);
      const yResult = validateNumericValue(y, `Y at index ${i}`);
      errors.push(...yResult.errors);
      warnings.push(...yResult.warnings);
    }

    if (getSegment) {
      const segment = getSegment(obs);
      if (segment === null || segment === undefined) {
        warnings.push(`Observation ${i} has null/undefined segment`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates axis domain bounds.
 */
export const validateAxisDomain = (
  min: number | undefined,
  max: number | undefined,
  axisName = "axis"
): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (min !== undefined && max !== undefined) {
    if (min > max) {
      errors.push(`${axisName} min (${min}) is greater than max (${max})`);
    }
    if (min === max) {
      warnings.push(`${axisName} min equals max (${min})`);
    }
  }

  if (min !== undefined && !Number.isFinite(min)) {
    errors.push(`${axisName} min is not finite: ${min}`);
  }

  if (max !== undefined && !Number.isFinite(max)) {
    errors.push(`${axisName} max is not finite: ${max}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Combines multiple validation results.
 */
export const combineValidationResults = (
  ...results: DataValidationResult[]
): DataValidationResult => {
  const errors = results.flatMap(r => r.errors);
  const warnings = results.flatMap(r => r.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates and returns safe data, or empty array if invalid.
 */
export const validateAndSanitizeData = <T>(
  data: T[] | undefined | null,
  validator?: (item: T) => boolean
): T[] => {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  if (!validator) {
    return data;
  }

  return data.filter(validator);
};

// ============================================================================
// Chart State Validation
// ============================================================================

/**
 * Validates universal chart state has required fields.
 */
export const validateChartState = (state: {
  observations?: unknown[];
  categories?: string[];
  segments?: string[];
  fields?: {
    getX?: unknown;
    getY?: unknown;
  };
}): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.observations) {
    errors.push("State missing observations");
  } else if (!Array.isArray(state.observations)) {
    errors.push("observations is not an array");
  }

  if (!state.fields) {
    errors.push("State missing fields");
  } else {
    if (!state.fields.getX) {
      warnings.push("State missing getX accessor");
    }
    if (!state.fields.getY) {
      warnings.push("State missing getY accessor");
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};
