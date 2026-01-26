/**
 * Donut Chart Adapter (LEGACY)
 *
 * @deprecated Use `donutUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/donut-universal-adapter.ts for the recommended approach.
 *
 * Variant of Pie chart with inner radius, creating a donut/ring shape.
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
// Donut-specific utilities
// ============================================================================

interface DonutDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

/**
 * Builds donut data from chart state.
 */
const buildDonutData = <T,>(
  chartData: T[],
  getSegment: (d: T) => string,
  getSegmentAbbreviationOrLabel: (d: T) => string,
  getY: (d: T) => number | null,
  colors: (segment: string) => string
): DonutDataItem[] => {
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
 * Creates donut label configuration.
 */
const createDonutLabelConfig = (
  showValues: boolean,
  valueLabelFormatter?: (value: number) => string
): PieSeriesOption["label"] => ({
  show: showValues !== false,
  position: "outside",
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 11,
  color: SWISS_FEDERAL_COLORS.text,
  formatter: (params: unknown) => {
    // Safe type checking for label params
    const p = params as { name?: string; value?: number; percent?: number } | null;
    if (!p) return "";
    const name = p.name ?? "";
    const value = p.value ?? 0;

    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(value)
      : value;
    return `{name|${name}}\n{value|${formattedValue}}`;
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
  overflow: "truncate",
});

/**
 * Creates donut label line configuration.
 */
const createDonutLabelLineConfig = (
  showValues: boolean
): PieSeriesOption["labelLine"] => ({
  show: showValues !== false,
  length: 15,
  length2: 25,
  smooth: 0.2,
  lineStyle: {
    color: SWISS_FEDERAL_COLORS.axis,
    width: 1,
  },
});

/**
 * Creates donut tooltip formatter.
 */
const createDonutTooltipFormatter =
  (valueLabelFormatter?: (value: number) => string) => (params: unknown) => {
    // Safe type checking for tooltip params
    const p = params as { name?: string; value?: number; percent?: number } | null;
    if (!p) return "";

    const name = p.name ?? "";
    const value = p.value ?? 0;
    const percent = p.percent ?? 0;

    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(value)
      : value;
    return `${name}: ${formattedValue} (${percent.toFixed(1)}%)`;
  };

// ============================================================================
// Donut Chart Adapter
// ============================================================================

/**
 * Donut chart adapter - pie with inner radius
 */
export const DonutChartAdapter = () => {
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
    const filteredData = buildDonutData(
      chartData,
      getSegment,
      getSegmentAbbreviationOrLabel,
      getY,
      colors
    );

    const animation = getDefaultAnimation();
    // Default inner radius is 50% of outer radius
    const innerRadius = "35%";
    const outerRadius = "70%";

    return {
      ...getSwissFederalTheme(),
      tooltip: {
        ...createItemTooltip(),
        formatter: createDonutTooltipFormatter(valueLabelFormatter),
      },
      legend: createLegend(),
      series: [
        {
          type: "pie",
          radius: [innerRadius, outerRadius],
          center: ["50%", "50%"],
          data: filteredData,
          label: createDonutLabelConfig(showValues !== false, valueLabelFormatter),
          labelLine: createDonutLabelLineConfig(showValues !== false),
          labelLayout: { hideOverlap: true },
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
