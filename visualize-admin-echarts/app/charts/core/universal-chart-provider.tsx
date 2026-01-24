/**
 * Universal Chart Provider
 *
 * Provides the UniversalChartState context for ECharts adapters.
 * This is the single provider that replaces all chart-type-specific providers.
 */

import keyBy from "lodash/keyBy";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { createColorAccessors, extractCategories, extractSegments } from "@/charts/core/color-scale-factory";
import { createFieldAccessors } from "@/charts/core/field-accessor-factory";
import type {
  ChartDisplayOptions,
  FieldMetadata,
  UniversalChartState,
} from "@/charts/core/universal-chart-state";
import { useChartBounds, getChartWidth } from "@/charts/shared/chart-dimensions";
import { useSize } from "@/charts/shared/use-size";
import type { ChartConfig } from "@/config-types";
import type { Dimension, Measure, Observation } from "@/domain/data";
import { useFormatNumber } from "@/formatters";

// ============================================================================
// Context
// ============================================================================

const UniversalChartContext = createContext<UniversalChartState | undefined>(
  undefined
);

/**
 * Hook to access the universal chart state.
 * Throws an error if used outside of UniversalChartProvider.
 */
export const useUniversalChartState = (): UniversalChartState => {
  const context = useContext(UniversalChartContext);

  if (context === undefined) {
    throw new Error(
      "useUniversalChartState must be used within a UniversalChartProvider. " +
        "Make sure your chart component is wrapped with <UniversalChartProvider>."
    );
  }

  return context;
};

/**
 * Hook to optionally access the universal chart state.
 * Returns undefined if not within a provider.
 */
export const useMaybeUniversalChartState = (): UniversalChartState | undefined => {
  return useContext(UniversalChartContext);
};

// ============================================================================
// Provider Props
// ============================================================================

export interface UniversalChartProviderProps {
  chartConfig: ChartConfig;
  observations: Observation[];
  dimensions: Dimension[];
  measures: Measure[];
}

// ============================================================================
// Display Options Extractor
// ============================================================================

/**
 * Extracts display options from chart config.
 */
const extractDisplayOptions = (chartConfig: ChartConfig): ChartDisplayOptions => {
  const fields = chartConfig.fields as Record<string, any>;

  const options: ChartDisplayOptions = {};

  // Extract showValues
  if (fields.y?.showValues !== undefined) {
    options.showValues = fields.y.showValues;
  }

  // Extract segment type (for column/bar)
  if (fields.segment?.type) {
    options.segmentType = fields.segment.type;
  }

  // Extract innerRadius for donut
  if (fields.innerRadius !== undefined) {
    options.innerRadius = fields.innerRadius;
  }

  // Extract showTitle
  if (fields.segment?.showTitle !== undefined) {
    options.showTitle = fields.segment.showTitle;
  }

  return options;
};

// ============================================================================
// Field Metadata Extractor
// ============================================================================

/**
 * Extracts field metadata for labels and formatting.
 */
const extractFieldMetadata = (
  _chartConfig: ChartConfig,
  fields: ReturnType<typeof createFieldAccessors>,
  formatNumber: (value: number) => string
): FieldMetadata => {
  return {
    xAxisLabel: fields.xLabel ?? "",
    yAxisLabel: fields.yLabel ?? "",
    segmentLabel: fields.segmentDimension?.label,
    formatNumber,
  };
};

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Universal Chart Provider
 *
 * This component provides the UniversalChartState to all child components.
 * It handles:
 * - Creating field accessors from chartConfig
 * - Building color scales
 * - Computing bounds
 * - Extracting segments and categories
 */
export const UniversalChartProvider = ({
  children,
  chartConfig,
  observations,
  dimensions,
  measures,
}: PropsWithChildren<UniversalChartProviderProps>) => {
  const { width, height } = useSize();
  const formatNumber = useFormatNumber();

  // Create lookup maps for dimensions and measures
  const { dimensionsById, measuresById } = useMemo(() => {
    return {
      dimensionsById: keyBy(dimensions, (d) => d.id),
      measuresById: keyBy(measures, (d) => d.id),
    };
  }, [dimensions, measures]);

  // Create field accessors
  const fields = useMemo(() => {
    return createFieldAccessors(chartConfig, dimensionsById, measuresById);
  }, [chartConfig, dimensionsById, measuresById]);

  // Extract segments and categories
  const { segments, categories } = useMemo(() => {
    const segments = extractSegments(
      observations,
      fields.getSegment,
      fields.segmentDimension,
      chartConfig
    );
    const categories = extractCategories(
      observations,
      fields.getX,
      fields.xDimension,
      chartConfig
    );

    return { segments, categories };
  }, [observations, fields.getSegment, fields.getX, fields.segmentDimension, fields.xDimension, chartConfig]);

  // Create color accessors
  const colors = useMemo(() => {
    return createColorAccessors(
      chartConfig,
      segments,
      fields.segmentDimension,
      fields.getSegment
    );
  }, [chartConfig, segments, fields.segmentDimension, fields.getSegment]);

  // Calculate bounds
  const margins = useMemo(() => {
    return {
      top: 40,
      right: 40,
      bottom: 60,
      left: 60,
    };
  }, []);

  const chartWidth = getChartWidth({
    width,
    left: margins.left,
    right: margins.right,
  });

  const bounds = useChartBounds({
    width,
    chartWidth,
    height,
    margins,
  });

  // Extract display options
  const options = useMemo(() => {
    return extractDisplayOptions(chartConfig);
  }, [chartConfig]);

  // Extract field metadata
  const metadata = useMemo(() => {
    return extractFieldMetadata(chartConfig, fields, formatNumber);
  }, [chartConfig, fields, formatNumber]);

  // Build the complete state
  const state = useMemo((): UniversalChartState => {
    return {
      chartType: chartConfig.chartType,
      chartConfig,
      observations,
      allObservations: observations,
      dimensions,
      measures,
      dimensionsById,
      measuresById,
      fields,
      colors,
      bounds,
      segments,
      categories,
      metadata,
      options,
      interactiveFiltersConfig: chartConfig.interactiveFiltersConfig,
    };
  }, [
    chartConfig,
    observations,
    dimensions,
    measures,
    dimensionsById,
    measuresById,
    fields,
    colors,
    bounds,
    segments,
    categories,
    metadata,
    options,
  ]);

  return (
    <UniversalChartContext.Provider value={state}>
      {children}
    </UniversalChartContext.Provider>
  );
};

// ============================================================================
// Export Context for Advanced Usage
// ============================================================================

export { UniversalChartContext };
