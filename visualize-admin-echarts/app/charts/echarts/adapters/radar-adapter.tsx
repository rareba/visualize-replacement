/**
 * Radar Chart Adapter (LEGACY)
 *
 * @deprecated Use `radarUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/radar-universal-adapter.ts for the recommended approach.
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
import { RadarState, RadarIndicator } from "@/charts/echarts/radar-state";
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

interface RadarDataItem {
  name: string;
  value: number[];
  itemStyle: { color: string };
  areaStyle?: { opacity: number };
}

// ============================================================================
// Radar Chart Adapter
// ============================================================================

/**
 * Radar chart adapter
 */
export const RadarChartAdapter = () => {
  const state = useChartState() as unknown as RadarState;
  const {
    chartData,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    colors,
    bounds,
    indicators: stateIndicators,
    options,
  } = state;

  const option = useMemo((): EChartsOption => {
    const animation = getDefaultAnimation();

    // Group data by segment
    const groupedData = new Map<string, { name: string; values: number[]; color: string }>();

    // Use indicators from state, with fallback
    const indicators: RadarIndicator[] = stateIndicators.length > 0
      ? stateIndicators.map((ind) => ({ ...ind }))
      : [
          { name: "Dimension 1" },
          { name: "Dimension 2" },
          { name: "Dimension 3" },
          { name: "Dimension 4" },
          { name: "Dimension 5" },
        ];
    const indicatorMaxValues: number[] = indicators.map(() => 0);

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
        shape: options.shape,
        splitNumber: options.splitNumber,
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
          areaStyle: options.areaStyle ? { opacity: 0.2 } : undefined,
          smooth: options.lineSmooth,
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
  }, [chartData, getSegment, getSegmentAbbreviationOrLabel, getY, colors, bounds, stateIndicators, options]);

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
