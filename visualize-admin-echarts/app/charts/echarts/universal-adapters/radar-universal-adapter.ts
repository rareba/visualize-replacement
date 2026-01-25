/**
 * Universal Radar Chart Adapter
 *
 * A pure function adapter for radar charts.
 * Displays multi-variable data on axes starting from the same point.
 *
 * Lines of code: ~140
 */

import {
  createItemTooltip,
  createLegend,
  getDefaultAnimation,
} from "@/charts/echarts/adapter-utils";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

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

// ============================================================================
// Radar Adapter Function
// ============================================================================

/**
 * Universal Radar Chart Adapter
 *
 * Transforms UniversalChartState into ECharts radar configuration.
 *
 * Supports two modes:
 * 1. With getX: Uses categories as indicators, segments as series
 * 2. Without getX: Uses unique segment values as indicators, single series with values
 */
export const radarUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, categories } = state;
  const { getSegment, getY, getX } = fields;

  const animation = getDefaultAnimation();

  // Mode 1: Full radar with getX (categories as indicators, segments as series)
  if (getX && getSegment && getY && categories.length > 0) {
    // Create indicators from categories
    const indicators: RadarIndicator[] = categories.map((cat) => ({
      name: cat,
      max: 100, // Will be updated later
    }));

    // Track max values per indicator
    const indicatorMaxValues: number[] = new Array(categories.length).fill(0);

    // Group data by segment
    const groupedData = new Map<string, { name: string; values: number[]; color: string }>();

    observations.forEach((d) => {
      const segment = getSegment(d);
      const category = getX(d) as string;
      const value = getY(d) ?? 0;
      const color = colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[groupedData.size % SWISS_FEDERAL_COLORS.palette.length];

      if (!groupedData.has(segment)) {
        groupedData.set(segment, {
          name: segment,
          values: new Array(categories.length).fill(0),
          color,
        });
      }

      const categoryIdx = categories.indexOf(category);
      if (categoryIdx !== -1) {
        const entry = groupedData.get(segment)!;
        entry.values[categoryIdx] = value;
        indicatorMaxValues[categoryIdx] = Math.max(indicatorMaxValues[categoryIdx], value);
      }
    });

    // Update indicator max values with padding
    indicators.forEach((indicator, idx) => {
      indicator.max = indicatorMaxValues[idx] * 1.2 || 100;
    });

    return buildRadarOption(indicators, Array.from(groupedData.values()), animation);
  }

  // Mode 2: Simple radar without getX (segments as indicators, single series)
  if (getSegment && getY) {
    // Collect unique segments and their values
    const segmentValues = new Map<string, number>();
    let maxValue = 0;

    observations.forEach((d) => {
      const segment = getSegment(d);
      const value = getY(d) ?? 0;

      // Sum values for same segment (in case of duplicates)
      const currentValue = segmentValues.get(segment) ?? 0;
      const newValue = currentValue + value;
      segmentValues.set(segment, newValue);
      maxValue = Math.max(maxValue, newValue);
    });

    // Create indicators from unique segments
    const uniqueSegments = Array.from(segmentValues.keys());
    const indicators: RadarIndicator[] = uniqueSegments.map((seg) => ({
      name: seg,
      max: maxValue * 1.2 || 100,
    }));

    // Create single series with all values
    const values = uniqueSegments.map((seg) => segmentValues.get(seg) ?? 0);
    const seriesData = [{
      name: fields.yLabel || "Value",
      values,
      color: SWISS_FEDERAL_COLORS.palette[0],
    }];

    return buildRadarOption(indicators, seriesData, animation);
  }

  // Fallback: return empty chart configuration
  return buildRadarOption([], [], animation);
};

/**
 * Builds the ECharts radar option from indicators and series data.
 */
const buildRadarOption = (
  indicators: RadarIndicator[],
  seriesDataInput: Array<{ name: string; values: number[]; color: string }>,
  animation: ReturnType<typeof getDefaultAnimation>
): EChartsOption => {
  // ECharts radar requires at least one indicator - provide default if empty
  const safeIndicators = indicators.length > 0
    ? indicators
    : [{ name: "No data", max: 100 }];

  // Build series data for ECharts
  const seriesData: RadarDataItem[] = seriesDataInput.length > 0
    ? seriesDataInput.map((item) => ({
        name: item.name,
        value: item.values,
        itemStyle: { color: item.color },
        areaStyle: { opacity: 0.2 },
      }))
    : [{ name: "No data", value: [0], itemStyle: { color: SWISS_FEDERAL_COLORS.palette[0] } }];

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createItemTooltip(),
      trigger: "item",
    },
    legend: createLegend(),
    radar: {
      indicator: safeIndicators,
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
};

// Register the adapter
registerChartAdapter("radar", radarUniversalAdapter);
