/**
 * Sunburst Chart Adapter
 *
 * Displays hierarchical data using concentric rings.
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
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, SunburstSeriesOption } from "echarts";

// ============================================================================
// Sunburst-specific utilities
// ============================================================================

interface SunburstDataItem {
  name: string;
  value: number;
  itemStyle: { color: string };
  children?: SunburstDataItem[];
}

/**
 * Builds sunburst data from chart state.
 */
const buildSunburstData = <T,>(
  chartData: T[],
  getSegment: (d: T) => string,
  getSegmentAbbreviationOrLabel: (d: T) => string,
  getY: (d: T) => number | null,
  colors: (segment: string) => string
): SunburstDataItem[] => {
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
 * Creates sunburst label configuration.
 */
const createSunburstLabelConfig = (
  showValues: boolean
): SunburstSeriesOption["label"] => ({
  show: showValues !== false,
  fontFamily: SWISS_FEDERAL_FONT.family,
  fontSize: 10,
  color: "#fff",
  minAngle: 10,
  rotate: "radial",
});

/**
 * Creates sunburst tooltip formatter.
 */
const createSunburstTooltipFormatter =
  (valueLabelFormatter?: (value: number) => string) => (params: unknown) => {
    const p = params as { name: string; value: number };
    const formattedValue = valueLabelFormatter
      ? valueLabelFormatter(p.value)
      : p.value;
    return `${p.name}: ${formattedValue}`;
  };

// ============================================================================
// Sunburst Chart Adapter
// ============================================================================

/**
 * Sunburst chart adapter
 */
export const SunburstChartAdapter = () => {
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
    const filteredData = buildSunburstData(
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
        formatter: createSunburstTooltipFormatter(valueLabelFormatter),
      },
      series: [
        {
          type: "sunburst",
          center: ["50%", "50%"],
          radius: ["15%", "80%"],
          data: filteredData,
          label: createSunburstLabelConfig(showValues !== false),
          labelLayout: {
            hideOverlap: true,
          },
          emphasis: {
            focus: "ancestor",
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          itemStyle: {
            borderRadius: 4,
            borderWidth: 2,
            borderColor: "#fff",
          },
          levels: [
            {},
            {
              r0: "15%",
              r: "35%",
              itemStyle: {
                borderWidth: 2,
              },
              label: {
                rotate: "tangential",
              },
            },
            {
              r0: "35%",
              r: "55%",
              label: {
                align: "right",
              },
            },
            {
              r0: "55%",
              r: "75%",
              label: {
                position: "outside",
                padding: 3,
                silent: false,
              },
              itemStyle: {
                borderWidth: 1,
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
