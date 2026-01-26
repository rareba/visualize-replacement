/**
 * PowerBI-Style Chart Type Picker
 *
 * A compact, visual chart type selector inspired by PowerBI's visualization pane.
 * Features:
 * - Compact icon grid layout
 * - Hover preview tooltips
 * - Visual enabled/disabled states
 * - Search/filter functionality
 */

import { Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";

import {
  getEnabledChartTypes,
} from "@/charts";
import { ChartType, ConfiguratorStatePublished } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import { ControlSectionSkeleton } from "@/configurator/components/chart-controls/section";
import { getFieldLabel } from "@/configurator/components/field-i18n";
import { useAddOrEditChartType } from "@/configurator/config-form";
import { ConfiguratorStateWithChartConfigs } from "@/configurator/configurator-state";
import { useDataCubesComponentsQuery } from "@/graphql/hooks";
import { getChartIcon, Icon } from "@/icons";
import { useLocale } from "@/locales/use-locale";

// Chart type descriptions for tooltips
const chartTypeDescriptions: Partial<Record<ChartType, string>> = {
  column: "Compare values across categories vertically",
  bar: "Compare values across categories horizontally",
  line: "Show trends over time with connected points",
  area: "Display trends with filled areas below lines",
  scatterplot: "Show relationships between two measures",
  pie: "Show proportions of a whole as slices",
  donut: "Proportions with a hollow center",
  table: "Display data in rows and columns",
  map: "Visualize geographical data on a map",
  radar: "Compare multiple variables on radial axes",
  heatmap: "Show values using color intensity in a grid",
  boxplot: "Show statistical distribution with quartiles",
  waterfall: "Show cumulative effect of sequential values",
  comboLineSingle: "Multiple lines with same scale",
  comboLineDual: "Lines with dual Y-axes for different units",
  comboLineColumn: "Combine lines and columns",
  // 3D Charts (ECharts GL)
  bar3d: "3D bar chart with depth perspective",
  scatter3d: "3D scatter plot for three-dimensional data",
  surface: "3D surface visualization for continuous data",
  line3d: "3D line chart with depth dimension",
  globe: "Globe visualization for geographical data",
  pie3d: "3D pie chart with depth effect",
};

// Common chart types shown by default (most frequently used)
const COMMON_CHART_TYPES: ChartType[] = [
  "column",
  "bar",
  "line",
  "pie",
  "table",
  "area",
];

// All chart types in preferred order
const ALL_CHART_TYPES: ChartType[] = [
  // Most common first
  "column",
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "scatterplot",
  // Statistical
  "boxplot",
  "heatmap",
  "waterfall",
  // Specialized
  "radar",
  // 3D Charts (ECharts GL)
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "globe",
  "pie3d",
  // Combo
  "comboLineSingle",
  "comboLineDual",
  "comboLineColumn",
  // Non-chart
  "table",
  "map",
];

export interface PowerBIChartTypePickerProps {
  state: Exclude<ConfiguratorStateWithChartConfigs, ConfiguratorStatePublished>;
  type?: "add" | "edit";
  chartKey: string;
  showSearch?: boolean;
}

export const PowerBIChartTypePicker = ({
  state,
  type = "edit",
  chartKey,
  showSearch = false,
}: PowerBIChartTypePickerProps) => {
  const locale = useLocale();
  const chartConfig = getChartConfig(state);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCharts, setShowAllCharts] = useState(false);
  const [{ data }] = useDataCubesComponentsQuery({
    chartConfig,
    variables: {
      sourceType: state.dataSource.type,
      sourceUrl: state.dataSource.url,
      locale,
      cubeFilters: chartConfig.cubes.map((cube) => ({
        iri: cube.iri,
        joinBy: cube.joinBy,
        loadValues: true,
      })),
    },
  });
  const dimensions = data?.dataCubesComponents?.dimensions ?? [];
  const measures = data?.dataCubesComponents?.measures ?? [];
  const { value: chartType, addOrEditChartType } = useAddOrEditChartType(
    chartKey,
    type,
    dimensions,
    measures
  );

  const handleClick = useCallback(
    (e: SyntheticEvent<HTMLButtonElement, Event>) => {
      const newChartType = e.currentTarget.dataset.chartType as ChartType | undefined;
      if (!newChartType) return;
      if (type === "edit" ? newChartType !== chartType : true) {
        addOrEditChartType(newChartType);
      }
    },
    [chartType, addOrEditChartType, type]
  );

  const { possibleChartTypesDict } = useMemo(() => {
    if (!data?.dataCubesComponents) {
      return { possibleChartTypesDict: {} as Record<ChartType, { enabled: boolean; message?: string }> };
    }
    return getEnabledChartTypes({
      dimensions,
      measures,
      cubeCount: chartConfig.cubes.length,
    });
  }, [data?.dataCubesComponents, dimensions, measures, chartConfig.cubes.length]);

  // Filter chart types based on search and showAllCharts toggle
  const filteredChartTypes = useMemo(() => {
    // Start with either common or all chart types
    const baseTypes = showAllCharts ? ALL_CHART_TYPES : COMMON_CHART_TYPES;

    if (!searchQuery.trim()) return baseTypes;

    // When searching, always search all chart types
    const query = searchQuery.toLowerCase();
    return ALL_CHART_TYPES.filter((ct) => {
      const label = getFieldLabel(ct).toLowerCase();
      const desc = chartTypeDescriptions[ct]?.toLowerCase() || "";
      return label.includes(query) || desc.includes(query);
    });
  }, [searchQuery, showAllCharts]);

  // Check if current chart type is not in common list (need to show expanded)
  const currentChartNotInCommon = useMemo(() => {
    return chartType && !COMMON_CHART_TYPES.includes(chartType);
  }, [chartType]);

  // Additional charts count (for the "Show more" button label)
  const additionalChartsCount = ALL_CHART_TYPES.length - COMMON_CHART_TYPES.length;

  if (!data?.dataCubesComponents) {
    return <ControlSectionSkeleton />;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Search field */}
      {showSearch && (
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search chart types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" size={16} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <Icon name="close" size={14} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                backgroundColor: "background.paper",
              },
            }}
          />
        </Box>
      )}

      {/* Chart type grid - Common charts */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
          gap: 0.5,
          p: 1,
          pb: 0,
        }}
      >
        {(searchQuery.trim() ? filteredChartTypes : COMMON_CHART_TYPES).map((ct) => {
          const { enabled, message } = possibleChartTypesDict[ct] ?? {
            enabled: false,
            message: undefined,
          };
          const isSelected = type === "edit" && chartType === ct;
          const label = getFieldLabel(ct);
          const description = chartTypeDescriptions[ct];
          const tooltipTitle = enabled
            ? `${label}: ${description}`
            : `${label}: ${message || "Not available for this dataset"}`;

          return (
            <ChartTypeIcon
              key={ct}
              chartType={ct}
              enabled={enabled}
              selected={isSelected}
              tooltipTitle={tooltipTitle}
              onClick={handleClick}
            />
          );
        })}
      </Box>

      {/* Show more/less button and additional charts */}
      {!searchQuery.trim() && (
        <>
          <Box sx={{ px: 1, py: 0.5 }}>
            <Button
              variant="text"
              size="sm"
              onClick={() => setShowAllCharts(!showAllCharts)}
              startIcon={
                <Icon
                  name={showAllCharts ? "chevronUp" : "chevronDown"}
                  size={12}
                />
              }
              sx={{
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
              {showAllCharts ? (
                <Trans id="powerbi.chartType.showLess">Show less</Trans>
              ) : (
                <Trans id="powerbi.chartType.showMore">
                  Show all ({additionalChartsCount} more)
                </Trans>
              )}
            </Button>
          </Box>

          {/* Additional charts (collapsible) */}
          <Collapse in={showAllCharts || currentChartNotInCommon}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
                gap: 0.5,
                px: 1,
                pb: 1,
              }}
            >
              {ALL_CHART_TYPES.filter((ct) => !COMMON_CHART_TYPES.includes(ct)).map((ct) => {
                const { enabled, message } = possibleChartTypesDict[ct] ?? {
                  enabled: false,
                  message: undefined,
                };
                const isSelected = type === "edit" && chartType === ct;
                const label = getFieldLabel(ct);
                const description = chartTypeDescriptions[ct];
                const tooltipTitle = enabled
                  ? `${label}: ${description}`
                  : `${label}: ${message || "Not available for this dataset"}`;

                return (
                  <ChartTypeIcon
                    key={ct}
                    chartType={ct}
                    enabled={enabled}
                    selected={isSelected}
                    tooltipTitle={tooltipTitle}
                    onClick={handleClick}
                  />
                );
              })}
            </Box>
          </Collapse>
        </>
      )}

      {/* Selected chart info */}
      {chartType && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: 1,
            borderColor: "divider",
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            {getFieldLabel(chartType)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {chartTypeDescriptions[chartType]}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Individual chart type icon button
 */
const ChartTypeIcon = ({
  chartType,
  enabled,
  selected,
  tooltipTitle,
  onClick,
}: {
  chartType: ChartType;
  enabled: boolean;
  selected: boolean;
  tooltipTitle: string;
  onClick: (e: SyntheticEvent<HTMLButtonElement, Event>) => void;
}) => {
  const iconName = getChartIcon(chartType);

  return (
    <Tooltip title={tooltipTitle} placement="top" arrow enterDelay={400}>
      <span>
        <IconButton
          data-chart-type={chartType}
          onClick={onClick}
          disabled={!enabled}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1,
            border: 2,
            borderColor: selected
              ? "primary.main"
              : "transparent",
            backgroundColor: selected
              ? (theme) => alpha(theme.palette.primary.main, 0.12)
              : enabled
              ? "transparent"
              : (theme) => alpha(theme.palette.action.disabled, 0.04),
            opacity: enabled ? 1 : 0.4,
            transition: "all 0.15s ease-in-out",
            "&:hover": enabled
              ? {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.08),
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.5),
                  transform: "scale(1.05)",
                }
              : {},
            "&.Mui-disabled": {
              pointerEvents: "auto",
              cursor: "not-allowed",
            },
          }}
        >
          <Icon
            name={iconName}
            size={24}
            color={
              selected
                ? "var(--mui-palette-primary-main)"
                : enabled
                ? "var(--mui-palette-text-primary)"
                : "var(--mui-palette-text-disabled)"
            }
          />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default PowerBIChartTypePicker;
