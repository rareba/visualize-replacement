/**
 * Gauge Chart Adapter
 *
 * Displays a single value as a gauge/dial indicator.
 */

import { useMemo } from "react";

import {
  ChartBounds,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
} from "@/charts/echarts/theme";
import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, GaugeSeriesOption } from "echarts";

// ============================================================================
// Gauge Chart Adapter
// ============================================================================

/**
 * Gauge chart adapter
 */
export const GaugeChartAdapter = () => {
  const state = useChartState() as PieState;
  const { chartData, getY, bounds, valueLabelFormatter } = state;

  const option = useMemo((): EChartsOption => {
    const animation = getDefaultAnimation();

    // Get the first value from data
    const firstValue = chartData.length > 0 ? (getY(chartData[0]) ?? 0) : 0;

    // Calculate min/max from data or use defaults
    let min = 0;
    let max = 100;
    if (chartData.length > 0) {
      const values = chartData.map(d => getY(d) ?? 0).filter(v => v !== 0);
      if (values.length > 0) {
        max = Math.max(...values) * 1.2; // Add 20% headroom
      }
    }

    return {
      ...getSwissFederalTheme(),
      series: [
        {
          type: "gauge",
          center: ["50%", "60%"],
          radius: "80%",
          min,
          max,
          startAngle: 200,
          endAngle: -20,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, SWISS_FEDERAL_COLORS.success],
                [0.7, SWISS_FEDERAL_COLORS.warning],
                [1, SWISS_FEDERAL_COLORS.error],
              ],
            },
          },
          pointer: {
            icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
            length: "55%",
            width: 12,
            offsetCenter: [0, "5%"],
            itemStyle: {
              color: SWISS_FEDERAL_COLORS.text,
            },
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: "auto",
              width: 2,
            },
          },
          splitLine: {
            length: 15,
            lineStyle: {
              color: "auto",
              width: 3,
            },
          },
          axisLabel: {
            color: SWISS_FEDERAL_COLORS.text,
            fontFamily: SWISS_FEDERAL_FONT.family,
            fontSize: 11,
            distance: 25,
            formatter: (value: number) => {
              if (valueLabelFormatter) {
                return valueLabelFormatter(value);
              }
              return value.toFixed(0);
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            fontFamily: SWISS_FEDERAL_FONT.family,
            fontSize: 24,
            fontWeight: "bold",
            color: SWISS_FEDERAL_COLORS.text,
            offsetCenter: [0, "40%"],
            formatter: (value: number) => {
              if (valueLabelFormatter) {
                return valueLabelFormatter(value);
              }
              return value.toFixed(1);
            },
          },
          data: [
            {
              value: firstValue,
              name: "",
            },
          ],
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
        } as GaugeSeriesOption,
      ],
    };
  }, [chartData, getY, valueLabelFormatter]);

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
