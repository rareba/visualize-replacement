import { makeStyles } from "@mui/styles";
import dynamic from "next/dynamic";
import { forwardRef } from "react";

import { isEChartsChart } from "@/charts/chart-registry";
import { useQueryFilters } from "@/charts/shared/chart-helpers";
import { Observer } from "@/charts/shared/use-size";
import { useSyncInteractiveFilters } from "@/charts/shared/use-sync-interactive-filters";
import { EmbedQueryParams } from "@/components/embed-params";
import {
  type ChartConfig,
  type DashboardFiltersConfig,
  type DataSource,
} from "@/config-types";

// ============================================================================
// Universal ECharts Architecture
// ============================================================================

// Import the universal chart component for all ECharts-based charts
const UniversalEChartsChart = dynamic(
  () => import("@/charts/UniversalEChartsChart").then((mod) => ({ default: mod.UniversalEChartsChart }))
);

// ============================================================================
// Non-ECharts Chart Components (Map, Table, Combo)
// These use specialized rendering that doesn't fit the ECharts adapter pattern
// ============================================================================

const ChartMapVisualization = dynamic(
  () => import("@/charts/map/chart-map").then((mod) => ({ default: mod.ChartMapVisualization }))
);
const ChartTableVisualization = dynamic(
  () => import("@/charts/table/chart-table").then((mod) => ({ default: mod.ChartTableVisualization }))
);
const ChartComboLineSingleVisualization = dynamic(
  () => import("@/charts/combo/chart-combo-line-single").then((mod) => ({ default: mod.ChartComboLineSingleVisualization }))
);
const ChartComboLineDualVisualization = dynamic(
  () => import("@/charts/combo/chart-combo-line-dual").then((mod) => ({ default: mod.ChartComboLineDualVisualization }))
);
const ChartComboLineColumnVisualization = dynamic(
  () => import("@/charts/combo/chart-combo-line-column").then((mod) => ({ default: mod.ChartComboLineColumnVisualization }))
);

// ============================================================================
// GenericChart Component
// ============================================================================

type GenericChartProps = {
  dataSource: DataSource;
  componentIds: string[] | undefined;
  chartConfig: ChartConfig;
  dashboardFilters: DashboardFiltersConfig | undefined;
  embedParams?: EmbedQueryParams;
};

const GenericChart = ({
  dataSource,
  componentIds,
  chartConfig,
  dashboardFilters,
  embedParams,
}: GenericChartProps) => {
  const observationQueryFilters = useQueryFilters({
    chartConfig,
    dashboardFilters,
    componentIds,
  });

  const commonProps = {
    dataSource,
    observationQueryFilters,
    componentIds,
    embedParams,
  };

  // Use Universal ECharts architecture for all ECharts-based charts
  // This covers: column, bar, line, area, pie, donut, scatterplot,
  // radar, funnel, gauge, treemap, sunburst, polar, wordcloud,
  // heatmap, boxplot, waterfall, sankey
  if (isEChartsChart(chartConfig.chartType)) {
    return (
      <UniversalEChartsChart
        chartConfig={chartConfig}
        dataSource={dataSource}
        observationQueryFilters={observationQueryFilters}
        componentIds={componentIds}
      />
    );
  }

  // Non-ECharts charts require specialized components
  switch (chartConfig.chartType) {
    case "table":
      return (
        <ChartTableVisualization {...commonProps} chartConfig={chartConfig} />
      );
    case "map":
      return (
        <ChartMapVisualization {...commonProps} chartConfig={chartConfig} />
      );
    case "comboLineSingle":
      return (
        <ChartComboLineSingleVisualization
          {...commonProps}
          chartConfig={chartConfig}
        />
      );
    case "comboLineDual":
      return (
        <ChartComboLineDualVisualization
          {...commonProps}
          chartConfig={chartConfig}
        />
      );
    case "comboLineColumn":
      return (
        <ChartComboLineColumnVisualization
          {...commonProps}
          chartConfig={chartConfig}
        />
      );

    default:
      // This should never happen if all chart types are handled
      console.error(`Unhandled chart type: ${(chartConfig as ChartConfig).chartType}`);
      return (
        <div style={{ padding: 20, color: "#666" }}>
          Chart type not supported
        </div>
      );
  }
};

// ============================================================================
// ChartWithFilters Component
// ============================================================================

type ChartWithFiltersProps = {
  dataSource: DataSource;
  componentIds: string[] | undefined;
  chartConfig: ChartConfig;
  dashboardFilters: DashboardFiltersConfig | undefined;
  embedParams?: EmbedQueryParams;
};

export const useChartWithFiltersClasses = makeStyles(() => ({
  chartWithFilters: {
    width: "100%",
    height: "100%",
  },
}));

export const ChartWithFilters = forwardRef<
  HTMLDivElement,
  ChartWithFiltersProps
>((props, ref) => {
  useSyncInteractiveFilters(props.chartConfig, props.dashboardFilters);
  const classes = useChartWithFiltersClasses();

  return (
    <div className={classes.chartWithFilters} ref={ref}>
      <Observer>
        <GenericChart {...props} />
      </Observer>
    </div>
  );
});
ChartWithFilters.displayName = "ChartWithFilters";
