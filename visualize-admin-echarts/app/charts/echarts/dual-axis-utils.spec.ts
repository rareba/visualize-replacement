/**
 * Tests for Dual Axis Utilities
 */

import { describe, it, expect } from "vitest";

import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";

import {
  createDualYAxis,
  createTimeAxis,
  createCrossTooltip,
  createComboGrid,
  createCategoryComboTooltipFormatter,
  createTimeComboTooltipFormatter,
} from "./dual-axis-utils";

// ============================================================================
// Dual Y-Axis Tests
// ============================================================================

describe("createDualYAxis", () => {
  it("creates left and right Y-axes with correct positions", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Temperature", min: 0, max: 100 },
      right: { name: "Humidity", min: 0, max: 100 },
    });

    expect(leftAxis.position).toBe("left");
    expect(rightAxis.position).toBe("right");
  });

  it("sets axis names correctly", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Sales", min: 0, max: 1000 },
      right: { name: "Revenue", min: 0, max: 5000 },
    });

    expect(leftAxis.name).toBe("Sales");
    expect(rightAxis.name).toBe("Revenue");
  });

  it("sets min/max values correctly", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Left", min: -10, max: 50 },
      right: { name: "Right", min: 0, max: 200 },
    });

    expect(leftAxis.min).toBe(-10);
    expect(leftAxis.max).toBe(50);
    expect(rightAxis.min).toBe(0);
    expect(rightAxis.max).toBe(200);
  });

  it("uses default axis color when not specified", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Left", min: 0, max: 100 },
      right: { name: "Right", min: 0, max: 100 },
    });

    expect(leftAxis.axisLine?.lineStyle?.color).toBe(SWISS_FEDERAL_COLORS.axis);
    expect(rightAxis.axisLine?.lineStyle?.color).toBe(SWISS_FEDERAL_COLORS.axis);
  });

  it("uses custom colors when specified", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Left", min: 0, max: 100, color: "#ff0000" },
      right: { name: "Right", min: 0, max: 100, color: "#0000ff" },
    });

    expect(leftAxis.axisLine?.lineStyle?.color).toBe("#ff0000");
    expect(rightAxis.axisLine?.lineStyle?.color).toBe("#0000ff");
  });

  it("only shows grid lines on left axis", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Left", min: 0, max: 100 },
      right: { name: "Right", min: 0, max: 100 },
    });

    expect(leftAxis.splitLine?.lineStyle?.color).toBe(SWISS_FEDERAL_COLORS.grid);
    expect(rightAxis.splitLine?.show).toBe(false);
  });

  it("applies consistent styling to both axes", () => {
    const [leftAxis, rightAxis] = createDualYAxis({
      left: { name: "Left", min: 0, max: 100 },
      right: { name: "Right", min: 0, max: 100 },
    });

    // Both should have value type
    expect(leftAxis.type).toBe("value");
    expect(rightAxis.type).toBe("value");

    // Both should have middle name location
    expect(leftAxis.nameLocation).toBe("middle");
    expect(rightAxis.nameLocation).toBe("middle");

    // Both should have same font styling
    expect(leftAxis.axisLabel?.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    expect(rightAxis.axisLabel?.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
  });
});

// ============================================================================
// Time Axis Tests
// ============================================================================

