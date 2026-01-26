/**
 * Universal 3D Line Chart Adapter
 *
 * A pure function adapter for 3D line charts using ECharts GL.
 * Displays data as 3D lines in a 3D coordinate system.
 *
 * Lines of code: ~100
 */

// Animation import removed - not used in 3D line adapter currently
// import { getDefaultAnimation } from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// 3D Line Adapter Function
// ============================================================================

/**
 * Universal 3D Line Chart Adapter
 *
 * Transforms UniversalChartState into ECharts 3D line configuration.
 */
export const line3dUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, segments } = state;
  const { getX, getY, getSegment, getValue } = fields;

  // Group data by segment for different lines
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

  // Sort each segment's data by x value
  segmentDataMap.forEach((data) => {
    data.sort((a, b) => a[0] - b[0]);
  });

  // Build series for each segment
  const series = Array.from(segmentDataMap.entries()).map(([segment, data], idx) => ({
    type: "line3D" as const,
    name: segment,
    data,
    lineStyle: {
      width: 3,
      color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[idx % SWISS_FEDERAL_COLORS.palette.length],
    },
    emphasis: {
      lineStyle: {
        width: 5,
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
registerChartAdapter("line3d", line3dUniversalAdapter);
