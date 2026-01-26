/**
 * Line Chart Adapter (LEGACY)
 *
 * @deprecated Use `lineUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/line-universal-adapter.ts for the recommended approach.
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * Supports time series with interactive filtering via dataZoom.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createAxisTooltip,
  createNoDataGraphic,
  createXCategoryAxis,
  createYValueAxis,
  createGridConfig,
  createLegend,
  safeGetBounds,
  safeGetNumericDomain,
} from "@/charts/echarts/adapter-utils";
import { groupTimeSeriesData, buildTimeSeriesData } from "@/charts/echarts/data-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { useDataZoom, useDataZoomEvents } from "@/charts/echarts/hooks";
import { createLineSeriesGroup } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { LinesState } from "@/charts/line/lines-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

/**
 * Line chart adapter with dataZoom support for time range filtering
 */
export const LineChartAdapter = () => {
  const state = useChartState() as LinesState;
  const {
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getSegmentAbbreviationOrLabel,
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

    // Guard: Handle empty data gracefully
    if (!chartData || chartData.length === 0) {
      return {
        ...getSwissFederalTheme(),
        grid: createGridConfig(safeBounds, extraHeight),
        graphic: createNoDataGraphic(),
        xAxis: createXCategoryAxis({
          categories: [],
          name: xAxisLabel || "Time",
          boundaryGap: false,
        }),
        yAxis: createYValueAxis({
          name: yAxisLabel || "Value",
          min: 0,
          max: 100,
        }),
        series: [],
      };
    }

    // Group time series data using shared utility
    const { xValues, xLabels, segmentDataMap } = groupTimeSeriesData(
      chartData,
      segments,
      getSegmentAbbreviationOrLabel,
      getX,
      getY
    );

    // Build series using series builder
    const seriesKeys = segments.length > 0 ? segments : ["default"];
    const baseSeries = createLineSeriesGroup(
      seriesKeys,
      (segment) => buildTimeSeriesData(segmentDataMap.get(segment), xValues),
      (segment) =>
        segment === "default" ? SWISS_FEDERAL_COLORS.palette[0] : colors(segment),
      { lineWidth: 2 }
    );

    // Update series names immutably (default should be empty)
    const series = baseSeries.map((s, i) =>
      seriesKeys[i] === "default" ? { ...s, name: "" } : s
    );

    return {
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
  }, [
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getSegmentAbbreviationOrLabel,
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
