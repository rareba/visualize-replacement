/**
 * Universal Donut Chart Adapter
 *
 * A pure function adapter for donut charts (pie with inner radius).
 * Shares most logic with pie but adds the inner radius for the donut hole.
 *
 * Lines of code: ~70
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
// Donut Data Building
// ============================================================================

interface DonutDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

/**
 * Builds donut data from universal chart state.
 */
const buildDonutData = (state: UniversalChartState): DonutDataItem[] => {
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

  // Build donut data in segment order
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
 * Creates donut label configuration.
 * Donut charts typically show labels outside due to the hole.
 */
const createDonutLabelConfig = (showValues: boolean): PieSeriesOption["label"] => ({
  show: showValues !== false,
  position: "outside",
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 11,
  color: SWISS_FEDERAL_COLORS.text,
  formatter: (params: unknown) => {
    const p = params as { name: string; value: number; percent: number };
    const percent = p.percent ?? 0;
    return `{name|${p.name}}\n{value|${percent.toFixed(1)}%}`;
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
 * Creates donut label line configuration.
 */
const createDonutLabelLineConfig = (
  showValues: boolean
): PieSeriesOption["labelLine"] => ({
  show: showValues !== false,
  length: 15,
  length2: 25,
  smooth: 0.2,
  lineStyle: {
    color: SWISS_FEDERAL_COLORS.axis,
    width: 1,
  },
});

// ============================================================================
// Donut Adapter Function
// ============================================================================

/**
 * Universal Donut Chart Adapter
 *
 * Transforms UniversalChartState into ECharts donut chart configuration.
 */
export const donutUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { options } = state;
  const showValues = options.showValues !== false;

  // Get inner radius from options (default to 50%)
  const innerRadiusPercent = options.innerRadius ?? 0.5;

  // Build donut data
  const donutData = buildDonutData(state);

  const animation = getDefaultAnimation();

  // Calculate inner and outer radius
  const outerRadius = donutData.length > 4 ? "55%" : "70%";
  const innerRadius = `${Math.round(parseInt(outerRadius) * innerRadiusPercent)}%`;

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        const value = p.value ?? 0;
        const percent = p.percent ?? 0;
        return `${p.name}: ${value.toLocaleString()} (${percent.toFixed(1)}%)`;
      },
    },
    legend: createLegend(),
    series: [
      {
        type: "pie",
        radius: [innerRadius, outerRadius],
        center: ["50%", "50%"],
        data: donutData,
        label: createDonutLabelConfig(showValues),
        labelLine: createDonutLabelLineConfig(showValues),
        labelLayout: { hideOverlap: true },
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
registerChartAdapter("donut", donutUniversalAdapter);
