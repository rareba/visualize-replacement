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
  FunnelConfig,
  GaugeConfig,
  HeatmapConfig,
  LineConfig,
  PieConfig,
  PolarConfig,
  RadarConfig,
  SankeyConfig,
  ScatterPlotConfig,
  SunburstConfig,
  TreemapConfig,
  WaterfallConfig,
  WordcloudConfig,
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
 * Extracts field configuration for axis-based charts (column, bar, line, area).
 */
const getAxisChartFields = (
  config: ColumnConfig | BarConfig | LineConfig | AreaConfig,
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
 * Extracts field configuration for funnel charts.
 */
const getFunnelChartFields = (
  config: FunnelConfig,
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
 * Extracts field configuration for gauge charts.
 */
const getGaugeChartFields = (
  config: GaugeConfig,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const yMeasure = measuresById[fields.y?.componentId ?? ""];

  return {
    getY: createNumericGetter(fields.y?.componentId),
    yLabel: yMeasure ? getLabelWithUnit(yMeasure) : "",
    yMeasure,
  };
};

/**
 * Extracts field configuration for hierarchical charts (treemap, sunburst).
 */
const getHierarchicalChartFields = (
  config: TreemapConfig | SunburstConfig,
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
 * Extracts field configuration for Sankey charts.
 */
const getSankeyChartFields = (
  config: SankeyConfig,
  dimensionsById: DimensionsById,
  _measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const sourceDimension = dimensionsById[fields.source?.componentId ?? ""];
  const targetDimension = dimensionsById[fields.target?.componentId ?? ""];

  return {
    getSource: createStringGetter(fields.source?.componentId),
    getTarget: createStringGetter(fields.target?.componentId),
    getValue: createNumericGetter(fields.value?.componentId),
    xDimension: sourceDimension,
    segmentDimension: targetDimension,
  };
};

/**
 * Extracts field configuration for polar charts.
 */
const getPolarChartFields = (
  config: PolarConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const angleDimension = dimensionsById[fields.angle?.componentId ?? ""];
  const radiusMeasure = measuresById[fields.radius?.componentId ?? ""];

  return {
    getAngle: createStringGetter(fields.angle?.componentId),
    getRadius: createNumericGetter(fields.radius?.componentId),
    xDimension: angleDimension,
    yMeasure: radiusMeasure,
  };
};

/**
 * Extracts field configuration for wordcloud charts.
 */
const getWordcloudChartFields = (
  config: WordcloudConfig,
  dimensionsById: DimensionsById,
  measuresById: MeasuresById
): Partial<FieldAccessors> => {
  const { fields } = config;
  const wordDimension = dimensionsById[fields.word?.componentId ?? ""];
  const sizeMeasure = measuresById[fields.size?.componentId ?? ""];

  return {
    getWord: createStringGetter(fields.word?.componentId),
    getSize: createNumericGetter(fields.size?.componentId),
    xDimension: wordDimension,
    yMeasure: sizeMeasure,
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
    case "bar":
    case "line":
    case "area":
      return getAxisChartFields(
        chartConfig as ColumnConfig | BarConfig | LineConfig | AreaConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "pie":
    case "donut":
      return getPieChartFields(
        chartConfig as PieConfig | DonutConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "funnel":
      return getFunnelChartFields(
        chartConfig as FunnelConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "gauge":
      return getGaugeChartFields(
        chartConfig as GaugeConfig,
        measuresById
      ) as FieldAccessors;

    case "treemap":
    case "sunburst":
      return getHierarchicalChartFields(
        chartConfig as TreemapConfig | SunburstConfig,
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

    case "sankey":
      return getSankeyChartFields(
        chartConfig as SankeyConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "polar":
      return getPolarChartFields(
        chartConfig as PolarConfig,
        dimensionsById,
        measuresById
      ) as FieldAccessors;

    case "wordcloud":
      return getWordcloudChartFields(
        chartConfig as WordcloudConfig,
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
