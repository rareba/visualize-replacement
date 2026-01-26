/**
 * Boxplot Chart Adapter (LEGACY)
 *
 * @deprecated Use `boxplotUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/boxplot-universal-adapter.ts for the recommended approach.
 *
 * Displays statistical distribution with quartiles.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createAxisTooltip,
  createXCategoryAxis,
  createYValueAxis,
  createGridConfig,
  createLegend,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { ColumnsState } from "@/charts/column/columns-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Boxplot-specific utilities
// ============================================================================

interface BoxplotDataItem {
  name: string;
  value: [number, number, number, number, number]; // [min, Q1, median, Q3, max]
  itemStyle: { color: string; borderColor: string };
}

/**
 * Calculates boxplot statistics from a set of values.
 */
const calculateBoxplotStats = (
  values: number[]
): [number, number, number, number, number] => {
  if (values.length === 0) return [0, 0, 0, 0, 0];

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const min = sorted[0];
  const max = sorted[n - 1];
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const q1Index = Math.floor(n / 4);
  const q3Index = Math.floor((3 * n) / 4);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];

  return [min, q1, median, q3, max];
};

// ============================================================================
// Boxplot Chart Adapter
// ============================================================================

/**
 * Boxplot chart adapter - displays statistical distribution.
 * Uses the same state as column charts for now.
 */
export const BoxplotChartAdapter = () => {
  const state = useChartState() as ColumnsState;
  const {
    chartData,
    xScale,
    getX,
    getY,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatXAxisTick,
    getRenderingKey,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const categories = xScale.domain();

    // Group values by category for boxplot calculation
    const categoryValues = new Map<string, number[]>();
    chartData.forEach((d) => {
      const cat = getX(d);
      const val = getY(d);
      if (val !== null && val !== undefined) {
        if (!categoryValues.has(cat)) {
          categoryValues.set(cat, []);
        }
        categoryValues.get(cat)!.push(val);
      }
    });

    // Calculate boxplot data for each category
    const boxplotData: BoxplotDataItem[] = categories.map((cat) => {
      const values = categoryValues.get(cat) || [];
      const stats = calculateBoxplotStats(values);
      const color = colors.copy()(cat);
      return {
        name: formatXAxisTick?.(cat) ?? cat,
        value: stats,
        itemStyle: {
          color: color,
          borderColor: color,
        },
      };
    });

    // Calculate y-axis range
    const allValues = Array.from(categoryValues.values()).flat();
    const minY = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxY = allValues.length > 0 ? Math.max(...allValues) : 100;
    const padding = (maxY - minY) * 0.1;

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
      tooltip: createAxisTooltip(),
      legend: createLegend(),
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
      series: [
        {
          type: "boxplot",
          data: boxplotData.map((d) => ({
            value: d.value,
            name: d.name,
            itemStyle: d.itemStyle,
          })),
          itemStyle: {
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.2)",
            },
          },
        },
      ],
    };
  }, [
    chartData,
    xScale,
    getX,
    getY,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
    formatXAxisTick,
    getRenderingKey,
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
