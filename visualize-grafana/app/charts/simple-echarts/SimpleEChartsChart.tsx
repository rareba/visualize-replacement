/**
 * SimpleEChartsChart - A standalone ECharts component that bypasses
 * the complex D3 state management system.
 *
 * This component directly transforms observation data into ECharts options,
 * providing a working chart without the complexity of the D3 bridge approach.
 */

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

import { Observation } from "@/domain/data";
import {
  SWISS_FEDERAL_CHART_COLORS,
  CHART_THEME,
} from "@/charts/shared/echarts-theme";

export type SimpleChartType =
  | "column"
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "scatter";

export interface SimpleEChartsChartProps {
  /** Raw observation data from SPARQL */
  observations: Observation[];
  /** Component ID for the x-axis (category/dimension) */
  xField: string;
  /** Component ID for the y-axis (measure/value) */
  yField: string;
  /** Optional field for segmentation/grouping */
  segmentField?: string;
  /** Chart type */
  chartType: SimpleChartType;
  /** Chart width */
  width?: number | string;
  /** Chart height */
  height?: number | string;
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Title */
  title?: string;
  /** Color palette */
  colors?: string[];
  /** Show legend */
  showLegend?: boolean;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

// Use Swiss Federal color palette from shared theme
const DEFAULT_COLORS = SWISS_FEDERAL_CHART_COLORS;

/**
 * Extract year from a string value (handles "Year 2020", "2020", "2020-01-01", etc.)
 */
function extractYear(value: string): number | null {
  const match = value.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format a value for display (extract readable part from URIs, dates, etc.)
 */
function formatLabel(value: string): string {
  // Handle URIs - extract the last meaningful part
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const parts = value.split("/");
    const lastPart = parts[parts.length - 1];
    // If the last part is a year, return it
    if (/^\d{4}$/.test(lastPart)) {
      return lastPart;
    }
    // Otherwise return the last segment decoded
    return decodeURIComponent(lastPart);
  }
  // Handle "Year 2020" format
  const yearMatch = value.match(/^Year\s+(\d{4})$/i);
  if (yearMatch) {
    return yearMatch[1];
  }
  // Return as-is for other values
  return value;
}

/**
 * Smart sort function that handles dates/years chronologically
 */
function smartSort(values: string[]): string[] {
  // Check if values look like dates/years
  const withYears = values.map((v) => ({ value: v, year: extractYear(v) }));
  const allHaveYears = withYears.every((w) => w.year !== null);

  if (allHaveYears) {
    // Sort chronologically by year
    return withYears
      .sort((a, b) => (a.year || 0) - (b.year || 0))
      .map((w) => w.value);
  }

  // Try numeric sort
  const asNumbers = values.map((v) => ({ value: v, num: parseFloat(v) }));
  const allNumeric = asNumbers.every((n) => !isNaN(n.num));

  if (allNumeric) {
    return asNumbers.sort((a, b) => a.num - b.num).map((n) => n.value);
  }

  // Fall back to alphabetical sort
  return [...values].sort((a, b) => a.localeCompare(b));
}

/**
 * Extract unique values for a field from observations (sorted intelligently)
 */
function getUniqueValues(observations: Observation[], field: string): string[] {
  const uniqueSet = new Set<string>();
  observations.forEach((obs) => {
    const value = obs[field];
    if (value !== null && value !== undefined) {
      uniqueSet.add(String(value));
    }
  });
  return smartSort(Array.from(uniqueSet));
}

/**
 * Group observations by segment field
 */
function groupBySegment(
  observations: Observation[],
  segmentField: string
): Map<string, Observation[]> {
  const groups = new Map<string, Observation[]>();
  observations.forEach((obs) => {
    const segment = String(obs[segmentField] ?? "default");
    if (!groups.has(segment)) {
      groups.set(segment, []);
    }
    groups.get(segment)!.push(obs);
  });
  return groups;
}

/**
 * Build ECharts option for column/bar charts
 */
function buildBarOption(
  props: SimpleEChartsChartProps,
  isHorizontal: boolean
): EChartsOption {
  const {
    observations,
    xField,
    yField,
    segmentField,
    xAxisLabel,
    yAxisLabel,
    title,
    colors = DEFAULT_COLORS,
    showLegend = true,
    showTooltip = true,
    animationDuration = 500,
  } = props;

  const categories = getUniqueValues(observations, xField);

  let series: EChartsOption["series"];

  if (segmentField) {
    // Grouped/stacked bars
    const segments = getUniqueValues(observations, segmentField);
    const groups = groupBySegment(observations, segmentField);

    series = segments.map((segment, idx) => {
      const segmentData = groups.get(segment) || [];
      const data = categories.map((cat) => {
        const obs = segmentData.find((o) => String(o[xField]) === cat);
        return obs ? Number(obs[yField]) || 0 : 0;
      });

      return {
        name: segment,
        type: "bar" as const,
        data,
        itemStyle: { color: colors[idx % colors.length] },
      };
    });
  } else {
    // Simple bars
    const data = categories.map((cat) => {
      const obs = observations.find((o) => String(o[xField]) === cat);
      return obs ? Number(obs[yField]) || 0 : 0;
    });

    series = [
      {
        type: "bar" as const,
        data,
        itemStyle: { color: colors[0] },
      },
    ];
  }

  // Format categories for display (e.g., extract year from URIs)
  const formattedCategories = categories.map(formatLabel);

  const categoryAxis = {
    type: "category" as const,
    data: formattedCategories,
    name: xAxisLabel,
    nameLocation: "middle" as const,
    nameGap: 30,
    axisLabel: {
      rotate: categories.length > 10 ? 45 : 0,
      interval: 0,
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.axisLabelFontSize,
      color: CHART_THEME.textColor,
    },
    axisLine: {
      lineStyle: { color: CHART_THEME.axisLineColor },
    },
    nameTextStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.axisLabelFontSize,
    },
  };

