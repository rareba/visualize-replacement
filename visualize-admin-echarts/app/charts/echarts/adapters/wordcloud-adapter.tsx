/**
 * Word Cloud Chart Adapter
 *
 * Shows text frequency with varying sizes.
 * Note: Requires echarts-wordcloud extension to be installed.
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

import type { EChartsOption, ScatterSeriesOption } from "echarts";

// ============================================================================
// Word Cloud Chart Adapter
// ============================================================================

interface WordCloudDataItem {
  name: string;
  value: number;
  textStyle?: {
    color?: string;
  };
}

/**
 * Word cloud chart adapter - displays text frequency.
 * Uses pie state for categorical data with values.
 */
export const WordcloudChartAdapter = () => {
  const state = useChartState() as PieState;
  const {
    chartData,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    colors,
    bounds,
    valueLabelFormatter,
  } = state;

  const option = useMemo((): EChartsOption => {
    // Note: bounds available via safeGetBounds(bounds) if needed for future enhancements

    // Build word cloud data from chart state
    const wordCloudData: WordCloudDataItem[] = chartData
      .map((d) => ({
        name: getSegmentAbbreviationOrLabel(d),
        value: getY(d) ?? 0,
        textStyle: {
          color: colors(getSegment(d)),
        },
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // Calculate font sizes based on values
    const maxValue = Math.max(...wordCloudData.map((d) => d.value), 1);
    const minValue = Math.min(...wordCloudData.map((d) => d.value), 0);
    const range = maxValue - minValue || 1;

    // Fallback rendering as a scatter chart if wordcloud extension not available
    // This creates a pseudo word cloud effect
    const gridSize = Math.ceil(Math.sqrt(wordCloudData.length));

    // Create scattered positions
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
          const formattedValue = valueLabelFormatter
            ? valueLabelFormatter(value)
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
  }, [
    chartData,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    colors,
    bounds,
    valueLabelFormatter,
  ]);

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
