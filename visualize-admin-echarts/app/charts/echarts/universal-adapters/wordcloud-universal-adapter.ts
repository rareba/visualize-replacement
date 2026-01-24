/**
 * Universal Wordcloud Chart Adapter
 *
 * A pure function adapter for wordcloud charts.
 * Shows text frequency with varying sizes.
 *
 * Lines of code: ~120
 */

import {
  createItemTooltip,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, ScatterSeriesOption } from "echarts";

// ============================================================================
// Wordcloud Adapter Function
// ============================================================================

/**
 * Universal Wordcloud Chart Adapter
 *
 * Transforms UniversalChartState into ECharts wordcloud configuration.
 * Note: This uses a scatter-based fallback since echarts-wordcloud extension
 * may not be available.
 */
export const wordcloudUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata } = state;
  const { getSegment, getY } = fields;

  // Build word cloud data from state
  const wordCloudData = observations
    .map((d, index) => {
      if (!getSegment || !getY) return null;
      const segment = getSegment(d);
      return {
        name: segment,
        value: getY(d) ?? 0,
        textStyle: {
          color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length],
        },
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calculate font sizes based on values
  const maxValue = Math.max(...wordCloudData.map((d) => d.value), 1);
  const minValue = Math.min(...wordCloudData.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  // Create scattered positions for pseudo word cloud effect
  const gridSize = Math.ceil(Math.sqrt(wordCloudData.length));

  const scatterData: ScatterSeriesOption["data"] = wordCloudData.map((d, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const x = (col + 0.5) / gridSize * 100;
    const y = (row + 0.5) / gridSize * 100;
    const normalizedValue = (d.value - minValue) / range;
    const fontSize = 12 + normalizedValue * 30;

    return {
      name: d.name,
      value: [x, y, d.value],
      label: {
        show: true,
        formatter: d.name,
        fontSize,
        fontFamily: SWISS_FEDERAL_FONT.family,
        fontWeight: normalizedValue > 0.5 ? ("bold" as const) : ("normal" as const),
        color: d.textStyle?.color,
      },
      symbolSize: 1,
      itemStyle: {
        color: "transparent",
      },
    };
  });

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      formatter: (params: unknown) => {
        const p = params as { name: string; value: [number, number, number] };
        const value = p.value?.[2] ?? 0;
        const formattedValue = metadata.formatNumber
          ? metadata.formatNumber(value)
          : value;
        return `${p.name}: ${formattedValue}`;
      },
    },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      show: false,
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      show: false,
    },
    series: [
      {
        type: "scatter",
        data: scatterData,
        labelLayout: {
          hideOverlap: true,
        },
        emphasis: {
          label: {
            fontSize: 20,
            fontWeight: "bold" as const,
          },
        },
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("wordcloud", wordcloudUniversalAdapter);
