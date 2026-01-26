/**
 * Utils Index
 *
 * Centralized exports for utility functions and hooks.
 * Organized by category for easier discovery and maintenance.
 *
 * Usage:
 * import { createId, bfs, assert } from "@/utils";
 * import { useLocalState, useResizeObserver } from "@/utils";
 *
 * Note: Individual files can still be imported directly:
 * import { createId } from "@/utils/create-id";
 */

// =============================================================================
// Core Utilities
// =============================================================================
export { animationFrame } from "./animation-frame";
export { sortByIndex } from "./array";
export { assert } from "./assert";
export { bfs } from "./bfs";
export { createId } from "./create-id";
export { objectToHashString, hashStringToObject } from "./hash-utils";
export { interlace } from "./interlace";
export { maybeWindow } from "./maybe-window";
export { orderedIsEqual } from "./ordered-is-equal";
export { sleep } from "./sleep";
export { softJSONParse } from "./soft-json-parse";
export { timed } from "./timed";
export { unreachableError } from "./unreachable";

// =============================================================================
// Color Utilities
// =============================================================================
export {
  hasEnoughContrast,
  createColorId,
  getFittingColorInterpolator,
} from "./color-palette-utils";
export {
  hexToRgba,
  hexToHsva,
  hsvaToHex,
  getContrastingColor,
  type HsvaColor,
} from "./color-utils";

// =============================================================================
// Data Utilities
// =============================================================================
export { resolveMostRecentValue, useResolveMostRecentValue } from "./most-recent-value";
export { getSortingOrders } from "./sorting-values";
export { hierarchyToOptions, isMultiHierarchyNode } from "./hierarchy";
export {
  getDimensionValueLabel,
  getDimensionValueIdentifier,
  getDimensionValuePosition,
  getDimensionValueDescription,
  findDimensionValueById,
  findDimensionValueByLabel,
  findDimensionValue,
  createLabelResolver,
  createAbbreviationResolver,
  createDimensionGetter,
  createDimensionLabelGetter,
  getDimensionLabel,
  getDimensionUniqueValues,
  getDimensionUniqueLabels,
  buildDimensionDomain,
  getDimensionType,
  canFilterByTime,
  canFilterByMultipleValues,
  buildDimensionValueMap,
  buildDimensionColorMap,
  type DimensionType,
} from "./dimension-utils";

// =============================================================================
// API Utilities
// =============================================================================
export { apiFetch } from "./api";
export { runMiddleware } from "./run-middleware";

// =============================================================================
// React Hooks
// =============================================================================
export { useChanges } from "./use-changes";
export { useEvent } from "./use-event";
export { useFetchData } from "./use-fetch-data";
export { useI18n } from "./use-i18n";
export { useIsMobile } from "./use-is-mobile";
export { useLocalState } from "./use-local-state";
export { useNProgress } from "./use-nprogress";
export { useResizeObserver } from "./use-resize-observer";
export { useScreenshot } from "./use-screenshot";
export { useTimedPrevious } from "./use-timed-previous";
export { useTimeout } from "./use-timeout";
export { useUserPalettes } from "./use-user-palettes";

// =============================================================================
// UI Utilities
// =============================================================================
export { getTextSize, type GetTextSizeOptions } from "./get-text-size";
export { getTextWidth } from "./get-text-width";
export { EventEmitterProvider, useEventEmitter } from "./event-emitter";
export { Flashes, getErrorQueryParams } from "./flashes";
export { createSnapCornerToCursor } from "./dnd";

// =============================================================================
// Localization
// =============================================================================
export { AsyncLocalizationProvider } from "./async-localization-provider";
export { getTimeFilterOptions } from "./time-filter-options";

// =============================================================================
// Analytics
// =============================================================================
export { analyticsPageView, analyticsEvent } from "./google-analytics";

// =============================================================================
// Console Utilities (Development)
// =============================================================================
export { logger } from "./colored-console";
