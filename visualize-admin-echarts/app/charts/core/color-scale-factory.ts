/**
 * Color Scale Factory
 *
 * Creates color accessors from chartConfig and segment data.
 * Provides consistent coloring across all chart types.
 */

import { scaleOrdinal, ScaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import orderBy from "lodash/orderBy";

import type { ColorAccessors, StringValueGetter } from "@/charts/core/universal-chart-state";
import type {
  ChartConfig,
  ColorField,
  MeasuresColorField,
  SegmentColorField,
  SingleColorField,
} from "@/config-types";
import type { Dimension, Observation } from "@/domain/data";
import { getPalette } from "@/palettes";
import { makeDimensionValueSorters, getSortingOrders } from "@/utils/sorting-values";

// ============================================================================
// Color Field Type Guards
// ============================================================================

const isSegmentColorField = (field: ColorField): field is SegmentColorField => {
  return field.type === "segment";
};

const isSingleColorField = (field: ColorField): field is SingleColorField => {
  return field.type === "single";
};

const isMeasuresColorField = (field: ColorField): field is MeasuresColorField => {
  return field.type === "measures";
};

// ============================================================================
// Color Extraction Helpers
// ============================================================================

/**
 * Extracts unique segments from observations in a sorted order.
 */
export const extractSegments = (
  observations: Observation[],
  getSegment: StringValueGetter | undefined,
  segmentDimension: Dimension | undefined,
  chartConfig: ChartConfig
): string[] => {
  if (!getSegment) {
    return [];
  }

  const uniqueSegments = Array.from(new Set(observations.map(getSegment)));

  // Sort segments if dimension and sorting config are available
  if (segmentDimension && "fields" in chartConfig) {
    const fields = chartConfig.fields as { segment?: { sorting?: any; useAbbreviations?: boolean } };
    const sorting = fields.segment?.sorting;

    if (sorting) {
      const measureBySegment = Object.fromEntries(
        observations.map((d) => [getSegment(d), 1]) // Dummy values for sorting
      );

      const sorters = makeDimensionValueSorters(segmentDimension, {
        sorting,
        measureBySegment,
        useAbbreviations: fields.segment?.useAbbreviations,
      });

      return orderBy(uniqueSegments, sorters, getSortingOrders(sorters, sorting)) as string[];
    }
  }

  return uniqueSegments;
};

/**
 * Extracts unique categories (X values) from observations, sorted appropriately.
 * For temporal dimensions, sorts chronologically.
 * For other dimensions, uses dimension value ordering when available.
 */
export const extractCategories = (
  observations: Observation[],
  getX: StringValueGetter | undefined,
  xDimension?: Dimension,
  chartConfig?: ChartConfig
): string[] => {
  if (!getX) {
    return [];
  }

  const uniqueCategories = Array.from(new Set(observations.map(getX)));

  // If we have a dimension, try to sort based on dimension ordering
  if (xDimension) {
    // Check if dimension has an explicit value ordering
    if (xDimension.values && xDimension.values.length > 0) {
      // Create a map from value/label to sort index based on dimension values
      const sortIndexMap = new Map<string, number>();
      xDimension.values.forEach((v, idx) => {
        // Map both value and label to same index for flexible matching
        sortIndexMap.set(v.value, idx);
        sortIndexMap.set(v.label, idx);
      });

      // Sort using the dimension value ordering
      return uniqueCategories.sort((a, b) => {
        const indexA = sortIndexMap.get(a) ?? Number.MAX_SAFE_INTEGER;
        const indexB = sortIndexMap.get(b) ?? Number.MAX_SAFE_INTEGER;
        return indexA - indexB;
      });
    }
  }

  // Fallback: try to sort numerically/chronologically if values look like years or numbers
  const yearPattern = /^(?:Year\s+)?(\d{4})$/i;
  const allYears = uniqueCategories.every((cat) => yearPattern.test(cat));

  if (allYears) {
    return uniqueCategories.sort((a, b) => {
      const yearA = parseInt(a.match(yearPattern)?.[1] ?? "0", 10);
      const yearB = parseInt(b.match(yearPattern)?.[1] ?? "0", 10);
      return yearA - yearB;
    });
  }

  // Try numeric sort if all values are numbers
  const allNumeric = uniqueCategories.every((cat) => !isNaN(Number(cat)));
  if (allNumeric) {
    return uniqueCategories.sort((a, b) => Number(a) - Number(b));
  }

  // Default: return in order of first occurrence (original behavior)
  return uniqueCategories;
};

// ============================================================================
// Color Scale Builders
// ============================================================================

/**
 * Creates a color scale for segment-based coloring.
 */
const createSegmentColorScale = (
  segments: string[],
  colorField: SegmentColorField,
  segmentDimension: Dimension | undefined
): ScaleOrdinal<string, string> => {
  const colorScale = scaleOrdinal<string, string>();

  if (colorField.colorMapping && segmentDimension) {
    // Use color mapping from config
    const orderedColors = segments.map((segment) => {
      // Find the dimension value that matches this segment
      const dimensionValue = segmentDimension.values.find(
        (v) => v.label === segment || v.value === segment
      );
      const iri = dimensionValue?.value ?? segment;
      return colorField.colorMapping[iri] ?? schemeCategory10[0];
    });

    colorScale.domain(segments);
    colorScale.range(orderedColors);
  } else {
    // Use palette
    colorScale.domain(segments);
    colorScale.range(
      getPalette({
        paletteId: colorField.paletteId,
        colorField: colorField,
      })
    );
  }

  // Prevent implicit domain extension - return undefined for unknown values
  colorScale.unknown(undefined);

  return colorScale;
};

/**
 * Creates a color scale for single-color charts.
 */
const createSingleColorScale = (
  segments: string[],
  colorField: SingleColorField
): ScaleOrdinal<string, string> => {
  const colorScale = scaleOrdinal<string, string>();

  colorScale.domain(segments);
  colorScale.range([colorField.color]);

  return colorScale;
};

/**
 * Creates a color scale from palette only (no color mapping).
 */
const createPaletteColorScale = (
  segments: string[],
  paletteId: string
): ScaleOrdinal<string, string> => {
  const colorScale = scaleOrdinal<string, string>();

  colorScale.domain(segments);
  colorScale.range(
    getPalette({
      paletteId,
      colorField: { type: "segment", paletteId, colorMapping: {} },
    })
  );

  return colorScale;
};

// ============================================================================
// Main Factory Function
// ============================================================================

/**
 * Creates color accessors from chart configuration.
 *
 * @param chartConfig - The chart configuration
 * @param segments - Ordered list of segment values
 * @param segmentDimension - The segment dimension (optional)
 * @param getSegment - Function to get segment value from observation
 * @returns ColorAccessors object
 */
export const createColorAccessors = (
  chartConfig: ChartConfig,
  segments: string[],
  segmentDimension: Dimension | undefined,
  getSegment?: StringValueGetter
): ColorAccessors => {
  // Handle charts without color field
  if (!("color" in chartConfig.fields) || !chartConfig.fields.color) {
    const colorScale = createPaletteColorScale(segments, "category10");
    return {
      getColor: (segment: string) => colorScale(segment),
      colorDomain: segments,
      colorScale,
      getColorForObservation: getSegment
        ? (d: Observation) => colorScale(getSegment(d))
        : undefined,
    };
  }

  const colorField = chartConfig.fields.color as ColorField;

  let colorScale: ScaleOrdinal<string, string>;

  if (isSegmentColorField(colorField)) {
    colorScale = createSegmentColorScale(segments, colorField, segmentDimension);
  } else if (isSingleColorField(colorField)) {
    colorScale = createSingleColorScale(segments, colorField);
  } else if (isMeasuresColorField(colorField)) {
    // Measures color field - use palette
    colorScale = createPaletteColorScale(segments, colorField.paletteId);
  } else {
    // Fallback for unknown color field types
    colorScale = createPaletteColorScale(segments, "category10");
  }

  return {
    getColor: (segment: string) => colorScale(segment),
    colorDomain: segments,
    colorScale,
    getColorForObservation: getSegment
      ? (d: Observation) => colorScale(getSegment(d))
      : undefined,
  };
};

/**
 * Creates color accessors specifically for pie/donut charts.
 * These charts always use segment-based coloring.
 */
export const createPieColorAccessors = (
  chartConfig: ChartConfig,
  segments: string[],
  segmentDimension: Dimension | undefined,
  getSegment: StringValueGetter
): ColorAccessors => {
  // Pie/Donut always have segment color field
  const colorField = (chartConfig.fields as { color: SegmentColorField }).color;

  const colorScale = createSegmentColorScale(
    segments,
    colorField,
    segmentDimension
  );

  return {
    getColor: (segment: string) => colorScale(segment),
    colorDomain: segments,
    colorScale,
    getColorForObservation: (d: Observation) => colorScale(getSegment(d)),
  };
};
