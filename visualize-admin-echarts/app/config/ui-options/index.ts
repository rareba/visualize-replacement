/**
 * Chart Config UI Options
 *
 * Re-exports all chart configuration UI options from the legacy
 * chart-config-ui-options.ts. This file serves as the new canonical
 * import path for chart UI specifications.
 *
 * Usage:
 * import { getChartSpec, EncodingSpec, EncodingOption } from "@/config/ui-options";
 *
 * Available exports:
 * - getChartSpec() - Get UI specification for a chart type
 * - EncodingSpec - Type for encoding field specifications
 * - EncodingOption - Type for encoding options
 * - EncodingFieldType - Union of encoding field types
 * - Segment sorting configurations (AREA_SEGMENT_SORTING, etc.)
 * - Field change side effect handlers
 *
 * Migration Path:
 * The monolithic chart-config-ui-options.ts will eventually be split into:
 * - column.ts, bar.ts, line.ts, area.ts, pie.ts, etc.
 * - types.ts (EncodingSpec, EncodingOption, etc.)
 * - sorting.ts (segment sorting configs)
 * - side-effects.ts (field change handlers)
 */

// Re-export everything from legacy chart-config-ui-options
export * from "@/charts/chart-config-ui-options";
