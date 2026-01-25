/**
 * Universal Candlestick Chart Adapter
 *
 * A pure function adapter for candlestick (OHLC) charts.
 * Displays financial data with Open, High, Low, Close values.
 *
 * Lines of code: ~180
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
// Candlestick-specific configuration
// ============================================================================

// Colors for up/down candles
const CANDLESTICK_COLORS = {
  up: "#26a69a", // Green for price increase
  down: "#ef5350", // Red for price decrease
  upBorder: "#26a69a",
  downBorder: "#ef5350",
};

// ============================================================================
// Candlestick Adapter Function
// ============================================================================

/**
 * Universal Candlestick Chart Adapter
 *
 * Transforms UniversalChartState into ECharts candlestick configuration.
 * The data should have Open, High, Low, Close values organized by time/category.
 *
 * Expected data format in observations:
 * - X dimension: time/date category
 * - Y measure: used as the primary value (close price)
 * - Additional measures can be used for open, high, low via data transformation
 */
export const candlestickUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, bounds, metadata, categories } = state;
  const { getX, getY } = fields;

  const safeBounds = safeGetBounds(bounds);

  // Group data by category to build OHLC data
  // For a proper candlestick, we need Open, High, Low, Close per category
  // Since we may not have all four values, we'll simulate from available data
  const categoryData = new Map<string, number[]>();

  observations.forEach((d) => {
    if (getX && getY) {
      const cat = String(getX(d));
      const val = getY(d);
      if (val !== null && val !== undefined) {
        if (!categoryData.has(cat)) {
          categoryData.set(cat, []);
        }
        categoryData.get(cat)!.push(val);
      }
    }
  });

  // Build candlestick data: [open, close, low, high] for each category
  const candlestickData: Array<[number, number, number, number]> = [];
  const xAxisData: string[] = [];

  // Sort categories if they look like dates
  const sortedCategories = [...categories].sort();

  sortedCategories.forEach((cat) => {
    const values = categoryData.get(cat) || [];
    if (values.length > 0) {
      // If we have multiple values, use them as a time series within the period
      const sorted = [...values].sort((a, b) => a - b);
      const open = values[0]; // First value as open
      const close = values[values.length - 1]; // Last value as close
      const low = sorted[0]; // Minimum
      const high = sorted[sorted.length - 1]; // Maximum

      candlestickData.push([open, close, low, high]);
      xAxisData.push(cat);
    } else if (values.length === 1) {
      // Single value - use it for all OHLC (flat candle)
      const val = values[0];
      candlestickData.push([val, val, val, val]);
      xAxisData.push(cat);
    }
  });

  // Calculate y-axis range
  const allValues = candlestickData.flatMap((d) => d);
  const minY = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxY = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxY - minY) * 0.1;

  return {
    ...getSwissFederalTheme(),
    grid: createGridConfig({
      ...safeBounds,
      // Add extra bottom margin for dataZoom
      margins: {
        ...safeBounds.margins,
        bottom: (safeBounds.margins?.bottom || 40) + 60,
      },
    }),
    tooltip: {
      ...createAxisTooltip(),
      formatter: (params: unknown) => {
        const p = params as {
          name: string;
          data: [number, number, number, number];
        };
        if (!p.data) return "";
        const [open, close, low, high] = p.data;
        const format = metadata.formatNumber || ((v: number) => v.toFixed(2));
        return `
          <strong>${p.name}</strong><br/>
          Open: ${format(open)}<br/>
          Close: ${format(close)}<br/>
          Low: ${format(low)}<br/>
          High: ${format(high)}
        `;
      },
    },
    legend: createLegend(),
    xAxis: {
      ...createXCategoryAxis({
        categories: xAxisData,
        name: metadata.xAxisLabel,
        nameGap: 35,
      }),
      axisLabel: {
        rotate: xAxisData.length > 10 ? 45 : 0,
      },
    },
    yAxis: createYValueAxis({
      name: metadata.yAxisLabel || "Price",
      nameGap: 50,
      min: minY - padding,
      max: maxY + padding,
      scale: true,
    }),
    dataZoom: [
      {
        type: "slider",
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 10,
        height: 30,
        borderColor: SWISS_FEDERAL_COLORS.border,
        fillerColor: "rgba(0, 102, 153, 0.1)",
        handleStyle: {
          color: SWISS_FEDERAL_COLORS.primary,
        },
      },
      {
        type: "inside",
        xAxisIndex: [0],
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        type: "candlestick",
        data: candlestickData,
        itemStyle: {
          color: CANDLESTICK_COLORS.up,
          color0: CANDLESTICK_COLORS.down,
          borderColor: CANDLESTICK_COLORS.upBorder,
          borderColor0: CANDLESTICK_COLORS.downBorder,
          borderWidth: 1,
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
};

// Register the adapter
registerChartAdapter("candlestick", candlestickUniversalAdapter);
