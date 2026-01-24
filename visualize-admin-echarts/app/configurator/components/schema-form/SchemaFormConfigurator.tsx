/**
 * Schema Form Configurator
 *
 * A simplified chart configurator that uses react-jsonschema-form with MUI
 * to auto-generate the configuration UI from JSON schemas.
 *
 * Benefits:
 * - Much less code than custom PowerBI configurator
 * - Consistent UI across all chart types
 * - Easy to add new chart options (just update schema)
 * - Validation built-in from schema
 */

"use client";

import Form from "@rjsf/mui";
import type { IChangeEvent } from "@rjsf/core";
import type { UiSchema, FieldTemplateProps, ObjectFieldTemplateProps, WidgetProps } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { Box, Paper, Typography, Tabs, Tab, Divider } from "@mui/material";
import { memo, useCallback, useMemo, useState } from "react";

import { getChartSchema, type ChartType } from "@/configurator/schemas/base-schema";
import type { Dimension, Measure } from "@/domain/data";

// ============================================================================
// Types
// ============================================================================

export interface SchemaFormConfiguratorProps {
  /** Current chart type */
  chartType: ChartType;
  /** Current field configuration */
  formData: Record<string, unknown>;
  /** Available dimensions from data cube */
  dimensions: Dimension[];
  /** Available measures from data cube */
  measures: Measure[];
  /** Callback when configuration changes */
  onChange: (data: Record<string, unknown>) => void;
  /** Optional title */
  title?: string;
}

// ============================================================================
// Custom Widgets
// ============================================================================

/**
 * Custom select widget that shows available data fields
 */
const FieldSelectWidget = ({
  dimensions,
  measures,
}: {
  dimensions: Dimension[];
  measures: Measure[];
}) => {
  return function SelectWidget(props: WidgetProps) {
    const { id, value, onChange, label, required } = props;

    // Determine if this field expects a dimension or measure
    const fieldName = id.split("_").pop() || "";
    const isDimensionField = ["x", "segment", "y"].includes(fieldName);
    const isMeasureField = ["y", "size"].includes(fieldName);

    // Get available options
    const options: Array<{ value: string; label: string }> = [];

    if (isDimensionField) {
      dimensions.forEach((dim) => {
        options.push({
          value: dim.id,
          label: dim.label || dim.id,
        });
      });
    }

    if (isMeasureField) {
      measures.forEach((measure) => {
        options.push({
          value: measure.id,
          label: measure.label || measure.id,
        });
      });
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
          {required && " *"}
        </Typography>
        <select
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
            backgroundColor: "white",
          }}
        >
          <option value="">Select a field...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Box>
    );
  };
};

// ============================================================================
// Custom Templates
// ============================================================================

/**
 * Custom field template for cleaner layout
 */
const CustomFieldTemplate = (props: FieldTemplateProps) => {
  const { classNames, description, errors, help, children } = props;

  return (
    <Box className={classNames} sx={{ mb: 2 }}>
      {children}
      {description && (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      )}
      {errors}
      {help}
    </Box>
  );
};

/**
 * Custom object field template for nested objects
 */
const CustomObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const { title, description, properties } = props;

  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>
      )}
      <Box sx={{ pl: 2, borderLeft: "2px solid #e0e0e0" }}>
        {properties.map((prop) => prop.content)}
      </Box>
    </Box>
  );
};

// ============================================================================
// Component
// ============================================================================

/**
 * Schema Form Configurator
 *
 * Uses @rjsf/mui to generate chart configuration forms from JSON schemas.
 *
 * @example
 * ```tsx
 * <SchemaFormConfigurator
 *   chartType="column"
 *   formData={chartConfig.fields}
 *   dimensions={dimensions}
 *   measures={measures}
 *   onChange={(fields) => updateChartConfig({ fields })}
 * />
 * ```
 */
export const SchemaFormConfigurator = memo(
  ({
    chartType,
    formData,
    dimensions,
    measures,
    onChange,
    title,
  }: SchemaFormConfiguratorProps) => {
    const [activeTab, setActiveTab] = useState(0);

    // Get schema for current chart type
    const { schema, uiSchema } = useMemo(
      () => getChartSchema(chartType),
      [chartType]
    );

    // Create custom widgets with available fields
    const widgets = useMemo(
      () => ({
        SelectWidget: FieldSelectWidget({ dimensions, measures }),
      }),
      [dimensions, measures]
    );

    // Handle form changes
    const handleChange = useCallback(
      (e: IChangeEvent) => {
        if (e.formData) {
          onChange(e.formData as Record<string, unknown>);
        }
      },
      [onChange]
    );

    // Enhanced UI schema with field options
    const enhancedUiSchema: UiSchema = useMemo(
      () => ({
        ...uiSchema,
        "ui:submitButtonOptions": {
          norender: true, // Hide submit button
        },
      }),
      [uiSchema]
    );

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          height: "100%",
          overflow: "auto",
          backgroundColor: "#fafafa",
        }}
      >
        {title && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {title}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 2 }}
        >
          <Tab label="Fields" />
          <Tab label="Formatting" />
        </Tabs>

        {activeTab === 0 && (
          <Form
            schema={schema}
            uiSchema={enhancedUiSchema}
            formData={formData}
            validator={validator}
            onChange={handleChange}
            widgets={widgets}
            templates={{
              FieldTemplate: CustomFieldTemplate,
              ObjectFieldTemplate: CustomObjectFieldTemplate,
            }}
            liveValidate
          />
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Formatting options coming soon...
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }
);

SchemaFormConfigurator.displayName = "SchemaFormConfigurator";

export default SchemaFormConfigurator;
