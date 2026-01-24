/**
 * Universal Gauge Chart Adapter
 *
 * A pure function adapter for gauge charts.
 * Shows a single value as a gauge meter.
 *
 * Lines of code: ~60
 */

import {
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

import type { EChartsOption } from "echarts";

// ============================================================================
// Gauge Adapter Function
// ============================================================================

/**
 * Universal Gauge Chart Adapter
 *
 * Transforms UniversalChartState into ECharts gauge chart configuration.
 */
export const gaugeUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, metadata, colors } = state;
  const { getY } = fields;

  // Get the first observation's value (gauge shows a single value)
  const value = observations.length > 0 && getY
    ? getY(observations[0]) ?? 0
    : 0;

  // Calculate min and max from data if possible
  const allValues = getY
    ? observations.map((d) => getY(d) ?? 0)
    : [0];
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(100, ...allValues);

  const animation = getDefaultAnimation();

  // Get color from color accessors (use first segment color or primary)
  const gaugeColor = colors.colorDomain.length > 0
    ? colors.getColor(colors.colorDomain[0])
    : SWISS_FEDERAL_COLORS.primary;

  return {
    ...getSwissFederalTheme(),
    legend: createLegend(),
    series: [
      {
        type: "gauge",
        center: ["50%", "60%"],
        radius: "75%",
        min: minValue,
        max: maxValue,
        startAngle: 200,
        endAngle: -20,
        data: [
          {
            value: value,
            name: metadata.yAxisLabel || "Value",
            itemStyle: {
              color: gaugeColor,
            },
          },
        ],
        title: {
          show: true,
          offsetCenter: [0, "70%"],
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 14,
          color: SWISS_FEDERAL_COLORS.text,
        },
        detail: {
          show: true,
          offsetCenter: [0, "40%"],
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 24,
          fontWeight: "bold",
          color: SWISS_FEDERAL_COLORS.text,
          formatter: (val: number) => val.toLocaleString(),
        },
        pointer: {
          show: true,
          length: "60%",
          width: 6,
          itemStyle: {
            color: gaugeColor,
          },
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.3, SWISS_FEDERAL_COLORS.grid],
              [0.7, SWISS_FEDERAL_COLORS.axis],
              [1, gaugeColor],
            ],
          },
        },
        axisTick: {
          show: true,
          distance: -25,
          length: 8,
          lineStyle: {
            color: "#fff",
            width: 2,
          },
        },
        splitLine: {
          show: true,
          distance: -30,
          length: 15,
          lineStyle: {
            color: "#fff",
            width: 3,
          },
        },
        axisLabel: {
          show: true,
          distance: 30,
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 10,
          color: SWISS_FEDERAL_COLORS.text,
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 15,
          itemStyle: {
            borderWidth: 3,
            borderColor: gaugeColor,
            color: "#fff",
          },
        },
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("gauge", gaugeUniversalAdapter);
