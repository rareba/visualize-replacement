/**
 * Pie Chart with ECharts
 *
 * This is the ECharts-based version of the pie chart.
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
import { PieChartAdapter } from "@/charts/echarts/adapters";
import { PieChart } from "@/charts/pie/pie-state";
import { ChartControlsContainer } from "@/charts/shared/containers";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { LegendColor } from "@/charts/shared/legend-color";
import { OnlyNegativeDataHint } from "@/components/hint";
import { PieConfig } from "@/config-types";
import { useChartConfigFilters } from "@/config-utils";
import { TimeSlider } from "@/configurator/interactive-filters/time-slider";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartPieVisualization = (props: VisualizationProps<PieConfig>) => {
  return <ChartDataWrapper {...props} Component={ChartPie} />;
};

const ChartPie = memo((props: ChartProps<PieConfig>) => {
  const { chartConfig, observations, dimensions, dimensionsById } = props;
  const { fields, interactiveFiltersConfig } = chartConfig;
  const somePositive = observations.some(
    (d) => (d[fields?.y?.componentId] as number) > 0
  );
  const filters = useChartConfigFilters(chartConfig);

  if (!somePositive) {
    return <OnlyNegativeDataHint />;
  }

  return (
    <PieChart {...props}>
      <ChartContainerECharts>
        <PieChartAdapter />
        <Tooltip type="single" />
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
          interactive={fields.segment && interactiveFiltersConfig.legend.active}
          showTitle={fields.segment?.showTitle}
        />
      </ChartControlsContainer>
    </PieChart>
  );
});
