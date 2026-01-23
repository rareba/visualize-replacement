/**
 * Line Chart with ECharts
 *
 * This is the ECharts-based version of the line chart.
 * It replaces the D3-based SVG rendering while preserving
 * the existing state management and interactive features.
 *
 * Migration notes:
 * - D3 rendering files moved to ./Removed folder
 * - ECharts adapters read from ChartContext
 * - Legend remains unchanged
 */

import { memo } from "react";

import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { LineChartAdapter } from "@/charts/echarts/adapters";
import { LineChart } from "@/charts/line/lines-state";
import { ChartControlsContainer } from "@/charts/shared/containers";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { LegendColor } from "@/charts/shared/legend-color";
import { LineConfig } from "@/config-types";
import { useLimits } from "@/config-utils";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartLinesVisualization = (
  props: VisualizationProps<LineConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartLines} />;
};

const ChartLines = memo((props: ChartProps<LineConfig>) => {
  const { chartConfig, dimensions, measures, dimensionsById } = props;
  const { fields, interactiveFiltersConfig } = chartConfig;
  const limits = useLimits({
    chartConfig,
    dimensions,
    measures,
  });

  return (
    <LineChart {...props} limits={limits}>
      <ChartContainerECharts>
        <LineChartAdapter />
        <Tooltip type={fields.segment ? "multiple" : "single"} />
      </ChartContainerECharts>
      {(fields.segment || limits.limits.length > 0) && (
        <ChartControlsContainer>
          <LegendColor
            dimensionsById={dimensionsById}
            chartConfig={chartConfig}
            symbol="line"
            interactive={interactiveFiltersConfig.legend.active}
            showTitle={fields.segment?.showTitle}
            limits={limits}
          />
        </ChartControlsContainer>
      )}
    </LineChart>
  );
});
