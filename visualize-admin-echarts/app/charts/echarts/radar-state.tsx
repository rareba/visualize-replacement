/**
 * Radar Chart State Provider
 *
 * State management for radar/spider charts that display multi-variable
 * data on axes starting from the same point.
 */

import { scaleOrdinal, ScaleOrdinal } from "d3-scale";
import orderBy from "lodash/orderBy";
import { PropsWithChildren, useCallback, useMemo } from "react";

import {
  getChartWidth,
  useChartBounds,
} from "@/charts/shared/chart-dimensions";
import {
  ChartContext,
  CommonChartState,
  useSegmentVariables,
} from "@/charts/shared/chart-state";
import { TooltipInfo } from "@/charts/shared/interaction/tooltip";
import { InteractionProvider } from "@/charts/shared/use-interaction";
import { useSize } from "@/charts/shared/use-size";
import { RadarConfig, ChartSegmentField } from "@/config-types";
import { Observation } from "@/domain/data";
import { formatNumberWithUnit, useFormatNumber } from "@/formatters";
import { getPalette } from "@/palettes";
import { findDimensionValue, getDimensionLabel } from "@/utils/dimension-utils";
import { makeDimensionValueSorters, getSortingOrders } from "@/utils/sorting-values";

import { ChartProps, DimensionsById, MeasuresById } from "../shared/chart-props";

// ============================================================================
// Types
// ============================================================================

export interface RadarIndicator {
  name: string;
  max?: number;
}

export type RadarState = CommonChartState & {
  chartType: "radar";
  chartData: Observation[];
  /** Radar indicators (axes) */
  indicators: RadarIndicator[];
  /** Get segment/category for an observation */
  getSegment: (d: Observation) => string;
  /** Get segment label for display */
  getSegmentAbbreviationOrLabel: (d: Observation) => string;
  /** Get value for an observation */
  getY: (d: Observation) => number | null;
  /** Get color for a segment */
  colors: ScaleOrdinal<string, string>;
  /** Ordered segment list */
  segments: string[];
  /** Value formatter */
  valueLabelFormatter: (value: number) => string;
  /** Get tooltip info */
  getTooltipInfo: (d: Observation) => TooltipInfo;
  /** Configuration options */
  options: {
    shape: "polygon" | "circle";
    areaStyle: boolean;
    lineSmooth: boolean;
    splitNumber: number;
  };
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS = {
  shape: "polygon" as const,
  areaStyle: true,
  lineSmooth: false,
  splitNumber: 5,
};

// ============================================================================
// State Hook
// ============================================================================

const useRadarState = (
  chartProps: ChartProps<RadarConfig>
): RadarState => {
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

  // Get segment variables
  // Note: radar segment field doesn't have 'type' but useSegmentVariables only uses componentId and optional fields
  const {
    segmentDimension,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getSegmentLabel: _getSegmentLabel,
  } = useSegmentVariables(fields.segment as unknown as ChartSegmentField, {
    dimensionsById,
    observations,
  });

  // Get Y measure
  const yMeasure = measuresById[fields.y?.componentId ?? ""];

  // Simple getter for Y values
  const getY = useMemo(() => {
    const measureId = fields.y?.componentId ?? "";
    return (d: Observation): number | null => {
      if (!measureId) return null;
      const value = d[measureId];
      return typeof value === "number" ? value : null;
    };
  }, [fields.y?.componentId]);

  // Build indicators from the indicators field
  const indicators = useMemo((): RadarIndicator[] => {
    if (!fields.indicators || fields.indicators.length === 0) {
      // Fallback: use first few dimensions
      return dimensions.slice(0, 5).map((dim) => ({
        name: getDimensionLabel(dim) || dim.id,
        max: undefined,
      }));
    }

    return fields.indicators.map((indicator) => {
      const dim = dimensionsById[indicator.componentId];
      return {
        name: getDimensionLabel(dim) || indicator.componentId,
        max: undefined,
      };
    });
  }, [fields.indicators, dimensions, dimensionsById]);

  // Build segments with colors
  const { segments, colors } = useMemo(() => {
    const sorters = makeDimensionValueSorters(segmentDimension, {
      sorting: fields.segment?.sorting,
      useAbbreviations: fields.segment?.useAbbreviations,
    });
    const sortingOrders = getSortingOrders(sorters, fields.segment?.sorting);
    const uniqueSegments = orderBy(
      [...new Set(observations.map(getSegment))],
      sorters,
      sortingOrders
    );

    const colorScale = scaleOrdinal<string, string>();
    colorScale.domain(uniqueSegments);

    const colorField = fields.color;
    if (colorField.type === "segment" && colorField.colorMapping) {
      const colorMapping = colorField.colorMapping;
      const orderedColors = uniqueSegments.map((segment) => {
        const dimensionValue = findDimensionValue(segmentDimension, segment);
        const iri = dimensionValue?.value ?? segment;
        return colorMapping[iri] ?? getPalette({})[0];
      });
      colorScale.range(orderedColors);
    } else {
      colorScale.range(
        getPalette({
          paletteId: colorField.type === "segment" ? colorField.paletteId : undefined,
        })
      );
    }

    return { segments: uniqueSegments, colors: colorScale };
  }, [segmentDimension, fields.segment, fields.color, observations, getSegment]);

  // Value formatter
  const valueLabelFormatter = useMemo(() => {
    return (value: number) => {
      if (yMeasure) {
        return formatNumberWithUnit(value, formatNumber, yMeasure.unit);
      }
      return formatNumber(value);
    };
  }, [yMeasure, formatNumber]);

  // Chart bounds
  const margins = { left: 40, right: 40, top: 40, bottom: 40 };
  const chartWidth = getChartWidth({ width, left: margins.left, right: margins.right });
  const bounds = useChartBounds({
    width,
    chartWidth,
    height,
    margins,
  });

  // Tooltip function
  const getTooltipInfo = useCallback(
    (datum: Observation): TooltipInfo => {
      const segment = getSegment(datum);
      const segmentLabel = getSegmentAbbreviationOrLabel(datum);
      const y = getY(datum);

      return {
        xAnchor: width / 2,
        yAnchor: bounds.chartHeight / 2,
        placement: { x: "center", y: "middle" },
        value: segmentLabel,
        datum: {
          label: segmentLabel,
          value: y !== null ? valueLabelFormatter(y) : "N/A",
          color: colors(segment),
        },
        values: undefined,
      };
    },
    [getSegment, getSegmentAbbreviationOrLabel, getY, width, bounds.chartHeight, valueLabelFormatter, colors]
  );

  return {
    chartType: "radar",
    chartData: observations,
    allData: observations,
    bounds,
    interactiveFiltersConfig,
    indicators,
    getSegment,
    getSegmentAbbreviationOrLabel,
    getY,
    colors,
    segments,
    valueLabelFormatter,
    getTooltipInfo,
    options: DEFAULT_OPTIONS,
  };
};

// ============================================================================
// Provider Components
// ============================================================================

const RadarChartProvider = (
  props: PropsWithChildren<ChartProps<RadarConfig>>
) => {
  const { children, ...chartProps } = props;
  const state = useRadarState(chartProps);

  return (
    <ChartContext.Provider value={state as any}>
      {children}
    </ChartContext.Provider>
  );
};

export const RadarChart = (
  props: PropsWithChildren<ChartProps<RadarConfig>>
) => {
  return (
    <InteractionProvider>
      <RadarChartProvider {...props} />
    </InteractionProvider>
  );
};
