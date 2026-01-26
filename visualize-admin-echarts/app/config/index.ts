/**
 * Config Module
 *
 * This module provides centralized access to all configuration-related
 * types, utilities, and specifications.
 *
 * Structure:
 * - types/     - Type definitions for chart configs, filters, etc.
 * - utils/     - Utility functions for config manipulation
 * - adjusters/ - Field adjuster type definitions
 * - ui-options/- UI specification for chart configurator
 *
 * Migration Note:
 * This module is being reorganized from the legacy flat structure.
 * During migration, both paths are supported:
 * - New: import { ChartConfig } from "@/config/types"
 * - Legacy: import { ChartConfig } from "@/config-types"
 */

// Re-export all types
export * from "./types";

// Re-export utilities
export * from "./utils";

// Re-export adjusters
export * from "./adjusters";

// Re-export UI options
export * from "./ui-options";
