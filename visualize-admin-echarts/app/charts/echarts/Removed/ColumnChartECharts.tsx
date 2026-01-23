/**
 * Column Chart - ECharts Implementation
 *
 * This component provides a column (vertical bar) chart using Apache ECharts.
 * It replaces the D3-based implementation for improved maintainability.
 *
 * Features:
 * - Simple and stacked columns
 * - Value labels
 * - Error whiskers
 * - Tooltips
 * - Animation
 * - Swiss Federal Design theming
 */

import { useMemo } from "react";

import { EChartsWrapper } from "./EChartsWrapper";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "./theme";

import type { BarSeriesOption, EChartsOption } from "echarts";

export interface ColumnChartData {
  category: string;
  value: number | null;
  segment?: string;
  color?: string;
  // Error range for whiskers
  errorLow?: number;
  errorHigh?: number;
  // Original observation for tooltip
  observation?: Record<string, unknown>;
}

export interface ColumnChartEChartsProps {
  // Data
  data: ColumnChartData[];
  // Dimensions
  width?: number | string;
  height?: number | string;
  // Axis labels
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Stacking
  stacked?: boolean;
  // Value display
  showValues?: boolean;
  rotateValues?: boolean;
  // Y-axis domain
  yDomain?: [number, number];
  // Animation
  enableAnimation?: boolean;
  // Colors
  colors?: string[];
  // Tooltip formatter
  formatTooltip?: (params: unknown) => string;
  formatXAxisTick?: (value: string) => string;
  formatYAxisTick?: (value: number) => string;
  // Events
  onBarClick?: (data: ColumnChartData) => void;
  onBarHover?: (data: ColumnChartData | null) => void;
  // Accessibility
  ariaLabel?: string;
  // Class name
  className?: string;
}

/**
 * ECharts-based Column Chart component
 */
export function ColumnChartECharts({
  data,
  width = "100%",
  height = "100%",
  xAxisLabel,
  yAxisLabel,
  stacked = false,
  showValues = false,
  rotateValues = false,
  yDomain,
  enableAnimation = true,
  colors = SWISS_FEDERAL_COLORS.palette,
  formatTooltip,
  formatXAxisTick,
  formatYAxisTick,
  onBarClick,
  onBarHover,
  ariaLabel,
  className,
}: ColumnChartEChartsProps) {
  // Process data into ECharts format
  const { categories, series, legendData } = useMemo(() => {
    // Get unique categories (x-axis values)
    const categorySet = new Set<string>();
    const segmentSet = new Set<string>();

    data.forEach((d) => {
      categorySet.add(d.category);
      if (d.segment) {
        segmentSet.add(d.segment);
      }
    });

    const categories = Array.from(categorySet);
    const segments = Array.from(segmentSet);

    // If no segments, create a single series
    if (segments.length === 0) {
      const seriesData = categories.map((cat) => {
        const item = data.find((d) => d.category === cat);
        return {
          value: item?.value ?? null,
          itemStyle: item?.color ? { color: item.color } : undefined,
          // Store original data for tooltip/events
          _original: item,
        };
      });

      const series: BarSeriesOption[] = [
        {
          type: "bar",
          data: seriesData,
          stack: stacked ? "total" : undefined,
          label: showValues
            ? {
                show: true,
                position: "top",
                rotate: rotateValues ? 90 : 0,
                fontFamily: SWISS_FEDERAL_FONT.family,
                fontSize: SWISS_FEDERAL_FONT.size.label,
              }
            : undefined,
          emphasis: {
            focus: "series",
          },
          // Store category info for error bars
          markLine: undefined,
        },
      ];

      return { categories, series, legendData: [] };
    }

    // Multiple segments - create series for each
    const series: BarSeriesOption[] = segments.map((segment, idx) => {
      const segmentData = categories.map((cat) => {
        const item = data.find(
          (d) => d.category === cat && d.segment === segment
        );
        return {
          value: item?.value ?? null,
          itemStyle: item?.color ? { color: item.color } : undefined,
          _original: item,
        };
      });

      return {
        name: segment,
        type: "bar",
        data: segmentData,
        stack: stacked ? "total" : undefined,
        color: colors[idx % colors.length],
        label: showValues
          ? {
              show: true,
              position: stacked ? "inside" : "top",
              rotate: rotateValues ? 90 : 0,
              fontFamily: SWISS_FEDERAL_FONT.family,
              fontSize: SWISS_FEDERAL_FONT.size.label,
            }
          : undefined,
        emphasis: {
          focus: "series",
        },
      };
    });

    return { categories, series, legendData: segments };
  }, [data, stacked, showValues, rotateValues, colors]);

  // Build ECharts option
  const option: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: formatTooltip,
      },
      legend:
        legendData.length > 0
          ? {
              data: legendData,
              bottom: 0,
            }
          : undefined,
      grid: {
        left: 60,
        right: 20,
        top: 40,
        bottom: legendData.length > 0 ? 60 : 40,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        name: xAxisLabel,
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: {
          formatter: formatXAxisTick,
          interval: 0,
          rotate: categories.length > 10 ? 45 : 0,
        },
      },
      yAxis: {
        type: "value",
        name: yAxisLabel,
        nameLocation: "middle",
        nameGap: 50,
        min: yDomain?.[0],
        max: yDomain?.[1],
        axisLabel: {
          formatter: formatYAxisTick,
        },
      },
      series,
    };
  }, [
    categories,
    series,
    legendData,
    xAxisLabel,
    yAxisLabel,
    yDomain,
    formatTooltip,
    formatXAxisTick,
    formatYAxisTick,
  ]);

  // Event handlers
  const events = useMemo(() => {
    const handlers: Record<string, (params: unknown) => void> = {};

    if (onBarClick) {
      handlers.click = (params: unknown) => {
        const p = params as { data?: { _original?: ColumnChartData } };
        if (p.data?._original) {
          onBarClick(p.data._original);
        }
      };
    }

    if (onBarHover) {
      handlers.mouseover = (params: unknown) => {
        const p = params as { data?: { _original?: ColumnChartData } };
        if (p.data?._original) {
          onBarHover(p.data._original);
        }
      };
      handlers.mouseout = () => {
        onBarHover(null);
      };
    }

    return handlers;
  }, [onBarClick, onBarHover]);

  return (
    <EChartsWrapper
      option={option}
      width={width}
      height={height}
      enableAnimation={enableAnimation}
      ariaLabel={ariaLabel}
      className={className}
      onEvents={events}
      opts={{ renderer: "svg" }}
    />
  );
}
