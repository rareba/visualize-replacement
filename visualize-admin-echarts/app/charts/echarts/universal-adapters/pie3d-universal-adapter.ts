/**
 * Universal 3D Pie Chart Adapter
 *
 * A pure function adapter for 3D pie charts using ECharts GL.
 * Displays data as a 3D pie chart with depth.
 *
 * Note: ECharts doesn't have a native 3D pie chart in ECharts GL,
 * so this implements a pseudo-3D effect using the standard pie chart
 * with shadow effects to create depth perception.
 *
 * Lines of code: ~100
 */

import {
  getDefaultAnimation,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, PieSeriesOption } from "echarts";

// ============================================================================
// 3D Pie Adapter Function
// ============================================================================

/**
 * Universal 3D Pie Chart Adapter
 *
 * Transforms UniversalChartState into ECharts pie configuration with 3D effect.
 */
export const pie3dUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, segments } = state;
  const { getSegment, getY } = fields;

  const animation = getDefaultAnimation();

  // Aggregate values by segment
  const segmentValues = new Map<string, number>();

  observations.forEach((d) => {
    if (!getSegment || !getY) return;

    const segment = getSegment(d);
    const value = getY(d) ?? 0;

    segmentValues.set(segment, (segmentValues.get(segment) ?? 0) + value);
  });

  // Build pie data
  const pieData = segments
    .map((segment, index) => ({
      name: segment,
      value: segmentValues.get(segment) ?? 0,
      itemStyle: {
        color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length],
        shadowBlur: 20,
        shadowColor: "rgba(0, 0, 0, 0.3)",
        shadowOffsetX: 5,
        shadowOffsetY: 5,
      },
    }))
    .filter((d) => d.value > 0);

  // Create multiple pie layers for 3D depth effect
  const basePie: PieSeriesOption = {
    type: "pie",
    radius: ["30%", "70%"],
    center: ["50%", "55%"],
    roseType: "radius", // Rose type gives a pseudo-3D effect
    data: pieData,
    label: {
      show: true,
      formatter: (params: unknown) => {
        const p = params as { name: string; percent: number };
        const percent = p.percent ?? 0;
        return `${p.name}\n${percent.toFixed(1)}%`;
      },
      position: "outside",
    },
    labelLine: {
      length: 15,
      length2: 10,
      smooth: true,
    },
    emphasis: {
      scaleSize: 10,
      itemStyle: {
        shadowBlur: 30,
        shadowOffsetX: 10,
        shadowOffsetY: 10,
        shadowColor: "rgba(0, 0, 0, 0.5)",
      },
    },
    animationType: "scale",
    animationEasing: "elasticOut",
    animationDuration: animation.animationDuration,
  };

  // Shadow layer for depth
  const shadowPie: PieSeriesOption = {
    type: "pie",
    radius: ["30%", "70%"],
    center: ["52%", "57%"],
    roseType: "radius",
    data: pieData.map((d) => ({
      ...d,
      itemStyle: {
        ...d.itemStyle,
        color: "rgba(0, 0, 0, 0.2)",
        shadowBlur: 0,
        shadowColor: "transparent",
      },
    })),
    label: { show: false },
    labelLine: { show: false },
    silent: true,
    z: 0,
  };

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        const value = p.value ?? 0;
        const percent = p.percent ?? 0;
        const formattedValue = metadata.formatNumber
          ? metadata.formatNumber(value)
          : value;
        return `${p.name}<br/>Value: ${formattedValue}<br/>Percent: ${percent.toFixed(1)}%`;
      },
    },
    legend: {
      show: true,
      orient: "horizontal",
      top: "top",
      data: segments,
    },
    series: [shadowPie, basePie],
  };
};

// Register the adapter
registerChartAdapter("pie3d", pie3dUniversalAdapter);
