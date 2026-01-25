/**
 * Scatterplot Chart Adapter
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 *
 * This adapter reads from the existing ChartContext state (computed by
 * scatterplot-state.tsx) and transforms it into ECharts configuration.
 *
 * Key features:
 * - Handles single series (no segment) and multi-series (with segment) data
 * - Applies Swiss Federal theming
 * - Includes robust null/undefined handling for edge cases
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createGridConfig,
  createItemTooltip,
  createLegend,
  createNoDataGraphic,
  createXValueAxis,
  createYValueAxis,
  getDefaultAnimation,
  safeGetBounds,
  safeGetNumericDomain,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
} from "@/charts/echarts/theme";
import { ScatterplotState } from "@/charts/scatterplot/scatterplot-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

/**
 * Scatterplot chart adapter
 */
export const ScatterplotChartAdapter = () => {
  const state = useChartState() as ScatterplotState;
  const {
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getSegment,
    getSegmentAbbreviationOrLabel,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const xDomain = safeGetNumericDomain(xScale);
    const yDomain = safeGetNumericDomain(yScale);

    // Check if we have valid data to display
    const hasData = chartData && chartData.length > 0;

    // If no data, show empty chart with message
    if (!hasData) {
      return {
        ...getSwissFederalTheme(),
        grid: createGridConfig(safeBounds),
        graphic: createNoDataGraphic(),
        xAxis: createXValueAxis({
          name: xAxisLabel || "X",
          min: 0,
          max: 100,
        }),
        yAxis: createYValueAxis({
          name: yAxisLabel || "Y",
          min: 0,
          max: 100,
        }),
        series: [],
      };
    }

    // Common axis configuration using shared utilities
    const xAxisConfig = createXValueAxis({
      name: xAxisLabel || "",
      nameGap: 35,
      min: xDomain[0],
      max: xDomain[1],
    });

    const yAxisConfig = createYValueAxis({
      name: yAxisLabel || "",
      nameGap: 50,
      min: yDomain[0],
      max: yDomain[1],
    });

    if (segments && segments.length > 0 && getSegment) {
      // Multiple segments - create series per segment
      const segmentDataMap = new Map<string, Array<[number, number]>>();

      segments.forEach((segment) => {
        segmentDataMap.set(segment, []);
      });

      chartData.forEach((d) => {
        const segment = getSegment(d);
        const x = getX(d);
        const y = getY(d);
        // Only add valid data points
        if (x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y)) {
          segmentDataMap.get(segment)?.push([x, y]);
        }
      });

      const series = segments.map((segment) => ({
        name: segment,
        type: "scatter" as const,
        data: segmentDataMap.get(segment) ?? [],
        itemStyle: {
          color: colors ? colors(segment) : SWISS_FEDERAL_COLORS.palette[0],
        },
        symbolSize: 10,
        ...getDefaultAnimation(),
      }));

      return {
        ...getSwissFederalTheme(),
        grid: createGridConfig(safeBounds),
        tooltip: {
          ...createItemTooltip(),
          formatter: (params: unknown) => {
            // Safe type checking for tooltip params
            const typedParams = params as { value?: unknown; seriesName?: string } | null;
            if (!typedParams) return "";
            const seriesName = typedParams.seriesName ?? "";
            const value = typedParams.value;
            const xVal = Array.isArray(value) && value.length > 0 ? value[0] : "N/A";
            const yVal = Array.isArray(value) && value.length > 1 ? value[1] : "N/A";
            return `${seriesName}<br/>X: ${xVal}<br/>Y: ${yVal}`;
          },
        },
        legend: {
          ...createLegend(segments.length > 1),
          type: "scroll",
          bottom: 0,
        },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        series,
      };
    } else {
      // Single series - no segmentation
      const data: Array<[number, number]> = [];

      chartData.forEach((d) => {
        const x = getX(d);
        const y = getY(d);
        // Only add valid data points
        if (x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y)) {
          data.push([x, y]);
        }
      });

      return {
        ...getSwissFederalTheme(),
        grid: createGridConfig(safeBounds),
        tooltip: {
          ...createItemTooltip(),
          formatter: (params: unknown) => {
            // Safe type checking for tooltip params
            const typedParams = params as { value?: unknown } | null;
            if (!typedParams) return "";
            const value = typedParams.value;
            const xVal = Array.isArray(value) && value.length > 0 ? value[0] : "N/A";
            const yVal = Array.isArray(value) && value.length > 1 ? value[1] : "N/A";
            return `X: ${xVal}<br/>Y: ${yVal}`;
          },
        },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        series: [
          {
            type: "scatter",
            data,
            itemStyle: {
              color: SWISS_FEDERAL_COLORS.palette[0],
            },
            symbolSize: 10,
            ...getDefaultAnimation(),
          },
        ],
      };
    }
  }, [
    chartData,
    xScale,
    yScale,
    getX,
    getY,
    getSegment,
    getSegmentAbbreviationOrLabel,
    segments,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
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
