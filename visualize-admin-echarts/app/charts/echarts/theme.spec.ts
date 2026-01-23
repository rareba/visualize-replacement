import { describe, expect, it } from "vitest";

import {
  getSwissFederalTheme,
  mergeWithTheme,
  SWISS_FEDERAL_COLORS,
  SWISS_FEDERAL_FONT,
  SWISS_FEDERAL_ANIMATION,
} from "./theme";

describe("Swiss Federal Theme", () => {
  describe("SWISS_FEDERAL_COLORS", () => {
    it("should have primary color", () => {
      expect(SWISS_FEDERAL_COLORS.primary).toBe("#d32f2f");
    });

    it("should have secondary color", () => {
      expect(SWISS_FEDERAL_COLORS.secondary).toBe("#1976d2");
    });

    it("should have text color", () => {
      expect(SWISS_FEDERAL_COLORS.text).toBe("#333333");
    });

    it("should have muted color", () => {
      expect(SWISS_FEDERAL_COLORS.muted).toBe("#666666");
    });

    it("should have a palette with at least 10 colors", () => {
      expect(SWISS_FEDERAL_COLORS.palette.length).toBeGreaterThanOrEqual(10);
    });

    it("should have valid hex colors in palette", () => {
      SWISS_FEDERAL_COLORS.palette.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe("SWISS_FEDERAL_FONT", () => {
    it("should have a font family", () => {
      expect(SWISS_FEDERAL_FONT.family).toContain("Source Sans Pro");
    });

    it("should have size configuration", () => {
      expect(SWISS_FEDERAL_FONT.size.label).toBe(12);
      expect(SWISS_FEDERAL_FONT.size.axis).toBe(11);
      expect(SWISS_FEDERAL_FONT.size.title).toBe(14);
      expect(SWISS_FEDERAL_FONT.size.legend).toBe(12);
    });
  });

  describe("SWISS_FEDERAL_ANIMATION", () => {
    it("should have animation duration", () => {
      expect(SWISS_FEDERAL_ANIMATION.duration).toBe(300);
    });

    it("should have easing function", () => {
      expect(SWISS_FEDERAL_ANIMATION.easing).toBe("cubicOut");
    });
  });

  describe("getSwissFederalTheme", () => {
    it("should return theme with color palette", () => {
      const theme = getSwissFederalTheme();
      expect(theme.color).toEqual(SWISS_FEDERAL_COLORS.palette);
    });

    it("should return theme with background color", () => {
      const theme = getSwissFederalTheme();
      expect(theme.backgroundColor).toBe(SWISS_FEDERAL_COLORS.background);
    });

    it("should return theme with text style", () => {
      const theme = getSwissFederalTheme();
      expect(theme.textStyle).toBeDefined();
      expect(theme.textStyle?.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    });

    it("should return theme with tooltip configuration", () => {
      const theme = getSwissFederalTheme();
      expect(theme.tooltip).toBeDefined();
      const tooltip = theme.tooltip as { backgroundColor?: string };
      expect(tooltip?.backgroundColor).toBe(SWISS_FEDERAL_COLORS.background);
    });

    it("should return theme with xAxis configuration", () => {
      const theme = getSwissFederalTheme();
      expect(theme.xAxis).toBeDefined();
    });

    it("should return theme with yAxis configuration", () => {
      const theme = getSwissFederalTheme();
      expect(theme.yAxis).toBeDefined();
    });

    it("should return theme with animation enabled", () => {
      const theme = getSwissFederalTheme();
      expect(theme.animation).toBe(true);
      expect(theme.animationDuration).toBe(SWISS_FEDERAL_ANIMATION.duration);
    });
  });

  describe("mergeWithTheme", () => {
    it("should merge custom options with theme", () => {
      const customOptions = {
        title: { text: "My Chart" },
      };
      const merged = mergeWithTheme(customOptions);
      expect(merged.title).toEqual({ text: "My Chart" });
      expect(merged.color).toEqual(SWISS_FEDERAL_COLORS.palette);
    });

    it("should deep merge textStyle", () => {
      const customOptions = {
        textStyle: { fontSize: 16 },
      };
      const merged = mergeWithTheme(customOptions);
      expect(merged.textStyle?.fontSize).toBe(16);
      expect(merged.textStyle?.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    });

    it("should deep merge grid options", () => {
      const customOptions = {
        grid: { left: 50, right: 50 },
      };
      const merged = mergeWithTheme(customOptions);
      const grid = merged.grid as { left?: number; containLabel?: boolean };
      expect(grid?.left).toBe(50);
      expect(grid?.containLabel).toBe(true);
    });
  });
});
