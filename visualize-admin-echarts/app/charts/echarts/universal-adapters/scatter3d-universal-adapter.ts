/**
 * Universal 3D Scatter Chart Adapter
 *
 * A pure function adapter for 3D scatter charts using ECharts GL.
 * Displays data points in a 3D coordinate system.
 *
 * Lines of code: ~100
 */

// Animation import removed - not used in 3D scatter adapter currently
// import { getDefaultAnimation } from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// 3D Scatter Adapter Function
// ============================================================================

/**
 * Universal 3D Scatter Chart Adapter
 *
 * Transforms UniversalChartState into ECharts 3D scatter configuration.
 */
export const scatter3dUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, segments } = state;
  const { getX, getY, getSegment, getValue } = fields;

  // Group data by segment for different colors
  const segmentDataMap = new Map<string, Array<[number, number, number]>>();

  observations.forEach((d, idx) => {
    if (!getY) return;

    const xValue = getX ? (typeof getX(d) === "number" ? getX(d) : idx) : idx;
    const yValue = getY(d) ?? 0;
    const zValue = getValue ? getValue(d) ?? 0 : idx;
    const segment = getSegment ? getSegment(d) : "default";

    if (!segmentDataMap.has(segment)) {
      segmentDataMap.set(segment, []);
    }
    segmentDataMap.get(segment)!.push([xValue as number, yValue, zValue]);
  });

  // Build series for each segment
  const series = Array.from(segmentDataMap.entries()).map(([segment, data], idx) => ({
    type: "scatter3D" as const,
    name: segment,
    data,
    symbolSize: 8,
    itemStyle: {
      color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[idx % SWISS_FEDERAL_COLORS.palette.length],
      opacity: 0.8,
    },
    emphasis: {
      itemStyle: {
        color: SWISS_FEDERAL_COLORS.primary,
        opacity: 1,
      },
    },
  }));

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { seriesName: string; value: [number, number, number] };
        const formattedY = metadata.formatNumber
          ? metadata.formatNumber(p.value[1])
          : p.value[1];
        return `${p.seriesName}<br/>X: ${p.value[0]}<br/>Y: ${formattedY}<br/>Z: ${p.value[2]}`;
      },
    },
    legend: {
      show: segments.length > 0,
      top: 10,
      data: segments,
    },
    xAxis3D: {
      type: "value",
      name: metadata.xAxisLabel || "X",
    },
    yAxis3D: {
      type: "value",
      name: metadata.yAxisLabel || "Y",
    },
    zAxis3D: {
      type: "value",
      name: "Z",
    },
    grid3D: {
      boxWidth: 100,
      boxHeight: 80,
      boxDepth: 80,
      viewControl: {
        autoRotate: false,
        distance: 180,
        alpha: 20,
        beta: 40,
      },
      light: {
        main: {
          intensity: 1.2,
        },
        ambient: {
          intensity: 0.3,
        },
      },
    },
    series,
  } as EChartsOption;
};

// Register the adapter
registerChartAdapter("scatter3d", scatter3dUniversalAdapter);
