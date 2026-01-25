/**
 * Shared Utilities for ECharts Adapters
 *
 * Provides coordinated animation utilities, responsive sizing helpers,
 * and runtime data validation functions.
 */

import { SWISS_FEDERAL_ANIMATION } from "@/charts/echarts/theme";

// ============================================================================
// Coordinated Animation Utilities
// ============================================================================

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  threshold?: number;
}

export interface CoordinatedAnimationResult {
  animationDuration: number;
  animationEasing: string;
  animationDelay: number;
  animationThreshold: number;
  // For staggered series animations
  getSeriesDelay: (seriesIndex: number) => number;
}

/**
 * Default animation configuration matching Swiss Federal Design standards.
 */
const DEFAULT_ANIMATION: Required<AnimationConfig> = {
  duration: SWISS_FEDERAL_ANIMATION.duration,
  easing: SWISS_FEDERAL_ANIMATION.easing,
  delay: 0,
  threshold: 2000, // Disable animation for large datasets
};

/**
 * Creates coordinated animation configuration for multiple series.
 * Ensures animations are consistent across chart types.
 */
export const createCoordinatedAnimation = (
  config: AnimationConfig = {}
): CoordinatedAnimationResult => {
  const {
    duration = DEFAULT_ANIMATION.duration,
    easing = DEFAULT_ANIMATION.easing,
    delay = DEFAULT_ANIMATION.delay,
    threshold = DEFAULT_ANIMATION.threshold,
  } = config;

  // Stagger delay per series for visual effect
  const staggerDelay = duration / 10;

  return {
    animationDuration: duration,
    animationEasing: easing,
    animationDelay: delay,
    animationThreshold: threshold,
    getSeriesDelay: (seriesIndex: number) => delay + seriesIndex * staggerDelay,
  };
};

/**
 * Determines if animation should be disabled based on data size.
 */
export const shouldDisableAnimation = (
  dataSize: number,
  threshold: number = DEFAULT_ANIMATION.threshold
): boolean => {
  return dataSize > threshold;
};

/**
 * Creates animation config for update transitions (e.g., filter changes).
 * Uses faster animations for smoother UX.
 */
export const createUpdateAnimation = (): Pick<
  CoordinatedAnimationResult,
  "animationDuration" | "animationEasing"
> => ({
  animationDuration: 200,
  animationEasing: "cubicOut",
});

// ============================================================================
// Responsive Sizing Utilities
// ============================================================================

export interface ResponsiveBounds {
  width: number;
  height: number;
  chartWidth: number;
  chartHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  aspectRatio: number;
}

export interface ResponsiveSizeConfig {
  containerWidth?: number;
  containerHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  marginScale?: number;
}

/**
 * Default responsive configuration.
 */
const DEFAULT_RESPONSIVE: Required<ResponsiveSizeConfig> = {
  containerWidth: 600,
  containerHeight: 400,
  minWidth: 300,
  minHeight: 200,
  maxWidth: 1200,
  maxHeight: 800,
  aspectRatio: 1.5,
  marginScale: 1,
};

/**
 * Calculates responsive chart dimensions based on container size.
 */
export const calculateResponsiveBounds = (
  config: ResponsiveSizeConfig = {}
): ResponsiveBounds => {
  const {
    containerWidth = DEFAULT_RESPONSIVE.containerWidth,
    containerHeight = DEFAULT_RESPONSIVE.containerHeight,
    minWidth = DEFAULT_RESPONSIVE.minWidth,
    minHeight = DEFAULT_RESPONSIVE.minHeight,
    maxWidth = DEFAULT_RESPONSIVE.maxWidth,
    maxHeight = DEFAULT_RESPONSIVE.maxHeight,
    aspectRatio = DEFAULT_RESPONSIVE.aspectRatio,
    marginScale = DEFAULT_RESPONSIVE.marginScale,
  } = config;

  // Clamp dimensions
  const width = Math.max(minWidth, Math.min(maxWidth, containerWidth));
  const height = Math.max(minHeight, Math.min(maxHeight, containerHeight));

  // Scale margins based on size
  const baseMargins = { top: 40, right: 40, bottom: 60, left: 60 };
  const scaleFactor = marginScale * Math.min(width / 600, 1);

  const margins = {
    top: Math.round(baseMargins.top * scaleFactor),
    right: Math.round(baseMargins.right * scaleFactor),
    bottom: Math.round(baseMargins.bottom * scaleFactor),
    left: Math.round(baseMargins.left * scaleFactor),
  };

  const chartWidth = width - margins.left - margins.right;
  const chartHeight = height - margins.top - margins.bottom;

  return {
    width,
    height,
    chartWidth,
    chartHeight,
    margins,
    aspectRatio: chartWidth / chartHeight || aspectRatio,
  };
};

/**
 * Breakpoint definitions for responsive behavior.
 */
export const BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Gets the current breakpoint based on width.
 */
