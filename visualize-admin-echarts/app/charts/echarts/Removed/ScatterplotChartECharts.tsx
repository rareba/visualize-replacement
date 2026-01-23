/**
 * Scatterplot Chart - ECharts Implementation
 *
 * This component provides a scatterplot/bubble chart using Apache ECharts.
 * Supports size encoding and multiple segments.
 */

import { useMemo } from "react";

import { EChartsWrapper } from "./EChartsWrapper";
import { SWISS_FEDERAL_COLORS } from "./theme";

import type { EChartsOption, ScatterSeriesOption } from "echarts";

export interface ScatterplotData {
  x: number;
  y: number;
  size?: number;
  label?: string;
  segment?: string;
  color?: string;
  observation?: Record<string, unknown>;
}

export interface ScatterplotChartEChartsProps {
  data: ScatterplotData[];
  width?: number | string;
  height?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Size encoding
  sizeRange?: [number, number];
  // Domain
  xDomain?: [number, number];
  yDomain?: [number, number];
  // Animation
  enableAnimation?: boolean;
  // Colors
  colors?: string[];
  // Formatters
  formatTooltip?: (params: unknown) => string;
  formatXAxisTick?: (value: number) => string;
  formatYAxisTick?: (value: number) => string;
  // Events
  onPointClick?: (data: ScatterplotData) => void;
  onPointHover?: (data: ScatterplotData | null) => void;
  // Accessibility
  ariaLabel?: string;
  className?: string;
}

/**
 * ECharts-based Scatterplot Chart component
 */
export function ScatterplotChartECharts({
  data,
  width = "100%",
  height = "100%",
  xAxisLabel,
  yAxisLabel,
  sizeRange = [8, 40],
  xDomain,
  yDomain,
  enableAnimation = true,
  colors = SWISS_FEDERAL_COLORS.palette,
  formatTooltip,
  formatXAxisTick,
  formatYAxisTick,
  onPointClick,
  onPointHover,
  ariaLabel,
  className,
}: ScatterplotChartEChartsProps) {
  const { series, legendData, sizeScale } = useMemo(() => {
    const segmentSet = new Set<string>();
    data.forEach((d) => {
      if (d.segment) {
        segmentSet.add(d.segment);
      }
    });
    const segments = Array.from(segmentSet);

    // Calculate size scale if sizes are provided
    let sizeScale: ((v: number | undefined) => number) | null = null;
    const sizes = data.map((d) => d.size).filter((s): s is number => s !== undefined);
    if (sizes.length > 0) {
      const minSize = Math.min(...sizes);
      const maxSize = Math.max(...sizes);
      sizeScale = (value: number | undefined) => {
        if (value === undefined) return sizeRange[0];
        if (minSize === maxSize) return (sizeRange[0] + sizeRange[1]) / 2;
        const normalized = (value - minSize) / (maxSize - minSize);
        return sizeRange[0] + normalized * (sizeRange[1] - sizeRange[0]);
      };
    }

    if (segments.length === 0) {
      // Single series
      const scatterData = data.map((d) => ({
        value: [d.x, d.y],
        symbolSize: sizeScale ? sizeScale(d.size) : sizeRange[0],
        itemStyle: d.color ? { color: d.color } : undefined,
        _original: d,
      }));

      const series: ScatterSeriesOption[] = [
        {
          type: "scatter",
          data: scatterData,
          emphasis: {
            focus: "self",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ];

      return { series, legendData: [], sizeScale };
    }

    // Multiple segments
    const series: ScatterSeriesOption[] = segments.map((segment, idx) => {
      const segmentData = data
        .filter((d) => d.segment === segment)
        .map((d) => ({
          value: [d.x, d.y],
          symbolSize: sizeScale ? sizeScale(d.size) : sizeRange[0],
          itemStyle: d.color ? { color: d.color } : undefined,
          _original: d,
        }));

      return {
        name: segment,
        type: "scatter",
        data: segmentData,
        color: colors[idx % colors.length],
        emphasis: {
          focus: "self",
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      };
    });

    return { series, legendData: segments, sizeScale };
  }, [data, sizeRange, colors]);

  const option: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        formatter: formatTooltip ?? ((params: unknown) => {
          const p = params as { data?: { value?: [number, number]; _original?: ScatterplotData } };
          if (!p.data?.value) return "";
          const [x, y] = p.data.value;
          const label = p.data._original?.label;
          return label
            ? `${label}<br/>X: ${x}<br/>Y: ${y}`
            : `X: ${x}<br/>Y: ${y}`;
        }),
      },
      legend:
        legendData.length > 0
          ? { data: legendData, bottom: 0 }
          : undefined,
      grid: {
        left: 60,
        right: 20,
        top: 40,
        bottom: legendData.length > 0 ? 60 : 40,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: xAxisLabel,
        nameLocation: "middle",
        nameGap: 30,
        min: xDomain?.[0],
        max: xDomain?.[1],
        axisLabel: { formatter: formatXAxisTick },
      },
      yAxis: {
        type: "value",
        name: yAxisLabel,
        nameLocation: "middle",
        nameGap: 50,
        min: yDomain?.[0],
        max: yDomain?.[1],
        axisLabel: { formatter: formatYAxisTick },
      },
      series,
    };
  }, [
    series,
    legendData,
    xAxisLabel,
    yAxisLabel,
    xDomain,
    yDomain,
    formatTooltip,
    formatXAxisTick,
    formatYAxisTick,
  ]);

  const events = useMemo(() => {
    const handlers: Record<string, (params: unknown) => void> = {};

    if (onPointClick) {
      handlers.click = (params: unknown) => {
        const p = params as { data?: { _original?: ScatterplotData } };
        if (p.data?._original) {
          onPointClick(p.data._original);
        }
      };
    }

    if (onPointHover) {
      handlers.mouseover = (params: unknown) => {
        const p = params as { data?: { _original?: ScatterplotData } };
        if (p.data?._original) {
          onPointHover(p.data._original);
        }
      };
      handlers.mouseout = () => {
        onPointHover(null);
      };
    }

    return handlers;
  }, [onPointClick, onPointHover]);

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
