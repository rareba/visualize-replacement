import { Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  BoxProps,
  ButtonBase,
  Chip,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { SyntheticEvent, useCallback, useMemo, useState } from "react";

import {
  chartTypeCategories,
  ChartCategoryConfig,
  getEnabledChartTypes,
} from "@/charts";
import { HintError } from "@/components/hint";
import { ChartType, ConfiguratorStatePublished } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import { ControlSectionSkeleton } from "@/configurator/components/chart-controls/section";
import { getFieldLabel } from "@/configurator/components/field-i18n";
import { useAddOrEditChartType } from "@/configurator/config-form";
import { ConfiguratorStateWithChartConfigs } from "@/configurator/configurator-state";
import { useDataCubesComponentsQuery } from "@/graphql/hooks";
import { getChartIcon, Icon } from "@/icons";
import { useLocale } from "@/locales/use-locale";

// Chart type descriptions for better UX
const chartTypeDescriptions: Record<ChartType, string> = {
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
  funnel: "Show progression through stages",
  gauge: "Display a single value on a dial",
  treemap: "Show hierarchical data as nested rectangles",
  sunburst: "Display hierarchy in concentric rings",
  heatmap: "Show values using color intensity in a grid",
  boxplot: "Show statistical distribution with quartiles",
  waterfall: "Show cumulative effect of sequential values",
  sankey: "Visualize flow between categories",
  polar: "Display data in circular coordinate system",
  wordcloud: "Show text frequency with varying sizes",
  comboLineSingle: "Multiple lines with same scale",
  comboLineDual: "Lines with dual Y-axes for different units",
  comboLineColumn: "Combine lines and columns",
};

export const ChartTypeSelector = ({
  state,
  type = "edit",
  showHelp,
  showComparisonCharts = true,
  chartKey,
  ...rest
}: {
  state: Exclude<ConfiguratorStateWithChartConfigs, ConfiguratorStatePublished>;
  type?: "add" | "edit";
  showHelp?: boolean;
  showComparisonCharts?: boolean;
  chartKey: string;
} & BoxProps) => {
  const locale = useLocale();
  const chartConfig = getChartConfig(state);
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

      // Guard against undefined chart type (can happen if click event fires on disabled button)
      if (!newChartType) {
        return;
      }

      // Disable triggering the change event if the chart type is the same,
      // only in edit mode; we should be able to add any possible chart type
      // in add mode.
      if (type === "edit" ? newChartType !== chartType : true) {
        addOrEditChartType(newChartType);
      }
    },
    [chartType, addOrEditChartType, type]
  );

  if (!data?.dataCubesComponents) {
    return <ControlSectionSkeleton />;
  }

  const { enabledChartTypes, possibleChartTypesDict } = getEnabledChartTypes({
    dimensions,
    measures,
    cubeCount: chartConfig.cubes.length,
  });

  // Filter categories based on showComparisonCharts prop
  const visibleCategories = showComparisonCharts
    ? chartTypeCategories
    : chartTypeCategories.filter((cat) => cat.id !== "comparison");

  return (
    <Box {...rest}>
      <legend style={{ display: "none" }}>
        <Trans id="controls.select.chart.type">Chart Type</Trans>
      </legend>
      {showHelp === false ? null : (
        <Box sx={{ px: 2, pt: 1, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            {type === "add" ? (
              <Trans id="controls.add.chart">Add another chart.</Trans>
            ) : (
              <Trans id="controls.switch.chart.type">
                Switch to another chart type while maintaining most filter
                settings.
              </Trans>
            )}
          </Typography>
        </Box>
      )}
      <div>
        {enabledChartTypes.length === 0 ? (
          <HintError smaller>
            <Trans id="hint.no.visualization.with.dataset">
              No visualization can be created with the selected dataset.
            </Trans>
          </HintError>
        ) : (
          <VisualChartCategoriesSelector
            type={type}
            currentChartType={chartType}
            categories={visibleCategories}
            possibleChartTypesDict={possibleChartTypesDict}
            onClick={handleClick}
          />
        )}
      </div>
    </Box>
  );
};

/**
 * Visual chart selector with tabs and card grid.
 * Shows chart types grouped by category with horizontal category chips.
 */
const VisualChartCategoriesSelector = ({
  type,
  currentChartType,
  categories,
  possibleChartTypesDict,
  onClick,
}: {
  type: "add" | "edit";
  currentChartType: ChartType;
  categories: ChartCategoryConfig[];
  possibleChartTypesDict: ReturnType<
    typeof getEnabledChartTypes
  >["possibleChartTypesDict"];
  onClick: (e: SyntheticEvent<HTMLButtonElement, Event>) => void;
}) => {
  // Find which category contains the current chart type
  const currentCategory = categories.find((cat) =>
    cat.chartTypes.includes(currentChartType)
  );

  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentCategory?.id || categories[0]?.id || "basic"
  );

  // Count enabled charts per category
  const categoryStats = useMemo(() => {
    return categories.reduce((acc, cat) => {
      const enabledCount = cat.chartTypes.filter(
        (ct) => possibleChartTypesDict[ct]?.enabled
      ).length;
      acc[cat.id] = {
        total: cat.chartTypes.length,
        enabled: enabledCount,
        hasCurrentChart: cat.chartTypes.includes(currentChartType),
      };
      return acc;
    }, {} as Record<string, { total: number; enabled: number; hasCurrentChart: boolean }>);
  }, [categories, possibleChartTypesDict, currentChartType]);

  const selectedCategoryConfig = categories.find((c) => c.id === selectedCategory);

  return (
    <Box>
      {/* Category chips */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          px: 2,
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {categories.map((category) => {
          const stats = categoryStats[category.id];
          const isSelected = selectedCategory === category.id;
          const hasEnabledCharts = stats.enabled > 0;

          return (
            <Chip
              key={category.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <span>{getFieldLabel(category.labelKey)}</span>
                  {stats.hasCurrentChart && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: isSelected ? "white" : "primary.main",
                        ml: 0.5,
                      }}
                    />
                  )}
                </Box>
              }
              onClick={() => setSelectedCategory(category.id)}
              variant={isSelected ? "filled" : "outlined"}
              color={isSelected ? "primary" : "default"}
              size="small"
              sx={{
                opacity: hasEnabledCharts ? 1 : 0.5,
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: isSelected
                    ? "primary.main"
                    : (theme) => alpha(theme.palette.primary.main, 0.08),
                },
              }}
            />
          );
        })}
      </Box>

      {/* Chart grid for selected category */}
      {selectedCategoryConfig && (
        <Box sx={{ p: 2 }}>
          <ChartTypeCardGrid
            type={type}
            currentChartType={currentChartType}
            chartTypes={selectedCategoryConfig.chartTypes}
            possibleChartTypesDict={possibleChartTypesDict}
            onClick={onClick}
          />
        </Box>
      )}
    </Box>
  );
};

