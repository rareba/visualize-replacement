/**
 * PowerBI-Style Field Wells
 *
 * Visual dropzones for configuring chart data mappings.
 * Each well represents a different encoding channel (Axis, Values, Legend, etc.)
 *
 * @see https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-field-list
 */

import { Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import { getChartSpec, EncodingSpec } from "@/charts/chart-config-ui-options";
import { ChartConfig } from "@/config-types";
import { getFieldLabel } from "@/configurator/components/field-i18n";
import { getComponentLabel } from "@/configurator/components/ui-helpers";
import { Component, Dimension, isMeasure, Measure } from "@/domain/data";
import { Icon, IconName } from "@/icons";
import { AggregationBadge, AggregationType } from "./AggregationSelector";

export interface FieldWellsProps {
  chartConfig: ChartConfig;
  dimensions?: Dimension[];
  measures?: Measure[];
  onFieldClick?: (field: string) => void;
  onFieldDrop?: (wellField: string, droppedComponent: { id: string; label: string; type: string }) => void;
  activeField?: string;
}

// Icons for different field types
const FIELD_ICONS: Record<string, IconName> = {
  x: "xAxis",
  y: "yAxis",
  segment: "color",
  color: "swatch",
  size: "size",
  baseLayer: "map",
  areaLayer: "mapRegions",
  symbolLayer: "mapMarker",
  animation: "animation",
};

export const FieldWells = ({
  chartConfig,
  dimensions = [],
  measures = [],
  onFieldClick,
  onFieldDrop,
  activeField,
}: FieldWellsProps) => {
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const chartSpec = getChartSpec(chartConfig);
  const components = useMemo(
    () => [...dimensions, ...measures],
    [dimensions, measures]
  );

  // Get the visible encodings for this chart type, split into required and optional
  const { requiredEncodings, optionalEncodings, optionalWithValues } = useMemo(() => {
    const visible = chartSpec.encodings.filter((enc) => !enc.hide);
    const required = visible.filter((enc) => !enc.optional);
    const optional = visible.filter((enc) => enc.optional);

    // Check which optional fields have values assigned
    const withValues = optional.filter((enc) => {
      const fields = chartConfig.fields as any;
      const fieldConfig = fields[enc.field];
      if (!fieldConfig) return false;
      return fieldConfig.componentId || fieldConfig.componentIds?.length > 0 || fieldConfig.measureId;
    });

    return {
      requiredEncodings: required,
      optionalEncodings: optional,
      optionalWithValues: withValues,
    };
  }, [chartSpec.encodings, chartConfig.fields]);

  // Determine which optional fields to show
  const visibleOptionalEncodings = useMemo(() => {
    if (showOptionalFields) {
      return optionalEncodings;
    }
    // Always show optional fields that have values
    return optionalWithValues;
  }, [showOptionalFields, optionalEncodings, optionalWithValues]);

  const hiddenOptionalCount = optionalEncodings.length - visibleOptionalEncodings.length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography
        variant="overline"
        sx={{
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "text.secondary",
          px: 1,
        }}
      >
        <Trans id="powerbi.field-wells.title">Build visual</Trans>
      </Typography>

      {/* Required fields - always visible */}
      {requiredEncodings.map((encoding) => (
        <FieldWell
          key={encoding.field}
          encoding={encoding}
          chartConfig={chartConfig}
          components={components}
          isActive={activeField === encoding.field}
          onClick={() => onFieldClick?.(encoding.field)}
          onDrop={(droppedComponent) => onFieldDrop?.(encoding.field, droppedComponent)}
        />
      ))}

      {/* Optional fields that have values (always show) */}
      {!showOptionalFields && optionalWithValues.map((encoding) => (
        <FieldWell
          key={encoding.field}
          encoding={encoding}
          chartConfig={chartConfig}
          components={components}
          isActive={activeField === encoding.field}
          onClick={() => onFieldClick?.(encoding.field)}
          onDrop={(droppedComponent) => onFieldDrop?.(encoding.field, droppedComponent)}
        />
      ))}

      {/* All optional fields (when expanded) */}
      <Collapse in={showOptionalFields}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {optionalEncodings.map((encoding) => (
            <FieldWell
              key={encoding.field}
              encoding={encoding}
              chartConfig={chartConfig}
              components={components}
              isActive={activeField === encoding.field}
              onClick={() => onFieldClick?.(encoding.field)}
              onDrop={(droppedComponent) => onFieldDrop?.(encoding.field, droppedComponent)}
            />
          ))}
        </Box>
      </Collapse>

      {/* Add optional field button */}
      {optionalEncodings.length > 0 && (
        <Button
          variant="text"
          size="sm"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          startIcon={
            <Icon
              name={showOptionalFields ? "chevronUp" : "plus"}
              size={12}
            />
          }
          sx={{
            alignSelf: "flex-start",
            fontSize: "0.7rem",
            textTransform: "none",
            color: "text.secondary",
            fontWeight: 400,
            py: 0.25,
            px: 0.5,
            minWidth: "auto",
            "&:hover": {
              backgroundColor: "transparent",
              color: "primary.main",
            },
          }}
        >
          {showOptionalFields ? (
            <Trans id="powerbi.field-wells.hideOptional">Hide optional</Trans>
          ) : hiddenOptionalCount > 0 ? (
            <Trans id="powerbi.field-wells.addField">
              Add field ({hiddenOptionalCount} available)
            </Trans>
          ) : (
            <Trans id="powerbi.field-wells.showOptional">Show optional fields</Trans>
          )}
        </Button>
      )}
    </Box>
  );
};

