/**
 * Bar Chart (Horizontal) - ECharts Implementation
 *
 * This component provides a horizontal bar chart using Apache ECharts.
 * For vertical bars, use ColumnChartECharts.
 */

import { useMemo } from "react";

import { EChartsWrapper } from "./EChartsWrapper";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "./theme";

import type { BarSeriesOption, EChartsOption } from "echarts";

export interface BarChartData {
  category: string;
  value: number | null;
  segment?: string;
  color?: string;
  observation?: Record<string, unknown>;
}

export interface BarChartEChartsProps {
  data: BarChartData[];
  width?: number | string;
  height?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  stacked?: boolean;
  showValues?: boolean;
  xDomain?: [number, number];
  enableAnimation?: boolean;
  colors?: string[];
  formatTooltip?: (params: unknown) => string;
  formatXAxisTick?: (value: number) => string;
  formatYAxisTick?: (value: string) => string;
  onBarClick?: (data: BarChartData) => void;
  onBarHover?: (data: BarChartData | null) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * ECharts-based Bar Chart (horizontal) component
 */
export function BarChartECharts({
  data,
  width = "100%",
  height = "100%",
  xAxisLabel,
  yAxisLabel,
  stacked = false,
  showValues = false,
  xDomain,
  enableAnimation = true,
  colors = SWISS_FEDERAL_COLORS.palette,
  formatTooltip,
  formatXAxisTick,
  formatYAxisTick,
  onBarClick,
  onBarHover,
  ariaLabel,
  className,
}: BarChartEChartsProps) {
  const { categories, series, legendData } = useMemo(() => {
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

    if (segments.length === 0) {
      const seriesData = categories.map((cat) => {
        const item = data.find((d) => d.category === cat);
        return {
          value: item?.value ?? null,
          itemStyle: item?.color ? { color: item.color } : undefined,
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
                position: "right",
                fontFamily: SWISS_FEDERAL_FONT.family,
                fontSize: SWISS_FEDERAL_FONT.size.label,
              }
            : undefined,
          emphasis: { focus: "series" },
        },
      ];

      return { categories, series, legendData: [] };
    }

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
              position: stacked ? "inside" : "right",
              fontFamily: SWISS_FEDERAL_FONT.family,
              fontSize: SWISS_FEDERAL_FONT.size.label,
            }
          : undefined,
        emphasis: { focus: "series" },
      };
    });

    return { categories, series, legendData: segments };
  }, [data, stacked, showValues, colors]);

  const option: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: formatTooltip,
      },
      legend:
        legendData.length > 0
          ? { data: legendData, bottom: 0 }
          : undefined,
      grid: {
        left: 100,
        right: 40,
        top: 40,
        bottom: legendData.length > 0 ? 60 : 40,
        containLabel: true,
      },
      // For horizontal bars, swap x and y axis
      yAxis: {
        type: "category",
        data: categories,
        name: yAxisLabel,
        nameLocation: "middle",
        nameGap: 80,
        axisLabel: {
          formatter: formatYAxisTick,
        },
      },
      xAxis: {
        type: "value",
        name: xAxisLabel,
        nameLocation: "middle",
        nameGap: 30,
        min: xDomain?.[0],
        max: xDomain?.[1],
        axisLabel: {
          formatter: formatXAxisTick,
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
    xDomain,
    formatTooltip,
    formatXAxisTick,
    formatYAxisTick,
  ]);

  const events = useMemo(() => {
    const handlers: Record<string, (params: unknown) => void> = {};

    if (onBarClick) {
      handlers.click = (params: unknown) => {
        const p = params as { data?: { _original?: BarChartData } };
        if (p.data?._original) {
          onBarClick(p.data._original);
        }
      };
    }

    if (onBarHover) {
      handlers.mouseover = (params: unknown) => {
        const p = params as { data?: { _original?: BarChartData } };
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
