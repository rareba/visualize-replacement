/**
 * Pie Chart Adapter
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * Includes enhanced label connectors matching D3 version behavior.
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
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, PieSeriesOption } from "echarts";

// ============================================================================
// Pie-specific utilities
// ============================================================================

interface PieDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

/**
 * Builds pie data from chart state.
 */
const buildPieData = <T,>(
  chartData: T[],
  getSegment: (d: T) => string,
  getSegmentAbbreviationOrLabel: (d: T) => string,
  getY: (d: T) => number | null,
  colors: (segment: string) => string
): PieDataItem[] => {
  return chartData
    .map((d) => ({
      name: getSegmentAbbreviationOrLabel(d),
      value: getY(d) ?? 0,
      itemStyle: {
        color: colors(getSegment(d)),
      },
    }))
    .filter((d) => d.value > 0);
};

/**
 * Creates pie label configuration based on number of slices.
 */
const createPieLabelConfig = (
  showLabelsOutside: boolean,
  showValues: boolean,
  valueLabelFormatter?: (value: number) => string
): PieSeriesOption["label"] => ({
  show: showValues !== false,
  position: showLabelsOutside ? "outside" : "inside",
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 11,
  color: showLabelsOutside ? SWISS_FEDERAL_COLORS.text : "#fff",
  formatter: (params: unknown) => {
    const p = params as { name: string; value: number; percent: number };
    if (!showLabelsOutside) {
      // Inside label - just show percentage for larger slices
      return p.percent >= 5 ? `${p.percent.toFixed(0)}%` : "";
    }
    // Outside label - show name and value
    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(p.value)
      : p.value;
    return `{name|${p.name}}\n{value|${formattedValue}}`;
  },
  rich: {
    name: {
      fontFamily: SWISS_FEDERAL_FONT.family,
      fontSize: 11,
      color: SWISS_FEDERAL_COLORS.text,
      lineHeight: 16,
    },
    value: {
      fontFamily: SWISS_FEDERAL_FONT.family,
      fontSize: 10,
      color: SWISS_FEDERAL_COLORS.muted,
      lineHeight: 14,
    },
  },
  alignTo: "labelLine",
  bleedMargin: 5,
  overflow: "truncate",
});

/**
 * Creates pie label line (connector) configuration.
 */
const createPieLabelLineConfig = (
  showLabelsOutside: boolean,
  showValues: boolean
): PieSeriesOption["labelLine"] => ({
  show: showLabelsOutside && showValues !== false,
  length: 15,
  length2: 25,
  smooth: 0.2,
  lineStyle: {
    color: SWISS_FEDERAL_COLORS.axis,
    width: 1,
  },
});

/**
 * Creates pie tooltip formatter.
 */
const createPieTooltipFormatter =
  (valueLabelFormatter?: (value: number) => string) => (params: unknown) => {
    const p = params as { name: string; value: number; percent: number };
    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(p.value)
      : p.value;
    return `${p.name}: ${formattedValue} (${p.percent.toFixed(1)}%)`;
  };

// ============================================================================
// Pie Chart Adapter
// ============================================================================

/**
 * Pie chart adapter with enhanced label connectors
 */
export const PieChartAdapter = () => {
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
    // Build pie data
    const filteredData = buildPieData(
      chartData,
      getSegment,
      getSegmentAbbreviationOrLabel,
      getY,
      colors
    );

    // Determine if we need to show labels outside (for many slices)
    const showLabelsOutside = filteredData.length > 4;
    const animation = getDefaultAnimation();

    return {
      ...getSwissFederalTheme(),
      tooltip: {
        ...createItemTooltip(),
        formatter: createPieTooltipFormatter(valueLabelFormatter),
      },
      legend: createLegend(),
      series: [
        {
          type: "pie",
          radius: showLabelsOutside ? ["0%", "55%"] : ["0%", "70%"],
          center: ["50%", "50%"],
          data: filteredData,
          label: createPieLabelConfig(
            showLabelsOutside,
            showValues !== false,
            valueLabelFormatter
          ),
          labelLine: createPieLabelLineConfig(showLabelsOutside, showValues !== false),
          labelLayout: showLabelsOutside ? { hideOverlap: true } : undefined,
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
            },
          },
          select: {
            itemStyle: {
              borderColor: SWISS_FEDERAL_COLORS.primary,
              borderWidth: 2,
            },
          },
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
          animationType: "expansion",
          minShowLabelAngle: 5,
          avoidLabelOverlap: true,
          startAngle: 90,
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
