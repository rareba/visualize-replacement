/**
 * Tests for Data Utilities
 */

import { describe, it, expect } from "vitest";

import {
  groupTimeSeriesData,
  buildTimeSeriesData,
  groupCategoryData,
  buildErrorWhiskerData,
  buildGroupedErrorWhiskerData,
  buildCategorySeriesData,
  buildScatterData,
  groupScatterDataBySegment,
  isDataValid,
  filterNullValues,
  getDataRange,
} from "./data-utils";

// ============================================================================
// Test Data
// ============================================================================

interface TestObservation {
  date: Date;
  value: number | null;
  segment: string;
  category: string;
}

const createTestData = (): TestObservation[] => [
  { date: new Date("2023-01-01"), value: 10, segment: "A", category: "Cat1" },
  { date: new Date("2023-01-02"), value: 20, segment: "A", category: "Cat2" },
  { date: new Date("2023-01-01"), value: 15, segment: "B", category: "Cat1" },
  { date: new Date("2023-01-02"), value: 25, segment: "B", category: "Cat2" },
];

// ============================================================================
// Time Series Data Grouping Tests
// ============================================================================

describe("groupTimeSeriesData", () => {
  const testData = createTestData();

  it("groups data by segment for multi-series", () => {
    const result = groupTimeSeriesData(
      testData,
      ["A", "B"],
      (d) => d.segment,
      (d) => d.date,
      (d) => d.value
    );

    expect(result.segmentDataMap.size).toBe(2);
    expect(result.segmentDataMap.has("A")).toBe(true);
    expect(result.segmentDataMap.has("B")).toBe(true);
  });

  it("returns sorted unique x values", () => {
    const result = groupTimeSeriesData(
      testData,
      ["A", "B"],
      (d) => d.segment,
      (d) => d.date,
      (d) => d.value
    );

    expect(result.xValues).toHaveLength(2);
    expect(result.xValues[0]).toBeLessThan(result.xValues[1]);
  });

  it("creates x labels from dates", () => {
    const result = groupTimeSeriesData(
      testData,
      ["A", "B"],
      (d) => d.segment,
      (d) => d.date,
      (d) => d.value
    );

    expect(result.xLabels).toHaveLength(2);
    expect(typeof result.xLabels[0]).toBe("string");
  });

  it("uses custom date formatter when provided", () => {
    const result = groupTimeSeriesData(
      testData,
      ["A", "B"],
      (d) => d.segment,
      (d) => d.date,
      (d) => d.value,
      (date) => `Custom-${date.getFullYear()}`
    );

    expect(result.xLabels[0]).toContain("Custom-2023");
  });

  it("uses default segment for single series", () => {
    const result = groupTimeSeriesData(
      testData,
      [], // No segments - single series
      (d) => d.segment,
      (d) => d.date,
      (d) => d.value
    );

    expect(result.segmentDataMap.size).toBe(1);
    expect(result.segmentDataMap.has("default")).toBe(true);
  });

  it("maps values correctly to segments", () => {
    const result = groupTimeSeriesData(
      testData,
      ["A", "B"],
      (d) => d.segment,
      (d) => d.date,
      (d) => d.value
    );

    const segmentA = result.segmentDataMap.get("A")!;
    const jan1 = new Date("2023-01-01").getTime();
    expect(segmentA.get(jan1)).toBe(10);
  });
});

describe("buildTimeSeriesData", () => {
  it("builds data array from segment map", () => {
    const segmentData = new Map<number, number | null>();
    segmentData.set(1000, 10);
    segmentData.set(2000, 20);
    segmentData.set(3000, null);

    const result = buildTimeSeriesData(segmentData, [1000, 2000, 3000, 4000]);

    expect(result).toEqual([10, 20, null, null]);
  });

  it("returns nulls for undefined segment data", () => {
    const result = buildTimeSeriesData(undefined, [1000, 2000]);

    expect(result).toEqual([null, null]);
  });

  it("returns nulls for missing x values", () => {
    const segmentData = new Map<number, number | null>();
    segmentData.set(1000, 10);

    const result = buildTimeSeriesData(segmentData, [1000, 2000, 3000]);

    expect(result).toEqual([10, null, null]);
  });
});

