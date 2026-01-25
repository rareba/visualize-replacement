/**
 * Tests for Combo Line Single Universal Adapter
 */

import { describe, expect, it } from "vitest";

import { comboLineSingleUniversalAdapter } from "./combo-line-single-universal-adapter";
import { createMockUniversalChartState } from "./test-utils";

describe("comboLineSingleUniversalAdapter", () => {
  it("should create a valid ECharts option for single line chart", () => {
    const state = createMockUniversalChartState({
      chartType: "comboLineSingle",
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

    const option = comboLineSingleUniversalAdapter(state);

    expect(option).toBeDefined();
    expect(option.series).toBeDefined();
    expect(option.xAxis).toBeDefined();
    expect(option.yAxis).toBeDefined();
  });

  it("should create line series for multi-segment data", () => {
    const state = createMockUniversalChartState({
      chartType: "comboLineSingle",
      observations: [
        { category: "Jan", segment: "Sales", value: 100 },
        { category: "Jan", segment: "Costs", value: 80 },
        { category: "Feb", segment: "Sales", value: 200 },
        { category: "Feb", segment: "Costs", value: 150 },
        { category: "Mar", segment: "Sales", value: 300 },
        { category: "Mar", segment: "Costs", value: 200 },
      ],
      categories: ["Jan", "Feb", "Mar"],
      segments: ["Sales", "Costs"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
        getSegment: (d) => d.segment as string,
      },
    });

    const option = comboLineSingleUniversalAdapter(state);
    const series = option.series as any[];

    // Should have one line series per segment
    expect(series.length).toBe(2);
    expect(series[0].type).toBe("line");
    expect(series[1].type).toBe("line");
    expect(series[0].name).toBe("Sales");
    expect(series[1].name).toBe("Costs");
  });

  it("should use single Y axis", () => {
    const state = createMockUniversalChartState({
      chartType: "comboLineSingle",
      observations: [
        { category: "Jan", value: 100 },
        { category: "Feb", value: 200 },
      ],
      categories: ["Jan", "Feb"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = comboLineSingleUniversalAdapter(state);
    const yAxis = option.yAxis;

    // Should have a single Y axis (not an array)
    expect(Array.isArray(yAxis)).toBe(false);
    expect((yAxis as any).type).toBe("value");
  });

  it("should handle empty observations", () => {
    const state = createMockUniversalChartState({
      chartType: "comboLineSingle",
      observations: [],
      categories: [],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = comboLineSingleUniversalAdapter(state);

    expect(option).toBeDefined();
    expect(option.graphic).toBeDefined(); // Should show no-data graphic
  });

  it("should show symbols on data points", () => {
    const state = createMockUniversalChartState({
      chartType: "comboLineSingle",
      observations: [
        { category: "Jan", value: 100 },
        { category: "Feb", value: 200 },
      ],
      categories: ["Jan", "Feb"],
      fields: {
        getX: (d) => d.category as string,
        getY: (d) => d.value as number,
      },
    });

    const option = comboLineSingleUniversalAdapter(state);
    const series = option.series as any[];

    // Line series should show symbols (ECharts uses 'symbol' property, "circle" means visible)
    expect(series[0].symbol).toBe("circle");
  });
});
