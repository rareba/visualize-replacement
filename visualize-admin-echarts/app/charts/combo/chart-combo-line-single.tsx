import { memo } from "react";

import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { ComboLineSingleChart } from "@/charts/combo/combo-line-single-state";
import { ComboLineSingleChartAdapter } from "@/charts/echarts/adapters";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { ComboLineSingleConfig } from "@/config-types";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartComboLineSingleVisualization = (
  props: VisualizationProps<ComboLineSingleConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartComboLineSingle} />;
};

const ChartComboLineSingle = memo(
  (props: ChartProps<ComboLineSingleConfig>) => {
    return (
      <ComboLineSingleChart {...props}>
        <ChartContainerECharts>
          <ComboLineSingleChartAdapter />
        </ChartContainerECharts>
        <Tooltip type="multiple" />
      </ComboLineSingleChart>
    );
  }
);
