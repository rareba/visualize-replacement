/**
 * Scatterplot Chart with ECharts
 *
 * This is the ECharts-based version of the scatterplot chart.
 * It replaces the D3-based SVG rendering while preserving
 * the existing state management and interactive features.
 *
 * Migration notes:
 * - D3 rendering files moved to ./Removed folder
 * - ECharts adapters read from ChartContext
 * - Legend, TimeSlider remain unchanged
 */

import { memo } from "react";

import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { ScatterplotChartAdapter } from "@/charts/echarts/adapters";
import { ScatterplotChart } from "@/charts/scatterplot/scatterplot-state";
import { ChartControlsContainer } from "@/charts/shared/containers";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { LegendColor } from "@/charts/shared/legend-color";
import { ScatterPlotConfig } from "@/config-types";
import { useChartConfigFilters } from "@/config-utils";
import { TimeSlider } from "@/configurator/interactive-filters/time-slider";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartScatterplotVisualization = (
  props: VisualizationProps<ScatterPlotConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartScatterplotComponent} />;
};

const ChartScatterplotComponent = memo((props: ChartProps<ScatterPlotConfig>) => {
  const { chartConfig, dimensions, dimensionsById } = props;
  const { fields, interactiveFiltersConfig } = chartConfig;
  const filters = useChartConfigFilters(chartConfig);

  return (
    <ScatterplotChart {...props}>
      <ChartContainerECharts>
        <ScatterplotChartAdapter />
        <Tooltip type="single" />
      </ChartContainerECharts>
      {(fields.animation || fields.segment) && (
        <ChartControlsContainer>
          {fields.animation && (
            <TimeSlider
              filters={filters}
              dimensions={dimensions}
              {...fields.animation}
            />
          )}
          {fields.segment && (
            <LegendColor
              dimensionsById={dimensionsById}
              chartConfig={chartConfig}
              symbol="circle"
              interactive={interactiveFiltersConfig.legend.active}
              showTitle={fields.segment.showTitle}
            />
          )}
        </ChartControlsContainer>
      )}
    </ScatterplotChart>
  );
});
