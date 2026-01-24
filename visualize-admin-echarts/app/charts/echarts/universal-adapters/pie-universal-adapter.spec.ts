/**
 * Tests for Pie Universal Adapter
 */

import { describe, expect, it, vi } from "vitest";

import { pieUniversalAdapter } from "./pie-universal-adapter";
import { createMockUniversalChartState } from "./test-utils";

describe("pieUniversalAdapter", () => {
  it("should create a valid ECharts pie option", () => {
    const state = createMockUniversalChartState({
      chartType: "pie",
      observations: [
        { segment: "A", value: 100 },
        { segment: "B", value: 200 },
        { segment: "C", value: 300 },
      ],
      segments: ["A", "B", "C"],
      fields: {
        getSegment: (d) => d.segment as string,
        getY: (d) => d.value as number,
      },
    });

    const option = pieUniversalAdapter(state);

    expect(option).toBeDefined();
    expect(option.series).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
    expect((option.series as any[])[0].type).toBe("pie");
  });

  it("should filter out zero and negative values", () => {
    const state = createMockUniversalChartState({
      chartType: "pie",
      observations: [
        { segment: "A", value: 100 },
        { segment: "B", value: 0 },
        { segment: "C", value: -50 },
      ],
      segments: ["A", "B", "C"],
      fields: {
        getSegment: (d) => d.segment as string,
        getY: (d) => d.value as number,
      },
    });

    const option = pieUniversalAdapter(state);
    const series = (option.series as any[])[0];

    // Only positive values should be included
    expect(series.data.length).toBe(1);
    expect(series.data[0].name).toBe("A");
    expect(series.data[0].value).toBe(100);
  });

  it("should use outside labels for many slices", () => {
    const state = createMockUniversalChartState({
      chartType: "pie",
      observations: [
        { segment: "A", value: 10 },
        { segment: "B", value: 20 },
        { segment: "C", value: 30 },
        { segment: "D", value: 40 },
        { segment: "E", value: 50 },
      ],
      segments: ["A", "B", "C", "D", "E"],
      fields: {
        getSegment: (d) => d.segment as string,
        getY: (d) => d.value as number,
      },
    });

    const option = pieUniversalAdapter(state);
    const series = (option.series as any[])[0];

    // More than 4 slices should use outside labels
    expect(series.label.position).toBe("outside");
    expect(series.radius[0]).toBe("0%");
    expect(series.radius[1]).toBe("55%"); // Smaller radius for outside labels
  });

  it("should use inside labels for few slices", () => {
    const state = createMockUniversalChartState({
      chartType: "pie",
      observations: [
        { segment: "A", value: 100 },
        { segment: "B", value: 200 },
      ],
      segments: ["A", "B"],
      fields: {
        getSegment: (d) => d.segment as string,
        getY: (d) => d.value as number,
      },
    });

    const option = pieUniversalAdapter(state);
    const series = (option.series as any[])[0];

    // 4 or fewer slices should use inside labels
    expect(series.label.position).toBe("inside");
    expect(series.radius[1]).toBe("70%"); // Larger radius for inside labels
  });

  it("should apply correct colors from colorAccessors", () => {
    const state = createMockUniversalChartState({
      chartType: "pie",
      observations: [
        { segment: "A", value: 100 },
        { segment: "B", value: 200 },
      ],
      segments: ["A", "B"],
      fields: {
        getSegment: (d) => d.segment as string,
        getY: (d) => d.value as number,
      },
      colors: {
        getColor: (segment) => segment === "A" ? "#ff0000" : "#00ff00",
        colorDomain: ["A", "B"],
        colorScale: vi.fn() as any,
      },
    });

    const option = pieUniversalAdapter(state);
    const series = (option.series as any[])[0];

    expect(series.data[0].itemStyle.color).toBe("#ff0000");
    expect(series.data[1].itemStyle.color).toBe("#00ff00");
  });
});
