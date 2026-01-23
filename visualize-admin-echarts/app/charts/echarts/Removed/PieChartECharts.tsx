/**
 * Pie Chart - ECharts Implementation
 *
 * This component provides a pie/donut chart using Apache ECharts.
 * Supports pie, donut, and labeled variants.
 */

import { useMemo } from "react";

import { EChartsWrapper } from "./EChartsWrapper";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "./theme";

import type { EChartsOption, PieSeriesOption } from "echarts";

export interface PieChartData {
  label: string;
  value: number | null;
  color?: string;
  observation?: Record<string, unknown>;
}

export interface PieChartEChartsProps {
  data: PieChartData[];
  width?: number | string;
  height?: number | string;
  // Donut hole size (0-100, 0 = pie, >0 = donut)
  innerRadius?: number;
  // Display options
  showLabels?: boolean;
  showValues?: boolean;
  showPercentage?: boolean;
  // Animation
  enableAnimation?: boolean;
  // Colors
  colors?: string[];
  // Formatters
  formatTooltip?: (params: unknown) => string;
  formatLabel?: (value: number, label: string) => string;
  // Events
  onSliceClick?: (data: PieChartData) => void;
  onSliceHover?: (data: PieChartData | null) => void;
  // Accessibility
  ariaLabel?: string;
  className?: string;
}

/**
 * ECharts-based Pie Chart component
 */
export function PieChartECharts({
  data,
  width = "100%",
  height = "100%",
  innerRadius = 0,
  showLabels = true,
  showValues = false,
  showPercentage = false,
  enableAnimation = true,
  colors = SWISS_FEDERAL_COLORS.palette,
  formatTooltip,
  formatLabel,
  onSliceClick,
  onSliceHover,
  ariaLabel,
  className,
}: PieChartEChartsProps) {
  const { pieData, total } = useMemo(() => {
    // Filter out null/zero values and calculate total
    const filteredData = data.filter((d) => d.value && d.value > 0);
    const total = filteredData.reduce((sum, d) => sum + (d.value ?? 0), 0);

    const pieData = filteredData.map((d, idx) => ({
      name: d.label,
      value: d.value ?? 0,
      itemStyle: d.color
        ? { color: d.color }
        : { color: colors[idx % colors.length] },
      _original: d,
    }));

    return { pieData, total };
  }, [data, colors]);

  const series: PieSeriesOption = useMemo(() => {
    return {
      type: "pie",
      radius: innerRadius > 0 ? [`${innerRadius}%`, "70%"] : ["0%", "70%"],
      center: ["50%", "50%"],
      data: pieData,
      label: showLabels
        ? {
            show: true,
            fontFamily: SWISS_FEDERAL_FONT.family,
            fontSize: SWISS_FEDERAL_FONT.size.label,
            formatter: (params: { name: string; value: number; percent: number }) => {
              const parts: string[] = [params.name];
              if (showValues) {
                parts.push(`: ${formatLabel ? formatLabel(params.value, params.name) : params.value}`);
              }
              if (showPercentage) {
                parts.push(` (${params.percent.toFixed(1)}%)`);
              }
              return parts.join("");
            },
          }
        : { show: false },
      labelLine: showLabels ? { show: true } : { show: false },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    };
  }, [pieData, innerRadius, showLabels, showValues, showPercentage, formatLabel]);

  const option: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        formatter: formatTooltip ?? "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        data: pieData.map((d) => d.name),
      },
      series: [series],
    };
  }, [pieData, series, formatTooltip]);

  const events = useMemo(() => {
    const handlers: Record<string, (params: unknown) => void> = {};

    if (onSliceClick) {
      handlers.click = (params: unknown) => {
        const p = params as { data?: { _original?: PieChartData } };
        if (p.data?._original) {
          onSliceClick(p.data._original);
        }
      };
    }

    if (onSliceHover) {
      handlers.mouseover = (params: unknown) => {
        const p = params as { data?: { _original?: PieChartData } };
        if (p.data?._original) {
          onSliceHover(p.data._original);
        }
      };
      handlers.mouseout = () => {
        onSliceHover(null);
      };
    }

    return handlers;
  }, [onSliceClick, onSliceHover]);

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