/**
 * Individual field well - represents one encoding channel
 */
const FieldWell = ({
  encoding,
  chartConfig,
  components,
  isActive,
  onClick,
  onDrop,
}: {
  encoding: EncodingSpec;
  chartConfig: ChartConfig;
  components: Component[];
  isActive: boolean;
  onClick: () => void;
  onDrop?: (droppedComponent: { id: string; label: string; type: string }) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { field, optional } = encoding;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        const droppedComponent = JSON.parse(jsonData);
        onDrop?.(droppedComponent);
      }
    } catch (err) {
      console.error("Failed to parse dropped field data:", err);
    }
  };

  // Get the current component(s) assigned to this field
  const assignedComponents = useMemo(() => {
    const fields = chartConfig.fields as any;
    const fieldConfig = fields[field];
    if (!fieldConfig) return [];

    // Handle different field structures
    const componentIds: string[] = [];
    if (fieldConfig.componentId) {
      componentIds.push(fieldConfig.componentId);
    }
    if (fieldConfig.componentIds) {
      componentIds.push(...fieldConfig.componentIds);
    }
    if (fieldConfig.measureId) {
      componentIds.push(fieldConfig.measureId);
    }

    return componentIds
      .map((id) => components.find((c) => c.id === id))
      .filter(Boolean) as Component[];
  }, [chartConfig.fields, field, components]);

  const label = getFieldLabel(`${chartConfig.chartType}.${field}`);
  const icon = FIELD_ICONS[field] || "categories";
  const hasValue = assignedComponents.length > 0;
  const isRequired = !optional;

  return (
    <Box
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        p: 1.5,
        borderRadius: 1,
        border: isDragOver ? 2 : 1,
        borderStyle: isDragOver ? "dashed" : "solid",
        borderColor: isDragOver
          ? "primary.main"
          : isActive
          ? "primary.main"
          : hasValue
          ? "divider"
          : (theme) => alpha(theme.palette.divider, 0.5),
        backgroundColor: isDragOver
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : isActive
          ? (theme) => alpha(theme.palette.primary.main, 0.04)
          : hasValue
          ? "background.paper"
          : (theme) => alpha(theme.palette.action.hover, 0.02),
        cursor: "pointer",
        transition: "all 0.15s ease-in-out",
        "&:hover": {
          borderColor: "primary.light",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      {/* Well header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon
          name={icon}
          size={16}
          color={
            isActive
              ? "var(--mui-palette-primary-main)"
              : "var(--mui-palette-text-secondary)"
          }
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "primary.main" : "text.primary",
            flexGrow: 1,
          }}
        >
          {label}
          {isRequired && !hasValue && (
            <Typography
              component="span"
              sx={{ color: "error.main", ml: 0.5 }}
            >
              *
            </Typography>
          )}
        </Typography>
        {isActive && (
          <Icon
            name="chevronRight"
            size={14}
            color="var(--mui-palette-primary-main)"
          />
        )}
      </Box>

      {/* Assigned components (field pills) */}
      {hasValue ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            mt: 0.5,
          }}
        >
          {assignedComponents.map((comp) => (
            <FieldPill key={comp.id} component={comp} />
          ))}
        </Box>
      ) : (
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            fontStyle: "italic",
            fontSize: "0.7rem",
          }}
        >
          {optional ? (
            <Trans id="powerbi.field-well.optional">Optional</Trans>
          ) : (
            <Trans id="powerbi.field-well.add-field">Add a field</Trans>
          )}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Field pill - shows an assigned component with aggregation badge for measures
 */
const FieldPill = ({
  component,
  aggregation = "sum",
}: {
  component: Component;
  aggregation?: AggregationType;
}) => {
  const showAggregation = isMeasure(component);

  return (
    <Chip
      size="small"
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <span>{getComponentLabel(component)}</span>
          {showAggregation && <AggregationBadge aggregation={aggregation} />}
        </Box>
      }
      deleteIcon={<Icon name="close" size={12} />}
      sx={{
        height: showAggregation ? 28 : 24,
        fontSize: "0.7rem",
        fontWeight: 500,
        backgroundColor: (theme) =>
          isMeasure(component)
            ? alpha(theme.palette.success.main, 0.1)
            : alpha(theme.palette.primary.main, 0.1),
        color: isMeasure(component) ? "success.dark" : "primary.main",
        borderRadius: 0.5,
        "& .MuiChip-label": {
          px: 1,
        },
        "& .MuiChip-deleteIcon": {
          color: isMeasure(component) ? "success.dark" : "primary.main",
          "&:hover": {
            color: isMeasure(component) ? "success.main" : "primary.dark",
          },
        },
      }}
    />
  );
};

export default FieldWells;
