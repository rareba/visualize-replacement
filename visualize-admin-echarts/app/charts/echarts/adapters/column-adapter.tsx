/**
 * Column Chart Adapter (LEGACY)
 *
 * @deprecated Use `columnUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/column-universal-adapter.ts for the recommended approach.
 */

import { useMemo } from "react";

import { GroupedColumnsState } from "@/charts/column/columns-grouped-state";
import { StackedColumnsState } from "@/charts/column/columns-stacked-state";
import { ColumnsState } from "@/charts/column/columns-state";
import {
  buildSeriesDataFromMap,
  calculateChartDimensions,
  createAxisTooltip,
  createGridConfig,
  createLegend,
  createNoDataGraphic,
  createXCategoryAxis,
  createYValueAxis,
  groupDataBySegment,
  renderVerticalErrorWhisker,
  safeGetBounds,
  safeGetNumericDomain,
} from "@/charts/echarts/adapter-utils";
import {
  buildCategorySeriesData,
  buildErrorWhiskerData,
  buildGroupedErrorWhiskerData,
} from "@/charts/echarts/data-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { createBarSeries, createBarSeriesGroup, createCustomSeries } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { useChartState } from "@/charts/shared/chart-state";

import type { CustomSeriesOption, EChartsOption } from "echarts";

/**
 * Transforms ChartContext state to ECharts configuration for simple column charts.
 * Supports error whiskers when uncertainty data is available.
 */
export const ColumnChartAdapter = () => {
  const state = useChartState() as ColumnsState;
  const {
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getRenderingKey,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    showValues,
    rotateValues,
    formatXAxisTick,
    showYUncertainty,
    getYErrorRange,
    getYErrorPresent,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = xScale.domain();
    const yDomain = safeGetNumericDomain(yScale);

    // Check if we have valid data to display
    const hasData = chartData && chartData.length > 0 && categories.length > 0;

    // If no data, show empty chart with message
    if (!hasData) {
      return {
        ...getSwissFederalTheme(),
        grid: createGridConfig(safeBounds),
        graphic: createNoDataGraphic(),
        xAxis: createXCategoryAxis({
          categories: [],
          name: xAxisLabel || "Category",
        }),
        yAxis: createYValueAxis({
          name: yAxisLabel || "Value",
          min: 0,
          max: 100,
        }),
        series: [],
      };
    }

    // Pre-seed color scale with all keys to ensure consistent color assignment
    const allKeys = chartData.map((d) => getRenderingKey(d));
    const colorScale = colors.copy();
    allKeys.forEach((key) => colorScale(key)); // Pre-seed the domain

    // Build series data using utility
    const seriesData = buildCategorySeriesData({
      categories,
      chartData,
      getCategory: getX,
      getValue: getY,
      getColor: (d) => colorScale(getRenderingKey(d)),
    });

    // Build error whisker data using utility
    const errorWhiskerData =
      showYUncertainty && getYErrorRange && getYErrorPresent
        ? buildErrorWhiskerData({
            categories,
            chartData,
            getCategory: getX,
            getErrorPresent: getYErrorPresent,
            getErrorRange: getYErrorRange,
          })
        : [];

    const series: EChartsOption["series"] = [
      createBarSeries({
        data: seriesData,
        barMaxWidth: xScale.bandwidth(),
        showLabel: showValues,
        labelPosition: "top",
        labelRotate: rotateValues ? 90 : 0,
      }),
    ];

    // Add error whiskers series if there's data
    if (errorWhiskerData.length > 0) {
      series.push(
        createCustomSeries({
          data: errorWhiskerData,
          renderItem: renderVerticalErrorWhisker as unknown as CustomSeriesOption["renderItem"],
        })
      );
    }

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      xAxis: createXCategoryAxis({
        categories: categories.map((c) => formatXAxisTick?.(c) ?? c),
        name: xAxisLabel,
        nameGap: 35,
      }),
      yAxis: createYValueAxis({
        name: yAxisLabel,
        nameGap: 50,
        min: yDomain[0],
        max: yDomain[1],
      }),
      series,
    };
  }, [
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getRenderingKey,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    showValues,
    rotateValues,
    formatXAxisTick,
    showYUncertainty,
    getYErrorRange,
    getYErrorPresent,
  ]);

  const dimensions = calculateChartDimensions(bounds);

  return (
    <EChartsWrapper
      option={option}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};

/**
 * Transforms ChartContext state to ECharts configuration for grouped column charts.
 * Supports error whiskers when uncertainty data is available.
 */
export const GroupedColumnChartAdapter = () => {
  const state = useChartState() as GroupedColumnsState;
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
    formatXAxisTick,
    showYUncertainty,
    getYErrorRange,
    getYErrorPresent,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = xScale.domain();
    const yDomain = safeGetNumericDomain(yScale);

    // Group data by segment
    const segmentDataMap = groupDataBySegment(
      chartData,
      segments,
      getSegment,
      getX,
      getY
    );

    // Build series using series builder
    const series: EChartsOption["series"] = createBarSeriesGroup(
      segments,
      (segment) => buildSeriesDataFromMap(segmentDataMap.get(segment), categories),
      (segment) => colors(segment)
    );

    // Add error whiskers for grouped bars
    if (showYUncertainty && getYErrorRange && getYErrorPresent) {
      const errorWhiskerData = buildGroupedErrorWhiskerData({
        categories,
        chartData,
        segments,
        getCategory: getX,
        getSegment,
        getErrorPresent: getYErrorPresent,
        getErrorRange: getYErrorRange,
      });

      if (errorWhiskerData.length > 0) {
        series.push(
          createCustomSeries({
            data: errorWhiskerData,
            renderItem: renderVerticalErrorWhisker as unknown as CustomSeriesOption["renderItem"],
          })
        );
      }
    }

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      legend: createLegend(),
      xAxis: createXCategoryAxis({
        categories: categories.map((c) => formatXAxisTick?.(c) ?? c),
        name: xAxisLabel,
        nameGap: 35,
      }),
      yAxis: createYValueAxis({
        name: yAxisLabel,
        nameGap: 50,
        min: yDomain[0],
        max: yDomain[1],
      }),
      series,
    };
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
    formatXAxisTick,
    showYUncertainty,
    getYErrorRange,
    getYErrorPresent,
  ]);

  const dimensions = calculateChartDimensions(bounds);

  return (
    <EChartsWrapper
      option={option}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};

/**
 * Transforms ChartContext state to ECharts configuration for stacked column charts.
 */
export const StackedColumnChartAdapter = () => {
  const state = useChartState() as StackedColumnsState;
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
    formatXAxisTick,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = xScale.domain();
    const yDomain = safeGetNumericDomain(yScale);

    // Group data by segment
    const segmentDataMap = groupDataBySegment(
      chartData,
      segments,
      getSegment,
      getX,
      getY
    );

    // Build stacked series using series builder
    const series = createBarSeriesGroup(
      segments,
      (segment) => buildSeriesDataFromMap(segmentDataMap.get(segment), categories),
      (segment) => colors(segment),
      { stack: "total" }
    );

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      legend: createLegend(),
      xAxis: createXCategoryAxis({
        categories: categories.map((c) => formatXAxisTick?.(c) ?? c),
        name: xAxisLabel,
        nameGap: 35,
      }),
      yAxis: createYValueAxis({
        name: yAxisLabel,
        nameGap: 50,
        min: yDomain[0],
        max: yDomain[1],
      }),
      series,
    };
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
    formatXAxisTick,
  ]);

  const dimensions = calculateChartDimensions(bounds);

  return (
    <EChartsWrapper
      option={option}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};
