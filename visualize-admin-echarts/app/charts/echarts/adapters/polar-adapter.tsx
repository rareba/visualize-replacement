/**
 * Polar Chart Adapter
 *
 * Displays data in circular coordinate system.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createItemTooltip,
  createLegend,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { getSwissFederalTheme, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Polar Chart Adapter
// ============================================================================

/**
 * Polar chart adapter - displays data in circular coordinates.
 * Uses pie state for categorical data.
 */
export const PolarChartAdapter = () => {
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
    // Build polar data from chart state
    const polarData = chartData
      .map((d) => ({
        name: getSegmentAbbreviationOrLabel(d),
        value: getY(d) ?? 0,
        itemStyle: {
          color: colors(getSegment(d)),
        },
      }))
      .filter((d) => d.value > 0);

    const categories = polarData.map((d) => d.name);
    const maxValue = Math.max(...polarData.map((d) => d.value), 0);

    return {
      ...getSwissFederalTheme(),
      tooltip: {
        ...createItemTooltip(),
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number };
          const formattedValue = valueLabelFormatter
            ? valueLabelFormatter(p.value)
            : p.value;
          return `${p.name}: ${formattedValue}`;
        },
      },
      legend: createLegend(),
      polar: {
        radius: ["20%", "80%"],
      },
      angleAxis: {
        type: "category",
        data: categories,
        startAngle: 90,
        axisLabel: {
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 11,
        },
      },
      radiusAxis: {
        type: "value",
        max: maxValue * 1.1,
        axisLabel: {
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 10,
        },
      },
      series: [
        {
          type: "bar",
          coordinateSystem: "polar",
          data: polarData,
          label: {
            show: showValues !== false,
            position: "end",
            fontFamily: SWISS_FEDERAL_FONT.family,
            fontSize: 10,
            formatter: (params: unknown) => {
              const p = params as { value: number };
              return valueLabelFormatter
                ? valueLabelFormatter(p.value)
                : String(p.value);
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)",
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
