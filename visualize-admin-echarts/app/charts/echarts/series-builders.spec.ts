/**
 * Tests for Series Builders
 */

import { describe, it, expect } from "vitest";

import { SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";

import {
  createBarSeries,
  createBarSeriesGroup,
  createLineSeries,
  createLineSeriesGroup,
  createScatterSeries,
  createScatterSeriesGroup,
  createPieSeries,
  createAreaSeries,
  createAreaSeriesGroup,
  createCustomSeries,
} from "./series-builders";

// ============================================================================
// Bar Series Tests
// ============================================================================

describe("createBarSeries", () => {
  it("creates a basic bar series with default values", () => {
    const series = createBarSeries({
      data: [1, 2, 3, null, 5],
    });

    expect(series.type).toBe("bar");
    expect(series.data).toEqual([1, 2, 3, null, 5]);
    expect(series.itemStyle?.color).toBe(SWISS_FEDERAL_COLORS.palette[0]);
    expect(series.animationDuration).toBe(500);
    expect(series.animationEasing).toBe("cubicOut");
  });

  it("creates a bar series with custom configuration", () => {
    const series = createBarSeries({
      name: "Sales",
      data: [10, 20, 30],
      color: "#ff0000",
      stack: "total",
      barMaxWidth: 40,
      yAxisIndex: 1,
    });

    expect(series.name).toBe("Sales");
    expect(series.itemStyle?.color).toBe("#ff0000");
    expect(series.stack).toBe("total");
    expect(series.barMaxWidth).toBe(40);
    expect(series.yAxisIndex).toBe(1);
    expect(series.emphasis?.focus).toBe("series");
  });

  it("creates a bar series with labels", () => {
    const series = createBarSeries({
      data: [1, 2, 3],
      showLabel: true,
      labelPosition: "inside",
      labelRotate: 45,
    });

    expect(series.label?.show).toBe(true);
    expect(series.label?.position).toBe("inside");
    expect(series.label?.rotate).toBe(45);
  });

  it("handles data with itemStyle", () => {
    const data = [
      { value: 10, itemStyle: { color: "#ff0000" } },
      { value: 20, itemStyle: { color: "#00ff00" } },
    ];
    const series = createBarSeries({ data });

    expect(series.data).toEqual(data);
  });
});

describe("createBarSeriesGroup", () => {
  it("creates multiple bar series for segments", () => {
    const segments = ["A", "B", "C"];
    const getData = (segment: string) => {
      const map: Record<string, number[]> = {
        A: [1, 2, 3],
        B: [4, 5, 6],
        C: [7, 8, 9],
      };
      return map[segment];
    };
    const getColor = (segment: string) => {
      const map: Record<string, string> = {
        A: "#ff0000",
        B: "#00ff00",
        C: "#0000ff",
      };
      return map[segment];
    };

    const series = createBarSeriesGroup(segments, getData, getColor);

    expect(series).toHaveLength(3);
    expect(series[0].name).toBe("A");
    expect(series[0].data).toEqual([1, 2, 3]);
    expect(series[0].itemStyle?.color).toBe("#ff0000");
    expect(series[1].name).toBe("B");
    expect(series[2].name).toBe("C");
  });

  it("creates stacked bar series", () => {
    const segments = ["X", "Y"];
    const getData = () => [1, 2];
    const getColor = () => "#000";

    const series = createBarSeriesGroup(segments, getData, getColor, {
      stack: "myStack",
    });

    expect(series[0].stack).toBe("myStack");
    expect(series[1].stack).toBe("myStack");
  });
});

// ============================================================================
// Line Series Tests
// ============================================================================

describe("createLineSeries", () => {
  it("creates a basic line series with default values", () => {
    const series = createLineSeries({
      data: [1, 2, 3, null, 5],
    });

    expect(series.type).toBe("line");
    expect(series.data).toEqual([1, 2, 3, null, 5]);
    expect(series.symbol).toBe("circle");
    expect(series.symbolSize).toBe(6);
    expect(series.lineStyle?.width).toBe(2);
    expect(series.smooth).toBe(false);
    expect(series.connectNulls).toBe(false);
  });

  it("creates a line series with custom configuration", () => {
    const series = createLineSeries({
      name: "Temperature",
      data: [[1000, 20], [2000, 25], [3000, null]],
      color: "#0099ff",
      yAxisIndex: 1,
      showSymbol: false,
      symbolSize: 10,
      lineWidth: 3,
      smooth: true,
      connectNulls: true,
    });

    expect(series.name).toBe("Temperature");
    expect(series.yAxisIndex).toBe(1);
    expect(series.symbol).toBe("none");
    expect(series.symbolSize).toBe(10);
    expect(series.lineStyle?.width).toBe(3);
    expect(series.smooth).toBe(true);
    expect(series.connectNulls).toBe(true);
  });

  it("creates a line series with area style (boolean)", () => {
    const series = createLineSeries({
      data: [1, 2, 3],
      areaStyle: true,
    });

    expect(series.areaStyle).toEqual({ opacity: 0.7 });
  });

  it("creates a line series with area style (object)", () => {
    const series = createLineSeries({
      data: [1, 2, 3],
      areaStyle: { opacity: 0.3 },
    });

    expect(series.areaStyle).toEqual({ opacity: 0.3 });
  });

  it("creates a stacked line series", () => {
    const series = createLineSeries({
      data: [1, 2, 3],
      stack: "total",
    });

    expect(series.stack).toBe("total");
  });
});

describe("createLineSeriesGroup", () => {
  it("creates multiple line series for segments", () => {
    const segments = ["Line1", "Line2"];
    const getData = (segment: string) =>
      segment === "Line1" ? [1, 2, 3] : [4, 5, 6];
    const getColor = (segment: string) =>
      segment === "Line1" ? "#ff0000" : "#00ff00";

    const series = createLineSeriesGroup(segments, getData, getColor);

    expect(series).toHaveLength(2);
    expect(series[0].name).toBe("Line1");
    expect(series[0].data).toEqual([1, 2, 3]);
    expect(series[1].name).toBe("Line2");
  });

  it("creates line series with shared options", () => {
    const segments = ["A", "B"];
    const getData = () => [1, 2];
    const getColor = () => "#000";

    const series = createLineSeriesGroup(segments, getData, getColor, {
      smooth: true,
      lineWidth: 4,
      stack: "area",
      areaStyle: { opacity: 0.5 },
    });

    expect(series[0].smooth).toBe(true);
    expect(series[0].lineStyle?.width).toBe(4);
    expect(series[0].stack).toBe("area");
    expect(series[0].areaStyle).toEqual({ opacity: 0.5 });
  });
});

// ============================================================================
// Scatter Series Tests
// ============================================================================

describe("createScatterSeries", () => {
  it("creates a basic scatter series with default values", () => {
    const data: [number, number][] = [
      [1, 10],
      [2, 20],
      [3, 30],
    ];
    const series = createScatterSeries({ data });

    expect(series.type).toBe("scatter");
    expect(series.data).toEqual(data);
    expect(series.symbolSize).toBe(10);
    expect(series.itemStyle?.color).toBe(SWISS_FEDERAL_COLORS.palette[0]);
  });

  it("creates a scatter series with custom configuration", () => {
    const data: [number, number][] = [[100, 200]];
    const series = createScatterSeries({
      name: "Points",
      data,
      color: "#purple",
      symbolSize: 20,
    });

    expect(series.name).toBe("Points");
    expect(series.symbolSize).toBe(20);
    expect(series.itemStyle?.color).toBe("#purple");
  });
});

describe("createScatterSeriesGroup", () => {
  it("creates multiple scatter series for segments", () => {
    const segments = ["Group1", "Group2"];
    const getData = (segment: string): [number, number][] =>
      segment === "Group1"
        ? [
            [1, 1],
            [2, 2],
          ]
        : [
            [3, 3],
            [4, 4],
          ];
    const getColor = (segment: string) =>
      segment === "Group1" ? "#red" : "#blue";

    const series = createScatterSeriesGroup(segments, getData, getColor);

    expect(series).toHaveLength(2);
    expect(series[0].name).toBe("Group1");
    expect(series[0].data).toEqual([
      [1, 1],
      [2, 2],
    ]);
    expect(series[1].name).toBe("Group2");
  });

  it("applies shared symbolSize option", () => {
    const segments = ["A"];
    const getData = (): [number, number][] => [[1, 1]];
    const getColor = () => "#000";

    const series = createScatterSeriesGroup(segments, getData, getColor, {
      symbolSize: 15,
    });

    expect(series[0].symbolSize).toBe(15);
  });
});

// ============================================================================
// Pie Series Tests
// ============================================================================

describe("createPieSeries", () => {
  it("creates a basic pie series with default values", () => {
    const data = [
      { name: "A", value: 30 },
      { name: "B", value: 70 },
    ];
    const series = createPieSeries({ data });

    expect(series.type).toBe("pie");
    expect(series.data).toEqual(data);
    expect(series.radius).toEqual(["0%", "70%"]);
    expect(series.center).toEqual(["50%", "50%"]);
    expect(series.startAngle).toBe(90);
    expect(series.label?.show).toBe(true);
    expect(series.label?.position).toBe("inside");
    expect(series.avoidLabelOverlap).toBe(true);
  });

  it("creates a pie series with custom configuration", () => {
    const data = [{ name: "X", value: 100, itemStyle: { color: "#custom" } }];
    const series = createPieSeries({
      data,
      radius: ["30%", "60%"],
      center: ["40%", "50%"],
      showLabel: false,
      startAngle: 0,
    });

    expect(series.radius).toEqual(["30%", "60%"]);
    expect(series.center).toEqual(["40%", "50%"]);
    expect(series.startAngle).toBe(0);
    expect(series.label?.show).toBe(false);
  });

  it("configures outside labels correctly", () => {
    const data = [{ name: "A", value: 50 }];
    const series = createPieSeries({
      data,
      labelPosition: "outside",
    });

    expect(series.label?.position).toBe("outside");
    expect(series.label?.color).toBe(SWISS_FEDERAL_COLORS.text);
    expect(series.labelLine?.show).toBe(true);
    expect(series.labelLine?.length).toBe(15);
    expect(series.labelLine?.length2).toBe(25);
  });

  it("includes emphasis configuration", () => {
    const data = [{ name: "A", value: 50 }];
    const series = createPieSeries({ data });

    expect(series.emphasis?.scale).toBe(true);
    expect(series.emphasis?.scaleSize).toBe(8);
    expect(series.emphasis?.itemStyle?.shadowBlur).toBe(10);
  });
});

// ============================================================================
// Area Series Tests
// ============================================================================

describe("createAreaSeries", () => {
  it("creates an area series (line with fill)", () => {
    const series = createAreaSeries({
      name: "Revenue",
      data: [10, 20, 30, 40],
      color: "#00cc00",
    });

    expect(series.type).toBe("line");
    expect(series.areaStyle).toEqual({ opacity: 0.7 });
    expect(series.symbol).toBe("none"); // No symbols for area
    expect(series.smooth).toBe(true);
    expect(series.lineStyle?.width).toBe(1);
  });

  it("creates an area series with custom opacity", () => {
    const series = createAreaSeries({
      data: [1, 2, 3],
      opacity: 0.4,
    });

    expect(series.areaStyle).toEqual({ opacity: 0.4 });
  });

  it("creates a stacked area series", () => {
    const series = createAreaSeries({
      data: [1, 2, 3],
      stack: "stackedArea",
    });

    expect(series.stack).toBe("stackedArea");
  });
});

describe("createAreaSeriesGroup", () => {
  it("creates multiple area series for segments", () => {
    const segments = ["Area1", "Area2", "Area3"];
    const getData = (segment: string) => {
      const map: Record<string, (number | null)[]> = {
        Area1: [1, 2, 3],
        Area2: [4, null, 6],
        Area3: [7, 8, 9],
      };
      return map[segment];
    };
    const getColor = () => "#000";

    const series = createAreaSeriesGroup(segments, getData, getColor);

    expect(series).toHaveLength(3);
    expect(series[0].name).toBe("Area1");
    expect(series[0].type).toBe("line");
    expect(series[0].areaStyle).toBeDefined();
    expect(series[1].data).toEqual([4, null, 6]);
  });

  it("creates stacked area series with custom opacity", () => {
    const segments = ["X", "Y"];
    const getData = () => [1, 2];
    const getColor = () => "#000";

    const series = createAreaSeriesGroup(segments, getData, getColor, {
      stack: "total",
      opacity: 0.5,
    });

    expect(series[0].stack).toBe("total");
    expect(series[0].areaStyle).toEqual({ opacity: 0.5 });
    expect(series[1].stack).toBe("total");
  });
});

// ============================================================================
// Custom Series Tests
// ============================================================================

describe("createCustomSeries", () => {
  it("creates a custom series with basic configuration", () => {
    const mockRenderItem = () => ({ type: "group" as const, children: [] });
    const data = [{ x: 1, y: 2 }];

    const series = createCustomSeries({
      data,
      renderItem: mockRenderItem,
    });

    expect(series.type).toBe("custom");
    expect(series.data).toEqual(data);
    expect(series.renderItem).toBe(mockRenderItem);
    expect(series.z).toBe(10); // Default z-index
  });

  it("creates a custom series with custom z-index", () => {
    const series = createCustomSeries({
      data: [],
      renderItem: () => null,
      z: 50,
    });

    expect(series.z).toBe(50);
  });
});
