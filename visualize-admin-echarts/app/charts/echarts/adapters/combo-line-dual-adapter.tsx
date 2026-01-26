/**
 * Combo Line Dual Chart Adapter (LEGACY)
 *
 * @deprecated Use `comboLineDualUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/combo-line-dual-universal-adapter.ts for the recommended approach.
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * This adapter renders two line series with dual Y axes.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createLegend,
  getDefaultAnimation,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import {
  createComboGrid,
  createCrossTooltip,
  createDualYAxis,
  createTimeAxis,
  createTimeComboTooltipFormatter,
} from "@/charts/echarts/dual-axis-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { createLineSeries } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { ComboLineDualState } from "@/charts/combo/combo-line-dual-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption } from "echarts";

/**
 * Combo Line Dual Chart adapter - two lines with dual Y axes
 */
export const ComboLineDualChartAdapter = () => {
  const state = useChartState() as ComboLineDualState;
  const {
    chartData,
    xScale,
    yOrientationScales,
    getX,
    y,
    colors,
    bounds,
    xAxisLabel,
    maxRightTickWidth,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);

    // Get Y configurations
    const yLeft = y.left;
    const yRight = y.right;

    // Sort data by date for line charts
    const sortedData = [...chartData].sort((a, b) => {
      const dateA = getX(a);
      const dateB = getX(b);
      return dateA.getTime() - dateB.getTime();
    });

    // Build time series data for both lines
    const leftLineData: Array<[number, number | null]> = sortedData.map((d) => [
      getX(d).getTime(),
      yLeft.getY(d),
    ]);

    const rightLineData: Array<[number, number | null]> = sortedData.map((d) => [
      getX(d).getTime(),
      yRight.getY(d),
    ]);

    // Create dual Y-axis with colored axis lines
    const [leftAxis, rightAxis] = createDualYAxis({
      left: {
        name: yLeft.label,
        min: yOrientationScales.left.domain()[0],
        max: yOrientationScales.left.domain()[1],
        color: colors(yLeft.id),
      },
      right: {
        name: yRight.label,
        min: yOrientationScales.right.domain()[0],
        max: yOrientationScales.right.domain()[1],
        color: colors(yRight.id),
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
        formatter: createTimeComboTooltipFormatter(),
      },
      legend: createLegend(),
      xAxis: createTimeAxis({
        name: xAxisLabel,
        nameGap: 35,
        min: xScale.domain()[0].getTime(),
        max: xScale.domain()[1].getTime(),
      }),
      yAxis: [leftAxis, rightAxis],
      series: [
        {
          ...createLineSeries({
            name: yLeft.label,
            data: leftLineData,
            color: colors(yLeft.id),
            yAxisIndex: 0,
            connectNulls: false,
          }),
          animationDuration: animation.animationDuration,
          animationEasing: animation.animationEasing,
        },
        {
          ...createLineSeries({
            name: yRight.label,
            data: rightLineData,
            color: colors(yRight.id),
            yAxisIndex: 1,
            connectNulls: false,
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
    getX,
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
