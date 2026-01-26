/**
 * Shared Formatting Utilities for Universal Adapters
 *
 * Provides consistent handling of formatting configuration across all chart adapters.
 * All adapters should use these utilities to ensure consistent behavior.
 */

import type { UniversalChartState } from "@/charts/core/universal-chart-state";

/**
 * Resolved formatting options with all defaults applied
 */
export interface ResolvedFormatting {
  showXAxis: boolean;
  showYAxis: boolean;
  showXAxisLabels: boolean;
  showYAxisLabels: boolean;
  showGridlines: boolean;
  showLegend: boolean;
  showTitle: boolean;
  showDataValues: boolean;
  showTooltip: boolean;
  enableAnimation: boolean;
  enableZoom: boolean;
  transparentBg: boolean;
}

/**
 * Default formatting values
 */
export const DEFAULT_FORMATTING: ResolvedFormatting = {
  showXAxis: true,
  showYAxis: true,
  showXAxisLabels: true,
  showYAxisLabels: true,
  showGridlines: true,
  showLegend: true,
  showTitle: true,
  showDataValues: false,
  showTooltip: true,
  enableAnimation: true,
  enableZoom: false,
  transparentBg: false,
};

/**
 * Resolves formatting options from chartConfig with defaults
 *
 * @param state - Universal chart state
 * @returns Resolved formatting options with all defaults applied
 *
 * @example
 * const formatting = resolveFormatting(state);
 * if (formatting.showXAxis) {
 *   // render x-axis
 * }
 */
export const resolveFormatting = (state: UniversalChartState): ResolvedFormatting => {
  const config = state.chartConfig.formatting ?? {};

  return {
    showXAxis: config.showXAxis !== false,
    showYAxis: config.showYAxis !== false,
    showXAxisLabels: config.showXAxisLabels !== false,
    showYAxisLabels: true, // Not in FormattingConfig yet, default to true
    showGridlines: config.showGridlines !== false,
    showLegend: config.showLegend !== false,
    showTitle: config.showTitle !== false,
    showDataValues: config.showDataValues === true,
    showTooltip: config.showTooltip !== false,
    enableAnimation: config.enableAnimation !== false,
    enableZoom: config.enableZoom === true,
    transparentBg: config.transparentBg === true,
  };
};

/**
 * Creates axis configuration with formatting applied
 */
export const applyAxisFormatting = (
  axisConfig: Record<string, unknown>,
  options: {
    showAxis: boolean;
    showLabels: boolean;
    showGridlines?: boolean;
  }
): Record<string, unknown> => {
  return {
    ...axisConfig,
    show: options.showAxis,
    axisLabel: {
      ...(axisConfig.axisLabel as Record<string, unknown> | undefined),
      show: options.showLabels,
    },
    ...(options.showGridlines !== undefined && {
      splitLine: { show: options.showGridlines },
    }),
  };
};

/**
 * Gets animation duration based on formatting config
 */
export const getAnimationDuration = (
  formatting: ResolvedFormatting,
  defaultDuration: number = 750
): number => {
  return formatting.enableAnimation ? defaultDuration : 0;
};

/**
 * Creates tooltip configuration based on formatting
 */
export const createTooltipConfig = (
  formatting: ResolvedFormatting,
  baseConfig: Record<string, unknown> = {}
): Record<string, unknown> => {
  if (!formatting.showTooltip) {
    return { show: false };
  }
  return {
    show: true,
    ...baseConfig,
  };
};

/**
 * Creates legend configuration based on formatting
 */
export const createLegendConfig = (
  formatting: ResolvedFormatting,
  hasSegments: boolean,
  baseConfig: Record<string, unknown> = {}
): Record<string, unknown> => {
  const show = hasSegments && formatting.showLegend;
  return {
    show,
    ...baseConfig,
  };
};
