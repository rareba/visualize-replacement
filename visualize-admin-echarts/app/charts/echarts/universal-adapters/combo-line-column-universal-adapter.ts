/**
 * Universal Combo Line Column Chart Adapter
 *
 * A pure function adapter for combo line-column charts.
 * Renders bars and lines on dual Y-axes.
 *
 * This is a fallback adapter that provides basic rendering
 * for mixed line-column combo charts in the universal architecture.
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
import { createLineSeries, createBarSeries } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, BarSeriesOption, LineSeriesOption, YAXisComponentOption } from "echarts";

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
// Combo Line Column Adapter Function
// ============================================================================

/**
 * Universal Combo Line Column Chart Adapter
 *
 * Transforms UniversalChartState into ECharts configuration
 * for mixed bars and lines on dual Y-axes.
 */
export const comboLineColumnUniversalAdapter = (state: UniversalChartState): EChartsOption => {
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

  // Split segments: first segment(s) as columns, rest as lines
  // This is a simplification - real implementation would use config
  const columnSegments = segments.slice(0, 1);
  const lineSegments = segments.slice(1);

  // Calculate domains for each axis
  const columnValues = columnSegments.flatMap((s) => segmentDataMap.get(s) ?? []);
  const lineValues = lineSegments.flatMap((s) => segmentDataMap.get(s) ?? []);

  const columnDomain = calculateDomain(columnValues);
  const lineDomain = lineValues.length > 0 ? calculateDomain(lineValues) : columnDomain;

  // Build series
  const series: (BarSeriesOption | LineSeriesOption)[] = [];

  // Column series on left axis
  columnSegments.forEach((segment) => {
    const data = segmentDataMap.get(segment) ?? [];
    series.push({
      ...createBarSeries({
        name: segment,
        data,
        color: colors.getColor(segment),
        barWidth: "60%",
      }),
      yAxisIndex: 0,
      animationDuration: animation.animationDuration,
      animationEasing: animation.animationEasing,
    } as BarSeriesOption);
  });

  // Line series on right axis
  lineSegments.forEach((segment) => {
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
        name: metadata.yAxisLabel || "Column Axis",
        nameGap: 50,
        min: columnDomain[0],
        max: columnDomain[1],
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
        name: "Line Axis",
        nameGap: 50,
        min: lineDomain[0],
        max: lineDomain[1],
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
      boundaryGap: true, // Bars need boundary gap
    }),
    yAxis,
    series,
  };
};

// Register the adapter
registerChartAdapter("comboLineColumn", comboLineColumnUniversalAdapter);
