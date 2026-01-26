/**
 * Universal Area Chart Adapter
 *
 * A pure function adapter for area charts.
 * Handles simple and stacked area charts.
 *
 * Lines of code: ~130
 */

import { max } from "d3-array";

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
import { createAreaSeries, createAreaSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";
import { resolveFormatting, getAnimationDuration } from "./shared";

import type { EChartsOption } from "echarts";

// ============================================================================
// Data Building
// ============================================================================

/**
 * Builds simple area data (no segments).
 */
const buildSimpleAreaData = (state: UniversalChartState): (number | null)[] => {
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
    const maxValue = max(values);
    const maxVal = (maxValue !== undefined ? maxValue : 100) * 1.1;
    return [0, maxVal];
  }

  const values = observations.map((d) => getY(d) ?? 0);
  const maxValue = max(values);
  const maxVal = (maxValue !== undefined ? maxValue : 100) * 1.1;
  return [0, maxVal];
};

// ============================================================================
// Area Adapter Function
// ============================================================================

/**
 * Universal Area Chart Adapter
 *
 * Transforms UniversalChartState into ECharts area chart configuration.
 */
export const areaUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, options, segments, categories } = state;
  const { getX, getY, getSegment } = fields;
  const segmentType = options.segmentType;

  // Get formatting options using shared utility
  const formatting = resolveFormatting(state);

  const safeBounds = safeGetBounds(bounds);
  const animation = getDefaultAnimation();

  // Determine if we have segments and stacking
  const hasSegments = segments.length > 0 && getSegment;
  const isStacked = !!(hasSegments && segmentType === "stacked");

  // Calculate Y domain
  const yDomain = calculateYDomain(state, isStacked);

  let series: EChartsOption["series"];

  if (!hasSegments) {
    // Simple area chart
    const areaData = buildSimpleAreaData(state);
    series = [
      createAreaSeries({
        data: areaData,
        color: colors.colorDomain.length > 0
          ? colors.getColor(colors.colorDomain[0])
          : undefined,
        opacity: 0.7,
      }),
    ];
  } else {
    // Stacked or multi-area chart
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
      series = createAreaSeriesGroup(
        segments,
        (segment) => buildSeriesDataFromMap(segmentDataMap.get(segment), categories),
        (segment) => colors.getColor(segment),
        {
          stack: isStacked ? "total" : undefined,
          opacity: 0.7,
        }
      );
    }
  }

  // Build xAxis with formatting
  const baseXAxis = createXCategoryAxis({
    categories,
    name: metadata.xAxisLabel,
    nameGap: 35,
    boundaryGap: false, // Areas should start at axis origin
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
registerChartAdapter("area", areaUniversalAdapter);
