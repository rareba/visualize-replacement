/**
 * Universal Combo Line Single Chart Adapter
 *
 * A pure function adapter for combo line single charts.
 * Renders multiple lines on a single Y-axis.
 *
 * This is a fallback adapter that provides basic rendering
 * for combo charts in the universal architecture.
 */

import { max, min } from "d3-array";

import {
  createAxisTooltip,
  createGridConfig,
  createLegend,
  createXCategoryAxis,
  createYValueAxis,
  createNoDataGraphic,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { createLineSeries, createLineSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Data Building
// ============================================================================

/**
 * Calculates Y domain from observations.
 */
const calculateYDomain = (state: UniversalChartState): [number, number] => {
  const { observations, fields } = state;
  const { getY } = fields;

  if (!getY || observations.length === 0) {
    return [0, 100];
  }

  const values = observations
    .map((d) => getY(d))
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return [0, 100];
  }

  const minValue = min(values) ?? 0;
  const maxValue = max(values) ?? 100;

  // Add padding
  const padding = (maxValue - minValue) * 0.1;
  return [Math.min(0, minValue - padding), maxValue + padding];
};

/**
 * Groups observations by segment and creates series data.
 */
const buildMultiLineData = (
  state: UniversalChartState
): Map<string, Map<string, number | null>> => {
  const { observations, fields, segments, categories } = state;
  const { getX, getY, getSegment } = fields;

  const segmentDataMap = new Map<string, Map<string, number | null>>();

  // Initialize maps for each segment
  segments.forEach((segment) => {
    const categoryMap = new Map<string, number | null>();
    categories.forEach((cat) => categoryMap.set(cat, null));
    segmentDataMap.set(segment, categoryMap);
  });

  // Fill in values from observations
  if (getX && getY && getSegment) {
    observations.forEach((d) => {
      const segment = getSegment(d);
      const category = getX(d);
      const value = getY(d);

      const categoryMap = segmentDataMap.get(segment);
      if (categoryMap) {
        categoryMap.set(category, value);
      }
    });
  }

  return segmentDataMap;
};

// ============================================================================
// Combo Line Single Adapter Function
// ============================================================================

/**
 * Universal Combo Line Single Chart Adapter
 *
 * Transforms UniversalChartState into ECharts configuration
 * for multiple lines on a single Y-axis.
 */
export const comboLineSingleUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, segments, categories } = state;
  const { getSegment } = fields;

  const safeBounds = safeGetBounds(bounds);
  const animation = getDefaultAnimation();

  // Check if we have data
  const hasData = observations.length > 0 && categories.length > 0;

  if (!hasData) {
    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      graphic: createNoDataGraphic(),
      xAxis: createXCategoryAxis({ categories: [] }),
      yAxis: createYValueAxis({ min: 0, max: 100 }),
      series: [],
    };
  }

  // Calculate Y domain
  const yDomain = calculateYDomain(state);

  // Build series
  let series: EChartsOption["series"];

  if (segments.length > 0 && getSegment) {
    // Multi-line chart
    const segmentDataMap = buildMultiLineData(state);

    series = createLineSeriesGroup(
      segments,
      (segment) => {
        const categoryMap = segmentDataMap.get(segment);
        return categories.map((cat) => categoryMap?.get(cat) ?? null);
      },
      (segment) => colors.getColor(segment)
    );
  } else {
    // Single line - use first color
    const lineData = categories.map(() => null); // Fallback empty
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
  }

  return {
    ...getSwissFederalTheme(),
    grid: createGridConfig(safeBounds),
    tooltip: createAxisTooltip(),
    legend: createLegend(),
    xAxis: createXCategoryAxis({
      categories,
      name: metadata.xAxisLabel,
      nameGap: 35,
      boundaryGap: false,
    }),
    yAxis: createYValueAxis({
      name: metadata.yAxisLabel,
      nameGap: 50,
      min: yDomain[0],
      max: yDomain[1],
    }),
    series,
    animationDuration: animation.animationDuration,
    animationEasing: animation.animationEasing,
  };
};

// Register the adapter
registerChartAdapter("comboLineSingle", comboLineSingleUniversalAdapter);
