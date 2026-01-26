/**
 * Dimension Utilities
 *
 * Centralized API for dimension-specific logic including:
 * - Dimension value accessors
 * - Label and abbreviation resolution
 * - Dimension type checking
 * - Value sorting and ordering
 *
 * This module consolidates dimension behavior that was previously
 * scattered across multiple helper files.
 */

import type { Dimension, DimensionValue, Observation } from "@/domain/data";
import {
  isDimension,
  isNominalDimension,
  isOrdinalDimension,
  isTemporalDimension,
  isTemporalEntityDimension,
  isTemporalOrdinalDimension,
  isGeoDimension,
  isGeoCoordinatesDimension,
  isGeoShapesDimension,
} from "@/domain/data";

// ============================================================================
// Dimension Value Accessors
// ============================================================================

/**
 * Gets the label for a dimension value.
 * Uses alternateName if available and useAbbreviations is true, otherwise uses label.
 */
export const getDimensionValueLabel = (
  value: DimensionValue,
  options?: { useAbbreviations?: boolean }
): string => {
  if (options?.useAbbreviations && value.alternateName) {
    return value.alternateName;
  }
  return value.label;
};

/**
 * Gets the identifier (IRI or value) for a dimension value.
 */
export const getDimensionValueIdentifier = (value: DimensionValue): string => {
  return String(value.value);
};

/**
 * Gets the position/order for a dimension value.
 * Returns undefined if no position is defined.
 */
export const getDimensionValuePosition = (
  value: DimensionValue
): number | undefined => {
  if (value.position === undefined) return undefined;
  return typeof value.position === "number" ? value.position : parseInt(value.position, 10);
};

/**
 * Gets the description for a dimension value if available.
 */
export const getDimensionValueDescription = (
  value: DimensionValue
): string | undefined => {
  return value.description;
};

// ============================================================================
// Dimension Lookup Helpers
// ============================================================================

/**
 * Finds a dimension value by its identifier (IRI).
 */
export const findDimensionValueById = (
  dimension: Dimension | undefined,
  id: string
): DimensionValue | undefined => {
  if (!dimension?.values) return undefined;
  return dimension.values.find((v) => v.value === id);
};

/**
 * Finds a dimension value by its label.
 */
export const findDimensionValueByLabel = (
  dimension: Dimension | undefined,
  label: string
): DimensionValue | undefined => {
  if (!dimension?.values) return undefined;
  return dimension.values.find((v) => v.label === label);
};

/**
 * Finds a dimension value by either label or identifier.
 * This is useful when the exact format of the stored value is unknown.
 */
export const findDimensionValue = (
  dimension: Dimension | undefined,
  labelOrId: string
): DimensionValue | undefined => {
  if (!dimension?.values) return undefined;
  return dimension.values.find(
    (v) => v.label === labelOrId || v.value === labelOrId
  );
};

// ============================================================================
// Label Resolution
// ============================================================================

/**
 * Creates a label resolver function for a dimension.
 * The returned function converts raw observation values to display labels.
 */
export const createLabelResolver = (
  dimension: Dimension | undefined,
  options?: { useAbbreviations?: boolean }
): ((value: string) => string) => {
  if (!dimension?.values || dimension.values.length === 0) {
    return (value: string) => value;
  }

  // Build lookup map for efficient resolution
  const labelMap = new Map<string, string>();
  for (const v of dimension.values) {
    const displayLabel = getDimensionValueLabel(v, options);
    // Map both value and label to the display label for flexible matching
    labelMap.set(String(v.value), displayLabel);
    labelMap.set(v.label, displayLabel);
  }

  return (value: string) => labelMap.get(value) ?? value;
};

/**
 * Creates an abbreviation resolver function for a dimension.
 * Returns abbreviation (alternateName) if available, otherwise the label.
 */
export const createAbbreviationResolver = (
  dimension: Dimension | undefined
): ((value: string) => string) => {
  return createLabelResolver(dimension, { useAbbreviations: true });
};

// ============================================================================
// Observation Value Extraction
// ============================================================================

/**
 * Creates a getter function that extracts a dimension value from an observation.
 */
export const createDimensionGetter = (
  componentId: string | undefined
): ((d: Observation) => string) => {
  if (!componentId) {
    return () => "";
  }
  return (d: Observation) => String(d[componentId] ?? "");
};

/**
 * Creates a getter function that extracts and resolves a dimension label from an observation.
 */
export const createDimensionLabelGetter = (
  componentId: string | undefined,
  dimension: Dimension | undefined,
  options?: { useAbbreviations?: boolean }
): ((d: Observation) => string) => {
  const getValue = createDimensionGetter(componentId);
  const resolveLabel = createLabelResolver(dimension, options);

  return (d: Observation) => resolveLabel(getValue(d));
};

// ============================================================================
// Dimension Properties
// ============================================================================

