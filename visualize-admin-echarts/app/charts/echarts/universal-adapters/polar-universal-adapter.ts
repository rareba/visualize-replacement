/**
 * Universal Polar Chart Adapter
 *
 * A pure function adapter for polar charts.
 * Displays data in circular coordinate system.
 *
 * Lines of code: ~110
 */

import {
  createItemTooltip,
  createLegend,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Polar Adapter Function
// ============================================================================

/**
 * Universal Polar Chart Adapter
 *
 * Transforms UniversalChartState into ECharts polar configuration.
 */
export const polarUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, options } = state;
  const { getSegment, getY } = fields;

  // Build polar data from state
  const polarData = observations
    .map((d, index) => {
      if (!getSegment || !getY) return null;
      const segment = getSegment(d);
      return {
        name: segment,
        value: getY(d) ?? 0,
        itemStyle: {
          color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length],
        },
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.value > 0);

  const categories = polarData.map((d) => d.name);
  const maxValue = Math.max(...polarData.map((d) => d.value), 0);

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number };
        const formattedValue = metadata.formatNumber
          ? metadata.formatNumber(p.value)
          : p.value;
        return `${p.name}: ${formattedValue}`;
      },
    },
    legend: createLegend(),
    polar: {
      radius: ["20%", "80%"],
    },
    angleAxis: {
      type: "category",
      data: categories,
      startAngle: 90,
      axisLabel: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 11,
      },
    },
    radiusAxis: {
      type: "value",
      max: maxValue * 1.1,
      axisLabel: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 10,
      },
    },
    series: [
      {
        type: "bar",
        coordinateSystem: "polar",
        data: polarData,
        label: {
          show: options.showValues !== false,
          position: "end",
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 10,
          formatter: (params: unknown) => {
            const p = params as { value: number };
            return metadata.formatNumber
              ? metadata.formatNumber(p.value)
              : String(p.value);
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("polar", polarUniversalAdapter);
