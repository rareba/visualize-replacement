/**
 * Universal Combo Line Dual Chart Adapter
 *
 * A pure function adapter for combo line dual charts.
 * Renders multiple lines on dual Y-axes.
 *
 * This is a fallback adapter that provides basic rendering
 * for dual-axis combo charts in the universal architecture.
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
import { createLineSeries } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, LineSeriesOption, YAXisComponentOption } from "echarts";

// ============================================================================
// Data Building
// ============================================================================

/**
 * Calculates Y domain from values.
 */
const calculateDomain = (values: (number | null)[]): [number, number] => {
  const validValues = values.filter((v): v is number => v !== null);

  if (validValues.length === 0) {
    return [0, 100];
  }

  const minValue = min(validValues) ?? 0;
  const maxValue = max(validValues) ?? 100;

  // Add padding
  const padding = (maxValue - minValue) * 0.1;
  return [Math.min(0, minValue - padding), maxValue + padding];
};

// ============================================================================
// Combo Line Dual Adapter Function
// ============================================================================

/**
 * Universal Combo Line Dual Chart Adapter
 *
 * Transforms UniversalChartState into ECharts configuration
 * for multiple lines on dual Y-axes.
 */
export const comboLineDualUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, segments, categories } = state;
  const { getX, getY, getSegment } = fields;

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
      yAxis: [
        createYValueAxis({ min: 0, max: 100 }),
        createYValueAxis({ min: 0, max: 100 }),
      ],
      series: [],
    };
  }

  // Build data by segment
  const segmentDataMap = new Map<string, (number | null)[]>();

  segments.forEach((segment) => {
    const data: (number | null)[] = [];
    const categoryValueMap = new Map<string, number | null>();

    // Build value map for this segment
    if (getX && getY && getSegment) {
      observations.forEach((d) => {
        if (getSegment(d) === segment) {
          categoryValueMap.set(getX(d), getY(d));
        }
      });
    }

    // Map to categories order
    categories.forEach((cat) => {
      data.push(categoryValueMap.get(cat) ?? null);
    });

    segmentDataMap.set(segment, data);
  });

  // Split segments into two groups for dual axes
  // First half goes to left axis, second half to right axis
  const midpoint = Math.ceil(segments.length / 2);
  const leftSegments = segments.slice(0, midpoint);
  const rightSegments = segments.slice(midpoint);

  // Calculate domains for each axis
  const leftValues = leftSegments.flatMap((s) => segmentDataMap.get(s) ?? []);
  const rightValues = rightSegments.flatMap((s) => segmentDataMap.get(s) ?? []);

  const leftDomain = calculateDomain(leftValues);
  const rightDomain = rightValues.length > 0 ? calculateDomain(rightValues) : leftDomain;

  // Build series
  const series: LineSeriesOption[] = [];

  leftSegments.forEach((segment) => {
    const data = segmentDataMap.get(segment) ?? [];
    series.push({
      ...createLineSeries({
        name: segment,
        data,
        color: colors.getColor(segment),
        showSymbol: true,
        symbolSize: 6,
      }),
      yAxisIndex: 0,
      animationDuration: animation.animationDuration,
      animationEasing: animation.animationEasing,
    });
  });

  rightSegments.forEach((segment) => {
    const data = segmentDataMap.get(segment) ?? [];
    series.push({
      ...createLineSeries({
        name: segment,
        data,
        color: colors.getColor(segment),
        showSymbol: true,
        symbolSize: 6,
      }),
      yAxisIndex: 1,
      animationDuration: animation.animationDuration,
      animationEasing: animation.animationEasing,
    });
  });

  // Build dual Y axes
  const yAxis: YAXisComponentOption[] = [
    {
      ...createYValueAxis({
        name: metadata.yAxisLabel || "Left Axis",
        nameGap: 50,
        min: leftDomain[0],
        max: leftDomain[1],
      }),
      position: "left",
      axisLine: {
        show: true,
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
    },
    {
      ...createYValueAxis({
        name: "Right Axis",
        nameGap: 50,
        min: rightDomain[0],
        max: rightDomain[1],
      }),
      position: "right",
      axisLine: {
        show: true,
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
    },
  ];

  return {
    ...getSwissFederalTheme(),
    grid: {
      ...createGridConfig(safeBounds),
      right: safeBounds.margins.right + 50, // Extra space for right axis
    },
    tooltip: createAxisTooltip(),
    legend: createLegend(),
    xAxis: createXCategoryAxis({
      categories,
      name: metadata.xAxisLabel,
      nameGap: 35,
      boundaryGap: false,
    }),
    yAxis,
    series,
  };
};

// Register the adapter
registerChartAdapter("comboLineDual", comboLineDualUniversalAdapter);
