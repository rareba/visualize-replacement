/**
 * ECharts Column Chart Bridge
 *
 * This component bridges the existing ColumnsState (D3-based state)
 * to ECharts rendering. It consumes the same state context but uses
 * ECharts for visualization instead of D3 selections.
 *
 * Usage:
 * Replace <Columns /> with <EChartsColumns /> in chart-column.tsx
 * when using the RENDER_ENGINE="echarts" feature flag.
 */

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption, BarSeriesOption } from "echarts";

import { ColumnsState } from "@/charts/column/columns-state";
import { useChartState } from "@/charts/shared/chart-state";
import { useChartTheme } from "@/charts/shared/use-chart-theme";
import { useTransitionStore } from "@/stores/transition";

// Swiss Federal theme for ECharts
const ECHARTS_SWISS_THEME = {
  fontFamily:
    '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textStyle: {
    fontFamily:
      '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export const EChartsColumns: React.FC = () => {
  const state = useChartState() as ColumnsState;
  const {
    chartData,
    bounds,
    getX,
    getY,
    xScale,
    yScale,
    colors,
    getRenderingKey,
    showValues,
    formatValue,
    xDimension,
    xAxisLabel,
    yAxisLabel,
    formatXAxisTick,
  } = state;

  const { margins, chartWidth, chartHeight } = bounds;
  const { labelFontSize, fontFamily, axisLabelFontSize } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  // Transform chart data into ECharts format
  const { categories, seriesData } = useMemo(() => {
    const categories = xScale.domain();
    const seriesData = categories.map((cat) => {
      const observation = chartData.find((d) => getX(d) === cat);
      if (!observation) return { value: 0, observation: null };

      const value = getY(observation);
      const key = getRenderingKey(observation);
      const color = colors.copy()(key);

      return {
        value: value ?? 0,
        itemStyle: { color },
        observation,
      };
    });

    return { categories, seriesData };
  }, [chartData, xScale, getX, getY, getRenderingKey, colors]);

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
            position: "top",
            fontSize: labelFontSize,
            fontFamily,
            formatter: (params: any) => {
              const value = params.value;
              return formatValue ? formatValue(value) : String(value);
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
      barMaxWidth: xScale.bandwidth(),
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
      xAxis: {
        type: "category",
        data: categories,
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
          formatter: formatXAxisTick,
          rotate: categories.length > 10 ? 45 : 0,
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
      series: [series],
    };
  }, [
    seriesData,
    categories,
    showValues,
    labelFontSize,
    fontFamily,
    formatValue,
    enableTransition,
    transitionDuration,
    xScale,
    margins,
    xAxisLabel,
    yAxisLabel,
    axisLabelFontSize,
    formatXAxisTick,
    yScale,
  ]);

  // Event handlers for interaction
  const onEvents = useMemo(() => {
    return {
      click: (params: any) => {
        const observation = seriesData[params.dataIndex]?.observation;
        if (observation) {
          // Trigger tooltip or annotation interaction
          console.log("Column clicked:", observation);
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

/**
 * ECharts Error Whiskers for Column Charts
 *
 * Renders error bars using ECharts custom series
 */
export const EChartsErrorWhiskers: React.FC = () => {
  const state = useChartState() as ColumnsState;
  const {
    chartData,
    bounds,
    getX,
    getY,
    getYErrorPresent,
    getYErrorRange,
    xScale,
    yScale,
    showYUncertainty,
  } = state;

  const { margins, chartWidth, chartHeight } = bounds;
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);
  const bandwidth = xScale.bandwidth();

  // Prepare error bar data
  const errorData = useMemo(() => {
    if (!getYErrorRange || !showYUncertainty) {
      return [];
    }

    return chartData.filter(getYErrorPresent).map((d) => {
      const x = getX(d);
      const y = getY(d) ?? 0;
      const [low, high] = getYErrorRange(d);
      return { x, y, low, high };
    });
  }, [chartData, getYErrorPresent, getYErrorRange, getX, getY, showYUncertainty]);

  if (errorData.length === 0) {
    return null;
  }

  const option: EChartsOption = useMemo(() => {
    return {
      grid: {
        left: margins.left,
        right: margins.right,
        top: margins.top,
        bottom: margins.bottom,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: xScale.domain(),
        show: false,
      },
      yAxis: {
        type: "value",
        show: false,
        min: yScale.domain()[0],
        max: yScale.domain()[1],
      },
      series: [
        {
          type: "custom",
          renderItem: (params: any, api: any) => {
            const xValue = api.value(0);
            const xCoord = api.coord([xValue, 0])[0];
            const lowCoord = api.coord([xValue, api.value(1)])[1];
            const highCoord = api.coord([xValue, api.value(2)])[1];
            const capWidth = Math.min(bandwidth * 0.3, 10);

            return {
              type: "group",
              children: [
                // Vertical line
                {
                  type: "line",
                  shape: {
                    x1: xCoord + bandwidth / 2,
                    y1: lowCoord,
                    x2: xCoord + bandwidth / 2,
                    y2: highCoord,
                  },
                  style: {
                    stroke: "#333",
                    lineWidth: 1,
                  },
                },
                // Top cap
                {
                  type: "line",
                  shape: {
                    x1: xCoord + bandwidth / 2 - capWidth / 2,
                    y1: highCoord,
                    x2: xCoord + bandwidth / 2 + capWidth / 2,
                    y2: highCoord,
                  },
                  style: {
                    stroke: "#333",
                    lineWidth: 1,
                  },
                },
                // Bottom cap
                {
                  type: "line",
                  shape: {
                    x1: xCoord + bandwidth / 2 - capWidth / 2,
                    y1: lowCoord,
                    x2: xCoord + bandwidth / 2 + capWidth / 2,
                    y2: lowCoord,
                  },
                  style: {
                    stroke: "#333",
                    lineWidth: 1,
                  },
                },
              ],
            };
          },
          data: errorData.map((d) => [d.x, d.low, d.high]),
          z: 100,
        },
      ],
      animation: enableTransition,
      animationDuration: transitionDuration,
    };
  }, [errorData, margins, xScale, yScale, bandwidth, enableTransition, transitionDuration]);

  return (
    <ReactECharts
      option={option}
      style={{
        width: bounds.width,
        height: bounds.height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
      notMerge={true}
    />
  );
};

export default EChartsColumns;
