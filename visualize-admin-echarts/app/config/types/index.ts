/**
 * Config Types
 *
 * Re-exports all configuration types from the legacy config-types.ts.
 * This file serves as the new canonical import path for config types.
 *
 * Usage:
 * import { ChartConfig, AreaConfig, Filters } from "@/config/types";
 *
 * Migration Path:
 * Types are being gradually migrated from @/config-types to this module.
 * The split structure will eventually be:
 * - dimensions-measures.ts
 * - filters.ts
 * - interactive-filters.ts
 * - colors.ts
 * - fields.ts
 * - palettes.ts
 * - chart-configs/ (per chart type)
 * - layout.ts
 * - configurator-state.ts
 */

// Re-export everything from legacy config-types
export * from "@/config-types";
