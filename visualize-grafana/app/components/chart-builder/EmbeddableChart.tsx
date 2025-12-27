/**
 * EmbeddableChart - Minimal chart rendering component for embeds
 *
 * This component renders a chart with minimal overhead for embedding in iframes.
 * Uses Swiss Federal CI design tokens for consistent styling.
 */

import { useMemo, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { c as colors } from "@interactivethings/swiss-federal-ci";
import type { EmbedPayload, EmbedOptions } from "@/utils/chart-config-encoder";

// Dynamically import ECharts to avoid SSR issues
const ReactECharts = dynamic(
  () => import("echarts-for-react").then((mod) => mod.default),
  { ssr: false }
);

// Color palettes matching chart-builder
const COLOR_PALETTES: Record<string, string[]> = {
  swiss: ["#DC0018", "#2D6B9F", "#66B573", "#F9B21A", "#8E6A9E", "#00A5AC", "#E06336", "#7B7B7B"],
  federal: ["#1D4ED8", "#047857", "#B45309", "#7C3AED", "#BE185D", "#0369A1", "#15803D", "#A16207"],
  blue: ["#1565C0", "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9", "#BBDEFB"],
  warm: ["#DC2626", "#EA580C", "#D97706", "#CA8A04", "#65A30D", "#16A34A", "#059669", "#0D9488"],
  cool: ["#2563EB", "#4F46E5", "#7C3AED", "#9333EA", "#C026D3", "#DB2777", "#E11D48", "#F43F5E"],
  monochrome: ["#111827", "#374151", "#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6"],
};

interface EmbeddableChartProps {
  payload: EmbedPayload;
  options?: EmbedOptions;
}

export function EmbeddableChart({ payload, options = {} }: EmbeddableChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const { chart, dataset, filters, customPalettes } = payload;

  // Combine built-in and custom palettes
  const allPalettes = useMemo(
    () => ({ ...COLOR_PALETTES, ...customPalettes }),
    [customPalettes]
  );

  // Filter observations based on active filters
  const filteredObservations = useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) {
      return dataset.observations;
    }

    return dataset.observations.filter((obs) => {
      for (const [field, values] of Object.entries(filters)) {
        if (values.length > 0 && !values.includes(String(obs[field]))) {
          return false;
        }
      }
      return true;
    });
  }, [dataset.observations, filters]);

  // Build ECharts option
  const echartOption = useMemo(() => {
    const paletteColors = allPalettes[chart.colorPalette] || allPalettes.swiss;
    const showLegend = options.hideLegend ? false : chart.showLegend;
    const showTitle = options.hideTitle ? false : Boolean(chart.title);

    // Get unique x values and groups
    const xValues = [...new Set(filteredObservations.map((o) => String(o[chart.xField] ?? "")))];
    const groups = chart.groupField
      ? [...new Set(filteredObservations.map((o) => String(o[chart.groupField] ?? "")))]
      : ["value"];

    // Prepare series data
    const series: any[] = [];

    if (chart.chartType === "pie") {
      // Pie chart: aggregate by x field
      const pieData = xValues.map((x) => {
        const sum = filteredObservations
          .filter((o) => String(o[chart.xField]) === x)
          .reduce((acc, o) => acc + (Number(o[chart.yField]) || 0), 0);
        return { name: x, value: sum };
      });

      series.push({
        type: "pie",
        radius: ["30%", "70%"],
        center: ["50%", "55%"],
        data: pieData,
        label: { show: true, formatter: "{b}: {d}%" },
        emphasis: { label: { show: true, fontWeight: "bold" } },
      });
    } else if (chart.chartType === "scatter") {
      // Scatter plot
      groups.forEach((group, idx) => {
        const data = filteredObservations
          .filter((o) => !chart.groupField || String(o[chart.groupField]) === group)
          .map((o) => [o[chart.xField], o[chart.yField]]);

        series.push({
          name: group,
          type: "scatter",
          data,
          symbolSize: 8,
          itemStyle: { color: paletteColors[idx % paletteColors.length] },
        });
      });
    } else {
      // Bar, line, area, column charts
      groups.forEach((group, idx) => {
        const data = xValues.map((x) => {
          const obs = filteredObservations.find(
            (o) =>
              String(o[chart.xField]) === x &&
              (!chart.groupField || String(o[chart.groupField]) === group)
          );
          return obs ? Number(obs[chart.yField]) || 0 : 0;
        });

        const seriesType = chart.chartType === "column" ? "bar" : chart.chartType === "area" ? "line" : chart.chartType;

        series.push({
          name: group,
          type: seriesType,
          data,
          itemStyle: { color: paletteColors[idx % paletteColors.length] },
          areaStyle: chart.chartType === "area" ? { opacity: 0.3 } : undefined,
          smooth: chart.chartType === "line" || chart.chartType === "area",
        });
      });
    }

    // Build the full option
    const option: any = {
      color: paletteColors,
      backgroundColor: "transparent",
      tooltip: chart.showTooltip
        ? {
            trigger: chart.chartType === "pie" ? "item" : "axis",
            backgroundColor: "rgba(255,255,255,0.95)",
            borderColor: colors.monochrome[200],
            borderWidth: 1,
            textStyle: { color: colors.monochrome[800], fontSize: 12 },
          }
        : undefined,
      legend: showLegend
        ? {
            show: true,
            bottom: 0,
            type: "scroll",
            textStyle: { color: colors.monochrome[700], fontSize: 11 },
          }
        : undefined,
      grid:
        chart.chartType !== "pie"
          ? {
              left: "3%",
              right: "4%",
              bottom: showLegend ? "15%" : "10%",
              top: showTitle ? "15%" : "10%",
              containLabel: true,
            }
          : undefined,
      xAxis:
        chart.chartType !== "pie" && chart.chartType !== "scatter"
          ? {
              type: chart.chartType === "bar" ? "value" : "category",
              data: chart.chartType !== "bar" ? xValues : undefined,
              axisLabel: { color: colors.monochrome[600], fontSize: 11, rotate: xValues.length > 10 ? 45 : 0 },
              axisLine: { lineStyle: { color: colors.monochrome[300] } },
            }
          : chart.chartType === "scatter"
          ? {
              type: "value",
              axisLabel: { color: colors.monochrome[600], fontSize: 11 },
              axisLine: { lineStyle: { color: colors.monochrome[300] } },
            }
          : undefined,
      yAxis:
        chart.chartType !== "pie"
          ? {
              type: chart.chartType === "bar" ? "category" : "value",
              data: chart.chartType === "bar" ? xValues : undefined,
              axisLabel: { color: colors.monochrome[600], fontSize: 11 },
              axisLine: { lineStyle: { color: colors.monochrome[300] } },
              splitLine: { lineStyle: { color: colors.monochrome[100] } },
            }
          : undefined,
      series,
    };

    // Add title if not hidden
    if (showTitle) {
      option.title = {
        text: chart.title,
        left: "center",
        top: 10,
        textStyle: {
          color: colors.monochrome[900],
          fontSize: 16,
          fontWeight: 600,
          fontFamily: "'Frutiger Neue', Arial, sans-serif",
        },
      };
    }

    return option;
  }, [chart, filteredObservations, allPalettes, options]);

  // Resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Notify parent about size changes (for iframe-resizer)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).parentIFrame) {
      (window as any).parentIFrame.size();
    }
  }, [dimensions, echartOption]);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: options.height || chart.height || 400,
    padding: options.optimizeSpace ? 0 : 16,
    backgroundColor: options.removeBorder ? "transparent" : "#fff",
    borderRadius: options.removeBorder ? 0 : 8,
    boxShadow: options.removeBorder ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
    fontFamily: "'Frutiger Neue', Arial, sans-serif",
  };

  return (
    <div ref={containerRef} style={containerStyle} data-iframe-height>
      <ReactECharts
        option={echartOption}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}

export default EmbeddableChart;
