/**
 * Universal Radar Chart Adapter
 *
 * A pure function adapter for radar charts.
 * Displays multi-variable data on axes starting from the same point.
 *
 * Lines of code: ~140
 */

import {
  createItemTooltip,
  createLegend,
  getDefaultAnimation,
} from "@/charts/echarts/adapter-utils";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, RadarSeriesOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

interface RadarIndicator {
  name: string;
  max?: number;
}

interface RadarDataItem {
  name: string;
  value: number[];
  itemStyle: { color: string };
  areaStyle?: { opacity: number };
}

// ============================================================================
// Radar Adapter Function
// ============================================================================

/**
 * Universal Radar Chart Adapter
 *
 * Transforms UniversalChartState into ECharts radar configuration.
 */
export const radarUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, categories } = state;
  const { getSegment, getY, getX } = fields;

  const animation = getDefaultAnimation();

  // Create indicators from categories
  const indicators: RadarIndicator[] = categories.map((cat) => ({
    name: cat,
    max: 100, // Will be updated later
  }));

  // Track max values per indicator
  const indicatorMaxValues: number[] = new Array(categories.length).fill(0);

  // Group data by segment
  const groupedData = new Map<string, { name: string; values: number[]; color: string }>();

  observations.forEach((d) => {
    if (!getSegment || !getY || !getX) return;

    const segment = getSegment(d);
    const category = getX(d) as string;
    const value = getY(d) ?? 0;
    const color = colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[groupedData.size % SWISS_FEDERAL_COLORS.palette.length];

    if (!groupedData.has(segment)) {
      groupedData.set(segment, {
        name: segment,
        values: new Array(categories.length).fill(0),
        color,
      });
    }

    const categoryIdx = categories.indexOf(category);
    if (categoryIdx !== -1) {
      const entry = groupedData.get(segment)!;
      entry.values[categoryIdx] = value;
      indicatorMaxValues[categoryIdx] = Math.max(indicatorMaxValues[categoryIdx], value);
    }
  });

  // Update indicator max values with padding
  indicators.forEach((indicator, idx) => {
    indicator.max = indicatorMaxValues[idx] * 1.2 || 100;
  });

  // Build series data
  const seriesData: RadarDataItem[] = Array.from(groupedData.values()).map((item) => ({
    name: item.name,
    value: item.values,
    itemStyle: { color: item.color },
    areaStyle: { opacity: 0.2 },
  }));

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      trigger: "item",
    },
    legend: createLegend(),
    radar: {
      indicator: indicators,
      center: ["50%", "55%"],
      radius: "65%",
      axisName: {
        color: SWISS_FEDERAL_COLORS.text,
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 11,
      },
      splitArea: {
        areaStyle: {
          color: ["rgba(0, 0, 0, 0.02)", "rgba(0, 0, 0, 0.04)"],
        },
      },
      axisLine: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
      splitLine: {
        lineStyle: {
          color: SWISS_FEDERAL_COLORS.axis,
        },
      },
    },
    series: [
      {
        type: "radar" as const,
        data: seriesData,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
        },
        emphasis: {
          areaStyle: {
            opacity: 0.3,
          },
          lineStyle: {
            width: 3,
          },
        },
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
      } as RadarSeriesOption,
    ],
  };
};

// Register the adapter
registerChartAdapter("radar", radarUniversalAdapter);
