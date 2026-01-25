/**
 * Tests for Area Universal Adapter
 */

import { describe, expect, it } from "vitest";

import { areaUniversalAdapter } from "./area-universal-adapter";
import { createMockUniversalChartState } from "./test-utils";

describe("areaUniversalAdapter", () => {
  it("should create a valid ECharts option for simple area chart", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [
        { category: "Jan", value: 100 },
        { category: "Feb", value: 200 },
        { category: "Mar", value: 300 },
      ],
      categories: ["Jan", "Feb", "Mar"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = areaUniversalAdapter(state);

    expect(option).toBeDefined();
    expect(option.series).toBeDefined();
    expect(option.xAxis).toBeDefined();
    expect(option.yAxis).toBeDefined();
  });

  it("should create a single area series for non-segmented data", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [
        { category: "Q1", value: 50 },
        { category: "Q2", value: 75 },
      ],
      categories: ["Q1", "Q2"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = areaUniversalAdapter(state);
    const series = option.series as any[];

    expect(series.length).toBe(1);
    expect(series[0].type).toBe("line");
    expect(series[0].areaStyle).toBeDefined();
  });

  it("should create stacked area series for segmented data", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [
        { category: "Jan", segment: "Sales", value: 100 },
        { category: "Jan", segment: "Costs", value: 80 },
        { category: "Feb", segment: "Sales", value: 150 },
        { category: "Feb", segment: "Costs", value: 120 },
      ],
      categories: ["Jan", "Feb"],
      segments: ["Sales", "Costs"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
        getSegment: (d) => d.segment as string,
      },
    });

    // Set segmentType to stacked
    state.options.segmentType = "stacked";

    const option = areaUniversalAdapter(state);
    const series = option.series as any[];

    expect(series.length).toBe(2);
    expect(series[0].name).toBe("Sales");
    expect(series[1].name).toBe("Costs");
    expect(series[0].stack).toBe("total");
    expect(series[1].stack).toBe("total");
  });

  it("should calculate Y domain correctly", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [
        { category: "A", value: 50 },
        { category: "B", value: 100 },
      ],
      categories: ["A", "B"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = areaUniversalAdapter(state);
    const yAxis = option.yAxis as any;

    // Y axis should have min and max set
    expect(yAxis.min).toBe(0);
    expect(yAxis.max).toBeGreaterThan(100);
  });

  it("should not show symbols on area chart", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
      ],
      categories: ["A", "B"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = areaUniversalAdapter(state);
    const series = option.series as any[];

    // Area series should have symbol set to "none"
    expect(series[0].symbol).toBe("none");
  });

  it("should handle empty observations", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [],
      categories: [],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = areaUniversalAdapter(state);

    expect(option).toBeDefined();
    // Series should be created but with no data
    expect(option.series).toBeDefined();
  });

  it("should set boundaryGap to false for x-axis", () => {
    const state = createMockUniversalChartState({
      chartType: "area",
      observations: [
        { category: "Jan", value: 100 },
      ],
      categories: ["Jan"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = areaUniversalAdapter(state);
    const xAxis = option.xAxis as any;

    // Area charts should have boundaryGap false
    expect(xAxis.boundaryGap).toBe(false);
  });
});
