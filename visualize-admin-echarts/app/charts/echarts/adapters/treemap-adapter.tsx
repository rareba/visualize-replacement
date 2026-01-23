/**
 * Treemap Chart Adapter
 *
 * Displays hierarchical data using nested rectangles.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createItemTooltip,
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

import type { EChartsOption, TreemapSeriesOption } from "echarts";

// ============================================================================
// Treemap-specific utilities
// ============================================================================

interface TreemapDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
  children?: TreemapDataItem[];
}

/**
 * Builds treemap data from chart state.
 */
const buildTreemapData = <T,>(
  chartData: T[],
  getSegment: (d: T) => string,
  getSegmentAbbreviationOrLabel: (d: T) => string,
  getY: (d: T) => number | null,
  colors: (segment: string) => string
): TreemapDataItem[] => {
  return chartData
    .map((d) => ({
      name: getSegmentAbbreviationOrLabel(d),
      value: getY(d) ?? 0,
      itemStyle: {
        color: colors(getSegment(d)),
      },
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
};

/**
 * Creates treemap label configuration.
 */
const createTreemapLabelConfig = (
  showValues: boolean,
  valueLabelFormatter?: (value: number) => string
): TreemapSeriesOption["label"] => ({
  show: showValues !== false,
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 12,
  color: "#fff",
  position: "insideTopLeft",
  formatter: (params: unknown) => {
    const p = params as { name: string; value: number };
    if (showValues && valueLabelFormatter) {
      return `${p.name}\n${valueLabelFormatter(p.value)}`;
    }
    return p.name;
  },
});

/**
 * Creates treemap tooltip formatter.
 */
const createTreemapTooltipFormatter =
  (valueLabelFormatter?: (value: number) => string) => (params: unknown) => {
    const p = params as { name: string; value: number };
    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(p.value)
      : p.value;
    return `${p.name}: ${formattedValue}`;
  };

// ============================================================================
// Treemap Chart Adapter
// ============================================================================

/**
 * Treemap chart adapter
 */
export const TreemapChartAdapter = () => {
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
    const filteredData = buildTreemapData(
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
        formatter: createTreemapTooltipFormatter(valueLabelFormatter),
      },
      series: [
        {
          type: "treemap",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          roam: false,
          nodeClick: "zoomToNode",
          breadcrumb: {
            show: true,
            bottom: 5,
            left: 5,
            itemStyle: {
              color: SWISS_FEDERAL_COLORS.primary,
              borderColor: "transparent",
              textStyle: {
                color: "#fff",
                fontFamily: SWISS_FEDERAL_FONT.family,
              },
            },
          },
          data: filteredData,
          label: createTreemapLabelConfig(showValues !== false, valueLabelFormatter),
          upperLabel: {
            show: true,
            height: 24,
            fontFamily: SWISS_FEDERAL_FONT.family,
            fontSize: 11,
            color: "#fff",
          },
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 2,
            gapWidth: 2,
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
          levels: [
            {
              itemStyle: {
                borderWidth: 3,
                gapWidth: 3,
              },
            },
            {
              itemStyle: {
                borderWidth: 2,
                gapWidth: 2,
              },
            },
            {
              itemStyle: {
                borderWidth: 1,
                gapWidth: 1,
              },
            },
          ],
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
