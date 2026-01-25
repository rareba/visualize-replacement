/**
 * Tests for Shared Utilities
 */

import { describe, expect, it } from "vitest";

import {
  // Animation utilities
  createCoordinatedAnimation,
  shouldDisableAnimation,
  createUpdateAnimation,
  // Responsive utilities
  calculateResponsiveBounds,
  getBreakpoint,
  getResponsiveFontSize,
  shouldRotateLabels,
  BREAKPOINTS,
  // Validation utilities
  validateNonEmpty,
  validateNumericData,
  validateCategoryDataMatch,
  validateSegmentData,
  validatePieData,
  validateChartData,
} from "./shared-utilities";

// ============================================================================
// Animation Utilities Tests
// ============================================================================

describe("Animation Utilities", () => {
  describe("createCoordinatedAnimation", () => {
    it("should return default animation config", () => {
      const config = createCoordinatedAnimation();

      expect(config.animationDuration).toBe(500);
      expect(config.animationEasing).toBe("cubicOut");
      expect(config.animationDelay).toBe(0);
      expect(config.animationThreshold).toBe(2000);
    });

    it("should accept custom duration", () => {
      const config = createCoordinatedAnimation({ duration: 1000 });
      expect(config.animationDuration).toBe(1000);
    });

    it("should calculate staggered series delay", () => {
      const config = createCoordinatedAnimation({ duration: 500, delay: 100 });

      expect(config.getSeriesDelay(0)).toBe(100);
      expect(config.getSeriesDelay(1)).toBe(150);
      expect(config.getSeriesDelay(2)).toBe(200);
    });
  });

  describe("shouldDisableAnimation", () => {
    it("should return false for small datasets", () => {
      expect(shouldDisableAnimation(100)).toBe(false);
      expect(shouldDisableAnimation(1000)).toBe(false);
    });

    it("should return true for large datasets", () => {
      expect(shouldDisableAnimation(3000)).toBe(true);
      expect(shouldDisableAnimation(10000)).toBe(true);
    });

    it("should respect custom threshold", () => {
      expect(shouldDisableAnimation(500, 400)).toBe(true);
      expect(shouldDisableAnimation(500, 600)).toBe(false);
    });
  });

  describe("createUpdateAnimation", () => {
    it("should return faster animation for updates", () => {
      const config = createUpdateAnimation();

      expect(config.animationDuration).toBeLessThan(500);
      expect(config.animationEasing).toBe("cubicOut");
    });
  });
});

// ============================================================================
// Responsive Utilities Tests
// ============================================================================

describe("Responsive Utilities", () => {
  describe("calculateResponsiveBounds", () => {
    it("should return default bounds without config", () => {
      const bounds = calculateResponsiveBounds();

      expect(bounds.width).toBe(600);
      expect(bounds.height).toBe(400);
      expect(bounds.margins).toBeDefined();
      expect(bounds.chartWidth).toBeGreaterThan(0);
      expect(bounds.chartHeight).toBeGreaterThan(0);
    });

    it("should respect container dimensions", () => {
      const bounds = calculateResponsiveBounds({
        containerWidth: 800,
        containerHeight: 500,
      });

      expect(bounds.width).toBe(800);
      expect(bounds.height).toBe(500);
    });

    it("should clamp to min dimensions", () => {
      const bounds = calculateResponsiveBounds({
        containerWidth: 100,
        containerHeight: 50,
        minWidth: 300,
        minHeight: 200,
      });

      expect(bounds.width).toBe(300);
      expect(bounds.height).toBe(200);
    });

    it("should clamp to max dimensions", () => {
      const bounds = calculateResponsiveBounds({
        containerWidth: 2000,
        containerHeight: 1500,
        maxWidth: 1200,
        maxHeight: 800,
      });

      expect(bounds.width).toBe(1200);
      expect(bounds.height).toBe(800);
    });

    it("should calculate aspect ratio", () => {
      const bounds = calculateResponsiveBounds({
        containerWidth: 800,
        containerHeight: 400,
      });

      expect(bounds.aspectRatio).toBeGreaterThan(0);
    });
  });

  describe("getBreakpoint", () => {
    it("should return xs for very small widths", () => {
      expect(getBreakpoint(280)).toBe("xs");
    });

    it("should return sm for small widths", () => {
      expect(getBreakpoint(500)).toBe("sm");
    });

    it("should return md for medium widths", () => {
      expect(getBreakpoint(800)).toBe("md");
    });

    it("should return lg for large widths", () => {
      expect(getBreakpoint(1100)).toBe("lg");
    });

    it("should return xl for extra large widths", () => {
      expect(getBreakpoint(1400)).toBe("xl");
    });
  });

  describe("getResponsiveFontSize", () => {
    it("should return smaller fonts for xs breakpoint", () => {
      const fonts = getResponsiveFontSize("xs");

      expect(fonts.title).toBeLessThan(14);
      expect(fonts.label).toBeLessThan(12);
      expect(fonts.tick).toBeLessThan(10);
    });

    it("should return larger fonts for xl breakpoint", () => {
      const fonts = getResponsiveFontSize("xl");

      expect(fonts.title).toBeGreaterThanOrEqual(16);
      expect(fonts.label).toBeGreaterThanOrEqual(12);
      expect(fonts.tick).toBeGreaterThanOrEqual(10);
    });
  });

  describe("shouldRotateLabels", () => {
    it("should not rotate labels when space is sufficient", () => {
      const result = shouldRotateLabels(1000, 5);

      expect(result.rotate).toBe(false);
      expect(result.angle).toBe(0);
    });

    it("should rotate labels at 45 degrees when space is limited", () => {
      const result = shouldRotateLabels(200, 10);

      expect(result.rotate).toBe(true);
      expect(result.angle).toBe(-45);
    });

    it("should rotate labels at 90 degrees when space is very limited", () => {
      const result = shouldRotateLabels(100, 20);

      expect(result.rotate).toBe(true);
      expect(result.angle).toBe(-90);
    });
  });

  describe("BREAKPOINTS", () => {
    it("should have expected breakpoint values", () => {
      expect(BREAKPOINTS.xs).toBe(320);
      expect(BREAKPOINTS.sm).toBe(480);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
    });
  });
});

