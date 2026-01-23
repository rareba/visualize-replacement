/**
 * Area Chart Adapter
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * Supports time series with interactive filtering via dataZoom.
 */

import { useMemo } from "react";

import { AreasState } from "@/charts/area/areas-state";
import {
  calculateChartDimensions,
  createAxisTooltip,
  createXCategoryAxis,
  createYValueAxis,
  createGridConfig,
  createLegend,
  safeGetBounds,
  safeGetNumericDomain,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { useDataZoom, useDataZoomEvents } from "@/charts/echarts/hooks";
import { createAreaSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

/**
 * Groups time-series data by segment.
 */
const groupTimeSeriesData = <T,>(
  chartData: T[],
  segments: string[],
  getSegment: (d: T) => string,
  getX: (d: T) => Date,
  getY: (d: T) => number | null
): {
  xValues: number[];
  xLabels: string[];
  segmentDataMap: Map<string, Map<number, number | null>>;
} => {
  // Get unique X values
  const xValues = [...new Set(chartData.map((d) => getX(d).getTime()))].sort(
    (a, b) => a - b
  );
  const xLabels = xValues.map((t) => new Date(t).toLocaleDateString());

  // Group data by segment
  const segmentDataMap = new Map<string, Map<number, number | null>>();

  if (segments.length > 0) {
    segments.forEach((segment) => {
      segmentDataMap.set(segment, new Map());
    });

    chartData.forEach((d) => {
      const segment = getSegment(d);
      const x = getX(d).getTime();
      const y = getY(d);
      segmentDataMap.get(segment)?.set(x, y);
    });
  } else {
    // Single area
    segmentDataMap.set("default", new Map());
    chartData.forEach((d) => {
      const x = getX(d).getTime();
      const y = getY(d);
      segmentDataMap.get("default")?.set(x, y);
    });
  }

  return { xValues, xLabels, segmentDataMap };
};

/**
 * Area chart adapter with dataZoom support for time range filtering
 */
export const AreaChartAdapter = () => {
  const state = useChartState() as AreasState;
  const {
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getSegment,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    interactiveFiltersConfig,
  } = state;

  // Use shared dataZoom hook
  const {
    showDataZoom,
    handleDataZoom,
    dataZoomConfig,
    extraHeight,
  } = useDataZoom({ xScale, interactiveFiltersConfig });

  const events = useDataZoomEvents(showDataZoom, handleDataZoom);

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const yDomain = safeGetNumericDomain(yScale);

    // Group time series data
    const { xValues, xLabels, segmentDataMap } = groupTimeSeriesData(
      chartData,
      segments,
      getSegment,
      getX,
      getY
    );

    // Check if stacked
    const isStacked = segments.length > 1;
    const seriesKeys = segments.length > 0 ? segments : ["default"];

    // Build series using series builder
    const series = createAreaSeriesGroup(
      seriesKeys,
      (segment) => xValues.map((x) => segmentDataMap.get(segment)?.get(x) ?? null),
      (segment) =>
        segment === "default" ? SWISS_FEDERAL_COLORS.palette[0] : colors(segment),
      {
        stack: isStacked ? "total" : undefined,
        opacity: 0.7,
      }
    );

    const baseOption: EChartsOption = {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds, extraHeight),
      tooltip: createAxisTooltip(),
      legend: createLegend(),
      xAxis: createXCategoryAxis({
        categories: xLabels,
        name: xAxisLabel,
        nameGap: 35,
        boundaryGap: false,
      }),
      yAxis: createYValueAxis({
        name: yAxisLabel,
        nameGap: 50,
        min: yDomain[0],
        max: yDomain[1],
      }),
      series,
      dataZoom: dataZoomConfig,
    };

    return baseOption;
  }, [
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getSegment,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    dataZoomConfig,
    extraHeight,
  ]);

  const dimensions = calculateChartDimensions(bounds, extraHeight);

  return (
    <EChartsWrapper
      option={option}
      onEvents={events}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};
