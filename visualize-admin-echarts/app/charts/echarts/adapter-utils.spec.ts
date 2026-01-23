/**
 * Adapter Utilities Tests
 *
 * Tests for shared ECharts adapter utilities.
 */

import { describe, expect, it } from "vitest";

import {
  buildSeriesDataFromMap,
  calculateChartDimensions,
  createAxisTooltip,
  createGridConfig,
  createItemTooltip,
  createLegend,
  createNoDataGraphic,
  createValueAxis,
  createXCategoryAxis,
  getDefaultAnimation,
  groupDataBySegment,
  safeGetBounds,
  safeGetDomain,
  safeGetNumericDomain,
} from "./adapter-utils";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "./theme";

describe("Adapter Utilities", () => {
  describe("safeGetDomain", () => {
    it("should return domain from valid scale", () => {
      const scale = { domain: () => [0, 100] };
      const result = safeGetDomain(scale, [0, 50]);
      expect(result).toEqual([0, 100]);
    });

    it("should return fallback for undefined scale", () => {
      const result = safeGetDomain(undefined, [0, 50]);
      expect(result).toEqual([0, 50]);
    });

    it("should return fallback for scale without domain function", () => {
      const scale = { domain: "not a function" } as unknown as { domain: () => [number, number] };
      const result = safeGetDomain(scale, [0, 50]);
      expect(result).toEqual([0, 50]);
    });

    it("should return fallback for invalid domain array", () => {
      const scale = { domain: () => [0] as unknown as [number, number] };
      const result = safeGetDomain(scale, [0, 50]);
      expect(result).toEqual([0, 50]);
    });

    it("should handle NaN values in numeric domain", () => {
      const scale = { domain: () => [NaN, 100] };
      const result = safeGetDomain(scale, [0, 50]);
      expect(result).toEqual([0, 100]);
    });

    it("should handle NaN in both values", () => {
      const scale = { domain: () => [NaN, NaN] };
      const result = safeGetDomain(scale, [0, 50]);
      expect(result).toEqual([0, 50]);
    });
  });

  describe("safeGetNumericDomain", () => {
    it("should return domain from valid scale", () => {
      const scale = { domain: () => [10, 200] as [number, number] };
      const result = safeGetNumericDomain(scale);
      expect(result).toEqual([10, 200]);
    });

    it("should return 0-100 fallback for undefined scale", () => {
      const result = safeGetNumericDomain(undefined);
      expect(result).toEqual([0, 100]);
    });
  });

  describe("safeGetBounds", () => {
    it("should return bounds when provided", () => {
      const bounds = {
        width: 600,
        chartHeight: 400,
        margins: { left: 50, right: 30, top: 20, bottom: 40 },
      };
      const result = safeGetBounds(bounds);
      expect(result).toEqual(bounds);
    });

    it("should return default bounds for undefined", () => {
      const result = safeGetBounds(undefined);
      expect(result.width).toBe(500);
      expect(result.chartHeight).toBe(300);
      expect(result.margins).toEqual({ left: 60, right: 40, top: 40, bottom: 60 });
    });

    it("should fill in missing properties with defaults", () => {
      const result = safeGetBounds({ width: 800 });
      expect(result.width).toBe(800);
      expect(result.chartHeight).toBe(300);
    });
  });

  describe("createCategoryAxis / createXCategoryAxis", () => {
    it("should create category axis with required properties", () => {
      const result = createXCategoryAxis({
        categories: ["A", "B", "C"],
        name: "Categories",
      });

      expect(result.type).toBe("category");
      expect((result as { data?: string[] }).data).toEqual(["A", "B", "C"]);
      expect(result.name).toBe("Categories");
      expect(result.nameLocation).toBe("middle");
    });

    it("should apply Swiss Federal styling", () => {
      const result = createXCategoryAxis({
        categories: ["X"],
      });

      expect(result.axisLabel).toHaveProperty("fontFamily", SWISS_FEDERAL_FONT.family);
      expect(result.axisLabel).toHaveProperty("fontSize", 12);
      expect(result.axisLabel).toHaveProperty("color", SWISS_FEDERAL_COLORS.text);
    });

    it("should support custom nameGap", () => {
      const result = createXCategoryAxis({
        categories: ["A"],
        nameGap: 50,
      });

      expect(result.nameGap).toBe(50);
    });

    it("should support boundaryGap option", () => {
      const result = createXCategoryAxis({
        categories: ["A"],
        boundaryGap: false,
      });

      expect((result as { boundaryGap?: boolean }).boundaryGap).toBe(false);
    });
  });

  describe("createValueAxis", () => {
    it("should create value axis with required properties", () => {
      const result = createValueAxis({
        name: "Values",
        min: 0,
        max: 100,
      });

      expect(result.type).toBe("value");
      expect(result.name).toBe("Values");
      expect(result.min).toBe(0);
      expect(result.max).toBe(100);
    });

    it("should apply Swiss Federal styling", () => {
      const result = createValueAxis({});

      expect(result.axisLabel).toHaveProperty("fontFamily", SWISS_FEDERAL_FONT.family);
      expect(result.splitLine).toHaveProperty("lineStyle");
    });

    it("should default nameGap to 50", () => {
      const result = createValueAxis({});
      expect(result.nameGap).toBe(50);
    });
  });

  describe("createGridConfig", () => {
    it("should create grid from bounds", () => {
      const bounds = {
        width: 600,
        chartHeight: 400,
        margins: { left: 50, right: 30, top: 20, bottom: 40 },
      };
      const result = createGridConfig(bounds);

      expect(result.left).toBe(50);
      expect(result.right).toBe(30);
      expect(result.top).toBe(20);
      expect(result.bottom).toBe(40);
      expect(result.containLabel).toBe(false);
    });

    it("should add extra bottom when specified", () => {
      const bounds = {
        width: 600,
        chartHeight: 400,
        margins: { left: 50, right: 30, top: 20, bottom: 40 },
      };
      const result = createGridConfig(bounds, 30);

      expect(result.bottom).toBe(70);
    });
  });

  describe("createAxisTooltip", () => {
    it("should create axis tooltip config", () => {
      const result = createAxisTooltip();

      expect(result.trigger).toBe("axis");
      expect(result.axisPointer).toEqual({ type: "shadow" });
    });
  });

  describe("createItemTooltip", () => {
    it("should create item tooltip config", () => {
      const result = createItemTooltip();

      expect(result.trigger).toBe("item");
    });
  });

  describe("createLegend", () => {
    it("should be hidden by default", () => {
      const result = createLegend();
      expect(result.show).toBe(false);
    });

    it("should show when specified", () => {
      const result = createLegend(true);
      expect(result.show).toBe(true);
    });

    it("should use Swiss Federal font", () => {
      const result = createLegend();
      expect(result.textStyle.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    });
  });

  describe("getDefaultAnimation", () => {
    it("should return animation settings", () => {
      const result = getDefaultAnimation();

      expect(result.animationDuration).toBe(500);
      expect(result.animationEasing).toBe("cubicOut");
    });
  });

  describe("createNoDataGraphic", () => {
    it("should create no data message", () => {
      const result = createNoDataGraphic();

      expect(result.type).toBe("text");
      expect(result.left).toBe("center");
      expect(result.top).toBe("middle");
      expect(result.style.text).toBe("No data available");
      expect(result.style.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    });
  });

  describe("groupDataBySegment", () => {
    it("should group data by segment", () => {
      const data = [
        { category: "A", segment: "S1", value: 10 },
        { category: "B", segment: "S1", value: 20 },
        { category: "A", segment: "S2", value: 15 },
      ];

      const result = groupDataBySegment(
        data,
        ["S1", "S2"],
        (d) => d.segment,
        (d) => d.category,
        (d) => d.value
      );

      expect(result.get("S1")?.get("A")).toBe(10);
      expect(result.get("S1")?.get("B")).toBe(20);
      expect(result.get("S2")?.get("A")).toBe(15);
    });

    it("should handle empty data", () => {
      type DataItem = { segment: string; category: string; value: number };
      const result = groupDataBySegment<DataItem, string>(
        [],
        ["S1"],
        (d) => d.segment,
        (d) => d.category,
        (d) => d.value
      );

      expect(result.get("S1")?.size).toBe(0);
    });
  });

  describe("buildSeriesDataFromMap", () => {
    it("should build series data from map", () => {
      const map = new Map<string, number | null>([
        ["A", 10],
        ["B", 20],
        ["C", null],
      ]);

      const result = buildSeriesDataFromMap(map, ["A", "B", "C", "D"]);

      expect(result).toEqual([10, 20, null, null]);
    });

    it("should handle undefined map", () => {
      const result = buildSeriesDataFromMap(undefined, ["A", "B"]);
      expect(result).toEqual([null, null]);
    });
  });

  describe("calculateChartDimensions", () => {
    it("should calculate dimensions from bounds", () => {
      const bounds = {
        width: 600,
        chartHeight: 400,
        margins: { left: 50, right: 30, top: 20, bottom: 40 },
      };

      const result = calculateChartDimensions(bounds);

      expect(result.width).toBe(600);
      expect(result.height).toBe(460); // 400 + 20 + 40
    });

    it("should add extra height when specified", () => {
      const bounds = {
        width: 600,
        chartHeight: 400,
        margins: { left: 50, right: 30, top: 20, bottom: 40 },
      };

      const result = calculateChartDimensions(bounds, 50);

      expect(result.height).toBe(510); // 400 + 20 + 40 + 50
    });

    it("should use defaults for undefined bounds", () => {
      const result = calculateChartDimensions(undefined);

      expect(result.width).toBe(500);
      expect(result.height).toBe(400); // 300 + 40 + 60
    });
  });
});
