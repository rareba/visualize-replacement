/**
 * Column Chart with ECharts
 *
 * This is the ECharts-based version of the column chart.
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
import { GroupedColumnChart } from "@/charts/column/columns-grouped-state";
import { StackedColumnsChart } from "@/charts/column/columns-stacked-state";
import { ColumnChart } from "@/charts/column/columns-state";
import {
  ColumnChartAdapter,
  GroupedColumnChartAdapter,
  StackedColumnChartAdapter,
} from "@/charts/echarts/adapters";
import { ChartControlsContainer } from "@/charts/shared/containers";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { LegendColor } from "@/charts/shared/legend-color";
import { ColumnConfig } from "@/config-types";
import { useChartConfigFilters, useLimits } from "@/config-utils";
import { TimeSlider } from "@/configurator/interactive-filters/time-slider";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartColumnsVisualization = (
  props: VisualizationProps<ColumnConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartColumns} />;
};

const ChartColumns = memo((props: ChartProps<ColumnConfig>) => {
  const { chartConfig, dimensions, measures, dimensionsById } = props;
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
        <StackedColumnsChart {...props}>
          <ChartContainerECharts>
            <StackedColumnChartAdapter />
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
        </StackedColumnsChart>
      ) : fields.segment?.componentId && fields.segment.type === "grouped" ? (
        <GroupedColumnChart {...props}>
          <ChartContainerECharts>
            <GroupedColumnChartAdapter />
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
        </GroupedColumnChart>
      ) : (
        <ColumnChart {...props} limits={limits}>
          <ChartContainerECharts>
            <ColumnChartAdapter />
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
        </ColumnChart>
      )}
    </>
  );
});