export const getBreakpoint = (width: number): Breakpoint => {
  if (width < BREAKPOINTS.sm) return "xs";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  return "xl";
};

/**
 * Returns responsive font sizes based on breakpoint.
 */
export const getResponsiveFontSize = (
  breakpoint: Breakpoint
): { title: number; label: number; tick: number } => {
  switch (breakpoint) {
    case "xs":
      return { title: 12, label: 10, tick: 8 };
    case "sm":
      return { title: 14, label: 11, tick: 9 };
    case "md":
      return { title: 16, label: 12, tick: 10 };
    case "lg":
    case "xl":
    default:
      return { title: 18, label: 13, tick: 11 };
  }
};

/**
 * Determines if axis labels should be rotated based on width and category count.
 */
export const shouldRotateLabels = (
  width: number,
  categoryCount: number,
  minLabelWidth: number = 50
): { rotate: boolean; angle: number } => {
  const availableWidth = width / Math.max(categoryCount, 1);

  if (availableWidth < minLabelWidth) {
    return { rotate: true, angle: availableWidth < 30 ? -90 : -45 };
  }

  return { rotate: false, angle: 0 };
};

// ============================================================================
// Runtime Data Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that an array has data.
 */
export const validateNonEmpty = (
  data: unknown[],
  fieldName: string = "data"
): ValidationResult => {
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
 * Validates numeric data for chart rendering.
 */
export const validateNumericData = (
  data: (number | null | undefined)[],
  options: { allowNull?: boolean; allowNegative?: boolean } = {}
): ValidationResult => {
  const { allowNull = true, allowNegative = true } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  let nullCount = 0;
  let negativeCount = 0;
  let nanCount = 0;

  data.forEach((value, index) => {
    if (value === null || value === undefined) {
      nullCount++;
      if (!allowNull) {
        errors.push(`Null value at index ${index}`);
      }
    } else if (typeof value !== "number" || Number.isNaN(value)) {
      nanCount++;
      errors.push(`Invalid number at index ${index}: ${value}`);
    } else if (value < 0) {
      negativeCount++;
      if (!allowNegative) {
        errors.push(`Negative value at index ${index}: ${value}`);
      }
    }
  });

  if (nullCount > 0 && allowNull) {
    warnings.push(`Data contains ${nullCount} null value(s)`);
  }

  if (negativeCount > 0 && allowNegative) {
    warnings.push(`Data contains ${negativeCount} negative value(s)`);
  }

  if (nanCount > 0) {
    errors.push(`Data contains ${nanCount} NaN/invalid value(s)`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validates categories match data length.
 */
export const validateCategoryDataMatch = (
  categories: string[],
  data: unknown[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (categories.length !== data.length) {
    errors.push(
      `Category count (${categories.length}) doesn't match data count (${data.length})`
    );
  }

  const duplicateCategories = categories.filter(
    (cat, i) => categories.indexOf(cat) !== i
  );
  if (duplicateCategories.length > 0) {
    warnings.push(
      `Duplicate categories found: ${[...new Set(duplicateCategories)].join(", ")}`
    );
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validates segment/series data structure.
 */
export const validateSegmentData = (
  segments: string[],
  segmentData: Map<string, unknown> | Record<string, unknown>
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dataMap =
    segmentData instanceof Map
      ? segmentData
      : new Map(Object.entries(segmentData));

  segments.forEach((segment) => {
    if (!dataMap.has(segment)) {
      errors.push(`Missing data for segment: ${segment}`);
    }
  });

  // Check for extra data not in segments
  dataMap.forEach((_, key) => {
    if (!segments.includes(key)) {
      warnings.push(`Extra data found for unknown segment: ${key}`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validates pie chart data (positive values only).
 */
export const validatePieData = (
  data: Array<{ name: string; value: number }>
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  let hasPositive = false;

  data.forEach((item, index) => {
    if (!item.name) {
      errors.push(`Missing name at index ${index}`);
    }

    if (typeof item.value !== "number" || Number.isNaN(item.value)) {
      errors.push(`Invalid value at index ${index}: ${item.value}`);
    } else if (item.value < 0) {
      warnings.push(`Negative value will be filtered: ${item.name}`);
    } else if (item.value > 0) {
      hasPositive = true;
    }
  });

  if (!hasPositive && errors.length === 0) {
    warnings.push("No positive values found - chart may appear empty");
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Combined validation for chart state.
 */
export const validateChartData = (state: {
  observations: unknown[];
  categories: string[];
  segments: string[];
}): ValidationResult => {
  const results: ValidationResult[] = [
    validateNonEmpty(state.observations, "observations"),
    validateNonEmpty(state.categories, "categories"),
  ];

  if (state.segments.length > 0) {
    results.push(validateNonEmpty(state.segments, "segments"));
  }

  // Merge all results
  const errors = results.flatMap((r) => r.errors);
  const warnings = results.flatMap((r) => r.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
