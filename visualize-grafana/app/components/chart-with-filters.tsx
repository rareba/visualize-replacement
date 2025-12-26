import { makeStyles } from "@mui/styles";
import dynamic from "next/dynamic";
import { forwardRef } from "react";

import { useQueryFilters } from "@/charts/shared/chart-helpers";
import { Observer } from "@/charts/shared/use-size";
import { useSyncInteractiveFilters } from "@/charts/shared/use-sync-interactive-filters";
import { EmbedQueryParams } from "@/components/embed-params";
import {
  type ChartConfig,
  type DashboardFiltersConfig,
  type DataSource,
} from "@/config-types";

// Use ECharts visualizations for supported chart types
const EChartsVisualization = dynamic(
  () => import("@/charts/simple-echarts").then((mod) => ({ default: mod.EChartsVisualization }))
);

// Keep D3-based visualizations for complex chart types not yet migrated
const ChartComboLineSingleVisualization = dynamic(
  () => import("@/charts/combo/chart-combo-line-single").then((mod) => ({ default: mod.ChartComboLineSingleVisualization }))
);
const ChartComboLineDualVisualization = dynamic(
  () => import("@/charts/combo/chart-combo-line-dual").then((mod) => ({ default: mod.ChartComboLineDualVisualization }))
);
const ChartComboLineColumnVisualization = dynamic(
  () => import("@/charts/combo/chart-combo-line-column").then((mod) => ({ default: mod.ChartComboLineColumnVisualization }))
);
const ChartMapVisualization = dynamic(
  () => import("@/charts/map/chart-map").then((mod) => ({ default: mod.ChartMapVisualization }))
);
const ChartTableVisualization = dynamic(
  () => import("@/charts/table/chart-table").then((mod) => ({ default: mod.ChartTableVisualization }))
);

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

  switch (chartConfig.chartType) {
    // ECharts-based visualizations (new, simplified)
    case "column":
    case "bar":
    case "line":
    case "area":
    case "scatterplot":
    case "pie":
      return (
        <EChartsVisualization {...commonProps} chartConfig={chartConfig} />
      );

    // D3-based visualizations (keep for complex/specialized charts)
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
      const _exhaustiveCheck: never = chartConfig;
      return _exhaustiveCheck;
  }
};

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
