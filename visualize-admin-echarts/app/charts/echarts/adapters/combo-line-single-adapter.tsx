/**
 * Combo Line Single Chart Adapter (LEGACY)
 *
 * @deprecated Use `comboLineSingleUniversalAdapter` from `@/charts/echarts/universal-adapters/`
 * or `UniversalEChartsChart` component instead.
 *
 * This component-based adapter is maintained for backward compatibility.
 * See universal-adapters/combo-line-single-universal-adapter.ts for the recommended approach.
 *
 * Transforms data from the existing ChartContext state to ECharts format.
 * This adapter renders multiple lines on a single Y axis.
 */

import { useMemo } from "react";

import {
  calculateChartDimensions,
  createGridConfig,
  createLegend,
  createYValueAxis,
  getDefaultAnimation,
  safeGetBounds,
  safeGetNumericDomain,
} from "@/charts/echarts/adapter-utils";
import {
  createCrossTooltip,
  createTimeAxis,
  createTimeComboTooltipFormatter,
} from "@/charts/echarts/dual-axis-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { createLineSeries } from "@/charts/echarts/series-builders";
import { getSwissFederalTheme } from "@/charts/echarts/theme";
import { ComboLineSingleState } from "@/charts/combo/combo-line-single-state";
import { useChartState } from "@/charts/shared/chart-state";

import type { EChartsOption, LineSeriesOption } from "echarts";

/**
 * Combo Line Single Chart adapter - multiple lines with a single Y axis
 */
export const ComboLineSingleChartAdapter = () => {
  const state = useChartState() as ComboLineSingleState;
  const {
    chartData,
    xScale,
    yScale,
    getX,
    y,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
  } = state;

  const option = useMemo((): EChartsOption => {
    const safeBounds = safeGetBounds(bounds);
    const yDomain = safeGetNumericDomain(yScale);

    // Sort data by date for line charts
    const sortedData = [...chartData].sort((a, b) => {
      const dateA = getX(a);
      const dateB = getX(b);
      return dateA.getTime() - dateB.getTime();
    });

    const animation = getDefaultAnimation();

    // Build series for each line
    const series: LineSeriesOption[] = y.lines.map((lineConfig) => {
      const lineData: Array<[number, number | null]> = sortedData.map((d) => [
        getX(d).getTime(),
        lineConfig.getY(d),
      ]);

      return {
        ...createLineSeries({
          name: lineConfig.label,
          data: lineData,
          color: colors(lineConfig.id),
          connectNulls: false,
        }),
        animationDuration: animation.animationDuration,
        animationEasing: animation.animationEasing,
      };
    });

    return {
      ...getSwissFederalTheme(),
      grid: createGridConfig(safeBounds),
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
      yAxis: {
        ...createYValueAxis({
          name: yAxisLabel,
          nameGap: 50,
          min: yDomain[0],
          max: yDomain[1],
        }),
        axisLine: {
          show: true,
        },
      },
      series,
    };
  }, [
    chartData,
    xScale,
    yScale,
    getX,
    y,
    colors,
    bounds,
    xAxisLabel,
    yAxisLabel,
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