// ============================================================================
// Category Data Grouping Tests
// ============================================================================

describe("groupCategoryData", () => {
  const testData = createTestData();

  it("maps observations to categories", () => {
    const result = groupCategoryData(
      testData,
      ["Cat1", "Cat2", "Cat3"],
      (d) => d.category
    );

    expect(result.categoryObservations.size).toBe(3);
    expect(result.categoryObservations.get("Cat1")).toBeDefined();
    expect(result.categoryObservations.get("Cat2")).toBeDefined();
    expect(result.categoryObservations.get("Cat3")).toBeUndefined();
  });

  it("preserves category order", () => {
    const result = groupCategoryData(
      testData,
      ["Cat2", "Cat1"],
      (d) => d.category
    );

    expect(result.categories).toEqual(["Cat2", "Cat1"]);
  });
});

// ============================================================================
// Error Whisker Tests
// ============================================================================

describe("buildErrorWhiskerData", () => {
  interface ErrorObservation {
    category: string;
    hasError: boolean;
    errorRange: [number, number];
  }

  const testData: ErrorObservation[] = [
    { category: "A", hasError: true, errorRange: [5, 15] },
    { category: "B", hasError: false, errorRange: [0, 0] },
    { category: "C", hasError: true, errorRange: [10, 20] },
  ];

  it("builds error whisker data for categories with errors", () => {
    const result = buildErrorWhiskerData({
      categories: ["A", "B", "C"],
      chartData: testData,
      getCategory: (d) => d.category,
      getErrorPresent: (d) => d.hasError,
      getErrorRange: (d) => d.errorRange,
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([0, 5, 15]); // A at index 0
    expect(result[1]).toEqual([2, 10, 20]); // C at index 2
  });

  it("returns empty array when no errors", () => {
    const noErrorData: ErrorObservation[] = [
      { category: "A", hasError: false, errorRange: [0, 0] },
    ];

    const result = buildErrorWhiskerData({
      categories: ["A"],
      chartData: noErrorData,
      getCategory: (d) => d.category,
      getErrorPresent: (d) => d.hasError,
      getErrorRange: (d) => d.errorRange,
    });

    expect(result).toHaveLength(0);
  });
});

describe("buildGroupedErrorWhiskerData", () => {
  interface GroupedErrorObservation {
    category: string;
    segment: string;
    hasError: boolean;
    errorRange: [number, number];
  }

  const testData: GroupedErrorObservation[] = [
    { category: "A", segment: "S1", hasError: true, errorRange: [5, 15] },
    { category: "A", segment: "S2", hasError: true, errorRange: [8, 18] },
    { category: "B", segment: "S1", hasError: false, errorRange: [0, 0] },
  ];

  it("builds grouped error whisker data with offsets", () => {
    const result = buildGroupedErrorWhiskerData({
      categories: ["A", "B"],
      chartData: testData,
      segments: ["S1", "S2"],
      getCategory: (d) => d.category,
      getSegment: (d) => d.segment,
      getErrorPresent: (d) => d.hasError,
      getErrorRange: (d) => d.errorRange,
    });

    expect(result).toHaveLength(2);
    // Check segment indices are included
    expect(result[0][3]).toBe(0); // S1 is segment 0
    expect(result[1][3]).toBe(1); // S2 is segment 1
  });
});

// ============================================================================
// Category Series Data Tests
// ============================================================================

describe("buildCategorySeriesData", () => {
  const testData = createTestData();

  it("builds series data without colors", () => {
    const result = buildCategorySeriesData({
      categories: ["Cat1", "Cat2"],
      chartData: testData,
      getCategory: (d) => d.category,
      getValue: (d) => d.value,
    });

    expect(result).toEqual([10, 20]); // First match for each category
  });

  it("builds series data with colors", () => {
    const result = buildCategorySeriesData({
      categories: ["Cat1", "Cat2"],
      chartData: testData,
      getCategory: (d) => d.category,
      getValue: (d) => d.value,
      getColor: () => "#ff0000",
    });

    expect(result[0]).toEqual({ value: 10, itemStyle: { color: "#ff0000" } });
  });

  it("returns null for missing categories", () => {
    const result = buildCategorySeriesData({
      categories: ["Cat1", "Missing"],
      chartData: testData,
      getCategory: (d) => d.category,
      getValue: (d) => d.value,
    });

    expect(result[0]).toBe(10);
    expect(result[1]).toBeNull();
  });
});

// ============================================================================
// Scatter Data Tests
// ============================================================================

describe("buildScatterData", () => {
  interface ScatterObservation {
    x: number | null;
    y: number | null;
    segment: string;
    label: string;
  }

  const testData: ScatterObservation[] = [
    { x: 1, y: 10, segment: "A", label: "Point 1" },
    { x: 2, y: null, segment: "A", label: "Point 2" },
    { x: null, y: 30, segment: "B", label: "Point 3" },
    { x: 4, y: 40, segment: "B", label: "Point 4" },
  ];

  it("builds scatter data filtering nulls", () => {
    const result = buildScatterData(
      testData,
      (d) => d.x,
      (d) => d.y
    );

    expect(result).toHaveLength(2); // Only 2 points have both x and y
    expect(result[0].x).toBe(1);
    expect(result[0].y).toBe(10);
    expect(result[1].x).toBe(4);
    expect(result[1].y).toBe(40);
  });

  it("includes segment and label when provided", () => {
    const result = buildScatterData(
      testData,
      (d) => d.x,
      (d) => d.y,
      (d) => d.segment,
      (d) => d.label
    );

    expect(result[0].segment).toBe("A");
    expect(result[0].label).toBe("Point 1");
  });
});

describe("groupScatterDataBySegment", () => {
  it("groups scatter points by segment", () => {
    const data = [
      { x: 1, y: 10, segment: "A" },
      { x: 2, y: 20, segment: "A" },
      { x: 3, y: 30, segment: "B" },
    ];

    const result = groupScatterDataBySegment(data, ["A", "B"]);

    expect(result.get("A")).toEqual([[1, 10], [2, 20]]);
    expect(result.get("B")).toEqual([[3, 30]]);
  });
});

// ============================================================================
// Data Validation Tests
// ============================================================================

describe("isDataValid", () => {
  it("returns true when data has non-null values", () => {
    const data = [{ value: 10 }, { value: null }, { value: 20 }];
    expect(isDataValid(data, (d) => d.value)).toBe(true);
  });

  it("returns false when all values are null", () => {
    const data = [{ value: null }, { value: null }];
    expect(isDataValid(data, (d) => d.value)).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isDataValid([], (d: { value: number }) => d.value)).toBe(false);
  });
});

describe("filterNullValues", () => {
  it("filters out observations with null values", () => {
    const data = [{ value: 10 }, { value: null }, { value: 20 }];
    const result = filterNullValues(data, (d) => d.value);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(10);
    expect(result[1].value).toBe(20);
  });
});

describe("getDataRange", () => {
  it("returns min and max values", () => {
    const data = [{ value: 10 }, { value: 5 }, { value: 20 }, { value: 15 }];
    const result = getDataRange(data, (d) => d.value);

    expect(result).toEqual([5, 20]);
  });

  it("returns null for empty data", () => {
    const result = getDataRange([], (d: { value: number }) => d.value);
    expect(result).toBeNull();
  });

  it("ignores null values when computing range", () => {
    const data = [{ value: null }, { value: 10 }, { value: null }, { value: 20 }];
    const result = getDataRange(data, (d) => d.value);

    expect(result).toEqual([10, 20]);
  });

  it("returns null when all values are null", () => {
    const data = [{ value: null }, { value: null }];
    const result = getDataRange(data, (d) => d.value);
    expect(result).toBeNull();
  });
});