/**
 * Gets the label for a dimension, with optional unit.
 */
export const getDimensionLabel = (
  dimension: Dimension | undefined,
  options?: { includeUnit?: boolean }
): string => {
  if (!dimension) return "";

  if (options?.includeUnit && dimension.unit) {
    return `${dimension.label} (${dimension.unit})`;
  }
  return dimension.label;
};

/**
 * Gets all unique values from a dimension.
 */
export const getDimensionUniqueValues = (
  dimension: Dimension | undefined
): string[] => {
  if (!dimension?.values) return [];
  return dimension.values.map((v) => String(v.value));
};

/**
 * Gets all unique labels from a dimension.
 */
export const getDimensionUniqueLabels = (
  dimension: Dimension | undefined,
  options?: { useAbbreviations?: boolean }
): string[] => {
  if (!dimension?.values) return [];
  return dimension.values.map((v) => getDimensionValueLabel(v, options));
};

// ============================================================================
// Dimension Domain Building
// ============================================================================

/**
 * Builds a sorted domain (list of unique values) for a dimension.
 * Uses dimension value ordering when available.
 */
export const buildDimensionDomain = (
  observations: Observation[],
  getValue: (d: Observation) => string,
  dimension?: Dimension
): string[] => {
  const uniqueValues = Array.from(new Set(observations.map(getValue)));

  if (!dimension?.values || dimension.values.length === 0) {
    return uniqueValues;
  }

  // Build order map from dimension values
  const orderMap = new Map<string, number>();
  dimension.values.forEach((v, idx) => {
    const position = v.position !== undefined
      ? (typeof v.position === "number" ? v.position : parseInt(v.position, 10))
      : undefined;
    const order = position ?? idx;
    orderMap.set(String(v.value), order);
    orderMap.set(v.label, order);
  });

  // Sort using dimension ordering
  return uniqueValues.sort((a, b) => {
    const orderA = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER;
    const orderB = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
};

// ============================================================================
// Dimension Type Utilities (Re-exported for convenience)
// ============================================================================

export {
  isDimension,
  isNominalDimension,
  isOrdinalDimension,
  isTemporalDimension,
  isTemporalEntityDimension,
  isTemporalOrdinalDimension,
  isGeoDimension,
  isGeoCoordinatesDimension,
  isGeoShapesDimension,
};

// ============================================================================
// Dimension Classification
// ============================================================================

export type DimensionType =
  | "nominal"
  | "ordinal"
  | "temporal"
  | "temporal-entity"
  | "temporal-ordinal"
  | "geo"
  | "geo-coordinates"
  | "geo-shapes"
  | "unknown";

/**
 * Gets the classification type of a dimension.
 */
export const getDimensionType = (dimension: Dimension): DimensionType => {
  if (isGeoCoordinatesDimension(dimension)) return "geo-coordinates";
  if (isGeoShapesDimension(dimension)) return "geo-shapes";
  if (isGeoDimension(dimension)) return "geo";
  if (isTemporalOrdinalDimension(dimension)) return "temporal-ordinal";
  if (isTemporalEntityDimension(dimension)) return "temporal-entity";
  if (isTemporalDimension(dimension)) return "temporal";
  if (isOrdinalDimension(dimension)) return "ordinal";
  if (isNominalDimension(dimension)) return "nominal";
  return "unknown";
};

/**
 * Checks if a dimension supports time-based filtering.
 */
export const canFilterByTime = (dimension: Dimension): boolean => {
  const type = getDimensionType(dimension);
  return (
    type === "temporal" ||
    type === "temporal-entity" ||
    type === "temporal-ordinal"
  );
};

/**
 * Checks if a dimension supports multi-value filtering.
 */
export const canFilterByMultipleValues = (dimension: Dimension): boolean => {
  const type = getDimensionType(dimension);
  return type === "nominal" || type === "ordinal";
};

// ============================================================================
// Dimension Value Map Builders
// ============================================================================

/**
 * Builds a map from observation dimension values to their full DimensionValue objects.
 * Useful for looking up metadata (color, position, etc.) from observation values.
 */
export const buildDimensionValueMap = (
  dimension: Dimension | undefined
): Map<string, DimensionValue> => {
  const map = new Map<string, DimensionValue>();

  if (!dimension?.values) return map;

  for (const v of dimension.values) {
    // Map both value (IRI) and label to the DimensionValue
    map.set(String(v.value), v);
    map.set(v.label, v);
  }

  return map;
};

/**
 * Builds a color map from dimension values if colors are defined.
 */
export const buildDimensionColorMap = (
  dimension: Dimension | undefined
): Map<string, string> => {
  const map = new Map<string, string>();

  if (!dimension?.values) return map;

  for (const v of dimension.values) {
    if (v.color) {
      map.set(String(v.value), v.color);
      map.set(v.label, v.color);
    }
  }

  return map;
};
