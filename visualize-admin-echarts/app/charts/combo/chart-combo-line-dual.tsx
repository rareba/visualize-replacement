import { memo } from "react";

import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { ComboLineDualChart } from "@/charts/combo/combo-line-dual-state";
import { ComboLineDualChartAdapter } from "@/charts/echarts/adapters";
import { ChartContainerECharts } from "@/charts/shared/containers-echarts";
import { Tooltip } from "@/charts/shared/interaction/tooltip";
import { ComboLineDualConfig } from "@/config-types";

import { ChartProps, VisualizationProps } from "../shared/chart-props";

export const ChartComboLineDualVisualization = (
  props: VisualizationProps<ComboLineDualConfig>
) => {
  return <ChartDataWrapper {...props} Component={ChartComboLineDual} />;
};

const ChartComboLineDual = memo((props: ChartProps<ComboLineDualConfig>) => {
  return (
    <ComboLineDualChart {...props}>
      <ChartContainerECharts>
        <ComboLineDualChartAdapter />
      </ChartContainerECharts>
      <Tooltip type="multiple" />
    </ComboLineDualChart>
  );
});
