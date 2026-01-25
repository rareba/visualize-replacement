/**
 * ECharts Swiss Federal Design Theme
 *
 * This theme provides consistent styling for all ECharts visualizations
 * following the Swiss Federal design guidelines.
 */

import type { EChartsOption } from "echarts";

// Swiss Federal Design System colors
export const SWISS_FEDERAL_COLORS = {
  primary: "#d32f2f",
  secondary: "#1976d2",
  background: "#ffffff",
  text: "#333333",
  muted: "#666666",
  grid: "#e0e0e0",
  axis: "#666666",
  // Semantic colors for status indicators
  success: "#2ca02c",
  warning: "#ff7f0e",
  error: "#d62728",
  // Extended palette for multi-series charts
  palette: [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5",
  ],
};

// Font configuration
export const SWISS_FEDERAL_FONT = {
  family: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  size: {
    label: 12,
    axis: 11,
    title: 14,
    legend: 12,
  },
};

// Animation configuration
export const SWISS_FEDERAL_ANIMATION = {
  duration: 300,
  easing: "cubicOut" as const,
};

/**
 * Get the base ECharts theme configuration
 */
export function getSwissFederalTheme(): Partial<EChartsOption> {
  return {
    color: SWISS_FEDERAL_COLORS.palette,
    backgroundColor: SWISS_FEDERAL_COLORS.background,
    textStyle: {
      fontFamily: SWISS_FEDERAL_FONT.family,
      fontSize: SWISS_FEDERAL_FONT.size.label,
      color: SWISS_FEDERAL_COLORS.text,
    },
    title: {
      textStyle: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: SWISS_FEDERAL_FONT.size.title,
        fontWeight: 600,
        color: SWISS_FEDERAL_COLORS.text,
      },
    },
    legend: {
      textStyle: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: SWISS_FEDERAL_FONT.size.legend,
        color: SWISS_FEDERAL_COLORS.text,
      },
    },
    tooltip: {
      backgroundColor: SWISS_FEDERAL_COLORS.background,
      borderColor: SWISS_FEDERAL_COLORS.grid,
      borderWidth: 1,
      textStyle: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: SWISS_FEDERAL_FONT.size.label,
        color: SWISS_FEDERAL_COLORS.text,
      },
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
      axisTick: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
      axisLabel: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: SWISS_FEDERAL_FONT.size.axis,
        color: SWISS_FEDERAL_COLORS.axis,
      },
      splitLine: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.grid,
        },
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
      axisTick: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
      axisLabel: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: SWISS_FEDERAL_FONT.size.axis,
        color: SWISS_FEDERAL_COLORS.axis,
      },
      splitLine: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.grid,
        },
      },
    },
    grid: {
      containLabel: true,
    },
    animation: true,
    animationDuration: SWISS_FEDERAL_ANIMATION.duration,
    animationEasing: SWISS_FEDERAL_ANIMATION.easing,
  };
}

/**
 * Merge custom options with the Swiss Federal theme
 */
export function mergeWithTheme(options: EChartsOption): EChartsOption {
  const theme = getSwissFederalTheme();

  return {
    ...theme,
    ...options,
    // Deep merge for nested objects
    textStyle: {
      ...theme.textStyle,
      ...(options.textStyle || {}),
    },
    grid: {
      ...theme.grid,
      ...(options.grid || {}),
    },
  };
}