/**
 * Grid of visual chart type cards.
 */
const ChartTypeCardGrid = ({
  type,
  currentChartType,
  chartTypes,
  possibleChartTypesDict,
  onClick,
}: {
  type: "add" | "edit";
  currentChartType: ChartType;
  chartTypes: ChartType[];
  possibleChartTypesDict: ReturnType<
    typeof getEnabledChartTypes
  >["possibleChartTypesDict"];
  onClick: (e: SyntheticEvent<HTMLButtonElement, Event>) => void;
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: 1.5,
      }}
    >
      {chartTypes.map((chartType) => {
        const { enabled, message } = possibleChartTypesDict[chartType] ?? {
          enabled: false,
          message: undefined,
        };
        const isSelected = type === "edit" && currentChartType === chartType;

        return (
          <ChartTypeCard
            key={chartType}
            chartType={chartType}
            enabled={enabled}
            selected={isSelected}
            disabledMessage={message}
            onClick={onClick}
          />
        );
      })}
    </Box>
  );
};

/**
 * Individual chart type card with icon, label, and description.
 */
const ChartTypeCard = ({
  chartType,
  enabled,
  selected,
  disabledMessage,
  onClick,
}: {
  chartType: ChartType;
  enabled: boolean;
  selected: boolean;
  disabledMessage?: string;
  onClick: (e: SyntheticEvent<HTMLButtonElement, Event>) => void;
}) => {
  const iconName = getChartIcon(chartType);
  const label = getFieldLabel(chartType);
  const description = chartTypeDescriptions[chartType];

  const tooltipTitle = enabled
    ? description
    : `${label}: ${disabledMessage || "Not available for this dataset"}`;

  // Wrap onClick to prevent click handling on disabled cards
  // (pointerEvents: "auto" is needed for Tooltip to work on disabled elements)
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!enabled) {
        e.preventDefault();
        return;
      }
      // Cast to expected type for the parent onClick handler
      onClick(e as unknown as SyntheticEvent<HTMLButtonElement, Event>);
    },
    [enabled, onClick]
  );

  return (
    <Tooltip title={tooltipTitle} placement="top" arrow enterDelay={300}>
      <span style={{ display: "block" }}>
        <ButtonBase
          component={Paper}
          data-chart-type={chartType}
          onClick={handleCardClick}
          disabled={!enabled}
          elevation={selected ? 3 : 0}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 1.5,
            borderRadius: 1.5,
            border: 2,
            borderColor: selected
              ? "primary.main"
              : enabled
              ? "transparent"
              : "transparent",
            backgroundColor: selected
              ? (theme) => alpha(theme.palette.primary.main, 0.08)
              : enabled
              ? "background.paper"
              : "action.disabledBackground",
            cursor: enabled ? "pointer" : "not-allowed",
            opacity: enabled ? 1 : 0.5,
            transition: "all 0.15s ease-in-out",
            minHeight: 90,
            "&:hover": enabled
              ? {
                  borderColor: "primary.light",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.04),
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                }
              : {},
            "&.Mui-disabled": {
              pointerEvents: "auto",
            },
          }}
        >
          <Icon
            name={iconName}
            size={32}
            color={
              selected
                ? "var(--mui-palette-primary-main)"
                : enabled
                ? "var(--mui-palette-text-primary)"
                : "var(--mui-palette-text-disabled)"
            }
          />
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              fontWeight: selected ? 600 : 400,
              color: selected
                ? "primary.main"
                : enabled
                ? "text.primary"
                : "text.disabled",
              textAlign: "center",
              lineHeight: 1.2,
              fontSize: "0.7rem",
            }}
          >
            {label}
          </Typography>
        </ButtonBase>
      </span>
    </Tooltip>
  );
};

// Keep the legacy components for backwards compatibility
export { ChartTypeCard, ChartTypeCardGrid, VisualChartCategoriesSelector };
