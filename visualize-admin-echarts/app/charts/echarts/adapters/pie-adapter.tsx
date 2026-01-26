/**
 * Pie Chart Adapter (LEGACY)
 *
 * @deprecated Use `pieUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/pie-universal-adapter.ts for the recommended approach.
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * Includes enhanced label connectors matching D3 version behavior.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createItemTooltip,
  createLegend,
  createNoDataGraphic,
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
 * Filters out invalid values (null, NaN, negative, zero) for pie charts.
 */
const buildPieData = <T,>(
  chartData: T[],
  getSegment: (d: T) => string,
  getSegmentAbbreviationOrLabel: (d: T) => string,
  getY: (d: T) => number | null,
  colors: (segment: string) => string
): PieDataItem[] => {
  const result: PieDataItem[] = [];
  let hasNegatives = false;
  let colorIndex = 0;

  chartData.forEach((d) => {
    const rawValue = getY(d);

    // Skip null, undefined, NaN values
    if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue)) {
      return;
    }

    // Track negative values but don't include them
    if (rawValue < 0) {
      hasNegatives = true;
      return;
    }

    // Skip zero values
    if (rawValue === 0) {
      return;
    }

    // Get color from scale, fallback to palette if undefined
    const segmentColor = colors(getSegment(d));
    const fallbackColor = SWISS_FEDERAL_COLORS.palette[colorIndex % SWISS_FEDERAL_COLORS.palette.length];

    result.push({
      name: getSegmentAbbreviationOrLabel(d),
      value: rawValue,
      itemStyle: {
        color: segmentColor || fallbackColor,
      },
    });
    colorIndex++;
  });

  // Log warning if negative values were encountered
  if (hasNegatives) {
    console.warn("[PieChart] Negative values were found and excluded from the pie chart.");
  }

  return result;
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
    // Safe type checking for tooltip params
    const p = params as { name?: string; value?: number; percent?: number } | null;
    if (!p) return "";
    const name = p.name ?? "";
    const value = p.value ?? 0;
    const percent = p.percent ?? 0;

    if (!showLabelsOutside) {
      // Inside label - just show percentage for larger slices
      return percent >= 5 ? `${percent.toFixed(0)}%` : "";
    }
    // Outside label - show name and value
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

    // If no valid data, show empty chart with message
    if (filteredData.length === 0) {
      return {
        ...getSwissFederalTheme(),
        graphic: createNoDataGraphic(),
        series: [],
      };
    }

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
