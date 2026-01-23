import { memo } from "react";

import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { ComboLineColumnChart } from "@/charts/combo/combo-line-column-state";
import { ComboLineColumnChartAdapter } from "@/charts/echarts/adapters";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { ComboLineColumnConfig } from "@/config-types";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartComboLineColumnVisualization = (
  props: VisualizationProps<ComboLineColumnConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartComboLineColumn} />;
};

const ChartComboLineColumn = memo(
  (props: ChartProps<ComboLineColumnConfig>) => {
    return (
      <ComboLineColumnChart {...props}>
        <ChartContainerECharts>
          <ComboLineColumnChartAdapter />
        </ChartContainerECharts>
        <Tooltip type="multiple" />
      </ComboLineColumnChart>
    );
  }
);
