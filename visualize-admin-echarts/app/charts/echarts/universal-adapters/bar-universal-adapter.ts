/**
 * Universal Bar Chart Adapter
 *
 * A pure function adapter for horizontal bar charts.
 * Handles simple, grouped, and stacked bar charts.
 *
 * Lines of code: ~150 (covers all 3 variants)
 */

import { max, min } from "d3-array";

import {
  createAxisTooltip,
  createGridConfig,
  createLegend,
  createYCategoryAxis,
  createXValueAxis,
  getDefaultAnimation,
  groupDataBySegment,
  buildSeriesDataFromMap,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { createBarSeries, createBarSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";
import { resolveFormatting, getAnimationDuration } from "./shared";

import type { EChartsOption } from "echarts";

// ============================================================================
// Data Building
// ============================================================================

interface CategorySeriesDataItem {
  value: number | null;
  itemStyle: { color: string };
}

/**
 * Builds simple bar data (no segments).
 * For bar charts, Y is the category axis and X is the value axis.
 */
const buildSimpleBarData = (
  state: UniversalChartState
): CategorySeriesDataItem[] => {
  const { observations, fields, colors, categories } = state;
  const { getX, getY, getRenderingKey } = fields;

  // For bar charts: getX returns the value (measure), getY returns category
  // But in our universal state, we've mapped them consistently
  if (!getX || !getY) {
    return [];
  }

  // Create a map of category -> observation
  const categoryMap = new Map<string, typeof observations[0]>();
  observations.forEach((d) => {
    const category = getX(d);
    categoryMap.set(category, d);
  });

  // Build series data in category order
  return categories.map((category) => {
    const observation = categoryMap.get(category);
    if (!observation) {
      return { value: null, itemStyle: { color: "#ccc" } };
    }
    const renderingKey = getRenderingKey ? getRenderingKey(observation) : category;
    return {
      value: getY(observation),
      itemStyle: {
        color: colors.getColor(renderingKey),
      },
    };
  });
};

/**
 * Calculates X domain (value axis) from data.
 */
const calculateXDomain = (
  state: UniversalChartState,
  isStacked: boolean
): [number, number] => {
  const { observations, fields, segments } = state;
  const { getX, getY, getSegment } = fields;

  if (!getY || observations.length === 0) {
    return [0, 100];
  }

  if (isStacked && getSegment && segments.length > 0) {
    // For stacked, we need to sum values per category
    const categoryTotals = new Map<string, number>();
    observations.forEach((d) => {
      if (getX) {
        const category = getX(d);
        const value = getY(d) ?? 0;
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + value);
      }
    });
    const values = Array.from(categoryTotals.values());
    const minValue = min(values);
    const maxValue = max(values);
    const minVal = Math.min(0, minValue !== undefined ? minValue : 0);
    const maxVal = (maxValue !== undefined ? maxValue : 100) * 1.1;
    return [minVal, maxVal];
  }

  // For simple/grouped, use individual values
  const values = observations.map((d) => getY(d) ?? 0);
  const minValue = min(values);
  const maxValue = max(values);
  const minVal = Math.min(0, minValue !== undefined ? minValue : 0);
  const maxVal = (maxValue !== undefined ? maxValue : 100) * 1.1;
  return [minVal, maxVal];
};

// ============================================================================
// Bar Adapter Function
// ============================================================================

/**
 * Universal Bar Chart Adapter
 *
 * Transforms UniversalChartState into ECharts horizontal bar chart configuration.
 * Automatically handles simple, grouped, and stacked variants.
 */
export const barUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, options, segments, categories } = state;
  const { getX, getY, getSegment } = fields;
  const segmentType = options.segmentType;
  const showValues = options.showValues;

  // Get formatting options using shared utility
  const formatting = resolveFormatting(state);

  const safeBounds = safeGetBounds(bounds);
  const animation = getDefaultAnimation();

  // Determine chart variant
  const hasSegments = segments.length > 0 && getSegment;
  const isStacked = !!(hasSegments && segmentType === "stacked");
  const isGrouped = hasSegments && segmentType === "grouped";

  // Calculate X domain (value axis for bar charts)
  const xDomain = calculateXDomain(state, isStacked);

  let series: EChartsOption["series"];

  if (!hasSegments || (!isStacked && !isGrouped)) {
    // Simple bar chart
    const seriesData = buildSimpleBarData(state);
    series = [
      createBarSeries({
        data: seriesData,
        showLabel: showValues,
        labelPosition: "right",
      }),
    ];
  } else if (isGrouped || isStacked) {
    // Grouped or Stacked bar chart
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
      series = createBarSeriesGroup(
        segments,
        (segment) => buildSeriesDataFromMap(segmentDataMap.get(segment), categories),
        (segment) => colors.getColor(segment),
        isStacked ? { stack: "total" } : undefined
      );
    }
  } else {
    series = [];
  }

  // For bar charts, Y is category and X is value (swapped from column)
  const baseYAxis = createYCategoryAxis({
    categories,
    name: metadata.xAxisLabel, // X label goes on Y axis for bars
    nameGap: 50,
  });

  const baseXAxis = createXValueAxis({
    name: metadata.yAxisLabel, // Y label goes on X axis for bars
    nameGap: 35,
    min: xDomain[0],
    max: xDomain[1],
  });

  return {
    ...getSwissFederalTheme(),
    grid: createGridConfig(safeBounds),
    tooltip: formatting.showTooltip ? createAxisTooltip() : { show: false },
    legend: (hasSegments && formatting.showLegend) ? createLegend() : createLegend(false),
    yAxis: {
      ...baseYAxis,
      show: formatting.showYAxis,
      axisLabel: {
        ...(baseYAxis.axisLabel as Record<string, unknown>),
        show: formatting.showXAxisLabels,
      },
    },
    xAxis: {
      ...baseXAxis,
      show: formatting.showXAxis,
      axisLabel: {
        ...(baseXAxis.axisLabel as Record<string, unknown>),
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
registerChartAdapter("bar", barUniversalAdapter);
