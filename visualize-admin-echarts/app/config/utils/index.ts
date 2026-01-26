/**
 * Config Utilities
 *
 * Re-exports all configuration utilities from the legacy config-utils.ts.
 * This file serves as the new canonical import path for config utilities.
 *
 * Usage:
 * import { getChartConfig, useChartConfigFilters } from "@/config/utils";
 *
 * Available utilities:
 * - getChartConfig() - Extract chart config from state
 * - getChartConfigFilters() - Get filters from chart config
 * - useChartConfigFilters() - Hook for chart config filters
 * - useDefinitiveFilters() - Hook for merged filters
 * - useLimits() - Hook for limit evaluation
 * - extractSingleFilters() - Extract single filter values
 * - makeMultiFilter() - Convert single to multi filter
 */

// Re-export everything from legacy config-utils
export * from "@/config-utils";
