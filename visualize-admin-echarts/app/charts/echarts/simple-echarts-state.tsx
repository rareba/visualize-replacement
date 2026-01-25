/**
 * Simple ECharts State Provider
 *
 * A minimal chart state provider for simple ECharts charts that don't need
 * complex segment handling.
 */

import { PropsWithChildren, useCallback, useMemo } from "react";

import { useChartBounds, getChartWidth } from "@/charts/shared/chart-dimensions";
import {
  ChartContext,
  CommonChartState,
} from "@/charts/shared/chart-state";
import { TooltipInfo } from "@/charts/shared/interaction/tooltip";
import { InteractionProvider } from "@/charts/shared/use-interaction";
import { useSize } from "@/charts/shared/use-size";
import { ChartConfig } from "@/config-types";
import { Observation } from "@/domain/data";
import { formatNumberWithUnit, useFormatNumber } from "@/formatters";

import { ChartProps } from "../shared/chart-props";

export type SimpleEChartsState = CommonChartState & {
  chartData: Observation[];
  observations: Observation[];
  width: number;
  height: number;
  yAxisLabel: string;
  getY: (d: Observation) => number | null;
  valueLabelFormatter: (value: number) => string;
  getTooltipInfo: (d: Observation) => TooltipInfo;
};

// Helper to find the primary measure field from config
const findMeasureFieldId = (fields: Record<string, unknown>): string | null => {
  // Try common field names in order of priority
  const measureFieldNames = ["y", "size", "radius", "value"];
  for (const name of measureFieldNames) {
    const field = fields[name] as { componentId?: string } | undefined;
    if (field?.componentId) {
      return field.componentId;
    }
  }
  return null;
};

const useSimpleEChartsState = <T extends ChartConfig>(
  chartProps: ChartProps<T>
): SimpleEChartsState => {
  const { chartConfig, observations, measures } = chartProps;
  const fields = chartConfig.fields as Record<string, unknown>;
  const { interactiveFiltersConfig } = chartConfig;

  const { width, height } = useSize();
  const formatNumber = useFormatNumber();

  // Find the primary measure field
  const measureFieldId = findMeasureFieldId(fields);

  // Find the measure
  const yMeasure = measureFieldId
    ? measures.find((m) => m.id === measureFieldId)
    : measures[0]; // fallback to first measure

  const effectiveMeasureId = measureFieldId ?? yMeasure?.id ?? "";

  // Simple getter for Y values
  const getY = useMemo(() => {
    return (d: Observation): number | null => {
      if (!effectiveMeasureId) return null;
      const value = d[effectiveMeasureId];
      return typeof value === "number" ? value : null;
    };
  }, [effectiveMeasureId]);

  // Chart data is just the observations
  const chartData = observations;

  // Format Y axis label
  const yAxisLabel = yMeasure?.label ?? "";

  // Value formatter
  const valueLabelFormatter = useMemo(() => {
    return (value: number) => {
      if (yMeasure) {
        return formatNumberWithUnit(value, formatNumber, yMeasure.unit);
      }
      return formatNumber(value);
    };
  }, [yMeasure, formatNumber]);

  // Simple bounds
  const margins = { left: 60, right: 20, top: 20, bottom: 60 };
  const chartWidth = getChartWidth({ width, left: margins.left, right: margins.right });
  const bounds = useChartBounds({
    width,
    chartWidth,
    height,
    margins,
  });

  // Tooltip info function (required by Tooltip component)
  const getTooltipInfo = useCallback(
    (datum: Observation): TooltipInfo => {
      const value = getY(datum);
      const formattedValue =
        value !== null ? valueLabelFormatter(value) : "N/A";

      return {
        xAnchor: width / 2,
        yAnchor: bounds.chartHeight / 2,
        placement: { x: "center", y: "middle" },
        value: formattedValue,
        datum: {
          value: formattedValue,
          color: "#333",
        },
        values: undefined,
        withTriangle: false,
      };
    },
    [getY, valueLabelFormatter, width, bounds.chartHeight]
  );

  return {
    chartType: chartConfig.chartType,
    chartData,
    observations,
    bounds,
    allData: observations,
    interactiveFiltersConfig,
    width,
    height,
    yAxisLabel,
    getY,
    valueLabelFormatter,
    getTooltipInfo,
  };
};

export const SimpleEChartsChart = <T extends ChartConfig>(
  props: PropsWithChildren<ChartProps<T>>
) => {
  const { children, ...chartProps } = props;

  return (
    <InteractionProvider>
      <SimpleEChartsChartProvider {...chartProps}>
        {children}
      </SimpleEChartsChartProvider>
    </InteractionProvider>
  );
};

const SimpleEChartsChartProvider = <T extends ChartConfig>(
  props: PropsWithChildren<ChartProps<T>>
) => {
  const { children, ...chartProps } = props;
  const state = useSimpleEChartsState(chartProps);

  // Cast to any since ChartState is a union type and SimpleEChartsState
  // is a different type that satisfies CommonChartState
  return (
    <ChartContext.Provider value={state as any}>
      {children}
    </ChartContext.Provider>
  );
};
