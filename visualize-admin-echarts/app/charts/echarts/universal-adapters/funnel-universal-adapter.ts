/**
 * Universal Funnel Chart Adapter
 *
 * A pure function adapter for funnel charts.
 * Shows a funnel/pyramid visualization for sequential data.
 *
 * Lines of code: ~65
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

import type { EChartsOption } from "echarts";

// ============================================================================
// Funnel Data Building
// ============================================================================

interface FunnelDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

/**
 * Builds funnel data from universal chart state.
 */
const buildFunnelData = (state: UniversalChartState): FunnelDataItem[] => {
  const { observations, fields, colors, segments } = state;
  const { getSegment, getY } = fields;

  if (!getSegment || !getY) {
    return [];
  }

  // Build funnel data in segment order (typically sorted by value)
  const segmentValues = new Map<string, number>();

  observations.forEach((d) => {
    const segment = getSegment(d);
    const value = getY(d) ?? 0;
    segmentValues.set(segment, (segmentValues.get(segment) ?? 0) + value);
  });

  return segments
    .map((segment, index) => ({
      name: segment,
      value: segmentValues.get(segment) ?? 0,
      itemStyle: {
        color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length],
      },
    }))
    .filter((d) => d.value > 0);
};

// ============================================================================
// Funnel Adapter Function
// ============================================================================

/**
 * Universal Funnel Chart Adapter
 *
 * Transforms UniversalChartState into ECharts funnel chart configuration.
 */
export const funnelUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { options } = state;
  const showValues = options.showValues !== false;

  // Build funnel data
  const funnelData = buildFunnelData(state);

  const animation = getDefaultAnimation();

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `${p.name}: ${p.value.toLocaleString()}`;
      },
    },
    legend: createLegend(),
    series: [
      {
        type: "funnel",
        left: "10%",
        top: 60,
        bottom: 60,
        width: "80%",
        min: 0,
        max: Math.max(...funnelData.map((d) => d.value), 100),
        minSize: "0%",
        maxSize: "100%",
        sort: "descending",
        gap: 2,
        data: funnelData,
        label: {
          show: showValues,
          position: "inside",
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 12,
          color: "#fff",
          formatter: (params: unknown) => {
            const p = params as { name: string; value: number };
            return `${p.name}`;
          },
        },
        labelLine: {
          show: false,
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("funnel", funnelUniversalAdapter);
