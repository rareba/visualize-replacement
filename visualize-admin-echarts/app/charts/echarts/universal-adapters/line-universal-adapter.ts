/**
 * Universal Line Chart Adapter
 *
 * A pure function adapter for line charts.
 * Handles simple and multi-line (segmented) charts.
 *
 * Lines of code: ~130
 */

import { max, min } from "d3-array";

import {
  createAxisTooltip,
  createGridConfig,
  createLegend,
  createXCategoryAxis,
  createYValueAxis,
  getDefaultAnimation,
  groupDataBySegment,
  buildSeriesDataFromMap,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { createLineSeries, createLineSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";
import { resolveFormatting, getAnimationDuration } from "./shared";

import type { EChartsOption } from "echarts";

// ============================================================================
// Data Building
// ============================================================================

/**
 * Builds simple line data (no segments).
 */
const buildSimpleLineData = (state: UniversalChartState): (number | null)[] => {
  const { observations, fields, categories } = state;
  const { getX, getY } = fields;

  if (!getX || !getY) {
    return [];
  }

  // Create a map of category -> value
  const categoryMap = new Map<string, number | null>();
  observations.forEach((d) => {
    const category = getX(d);
    categoryMap.set(category, getY(d));
  });

  // Build data in category order
  return categories.map((category) => categoryMap.get(category) ?? null);
};

/**
 * Calculates Y domain from data.
 */
const calculateYDomain = (state: UniversalChartState): [number, number] => {
  const { observations, fields } = state;
  const { getY } = fields;

  if (!getY || observations.length === 0) {
    return [0, 100];
  }

  const values = observations.map((d) => getY(d) ?? 0).filter((v) => v !== null);
  const minValue = min(values);
  const maxValue = max(values);
  const minVal = minValue !== undefined ? minValue : 0;
  const maxVal = maxValue !== undefined ? maxValue : 100;

  // Add padding
  const padding = (maxVal - minVal) * 0.1;
  return [Math.min(0, minVal - padding), maxVal + padding];
};

// ============================================================================
// Line Adapter Function
// ============================================================================

/**
 * Universal Line Chart Adapter
 *
 * Transforms UniversalChartState into ECharts line chart configuration.
 */
export const lineUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, segments, categories } = state;
  const { getX, getY, getSegment } = fields;

  // Get formatting options using shared utility
  const formatting = resolveFormatting(state);

  const safeBounds = safeGetBounds(bounds);
  const animation = getDefaultAnimation();

  // Determine if we have segments
  const hasSegments = segments.length > 0 && getSegment;

  // Calculate Y domain
  const yDomain = calculateYDomain(state);

  let series: EChartsOption["series"];

  if (!hasSegments) {
    // Simple line chart
    const lineData = buildSimpleLineData(state);
    series = [
      createLineSeries({
        data: lineData,
        color: colors.colorDomain.length > 0
          ? colors.getColor(colors.colorDomain[0])
          : undefined,
        showSymbol: true,
        symbolSize: 6,
      }),
    ];
  } else {
    // Multi-line chart
    if (!getSegment || !getX || !getY) {
      series = [];
    } else {
      // Group data by segment
      const segmentDataMap = groupDataBySegment(
        observations,
        segments,
        getSegment,
        getX,
        getY
      );

      // Build series for each segment
      series = createLineSeriesGroup(
        segments,
        (segment) => buildSeriesDataFromMap(segmentDataMap.get(segment), categories),
        (segment) => colors.getColor(segment)
      );
    }
  }

  // Build xAxis with formatting
  const baseXAxis = createXCategoryAxis({
    categories,
    name: metadata.xAxisLabel,
    nameGap: 35,
    boundaryGap: false, // Lines should start at axis origin
  });

  // Build yAxis with formatting
  const baseYAxis = createYValueAxis({
    name: metadata.yAxisLabel,
    nameGap: 50,
    min: yDomain[0],
    max: yDomain[1],
  });

  return {
    ...getSwissFederalTheme(),
    grid: createGridConfig(safeBounds),
    tooltip: formatting.showTooltip ? createAxisTooltip() : { show: false },
    legend: (hasSegments && formatting.showLegend) ? createLegend() : createLegend(false),
    xAxis: {
      ...baseXAxis,
      show: formatting.showXAxis,
      axisLabel: {
        ...(baseXAxis.axisLabel as Record<string, unknown>),
        show: formatting.showXAxisLabels,
      },
    },
    yAxis: {
      ...baseYAxis,
      show: formatting.showYAxis,
      axisLabel: {
        ...(baseYAxis.axisLabel as Record<string, unknown>),
        show: formatting.showYAxisLabels,
      },
      splitLine: { show: formatting.showGridlines },
    },
    series,
    animationDuration: getAnimationDuration(formatting, animation.animationDuration),
    animationEasing: animation.animationEasing,
  };
};

// Register the adapter
registerChartAdapter("line", lineUniversalAdapter);
