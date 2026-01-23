/**
 * Bar Chart Adapter Tests (Horizontal)
 *
 * Tests the transformation of ChartContext state to ECharts configuration
 * for simple, grouped, and stacked horizontal bar charts.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// Mock the useChartState hook
vi.mock("@/charts/shared/chart-state", () => ({
  useChartState: vi.fn(),
}));

// Store the option passed to EChartsWrapper
let capturedOption: unknown = null;

// Mock the EChartsWrapper component to capture the option
vi.mock("@/charts/echarts/EChartsWrapper", () => ({
  EChartsWrapper: ({ option }: { option: unknown }) => {
    capturedOption = option;
    return React.createElement("div", { "data-testid": "echarts-wrapper" });
  },
}));

import { useChartState } from "@/charts/shared/chart-state";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import {
  BarChartAdapter,
  GroupedBarChartAdapter,
  StackedBarChartAdapter,
} from "./bar-adapter";

// Helper to create mock scale
const createMockBandScale = (domain: string[], bandwidth: number = 50) => {
  const scale = ((value: string) => domain.indexOf(value) * bandwidth) as unknown as {
    domain: () => string[];
    bandwidth: () => number;
  };
  scale.domain = () => domain;
  scale.bandwidth = () => bandwidth;
  return scale;
};

const createMockLinearScale = (domainValue: [number, number]) => {
  const scale = ((value: number) => value) as unknown as {
    domain: () => [number, number];
  };
  scale.domain = () => domainValue;
  return scale;
};

const createMockColorScale = () => {
  const colorFn = (key: string) => `#color-${key}`;
  const scale = colorFn as ((key: string) => string) & {
    copy: () => (key: string) => string;
  };
  scale.copy = () => colorFn;
  return scale;
};

describe("Bar Chart Adapter (Horizontal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOption = null;
  });

  describe("BarChartAdapter", () => {
    it("should transform simple bar chart data to ECharts options with horizontal bars", () => {
      const mockState = {
        chartData: [
          { category: "A", value: 10, key: "A" },
          { category: "B", value: 20, key: "B" },
          { category: "C", value: 30, key: "C" },
        ],
        yScale: createMockBandScale(["A", "B", "C"]),
        xScale: createMockLinearScale([0, 50]),
        getX: (d: { value: number }) => d.value,
        getY: (d: { category: string }) => d.category,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 80, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Value",
        yAxisLabel: "Category",
        showValues: false,
        formatYAxisTick: undefined,
        showXUncertainty: false,
        getXErrorRange: undefined,
        getXErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(BarChartAdapter));

      const option = capturedOption as any;

      // For horizontal bars, yAxis should be category and xAxis should be value
      expect(option.yAxis).toBeDefined();
      expect(option.yAxis.type).toBe("category");
      expect(option.yAxis.data).toEqual(["A", "B", "C"]);
      expect(option.yAxis.name).toBe("Category");

      expect(option.xAxis).toBeDefined();
      expect(option.xAxis.type).toBe("value");
      expect(option.xAxis.name).toBe("Value");

      // Check series
      expect(option.series).toBeDefined();
      expect(option.series.length).toBeGreaterThanOrEqual(1);
      expect(option.series[0].type).toBe("bar");
    });

    it("should include horizontal error whiskers when uncertainty data is available", () => {
      const mockState = {
        chartData: [
          { category: "A", value: 10, key: "A" },
          { category: "B", value: 20, key: "B" },
        ],
        yScale: createMockBandScale(["A", "B"]),
        xScale: createMockLinearScale([0, 50]),
        getX: (d: { value: number }) => d.value,
        getY: (d: { category: string }) => d.category,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 80, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Value",
        yAxisLabel: "Category",
        showValues: false,
        formatYAxisTick: undefined,
        showXUncertainty: true,
        getXErrorRange: (d: { value: number }) => [d.value - 2, d.value + 2] as [number, number],
        getXErrorPresent: () => true,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(BarChartAdapter));

      const option = capturedOption as any;

      // Should have 2 series: bar + error whiskers
      expect(option.series.length).toBe(2);
      expect(option.series[1].type).toBe("custom");
    });
  });

  describe("GroupedBarChartAdapter", () => {
    it("should transform grouped bar chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { category: "A", segment: "S1", value: 10 },
          { category: "A", segment: "S2", value: 15 },
          { category: "B", segment: "S1", value: 20 },
          { category: "B", segment: "S2", value: 25 },
        ],
        yScale: createMockBandScale(["A", "B"]),
        xScale: createMockLinearScale([0, 50]),
        getX: (d: { value: number }) => d.value,
        getY: (d: { category: string }) => d.category,
        getSegment: (d: { segment: string }) => d.segment,
        segments: ["S1", "S2"],
        colors: (segment: string) => segment === "S1" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 80, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Value",
        yAxisLabel: "Category",
        formatYAxisTick: undefined,
        showXUncertainty: false,
        getXErrorRange: undefined,
        getXErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(GroupedBarChartAdapter));

      const option = capturedOption as any;

      // Should have 2 series, one for each segment
      expect(option.series.length).toBe(2);
      expect(option.series[0].name).toBe("S1");
      expect(option.series[1].name).toBe("S2");

      // Series should NOT be stacked
      expect(option.series[0].stack).toBeUndefined();
    });
  });

  describe("StackedBarChartAdapter", () => {
    it("should transform stacked bar chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { category: "A", segment: "S1", value: 10 },
          { category: "A", segment: "S2", value: 15 },
          { category: "B", segment: "S1", value: 20 },
          { category: "B", segment: "S2", value: 25 },
        ],
        yScale: createMockBandScale(["A", "B"]),
        xScale: createMockLinearScale([0, 50]),
        getX: (d: { value: number }) => d.value,
        getY: (d: { category: string }) => d.category,
        getSegment: (d: { segment: string }) => d.segment,
        segments: ["S1", "S2"],
        colors: (segment: string) => segment === "S1" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 80, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Value",
        yAxisLabel: "Category",
        formatYAxisTick: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(StackedBarChartAdapter));

      const option = capturedOption as any;

      // Series should be stacked
      expect(option.series[0].stack).toBe("total");
      expect(option.series[1].stack).toBe("total");
    });
  });

  describe("Swiss Federal Theming", () => {
    it("should apply Swiss Federal theming", () => {
      const mockState = {
        chartData: [{ category: "A", value: 10, key: "A" }],
        yScale: createMockBandScale(["A"]),
        xScale: createMockLinearScale([0, 50]),
        getX: (d: { value: number }) => d.value,
        getY: (d: { category: string }) => d.category,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 80, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Value",
        yAxisLabel: "Category",
        showValues: false,
        formatYAxisTick: undefined,
        showXUncertainty: false,
        getXErrorRange: undefined,
        getXErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(BarChartAdapter));

      const option = capturedOption as any;

      expect(option.xAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.yAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.xAxis.axisLine.lineStyle.color).toBe(SWISS_FEDERAL_COLORS.axis);
    });
  });
});
