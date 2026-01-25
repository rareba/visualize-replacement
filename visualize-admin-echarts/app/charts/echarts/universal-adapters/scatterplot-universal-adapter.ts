/**
 * Universal Scatterplot Chart Adapter
 *
 * A pure function adapter for scatterplot charts.
 * Handles simple and segmented scatterplots.
 *
 * Lines of code: ~140
 */

import { max, min } from "d3-array";

import {
  createGridConfig,
  createItemTooltip,
  createLegend,
  createNoDataGraphic,
  createXValueAxis,
  createYValueAxis,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { createScatterSeries, createScatterSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Data Building
// ============================================================================

/**
 * Builds scatter data points.
 */
const buildScatterData = (
  state: UniversalChartState,
  segmentFilter?: string
): [number, number][] => {
  const { observations, fields } = state;
  const { getXNumeric, getY, getSegment } = fields;

  if (!getXNumeric || !getY) {
    return [];
  }

  return observations
    .filter((d) => {
      // Filter by segment if specified
      if (segmentFilter && getSegment) {
        return getSegment(d) === segmentFilter;
      }
      return true;
    })
    .map((d) => {
      const x = getXNumeric(d);
      const y = getY(d);
      // Filter out null, NaN, and Infinity values
      if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }
      return [x, y] as [number, number];
    })
    .filter((point): point is [number, number] => point !== null);
};

/**
 * Calculates axis domain from data.
 */
const calculateDomain = (
  values: number[],
  padding = 0.1
): [number, number] => {
  if (values.length === 0) {
    return [0, 100];
  }

  const minValue = min(values);
  const maxValue = max(values);
  const minVal = minValue !== undefined ? minValue : 0;
  const maxVal = maxValue !== undefined ? maxValue : 100;

  const range = maxVal - minVal;
  const paddingValue = range * padding;

  return [minVal - paddingValue, maxVal + paddingValue];
};

// ============================================================================
// Scatterplot Adapter Function
// ============================================================================

/**
 * Universal Scatterplot Chart Adapter
 *
 * Transforms UniversalChartState into ECharts scatterplot configuration.
 */
export const scatterplotUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, segments } = state;
  const { getXNumeric, getY, getSegment } = fields;

  const safeBounds = safeGetBounds(bounds);
  const animation = getDefaultAnimation();

  // Determine if we have segments
  const hasSegments = segments.length > 0 && getSegment;

  // Calculate domains from valid values only
  const xValues = observations
    .map((d) => getXNumeric?.(d))
    .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  const yValues = observations
    .map((d) => getY?.(d))
    .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));

  // Handle empty data case
  if (xValues.length === 0 || yValues.length === 0) {
    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      graphic: createNoDataGraphic(),
      xAxis: createXValueAxis({
        name: metadata.xAxisLabel || "X",
        min: 0,
        max: 100,
      }),
      yAxis: createYValueAxis({
        name: metadata.yAxisLabel || "Y",
        min: 0,
        max: 100,
      }),
      series: [],
    };
  }

  const xDomain = calculateDomain(xValues);
  const yDomain = calculateDomain(yValues);

  let series: EChartsOption["series"];

  if (!hasSegments) {
    // Simple scatterplot
    const scatterData = buildScatterData(state);
    series = [
      createScatterSeries({
        data: scatterData,
        color: colors.colorDomain.length > 0
          ? colors.getColor(colors.colorDomain[0])
          : undefined,
        symbolSize: 10,
      }),
    ];
  } else {
    // Segmented scatterplot
    series = createScatterSeriesGroup(
      segments,
      (segment) => buildScatterData(state, segment),
      (segment) => colors.getColor(segment),
      { symbolSize: 10 }
    );
  }

  return {
    ...getSwissFederalTheme(),
    grid: createGridConfig(safeBounds),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { seriesName: string; value: [number, number] };
        const [x, y] = p.value;
        const segmentInfo = hasSegments ? `${p.seriesName}: ` : "";
        return `${segmentInfo}(${x.toLocaleString()}, ${y.toLocaleString()})`;
      },
    },
    legend: hasSegments ? createLegend() : createLegend(false),
    xAxis: createXValueAxis({
      name: metadata.xAxisLabel,
      nameGap: 35,
      min: xDomain[0],
      max: xDomain[1],
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
registerChartAdapter("scatterplot", scatterplotUniversalAdapter);
