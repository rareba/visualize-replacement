/**
 * Filter Utilities
 *
 * Pure utility functions for filter data processing, sorting,
 * and color configuration helpers.
 */

import { ascending, max as d3Max } from "d3-array";

import { ChartConfig, ColorMapping, isColorInConfig } from "@/config-types";
import { Component, HierarchyValue } from "@/domain/data";

// ============================================================================
// Hierarchy Utilities
// ============================================================================

/**
 * Splits a parent path string into individual parent labels.
 */
export const explodeParents = (parents: string): string[] => {
  return parents.length > 0 ? parents.split(" > ") : [];
};

/**
 * Groups hierarchy nodes by their parent path string.
 */
export const groupByParent = (node: { parents: HierarchyValue[] }): string => {
  return node.parents.map((p) => p.label).join(" > ");
};

/**
 * Sorts two hierarchy values by depth (ascending) then by label.
 */
export const sortFilterValue = (
  a: HierarchyValue,
  b: HierarchyValue
): number => {
  return (
    ascending(a.depth, b.depth) ||
    ascending(a.label.toLowerCase(), b.label.toLowerCase())
  );
};

/**
 * Sorts an array of hierarchy values.
 */
export const sortFilterValues = (values: HierarchyValue[]): HierarchyValue[] => {
  return [...values].sort(sortFilterValue);
};

// ============================================================================
// Color Configuration Utilities
// ============================================================================

/**
 * Gets the color configuration from a chart config.
 */
export const getColorConfig = (chartConfig: ChartConfig) => {
  return isColorInConfig(chartConfig) ? chartConfig.fields.color : undefined;
};

/**
 * Checks if a dimension has color mapping enabled.
 */
export const getHasColorMapping = ({
  colorConfig,
  colorComponent,
  filterDimensionId,
}: {
  colorConfig?: ReturnType<typeof getColorConfig>;
  colorComponent?: Component;
  filterDimensionId: string;
}): boolean => {
  return !!(
    (colorConfig?.type === "single" ? false : colorConfig?.colorMapping) &&
    (colorComponent !== undefined
      ? filterDimensionId === colorComponent.id
      : false)
  );
};

/**
 * Builds the path to a color config property for state updates.
 */
export const getPathToColorConfigProperty = ({
  field,
  colorConfigPath,
  propertyPath,
}: {
  field: string;
  colorConfigPath?: string;
  propertyPath: string;
}): string => {
  return `fields["${field}"].${
    colorConfigPath !== undefined ? `${colorConfigPath}.` : ""
  }${propertyPath}`;
};

// ============================================================================
// Tree Validation Utilities
// ============================================================================

/**
 * Checks if children array is valid (non-empty array).
 */
export const validateChildren = (
  d: HierarchyValue[] | undefined
): d is HierarchyValue[] => {
  return Array.isArray(d) && d.length > 0;
};

/**
 * Recursively checks if any children are in the selected values set.
 */
export const areChildrenSelected = ({
  children,
  selectedValuesSet,
}: {
  children: HierarchyValue[] | undefined;
  selectedValuesSet: Set<string>;
}): boolean => {
  if (validateChildren(children)) {
    // O(1) lookup using Set instead of O(n) array search
    if (children.some((d) => selectedValuesSet.has(d.value))) {
      return true;
    } else {
      return children.some((d) =>
        areChildrenSelected({ children: d.children, selectedValuesSet })
      );
    }
  } else {
    return false;
  }
};

/**
 * Checks if a hierarchy option is selectable (has a value).
 */
export const isHierarchyOptionSelectable = (d: HierarchyValue): boolean => {
  return d.hasValue !== undefined ? Boolean(d.hasValue) : true;
};

// ============================================================================
// Depths Metadata Utilities
// ============================================================================

/**
 * Computes metadata about each depth level in a flat options array.
 */
export const computeDepthsMetadata = (
  flatOptions: HierarchyValue[]
): Record<number, { selectable: boolean; expandable: boolean }> => {
  const depthsMetadata = flatOptions.reduce(
    (acc, d) => {
      if (!acc[d.depth]) {
        acc[d.depth] = { selectable: false, expandable: false };
      }

      if (acc[d.depth].selectable === false && d.hasValue) {
        acc[d.depth].selectable = true;
      }

      if (
        acc[d.depth].expandable === false &&
        d.children &&
        d.children.length > 0
      ) {
        acc[d.depth].expandable = true;
      }

      return acc;
    },
    {} as Record<number, { selectable: boolean; expandable: boolean }>
  );

  const maxDepth = d3Max(flatOptions, (d) => d.depth);

  // Expand last level by default, so it's aligned correctly.
  if (maxDepth && maxDepth > 0) {
    depthsMetadata[maxDepth].expandable = true;
  }

  return depthsMetadata;
};
