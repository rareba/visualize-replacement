/**
 * Funnel Chart Adapter
 *
 * Displays data as stacked layers, typically for conversion/flow visualization.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createItemTooltip,
  createLegend,
  getDefaultAnimation,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, FunnelSeriesOption } from "echarts";

// ============================================================================
// Funnel-specific utilities
// ============================================================================

interface FunnelDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

/**
 * Builds funnel data from chart state.
 */
const buildFunnelData = <T,>(
  chartData: T[],
  getSegment: (d: T) => string,
  getSegmentAbbreviationOrLabel: (d: T) => string,
  getY: (d: T) => number | null,
  colors: (segment: string) => string
): FunnelDataItem[] => {
  return chartData
    .map((d) => ({
      name: getSegmentAbbreviationOrLabel(d),
      value: getY(d) ?? 0,
      itemStyle: {
        color: colors(getSegment(d)),
      },
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value); // Sort descending for funnel
};

/**
 * Creates funnel label configuration.
 */
const createFunnelLabelConfig = (
  showValues: boolean,
  valueLabelFormatter?: (value: number) => string
): FunnelSeriesOption["label"] => ({
  show: showValues !== false,
  position: "inside",
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 12,
  color: "#fff",
  formatter: (params: unknown) => {
    const p = params as { name: string; value: number; percent: number };
    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(p.value)
      : p.value;
    return `${p.name}\n${formattedValue}`;
  },
});

/**
 * Creates funnel tooltip formatter.
 */
const createFunnelTooltipFormatter =
  (valueLabelFormatter?: (value: number) => string) => (params: unknown) => {
    const p = params as { name: string; value: number; percent: number };
    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(p.value)
      : p.value;
    return `${p.name}: ${formattedValue}`;
  };

// ============================================================================
// Funnel Chart Adapter
// ============================================================================

/**
 * Funnel chart adapter
 */
export const FunnelChartAdapter = () => {
  const state = useChartState() as PieState;
  const {
    chartData,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    colors,
    bounds,
    showValues,
    valueLabelFormatter,
  } = state;

  const option = useMemo((): EChartsOption => {
    const filteredData = buildFunnelData(
      chartData,
      getSegment,
      getSegmentAbbreviationOrLabel,
      getY,
      colors
    );

    const animation = getDefaultAnimation();

    return {
      ...getSwissFederalTheme(),
      tooltip: {
        ...createItemTooltip(),
        formatter: createFunnelTooltipFormatter(valueLabelFormatter),
      },
      legend: createLegend(),
      series: [
        {
          type: "funnel",
          left: "10%",
          top: 60,
          bottom: 60,
          width: "80%",
          min: 0,
          max: filteredData[0]?.value || 100,
          minSize: "0%",
          maxSize: "100%",
          sort: "descending",
          gap: 2,
          data: filteredData,
          label: createFunnelLabelConfig(showValues !== false, valueLabelFormatter),
          labelLine: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
            label: {
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 1,
          },
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
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
    showValues,
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
