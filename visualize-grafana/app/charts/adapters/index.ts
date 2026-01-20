/**
 * Chart Adapters Module
 *
 * This module provides bridge components that connect the existing
 * D3-based chart state management to ECharts rendering.
 *
 * The adapter pattern allows for:
 * 1. Gradual migration from D3 to ECharts
 * 2. Feature flag toggle between renderers
 * 3. A/B testing of visualization performance
 * 4. Easy rollback if issues arise
 *
 * Architecture:
 * - State Layer (KEEP): useChartState(), ChartContext
 * - Adapter Layer (NEW): Bridge components that transform state
 * - Render Layer (SWAP): D3 -> ECharts components
 *
 * Usage:
 * 1. Set NEXT_PUBLIC_RENDER_ENGINE=echarts in .env
 * 2. Or add ?renderEngine=echarts to URL for testing
 * 3. Use withRenderEngine(D3Component, EChartsComponent) for auto-switching
 */

// Render engine context for switching between D3 and ECharts
export {
  type RenderEngine,
  RenderEngineProvider,
  RenderIf,
  useRenderEngine,
  withRenderEngine,
} from "./render-engine-context";

// Column chart bridge (vertical bars)
export {
  EChartsColumns,
  EChartsErrorWhiskers,
} from "./echarts-column-bridge";

// Bar chart bridge (horizontal bars)
export { EChartsBars } from "./echarts-bar-bridge";

// Line chart bridge
export { EChartsLines } from "./echarts-line-bridge";

// Pie chart bridge
export { EChartsDonut, EChartsPie } from "./echarts-pie-bridge";

// Scatterplot bridge
export { EChartsScatterplot } from "./echarts-scatterplot-bridge";

// Area chart bridge
export { EChartsAreas } from "./echarts-area-bridge";
