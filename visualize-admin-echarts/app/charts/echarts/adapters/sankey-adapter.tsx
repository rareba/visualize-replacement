/**
 * Sankey Chart Adapter
 *
 * Visualizes flow between categories.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createItemTooltip,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { getSwissFederalTheme, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

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
 * Uses pie state as a base for categorical data.
 */
export const SankeyChartAdapter = () => {
  // Use PieState as a base - sankey will need proper state implementation
  const state = useChartState() as PieState;
  const { chartData, getSegment, getSegmentAbbreviationOrLabel, getY, bounds, colors } = state;

  const option = useMemo((): EChartsOption => {
    // Build nodes from unique segments and create a simple flow structure
    const sourceSet = new Set<string>();
    const targetSet = new Set<string>();
    const linkMap = new Map<string, number>();

    // For a simple sankey, we'll create a two-level flow:
    // Source (first half of items) -> Target (second half of items)
    const items = chartData.map((d) => ({
      name: getSegmentAbbreviationOrLabel(d),
      segment: getSegment(d),
      value: getY(d) ?? 0,
    }));

    // Create source and target groups based on items
    const midpoint = Math.ceil(items.length / 2);
    const sourceItems = items.slice(0, midpoint);
    const targetItems = items.slice(midpoint);

    sourceItems.forEach((item) => sourceSet.add(item.name));
    targetItems.forEach((item) => targetSet.add(item.name));

    // Create links from each source to each target proportionally
    sourceItems.forEach((source) => {
      targetItems.forEach((target) => {
        const linkValue = Math.min(source.value, target.value) || 1;
        const key = `${source.name}-->${target.name}`;
        linkMap.set(key, linkValue);
      });
    });

    // Create nodes - prefix to avoid duplicates between source and target
    const nodes: SankeyNode[] = [
      ...Array.from(sourceSet).map((name) => ({ name: `src_${name}` })),
      ...Array.from(targetSet).map((name) => ({ name: `tgt_${name}` })),
    ];

    // Create links
    const links: SankeyLink[] = Array.from(linkMap.entries()).map(
      ([key, value]) => {
        const [source, target] = key.split("-->");
        return {
          source: `src_${source}`,
          target: `tgt_${target}`,
          value,
        };
      }
    );

    // Generate colors for nodes
    const colorScale = (name: string) => {
      return colors(name);
    };

    const nodeColors = nodes.map((node) => {
      const baseName = node.name.replace(/^(src_|tgt_)/, "");
      return colorScale(baseName);
    });

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
        itemStyle: { color: nodeColors[i] },
      })),
      links,
      label: {
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontSize: 12,
        formatter: (params: unknown) => {
          const p = params as { name: string };
          return p.name.replace(/^(src_|tgt_)/, "");
        },
      },
      nodeWidth: 20,
      nodeGap: 10,
      left: 50,
      right: 50,
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
          };
          if (p.data?.source && p.data?.target) {
            const source = p.data.source.replace(/^(src_|tgt_)/, "");
            const target = p.data.target.replace(/^(src_|tgt_)/, "");
            return `${source} -> ${target}: ${p.data.value}`;
          }
          if (p.name) {
            return p.name.replace(/^(src_|tgt_)/, "");
          }
          return "";
        },
      },
      series: [seriesConfig],
    };
  }, [chartData, getSegment, getSegmentAbbreviationOrLabel, getY, bounds, colors]);

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
