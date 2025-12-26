/**
 * EChartsVisualization - A drop-in replacement for the D3-based chart visualizations
 *
 * This component uses the same data fetching as the original charts but renders
 * using ECharts directly, bypassing the complex D3 state management.
 */

import { Box, Typography } from "@mui/material";
import { memo, useMemo, useEffect } from "react";

import { SimpleEChartsChart, SimpleChartType } from "./SimpleEChartsChart";
import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { ChartProps, VisualizationProps } from "@/charts/shared/chart-props";
import { ChartConfig } from "@/config-types";
import { Dimension, Measure } from "@/domain/data";

// Map config chart types to simple chart types
function mapChartType(chartType: ChartConfig["chartType"]): SimpleChartType {
  switch (chartType) {
    case "column":
      return "column";
    case "bar":
      return "bar";
    case "line":
      return "line";
    case "area":
      return "area";
    case "pie":
      return "pie";
    case "scatterplot":
      return "scatter";
    default:
      return "column";
  }
}

// Extract field IDs from chart config - handles various chart config structures
function getFieldIds(chartConfig: ChartConfig): {
  xField: string;
  yField: string;
  segmentField?: string;
} {
  const fields = chartConfig.fields as Record<string, unknown>;

  let xField = "";
  let yField = "";
  let segmentField: string | undefined;

  // Handle x field
  if ("x" in fields && fields.x) {
    const xConfig = fields.x as { componentId?: string };
    xField = xConfig.componentId || "";
  }

  // Handle y field - can be either simple or complex (with componentId inside)
  if ("y" in fields && fields.y) {
    const yConfig = fields.y as { componentId?: string };
    yField = yConfig.componentId || "";
  }

  // Handle segment field
  if ("segment" in fields && fields.segment) {
    const segmentConfig = fields.segment as { componentId?: string };
    segmentField = segmentConfig.componentId || undefined;
  }

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("[EChartsVisualization] Chart config fields:", {
      chartType: chartConfig.chartType,
      xField,
      yField,
      segmentField,
      rawFields: fields,
    });
  }

  return { xField, yField, segmentField };
}

interface EChartsChartProps extends ChartProps<ChartConfig> {
  height?: number;
}

const EChartsChart = memo((props: EChartsChartProps) => {
  const {
    chartConfig,
    observations,
    dimensions,
    measures,
    height = 400
  } = props;

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[EChartsChart] Rendering with:", {
        chartType: chartConfig.chartType,
        observationCount: observations?.length || 0,
        dimensionCount: dimensions?.length || 0,
        measureCount: measures?.length || 0,
      });
    }
  }, [chartConfig.chartType, observations, dimensions, measures]);

  const chartType = mapChartType(chartConfig.chartType);
  const { xField, yField, segmentField } = getFieldIds(chartConfig);

  // Get axis labels from dimensions/measures
  const xAxisLabel = useMemo(() => {
    const dim = dimensions?.find((d: Dimension) => d.id === xField);
    return dim?.label || xField || "X-Axis";
  }, [dimensions, xField]);

  const yAxisLabel = useMemo(() => {
    const measure = measures?.find((m: Measure) => m.id === yField);
    if (measure) {
      return measure.unit ? `${measure.label} (${measure.unit})` : measure.label;
    }
    return yField || "Y-Axis";
  }, [measures, yField]);

  // If no observations, show loading or empty state
  if (!observations || observations.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height,
          width: "100%",
          backgroundColor: "#f9f9f9",
          borderRadius: 1,
        }}
      >
        <Typography color="textSecondary">
          Loading data...
        </Typography>
      </Box>
    );
  }

  // If no valid fields, show a message
  if (!xField || !yField) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height,
          width: "100%",
          backgroundColor: "#fff3cd",
          borderRadius: 1,
          p: 2,
        }}
      >
        <Typography color="warning.dark" variant="body2">
          Chart configuration incomplete
        </Typography>
        <Typography color="textSecondary" variant="caption" sx={{ mt: 1 }}>
          X Field: {xField || "not set"} | Y Field: {yField || "not set"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: height,
        minHeight: 300,
      }}
    >
      <SimpleEChartsChart
        observations={observations}
        xField={xField}
        yField={yField}
        segmentField={segmentField}
        chartType={chartType}
        height={height}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        showLegend={!!segmentField}
        showTooltip={true}
      />
    </Box>
  );
});

EChartsChart.displayName = "EChartsChart";

/**
 * Generic ECharts visualization component that works with any chart type
 */
export const EChartsVisualization = (props: VisualizationProps<ChartConfig>) => {
  return <ChartDataWrapper {...props} Component={EChartsChart} />;
};

/**
 * Type-specific visualization components for drop-in replacement
 */
export const EChartsColumnVisualization = EChartsVisualization;
export const EChartsBarsVisualization = EChartsVisualization;
export const EChartsLinesVisualization = EChartsVisualization;
export const EChartsAreasVisualization = EChartsVisualization;
export const EChartsPieVisualization = EChartsVisualization;
export const EChartsScatterplotVisualization = EChartsVisualization;
