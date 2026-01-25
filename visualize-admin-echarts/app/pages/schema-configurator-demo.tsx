/**
 * Schema Configurator Demo Page
 *
 * Demonstrates the new schema-based configurator with live chart preview.
 * Access at /schema-configurator-demo
 */

import { Box, Grid, Paper, Typography, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useState, useMemo } from "react";

import { SchemaFormConfigurator } from "@/configurator/components/schema-form";
import { type ChartType } from "@/configurator/schemas/base-schema";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import type { Dimension, Measure } from "@/domain/data";
import type { EChartsOption } from "echarts";

// ============================================================================
// Demo Data
// ============================================================================

/**
 * Sample dimensions for demo
 */
const demoDimensions: Dimension[] = [
  { id: "category", label: "Category", __typename: "NominalDimension" } as Dimension,
  { id: "year", label: "Year", __typename: "TemporalDimension" } as Dimension,
  { id: "region", label: "Region", __typename: "NominalDimension" } as Dimension,
  { id: "product", label: "Product", __typename: "NominalDimension" } as Dimension,
];

/**
 * Sample measures for demo
 */
const demoMeasures: Measure[] = [
  { id: "value", label: "Value" } as Measure,
  { id: "count", label: "Count" } as Measure,
  { id: "revenue", label: "Revenue" } as Measure,
  { id: "quantity", label: "Quantity" } as Measure,
];

/**
 * Sample data for demo charts
 */
const demoData = [
  { category: "A", year: "2020", value: 100, region: "North" },
  { category: "B", year: "2020", value: 150, region: "North" },
  { category: "C", year: "2020", value: 80, region: "North" },
  { category: "A", year: "2021", value: 120, region: "South" },
  { category: "B", year: "2021", value: 180, region: "South" },
  { category: "C", year: "2021", value: 95, region: "South" },
  { category: "A", year: "2022", value: 140, region: "East" },
  { category: "B", year: "2022", value: 200, region: "East" },
  { category: "C", year: "2022", value: 110, region: "West" },
];

// ============================================================================
// Chart Type Options
// ============================================================================

const chartTypes: ChartType[] = [
  "column",
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "scatterplot",
  "radar",
];

// ============================================================================
// ECharts Option Generator
// ============================================================================

/**
 * Generate a simple ECharts option from the form data
 * This is a simplified version - the real adapters are more sophisticated
 */
const generateEChartsOption = (
  chartType: ChartType,
  formData: Record<string, unknown>,
  data: typeof demoData
): EChartsOption => {
  const xField = (formData.x as { componentId?: string })?.componentId || "category";
  const yField = (formData.y as { componentId?: string })?.componentId || "value";

  // Get unique categories
  const categories = [...new Set(data.map((d) => d[xField as keyof typeof d]))];

  // Get series data
  const seriesData = categories.map((cat) => {
    const item = data.find((d) => d[xField as keyof typeof d] === cat);
    return item ? Number(item[yField as keyof typeof item]) : 0;
  });

  const baseOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
  };

  switch (chartType) {
    case "column":
      return {
        ...baseOption,
        xAxis: { type: "category", data: categories as string[] },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: seriesData }],
      };

    case "bar":
      return {
        ...baseOption,
        xAxis: { type: "value" },
        yAxis: { type: "category", data: categories as string[] },
        series: [{ type: "bar", data: seriesData }],
      };

    case "line":
    case "area":
      return {
        ...baseOption,
        xAxis: { type: "category", data: categories as string[] },
        yAxis: { type: "value" },
        series: [
          {
            type: "line",
            data: seriesData,
            areaStyle: chartType === "area" ? {} : undefined,
          },
        ],
      };

    case "pie":
    case "donut":
      return {
        tooltip: { trigger: "item" },
        series: [
          {
            type: "pie",
            radius: chartType === "donut" ? ["40%", "70%"] : "70%",
            data: categories.map((cat, i) => ({
              name: String(cat),
              value: seriesData[i],
            })),
          },
        ],
      };

    case "radar":
      return {
        radar: {
          indicator: categories.map((cat) => ({ name: String(cat), max: 250 })),
        },
        series: [
          {
            type: "radar",
            data: [{ value: seriesData, name: "Data" }],
          },
        ],
      };

    case "scatterplot":
      return {
        ...baseOption,
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        series: [
          {
            type: "scatter",
            data: data.map((d, i) => [i * 10, d.value]),
          },
        ],
      };

    default:
      return {
        ...baseOption,
        xAxis: { type: "category", data: categories as string[] },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: seriesData }],
      };
  }
};

// ============================================================================
// Page Component
// ============================================================================

export default function SchemaConfiguratorDemo() {
  const [chartType, setChartType] = useState<ChartType>("column");
  const [formData, setFormData] = useState<Record<string, unknown>>({
    x: { componentId: "category" },
    y: { componentId: "value" },
    color: { type: "single", paletteId: "category10", color: "#006699" },
  });

  // Generate ECharts option from current configuration
  const chartOption = useMemo(
    () => generateEChartsOption(chartType, formData, demoData),
    [chartType, formData]
  );

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Schema-Based Configurator Demo
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        This demo shows how react-jsonschema-form can be used to auto-generate
        chart configuration UI from JSON schemas. The form on the left updates
        the chart preview on the right in real-time.
      </Typography>

      <Grid container spacing={3}>
        {/* Chart Type Selector */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as ChartType)}
              >
                {chartTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Configurator Panel */}
        <Grid item xs={12} md={4}>
          <SchemaFormConfigurator
            chartType={chartType}
            formData={formData}
            dimensions={demoDimensions}
            measures={demoMeasures}
            onChange={setFormData}
            title="Chart Configuration"
          />
        </Grid>

        {/* Chart Preview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Chart Preview
            </Typography>
            <Box sx={{ height: 400 }}>
              <EChartsWrapper
                option={chartOption}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Form Data Debug */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Current Configuration (Debug)
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                backgroundColor: "#f0f0f0",
                borderRadius: 1,
                overflow: "auto",
                fontSize: 12,
              }}
            >
              {JSON.stringify(formData, null, 2)}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
