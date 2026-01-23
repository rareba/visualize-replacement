/**
 * Combo Line Column Chart Adapter
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * This adapter renders a combination of bar and line charts with dual Y axes.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createXCategoryAxis,
  createLegend,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import {
  createCategoryComboTooltipFormatter,
  createComboGrid,
  createCrossTooltip,
  createDualYAxis,
} from "@/charts/echarts/dual-axis-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { createBarSeries, createLineSeries } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { ComboLineColumnState } from "@/charts/combo/combo-line-column-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

/**
 * Combo Line Column Chart adapter - combines bar and line series with dual Y axes
 */
export const ComboLineColumnChartAdapter = () => {
  const state = useChartState() as ComboLineColumnState;
  const {
    chartData,
    xScale,
    yOrientationScales,
    getXAsDate,
    formatXDate,
    y,
    colors,
    bounds,
    xAxisLabel,
    maxRightTickWidth,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);

    // Get X-axis categories from the scale domain
    const categories = xScale.domain();

    // Determine which Y config is line and which is column
    const yLeft = y.left;
    const yRight = y.right;
    const leftIsLine = yLeft.chartType === "line";
    const yLine = leftIsLine ? yLeft : yRight;
    const yColumn = leftIsLine ? yRight : yLeft;

    // Get axis indices for each series type
    const lineAxisIndex = leftIsLine ? 0 : 1;
    const columnAxisIndex = leftIsLine ? 1 : 0;

    // Build column series data
    const columnData = categories.map((category) => {
      const observation = chartData.find(
        (d) => formatXDate(getXAsDate(d)) === category
      );
      if (!observation) return null;
      return yColumn.getY(observation);
    });

    // Build line series data
    const lineData = categories.map((category) => {
      const observation = chartData.find(
        (d) => formatXDate(getXAsDate(d)) === category
      );
      if (!observation) return null;
      return yLine.getY(observation);
    });

    // Create dual Y-axis
    const [leftAxis, rightAxis] = createDualYAxis({
      left: {
        name: yLeft.label,
        min: yOrientationScales.left.domain()[0],
        max: yOrientationScales.left.domain()[1],
      },
      right: {
        name: yRight.label,
        min: yOrientationScales.right.domain()[0],
        max: yOrientationScales.right.domain()[1],
      },
    });

    const animation = getDefaultAnimation();

    return {
      ...getSwissFederalTheme(),
      grid: createComboGrid({
        ...safeBounds.margins,
        extraRight: maxRightTickWidth,
      }),
      tooltip: {
        ...createCrossTooltip(),
        formatter: createCategoryComboTooltipFormatter(categories),
      },
      legend: createLegend(),
      xAxis: {
        ...createXCategoryAxis({
          categories,
          name: xAxisLabel,
          nameGap: 35,
        }),
        axisPointer: {
          type: "shadow",
        },
      },
      yAxis: [leftAxis, rightAxis],
      series: [
        {
          ...createBarSeries({
            name: yColumn.label,
            data: columnData,
            color: colors(yColumn.id),
            barMaxWidth: xScale.bandwidth(),
            yAxisIndex: columnAxisIndex,
          }),
        },
        {
          ...createLineSeries({
            name: yLine.label,
            data: lineData,
            color: colors(yLine.id),
            yAxisIndex: lineAxisIndex,
            symbolSize: 8,
            lineWidth: 3,
          }),
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
        },
      ],
    };
  }, [
    chartData,
    xScale,
    yOrientationScales,
    getXAsDate,
    formatXDate,
    y,
    colors,
    bounds,
    xAxisLabel,
    maxRightTickWidth,
  ]);

  const dimensions = calculateChartDimensions(bounds);

  return (
    <EChartsWrapper
      option={option}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};
