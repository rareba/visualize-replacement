/**
 * Field Accessor Factory
 *
 * Creates field accessor functions from chartConfig and cube metadata.
 * These accessors provide type-safe ways to extract values from observations.
 */

import { getLabelWithUnit } from "@/charts/shared/chart-helpers";
import type { DimensionsById, MeasuresById } from "@/charts/shared/chart-props";
import type {
  FieldAccessors,
  NumericalValueGetter,
  StringValueGetter,
  TemporalValueGetter,
} from "@/charts/core/universal-chart-state";
import type {
  AreaConfig,
  BarConfig,
  BoxplotConfig,
  ChartConfig,
  ColumnConfig,
  DonutConfig,
  HeatmapConfig,
  LineConfig,
  PieConfig,
  RadarConfig,
  ScatterPlotConfig,
  WaterfallConfig,
} from "@/config-types";
import type { Dimension, Observation } from "@/domain/data";
import { isTemporalDimension, isTemporalEntityDimension } from "@/domain/data";

// ============================================================================
// Core Accessor Creators
// ============================================================================

/**
 * Creates a string value getter for a dimension field.
 */
export const createStringGetter = (
  componentId: string | undefined
): StringValueGetter => {
  if (!componentId) {
    return () => "";
  }
  return (d: Observation) => String(d[componentId] ?? "");
};

/**
 * Creates a numeric value getter for a measure field.
 */
export const createNumericGetter = (
  componentId: string | undefined
): NumericalValueGetter => {
  if (!componentId) {
    return () => null;
  }
  return (d: Observation) => {
    const value = d[componentId];
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  };
};

/**
 * Creates a temporal value getter for a temporal dimension.
 */
export const createTemporalGetter = (
  componentId: string | undefined,
  dimension: Dimension | undefined
): TemporalValueGetter => {
  if (!componentId || !dimension) {
    return () => new Date();
  }

  // Handle temporal entity dimensions (like years represented as strings)
  if (isTemporalEntityDimension(dimension)) {
    const valueMap = new Map(
      dimension.values.map((v) => [v.value, new Date(v.value)])
    );
    return (d: Observation) => {
      const value = String(d[componentId] ?? "");
      return valueMap.get(value) ?? new Date(value);
    };
  }

  // Handle regular temporal dimensions
  return (d: Observation) => {
    const value = d[componentId] as unknown;
    if (value instanceof Date) {
      return value;
    }
    return new Date(String(value));
  };
};

/**
 * Creates a rendering key getter for unique identification.
 */
export const createRenderingKeyGetter = (
  getX?: StringValueGetter,
  getSegment?: StringValueGetter
): ((d: Observation, segment?: string) => string) => {
  return (d: Observation, segment?: string) => {
    const xPart = getX ? getX(d) : "";
    const segmentPart = segment ?? (getSegment ? getSegment(d) : "");
    return segmentPart ? `${xPart}--${segmentPart}` : xPart;
  };
};

// ============================================================================
// Chart Type Specific Field Extractors
// ============================================================================

/**
 * Extracts field configuration for axis-based charts (column, line, area).
 * Note: Bar charts use getBarChartFields which handles swapped field semantics.
 */
const getAxisChartFields = (
  config: ColumnConfig | LineConfig | AreaConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const xDimension = dimensionsById[fields.x?.componentId ?? ""];
  const yMeasure = measuresById[fields.y?.componentId ?? ""];
  const segmentDimension = fields.segment
    ? dimensionsById[fields.segment.componentId]
    : undefined;

  const getX = createStringGetter(fields.x?.componentId);
  const getY = createNumericGetter(fields.y?.componentId);
  const getSegment = fields.segment
    ? createStringGetter(fields.segment.componentId)
    : undefined;

  // For temporal X axis
  const getXAsDate =
    xDimension &&
    (isTemporalDimension(xDimension) || isTemporalEntityDimension(xDimension))
      ? createTemporalGetter(fields.x?.componentId, xDimension)
      : undefined;

  return {
    getX,
    getY,
    getXAsDate,
    getSegment,
    xLabel: xDimension ? getLabelWithUnit(xDimension) : "",
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    xDimension,
    yMeasure,
    segmentDimension,
    getRenderingKey: createRenderingKeyGetter(getX, getSegment),
  };
};

/**
 * Extracts field configuration for bar charts.
 *
 * Bar charts have SWAPPED field semantics compared to column charts:
 * - BarConfig.fields.x = MEASURE (numeric value on horizontal axis)
 * - BarConfig.fields.y = DIMENSION (category on vertical axis)
 *
 * But the universal adapter expects:
 * - getX = categories (string) for Y-axis
 * - getY = values (numeric) for X-axis
 *
 * So we swap the accessors to match adapter expectations.
 */
const getBarChartFields = (
  config: BarConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  // For bar: fields.y is the dimension (categories), fields.x is the measure (values)
  const xDimension = dimensionsById[fields.y?.componentId ?? ""];
  const yMeasure = measuresById[fields.x?.componentId ?? ""];
  const segmentDimension = fields.segment
    ? dimensionsById[fields.segment.componentId]
    : undefined;

  // Swap: getX reads from fields.y (dimension), getY reads from fields.x (measure)
  const getX = createStringGetter(fields.y?.componentId);
  const getY = createNumericGetter(fields.x?.componentId);
  const getSegment = fields.segment
    ? createStringGetter(fields.segment.componentId)
    : undefined;

  // For temporal category axis (Y-axis in bar charts)
  const getXAsDate =
    xDimension &&
    (isTemporalDimension(xDimension) || isTemporalEntityDimension(xDimension))
      ? createTemporalGetter(fields.y?.componentId, xDimension)
      : undefined;

  return {
    getX,
    getY,
    getXAsDate,
    getSegment,
    xLabel: xDimension ? getLabelWithUnit(xDimension) : "",
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    xDimension,
    yMeasure,
    segmentDimension,
    getRenderingKey: createRenderingKeyGetter(getX, getSegment),
  };
};

