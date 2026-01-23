/**
 * Area Chart - ECharts Implementation
 *
 * This component provides an area chart using Apache ECharts.
 * Supports single and stacked areas.
 */

import { useMemo } from "react";

import { EChartsWrapper } from "./EChartsWrapper";
import { SWISS_FEDERAL_COLORS } from "./theme";

import type { EChartsOption, LineSeriesOption } from "echarts";

export interface AreaChartData {
  x: string | number | Date;
  y: number | null;
  segment?: string;
  color?: string;
  observation?: Record<string, unknown>;
}

export interface AreaChartEChartsProps {
  data: AreaChartData[];
  width?: number | string;
  height?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Display options
  showDots?: boolean;
  smooth?: boolean;
  stacked?: boolean;
  // Opacity of the area fill (0-1)
  areaOpacity?: number;
  // Axis type
  xAxisType?: "category" | "time" | "value";
  // Domain
  yDomain?: [number, number];
  // Animation
  enableAnimation?: boolean;
  // Colors
  colors?: string[];
  // Formatters
  formatTooltip?: (params: unknown) => string;
  formatXAxisTick?: (value: string | number) => string;
  formatYAxisTick?: (value: number) => string;
  // Events
  onPointClick?: (data: AreaChartData) => void;
  onPointHover?: (data: AreaChartData | null) => void;
  // Accessibility
  ariaLabel?: string;
  className?: string;
}

/**
 * ECharts-based Area Chart component
 */
export function AreaChartECharts({
  data,
  width = "100%",
  height = "100%",
  xAxisLabel,
  yAxisLabel,
  showDots = false,
  smooth = true,
  stacked = false,
  areaOpacity = 0.6,
  xAxisType = "category",
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
}: AreaChartEChartsProps) {
  const { xAxisData, series, legendData } = useMemo(() => {
    const xSet = new Set<string | number>();
    const segmentSet = new Set<string>();

    data.forEach((d) => {
      const xVal = d.x instanceof Date ? d.x.getTime() : d.x;
      xSet.add(xVal);
      if (d.segment) {
        segmentSet.add(d.segment);
      }
    });

    const xValues = Array.from(xSet).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a - b;
      }
      return String(a).localeCompare(String(b));
    });

    const segments = Array.from(segmentSet);

    if (segments.length === 0) {
      const sortedData = [...data].sort((a, b) => {
        const aX = a.x instanceof Date ? a.x.getTime() : a.x;
        const bX = b.x instanceof Date ? b.x.getTime() : b.x;
        if (typeof aX === "number" && typeof bX === "number") {
          return aX - bX;
        }
        return String(aX).localeCompare(String(bX));
      });

      const seriesData = sortedData.map((d) => ({
        value: [d.x instanceof Date ? d.x.getTime() : d.x, d.y],
        itemStyle: d.color ? { color: d.color } : undefined,
        _original: d,
      }));

      const series: LineSeriesOption[] = [
        {
          type: "line",
          data: seriesData,
          smooth,
          showSymbol: showDots,
          symbolSize: 6,
          areaStyle: { opacity: areaOpacity },
          stack: stacked ? "total" : undefined,
          emphasis: { focus: "series" },
        },
      ];

      return { xAxisData: xValues, series, legendData: [] };
    }

    const series: LineSeriesOption[] = segments.map((segment, idx) => {
      const segmentData = data
        .filter((d) => d.segment === segment)
        .sort((a, b) => {
          const aX = a.x instanceof Date ? a.x.getTime() : a.x;
          const bX = b.x instanceof Date ? b.x.getTime() : b.x;
          if (typeof aX === "number" && typeof bX === "number") {
            return aX - bX;
          }
          return String(aX).localeCompare(String(bX));
        })
        .map((d) => ({
          value: [d.x instanceof Date ? d.x.getTime() : d.x, d.y],
          itemStyle: d.color ? { color: d.color } : undefined,
          _original: d,
        }));

      return {
        name: segment,
        type: "line",
        data: segmentData,
        smooth,
        showSymbol: showDots,
        symbolSize: 6,
        color: colors[idx % colors.length],
        areaStyle: { opacity: areaOpacity },
        stack: stacked ? "total" : undefined,
        emphasis: { focus: "series" },
      };
    });

    return { xAxisData: xValues, series, legendData: segments };
  }, [data, smooth, showDots, areaOpacity, stacked, colors]);

  const option: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        formatter: formatTooltip,
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
        type: xAxisType,
        data: xAxisType === "category" ? xAxisData : undefined,
        name: xAxisLabel,
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: { formatter: formatXAxisTick },
        boundaryGap: false,
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
    xAxisData,
    series,
    legendData,
    xAxisLabel,
    yAxisLabel,
    xAxisType,
    yDomain,
    formatTooltip,
    formatXAxisTick,
    formatYAxisTick,
  ]);

  const events = useMemo(() => {
    const handlers: Record<string, (params: unknown) => void> = {};

    if (onPointClick) {
      handlers.click = (params: unknown) => {
        const p = params as { data?: { _original?: AreaChartData } };
        if (p.data?._original) {
          onPointClick(p.data._original);
        }
      };
    }

    if (onPointHover) {
      handlers.mouseover = (params: unknown) => {
        const p = params as { data?: { _original?: AreaChartData } };
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
