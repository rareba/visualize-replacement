/**
 * Waterfall Chart Adapter
 *
 * Shows cumulative effect of sequential values.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createAxisTooltip,
  createXCategoryAxis,
  createYValueAxis,
  createGridConfig,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
} from "@/charts/echarts/theme";
import { ColumnsState } from "@/charts/column/columns-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, BarSeriesOption } from "echarts";

// ============================================================================
// Waterfall Chart Adapter
// ============================================================================

/**
 * Waterfall chart adapter - displays cumulative effect of values.
 * Uses the same state as column charts.
 */
export const WaterfallChartAdapter = () => {
  const state = useChartState() as ColumnsState;
  const {
    chartData,
    xScale,
    getX,
    getY,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatXAxisTick,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = xScale.domain();

    // Calculate waterfall data
    // Each bar shows the change, with invisible bars to create the waterfall effect
    let cumulative = 0;
    const placeholderData: (number | "-")[] = [];
    const increaseData: (number | "-")[] = [];
    const decreaseData: (number | "-")[] = [];
    const totalData: (number | "-")[] = [];

    // Get values by category
    const categoryValueMap = new Map<string, number>();
    chartData.forEach((d) => {
      const cat = getX(d);
      const val = getY(d);
      if (val !== null && val !== undefined) {
        categoryValueMap.set(cat, val);
      }
    });

    categories.forEach((cat, index) => {
      const value = categoryValueMap.get(cat) ?? 0;

      // Last item shows the total
      if (index === categories.length - 1) {
        placeholderData.push(0);
        increaseData.push("-");
        decreaseData.push("-");
        totalData.push(cumulative + value);
      } else {
        if (value >= 0) {
          placeholderData.push(cumulative);
          increaseData.push(value);
          decreaseData.push("-");
          totalData.push("-");
        } else {
          placeholderData.push(cumulative + value);
          increaseData.push("-");
          decreaseData.push(Math.abs(value));
          totalData.push("-");
        }
        cumulative += value;
      }
    });

    // Calculate y-axis range
    const allValues = chartData.map((d) => getY(d) ?? 0);
    const minY = Math.min(0, ...allValues);
    const maxY = Math.max(cumulative, ...allValues);
    const padding = (maxY - minY) * 0.1;

    const series: BarSeriesOption[] = [
      // Invisible placeholder bars
      {
        name: "Placeholder",
        type: "bar",
        stack: "Total",
        silent: true,
        itemStyle: {
          borderColor: "transparent",
          color: "transparent",
        },
        emphasis: {
          itemStyle: {
            borderColor: "transparent",
            color: "transparent",
          },
        },
        data: placeholderData,
      },
      // Increase bars (positive values)
      {
        name: "Increase",
        type: "bar",
        stack: "Total",
        data: increaseData,
        itemStyle: {
          color: SWISS_FEDERAL_COLORS.success,
        },
        label: {
          show: true,
          position: "top",
          formatter: (params) => {
            const val = params.value;
            return val !== "-" && val !== 0 ? `+${val}` : "";
          },
        },
      },
      // Decrease bars (negative values)
      {
        name: "Decrease",
        type: "bar",
        stack: "Total",
        data: decreaseData,
        itemStyle: {
          color: SWISS_FEDERAL_COLORS.error,
        },
        label: {
          show: true,
          position: "bottom",
          formatter: (params) => {
            const val = params.value;
            return val !== "-" && val !== 0 ? `-${val}` : "";
          },
        },
      },
      // Total bar (final value)
      {
        name: "Total",
        type: "bar",
        stack: "Total",
        data: totalData,
        itemStyle: {
          color: SWISS_FEDERAL_COLORS.primary,
        },
        label: {
          show: true,
          position: "top",
          formatter: (params) => {
            const val = params.value;
            return val !== "-" ? String(val) : "";
          },
        },
      },
    ];

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: {
        ...createAxisTooltip(),
        formatter: (params: unknown) => {
          const paramArr = params as Array<{ name: string; seriesName: string; value: number | string }>;
          const item = paramArr.find((p) => p.value !== "-" && p.seriesName !== "Placeholder");
          if (!item) return "";
          return `${item.name}: ${item.value}`;
        },
      },
      legend: {
        data: ["Increase", "Decrease", "Total"],
        top: 10,
      },
      xAxis: createXCategoryAxis({
        categories: categories.map((c) => formatXAxisTick?.(c) ?? c),
        name: xAxisLabel,
        nameGap: 35,
      }),
      yAxis: createYValueAxis({
        name: yAxisLabel,
        nameGap: 50,
        min: minY - padding,
        max: maxY + padding,
      }),
      series,
    };
  }, [chartData, xScale, getX, getY, bounds, xAxisLabel, yAxisLabel, formatXAxisTick]);

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
