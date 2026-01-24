/**
 * Universal Treemap Chart Adapter
 *
 * A pure function adapter for treemap charts.
 * Shows hierarchical data as nested rectangles.
 *
 * Lines of code: ~80
 */

import {
  createItemTooltip,
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
// Treemap Data Building
// ============================================================================

interface TreemapDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
  label?: {
    show: boolean;
  };
}

/**
 * Builds treemap data from universal chart state.
 */
const buildTreemapData = (state: UniversalChartState): TreemapDataItem[] => {
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

  // Build treemap data in segment order
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
// Treemap Adapter Function
// ============================================================================

/**
 * Universal Treemap Chart Adapter
 *
 * Transforms UniversalChartState into ECharts treemap chart configuration.
 */
export const treemapUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { options } = state;
  const showValues = options.showValues !== false;

  // Build treemap data
  const treemapData = buildTreemapData(state);

  const animation = getDefaultAnimation();

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number };
        return `${p.name}: ${p.value.toLocaleString()}`;
      },
    },
    series: [
      {
        type: "treemap",
        width: "100%",
        height: "100%",
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false,
        },
        data: treemapData,
        label: {
          show: showValues,
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 12,
          color: "#fff",
          position: "insideTopLeft",
          formatter: (params: unknown) => {
            const p = params as { name: string; value: number };
            return `${p.name}\n${p.value.toLocaleString()}`;
          },
        },
        upperLabel: {
          show: false,
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
          gapWidth: 1,
        },
        emphasis: {
          upperLabel: {
            show: false,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        levels: [
          {
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
              gapWidth: 2,
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
registerChartAdapter("treemap", treemapUniversalAdapter);
