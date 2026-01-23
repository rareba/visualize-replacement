/**
 * Radar Chart Adapter
 *
 * Displays multi-variable data on axes starting from the same point.
 */

import { useMemo } from "react";

import {
  ChartBounds,
  createItemTooltip,
  createLegend,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, RadarSeriesOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

interface RadarIndicator {
  name: string;
  max?: number;
}

interface RadarDataItem {
  name: string;
  value: number[];
  itemStyle: { color: string };
  areaStyle?: { opacity: number };
}

interface RadarState {
  chartData: unknown[];
  getSegment: (d: unknown) => string;
  getSegmentAbbreviationOrLabel: (d: unknown) => string;
  getY: (d: unknown) => number | null;
  colors: (segment: string) => string;
  bounds?: { width?: number; height?: number };
  dimensions?: { id: string; label: string }[];
}

// ============================================================================
// Radar Chart Adapter
// ============================================================================

/**
 * Radar chart adapter
 */
export const RadarChartAdapter = () => {
  const state = useChartState() as RadarState;
  const {
    chartData,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    colors,
    bounds,
    dimensions: chartDimensions,
  } = state;

  const option = useMemo((): EChartsOption => {
    const animation = getDefaultAnimation();

    // Group data by segment
    const groupedData = new Map<string, { name: string; values: number[]; color: string }>();
    const indicators: RadarIndicator[] = [];
    const indicatorMaxValues: number[] = [];

    // Create indicators from dimensions or use default
    const dimensionList = chartDimensions || [
      { id: "dim1", label: "Dimension 1" },
      { id: "dim2", label: "Dimension 2" },
      { id: "dim3", label: "Dimension 3" },
      { id: "dim4", label: "Dimension 4" },
      { id: "dim5", label: "Dimension 5" },
    ];

    dimensionList.forEach((dim, index) => {
      indicators.push({ name: dim.label || dim.id });
      indicatorMaxValues[index] = 0;
    });

    // Process chart data
    chartData.forEach((d) => {
      const segment = getSegment(d);
      const segmentLabel = getSegmentAbbreviationOrLabel(d);
      const value = getY(d) ?? 0;
      const color = colors(segment);

      if (!groupedData.has(segment)) {
        groupedData.set(segment, {
          name: segmentLabel,
          values: new Array(indicators.length).fill(0),
          color,
        });
      }

      // For now, distribute values across indicators
      // In a real implementation, this would map to actual dimension values
      const entry = groupedData.get(segment)!;
      const idx = entry.values.findIndex((v) => v === 0);
      if (idx !== -1) {
        entry.values[idx] = value;
        indicatorMaxValues[idx] = Math.max(indicatorMaxValues[idx], value);
      }
    });

    // Update indicator max values
    indicators.forEach((indicator, idx) => {
      indicator.max = indicatorMaxValues[idx] * 1.2 || 100;
    });

    // Build series data
    const seriesData: RadarDataItem[] = Array.from(groupedData.values()).map((item) => ({
      name: item.name,
      value: item.values,
      itemStyle: { color: item.color },
      areaStyle: { opacity: 0.2 },
    }));

    return {
      ...getSwissFederalTheme(),
      tooltip: {
        ...createItemTooltip(),
        trigger: "item",
      },
      legend: createLegend(),
      radar: {
        indicator: indicators,
        center: ["50%", "55%"],
        radius: "65%",
        axisName: {
          color: SWISS_FEDERAL_COLORS.text,
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 11,
        },
        splitArea: {
          areaStyle: {
            color: ["rgba(0, 0, 0, 0.02)", "rgba(0, 0, 0, 0.04)"],
          },
        },
        axisLine: {
          lineStyle: {
            color: SWISS_FEDERAL_COLORS.axis,
          },
        },
        splitLine: {
          lineStyle: {
            color: SWISS_FEDERAL_COLORS.axis,
          },
        },
      },
      series: [
        {
          type: "radar" as const,
          data: seriesData,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            width: 2,
          },
          emphasis: {
            areaStyle: {
              opacity: 0.3,
            },
            lineStyle: {
              width: 3,
            },
          },
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
        } as RadarSeriesOption,
      ],
    };
  }, [chartData, getSegment, getSegmentAbbreviationOrLabel, getY, colors, bounds, chartDimensions]);

  const safeBounds = safeGetBounds(bounds as Partial<ChartBounds>);
  const dimensions = {
    width: safeBounds.width,
    height: safeBounds.chartHeight + safeBounds.margins.top + safeBounds.margins.bottom,
  };

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
