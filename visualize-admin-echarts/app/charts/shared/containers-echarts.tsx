/**
 * ECharts Containers
 *
 * These containers replace the D3-based SVG containers with ECharts rendering.
 * They integrate with the existing ChartContext state management.
 */

import { ReactNode } from "react";

import { useChartState } from "@/charts/shared/chart-state";
import { useObserverRef } from "@/charts/shared/use-size";
import { getChartConfig } from "@/config-utils";
import {
  hasChartConfigs,
  isLayoutingFreeCanvas,
  useConfiguratorState,
} from "@/configurator";

const useStyles = () => ({
  chartContainer: {
    overflow: "hidden",
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    flexGrow: 1,
  },
});

/**
 * Container for ECharts-based charts.
 * Replaces ChartContainer + ChartSvg with a simpler structure.
 */
export const ChartContainerECharts = ({ children }: { children: ReactNode }) => {
  const [state] = useConfiguratorState(hasChartConfigs);
  const chartConfig = getChartConfig(state);
  const isFreeCanvas = isLayoutingFreeCanvas(state);
  const ref = useObserverRef();
  const { bounds } = useChartState();
  const styles = useStyles();

  return (
    <div
      key={chartConfig.chartType}
      ref={ref}
      aria-hidden="true"
      style={{
        ...styles.chartContainer,
        height: isFreeCanvas ? "initial" : bounds.height,
        overflow: "auto",
      }}
    >
      {children}
    </div>
  );
};
