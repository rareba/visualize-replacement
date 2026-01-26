/**
 * Tests for interaction, animation, responsive, and validation utilities.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  // Interaction utilities
  createClickHandler,
  createHoverHandler,
  highlightSeries,
  downplaySeries,
  showTooltipAt,
  hideTooltip,
  // Animation utilities
  ANIMATION_PRESETS,
  createSeriesAnimation,
  createCoordinatedAnimation,
  createEnterAnimation,
  createExitAnimation,
  // Responsive utilities
  getBreakpoint,
  calculateResponsiveMargins,
  calculateResponsiveFontSizes,
  calculateResponsiveSymbolSize,
  shouldShowAxisLabels,
  calculateAxisLabelRotation,
  // Validation utilities
  validateDataArray,
  validateNumericValue,
  validateObservations,
  validateAxisDomain,
  combineValidationResults,
  validateAndSanitizeData,
  validateChartState,
} from "./interaction-utils";

// ============================================================================
// Mock ECharts
// ============================================================================

const createMockChart = () => {
  const handlers: Record<string, Function[]> = {};

  return {
    on: vi.fn((event: string, handler: Function) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    off: vi.fn((event: string, handler: Function) => {
      if (handlers[event]) {
        handlers[event] = handlers[event].filter(h => h !== handler);
      }
    }),
    dispatchAction: vi.fn(),
    trigger: (event: string, params: unknown) => {
      handlers[event]?.forEach(h => h(params));
    },
  };
};

// ============================================================================
// Interaction Tests
// ============================================================================

describe("Interaction Utilities", () => {
  describe("createClickHandler", () => {
    it("should register click handler on chart", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      createClickHandler(mockChart as any, callback);

      expect(mockChart.on).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should call callback with data on series click", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      createClickHandler(mockChart as any, callback);

      mockChart.trigger("click", {
        componentType: "series",
        data: { value: 42, name: "test" },
      });

      expect(callback).toHaveBeenCalledWith(
        { value: 42, name: "test" },
        expect.objectContaining({ componentType: "series" })
      );
    });

    it("should not call callback for non-series clicks", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      createClickHandler(mockChart as any, callback);

      mockChart.trigger("click", {
        componentType: "legend",
        data: undefined,
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should return cleanup function", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      const cleanup = createClickHandler(mockChart as any, callback);
      cleanup();

      expect(mockChart.off).toHaveBeenCalledWith("click", expect.any(Function));
    });
  });

  describe("createHoverHandler", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should register mouseover and mouseout handlers", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      createHoverHandler(mockChart as any, callback);

      expect(mockChart.on).toHaveBeenCalledWith("mouseover", expect.any(Function));
      expect(mockChart.on).toHaveBeenCalledWith("mouseout", expect.any(Function));
    });

    it("should debounce hover callback", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      createHoverHandler(mockChart as any, callback, 100);

      mockChart.trigger("mouseover", {
        componentType: "series",
        data: { value: 1 },
      });

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith(
        { value: 1 },
        expect.objectContaining({ componentType: "series" })
      );
    });

    it("should call with null on mouseout", () => {
      const mockChart = createMockChart();
      const callback = vi.fn();

      createHoverHandler(mockChart as any, callback, 50);

      mockChart.trigger("mouseout", {});
      vi.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledWith(null, null);
    });

    vi.useRealTimers();
  });

  describe("highlightSeries", () => {
    it("should dispatch highlight action", () => {
      const mockChart = createMockChart();

      highlightSeries(mockChart as any, { seriesIndex: 0 });

      expect(mockChart.dispatchAction).toHaveBeenCalledWith({
        type: "highlight",
        seriesIndex: 0,
      });
    });
  });

  describe("downplaySeries", () => {
    it("should dispatch downplay action", () => {
      const mockChart = createMockChart();

      downplaySeries(mockChart as any, { seriesName: "test" });

      expect(mockChart.dispatchAction).toHaveBeenCalledWith({
        type: "downplay",
        seriesName: "test",
      });
    });
  });

  describe("showTooltipAt", () => {
    it("should dispatch showTip action", () => {
      const mockChart = createMockChart();

      showTooltipAt(mockChart as any, { dataIndex: 5 });

      expect(mockChart.dispatchAction).toHaveBeenCalledWith({
        type: "showTip",
        dataIndex: 5,
      });
    });
  });

  describe("hideTooltip", () => {
    it("should dispatch hideTip action", () => {
      const mockChart = createMockChart();

      hideTooltip(mockChart as any);

      expect(mockChart.dispatchAction).toHaveBeenCalledWith({
        type: "hideTip",
      });
    });
  });
});

// ============================================================================
// Animation Tests
// ============================================================================

describe("Animation Utilities", () => {
  describe("ANIMATION_PRESETS", () => {
    it("should have standard presets", () => {
      expect(ANIMATION_PRESETS.fast).toBeDefined();
      expect(ANIMATION_PRESETS.standard).toBeDefined();
      expect(ANIMATION_PRESETS.emphasis).toBeDefined();
      expect(ANIMATION_PRESETS.staggered).toBeDefined();
      expect(ANIMATION_PRESETS.none).toBeDefined();
    });

    it("none preset should have 0 duration", () => {
      expect(ANIMATION_PRESETS.none.duration).toBe(0);
    });

    it("staggered preset should have delay function", () => {
      expect(typeof ANIMATION_PRESETS.staggered.delay).toBe("function");
    });
  });

  describe("createSeriesAnimation", () => {
    it("should use standard preset by default", () => {
      const animation = createSeriesAnimation();

      expect(animation.duration).toBe(ANIMATION_PRESETS.standard.duration);
      expect(animation.easing).toBe(ANIMATION_PRESETS.standard.easing);
    });

    it("should add series index delay", () => {
      const animation = createSeriesAnimation("standard", 2);

      expect(animation.delay).toBe(200); // 2 * 100ms
    });
  });

  describe("createCoordinatedAnimation", () => {
    it("should create staggered animations for multiple series", () => {
      const animations = createCoordinatedAnimation(3);

      expect(animations).toHaveLength(3);
      expect(animations[0].delay).toBe(0);
      expect(animations[1].delay).toBe(100);
      expect(animations[2].delay).toBe(200);
    });

    it("should use custom stagger interval", () => {
      const animations = createCoordinatedAnimation(2, "fast", 50);

      expect(animations[0].delay).toBe(0);
      expect(animations[1].delay).toBe(50);
    });
  });

  describe("createEnterAnimation", () => {
    it("should return enter animation config", () => {
      const animation = createEnterAnimation();

      expect(animation.animationDuration).toBeDefined();
      expect(animation.animationEasing).toBeDefined();
      expect(animation.animationDurationUpdate).toBeDefined();
    });
  });

  describe("createExitAnimation", () => {
    it("should return exit animation config", () => {
      const animation = createExitAnimation();

      expect(animation.animationDuration).toBeDefined();
      expect(animation.animationEasing).toBeDefined();
    });
  });
});

// ============================================================================
// Responsive Tests
// ============================================================================

describe("Responsive Utilities", () => {
  describe("getBreakpoint", () => {
    it("should return mobile for small widths", () => {
      expect(getBreakpoint(320)).toBe("mobile");
    });

    it("should return tablet for medium widths", () => {
      expect(getBreakpoint(600)).toBe("tablet");
    });

    it("should return desktop for larger widths", () => {
      expect(getBreakpoint(900)).toBe("desktop");
    });

    it("should return large for wide screens", () => {
      expect(getBreakpoint(1100)).toBe("large");
    });

    it("should return xlarge for very wide screens", () => {
      expect(getBreakpoint(1400)).toBe("xlarge");
    });
  });

  describe("calculateResponsiveMargins", () => {
    it("should return smaller margins for mobile", () => {
      const margins = calculateResponsiveMargins(320, 480);

      expect(margins.left).toBeLessThan(60);
      expect(margins.right).toBeLessThan(40);
    });

    it("should return larger margins for desktop", () => {
      const margins = calculateResponsiveMargins(1024, 768);

      expect(margins.left).toBeGreaterThanOrEqual(60);
    });
  });

  describe("calculateResponsiveFontSizes", () => {
    it("should return smaller fonts for mobile", () => {
      const fonts = calculateResponsiveFontSizes(320);

      expect(fonts.label).toBeLessThanOrEqual(10);
    });

    it("should return larger fonts for desktop", () => {
      const fonts = calculateResponsiveFontSizes(1024);

      expect(fonts.label).toBeGreaterThanOrEqual(12);
    });
  });

  describe("calculateResponsiveSymbolSize", () => {
    it("should return smaller symbols for mobile", () => {
      const size = calculateResponsiveSymbolSize(320, 50);

      expect(size).toBeLessThanOrEqual(6);
    });

    it("should reduce size for large datasets", () => {
      const normalSize = calculateResponsiveSymbolSize(1024, 50);
      const largeDatasetSize = calculateResponsiveSymbolSize(1024, 600);

      expect(largeDatasetSize).toBeLessThan(normalSize);
    });
  });

  describe("shouldShowAxisLabels", () => {
    it("should return true when labels fit", () => {
      const result = shouldShowAxisLabels(1000, 5, 5);

      expect(result).toBe(true);
    });

    it("should return false when labels overflow", () => {
      const result = shouldShowAxisLabels(200, 50, 20);

      expect(result).toBe(false);
    });
  });

  describe("calculateAxisLabelRotation", () => {
    it("should return 0 when labels fit comfortably", () => {
      const rotation = calculateAxisLabelRotation(1000, 5, 5);

      expect(rotation).toBe(0);
    });

    it("should return negative rotation when labels are cramped", () => {
      const rotation = calculateAxisLabelRotation(200, 20, 10);

      expect(rotation).toBeLessThan(0);
    });

    it("should return -90 for very cramped labels", () => {
      const rotation = calculateAxisLabelRotation(100, 50, 20);

      expect(rotation).toBe(-90);
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("Validation Utilities", () => {
  describe("validateDataArray", () => {
    it("should pass for valid array", () => {
      const result = validateDataArray([1, 2, 3]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for non-array", () => {
      const result = validateDataArray("not an array");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("data must be an array");
    });

    it("should warn for empty array", () => {
      const result = validateDataArray([]);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("data is empty");
    });
  });

  describe("validateNumericValue", () => {
    it("should pass for finite number", () => {
      const result = validateNumericValue(42);

      expect(result.isValid).toBe(true);
    });

    it("should warn for null", () => {
      const result = validateNumericValue(null);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should fail for non-number", () => {
      const result = validateNumericValue("42");

      expect(result.isValid).toBe(false);
    });

    it("should fail for NaN", () => {
      const result = validateNumericValue(NaN);

      expect(result.isValid).toBe(false);
    });

    it("should fail for Infinity", () => {
      const result = validateNumericValue(Infinity);

      expect(result.isValid).toBe(false);
    });
  });

  describe("validateObservations", () => {
    it("should pass for valid observations", () => {
      const observations = [
        { x: "A", y: 1 },
        { x: "B", y: 2 },
      ];

      const result = validateObservations(observations, {
        getX: (d: any) => d.x,
        getY: (d: any) => d.y,
      });

      expect(result.isValid).toBe(true);
    });

    it("should warn for empty observations", () => {
      const result = validateObservations([], {});

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("No observations provided");
    });

    it("should warn for null values", () => {
      const observations = [{ x: null, y: 1 }];

      const result = validateObservations(observations, {
        getX: (d: any) => d.x,
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("validateAxisDomain", () => {
    it("should pass for valid domain", () => {
      const result = validateAxisDomain(0, 100);

      expect(result.isValid).toBe(true);
    });

    it("should fail when min > max", () => {
      const result = validateAxisDomain(100, 0);

      expect(result.isValid).toBe(false);
    });

    it("should warn when min equals max", () => {
      const result = validateAxisDomain(50, 50);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should fail for non-finite values", () => {
      const result = validateAxisDomain(Infinity, 100);

      expect(result.isValid).toBe(false);
    });
  });

  describe("combineValidationResults", () => {
    it("should combine multiple results", () => {
      const result1 = { isValid: true, errors: [], warnings: ["warn1"] };
      const result2 = { isValid: false, errors: ["error1"], warnings: [] };

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(false);
      expect(combined.errors).toContain("error1");
      expect(combined.warnings).toContain("warn1");
    });
  });

  describe("validateAndSanitizeData", () => {
    it("should return empty array for null/undefined", () => {
      expect(validateAndSanitizeData(null)).toEqual([]);
      expect(validateAndSanitizeData(undefined)).toEqual([]);
    });

    it("should return data unchanged without validator", () => {
      const data = [1, 2, 3];
      expect(validateAndSanitizeData(data)).toEqual(data);
    });

    it("should filter data with validator", () => {
      const data = [1, 2, 3, 4, 5];
      const result = validateAndSanitizeData(data, x => x > 2);

      expect(result).toEqual([3, 4, 5]);
    });
  });

  describe("validateChartState", () => {
    it("should pass for valid state", () => {
      const state = {
        observations: [{ x: 1, y: 2 }],
        fields: {
          getX: (d: any) => d.x,
          getY: (d: any) => d.y,
        },
      };

      const result = validateChartState(state);

      expect(result.isValid).toBe(true);
    });

    it("should fail for missing observations", () => {
      const state = {
        fields: { getX: () => 1 },
      };

      const result = validateChartState(state);

      expect(result.isValid).toBe(false);
    });

    it("should fail for missing fields", () => {
      const state = {
        observations: [],
      };

      const result = validateChartState(state);

      expect(result.isValid).toBe(false);
    });

    it("should warn for missing accessors", () => {
      const state = {
        observations: [],
        fields: {},
      };

      const result = validateChartState(state);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
