/**
 * Universal Heatmap Chart Adapter
 *
 * A pure function adapter for heatmap charts.
 * Displays matrix data using color intensity.
 *
 * Lines of code: ~140
 */

import {
  getDefaultAnimation,
  getHeatmapColorRange,
  HeatmapColorField,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";
import { getColorInterpolator } from "@/palettes";

import type { EChartsOption, HeatmapSeriesOption } from "echarts";

// ============================================================================
// Heatmap Adapter Function
// ============================================================================

/**
 * Universal Heatmap Chart Adapter
 *
 * Transforms UniversalChartState into ECharts heatmap configuration.
 */
export const heatmapUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, bounds, metadata, categories, segments, chartConfig } = state;
  const { getX, getSegment, getValue } = fields;

  // Extract heatmap color field from chart config
  const heatmapColorField = chartConfig?.fields &&
    "color" in chartConfig.fields &&
    chartConfig.fields.color &&
    typeof chartConfig.fields.color === "object" &&
    "type" in chartConfig.fields.color &&
    (chartConfig.fields.color.type === "sequential" || chartConfig.fields.color.type === "diverging")
      ? (chartConfig.fields.color as HeatmapColorField)
      : undefined;

  const animation = getDefaultAnimation();
  const safeBounds = safeGetBounds(bounds);

  // X categories from state categories, Y categories from segments
  const xCategories = categories;
  const yCategories = segments.length > 0 ? segments : [...new Set(observations.map((d) => getSegment?.(d) || ""))].filter(Boolean);

  // Build heatmap data: [xIndex, yIndex, value]
  const data: [number, number, number][] = [];
  let minValue = Infinity;
  let maxValue = -Infinity;

  observations.forEach((d) => {
    if (!getX || !getValue) return;

    const xVal = getX(d) as string;
    const yVal = getSegment?.(d) || "";
    const value = getValue(d) ?? 0;

    const xIdx = xCategories.indexOf(xVal);
    const yIdx = yCategories.indexOf(yVal);

    if (xIdx !== -1 && yIdx !== -1) {
      data.push([xIdx, yIdx, value]);
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }
  });

  // Handle edge case where no data
  if (minValue === Infinity) minValue = 0;
  if (maxValue === -Infinity) maxValue = 100;

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      position: "top",
      formatter: (params: unknown) => {
        const p = params as { data: [number, number, number] };
        const [xIdx, yIdx, value] = p.data;
        const xLabel = xCategories[xIdx] || "";
        const yLabel = yCategories[yIdx] || "";
        const formattedValue = metadata.formatNumber
          ? metadata.formatNumber(value)
          : value;
        return `${xLabel} - ${yLabel}: ${formattedValue}`;
      },
    },
    grid: {
      left: safeBounds.margins.left,
      right: safeBounds.margins.right,
      top: safeBounds.margins.top,
      bottom: safeBounds.margins.bottom + 40, // Extra space for visualMap
      containLabel: false,
    },
    xAxis: {
      type: "category" as const,
      data: xCategories,
      name: metadata.xAxisLabel,
      boundaryGap: true,
      splitArea: {
        show: true,
      },
      axisLabel: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 11,
      },
    },
    yAxis: {
      type: "category" as const,
      data: yCategories,
      name: metadata.yAxisLabel,
      boundaryGap: true,
      splitArea: {
        show: true,
      },
      axisLabel: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 11,
      },
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: "horizontal" as const,
      left: "center",
      bottom: 10,
      inRange: {
        color: getHeatmapColorRange(heatmapColorField, getColorInterpolator),
      },
      textStyle: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 11,
      },
    },
    series: [
      {
        type: "heatmap",
        data: data,
        label: {
          show: data.length <= 100, // Only show labels for smaller grids
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 10,
          formatter: (params: unknown) => {
            const p = params as { data: [number, number, number] };
            const value = p.data[2];
            if (metadata.formatNumber) {
              return metadata.formatNumber(value);
            }
            return value.toFixed(0);
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
        },
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
      } as HeatmapSeriesOption,
    ],
  };
};

// Register the adapter
registerChartAdapter("heatmap", heatmapUniversalAdapter);
