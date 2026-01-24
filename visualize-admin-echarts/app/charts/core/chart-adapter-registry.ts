/**
 * Chart Adapter Registry
 *
 * Provides a registry pattern for ECharts adapters.
 * This allows adding new chart types by simply registering an adapter function.
 */

import type { ChartType } from "@/config-types";
import type { ChartAdapter, ChartAdapterComponent, UniversalChartState } from "@/charts/core/universal-chart-state";
import type { EChartsOption } from "echarts";

// ============================================================================
// Registry Storage
// ============================================================================

/**
 * Registry of pure function adapters.
 * These transform UniversalChartState into EChartsOption.
 */
const adapterFunctionRegistry = new Map<ChartType, ChartAdapter>();

/**
 * Registry of React component adapters.
 * These are wrapped components that read from context.
 */
const adapterComponentRegistry = new Map<ChartType, ChartAdapterComponent>();

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Registers a pure function adapter for a chart type.
 *
 * @param chartType - The chart type identifier
 * @param adapter - Pure function that transforms state to ECharts option
 *
 * @example
 * ```typescript
 * registerChartAdapter("myChart", (state) => {
 *   return {
 *     series: [{
 *       type: "bar",
 *       data: state.observations.map(d => state.fields.getY?.(d))
 *     }]
 *   };
 * });
 * ```
 */
export const registerChartAdapter = (
  chartType: ChartType,
  adapter: ChartAdapter
): void => {
  if (adapterFunctionRegistry.has(chartType)) {
    console.warn(
      `Chart adapter for "${chartType}" is being overwritten. ` +
        `This may indicate a duplicate registration.`
    );
  }
  adapterFunctionRegistry.set(chartType, adapter);
};

/**
 * Registers a React component adapter for a chart type.
 * Use this for adapters that need React hooks or context.
 *
 * @param chartType - The chart type identifier
 * @param component - React component that renders the chart
 */
export const registerChartAdapterComponent = (
  chartType: ChartType,
  component: ChartAdapterComponent
): void => {
  if (adapterComponentRegistry.has(chartType)) {
    console.warn(
      `Chart adapter component for "${chartType}" is being overwritten.`
    );
  }
  adapterComponentRegistry.set(chartType, component);
};

// ============================================================================
// Retrieval Functions
// ============================================================================

/**
 * Gets the pure function adapter for a chart type.
 *
 * @param chartType - The chart type identifier
 * @returns The adapter function, or undefined if not found
 */
export const getChartAdapter = (chartType: ChartType): ChartAdapter | undefined => {
  return adapterFunctionRegistry.get(chartType);
};

/**
 * Gets the React component adapter for a chart type.
 *
 * @param chartType - The chart type identifier
 * @returns The adapter component, or undefined if not found
 */
export const getChartAdapterComponent = (
  chartType: ChartType
): ChartAdapterComponent | undefined => {
  return adapterComponentRegistry.get(chartType);
};

/**
 * Checks if an adapter exists for a chart type.
 *
 * @param chartType - The chart type identifier
 * @returns True if either a function or component adapter is registered
 */
export const hasChartAdapter = (chartType: ChartType): boolean => {
  return (
    adapterFunctionRegistry.has(chartType) ||
    adapterComponentRegistry.has(chartType)
  );
};

/**
 * Gets the ECharts option by executing the adapter for a chart type.
 * Throws an error if no adapter is found.
 *
 * @param state - The universal chart state
 * @returns ECharts option configuration
 */
export const getEChartsOption = (state: UniversalChartState): EChartsOption => {
  const adapter = adapterFunctionRegistry.get(state.chartType);

  if (!adapter) {
    throw new Error(
      `No adapter registered for chart type "${state.chartType}". ` +
        `Please register an adapter using registerChartAdapter().`
    );
  }

  return adapter(state);
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all registered chart types.
 *
 * @returns Array of chart types that have registered adapters
 */
export const getRegisteredChartTypes = (): ChartType[] => {
  const functionTypes = Array.from(adapterFunctionRegistry.keys());
  const componentTypes = Array.from(adapterComponentRegistry.keys());

  return Array.from(new Set([...functionTypes, ...componentTypes]));
};

/**
 * Clears all registered adapters.
 * Useful for testing.
 */
export const clearAdapterRegistry = (): void => {
  adapterFunctionRegistry.clear();
  adapterComponentRegistry.clear();
};

// ============================================================================
// Debug Functions
// ============================================================================

/**
 * Logs the current state of the adapter registry.
 * Useful for debugging.
 */
export const logAdapterRegistry = (): void => {
  console.group("Chart Adapter Registry");
  console.log("Function Adapters:", Array.from(adapterFunctionRegistry.keys()));
  console.log("Component Adapters:", Array.from(adapterComponentRegistry.keys()));
  console.groupEnd();
};
