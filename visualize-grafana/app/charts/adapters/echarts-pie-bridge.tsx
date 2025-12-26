/**
 * ECharts Pie Chart Bridge
 *
 * Bridges the existing PieState (D3-based) to ECharts rendering.
 * Supports pie, donut charts, labels, and interactive legends.
 */

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption, PieSeriesOption } from "echarts";

import { PieState } from "@/charts/pie/pie-state";
import { useChartState } from "@/charts/shared/chart-state";
import { useChartTheme } from "@/charts/shared/use-chart-theme";
import { useTransitionStore } from "@/stores/transition";

export const EChartsPie: React.FC = () => {
  const state = useChartState() as PieState;
  const {
    chartData,
    bounds,
    getSegment,
    getSegmentLabel,
    getY,
    colors,
    showPercentages,
  } = state;

  const { margins, chartWidth, chartHeight } = bounds;
  const { labelFontSize, fontFamily } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  // Calculate center and radius
  const center = useMemo(() => {
    return [
      margins.left + chartWidth / 2,
      margins.top + chartHeight / 2,
    ];
  }, [margins, chartWidth, chartHeight]);

  const radius = useMemo(() => {
    const minDimension = Math.min(chartWidth, chartHeight);
    // Leave room for labels
    return Math.max(minDimension * 0.35, 50);
  }, [chartWidth, chartHeight]);

  // Prepare pie data
  const pieData = useMemo(() => {
    return chartData.map((d) => {
      const segment = getSegment(d);
      const value = getY(d) ?? 0;
      const label = getSegmentLabel(segment);
      const color = colors(segment);

      return {
        name: label,
        value,
        itemStyle: { color },
        observation: d,
      };
    });
  }, [chartData, getSegment, getY, getSegmentLabel, colors]);

  // Calculate total for percentages
  const total = useMemo(() => {
    return pieData.reduce((sum, d) => sum + d.value, 0);
  }, [pieData]);

  // Build ECharts option
  const option: EChartsOption = useMemo(() => {
    const series: PieSeriesOption = {
      type: "pie",
      radius: [0, radius],
      center,
      data: pieData.map((d) => ({
        name: d.name,
        value: d.value,
        itemStyle: d.itemStyle,
      })),
      label: {
        show: true,
        position: "outside",
        fontFamily,
        fontSize: labelFontSize,
        formatter: showPercentages
          ? (params: any) => {
              const percent = ((params.value / total) * 100).toFixed(1);
              return `${params.name}\n${percent}%`;
            }
          : "{b}",
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
      },
      emphasis: {
        focus: "self",
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.3)",
        },
        label: {
          show: true,
          fontWeight: "bold",
        },
      },
      animationType: "scale",
      animationEasing: "elasticOut",
      animationDuration: enableTransition ? transitionDuration : 0,
    };

    return {
      textStyle: {
        fontFamily,
      },
      animation: enableTransition,
      animationDuration: transitionDuration,
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const percent = ((params.value / total) * 100).toFixed(1);
          return `${params.name}: ${params.value} (${percent}%)`;
        },
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        textStyle: {
          fontFamily,
          fontSize: labelFontSize,
        },
      },
      series: [series],
    };
  }, [
    pieData,
    radius,
    center,
    total,
    showPercentages,
    enableTransition,
    transitionDuration,
    fontFamily,
    labelFontSize,
  ]);

  // Event handlers
  const onEvents = useMemo(() => {
    return {
      click: (params: any) => {
        const observation = pieData[params.dataIndex]?.observation;
        if (observation) {
          console.log("Pie slice clicked:", observation);
        }
      },
    };
  }, [pieData]);

  return (
    <ReactECharts
      option={option}
      style={{
        width: bounds.width,
        height: bounds.height,
        position: "absolute",
        top: 0,
        left: 0,
      }}
      onEvents={onEvents}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

/**
 * ECharts Donut Chart Bridge
 *
 * Same as pie but with inner radius for donut effect
 */
export const EChartsDonut: React.FC<{ innerRadiusRatio?: number }> = ({
  innerRadiusRatio = 0.5,
}) => {
  const state = useChartState() as PieState;
  const {
    chartData,
    bounds,
    getSegment,
    getSegmentLabel,
    getY,
    colors,
    showPercentages,
  } = state;

  const { margins, chartWidth, chartHeight } = bounds;
  const { labelFontSize, fontFamily } = useChartTheme();
  const enableTransition = useTransitionStore((s) => s.enable);
  const transitionDuration = useTransitionStore((s) => s.duration);

  const center = useMemo(() => {
    return [
      margins.left + chartWidth / 2,
      margins.top + chartHeight / 2,
    ];
  }, [margins, chartWidth, chartHeight]);

  const radius = useMemo(() => {
    const minDimension = Math.min(chartWidth, chartHeight);
    const outerRadius = Math.max(minDimension * 0.35, 50);
    const innerRadius = outerRadius * innerRadiusRatio;
    return [innerRadius, outerRadius];
  }, [chartWidth, chartHeight, innerRadiusRatio]);

  const pieData = useMemo(() => {
    return chartData.map((d) => {
      const segment = getSegment(d);
      const value = getY(d) ?? 0;
      const label = getSegmentLabel(segment);
      const color = colors(segment);

      return {
        name: label,
        value,
        itemStyle: { color },
        observation: d,
      };
    });
  }, [chartData, getSegment, getY, getSegmentLabel, colors]);

  const total = useMemo(() => {
    return pieData.reduce((sum, d) => sum + d.value, 0);
  }, [pieData]);

  const option: EChartsOption = useMemo(() => {
    return {
      textStyle: { fontFamily },
      animation: enableTransition,
      animationDuration: transitionDuration,
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const percent = ((params.value / total) * 100).toFixed(1);
          return `${params.name}: ${params.value} (${percent}%)`;
        },
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        textStyle: { fontFamily, fontSize: labelFontSize },
      },
      series: [
        {
          type: "pie",
          radius,
          center,
          data: pieData.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: d.itemStyle,
          })),
          label: {
            show: true,
            position: "outside",
            fontFamily,
            fontSize: labelFontSize,
            formatter: showPercentages
              ? (params: any) => `${params.name}\n${((params.value / total) * 100).toFixed(1)}%`
              : "{b}",
          },
          emphasis: {
            focus: "self",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDuration: enableTransition ? transitionDuration : 0,
        },
      ],
    };
  }, [
    pieData,
    radius,
    center,
    total,
    showPercentages,
    enableTransition,
    transitionDuration,
    fontFamily,
    labelFontSize,
  ]);

  return (
    <ReactECharts
      option={option}
      style={{
        width: bounds.width,
        height: bounds.height,
        position: "absolute",
        top: 0,
        left: 0,
      }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default EChartsPie;
