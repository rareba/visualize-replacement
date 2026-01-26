/**
 * Universal 3D Surface Chart Adapter
 *
 * A pure function adapter for 3D surface charts using ECharts GL.
 * Displays data as a 3D surface mesh.
 *
 * Lines of code: ~110
 */

// Animation import removed - not used in 3D surface adapter currently
// import { getDefaultAnimation } from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// 3D Surface Adapter Function
// ============================================================================

/**
 * Universal 3D Surface Chart Adapter
 *
 * Transforms UniversalChartState into ECharts 3D surface configuration.
 */
export const surfaceUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, metadata, categories, segments } = state;
  const { getX, getY, getSegment } = fields;

  // Create surface data grid
  const xCategories = [...categories];
  const yCategories = segments.length > 0 ? [...segments] : ["Value"];

  // Build data map
  const dataMap = new Map<string, number>();
  let minValue = Infinity;
  let maxValue = -Infinity;

  observations.forEach((d) => {
    if (!getX || !getY) return;

    const xCategory = getX(d) as string;
    const yCategory = getSegment ? getSegment(d) : "Value";
    const value = getY(d) ?? 0;

    const key = `${xCategory}-${yCategory}`;
    dataMap.set(key, value);

    minValue = Math.min(minValue, value);
    maxValue = Math.max(maxValue, value);
  });

  // Build surface data as a 2D grid
  const surfaceData: Array<[number, number, number]> = [];

  xCategories.forEach((xCat, xIdx) => {
    yCategories.forEach((yCat, yIdx) => {
      const key = `${xCat}-${yCat}`;
      const value = dataMap.get(key) ?? 0;
      surfaceData.push([xIdx, yIdx, value]);
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
      show: true,
      min: minValue === Infinity ? 0 : minValue,
      max: maxValue === -Infinity ? 100 : maxValue,
      inRange: {
        color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"],
      },
      right: 10,
      top: "center",
    },
    xAxis3D: {
      type: "category",
      data: xCategories,
      name: metadata.xAxisLabel || "",
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
        alpha: 30,
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
        type: "surface",
        wireframe: {
          show: true,
          lineStyle: {
            color: "rgba(0,0,0,0.2)",
          },
        },
        data: surfaceData,
        shading: "color",
      },
    ],
  } as EChartsOption;
};

// Register the adapter
registerChartAdapter("surface", surfaceUniversalAdapter);
