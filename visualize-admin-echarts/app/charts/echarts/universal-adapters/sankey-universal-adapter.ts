/**
 * Universal Sankey Chart Adapter
 *
 * A pure function adapter for sankey charts.
 * Visualizes flow between categories using source, target, and value fields.
 *
 * Lines of code: ~130
 */

import {
  createItemTooltip,
} from "@/charts/echarts/adapter-utils";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_FONT,
  SWISS_FEDERAL_COLORS,
} from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, SankeySeriesOption } from "echarts";

// ============================================================================
// Sankey-specific utilities
// ============================================================================

interface SankeyNode {
  name: string;
  itemStyle?: { color: string };
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

// ============================================================================
// Sankey Adapter Function
// ============================================================================

/**
 * Universal Sankey Chart Adapter
 *
 * Transforms UniversalChartState into ECharts sankey configuration.
 */
export const sankeyUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, metadata } = state;
  const { getSource, getTarget, getY } = fields;

  // Build nodes and links from data
  const nodeSet = new Set<string>();
  const linkMap = new Map<string, number>();

  observations.forEach((d) => {
    if (!getSource || !getTarget || !getY) return;

    const source = getSource(d);
    const target = getTarget(d);
    const value = getY(d) ?? 0;

    if (source && target) {
      nodeSet.add(source);
      nodeSet.add(target);

      const linkKey = `${source}-->${target}`;
      const existing = linkMap.get(linkKey) || 0;
      linkMap.set(linkKey, existing + value);
    }
  });

  // Color palette - use theme palette colors
  const colorPalette = [
    SWISS_FEDERAL_COLORS.primary,
    SWISS_FEDERAL_COLORS.secondary,
    ...SWISS_FEDERAL_COLORS.palette.slice(0, 6),
  ];

  // Create nodes with colors
  const nodes: SankeyNode[] = Array.from(nodeSet).map((name, i) => ({
    name,
    itemStyle: { color: colorPalette[i % colorPalette.length] },
  }));

  // Create links
  const links: SankeyLink[] = Array.from(linkMap.entries()).map(
    ([key, value]) => {
      const [source, target] = key.split("-->");
      return { source, target, value };
    }
  );

  const seriesConfig: SankeySeriesOption = {
    type: "sankey",
    emphasis: {
      focus: "adjacency",
    },
    lineStyle: {
      color: "gradient",
      curveness: 0.5,
    },
    data: nodes,
    links,
    label: {
      fontFamily: SWISS_FEDERAL_FONT.family,
      fontSize: 12,
    },
    nodeWidth: 20,
    nodeGap: 10,
    left: 50,
    right: 150,
    top: 20,
    bottom: 20,
  };

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as {
          data?: { source?: string; target?: string; value?: number };
          name?: string;
          value?: number;
        };
        if (p.data?.source && p.data?.target) {
          const formattedValue = metadata.formatNumber
            ? metadata.formatNumber(p.data.value ?? 0)
            : p.data.value ?? 0;
          return `${p.data.source} → ${p.data.target}: ${formattedValue}`;
        }
        if (p.name && p.value !== undefined) {
          const formattedValue = metadata.formatNumber
            ? metadata.formatNumber(p.value)
            : p.value;
          return `${p.name}: ${formattedValue}`;
        }
        if (p.name) {
          return p.name;
        }
        return "";
      },
    },
    series: [seriesConfig],
  };
};

// Register the adapter
registerChartAdapter("sankey", sankeyUniversalAdapter);
