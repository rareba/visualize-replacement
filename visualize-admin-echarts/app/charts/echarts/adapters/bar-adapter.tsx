/**
 * Bar Chart Adapter (Horizontal)
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * Bar charts are horizontal (categories on Y, values on X).
 */

import { useMemo } from "react";

import { GroupedBarsState } from "@/charts/bar/bars-grouped-state";
import { StackedBarsState } from "@/charts/bar/bars-stacked-state";
import { BarsState } from "@/charts/bar/bars-state";
import {
  buildSeriesDataFromMap,
  calculateChartDimensions,
  createAxisTooltip,
  createYCategoryAxis,
  createXValueAxis,
  createGridConfig,
  createLegend,
  getDefaultAnimation,
  groupDataBySegment,
  renderHorizontalErrorWhisker,
  safeGetBounds,
  safeGetNumericDomain,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { useChartState } from "@/charts/shared/chart-state";

import type { CustomSeriesOption, EChartsOption } from "echarts";

/**
 * Simple bar chart adapter (horizontal bars)
 * Supports horizontal error whiskers when uncertainty data is available.
 */
export const BarChartAdapter = () => {
  const state = useChartState() as BarsState;
  const {
    chartData,
    yScale,
    xScale,
    getX,
    getY,
    getRenderingKey,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    showValues,
    formatYAxisTick,
    showXUncertainty,
    getXErrorRange,
    getXErrorPresent,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = yScale.domain();
    const xDomain = safeGetNumericDomain(xScale);

    // Build series data
    const seriesData = categories.map((category) => {
      const observation = chartData.find((d) => getY(d) === category);
      if (!observation) return null;
      const value = getX(observation);
      const key = getRenderingKey(observation);
      return {
        value: value ?? null,
        itemStyle: {
          color: colors.copy()(key),
        },
      };
    });

    // Build horizontal error whisker data if uncertainty is enabled
    const errorWhiskerData: Array<[number, number, number]> = [];
    if (showXUncertainty && getXErrorRange) {
      categories.forEach((category, index) => {
        const observation = chartData.find((d) => getY(d) === category);
        if (observation && getXErrorPresent(observation)) {
          const [xLow, xHigh] = getXErrorRange(observation);
          errorWhiskerData.push([index, xLow, xHigh]);
        }
      });
    }

    const series: EChartsOption["series"] = [
      {
        type: "bar",
        data: seriesData,
        barMaxWidth: yScale.bandwidth(),
        label: showValues
          ? {
              show: true,
              position: "right",
              fontFamily: SWISS_FEDERAL_FONT.family,
              fontSize: 11,
            }
          : undefined,
        ...getDefaultAnimation(),
      },
    ];

    // Add error whiskers series if there's data
    if (errorWhiskerData.length > 0) {
      series.push({
        type: "custom",
        renderItem: renderHorizontalErrorWhisker as unknown as CustomSeriesOption["renderItem"],
        data: errorWhiskerData,
        z: 10,
      });
    }

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      yAxis: createYCategoryAxis({
        categories: categories.map((c) => formatYAxisTick?.(c) ?? c),
        name: yAxisLabel,
        nameGap: 80,
      }),
      xAxis: createXValueAxis({
        name: xAxisLabel,
        nameGap: 35,
        min: xDomain[0],
        max: xDomain[1],
      }),
      series,
    };
  }, [
    chartData,
    yScale,
    xScale,
    getX,
    getY,
    getRenderingKey,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    showValues,
    formatYAxisTick,
    showXUncertainty,
    getXErrorRange,
    getXErrorPresent,
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
 * Grouped bar chart adapter (horizontal)
 * Supports horizontal error whiskers when uncertainty data is available.
 */
export const GroupedBarChartAdapter = () => {
  const state = useChartState() as GroupedBarsState;
  const {
    chartData,
    yScale,
    xScale,
    getX,
    getY,
    getSegment,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatYAxisTick,
    showXUncertainty,
    getXErrorRange,
    getXErrorPresent,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = yScale.domain();
    const xDomain = safeGetNumericDomain(xScale);

    // Group data by segment (note: for bars, Y is category, X is value)
    const segmentDataMap = groupDataBySegment(
      chartData,
      segments,
      getSegment,
      getY,
      getX
    );

    // Build series for each segment
    const series: EChartsOption["series"] = segments.map((segment) => {
      const segmentData = segmentDataMap.get(segment);
      const data = buildSeriesDataFromMap(segmentData, categories);

      return {
        name: segment,
        type: "bar" as const,
        data,
        itemStyle: {
          color: colors(segment),
        },
        ...getDefaultAnimation(),
      };
    });

    // Add error whiskers for grouped bars
    if (showXUncertainty && getXErrorRange) {
      const errorWhiskerData: Array<[number, number, number, number]> = [];
      const numSegments = segments.length;

      categories.forEach((category, catIndex) => {
        segments.forEach((segment, segIndex) => {
          const observation = chartData.find(
            (d) => getY(d) === category && getSegment(d) === segment
          );
          if (observation && getXErrorPresent(observation)) {
            const [xLow, xHigh] = getXErrorRange(observation);
            const offset = (segIndex - (numSegments - 1) / 2) / numSegments;
            errorWhiskerData.push([catIndex + offset, xLow, xHigh, segIndex]);
          }
        });
      });

      if (errorWhiskerData.length > 0) {
        series.push({
          type: "custom",
          renderItem: renderHorizontalErrorWhisker as unknown as CustomSeriesOption["renderItem"],
          data: errorWhiskerData,
          z: 10,
        });
      }
    }

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      legend: createLegend(),
      yAxis: createYCategoryAxis({
        categories: categories.map((c) => formatYAxisTick?.(c) ?? c),
        name: yAxisLabel,
        nameGap: 80,
      }),
      xAxis: createXValueAxis({
        name: xAxisLabel,
        nameGap: 35,
        min: xDomain[0],
        max: xDomain[1],
      }),
      series,
    };
  }, [
    chartData,
    yScale,
    xScale,
    getX,
    getY,
    getSegment,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatYAxisTick,
    showXUncertainty,
    getXErrorRange,
    getXErrorPresent,
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
 * Stacked bar chart adapter (horizontal)
 */
export const StackedBarChartAdapter = () => {
  const state = useChartState() as StackedBarsState;
  const {
    chartData,
    yScale,
    xScale,
    getX,
    getY,
    getSegment,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatYAxisTick,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = yScale.domain();
    const xDomain = safeGetNumericDomain(xScale);

    // Group data by segment
    const segmentDataMap = groupDataBySegment(
      chartData,
      segments,
      getSegment,
      getY,
      getX
    );

    // Build series for each segment (stacked)
    const series = segments.map((segment) => {
      const segmentData = segmentDataMap.get(segment);
      const data = buildSeriesDataFromMap(segmentData, categories);

      return {
        name: segment,
        type: "bar" as const,
        stack: "total",
        data,
        itemStyle: {
          color: colors(segment),
        },
        emphasis: {
          focus: "series" as const,
        },
        ...getDefaultAnimation(),
      };
    });

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      legend: createLegend(),
      yAxis: createYCategoryAxis({
        categories: categories.map((c) => formatYAxisTick?.(c) ?? c),
        name: yAxisLabel,
        nameGap: 80,
      }),
      xAxis: createXValueAxis({
        name: xAxisLabel,
        nameGap: 35,
        min: xDomain[0],
        max: xDomain[1],
      }),
      series,
    };
  }, [
    chartData,
    yScale,
    xScale,
    getX,
    getY,
    getSegment,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatYAxisTick,
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
