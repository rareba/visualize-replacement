/**
 * ECharts Area Chart Bridge
 *
 * This component bridges the existing AreasState (D3-based state)
 * to ECharts rendering. It consumes the same state context but uses
 * ECharts for visualization instead of D3 selections.
 *
 * Usage:
 * Replace <Areas /> with <EChartsAreas /> in chart-area.tsx
 * when using the RENDER_ENGINE="echarts" feature flag.
 */

import ReactECharts from "echarts-for-react";
import React, { useMemo } from "react";

import { AreasState } from "@/charts/area/areas-state";
import { useChartState } from "@/charts/shared/chart-state";
import { useChartTheme } from "@/charts/shared/use-chart-theme";
import { useTransitionStore } from "@/stores/transition";

import type { EChartsOption, LineSeriesOption } from "echarts";

// Swiss Federal theme for ECharts
const ECHARTS_SWISS_THEME = {
  fontFamily:
    '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textStyle: {
    fontFamily:
      '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export const EChartsAreas: React.FC = () => {
  const state = useChartState() as AreasState;
  const {
    bounds,
    xScale,
    yScale,
    series,
    segments,
    colors,
    xAxisLabel,
    yAxisLabel,
  } = state;

  const { margins } = bounds;
  const { fontFamily, axisLabelFontSize, labelFontSize } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  // Build ECharts series from D3 stacked series
  const echartsSeries: LineSeriesOption[] = useMemo(() => {
    if (!series || series.length === 0) {
      return [];
    }

    return series.map((s) => {
      const segmentKey = s.key;
      const color = colors(segmentKey);

      // Extract data points from the stacked series
      const data = s.map((point) => {
        // For stacked areas, we use the upper value (y1)
        // point is [y0, y1] where y0 is bottom and y1 is top
        return point[1];
      });

      return {
        type: "line" as const,
        name: segmentKey,
        stack: "total",
        areaStyle: {
          opacity: 0.7,
        },
        data,
        itemStyle: { color },
        lineStyle: { color, width: 1 },
        emphasis: {
          focus: "series",
        },
        symbol: "none",
        smooth: false,
        animationDuration: enableTransition ? transitionDuration : 0,
        animationEasing: "cubicOut" as const,
      };
    });
  }, [series, colors, enableTransition, transitionDuration]);

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
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
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
        type: "time",
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
          show: false,
        },
        min: xScale.domain()[0].getTime(),
        max: xScale.domain()[1].getTime(),
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
      series: echartsSeries,
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
    echartsSeries,
  ]);

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
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default EChartsAreas;