  const valueAxis = {
    type: "value" as const,
    name: yAxisLabel,
    nameLocation: "middle" as const,
    nameGap: 50,
    axisLabel: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.axisLabelFontSize,
      color: CHART_THEME.textColor,
    },
    axisLine: {
      show: true,
      lineStyle: { color: CHART_THEME.axisLineColor },
    },
    splitLine: {
      lineStyle: { color: CHART_THEME.gridLineColor },
    },
    nameTextStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.axisLabelFontSize,
    },
  };

  return {
    textStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.fontSize,
      color: CHART_THEME.textColor,
    },
    title: title ? { text: title, left: "center", textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.titleFontSize } } : undefined,
    tooltip: showTooltip
      ? {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: CHART_THEME.tooltipBackgroundColor,
          textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize },
        }
      : undefined,
    legend: showLegend && segmentField ? { top: 30, textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.legendFontSize } } : undefined,
    grid: {
      left: CHART_THEME.gridLeft,
      right: CHART_THEME.gridRight,
      top: title ? CHART_THEME.gridTop : 40,
      bottom: CHART_THEME.gridBottom,
      containLabel: true,
    },
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series,
    animationDuration,
    animationEasing: CHART_THEME.animationEasing,
  };
}

/**
 * Build ECharts option for line/area charts
 */
