/**
 * Schema Form Configurator
 *
 * A simplified chart configurator that uses react-jsonschema-form core
 * to auto-generate the configuration UI from JSON schemas.
 *
 * Benefits:
 * - Much less code than custom PowerBI configurator
 * - Consistent UI across all chart types
 * - Easy to add new chart options (just update schema)
 * - Validation built-in from schema
 */

"use client";

import Form from "@rjsf/core";
import type { IChangeEvent } from "@rjsf/core";
import type { UiSchema, FieldTemplateProps, ObjectFieldTemplateProps, WidgetProps, RegistryWidgetsType } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { Box, Paper, Typography, Tabs, Tab, Divider, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel } from "@mui/material";
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
// Custom MUI Widgets for @rjsf/core
// ============================================================================

/**
 * Custom text input widget using MUI TextField
 */
const TextWidget = (props: WidgetProps) => {
  const { id, value, onChange, label, required, disabled, readonly, placeholder } = props;
  return (
    <TextField
      id={id}
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      required={required}
      disabled={disabled || readonly}
      placeholder={placeholder}
      fullWidth
      size="small"
      sx={{ mb: 2 }}
    />
  );
};

/**
 * Custom select widget using MUI Select
 */
const SelectWidget = (props: WidgetProps) => {
  const { id, value, onChange, label, required, disabled, readonly, options } = props;
  const enumOptions = options?.enumOptions || [];

  return (
    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
      <InputLabel id={`${id}-label`}>{label}{required ? " *" : ""}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        disabled={disabled || readonly}
        label={`${label}${required ? " *" : ""}`}
      >
        <MenuItem value="">
          <em>Select...</em>
        </MenuItem>
        {enumOptions.map((opt: { value: string; label: string }) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/**
 * Custom checkbox widget using MUI Checkbox
 */
const CheckboxWidget = (props: WidgetProps) => {
  const { id, value, onChange, label, disabled, readonly } = props;
  return (
    <FormControlLabel
      control={
        <Checkbox
          id={id}
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled || readonly}
        />
      }
      label={label || ""}
      sx={{ mb: 1 }}
    />
  );
};

/**
 * Custom data field select widget that shows available dimensions/measures
 */
const createFieldSelectWidget = ({
  dimensions,
  measures,
}: {
  dimensions: Dimension[];
  measures: Measure[];
}) => {
  return function DataFieldSelectWidget(props: WidgetProps) {
    const { id, value, onChange, label, required, disabled, readonly } = props;

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
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id={`${id}-label`}>{label}{required ? " *" : ""}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
          disabled={disabled || readonly}
          label={`${label}${required ? " *" : ""}`}
        >
          <MenuItem value="">
            <em>Select a field...</em>
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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

    // Create custom widgets registry
    const widgets: RegistryWidgetsType = useMemo(
      () => ({
        TextWidget,
        SelectWidget,
        CheckboxWidget,
        // Override select for data field selection
        DataFieldSelectWidget: createFieldSelectWidget({ dimensions, measures }),
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
