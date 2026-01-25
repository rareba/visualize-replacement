/**
 * Schema Options Panel
 *
 * Integration layer between SchemaFormConfigurator and the existing
 * configurator state management. This component bridges JSON schema forms
 * with the dispatch-based state updates.
 */

"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import { memo, useCallback, useMemo } from "react";

import { getChartSchema, type ChartType } from "@/configurator/schemas/base-schema";
import { SchemaFormConfigurator } from "./SchemaFormConfigurator";
import {
  isConfiguring,
  useConfiguratorState,
} from "@/configurator/configurator-state";
import { getChartConfig } from "@/config-utils";
import { useLocale } from "@/locales/use-locale";
import type { Dimension, Measure } from "@/domain/data";
import type { ChartConfig, GenericField } from "@/config-types";

// ============================================================================
// Types
// ============================================================================

export interface SchemaOptionsPanelProps {
  /** Available dimensions from data cube */
  dimensions: Dimension[];
  /** Available measures from data cube */
  measures: Measure[];
  /** Whether data is still loading */
  loading?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert chart config fields to form data format
 */
const configToFormData = (
  chartConfig: ChartConfig
): Record<string, unknown> => {
  const { fields } = chartConfig;
  const formData: Record<string, unknown> = {};

  // Copy all fields
  Object.entries(fields).forEach(([key, value]) => {
    if (value && typeof value === "object") {
      formData[key] = { ...value };
    }
  });

  return formData;
};

/**
 * Find changed fields between old and new form data
 */
const findChanges = (
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Array<{ field: string; path: string; value: unknown }> => {
  const changes: Array<{ field: string; path: string; value: unknown }> = [];

  const compareObjects = (
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    fieldPath: string
  ) => {
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    allKeys.forEach((key) => {
      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];

      if (oldVal !== newVal) {
        if (
          typeof oldVal === "object" &&
          typeof newVal === "object" &&
          oldVal !== null &&
          newVal !== null
        ) {
          compareObjects(
            oldVal as Record<string, unknown>,
            newVal as Record<string, unknown>,
            fieldPath ? `${fieldPath}.${key}` : key
          );
        } else {
          const [field, ...pathParts] = (fieldPath ? `${fieldPath}.${key}` : key).split(".");
          changes.push({
            field,
            path: pathParts.join(".") || key,
            value: newVal,
          });
        }
      }
    });
  };

  compareObjects(oldData, newData, "");
  return changes;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Schema Options Panel
 *
 * Renders a schema-based form for configuring chart fields and options.
 * Automatically dispatches state updates when form values change.
 *
 * @example
 * ```tsx
 * <SchemaOptionsPanel
 *   dimensions={dimensions}
 *   measures={measures}
 *   loading={fetching}
 * />
 * ```
 */
export const SchemaOptionsPanel = memo(
  ({ dimensions, measures, loading }: SchemaOptionsPanelProps) => {
    const [state, dispatch] = useConfiguratorState(isConfiguring);
    const chartConfig = getChartConfig(state);
    const locale = useLocale();

    // Convert current config to form data
    const formData = useMemo(
      () => configToFormData(chartConfig),
      [chartConfig]
    );

    // Get chart type for schema lookup
    const chartType = chartConfig.chartType as ChartType;

    // Handle form changes
    const handleChange = useCallback(
      (newFormData: Record<string, unknown>) => {
        // Find what changed
        const changes = findChanges(formData, newFormData);

        changes.forEach(({ field, path, value }) => {
          // Handle componentId changes (field selection)
          if (path === "componentId" || path === "") {
            const component = [...dimensions, ...measures].find(
              (c) => c.id === value
            );

            if (component) {
              dispatch({
                type: "CHART_FIELD_CHANGED",
                value: {
                  locale,
                  field: field as any,
                  componentId: value as string,
                  selectedValues: [],
                },
              });
            }
          } else {
            // Handle other field updates (options like showValues, sorting, etc.)
            dispatch({
              type: "CHART_FIELD_UPDATED",
              value: {
                locale,
                field: field as any,
                path,
                value,
              },
            });
          }
        });
      },
      [dispatch, locale, formData, dimensions, measures]
    );

    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    return (
      <Box sx={{ height: "100%" }}>
        <SchemaFormConfigurator
          chartType={chartType}
          formData={formData}
          dimensions={dimensions}
          measures={measures}
          onChange={handleChange}
        />
      </Box>
    );
  }
);

SchemaOptionsPanel.displayName = "SchemaOptionsPanel";

export default SchemaOptionsPanel;