function buildLineOption(
  props: SimpleEChartsChartProps,
  isArea: boolean
): EChartsOption {
  const {
    observations,
    xField,
    yField,
    segmentField,
    xAxisLabel,
    yAxisLabel,
    title,
    colors = DEFAULT_COLORS,
    showLegend = true,
    showTooltip = true,
    animationDuration = 500,
  } = props;

  const categories = getUniqueValues(observations, xField);

  let series: EChartsOption["series"];

  if (segmentField) {
    const segments = getUniqueValues(observations, segmentField);
    const groups = groupBySegment(observations, segmentField);

    series = segments.map((segment, idx) => {
      const segmentData = groups.get(segment) || [];
      const data = categories.map((cat) => {
        const obs = segmentData.find((o) => String(o[xField]) === cat);
        return obs ? Number(obs[yField]) || 0 : 0;
      });

      return {
        name: segment,
        type: "line" as const,
        data,
        smooth: true,
        areaStyle: isArea ? { opacity: 0.3 } : undefined,
        itemStyle: { color: colors[idx % colors.length] },
        lineStyle: { color: colors[idx % colors.length] },
      };
    });
  } else {
    const data = categories.map((cat) => {
      const obs = observations.find((o) => String(o[xField]) === cat);
      return obs ? Number(obs[yField]) || 0 : 0;
    });

    series = [
      {
        type: "line" as const,
        data,
        smooth: true,
        areaStyle: isArea ? { opacity: 0.3 } : undefined,
        itemStyle: { color: colors[0] },
        lineStyle: { color: colors[0] },
      },
    ];
  }

  // Format categories for display (e.g., extract year from URIs)
  const formattedCategories = categories.map(formatLabel);

  return {
    textStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.fontSize,
      color: CHART_THEME.textColor,
    },
    title: title ? { text: title, left: "center", textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.titleFontSize } } : undefined,
    tooltip: showTooltip
      ? {
          trigger: "axis",
          backgroundColor: CHART_THEME.tooltipBackgroundColor,
          textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize },
        }
      : undefined,
    legend: showLegend && segmentField ? { top: 30, textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.legendFontSize } } : undefined,
    grid: {
      left: CHART_THEME.gridLeft,
      right: CHART_THEME.gridRight,
      top: title ? CHART_THEME.gridTop : 40,
      bottom: CHART_THEME.gridBottom,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: formattedCategories,
      name: xAxisLabel,
      nameLocation: "middle",
      nameGap: 30,
      boundaryGap: false,
      axisLabel: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
        color: CHART_THEME.textColor,
      },
      axisLine: {
        lineStyle: { color: CHART_THEME.axisLineColor },
      },
      nameTextStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
      },
    },
    yAxis: {
      type: "value",
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
        color: CHART_THEME.textColor,
      },
      axisLine: {
        show: true,
        lineStyle: { color: CHART_THEME.axisLineColor },
      },
      splitLine: {
        lineStyle: { color: CHART_THEME.gridLineColor },
      },
      nameTextStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
      },
    },
    series,
    animationDuration,
    animationEasing: CHART_THEME.animationEasing,
  };
}

/**
 * Build ECharts option for pie charts
 */
function buildPieOption(props: SimpleEChartsChartProps): EChartsOption {
  const {
    observations,
    xField,
    yField,
    title,
    colors = DEFAULT_COLORS,
    showLegend = true,
    showTooltip = true,
    animationDuration = 500,
  } = props;

  // Aggregate data by x field
  const aggregated = new Map<string, number>();
  observations.forEach((obs) => {
    const key = String(obs[xField] ?? "Unknown");
    const value = Number(obs[yField]) || 0;
    aggregated.set(key, (aggregated.get(key) || 0) + value);
  });

  const data = Array.from(aggregated.entries()).map(([name, value], idx) => ({
    name,
    value,
    itemStyle: { color: colors[idx % colors.length] },
  }));

  return {
    textStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.fontSize,
      color: CHART_THEME.textColor,
    },
    title: title ? { text: title, left: "center", textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.titleFontSize } } : undefined,
    tooltip: showTooltip
      ? {
          trigger: "item",
          formatter: "{b}: {c} ({d}%)",
          backgroundColor: CHART_THEME.tooltipBackgroundColor,
          textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize },
        }
      : undefined,
    legend: showLegend
      ? {
          orient: "vertical",
          left: "left",
          top: "middle",
          textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.legendFontSize },
        }
      : undefined,
    series: [
      {
        type: "pie",
        radius: ["30%", "70%"],
        center: ["50%", "55%"],
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        label: {
          show: true,
          formatter: "{b}: {d}%",
          fontFamily: CHART_THEME.fontFamily,
          fontSize: CHART_THEME.fontSize,
        },
      },
    ],
    animationDuration,
    animationEasing: CHART_THEME.animationEasing,
  };
}

