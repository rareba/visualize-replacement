/**
 * Core Universal Chart Architecture
 *
 * This module exports the core infrastructure for the universal ECharts architecture.
 *
 * Key exports:
 * - UniversalChartState: Interface for all chart state
 * - ChartAdapter: Type for adapter functions
 * - createFieldAccessors: Factory for field accessors
 * - createColorAccessors: Factory for color accessors
 * - registerChartAdapter: Registry function
 * - UniversalChartProvider: React context provider
 */

// Types and interfaces
export type {
  UniversalChartState,
  ChartAdapter,
  ChartAdapterComponent,
  FieldAccessors,
  ColorAccessors,
  FieldMetadata,
  ChartDisplayOptions,
  NumericalValueGetter,
  StringValueGetter,
  TemporalValueGetter,
  PieChartState,
  AxisChartState,
} from "./universal-chart-state";

// Field accessor factory
export {
  createFieldAccessors,
  createStringGetter,
  createNumericGetter,
  createTemporalGetter,
  createRenderingKeyGetter,
} from "./field-accessor-factory";

// Color scale factory
export {
  createColorAccessors,
  createPieColorAccessors,
  extractSegments,
  extractCategories,
} from "./color-scale-factory";

// Chart adapter registry
export {
  registerChartAdapter,
  registerChartAdapterComponent,
  getChartAdapter,
  getChartAdapterComponent,
  hasChartAdapter,
  getEChartsOption,
  getRegisteredChartTypes,
  clearAdapterRegistry,
  logAdapterRegistry,
} from "./chart-adapter-registry";

// Universal chart provider
export {
  UniversalChartProvider,
  UniversalChartContext,
  useUniversalChartState,
  useMaybeUniversalChartState,
} from "./universal-chart-provider";
export type { UniversalChartProviderProps } from "./universal-chart-provider";
