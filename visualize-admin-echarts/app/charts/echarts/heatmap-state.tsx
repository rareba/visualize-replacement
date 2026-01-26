/**
 * Heatmap Chart State Provider
 *
 * State management for heatmap charts that display matrix data
 * using color intensity to represent values.
 */

import { scaleBand, ScaleBand } from "d3-scale";
import orderBy from "lodash/orderBy";
import { PropsWithChildren, useCallback, useMemo } from "react";

import {
  HeatmapColorField,
} from "@/charts/echarts/adapter-utils";
import {
  getChartWidth,
  useChartBounds,
} from "@/charts/shared/chart-dimensions";
import {
  ChartContext,
  CommonChartState,
  useBandXVariables,
  useBandYVariables,
} from "@/charts/shared/chart-state";
import { TooltipInfo } from "@/charts/shared/interaction/tooltip";
import { InteractionProvider } from "@/charts/shared/use-interaction";
import { useSize } from "@/charts/shared/use-size";
import { HeatmapConfig } from "@/config-types";
import { Observation } from "@/domain/data";
import { formatNumberWithUnit, useFormatNumber } from "@/formatters";
import { makeDimensionValueSorters, getSortingOrders } from "@/utils/sorting-values";

import { ChartProps, DimensionsById, MeasuresById } from "../shared/chart-props";

// ============================================================================
// Types
// ============================================================================

export type HeatmapState = CommonChartState & {
  chartType: "heatmap";
  chartData: Observation[];
  /** X-axis scale (categories) */
  xScale: ScaleBand<string>;
  /** Y-axis scale (categories) */
  yScale: ScaleBand<string>;
  /** Get X category for an observation */
  getX: (d: Observation) => string;
  /** Get Y category for an observation */
  getSegment: (d: Observation) => string;
  getSegmentAbbreviationOrLabel: (d: Observation) => string;
  /** Get value for an observation */
  getValue: (d: Observation) => number | null;
  /** X-axis label */
  xAxisLabel: string;
  /** Y-axis label */
  yAxisLabel: string;
  /** Value formatter */
  valueLabelFormatter: (value: number) => string;
  /** Format X axis tick */
  formatXAxisTick: (d: string) => string;
  /** Get tooltip info */
  getTooltipInfo: (d: Observation) => TooltipInfo;
  /** Color field from config */
  colorField?: HeatmapColorField;
  /** Configuration options */
  options: {
    showLabels: boolean;
    borderWidth: number;
    borderColor: string;
  };
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS = {
  showLabels: true,
  borderWidth: 1,
  borderColor: "#fff",
};

// ============================================================================
// State Hook
// ============================================================================

const useHeatmapState = (
  chartProps: ChartProps<HeatmapConfig>
): HeatmapState => {
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

  // Get y-axis variables (using segment pattern since heatmap has y dimension)
  const {
    yDimension,
    yAxisLabel,
    getY: getYDimensionValue,
    getYLabel: _getYLabel,
    getYAbbreviationOrLabel,
  } = useBandYVariables(fields.y, {
    dimensionsById,
    observations,
  });

  // Get value measure
  const valueMeasure = measuresById[fields.value?.componentId ?? ""];

  // Simple getter for value
  const getValue = useMemo(() => {
    const measureId = fields.value?.componentId ?? "";
    return (d: Observation): number | null => {
      if (!measureId) return null;
      const value = d[measureId];
      return typeof value === "number" ? value : null;
    };
  }, [fields.value?.componentId]);

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
      .paddingInner(0)
      .paddingOuter(0);
  }, [xDimension, fields.x.sorting, fields.x.useAbbreviations, observations, getX]);

  // Build y-scale with sorted domain
  const yScale = useMemo(() => {
    const sorters = makeDimensionValueSorters(yDimension, {
      sorting: fields.y.sorting,
      useAbbreviations: fields.y.useAbbreviations,
    });
    const sortingOrders = getSortingOrders(sorters, fields.y.sorting);
    const bandDomain = orderBy(
      [...new Set(observations.map(getYDimensionValue))],
      sorters,
      sortingOrders
    );

    return scaleBand<string>()
      .domain(bandDomain)
      .paddingInner(0)
      .paddingOuter(0);
  }, [yDimension, fields.y.sorting, fields.y.useAbbreviations, observations, getYDimensionValue]);

  // Value formatter
  const valueLabelFormatter = useMemo(() => {
    return (value: number) => {
      if (valueMeasure) {
        return formatNumberWithUnit(value, formatNumber, valueMeasure.unit);
      }
      return formatNumber(value);
    };
  }, [valueMeasure, formatNumber]);

  // Format X axis tick
  const formatXAxisTick = useCallback(
    (tick: string) => {
      return getXLabel(tick);
    },
    [getXLabel]
  );

  // Chart bounds
  const margins = { left: 80, right: 40, top: 40, bottom: 80 };
  const chartWidth = getChartWidth({ width, left: margins.left, right: margins.right });
  const bounds = useChartBounds({
    width,
    chartWidth,
    height,
    margins,
  });

  // Update scales range
  xScale.range([0, chartWidth]);
  yScale.range([bounds.chartHeight, 0]);

  // Extract color field
  const colorField: HeatmapColorField | undefined = fields.color &&
    (fields.color.type === "sequential" || fields.color.type === "diverging")
      ? (fields.color as HeatmapColorField)
      : undefined;

  // Tooltip function
  const getTooltipInfo = useCallback(
    (datum: Observation): TooltipInfo => {
      const xVal = getX(datum);
      const yVal = getYDimensionValue(datum);
      const value = getValue(datum);

      return {
        xAnchor: (xScale(xVal) ?? 0) + xScale.bandwidth() / 2,
        yAnchor: (yScale(yVal) ?? 0) + yScale.bandwidth() / 2,
        placement: { x: "center", y: "middle" },
        value: `${getXAbbreviationOrLabel(datum)} × ${getYAbbreviationOrLabel(datum)}`,
        datum: {
          label: `${getXAbbreviationOrLabel(datum)} - ${getYAbbreviationOrLabel(datum)}`,
          value: value !== null ? valueLabelFormatter(value) : "N/A",
          color: "#333",
        },
        values: undefined,
      };
    },
    [getX, getYDimensionValue, getValue, xScale, yScale, getXAbbreviationOrLabel, getYAbbreviationOrLabel, valueLabelFormatter]
  );

  return {
    chartType: "heatmap",
    chartData: observations,
    allData: observations,
    bounds,
    interactiveFiltersConfig,
    xScale,
    yScale,
    getX,
    getSegment: getYDimensionValue,
    getSegmentAbbreviationOrLabel: getYAbbreviationOrLabel,
    getValue,
    xAxisLabel,
    yAxisLabel,
    valueLabelFormatter,
    formatXAxisTick,
    getTooltipInfo,
    colorField,
    options: DEFAULT_OPTIONS,
  };
};

// ============================================================================
// Provider Components
// ============================================================================

const HeatmapChartProvider = (
  props: PropsWithChildren<ChartProps<HeatmapConfig>>
) => {
  const { children, ...chartProps } = props;
  const state = useHeatmapState(chartProps);

  return (
    <ChartContext.Provider value={state as any}>
      {children}
    </ChartContext.Provider>
  );
};

export const HeatmapChart = (
  props: PropsWithChildren<ChartProps<HeatmapConfig>>
) => {
  return (
    <InteractionProvider>
      <HeatmapChartProvider {...props} />
    </InteractionProvider>
  );
};