// ============================================================================
// Validation Utilities Tests
// ============================================================================

describe("Validation Utilities", () => {
  describe("validateNonEmpty", () => {
    it("should pass for non-empty array", () => {
      const result = validateNonEmpty([1, 2, 3]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should warn for empty array", () => {
      const result = validateNonEmpty([]);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("data is empty");
    });

    it("should fail for non-array", () => {
      const result = validateNonEmpty("not an array" as unknown as unknown[]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateNumericData", () => {
    it("should pass for valid numeric data", () => {
      const result = validateNumericData([1, 2, 3, 4, 5]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should allow null values by default", () => {
      const result = validateNumericData([1, null, 3]);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should fail for null values when not allowed", () => {
      const result = validateNumericData([1, null, 3], { allowNull: false });

      expect(result.isValid).toBe(false);
    });

    it("should allow negative values by default", () => {
      const result = validateNumericData([-1, -2, 3]);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should fail for NaN values", () => {
      const result = validateNumericData([1, NaN, 3]);

      expect(result.isValid).toBe(false);
    });
  });

  describe("validateCategoryDataMatch", () => {
    it("should pass when counts match", () => {
      const result = validateCategoryDataMatch(["A", "B", "C"], [1, 2, 3]);

      expect(result.isValid).toBe(true);
    });

    it("should fail when counts don't match", () => {
      const result = validateCategoryDataMatch(["A", "B"], [1, 2, 3]);

      expect(result.isValid).toBe(false);
    });

    it("should warn about duplicate categories", () => {
      const result = validateCategoryDataMatch(["A", "B", "A"], [1, 2, 3]);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("validateSegmentData", () => {
    it("should pass when all segments have data", () => {
      const segmentData = new Map([
        ["A", [1, 2]],
        ["B", [3, 4]],
      ]);
      const result = validateSegmentData(["A", "B"], segmentData);

      expect(result.isValid).toBe(true);
    });

    it("should fail when segment is missing data", () => {
      const segmentData = new Map([["A", [1, 2]]]);
      const result = validateSegmentData(["A", "B"], segmentData);

      expect(result.isValid).toBe(false);
    });

    it("should warn about extra data", () => {
      const segmentData = new Map([
        ["A", [1, 2]],
        ["B", [3, 4]],
        ["C", [5, 6]],
      ]);
      const result = validateSegmentData(["A", "B"], segmentData);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should work with plain objects", () => {
      const result = validateSegmentData(["A", "B"], { A: [1], B: [2] });

      expect(result.isValid).toBe(true);
    });
  });

  describe("validatePieData", () => {
    it("should pass for valid pie data", () => {
      const result = validatePieData([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
      ]);

      expect(result.isValid).toBe(true);
    });

    it("should warn about negative values", () => {
      const result = validatePieData([
        { name: "A", value: 10 },
        { name: "B", value: -5 },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("Negative"))).toBe(true);
    });

    it("should warn when no positive values exist", () => {
      const result = validatePieData([
        { name: "A", value: 0 },
        { name: "B", value: 0 },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("No positive"))).toBe(true);
    });

    it("should fail for missing name", () => {
      const result = validatePieData([
        { name: "", value: 10 },
      ]);

      expect(result.isValid).toBe(false);
    });
  });

  describe("validateChartData", () => {
    it("should pass for valid chart state", () => {
      const result = validateChartData({
        observations: [{ x: 1 }],
        categories: ["A"],
        segments: [],
      });

      expect(result.isValid).toBe(true);
    });

    it("should warn for empty observations", () => {
      const result = validateChartData({
        observations: [],
        categories: ["A"],
        segments: [],
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("empty"))).toBe(true);
    });

    it("should validate segments when present", () => {
      const result = validateChartData({
        observations: [{ x: 1 }],
        categories: ["A"],
        segments: ["S1", "S2"],
      });

      expect(result.isValid).toBe(true);
    });
  });
});