/**
 * Extracts field configuration for pie/donut charts.
 */
const getPieChartFields = (
  config: PieConfig | DonutConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const yMeasure = measuresById[fields.y?.componentId ?? ""];
  const segmentDimension = dimensionsById[fields.segment?.componentId ?? ""];

  const getY = createNumericGetter(fields.y?.componentId);
  const getSegment = createStringGetter(fields.segment?.componentId);

  return {
    getY,
    getSegment,
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    yMeasure,
    segmentDimension,
    getRenderingKey: createRenderingKeyGetter(undefined, getSegment),
  };
};

/**
 * Extracts field configuration for heatmap charts.
 */
const getHeatmapChartFields = (
  config: HeatmapConfig,
  dimensionsById: DimensionsById,
  _measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const xDimension = dimensionsById[fields.x?.componentId ?? ""];
  const yDimension = dimensionsById[fields.y?.componentId ?? ""];

  return {
    getX: createStringGetter(fields.x?.componentId),
    // For heatmap, Y is a dimension, not a measure
    getSegment: createStringGetter(fields.y?.componentId),
    getValue: createNumericGetter(fields.value?.componentId),
    xLabel: xDimension ? getLabelWithUnit(xDimension) : "",
    yLabel: yDimension ? getLabelWithUnit(yDimension) : "",
    xDimension,
    segmentDimension: yDimension,
  };
};

/**
 * Extracts field configuration for boxplot charts.
 */
const getBoxplotChartFields = (
  config: BoxplotConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const xDimension = dimensionsById[fields.x?.componentId ?? ""];
  const yMeasure = measuresById[fields.y?.componentId ?? ""];

  return {
    getX: createStringGetter(fields.x?.componentId),
    getY: createNumericGetter(fields.y?.componentId),
    xLabel: xDimension ? getLabelWithUnit(xDimension) : "",
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    xDimension,
    yMeasure,
  };
};

/**
 * Extracts field configuration for waterfall charts.
 */
const getWaterfallChartFields = (
  config: WaterfallConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const xDimension = dimensionsById[fields.x?.componentId ?? ""];
  const yMeasure = measuresById[fields.y?.componentId ?? ""];

  return {
    getX: createStringGetter(fields.x?.componentId),
    getY: createNumericGetter(fields.y?.componentId),
    xLabel: xDimension ? getLabelWithUnit(xDimension) : "",
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    xDimension,
    yMeasure,
  };
};

/**
 * Extracts field configuration for radar charts.
 */
const getRadarChartFields = (
  config: RadarConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const yMeasure = measuresById[fields.y?.componentId ?? ""];
  const segmentDimension = dimensionsById[fields.segment?.componentId ?? ""];

  return {
    getY: createNumericGetter(fields.y?.componentId),
    getSegment: createStringGetter(fields.segment?.componentId),
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    yMeasure,
    segmentDimension,
  };
};

/**
 * Extracts field configuration for scatterplot charts.
 */
const getScatterplotChartFields = (
  config: ScatterPlotConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const xMeasure = measuresById[fields.x?.componentId ?? ""];
  const yMeasure = measuresById[fields.y?.componentId ?? ""];
  const segmentDimension = fields.segment
    ? dimensionsById[fields.segment.componentId]
    : undefined;

  return {
    getXNumeric: createNumericGetter(fields.x?.componentId),
    getY: createNumericGetter(fields.y?.componentId),
    getSegment: fields.segment
      ? createStringGetter(fields.segment.componentId)
      : undefined,
    xLabel: xMeasure ? getLabelWithUnit(xMeasure) : "",
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    segmentDimension,
  };
};

// ============================================================================
// Main Factory Function
// ============================================================================

/**
 * Creates field accessors from a chart configuration.
 *
 * This is the main entry point for creating field accessors.
 * It dispatches to the appropriate chart-type-specific extractor.
 */
export const createFieldAccessors = (
  chartConfig: ChartConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): FieldAccessors => {
  switch (chartConfig.chartType) {
    case "column":
    case "line":
    case "area":
    case "bar3d":
    case "line3d":
      return getAxisChartFields(
        chartConfig as ColumnConfig | LineConfig | AreaConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "bar":
      return getBarChartFields(
        chartConfig as BarConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "pie":
    case "donut":
    case "pie3d":
    case "globe":
      return getPieChartFields(
        chartConfig as PieConfig | DonutConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "heatmap":
      return getHeatmapChartFields(
        chartConfig as HeatmapConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "boxplot":
      return getBoxplotChartFields(
        chartConfig as BoxplotConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "waterfall":
      return getWaterfallChartFields(
        chartConfig as WaterfallConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "radar":
      return getRadarChartFields(
        chartConfig as RadarConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "scatterplot":
    case "scatter3d":
    case "surface":
      return getScatterplotChartFields(
        chartConfig as ScatterPlotConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    // Combo charts - not yet supported in universal architecture
    case "comboLineSingle":
    case "comboLineDual":
    case "comboLineColumn":
      return {} as FieldAccessors;

    // Non-ECharts charts
    case "map":
    case "table":
      return {} as FieldAccessors;

    default:
      // This should never happen if all chart types are covered
      console.warn(`Unknown chart type: ${(chartConfig as ChartConfig).chartType}`);
      return {} as FieldAccessors;
  }
};
