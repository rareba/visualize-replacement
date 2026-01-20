/**
 * ECharts Bar Chart Bridge (Horizontal Bars)
 *
 * This component bridges the existing BarsState (D3-based state)
 * to ECharts rendering for horizontal bar charts.
 *
 * Note: In this codebase, "bar" refers to horizontal bars,
 * while "column" refers to vertical bars.
 *
 * Usage:
 * Replace <Bars /> with <EChartsBars /> in chart-bar.tsx
 * when using the RENDER_ENGINE="echarts" feature flag.
 */

import ReactECharts from "echarts-for-react";
import React, { useMemo } from "react";

import { BarsState } from "@/charts/bar/bars-state";
import { useChartState } from "@/charts/shared/chart-state";
import { useChartTheme } from "@/charts/shared/use-chart-theme";
import { useTransitionStore } from "@/stores/transition";

import type { BarSeriesOption, EChartsOption } from "echarts";

// Swiss Federal theme for ECharts
const ECHARTS_SWISS_THEME = {
  fontFamily:
    '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textStyle: {
    fontFamily:
      '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export const EChartsBars: React.FC = () => {
  const state = useChartState() as BarsState;
  const {
    chartData,
    bounds,
    getY,
    getX,
    yScale,
    xScale,
    colors,
    getRenderingKey,
    showValues,
    xAxisLabel,
    yAxisLabel,
  } = state;

  const { margins } = bounds;
  const { labelFontSize, fontFamily, axisLabelFontSize } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  // Transform chart data into ECharts format (horizontal bars)
  const { categories, seriesData } = useMemo(() => {
    const categories = yScale.domain();
    const seriesData = categories.map((cat) => {
      const observation = chartData.find((d) => getY(d) === cat);
      if (!observation) return { value: 0, observation: null };

      const value = getX(observation);
      const key = getRenderingKey(observation);
      const color = colors.copy()(key);

      return {
        value: value ?? 0,
        itemStyle: { color },
        observation,
      };
    });

    return { categories, seriesData };
  }, [chartData, yScale, getY, getX, getRenderingKey, colors]);

  // Build ECharts option
  const option: EChartsOption = useMemo(() => {
    const series: BarSeriesOption = {
      type: "bar",
      data: seriesData.map((d) => ({
        value: d.value,
        itemStyle: d.itemStyle,
      })),
      label: showValues
        ? {
            show: true,
            position: "right",
            fontSize: labelFontSize,
            fontFamily,
            formatter: (params: unknown) => {
              const p = params as { value: number };
              return String(p.value);
            },
          }
        : undefined,
      emphasis: {
        focus: "series",
        itemStyle: {
          borderWidth: 2,
          borderColor: "#000",
        },
      },
      animationDuration: enableTransition ? transitionDuration : 0,
      animationEasing: "cubicOut",
      barMaxWidth: yScale.bandwidth ? yScale.bandwidth() : undefined,
    };

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
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      // Y axis is the category axis for horizontal bars
      yAxis: {
        type: "category",
        data: categories,
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
          lineStyle: { color: "rgba(0, 0, 0, 0.54)" },
        },
        axisTick: {
          alignWithLabel: true,
        },
        splitLine: {
          show: false,
        },
      },
      // X axis is the value axis for horizontal bars
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
          show: true,
          lineStyle: { color: "rgba(0, 0, 0, 0.54)" },
        },
        splitLine: {
          lineStyle: { color: "rgba(0, 0, 0, 0.08)" },
        },
        min: xScale.domain()[0],
        max: xScale.domain()[1],
      },
      series: [series],
    };
  }, [
    seriesData,
    categories,
    showValues,
    labelFontSize,
    fontFamily,
    enableTransition,
    transitionDuration,
    yScale,
    margins,
    xAxisLabel,
    yAxisLabel,
    axisLabelFontSize,
    xScale,
  ]);

  // Event handlers for interaction
  const onEvents = useMemo(() => {
    return {
      click: (params: unknown) => {
        const p = params as { dataIndex: number };
        const observation = seriesData[p.dataIndex]?.observation;
        if (observation) {
          console.log("Bar clicked:", observation);
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

export default EChartsBars;
