/**
 * Universal Column Chart Adapter
 *
 * A pure function adapter for column charts.
 * Handles simple, grouped, and stacked column charts.
 *
 * Lines of code: ~150 (covers all 3 variants)
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
 * Builds simple column data (no segments).
 */
const buildSimpleColumnData = (
  state: UniversalChartState
): CategorySeriesDataItem[] => {
  const { observations, fields, colors, categories } = state;
  const { getX, getY, getRenderingKey } = fields;

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
 * Calculates Y domain from data.
 */
const calculateYDomain = (
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
    return [minVal, maxVal]; // Add 10% padding
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
// Column Adapter Function
// ============================================================================

/**
 * Universal Column Chart Adapter
 *
 * Transforms UniversalChartState into ECharts column chart configuration.
 * Automatically handles simple, grouped, and stacked variants based on options.
 */
export const columnUniversalAdapter = (state: UniversalChartState): EChartsOption => {
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

  // Calculate Y domain
  const yDomain = calculateYDomain(state, isStacked);

  let series: EChartsOption["series"];

  if (!hasSegments || (!isStacked && !isGrouped)) {
    // Simple column chart
    const seriesData = buildSimpleColumnData(state);
    series = [
      createBarSeries({
        data: seriesData,
        showLabel: showValues,
        labelPosition: "top",
      }),
    ];
  } else if (isGrouped || isStacked) {
    // Grouped or Stacked column chart
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

  // Build xAxis with formatting
  const baseXAxis = createXCategoryAxis({
    categories,
    name: metadata.xAxisLabel,
    nameGap: 35,
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
registerChartAdapter("column", columnUniversalAdapter);
