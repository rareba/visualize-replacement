/**
 * Tests for Column Universal Adapter
 */

import { describe, expect, it, vi } from "vitest";

import { columnUniversalAdapter } from "./column-universal-adapter";
import { createMockUniversalChartState } from "./test-utils";

describe("columnUniversalAdapter", () => {
  it("should create a valid ECharts column option", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
      observations: [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
        { category: "C", value: 300 },
      ],
      categories: ["A", "B", "C"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = columnUniversalAdapter(state);

    expect(option).toBeDefined();
    expect(option.series).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
    expect((option.series as any[])[0].type).toBe("bar");
    expect(option.xAxis).toBeDefined();
    expect(option.yAxis).toBeDefined();
  });

  it("should create category X axis with correct categories", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
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

    const option = columnUniversalAdapter(state);
    const xAxis = option.xAxis as any;

    expect(xAxis.type).toBe("category");
    expect(xAxis.data).toEqual(["Jan", "Feb", "Mar"]);
  });

  it("should create value Y axis with proper domain", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
      observations: [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
        { category: "C", value: 300 },
      ],
      categories: ["A", "B", "C"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = columnUniversalAdapter(state);
    const yAxis = option.yAxis as any;

    expect(yAxis.type).toBe("value");
    expect(yAxis.min).toBe(0);
    expect(yAxis.max).toBeGreaterThan(300); // Should have padding
  });

  it("should create grouped columns when segmentType is grouped", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
      observations: [
        { category: "A", segment: "S1", value: 100 },
        { category: "A", segment: "S2", value: 150 },
        { category: "B", segment: "S1", value: 200 },
        { category: "B", segment: "S2", value: 250 },
      ],
      categories: ["A", "B"],
      segments: ["S1", "S2"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
        getSegment: (d) => d.segment as string,
      },
      options: {
        segmentType: "grouped",
      },
    });

    const option = columnUniversalAdapter(state);
    const series = option.series as any[];

    // Should have one series per segment
    expect(series.length).toBe(2);
    expect(series[0].name).toBe("S1");
    expect(series[1].name).toBe("S2");
    // Grouped columns should not have stack
    expect(series[0].stack).toBeUndefined();
  });

  it("should create stacked columns when segmentType is stacked", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
      observations: [
        { category: "A", segment: "S1", value: 100 },
        { category: "A", segment: "S2", value: 150 },
        { category: "B", segment: "S1", value: 200 },
        { category: "B", segment: "S2", value: 250 },
      ],
      categories: ["A", "B"],
      segments: ["S1", "S2"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
        getSegment: (d) => d.segment as string,
      },
      options: {
        segmentType: "stacked",
      },
    });

    const option = columnUniversalAdapter(state);
    const series = option.series as any[];

    // Should have one series per segment
    expect(series.length).toBe(2);
    // Stacked columns should have stack property
    expect(series[0].stack).toBe("total");
    expect(series[1].stack).toBe("total");
  });

  it("should handle empty observations", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
      observations: [],
      categories: [],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = columnUniversalAdapter(state);

    expect(option).toBeDefined();
    expect(option.series).toBeDefined();
  });

  it("should apply correct colors to series data", () => {
    const state = createMockUniversalChartState({
      chartType: "column",
      observations: [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
      ],
      categories: ["A", "B"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
        getRenderingKey: (d) => d.category as string,
      },
      colors: {
        getColor: (key) => key === "A" ? "#ff0000" : "#00ff00",
        colorDomain: ["A", "B"],
        colorScale: vi.fn() as any,
      },
    });

    const option = columnUniversalAdapter(state);
    const series = (option.series as any[])[0];

    expect(series.data[0].itemStyle.color).toBe("#ff0000");
    expect(series.data[1].itemStyle.color).toBe("#00ff00");
  });
});
