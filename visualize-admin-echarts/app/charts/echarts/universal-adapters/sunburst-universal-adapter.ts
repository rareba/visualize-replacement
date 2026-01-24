/**
 * Universal Sunburst Chart Adapter
 *
 * A pure function adapter for sunburst charts.
 * Displays hierarchical data using concentric rings.
 *
 * Lines of code: ~130
 */

import {
  createItemTooltip,
  getDefaultAnimation,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, SunburstSeriesOption } from "echarts";

// ============================================================================
// Sunburst-specific utilities
// ============================================================================

interface SunburstDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
  children?: SunburstDataItem[];
}

/**
 * Builds sunburst data from state.
 */
const buildSunburstData = (state: UniversalChartState): SunburstDataItem[] => {
  const { observations, fields, colors } = state;
  const { getSegment, getY } = fields;

  if (!getSegment || !getY) {
    return [];
  }

  return observations
    .map((d, index) => ({
      name: getSegment(d),
      value: getY(d) ?? 0,
      itemStyle: {
        color: colors.getColor(getSegment(d)) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length],
      },
    }))
    .filter((d) => d.value > 0);
};

/**
 * Creates sunburst label configuration.
 */
const createSunburstLabelConfig = (
  showValues: boolean
): SunburstSeriesOption["label"] => ({
  show: showValues !== false,
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 10,
  color: "#fff",
  minAngle: 10,
  rotate: "radial",
});

// ============================================================================
// Sunburst Adapter Function
// ============================================================================

/**
 * Universal Sunburst Chart Adapter
 *
 * Transforms UniversalChartState into ECharts sunburst configuration.
 */
export const sunburstUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { metadata, options } = state;

  const sunburstData = buildSunburstData(state);
  const animation = getDefaultAnimation();

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
    series: [
      {
        type: "sunburst",
        center: ["50%", "50%"],
        radius: ["15%", "80%"],
        data: sunburstData,
        label: createSunburstLabelConfig(options.showValues !== false),
        labelLayout: {
          hideOverlap: true,
        },
        emphasis: {
          focus: "ancestor",
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        itemStyle: {
          borderRadius: 4,
          borderWidth: 2,
          borderColor: "#fff",
        },
        levels: [
          {},
          {
            r0: "15%",
            r: "35%",
            itemStyle: {
              borderWidth: 2,
            },
            label: {
              rotate: "tangential",
            },
          },
          {
            r0: "35%",
            r: "55%",
            label: {
              align: "right",
            },
          },
          {
            r0: "55%",
            r: "75%",
            label: {
              position: "outside",
              padding: 3,
              silent: false,
            },
            itemStyle: {
              borderWidth: 1,
            },
          },
        ],
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("sunburst", sunburstUniversalAdapter);
