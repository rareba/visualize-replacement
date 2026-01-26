/**
 * Config Adjusters
 *
 * Re-exports all field adjusters from the legacy config-adjusters.ts.
 * This file serves as the new canonical import path for config adjusters.
 *
 * Usage:
 * import { enableField, disableField, getAdjusters } from "@/config/adjusters";
 *
 * Available utilities:
 * - Field adjustment functions for chart configuration
 * - Adjuster registry for dynamic field manipulation
 */

// Re-export everything from legacy config-adjusters
export * from "@/config-adjusters";
