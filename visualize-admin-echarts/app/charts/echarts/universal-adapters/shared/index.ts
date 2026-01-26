/**
 * Shared Utilities for Universal Adapters
 *
 * This module provides common utilities used across all ECharts universal adapters.
 * Using these utilities ensures consistent behavior for formatting, axes, tooltips, etc.
 */

export {
  type ResolvedFormatting,
  DEFAULT_FORMATTING,
  resolveFormatting,
  applyAxisFormatting,
  getAnimationDuration,
  createTooltipConfig,
  createLegendConfig,
} from "./formatting";
