/**
 * ECharts Scatterplot Bridge
 *
 * This component bridges the existing ScatterplotState (D3-based state)
 * to ECharts rendering. It consumes the same state context but uses
 * ECharts for visualization instead of D3 selections.
 *
 * Usage:
 * Replace <Scatterplot /> with <EChartsScatterplot /> in chart-scatterplot.tsx
 * when using the RENDER_ENGINE="echarts" feature flag.
 */

import ReactECharts from "echarts-for-react";
import React, { useMemo } from "react";

import { ScatterplotState } from "@/charts/scatterplot/scatterplot-state";
import { useChartState } from "@/charts/shared/chart-state";
import { useChartTheme } from "@/charts/shared/use-chart-theme";
import { useTransitionStore } from "@/stores/transition";

import type { EChartsOption, ScatterSeriesOption } from "echarts";

// Swiss Federal theme for ECharts
const ECHARTS_SWISS_THEME = {
  fontFamily:
    '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textStyle: {
    fontFamily:
      '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export const EChartsScatterplot: React.FC = () => {
  const state = useChartState() as ScatterplotState;
  const {
    chartData,
    bounds,
    getX,
    getY,
    getSegment,
    xScale,
    yScale,
    colors,
    getRenderingKey,
    segments,
    xAxisLabel,
    yAxisLabel,
  } = state;

  const { margins } = bounds;
  const { fontFamily, axisLabelFontSize, labelFontSize } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  // Group data by segment for multiple series
  const seriesData = useMemo(() => {
    const groupedData = new Map<string, Array<{
      value: [number, number];
      observation: unknown;
      key: string;
    }>>();

    // Initialize groups for all segments
    segments.forEach((segment) => {
      groupedData.set(segment, []);
    });

    // Group observations by segment
    chartData.forEach((observation) => {
      const segment = getSegment(observation);
      const x = getX(observation);
      const y = getY(observation);
      const key = getRenderingKey(observation);

      if (x !== null && y !== null && !isNaN(x) && !isNaN(y)) {
        const group = groupedData.get(segment);
        if (group) {
          group.push({
            value: [x, y],
            observation,
            key,
          });
        }
      }
    });

    return groupedData;
  }, [chartData, getX, getY, getSegment, getRenderingKey, segments]);

  // Build ECharts series
  const series: ScatterSeriesOption[] = useMemo(() => {
    return segments.map((segment) => {
      const data = seriesData.get(segment) || [];
      const color = colors(segment);

      return {
        type: "scatter" as const,
        name: segment,
        data: data.map((d) => ({
          value: d.value,
          itemStyle: { color },
        })),
        symbolSize: 10,
        emphasis: {
          focus: "series",
          itemStyle: {
            borderWidth: 2,
            borderColor: "#000",
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        label: {
          show: false,
        },
        animationDuration: enableTransition ? transitionDuration : 0,
        animationEasing: "cubicOut" as const,
      };
    });
  }, [segments, seriesData, colors, enableTransition, transitionDuration]);

  // Build ECharts option
  const option: EChartsOption = useMemo(() => {
    return {
      ...ECHARTS_SWISS_THEME,
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
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as {
            seriesName: string;
            value: [number, number];
            color: string;
          };
          return `<strong>${p.seriesName}</strong><br/>
            ${xAxisLabel || "X"}: ${p.value[0]}<br/>
            ${yAxisLabel || "Y"}: ${p.value[1]}`;
        },
      },
      legend: segments.length > 1 ? {
        type: "scroll",
        orient: "horizontal",
        bottom: 10,
        textStyle: {
          fontFamily,
          fontSize: labelFontSize,
        },
      } : undefined,
      xAxis: {
        type: "value",
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
        },
        axisLine: {
          lineStyle: { color: "rgba(0, 0, 0, 0.54)" },
        },
        splitLine: {
          lineStyle: { color: "rgba(0, 0, 0, 0.08)" },
        },
        min: xScale.domain()[0],
        max: xScale.domain()[1],
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
    enableTransition,
    transitionDuration,
    margins,
    segments,
    fontFamily,
    labelFontSize,
    xAxisLabel,
    yAxisLabel,
    axisLabelFontSize,
    xScale,
    yScale,
    series,
  ]);

  // Event handlers for interaction
  const onEvents = useMemo(() => {
    return {
      click: (params: unknown) => {
        const p = params as {
          seriesIndex: number;
          dataIndex: number;
        };
        const segment = segments[p.seriesIndex];
        const data = seriesData.get(segment);
        if (data && data[p.dataIndex]) {
          const observation = data[p.dataIndex].observation;
          // Trigger tooltip or annotation interaction
          console.log("Scatter point clicked:", observation);
        }
      },
    };
  }, [segments, seriesData]);

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

export default EChartsScatterplot;
