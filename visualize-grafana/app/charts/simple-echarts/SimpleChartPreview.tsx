/**
 * SimpleChartPreview - A simplified chart preview component
 * that directly renders ECharts without the complex D3 state management.
 *
 * This component is designed to work with the existing data fetching
 * but provides its own simple rendering logic.
 */

import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Theme, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useMemo, useState } from "react";

import { Dimension, Measure, Observation } from "@/domain/data";

import { SimpleChartType, SimpleEChartsChart } from "./SimpleEChartsChart";

const useStyles = makeStyles((theme: Theme) => ({
  noDataBox: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: theme.shape.borderRadius,
  },
}));

export interface SimpleChartPreviewProps {
  /** Raw observation data */
  observations: Observation[];
  /** Available dimensions */
  dimensions: Dimension[];
  /** Available measures */
  measures: Measure[];
  /** Initial chart type */
  initialChartType?: SimpleChartType;
  /** Initial x field */
  initialXField?: string;
  /** Initial y field */
  initialYField?: string;
  /** Chart height */
  height?: number;
  /** Show controls */
  showControls?: boolean;
  /** On configuration change callback */
  onConfigChange?: (config: {
    chartType: SimpleChartType;
    xField: string;
    yField: string;
    segmentField?: string;
  }) => void;
}

const CHART_TYPE_OPTIONS: {
  value: SimpleChartType;
  label: string;
}[] = [
  { value: "column", label: "Column" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
];

export const SimpleChartPreview: React.FC<SimpleChartPreviewProps> = ({
  observations,
  dimensions,
  measures,
  initialChartType = "column",
  initialXField,
  initialYField,
  height = 400,
  showControls = true,
  onConfigChange,
}) => {
  const classes = useStyles();
  // Find default fields if not provided
  const defaultXField = useMemo(() => {
    if (initialXField) return initialXField;
    // Prefer temporal dimensions, then categorical
    const temporalDim = dimensions.find((d) => "timeUnit" in d);
    if (temporalDim) return temporalDim.id;
    return dimensions[0]?.id || "";
  }, [initialXField, dimensions]);

  const defaultYField = useMemo(() => {
    if (initialYField) return initialYField;
    return measures[0]?.id || "";
  }, [initialYField, measures]);

  // State
  const [chartType, setChartType] = useState<SimpleChartType>(initialChartType);
  const [xField, setXField] = useState<string>(defaultXField);
  const [yField, setYField] = useState<string>(defaultYField);
  const [segmentField, setSegmentField] = useState<string>("");

  // Get labels for axes
  const xAxisLabel = useMemo(() => {
    const dim = dimensions.find((d) => d.id === xField);
    return dim?.label || xField;
  }, [dimensions, xField]);

  const yAxisLabel = useMemo(() => {
    const measure = measures.find((m) => m.id === yField);
    return measure?.label || yField;
  }, [measures, yField]);

  // Handle chart type change
  const handleChartTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: SimpleChartType | null
  ) => {
    if (newType) {
      setChartType(newType);
      onConfigChange?.({
        chartType: newType,
        xField,
        yField,
        segmentField: segmentField || undefined,
      });
    }
  };

  // Handle field changes
  const handleXFieldChange = (value: string) => {
    setXField(value);
    onConfigChange?.({
      chartType,
      xField: value,
      yField,
      segmentField: segmentField || undefined,
    });
  };

  const handleYFieldChange = (value: string) => {
    setYField(value);
    onConfigChange?.({
      chartType,
      xField,
      yField: value,
      segmentField: segmentField || undefined,
    });
  };

  const handleSegmentFieldChange = (value: string) => {
    setSegmentField(value);
    onConfigChange?.({
      chartType,
      xField,
      yField,
      segmentField: value || undefined,
    });
  };

  // Render no data state
  if (!observations || observations.length === 0) {
    return (
      <Box className={classes.noDataBox} sx={{ height }}>
        <Typography color="textSecondary">
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {showControls && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: "#f8f9fa",
            borderRadius: 1,
          }}
        >
          {/* Chart Type Selection */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Chart Type
            </Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
              sx={{ flexWrap: "wrap" }}
            >
              {CHART_TYPE_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  value={option.value}
                  sx={{
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor: "#1976d2",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#1565c0",
                      },
                    },
                  }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Field Selection */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {/* X-Axis Field */}
            <FormControl size="small" fullWidth>
              <InputLabel>
                {chartType === "pie" ? "Category" : "X-Axis"}
              </InputLabel>
              <Select
                value={xField}
                label={chartType === "pie" ? "Category" : "X-Axis"}
                onChange={(e) => handleXFieldChange(e.target.value)}
              >
                {dimensions.map((dim) => (
                  <MenuItem key={dim.id} value={dim.id}>
                    {dim.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Y-Axis Field */}
            <FormControl size="small" fullWidth>
              <InputLabel>
                {chartType === "pie" ? "Value" : "Y-Axis"}
              </InputLabel>
              <Select
                value={yField}
                label={chartType === "pie" ? "Value" : "Y-Axis"}
                onChange={(e) => handleYFieldChange(e.target.value)}
              >
                {measures.map((measure) => (
                  <MenuItem key={measure.id} value={measure.id}>
                    {measure.label}
                    {measure.unit && ` (${measure.unit})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Segment Field (optional, not for pie) */}
            {chartType !== "pie" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Group By (optional)</InputLabel>
                <Select
                  value={segmentField}
                  label="Group By (optional)"
                  onChange={(e) => handleSegmentFieldChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {dimensions
                    .filter((dim) => dim.id !== xField)
                    .map((dim) => (
                      <MenuItem key={dim.id} value={dim.id}>
                        {dim.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Paper>
      )}

      {/* Chart */}
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: 1,
          border: "1px solid #e0e0e0",
          overflow: "hidden",
        }}
      >
        <SimpleEChartsChart
          observations={observations}
          xField={xField}
          yField={yField}
          segmentField={segmentField || undefined}
          chartType={chartType}
          height={height}
          xAxisLabel={xAxisLabel}
          yAxisLabel={yAxisLabel}
          showLegend={!!segmentField}
          showTooltip={true}
        />
      </Box>

      {/* Data Info */}
      <Typography variant="caption" color="textSecondary" sx={{ textAlign: "right" }}>
        {observations.length} data points
      </Typography>
    </Box>
  );
};

export default SimpleChartPreview;
