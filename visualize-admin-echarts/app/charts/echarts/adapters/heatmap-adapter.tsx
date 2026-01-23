/**
 * Heatmap Chart Adapter
 *
 * Displays matrix data using color intensity.
 */

import { useMemo } from "react";

import {
  ChartBounds,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, HeatmapSeriesOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

interface HeatmapState extends Omit<PieState, "getX"> {
  getX?: (d: unknown) => string;
  getValue?: (d: unknown) => number | null;
  xScale?: { domain: () => string[] };
  yScale?: { domain: () => string[] };
}

// ============================================================================
// Heatmap Chart Adapter
// ============================================================================

/**
 * Heatmap chart adapter
 */
export const HeatmapChartAdapter = () => {
  const state = useChartState() as HeatmapState;
  const {
    chartData,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    bounds,
    xScale,
    valueLabelFormatter,
  } = state;

  // Use getX if available, otherwise use getSegment
  const getX = (state as HeatmapState).getX || getSegment;
  const getValue = (state as HeatmapState).getValue || getY;
  const yScale = (state as HeatmapState).yScale;

  const option = useMemo((): EChartsOption => {
    const animation = getDefaultAnimation();

    // Get unique x and y categories
    const xCategories = xScale?.domain() ?? [...new Set(chartData.map((d) => getX(d)))];
    const yCategories = yScale?.domain() ?? [...new Set(chartData.map((d) => getSegmentAbbreviationOrLabel(d)))];

    // Build heatmap data: [xIndex, yIndex, value]
    const data: [number, number, number][] = [];
    let minValue = Infinity;
    let maxValue = -Infinity;

    chartData.forEach((d) => {
      const xVal = getX(d);
      const yVal = getSegmentAbbreviationOrLabel(d);
      const value = getValue ? (getValue(d) ?? 0) : 0;

      const xIdx = xCategories.indexOf(xVal);
      const yIdx = yCategories.indexOf(yVal);

      if (xIdx !== -1 && yIdx !== -1) {
        data.push([xIdx, yIdx, value]);
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    });

    // Handle edge case where no data
    if (minValue === Infinity) minValue = 0;
    if (maxValue === -Infinity) maxValue = 100;

    const safeBounds = safeGetBounds(bounds as Partial<ChartBounds>);

    return {
      ...getSwissFederalTheme(),
      tooltip: {
        position: "top",
        formatter: (params: unknown) => {
          const p = params as { data: [number, number, number] };
          const [xIdx, yIdx, value] = p.data;
          const xLabel = xCategories[xIdx] || "";
          const yLabel = yCategories[yIdx] || "";
          const formattedValue = valueLabelFormatter
            ? valueLabelFormatter(value)
            : value;
          return `${xLabel} - ${yLabel}: ${formattedValue}`;
        },
      },
      grid: {
        left: safeBounds.margins.left,
        right: safeBounds.margins.right,
        top: safeBounds.margins.top,
        bottom: safeBounds.margins.bottom + 40, // Extra space for visualMap
        containLabel: false,
      },
      xAxis: {
        type: "category" as const,
        data: xCategories,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 11,
          color: SWISS_FEDERAL_COLORS.text,
        },
      },
      yAxis: {
        type: "category" as const,
        data: yCategories,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 11,
          color: SWISS_FEDERAL_COLORS.text,
        },
      },
      visualMap: {
        min: minValue,
        max: maxValue,
        calculable: true,
        orient: "horizontal" as const,
        left: "center",
        bottom: 10,
        inRange: {
          color: [
            SWISS_FEDERAL_COLORS.palette[14], // Light
            SWISS_FEDERAL_COLORS.palette[1], // Primary blue
            SWISS_FEDERAL_COLORS.primary, // Swiss red
          ],
        },
        textStyle: {
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 11,
          color: SWISS_FEDERAL_COLORS.text,
        },
      },
      series: [
        {
          type: "heatmap",
          data: data,
          label: {
            show: data.length <= 100, // Only show labels for smaller grids
            fontFamily: SWISS_FEDERAL_FONT.family,
            fontSize: 10,
            color: SWISS_FEDERAL_COLORS.text,
            formatter: (params: unknown) => {
              const p = params as { data: [number, number, number] };
              const value = p.data[2];
              if (valueLabelFormatter) {
                return valueLabelFormatter(value);
              }
              return value.toFixed(0);
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 1,
          },
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
        } as HeatmapSeriesOption,
      ],
    };
  }, [chartData, getX, getSegmentAbbreviationOrLabel, getValue, bounds, xScale, yScale, valueLabelFormatter]);

  const safeBounds = safeGetBounds(bounds as Partial<ChartBounds>);
  const dimensions = {
    width: safeBounds.width,
    height: safeBounds.chartHeight + safeBounds.margins.top + safeBounds.margins.bottom + 40,
  };

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