describe("createTimeAxis", () => {
  it("creates a time axis with correct type", () => {
    const axis = createTimeAxis({
      min: 1000000000000,
      max: 1700000000000,
    });

    expect(axis.type).toBe("time");
  });

  it("sets min/max timestamp values", () => {
    const min = new Date("2020-01-01").getTime();
    const max = new Date("2023-12-31").getTime();

    const axis = createTimeAxis({ min, max });

    expect(axis.min).toBe(min);
    expect(axis.max).toBe(max);
  });

  it("uses default values when optional params not provided", () => {
    const axis = createTimeAxis({
      min: 1000,
      max: 2000,
    });

    expect(axis.name).toBe("");
    expect(axis.nameGap).toBe(35);
  });

  it("uses custom name and nameGap when provided", () => {
    const axis = createTimeAxis({
      name: "Date",
      nameGap: 50,
      min: 1000,
      max: 2000,
    });

    expect(axis.name).toBe("Date");
    expect(axis.nameGap).toBe(50);
    expect(axis.nameLocation).toBe("middle");
  });

  it("applies Swiss Federal styling", () => {
    const axis = createTimeAxis({ min: 1000, max: 2000 });

    expect(axis.axisLabel?.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    expect(axis.axisLabel?.color).toBe(SWISS_FEDERAL_COLORS.text);
    expect(axis.axisLine?.lineStyle?.color).toBe(SWISS_FEDERAL_COLORS.axis);
  });
});

// ============================================================================
// Cross Tooltip Tests
// ============================================================================

describe("createCrossTooltip", () => {
  it("creates an axis trigger tooltip", () => {
    const tooltip = createCrossTooltip();

    expect(tooltip.trigger).toBe("axis");
  });

  it("creates a cross-type axis pointer", () => {
    const tooltip = createCrossTooltip();

    expect(tooltip.axisPointer?.type).toBe("cross");
  });

  it("uses Swiss Federal grid color for cross style", () => {
    const tooltip = createCrossTooltip();

    expect(tooltip.axisPointer?.crossStyle?.color).toBe(SWISS_FEDERAL_COLORS.grid);
  });
});

// ============================================================================
// Combo Grid Tests
// ============================================================================

describe("createComboGrid", () => {
  it("creates grid with specified margins", () => {
    const grid = createComboGrid({
      left: 50,
      right: 60,
      top: 40,
      bottom: 30,
    });

    expect(grid.left).toBe(50);
    expect(grid.right).toBe(60);
    expect(grid.top).toBe(40);
    expect(grid.bottom).toBe(30);
  });

  it("adds extra right margin when specified", () => {
    const grid = createComboGrid({
      left: 50,
      right: 60,
      top: 40,
      bottom: 30,
      extraRight: 20,
    });

    expect(grid.right).toBe(80); // 60 + 20
  });

  it("handles zero extraRight", () => {
    const grid = createComboGrid({
      left: 50,
      right: 60,
      top: 40,
      bottom: 30,
      extraRight: 0,
    });

    expect(grid.right).toBe(60);
  });

  it("disables containLabel", () => {
    const grid = createComboGrid({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    });

    expect(grid.containLabel).toBe(false);
  });
});

// ============================================================================
// Category Combo Tooltip Formatter Tests
// ============================================================================

describe("createCategoryComboTooltipFormatter", () => {
  const categories = ["Jan", "Feb", "Mar", "Apr"];

  it("formats tooltip with category name and values", () => {
    const formatter = createCategoryComboTooltipFormatter(categories);

    const result = formatter([
      { seriesName: "Sales", value: 100, marker: "<span>*</span>", dataIndex: 0 },
      { seriesName: "Revenue", value: 200, marker: "<span>*</span>", dataIndex: 0 },
    ]);

    expect(result).toContain("<strong>Jan</strong>");
    expect(result).toContain("Sales: 100");
    expect(result).toContain("Revenue: 200");
  });

  it("returns empty string for empty params array", () => {
    const formatter = createCategoryComboTooltipFormatter(categories);
    const result = formatter([]);

    expect(result).toBe("");
  });

  it("returns empty string for non-array params", () => {
    const formatter = createCategoryComboTooltipFormatter(categories);
    const result = formatter(null);

    expect(result).toBe("");
  });

  it("excludes null values from tooltip", () => {
    const formatter = createCategoryComboTooltipFormatter(categories);

    const result = formatter([
      { seriesName: "Sales", value: 100, marker: "*", dataIndex: 1 },
      { seriesName: "Revenue", value: null, marker: "*", dataIndex: 1 },
    ]);

    expect(result).toContain("<strong>Feb</strong>");
    expect(result).toContain("Sales: 100");
    expect(result).not.toContain("Revenue:");
  });

  it("handles different data indices", () => {
    const formatter = createCategoryComboTooltipFormatter(categories);

    const result = formatter([
      { seriesName: "Data", value: 50, marker: "*", dataIndex: 3 },
    ]);

    expect(result).toContain("<strong>Apr</strong>");
  });
});

// ============================================================================
// Time Combo Tooltip Formatter Tests
// ============================================================================

describe("createTimeComboTooltipFormatter", () => {
  it("formats tooltip with date and values", () => {
    const formatter = createTimeComboTooltipFormatter();
    const timestamp = new Date("2023-06-15").getTime();

    const result = formatter([
      { seriesName: "Temperature", value: [timestamp, 25], marker: "*" },
      { seriesName: "Humidity", value: [timestamp, 60], marker: "*" },
    ]);

    // Should contain the date (format depends on locale)
    expect(result).toContain("<strong>");
    expect(result).toContain("</strong>");
    expect(result).toContain("Temperature: 25");
    expect(result).toContain("Humidity: 60");
  });

  it("returns empty string for empty params array", () => {
    const formatter = createTimeComboTooltipFormatter();
    const result = formatter([]);

    expect(result).toBe("");
  });

  it("returns empty string for non-array params", () => {
    const formatter = createTimeComboTooltipFormatter();
    const result = formatter(undefined);

    expect(result).toBe("");
  });

  it("excludes null values from tooltip", () => {
    const formatter = createTimeComboTooltipFormatter();
    const timestamp = new Date("2023-01-01").getTime();

    const result = formatter([
      { seriesName: "A", value: [timestamp, 100], marker: "*" },
      { seriesName: "B", value: [timestamp, null], marker: "*" },
    ]);

    expect(result).toContain("A: 100");
    expect(result).not.toContain("B:");
  });

  it("handles zero values correctly", () => {
    const formatter = createTimeComboTooltipFormatter();
    const timestamp = new Date("2023-01-01").getTime();

    const result = formatter([
      { seriesName: "Zero", value: [timestamp, 0], marker: "*" },
    ]);

    expect(result).toContain("Zero: 0");
  });
});
