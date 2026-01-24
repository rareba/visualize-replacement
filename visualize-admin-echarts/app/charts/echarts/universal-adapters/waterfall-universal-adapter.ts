/**
 * Universal Waterfall Chart Adapter
 *
 * A pure function adapter for waterfall charts.
 * Shows cumulative effect of sequential values.
 *
 * Lines of code: ~160
 */

import {
  createAxisTooltip,
  createGridConfig,
  createXCategoryAxis,
  createYValueAxis,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import {
  getSwissFederalTheme,
  SWISS_FEDERAL_COLORS,
} from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption, BarSeriesOption } from "echarts";

// ============================================================================
// Waterfall Adapter Function
// ============================================================================

/**
 * Universal Waterfall Chart Adapter
 *
 * Transforms UniversalChartState into ECharts waterfall configuration.
 */
export const waterfallUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, bounds, metadata, categories } = state;
  const { getX, getY } = fields;

  const safeBounds = safeGetBounds(bounds);

  // Get values by category
  const categoryValueMap = new Map<string, number>();
  observations.forEach((d) => {
    if (getX && getY) {
      const cat = getX(d) as string;
      const val = getY(d);
      if (val !== null && val !== undefined) {
        categoryValueMap.set(cat, val);
      }
    }
  });

  // Calculate waterfall data
  let cumulative = 0;
  const placeholderData: (number | "-")[] = [];
  const increaseData: (number | "-")[] = [];
  const decreaseData: (number | "-")[] = [];
  const totalData: (number | "-")[] = [];

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
  const allValues = observations.map((d) => getY?.(d) ?? 0);
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
      categories,
      name: metadata.xAxisLabel,
      nameGap: 35,
    }),
    yAxis: createYValueAxis({
      name: metadata.yAxisLabel,
      nameGap: 50,
      min: minY - padding,
      max: maxY + padding,
    }),
    series,
  };
};

// Register the adapter
registerChartAdapter("waterfall", waterfallUniversalAdapter);