/**
 * Build ECharts option for scatter charts
 */
function buildScatterOption(props: SimpleEChartsChartProps): EChartsOption {
  const {
    observations,
    xField,
    yField,
    segmentField,
    xAxisLabel,
    yAxisLabel,
    title,
    colors = DEFAULT_COLORS,
    showLegend = true,
    showTooltip = true,
    animationDuration = 500,
  } = props;

  let series: EChartsOption["series"];

  if (segmentField) {
    const segments = getUniqueValues(observations, segmentField);
    const groups = groupBySegment(observations, segmentField);

    series = segments.map((segment, idx) => {
      const segmentData = groups.get(segment) || [];
      const data = segmentData.map((obs) => [
        Number(obs[xField]) || 0,
        Number(obs[yField]) || 0,
      ]);

      return {
        name: segment,
        type: "scatter" as const,
        data,
        itemStyle: { color: colors[idx % colors.length] },
        symbolSize: 10,
      };
    });
  } else {
    const data = observations.map((obs) => [
      Number(obs[xField]) || 0,
      Number(obs[yField]) || 0,
    ]);

    series = [
      {
        type: "scatter" as const,
        data,
        itemStyle: { color: colors[0] },
        symbolSize: 10,
      },
    ];
  }

  return {
    textStyle: {
      fontFamily: CHART_THEME.fontFamily,
      fontSize: CHART_THEME.fontSize,
      color: CHART_THEME.textColor,
    },
    title: title ? { text: title, left: "center", textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.titleFontSize } } : undefined,
    tooltip: showTooltip
      ? {
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { value: [number, number] };
            return `${xAxisLabel || "X"}: ${p.value[0]}<br/>${yAxisLabel || "Y"}: ${p.value[1]}`;
          },
          backgroundColor: CHART_THEME.tooltipBackgroundColor,
          textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize },
        }
      : undefined,
    legend: showLegend && segmentField ? { top: 30, textStyle: { fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.legendFontSize } } : undefined,
    grid: {
      left: CHART_THEME.gridLeft,
      right: CHART_THEME.gridRight,
      top: title ? CHART_THEME.gridTop : 40,
      bottom: CHART_THEME.gridBottom,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: xAxisLabel,
      nameLocation: "middle",
      nameGap: 30,
      axisLabel: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
        color: CHART_THEME.textColor,
      },
      axisLine: {
        lineStyle: { color: CHART_THEME.axisLineColor },
      },
      nameTextStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
      },
      splitLine: {
        lineStyle: { color: CHART_THEME.gridLineColor },
      },
    },
    yAxis: {
      type: "value",
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
        color: CHART_THEME.textColor,
      },
      axisLine: {
        show: true,
        lineStyle: { color: CHART_THEME.axisLineColor },
      },
      splitLine: {
        lineStyle: { color: CHART_THEME.gridLineColor },
      },
      nameTextStyle: {
        fontFamily: CHART_THEME.fontFamily,
        fontSize: CHART_THEME.axisLabelFontSize,
      },
    },
    series,
    animationDuration,
    animationEasing: CHART_THEME.animationEasing,
  };
}

/**
 * Main component - builds ECharts option based on chart type
 */
export const SimpleEChartsChart: React.FC<SimpleEChartsChartProps> = (
  props
) => {
  const { chartType, width = "100%", height = 400 } = props;

  const option = useMemo<EChartsOption>(() => {
    switch (chartType) {
      case "column":
        return buildBarOption(props, false);
      case "bar":
        return buildBarOption(props, true);
      case "line":
        return buildLineOption(props, false);
      case "area":
        return buildLineOption(props, true);
      case "pie":
        return buildPieOption(props);
      case "scatter":
        return buildScatterOption(props);
      default:
        return buildBarOption(props, false);
    }
  }, [props, chartType]);

  if (!props.observations || props.observations.length === 0) {
    return (
      <div
        style={{
          width,
          height: typeof height === "number" ? height : 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          color: "#666",
          fontSize: 14,
        }}
      >
        No data available
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ width, height }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default SimpleEChartsChart;
