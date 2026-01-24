/**
 * Universal Pie Chart Adapter
 *
 * A pure function adapter that transforms UniversalChartState to ECharts options.
 * This replaces the old PieChartAdapter that required PieState with D3 scales.
 *
 * Lines of code: ~80 (vs ~300+ for old pie chart setup)
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

import type { EChartsOption, PieSeriesOption } from "echarts";

// ============================================================================
// Pie Data Building
// ============================================================================

interface PieDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

/**
 * Builds pie data from universal chart state.
 */
const buildPieData = (state: UniversalChartState): PieDataItem[] => {
  const { observations, fields, colors, segments } = state;
  const { getSegment, getY } = fields;

  if (!getSegment || !getY) {
    return [];
  }

  // Group observations by segment and sum values
  const segmentValues = new Map<string, number>();

  observations.forEach((d) => {
    const segment = getSegment(d);
    const value = getY(d) ?? 0;
    segmentValues.set(segment, (segmentValues.get(segment) ?? 0) + value);
  });

  // Build pie data in segment order
  return segments
    .map((segment, index) => ({
      name: segment,
      value: segmentValues.get(segment) ?? 0,
      itemStyle: {
        // Ensure a valid color is always returned
        color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length],
      },
    }))
    .filter((d) => d.value > 0);
};

// ============================================================================
// Label Configuration
// ============================================================================

/**
 * Creates pie label configuration based on number of slices.
 */
const createPieLabelConfig = (
  showLabelsOutside: boolean,
  showValues: boolean
): PieSeriesOption["label"] => ({
  show: showValues !== false,
  position: showLabelsOutside ? "outside" : "inside",
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 11,
  color: showLabelsOutside ? SWISS_FEDERAL_COLORS.text : "#fff",
  formatter: (params: unknown) => {
    const p = params as { name: string; value: number; percent: number };
    if (!showLabelsOutside) {
      // Inside label - just show percentage for larger slices
      return p.percent >= 5 ? `${p.percent.toFixed(0)}%` : "";
    }
    // Outside label - show name and percentage
    return `{name|${p.name}}\n{value|${p.percent.toFixed(1)}%}`;
  },
  rich: {
    name: {
      fontFamily: SWISS_FEDERAL_FONT.family,
      fontSize: 11,
      color: SWISS_FEDERAL_COLORS.text,
      lineHeight: 16,
    },
    value: {
      fontFamily: SWISS_FEDERAL_FONT.family,
      fontSize: 10,
      color: SWISS_FEDERAL_COLORS.muted,
      lineHeight: 14,
    },
  },
  alignTo: "labelLine",
  bleedMargin: 5,
  overflow: "truncate",
});

/**
 * Creates pie label line (connector) configuration.
 */
const createPieLabelLineConfig = (
  showLabelsOutside: boolean,
  showValues: boolean
): PieSeriesOption["labelLine"] => ({
  show: showLabelsOutside && showValues !== false,
  length: 15,
  length2: 25,
  smooth: 0.2,
  lineStyle: {
    color: SWISS_FEDERAL_COLORS.axis,
    width: 1,
  },
});

// ============================================================================
// Pie Adapter Function
// ============================================================================

/**
 * Universal Pie Chart Adapter
 *
 * Transforms UniversalChartState into ECharts pie chart configuration.
 */
export const pieUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { options } = state;
  const showValues = options.showValues !== false;

  // Build pie data
  const pieData = buildPieData(state);

  // Determine if we need to show labels outside (for many slices)
  const showLabelsOutside = pieData.length > 4;
  const animation = getDefaultAnimation();

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `${p.name}: ${p.value.toLocaleString()} (${p.percent.toFixed(1)}%)`;
      },
    },
    legend: createLegend(),
    series: [
      {
        type: "pie",
        radius: showLabelsOutside ? ["0%", "55%"] : ["0%", "70%"],
        center: ["50%", "50%"],
        data: pieData,
        label: createPieLabelConfig(showLabelsOutside, showValues),
        labelLine: createPieLabelLineConfig(showLabelsOutside, showValues),
        labelLayout: showLabelsOutside ? { hideOverlap: true } : undefined,
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: "bold",
          },
        },
        select: {
          itemStyle: {
            borderColor: SWISS_FEDERAL_COLORS.primary,
            borderWidth: 2,
          },
        },
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
        animationType: "expansion",
        minShowLabelAngle: 5,
        avoidLabelOverlap: true,
        startAngle: 90,
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("pie", pieUniversalAdapter);
