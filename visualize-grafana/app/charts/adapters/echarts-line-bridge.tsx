/**
 * ECharts Line Chart Bridge
 *
 * Bridges the existing LinesState (D3-based) to ECharts rendering.
 * Supports multiple series, dots, error whiskers, and smooth interpolation.
 */

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption, LineSeriesOption } from "echarts";

import { LinesState } from "@/charts/line/lines-state";
import { useChartState } from "@/charts/shared/chart-state";
import { useChartTheme } from "@/charts/shared/use-chart-theme";
import { ShowDotsSize } from "@/config-types";
import { useTransitionStore } from "@/stores/transition";

// Map dot size config to ECharts symbol size
const DOT_SIZE_MAP: Record<ShowDotsSize, number> = {
  Small: 4,
  Medium: 6,
  Large: 8,
};

export interface EChartsLinesProps {
  dotSize?: ShowDotsSize;
}

export const EChartsLines: React.FC<EChartsLinesProps> = ({ dotSize }) => {
  const state = useChartState() as LinesState;
  const {
    chartData,
    bounds,
    getX,
    getY,
    getSegment,
    xScale,
    yScale,
    colors,
    grouped,
    segments,
    xAxisLabel,
    yAxisLabel,
  } = state;

  const { margins } = bounds;
  const { labelFontSize, fontFamily, axisLabelFontSize } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  // Determine symbol size based on config
  const symbolSize = useMemo(() => {
    if (!dotSize) return 0;
    return DOT_SIZE_MAP[dotSize ?? "Medium"];
  }, [dotSize]);

  // Check if X axis is time-based
  const isTimeAxis = useMemo(() => {
    if (chartData.length === 0) return false;
    const firstX = getX(chartData[0]);
    return firstX instanceof Date;
  }, [chartData, getX]);

  // Group data by segment and prepare series
  const seriesData = useMemo(() => {
    if (!grouped || segments.length === 0) {
      // Single line
      const sortedData = [...chartData].sort((a, b) => {
        const aX = getX(a);
        const bX = getX(b);
        if (aX instanceof Date && bX instanceof Date) {
          return aX.getTime() - bX.getTime();
        }
        return Number(aX) - Number(bX);
      });

      return [
        {
          name: "Value",
          color: colors.range()[0] || "#1976d2",
          data: sortedData.map((d) => ({
            value: isTimeAxis
              ? [(getX(d) as Date).getTime(), getY(d) ?? 0]
              : [getX(d), getY(d) ?? 0],
            observation: d,
          })),
        },
      ];
    }

    // Multiple lines by segment
    return segments.map((segment) => {
      const segmentData = chartData
        .filter((d) => getSegment(d) === segment)
        .sort((a, b) => {
          const aX = getX(a);
          const bX = getX(b);
          if (aX instanceof Date && bX instanceof Date) {
            return aX.getTime() - bX.getTime();
          }
          return Number(aX) - Number(bX);
        });

      return {
        name: segment,
        color: colors(segment),
        data: segmentData.map((d) => ({
          value: isTimeAxis
            ? [(getX(d) as Date).getTime(), getY(d) ?? 0]
            : [getX(d), getY(d) ?? 0],
          observation: d,
        })),
      };
    });
  }, [chartData, getX, getY, getSegment, colors, grouped, segments, isTimeAxis]);

  // Build ECharts option
  const option: EChartsOption = useMemo(() => {
    const series: LineSeriesOption[] = seriesData.map((s) => ({
      name: s.name,
      type: "line",
      data: s.data.map((d) => d.value),
      smooth: true,
      symbol: symbolSize > 0 ? "circle" : "none",
      symbolSize,
      lineStyle: {
        width: 2,
        color: s.color,
      },
      itemStyle: {
        color: s.color,
      },
      emphasis: {
        focus: "series",
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: "#fff",
        },
      },
      animationDuration: enableTransition ? transitionDuration : 0,
      animationEasing: "cubicOut",
    }));

    return {
      textStyle: {
        fontFamily,
      },
      animation: enableTransition,
      animationDuration: transitionDuration,
      grid: {
        left: margins.left,
        right: margins.right,
        top: margins.top,
        bottom: margins.bottom,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#333",
          },
        },
      },
      legend:
        segments.length > 1
          ? {
              top: 0,
              textStyle: {
                fontFamily,
                fontSize: labelFontSize,
              },
            }
          : undefined,
      xAxis: {
        type: isTimeAxis ? "time" : "value",
        name: xAxisLabel,
        nameLocation: "middle",
        nameGap: 35,
        nameTextStyle: {
          fontFamily,
          fontSize: axisLabelFontSize,
        },
        axisLabel: {
          fontFamily,
          fontSize: axisLabelFontSize,
          formatter: isTimeAxis ? undefined : undefined,
        },
        axisLine: {
          lineStyle: { color: "rgba(0, 0, 0, 0.54)" },
        },
        splitLine: {
          show: false,
        },
        min: xScale.domain()[0] instanceof Date
          ? (xScale.domain()[0] as Date).getTime()
          : xScale.domain()[0],
        max: xScale.domain()[1] instanceof Date
          ? (xScale.domain()[1] as Date).getTime()
          : xScale.domain()[1],
      },
      yAxis: {
        type: "value",
        name: yAxisLabel,
        nameLocation: "middle",
        nameGap: 50,
        nameTextStyle: {
          fontFamily,
          fontSize: axisLabelFontSize,
        },
        axisLabel: {
          fontFamily,
          fontSize: axisLabelFontSize,
        },
        axisLine: {
          show: true,
          lineStyle: { color: "rgba(0, 0, 0, 0.54)" },
        },
        splitLine: {
          lineStyle: { color: "rgba(0, 0, 0, 0.08)" },
        },
        min: yScale.domain()[0],
        max: yScale.domain()[1],
      },
      series,
    };
  }, [
    seriesData,
    symbolSize,
    enableTransition,
    transitionDuration,
    margins,
    segments,
    xAxisLabel,
    yAxisLabel,
    isTimeAxis,
    xScale,
    yScale,
    fontFamily,
    labelFontSize,
    axisLabelFontSize,
  ]);

  // Event handlers
  const onEvents = useMemo(() => {
    return {
      click: (params: any) => {
        const seriesIndex = params.seriesIndex ?? 0;
        const dataIndex = params.dataIndex ?? 0;
        const observation = seriesData[seriesIndex]?.data[dataIndex]?.observation;
        if (observation) {
          console.log("Line point clicked:", observation);
        }
      },
    };
  }, [seriesData]);

  return (
    <ReactECharts
      option={option}
      style={{
        width: bounds.width,
        height: bounds.height,
        position: "absolute",
        top: 0,
        left: 0,
      }}
      onEvents={onEvents}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default EChartsLines;
