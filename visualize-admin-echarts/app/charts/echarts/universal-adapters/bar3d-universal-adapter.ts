/**
 * Universal 3D Bar Chart Adapter
 *
 * A pure function adapter for 3D bar charts using ECharts GL.
 * Displays data as 3D bars in a 3D coordinate system.
 *
 * Lines of code: ~120
 */

import {
  getDefaultAnimation,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

interface Bar3DDataItem {
  value: [number, number, number]; // [x, y, z]
  itemStyle?: { color: string };
}

// ============================================================================
// 3D Bar Adapter Function
// ============================================================================

/**
 * Universal 3D Bar Chart Adapter
 *
 * Transforms UniversalChartState into ECharts 3D bar configuration.
 * Uses ECharts GL for 3D rendering.
 */
export const bar3dUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, categories, segments } = state;
  const { getX, getY, getSegment } = fields;

  const animation = getDefaultAnimation();

  // Build 3D bar data
  const bar3dData: Bar3DDataItem[] = [];
  const xCategories = [...categories];
  const yCategories = segments.length > 0 ? [...segments] : ["Value"];

  // Create a map for quick lookup
  const dataMap = new Map<string, number>();

  observations.forEach((d) => {
    if (!getX || !getY) return;

    const xCategory = getX(d) as string;
    const yCategory = getSegment ? getSegment(d) : "Value";
    const value = getY(d) ?? 0;

    const key = `${xCategory}-${yCategory}`;
    dataMap.set(key, value);
  });

  // Build data array for bar3D
  xCategories.forEach((xCat, xIdx) => {
    yCategories.forEach((yCat, yIdx) => {
      const key = `${xCat}-${yCat}`;
      const value = dataMap.get(key) ?? 0;
      const color = colors.getColor(yCat) || SWISS_FEDERAL_COLORS.palette[yIdx % SWISS_FEDERAL_COLORS.palette.length];

      bar3dData.push({
        value: [xIdx, yIdx, value],
        itemStyle: { color },
      });
    });
  });

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { value: [number, number, number] };
        const xCat = xCategories[p.value[0]] || "";
        const yCat = yCategories[p.value[1]] || "";
        const val = p.value[2];
        const formattedValue = metadata.formatNumber
          ? metadata.formatNumber(val)
          : val;
        return `${xCat}<br/>${yCat}: ${formattedValue}`;
      },
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(...bar3dData.map((d) => d.value[2]), 1),
      inRange: {
        color: SWISS_FEDERAL_COLORS.palette,
      },
    },
    xAxis3D: {
      type: "category",
      data: xCategories,
      name: metadata.xAxisLabel || "",
      axisLabel: {
        interval: 0,
      },
    },
    yAxis3D: {
      type: "category",
      data: yCategories,
      name: segments.length > 0 ? "Segment" : "",
    },
    zAxis3D: {
      type: "value",
      name: metadata.yAxisLabel || "Value",
    },
    grid3D: {
      boxWidth: 100,
      boxHeight: 80,
      boxDepth: 80,
      viewControl: {
        autoRotate: false,
        distance: 200,
        alpha: 25,
        beta: 40,
      },
      light: {
        main: {
          intensity: 1.2,
          shadow: true,
        },
        ambient: {
          intensity: 0.3,
        },
      },
    },
    series: [
      {
        type: "bar3D",
        data: bar3dData,
        shading: "lambert",
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            color: "#000",
          },
          itemStyle: {
            color: SWISS_FEDERAL_COLORS.primary,
          },
        },
        animationDurationUpdate: animation.animationDuration,
      },
    ],
  } as EChartsOption;
};

// Register the adapter
registerChartAdapter("bar3d", bar3dUniversalAdapter);
