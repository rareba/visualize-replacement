/**
 * Area Chart with ECharts
 *
 * This is the ECharts-based version of the area chart.
 * It replaces the D3-based SVG rendering while preserving
 * the existing state management and interactive features.
 *
 * Migration notes:
 * - D3 rendering files moved to ./Removed folder
 * - ECharts adapters read from ChartContext
 * - Legend remains unchanged
 */

import { memo } from "react";

import { AreaChart } from "@/charts/area/areas-state";
import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { AreaChartAdapter } from "@/charts/echarts/adapters";
import { ChartControlsContainer } from "@/charts/shared/containers";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { LegendColor } from "@/charts/shared/legend-color";
import { AreaConfig } from "@/config-types";
import { useLimits } from "@/config-utils";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartAreasVisualization = (
  props: VisualizationProps<AreaConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartAreas} />;
};

const ChartAreas = memo((props: ChartProps<AreaConfig>) => {
  const { chartConfig, dimensions, measures, dimensionsById } = props;
  const { fields, interactiveFiltersConfig } = chartConfig;
  const limits = useLimits({
    chartConfig,
    dimensions,
    measures,
  });

  return (
    <AreaChart {...props} limits={limits}>
      <ChartContainerECharts>
        <AreaChartAdapter />
        <Tooltip type={fields.segment ? "multiple" : "single"} />
      </ChartContainerECharts>
      {(fields.segment || limits.limits.length > 0) && (
        <ChartControlsContainer>
          <LegendColor
            chartConfig={chartConfig}
            symbol="square"
            interactive={interactiveFiltersConfig.legend.active}
            showTitle={fields.segment?.showTitle}
            dimensionsById={dimensionsById}
            limits={limits}
          />
        </ChartControlsContainer>
      )}
    </AreaChart>
  );
});
