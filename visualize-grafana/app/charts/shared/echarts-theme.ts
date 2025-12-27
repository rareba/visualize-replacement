/**
 * ECharts Theme for Swiss Federal Design System
 *
 * This theme provides consistent styling for all ECharts visualizations
 * following the Swiss Federal CI guidelines.
 *
 * Colors are derived from @interactivethings/swiss-federal-ci package
 * and the D3 color schemes used in the existing visualize implementation.
 */

import { schemeCategory10 } from "d3-scale-chromatic";

// Swiss Federal CI color palette for charts
// These colors are optimized for data visualization while maintaining
// consistency with the Swiss Federal Design System
export const SWISS_FEDERAL_CHART_COLORS = [
  "#1D4ED8", // Blue - Primary
  "#DC2626", // Red
  "#059669", // Green
  "#D97706", // Orange
  "#7C3AED", // Purple
  "#0891B2", // Teal
  "#DB2777", // Pink
  "#4B5563", // Gray
  "#FBBF24", // Yellow
  "#78350F", // Brown
];

// Fallback to D3 category10 for compatibility
export const DEFAULT_CHART_COLORS = schemeCategory10 as string[];

// Swiss Federal typography
export const SWISS_FEDERAL_FONT_FAMILY =
  '"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

// Chart styling constants following Swiss Federal CI
export const CHART_THEME = {
  // Typography
  fontFamily: SWISS_FEDERAL_FONT_FAMILY,
  fontSize: 12,
  titleFontSize: 16,
  axisLabelFontSize: 12,
  legendFontSize: 12,

  // Colors
  textColor: "#1F2937", // Monochrome 800
  axisLineColor: "rgba(0, 0, 0, 0.54)",
  gridLineColor: "rgba(0, 0, 0, 0.08)",
  tooltipBackgroundColor: "rgba(0, 0, 0, 0.8)",

  // Spacing
  gridLeft: 60,
  gridRight: 20,
  gridTop: 60,
  gridBottom: 60,

  // Animation
  animationDuration: 500,
  animationEasing: "cubicOut" as const,
};

// Build ECharts base option with Swiss Federal styling
export function buildSwissFederalBaseOption() {
  return {
    textStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.fontSize,
      color: CHART_THEME.textColor,
    },
    grid: {
      left: CHART_THEME.gridLeft,
      right: CHART_THEME.gridRight,
      top: CHART_THEME.gridTop,
      bottom: CHART_THEME.gridBottom,
      containLabel: false,
    },
    tooltip: {
      backgroundColor: CHART_THEME.tooltipBackgroundColor,
      textStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.fontSize,
      },
      borderWidth: 0,
    },
    legend: {
      textStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.legendFontSize,
        color: CHART_THEME.textColor,
      },
    },
    xAxis: {
      axisLine: {
        lineStyle: { color: CHART_THEME.axisLineColor },
      },
      axisLabel: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
        color: CHART_THEME.textColor,
      },
      nameTextStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      axisLine: {
        show: true,
        lineStyle: { color: CHART_THEME.axisLineColor },
      },
      axisLabel: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
        color: CHART_THEME.textColor,
      },
      nameTextStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
      },
      splitLine: {
        lineStyle: { color: CHART_THEME.gridLineColor },
      },
    },
    animation: true,
    animationDuration: CHART_THEME.animationDuration,
    animationEasing: CHART_THEME.animationEasing,
  };
}
