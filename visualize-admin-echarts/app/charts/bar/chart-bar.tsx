/**
 * Bar Chart with ECharts
 *
 * This is the ECharts-based version of the bar chart (horizontal).
 * It replaces the D3-based SVG rendering while preserving
 * the existing state management and interactive features.
 *
 * Migration notes:
 * - D3 rendering files moved to ./Removed folder
 * - ECharts adapters read from ChartContext
 * - Legend, TimeSlider remain unchanged
 */

import { memo } from "react";

import { GroupedBarChart } from "@/charts/bar/bars-grouped-state";
import { StackedBarsChart } from "@/charts/bar/bars-stacked-state";
import { BarChart } from "@/charts/bar/bars-state";
import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import {
  BarChartAdapter,
  GroupedBarChartAdapter,
  StackedBarChartAdapter,
} from "@/charts/echarts/adapters";
import { ChartControlsContainer } from "@/charts/shared/containers";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { LegendColor } from "@/charts/shared/legend-color";
import { BarConfig } from "@/config-types";
import { useChartConfigFilters, useLimits } from "@/config-utils";
import { TimeSlider } from "@/configurator/interactive-filters/time-slider";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartBarsVisualization = (
  props: VisualizationProps<BarConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartBars} />;
};

const ChartBars = memo((props: ChartProps<BarConfig>) => {
  const { chartConfig, dimensions, dimensionsById, measures } = props;
  const { fields, interactiveFiltersConfig } = chartConfig;
  const filters = useChartConfigFilters(chartConfig);
  const limits = useLimits({
    chartConfig,
    dimensions,
    measures,
  });

  return (
    <>
      {fields.segment?.componentId && fields.segment.type === "stacked" ? (
        <StackedBarsChart {...props}>
          <ChartContainerECharts>
            <StackedBarChartAdapter />
            <Tooltip type="multiple" />
          </ChartContainerECharts>
          <ChartControlsContainer>
            {fields.animation && (
              <TimeSlider
                filters={filters}
                dimensions={dimensions}
                {...fields.animation}
              />
            )}
            <LegendColor
              dimensionsById={dimensionsById}
              chartConfig={chartConfig}
              symbol="square"
              interactive={interactiveFiltersConfig.legend.active}
              showTitle={fields.segment?.showTitle}
            />
          </ChartControlsContainer>
        </StackedBarsChart>
      ) : fields.segment?.componentId && fields.segment.type === "grouped" ? (
        <GroupedBarChart {...props}>
          <ChartContainerECharts>
            <GroupedBarChartAdapter />
            <Tooltip type="multiple" />
          </ChartContainerECharts>
          <ChartControlsContainer>
            {fields.animation && (
              <TimeSlider
                filters={filters}
                dimensions={dimensions}
                {...fields.animation}
              />
            )}
            <LegendColor
              dimensionsById={dimensionsById}
              chartConfig={chartConfig}
              symbol="square"
              interactive={interactiveFiltersConfig.legend.active}
              showTitle={fields.segment?.showTitle}
            />
          </ChartControlsContainer>
        </GroupedBarChart>
      ) : (
        <BarChart {...props} limits={limits}>
          <ChartContainerECharts>
            <BarChartAdapter />
            <Tooltip type="single" />
          </ChartContainerECharts>
          {fields.animation || limits.limits.length > 0 ? (
            <ChartControlsContainer>
              {limits.limits.length > 0 && (
                <LegendColor
                  limits={limits}
                  dimensionsById={dimensionsById}
                  chartConfig={chartConfig}
                  symbol="square"
                />
              )}
              {fields.animation && (
                <TimeSlider
                  filters={filters}
                  dimensions={dimensions}
                  {...fields.animation}
                />
              )}
            </ChartControlsContainer>
          ) : null}
        </BarChart>
      )}
    </>
  );
});
