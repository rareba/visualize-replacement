/**
 * Universal ECharts Chart Component
 *
 * This is the unified chart component that handles all ECharts-based chart types.
 * It wraps ChartDataWrapper + UniversalChartProvider + EChartsWrapper.
 *
 * Benefits:
 * - Single component for all ECharts chart types
 * - Automatic adapter selection based on chartType
 * - Consistent data fetching and error handling
 * - Simplified chart addition (just add adapter)
 */

import React, { memo, useMemo } from "react";

// Import universal adapters to trigger registration
import "@/charts/echarts/universal-adapters";

import {
  getChartAdapter,
  getChartAdapterComponent,
  hasChartAdapter,
} from "@/charts/core/chart-adapter-registry";

// 3D chart types that require Canvas renderer
const CHART_TYPES_3D = new Set([
  "bar3d", "scatter3d", "line3d", "surface", "globe", "pie3d"
]);
import {
  UniversalChartProvider,
  useUniversalChartState,
} from "@/charts/core/universal-chart-provider";
import { ChartDataWrapper } from "@/charts/chart-data-wrapper";
import { calculateChartDimensions } from "@/charts/echarts/adapter-utils";
import { EChartsWrapper } from "@/charts/echarts/EChartsWrapper";
import { isEChartsChart } from "@/charts/chart-registry";
import { useObserverRef } from "@/charts/shared/use-size";
import type { ChartProps } from "@/charts/shared/chart-props";
import type { ChartConfig, DataSource } from "@/config-types";
import type { DataCubeObservationFilter } from "@/graphql/query-hooks";
import type { EChartsOption } from "echarts";

// ============================================================================
// Internal Adapter Renderer
// ============================================================================

/**
 * Renders the chart using the appropriate adapter.
 * This component reads from UniversalChartContext and renders EChartsWrapper.
 */
const UniversalChartRenderer = memo(() => {
  const state = useUniversalChartState();

  // Check for component adapter first (for adapters that need hooks)
  const AdapterComponent = getChartAdapterComponent(state.chartType);
  if (AdapterComponent) {
    return <AdapterComponent />;
  }

  // Use function adapter
  const adapter = getChartAdapter(state.chartType);

  if (!adapter) {
    console.error(
      `No adapter found for chart type "${state.chartType}". ` +
        `Please register an adapter using registerChartAdapter() or registerChartAdapterComponent().`
    );
    return (
      <div style={{ padding: 20, color: "#666" }}>
        Chart type "{state.chartType}" is not yet supported in the universal architecture.
      </div>
    );
  }

  // Generate ECharts option
  const option = useMemo((): EChartsOption => {
    try {
      return adapter(state);
    } catch (error) {
      console.error(`Error in adapter for "${state.chartType}":`, error);
      return {};
    }
  }, [adapter, state]);

  const dimensions = calculateChartDimensions(state.bounds);
  const use3DRenderer = CHART_TYPES_3D.has(state.chartType);

  return (
    <EChartsWrapper
      option={option}
      use3DRenderer={use3DRenderer}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
});

UniversalChartRenderer.displayName = "UniversalChartRenderer";

// ============================================================================
// Chart Content Component
// ============================================================================

/**
 * Container that attaches the Observer ref for resize measurement.
 * This is required because the Observer in ChartWithFilters needs
 * a DOM element to measure for dimensions.
 */
const ObserverContainer = memo(({ children }: { children: React.ReactNode }) => {
  const ref = useObserverRef();

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
});

ObserverContainer.displayName = "ObserverContainer";

/**
 * The inner chart content that receives data from ChartDataWrapper.
 */
const UniversalChartContent = memo(
  <TChartConfig extends ChartConfig>(props: ChartProps<TChartConfig>) => {
    const {
      chartConfig,
      observations,
      dimensions,
      measures,
    } = props;

    return (
      <ObserverContainer>
        <UniversalChartProvider
          chartConfig={chartConfig}
          observations={observations}
          dimensions={dimensions}
          measures={measures}
        >
          <UniversalChartRenderer />
        </UniversalChartProvider>
      </ObserverContainer>
    );
  }
);

UniversalChartContent.displayName = "UniversalChartContent";

// ============================================================================
// Main Public Component
// ============================================================================

export interface UniversalEChartsChartProps {
  chartConfig: ChartConfig;
  dataSource: DataSource;
  observationQueryFilters: DataCubeObservationFilter[];
  componentIds?: string[];
}

/**
 * Universal ECharts Chart
 *
 * This component handles all ECharts-based chart types. It:
 * 1. Validates the chart type is supported
 * 2. Fetches data using ChartDataWrapper
 * 3. Provides data via UniversalChartProvider
 * 4. Renders using the registered adapter
 *
 * @example
 * ```tsx
 * <UniversalEChartsChart
 *   chartConfig={chartConfig}
 *   dataSource={dataSource}
 *   observationQueryFilters={filters}
 * />
 * ```
 */
export const UniversalEChartsChart = memo(
  ({
    chartConfig,
    dataSource,
    observationQueryFilters,
    componentIds,
  }: UniversalEChartsChartProps) => {
    // Validate chart type
    if (!isEChartsChart(chartConfig.chartType)) {
      console.error(
        `Chart type "${chartConfig.chartType}" is not an ECharts chart type. ` +
          `Use the appropriate visualization component instead.`
      );
      return (
        <div style={{ padding: 20, color: "#666" }}>
          Chart type "{chartConfig.chartType}" is not an ECharts chart.
        </div>
      );
    }

    // Check if adapter is registered
    if (!hasChartAdapter(chartConfig.chartType)) {
      return (
        <div style={{ padding: 20, color: "#666" }}>
          Universal adapter for "{chartConfig.chartType}" is not yet registered.
          Falling back to legacy component.
        </div>
      );
    }

    return (
      <ChartDataWrapper
        chartConfig={chartConfig}
        dataSource={dataSource}
        observationQueryFilters={observationQueryFilters}
        componentIds={componentIds}
        Component={UniversalChartContent}
      />
    );
  }
);

UniversalEChartsChart.displayName = "UniversalEChartsChart";

// ============================================================================
// Helper Hook for Adapter Development
// ============================================================================

/**
 * Hook for developing adapters. Provides the state and a helper to log it.
 * Only use this during development.
 */
export const useAdapterDevTools = () => {
  const state = useUniversalChartState();

  const logState = () => {
    console.group(`Universal Chart State - ${state.chartType}`);
    console.log("chartConfig:", state.chartConfig);
    console.log("observations:", state.observations.length, "items");
    console.log("segments:", state.segments);
    console.log("categories:", state.categories);
    console.log("fields:", state.fields);
    console.log("colors:", state.colors);
    console.log("bounds:", state.bounds);
    console.log("options:", state.options);
    console.groupEnd();
  };

  return {
    state,
    logState,
  };
};

export default UniversalEChartsChart;
