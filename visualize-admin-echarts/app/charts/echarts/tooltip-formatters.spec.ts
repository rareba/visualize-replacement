/**
 * Tests for Tooltip Formatters
 */

import { describe, it, expect } from "vitest";

import {
  createBaseTooltipConfig,
  createCategoryTooltipFormatter,
  createTimeSeriesFormatter,
  createScatterTooltipFormatter,
  createPieTooltipFormatter,
  createItemTooltipFormatter,
  createDualAxisCategoryFormatter,
  createDualAxisTimeFormatter,
  defaultNumberFormatter,
  percentFormatter,
  chfFormatter,
  compactFormatter,
} from "./tooltip-formatters";

// ============================================================================
// Base Tooltip Config Tests
// ============================================================================

describe("createBaseTooltipConfig", () => {
  it("creates config with Swiss Federal styling", () => {
    const config = createBaseTooltipConfig();

    expect(config.backgroundColor).toBeDefined();
    expect(config.borderColor).toBeDefined();
    expect(config.textStyle?.fontFamily).toBeDefined();
    expect(config.textStyle?.color).toBeDefined();
  });
});

// ============================================================================
// Category Tooltip Formatter Tests
// ============================================================================

describe("createCategoryTooltipFormatter", () => {
  it("formats category tooltip with values", () => {
    const formatter = createCategoryTooltipFormatter();

    const result = formatter([
      { seriesName: "Sales", name: "January", value: 100, marker: "*", color: "#000", dataIndex: 0 },
      { seriesName: "Revenue", name: "January", value: 200, marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("January");
    expect(result).toContain("Sales");
    expect(result).toContain("100");
    expect(result).toContain("Revenue");
    expect(result).toContain("200");
  });

  it("applies value formatter when provided", () => {
    const formatter = createCategoryTooltipFormatter((v) => `$${v}`);

    const result = formatter([
      { seriesName: "Price", name: "Item", value: 50, marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("$50");
  });

  it("applies label formatter when provided", () => {
    const formatter = createCategoryTooltipFormatter(undefined, (name) => `Category: ${name}`);

    const result = formatter([
      { seriesName: "Value", name: "A", value: 10, marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("Category: A");
  });

  it("returns empty string for empty params", () => {
    const formatter = createCategoryTooltipFormatter();
    expect(formatter([])).toBe("");
  });

  it("excludes null values", () => {
    const formatter = createCategoryTooltipFormatter();

    const result = formatter([
      { seriesName: "A", name: "X", value: 10, marker: "*", color: "#000", dataIndex: 0 },
      { seriesName: "B", name: "X", value: null, marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("A");
    expect(result).toContain("10");
    expect(result).not.toContain("B:");
  });
});

// ============================================================================
// Time Series Formatter Tests
// ============================================================================

describe("createTimeSeriesFormatter", () => {
  const timestamp = new Date("2023-06-15").getTime();

  it("formats time series tooltip with date", () => {
    const formatter = createTimeSeriesFormatter();

    const result = formatter([
      { seriesName: "Temperature", name: "", value: [timestamp, 25], marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("Temperature");
    expect(result).toContain("25");
  });

  it("applies custom date formatter", () => {
    const formatter = createTimeSeriesFormatter(
      (date) => `Year: ${date.getFullYear()}`
    );

    const result = formatter([
      { seriesName: "Data", name: "", value: [timestamp, 100], marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("Year: 2023");
  });

  it("applies value formatter", () => {
    const formatter = createTimeSeriesFormatter(undefined, (v) => `${v} units`);

    const result = formatter([
      { seriesName: "Count", name: "", value: [timestamp, 50], marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("50 units");
  });

  it("returns empty string for empty params", () => {
    const formatter = createTimeSeriesFormatter();
    expect(formatter([])).toBe("");
  });
});

// ============================================================================
// Scatter Tooltip Formatter Tests
// ============================================================================

describe("createScatterTooltipFormatter", () => {
  it("formats scatter tooltip with x and y values", () => {
    const formatter = createScatterTooltipFormatter("X Axis", "Y Axis");

    const result = formatter({
      seriesName: "Points",
      name: "",
      value: [10, 20],
      marker: "*",
      color: "#000",
      dataIndex: 0,
    });

    expect(result).toContain("Points");
    expect(result).toContain("X Axis");
    expect(result).toContain("10");
    expect(result).toContain("Y Axis");
    expect(result).toContain("20");
  });

  it("applies custom formatters for x and y", () => {
    const formatter = createScatterTooltipFormatter(
      "Price",
      "Quantity",
      (v) => `$${v}`,
      (v) => `${v} pcs`
    );

    const result = formatter({
      seriesName: "",
      name: "",
      value: [100, 50],
      marker: "*",
      color: "#000",
      dataIndex: 0,
    });

    expect(result).toContain("$100");
    expect(result).toContain("50 pcs");
  });

  it("handles missing series name gracefully", () => {
    const formatter = createScatterTooltipFormatter("X", "Y");

    const result = formatter({
      seriesName: "",
      name: "",
      value: [1, 2],
      marker: "*",
      color: "#000",
      dataIndex: 0,
    });

    expect(result).toContain("X: 1");
    expect(result).toContain("Y: 2");
  });
});

// ============================================================================
// Pie Tooltip Formatter Tests
// ============================================================================

describe("createPieTooltipFormatter", () => {
  it("formats pie tooltip with value and percentage", () => {
    const formatter = createPieTooltipFormatter();

    const result = formatter({
      seriesName: "",
      name: "Slice A",
      value: 100,
      marker: "*",
      color: "#000",
      dataIndex: 0,
      percent: 25.5,
    });

    expect(result).toContain("Slice A");
    expect(result).toContain("100");
    expect(result).toContain("25.5%");
  });

  it("applies value formatter", () => {
    const formatter = createPieTooltipFormatter((v) => `$${v.toLocaleString()}`);

    const result = formatter({
      seriesName: "",
      name: "Revenue",
      value: 1000000,
      marker: "*",
      color: "#000",
      dataIndex: 0,
      percent: 50,
    });

    expect(result).toContain("$1,000,000");
    expect(result).toContain("50.0%");
  });
});

// ============================================================================
// Item Tooltip Formatter Tests
// ============================================================================

describe("createItemTooltipFormatter", () => {
  it("formats item tooltip", () => {
    const formatter = createItemTooltipFormatter();

    const result = formatter({
      seriesName: "",
      name: "Item",
      value: 42,
      marker: "*",
      color: "#000",
      dataIndex: 0,
    });

    expect(result).toContain("Item");
    expect(result).toContain("42");
  });

  it("applies value formatter", () => {
    const formatter = createItemTooltipFormatter((v) => `${v}%`);

    const result = formatter({
      seriesName: "",
      name: "Progress",
      value: 75,
      marker: "*",
      color: "#000",
      dataIndex: 0,
    });

    expect(result).toContain("75%");
  });
});

// ============================================================================
// Dual Axis Formatter Tests
// ============================================================================

describe("createDualAxisCategoryFormatter", () => {
  const categories = ["Jan", "Feb", "Mar"];

  it("formats dual axis category tooltip", () => {
    const formatter = createDualAxisCategoryFormatter(categories);

    const result = formatter([
      { seriesName: "Left", name: "", value: 100, marker: "*", color: "#000", dataIndex: 1 },
      { seriesName: "Right", name: "", value: 200, marker: "*", color: "#000", dataIndex: 1 },
    ]);

    expect(result).toContain("Feb");
    expect(result).toContain("Left");
    expect(result).toContain("100");
    expect(result).toContain("Right");
    expect(result).toContain("200");
  });

  it("applies different formatters for left and right", () => {
    const formatter = createDualAxisCategoryFormatter(
      categories,
      (v) => `$${v}`,
      (v) => `${v}%`
    );

    const result = formatter([
      { seriesName: "Sales", name: "", value: 100, marker: "*", color: "#000", dataIndex: 0 },
      { seriesName: "Growth", name: "", value: 15, marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("$100");
    expect(result).toContain("15%");
  });
});

describe("createDualAxisTimeFormatter", () => {
  const timestamp = new Date("2023-06-15").getTime();

  it("formats dual axis time tooltip", () => {
    const formatter = createDualAxisTimeFormatter();

    const result = formatter([
      { seriesName: "Temp", name: "", value: [timestamp, 25], marker: "*", color: "#000", dataIndex: 0 },
      { seriesName: "Humidity", name: "", value: [timestamp, 60], marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("Temp");
    expect(result).toContain("25");
    expect(result).toContain("Humidity");
    expect(result).toContain("60");
  });

  it("applies custom date and value formatters", () => {
    const formatter = createDualAxisTimeFormatter(
      (date) => `${date.getMonth() + 1}/${date.getFullYear()}`,
      (v) => `${v}C`,
      (v) => `${v}%`
    );

    const result = formatter([
      { seriesName: "Temp", name: "", value: [timestamp, 25], marker: "*", color: "#000", dataIndex: 0 },
      { seriesName: "Humidity", name: "", value: [timestamp, 60], marker: "*", color: "#000", dataIndex: 0 },
    ]);

    expect(result).toContain("6/2023");
    expect(result).toContain("25C");
    expect(result).toContain("60%");
  });
});

// ============================================================================
// Pre-built Formatter Tests
// ============================================================================

describe("defaultNumberFormatter", () => {
  it("formats numbers with locale separators", () => {
    expect(defaultNumberFormatter(1000000)).toBe("1,000,000");
    expect(defaultNumberFormatter(1234.56)).toBe("1,234.56");
  });
});

describe("percentFormatter", () => {
  it("formats as percentage with one decimal", () => {
    expect(percentFormatter(25)).toBe("25.0%");
    expect(percentFormatter(33.333)).toBe("33.3%");
  });
});

describe("chfFormatter", () => {
  it("formats as CHF currency", () => {
    expect(chfFormatter(1000)).toBe("CHF 1,000");
    expect(chfFormatter(1234567)).toBe("CHF 1,234,567");
  });
});

describe("compactFormatter", () => {
  it("formats small numbers as-is", () => {
    expect(compactFormatter(500)).toBe("500");
  });

  it("formats thousands as K", () => {
    expect(compactFormatter(5000)).toBe("5.0K");
    expect(compactFormatter(15500)).toBe("15.5K");
  });

  it("formats millions as M", () => {
    expect(compactFormatter(5000000)).toBe("5.0M");
    expect(compactFormatter(1500000)).toBe("1.5M");
  });

  it("formats billions as B", () => {
    expect(compactFormatter(5000000000)).toBe("5.0B");
    expect(compactFormatter(1500000000)).toBe("1.5B");
  });

  it("handles negative numbers", () => {
    expect(compactFormatter(-5000)).toBe("-5.0K");
    expect(compactFormatter(-1000000)).toBe("-1.0M");
  });
});
