/**
 * Sankey Chart Adapter
 *
 * Visualizes flow between categories using source, target, and value fields.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createItemTooltip,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { SimpleEChartsState } from "@/charts/echarts/simple-echarts-state";
import { getSwissFederalTheme, SWISS_FEDERAL_FONT, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { useChartState } from "@/charts/shared/chart-state";
import { SankeyConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import { useConfiguratorState, hasChartConfigs } from "@/configurator";

import type { EChartsOption, SankeySeriesOption } from "echarts";

// ============================================================================
// Sankey-specific utilities
// ============================================================================

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

// ============================================================================
// Sankey Chart Adapter
// ============================================================================

/**
 * Sankey chart adapter - displays flow between categories.
 * Uses SimpleEChartsState and accesses SankeyConfig fields directly.
 */
export const SankeyChartAdapter = () => {
  const state = useChartState() as unknown as SimpleEChartsState;
  const { chartData, bounds, valueLabelFormatter } = state;

  // Get the chart config to access Sankey-specific fields
  const [configuratorState] = useConfiguratorState(hasChartConfigs);
  const chartConfig = getChartConfig(configuratorState) as SankeyConfig;
  const { fields } = chartConfig;

  const option = useMemo((): EChartsOption => {
    // Get field IDs
    const sourceFieldId = fields.source.componentId;
    const targetFieldId = fields.target.componentId;
    const valueFieldId = fields.value.componentId;

    // Build nodes and links from data
    const nodeSet = new Set<string>();
    const linkMap = new Map<string, number>();

    chartData.forEach((d) => {
      const source = String(d[sourceFieldId] ?? "");
      const target = String(d[targetFieldId] ?? "");
      const value = Number(d[valueFieldId]) || 0;

      if (source && target) {
        nodeSet.add(source);
        nodeSet.add(target);

        const linkKey = `${source}-->${target}`;
        const existing = linkMap.get(linkKey) || 0;
        linkMap.set(linkKey, existing + value);
      }
    });

    // Create nodes
    const nodes: SankeyNode[] = Array.from(nodeSet).map((name) => ({ name }));

    // Create links
    const links: SankeyLink[] = Array.from(linkMap.entries()).map(
      ([key, value]) => {
        const [source, target] = key.split("-->");
        return { source, target, value };
      }
    );

    // Color palette from Swiss Federal theme
    const colorPalette = [
      SWISS_FEDERAL_COLORS.primary,
      SWISS_FEDERAL_COLORS.secondary,
      SWISS_FEDERAL_COLORS.palette[0], // blue
      SWISS_FEDERAL_COLORS.palette[1], // orange
      SWISS_FEDERAL_COLORS.palette[2], // green
      SWISS_FEDERAL_COLORS.palette[3], // red
      SWISS_FEDERAL_COLORS.palette[4], // purple
      SWISS_FEDERAL_COLORS.palette[5], // brown
    ];

    const seriesConfig: SankeySeriesOption = {
      type: "sankey",
      emphasis: {
        focus: "adjacency",
      },
      lineStyle: {
        color: "gradient",
        curveness: 0.5,
      },
      data: nodes.map((node, i) => ({
        ...node,
        itemStyle: { color: colorPalette[i % colorPalette.length] },
      })),
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
            return `${p.data.source} → ${p.data.target}: ${valueLabelFormatter(p.data.value ?? 0)}`;
          }
          if (p.name && p.value !== undefined) {
            return `${p.name}: ${valueLabelFormatter(p.value)}`;
          }
          if (p.name) {
            return p.name;
          }
          return "";
        },
      },
      series: [seriesConfig],
    };
  }, [chartData, fields, bounds, valueLabelFormatter]);

  const dimensions = calculateChartDimensions(bounds);

  return (
    <EChartsWrapper
      option={option}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};
