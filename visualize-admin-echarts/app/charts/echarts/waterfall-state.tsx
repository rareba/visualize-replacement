/**
 * Waterfall Chart State Provider
 *
 * State management for waterfall charts that show cumulative effects
 * of sequential positive and negative values.
 */

import { scaleBand, ScaleBand } from "d3-scale";
import orderBy from "lodash/orderBy";
import { PropsWithChildren, useCallback, useMemo } from "react";

import {
  getChartWidth,
  useChartBounds,
} from "@/charts/shared/chart-dimensions";
import {
  ChartContext,
  CommonChartState,
  useBandXVariables,
  useNumericalYVariables,
} from "@/charts/shared/chart-state";
import { TooltipInfo } from "@/charts/shared/interaction/tooltip";
import { getCenteredTooltipPlacement } from "@/charts/shared/interaction/tooltip-box";
import { InteractionProvider } from "@/charts/shared/use-interaction";
import { useSize } from "@/charts/shared/use-size";
import { WaterfallConfig } from "@/config-types";
import { Observation } from "@/domain/data";
import { formatNumberWithUnit, useFormatNumber } from "@/formatters";
import { makeDimensionValueSorters, getSortingOrders } from "@/utils/sorting-values";

import { ChartProps, DimensionsById, MeasuresById } from "../shared/chart-props";

// ============================================================================
// Types
// ============================================================================

export type WaterfallState = CommonChartState & {
  chartType: "waterfall";
  chartData: Observation[];
  xScale: ScaleBand<string>;
  getX: (d: Observation) => string;
  getY: (d: Observation) => number | null;
  xAxisLabel: string;
  yAxisLabel: string;
  valueLabelFormatter: (value: number) => string;
  formatXAxisTick: (d: string) => string;
  getTooltipInfo: (d: Observation) => TooltipInfo;
  /** Configuration options */
  options: {
    showTotal: boolean;
    increaseColor: string;
    decreaseColor: string;
    totalColor: string;
  };
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS = {
  showTotal: true,
  increaseColor: "#2e7d32", // Green for increases
  decreaseColor: "#c62828", // Red for decreases
  totalColor: "#1976d2", // Blue for total
};

// ============================================================================
// State Hook
// ============================================================================

const useWaterfallState = (
  chartProps: ChartProps<WaterfallConfig>
): WaterfallState => {
  const { chartConfig, observations, dimensions, measures } = chartProps;
  const { fields, interactiveFiltersConfig } = chartConfig;

  const { width, height } = useSize();
  const formatNumber = useFormatNumber();

  // Create lookup maps
  const dimensionsById: DimensionsById = useMemo(() => {
    return Object.fromEntries(dimensions.map((d) => [d.id, d]));
  }, [dimensions]);

  const measuresById: MeasuresById = useMemo(() => {
    return Object.fromEntries(measures.map((m) => [m.id, m]));
  }, [measures]);

  // Get x-axis variables
  const {
    xDimension,
    xAxisLabel,
    getX,
    getXLabel,
    getXAbbreviationOrLabel,
  } = useBandXVariables(fields.x, {
    dimensionsById,
    observations,
  });

  // Get y-axis variables
  const { yMeasure, yAxisLabel, getY } = useNumericalYVariables(
    "column",
    fields.y,
    { measuresById }
  );

  // Build x-scale with sorted domain
  const xScale = useMemo(() => {
    const sorters = makeDimensionValueSorters(xDimension, {
      sorting: fields.x.sorting,
      useAbbreviations: fields.x.useAbbreviations,
    });
    const sortingOrders = getSortingOrders(sorters, fields.x.sorting);
    const bandDomain = orderBy(
      [...new Set(observations.map(getX))],
      sorters,
      sortingOrders
    );

    return scaleBand<string>()
      .domain(bandDomain)
      .paddingInner(0.2)
      .paddingOuter(0.1);
  }, [xDimension, fields.x.sorting, fields.x.useAbbreviations, observations, getX]);

  // Value formatter
  const valueLabelFormatter = useMemo(() => {
    return (value: number) => {
      if (yMeasure) {
        return formatNumberWithUnit(value, formatNumber, yMeasure.unit);
      }
      return formatNumber(value);
    };
  }, [yMeasure, formatNumber]);

  // Format X axis tick
  const formatXAxisTick = useCallback(
    (tick: string) => {
      return getXLabel(tick);
    },
    [getXLabel]
  );

  // Chart bounds
  const margins = { left: 60, right: 40, top: 40, bottom: 60 };
  const chartWidth = getChartWidth({ width, left: margins.left, right: margins.right });
  const bounds = useChartBounds({
    width,
    chartWidth,
    height,
    margins,
  });

  // Update x-scale range
  xScale.range([0, chartWidth]);

  // Tooltip function
  const getTooltipInfo = useCallback(
    (datum: Observation): TooltipInfo => {
      const xAnchor = (xScale(getX(datum)) ?? 0) + xScale.bandwidth() / 2;
      const yAnchor = bounds.chartHeight / 2;
      const placement = getCenteredTooltipPlacement({
        chartWidth,
        xAnchor,
        topAnchor: true,
      });

      const xLabel = getXAbbreviationOrLabel(datum);
      const y = getY(datum);

      return {
        xAnchor,
        yAnchor,
        placement,
        value: formatXAxisTick(xLabel),
        datum: {
          label: xLabel,
          value: y !== null ? valueLabelFormatter(y) : "N/A",
          color: y !== null && y >= 0 ? DEFAULT_OPTIONS.increaseColor : DEFAULT_OPTIONS.decreaseColor,
        },
        values: undefined,
      };
    },
    [xScale, getX, bounds.chartHeight, chartWidth, getXAbbreviationOrLabel, getY, formatXAxisTick, valueLabelFormatter]
  );

  return {
    chartType: "waterfall",
    chartData: observations,
    allData: observations,
    bounds,
    interactiveFiltersConfig,
    xScale,
    getX,
    getY,
    xAxisLabel,
    yAxisLabel,
    valueLabelFormatter,
    formatXAxisTick,
    getTooltipInfo,
    options: DEFAULT_OPTIONS,
  };
};

// ============================================================================
// Provider Components
// ============================================================================

const WaterfallChartProvider = (
  props: PropsWithChildren<ChartProps<WaterfallConfig>>
) => {
  const { children, ...chartProps } = props;
  const state = useWaterfallState(chartProps);

  return (
    <ChartContext.Provider value={state as any}>
      {children}
    </ChartContext.Provider>
  );
};

export const WaterfallChart = (
  props: PropsWithChildren<ChartProps<WaterfallConfig>>
) => {
  return (
    <InteractionProvider>
      <WaterfallChartProvider {...props} />
    </InteractionProvider>
  );
};
