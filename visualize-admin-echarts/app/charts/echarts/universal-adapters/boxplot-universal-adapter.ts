/**
 * Universal Boxplot Chart Adapter
 *
 * A pure function adapter for boxplot charts.
 * Displays statistical distribution with quartiles.
 *
 * Lines of code: ~150
 */

import {
  createAxisTooltip,
  createGridConfig,
  createLegend,
  createXCategoryAxis,
  createYValueAxis,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Boxplot-specific utilities
// ============================================================================

interface BoxplotDataItem {
  name: string;
  value: [number, number, number, number, number]; // [min, Q1, median, Q3, max]
  itemStyle: { color: string; borderColor: string };
}

// Minimum number of values needed for a meaningful boxplot
const MIN_VALUES_FOR_BOXPLOT = 5;

/**
 * Calculates boxplot statistics from a set of values.
 * Uses proper quartile calculation for accurate statistics.
 */
const calculateBoxplotStats = (
  values: number[]
): [number, number, number, number, number] => {
  if (values.length === 0) return [0, 0, 0, 0, 0];

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // For very small samples, return the range with median
  if (n < MIN_VALUES_FOR_BOXPLOT) {
    const min = sorted[0];
    const max = sorted[n - 1];
    const median = n === 1 ? sorted[0] :
      n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    // For small samples, spread Q1/Q3 slightly for visibility
    const spread = (max - min) * 0.1;
    return [min, Math.max(min, median - spread), median, Math.min(max, median + spread), max];
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  // Use linear interpolation for quartiles (more accurate)
  const q1Index = (n - 1) * 0.25;
  const q3Index = (n - 1) * 0.75;

  const q1Lower = Math.floor(q1Index);
  const q1Frac = q1Index - q1Lower;
  const q1 = sorted[q1Lower] + q1Frac * (sorted[Math.ceil(q1Index)] - sorted[q1Lower]);

  const q3Lower = Math.floor(q3Index);
  const q3Frac = q3Index - q3Lower;
  const q3 = sorted[q3Lower] + q3Frac * (sorted[Math.ceil(q3Index)] - sorted[q3Lower]);

  return [min, q1, median, q3, max];
};

// ============================================================================
// Boxplot Adapter Function
// ============================================================================

/**
 * Universal Boxplot Chart Adapter
 *
 * Transforms UniversalChartState into ECharts boxplot configuration.
 */
export const boxplotUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, categories } = state;
  const { getX, getY } = fields;

  const safeBounds = safeGetBounds(bounds);

  // Group values by category for boxplot calculation
  const categoryValues = new Map<string, number[]>();
  observations.forEach((d) => {
    if (getX && getY) {
      const cat = getX(d) as string;
      const val = getY(d);
      if (val !== null && val !== undefined) {
        if (!categoryValues.has(cat)) {
          categoryValues.set(cat, []);
        }
        categoryValues.get(cat)!.push(val);
      }
    }
  });

  // Calculate boxplot data for each category
  const boxplotData: BoxplotDataItem[] = categories.map((cat, index) => {
    const values = categoryValues.get(cat) || [];
    const stats = calculateBoxplotStats(values);
    const color = colors.getColor(cat) || SWISS_FEDERAL_COLORS.palette[index % SWISS_FEDERAL_COLORS.palette.length];
    return {
      name: cat,
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
        boxWidth: ["40%", "60%"],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
      },
      // Add scatter points to show individual data points
      {
        name: "Data Points",
        type: "scatter",
        data: categories.flatMap((cat, catIndex) => {
          const values = categoryValues.get(cat) || [];
          const color = colors.getColor(cat) || SWISS_FEDERAL_COLORS.palette[catIndex % SWISS_FEDERAL_COLORS.palette.length];
          return values.map((val) => ({
            value: [catIndex, val],
            itemStyle: {
              color: color,
              opacity: 0.6,
            },
          }));
        }),
        symbolSize: 6,
        emphasis: {
          itemStyle: {
            opacity: 1,
          },
        },
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("boxplot", boxplotUniversalAdapter);
