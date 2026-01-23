/**
 * Column Chart Adapter Tests
 *
 * Tests the transformation of ChartContext state to ECharts configuration
 * for simple, grouped, and stacked column charts.
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
  ColumnChartAdapter,
  GroupedColumnChartAdapter,
  StackedColumnChartAdapter,
} from "./column-adapter";

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

describe("Column Chart Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOption = null;
  });

  describe("ColumnChartAdapter", () => {
    it("should transform simple column chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { category: "A", value: 10, key: "A" },
          { category: "B", value: 20, key: "B" },
          { category: "C", value: 30, key: "C" },
        ],
        xScale: createMockBandScale(["A", "B", "C"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        showValues: false,
        rotateValues: false,
        formatXAxisTick: undefined,
        showYUncertainty: false,
        getYErrorRange: undefined,
        getYErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ColumnChartAdapter));

      const option = capturedOption as any;

      // Check xAxis configuration
      expect(option.xAxis).toBeDefined();
      expect(option.xAxis.type).toBe("category");
      expect(option.xAxis.data).toEqual(["A", "B", "C"]);
      expect(option.xAxis.name).toBe("Category");

      // Check yAxis configuration
      expect(option.yAxis).toBeDefined();
      expect(option.yAxis.type).toBe("value");
      expect(option.yAxis.name).toBe("Value");
      expect(option.yAxis.min).toBe(0);
      expect(option.yAxis.max).toBe(50);

      // Check series
      expect(option.series).toBeDefined();
      expect(option.series.length).toBeGreaterThanOrEqual(1);
      expect(option.series[0].type).toBe("bar");
    });

    it("should include error whiskers when uncertainty data is available", () => {
      const mockState = {
        chartData: [
          { category: "A", value: 10, key: "A" },
          { category: "B", value: 20, key: "B" },
        ],
        xScale: createMockBandScale(["A", "B"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        showValues: false,
        rotateValues: false,
        formatXAxisTick: undefined,
        showYUncertainty: true,
        getYErrorRange: (d: { value: number }) => [d.value - 2, d.value + 2] as [number, number],
        getYErrorPresent: () => true,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ColumnChartAdapter));

      const option = capturedOption as any;

      // Should have 2 series: bar + error whiskers
      expect(option.series.length).toBe(2);
      expect(option.series[1].type).toBe("custom");
    });

    it("should show value labels when showValues is true", () => {
      const mockState = {
        chartData: [{ category: "A", value: 10, key: "A" }],
        xScale: createMockBandScale(["A"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        showValues: true,
        rotateValues: false,
        formatXAxisTick: undefined,
        showYUncertainty: false,
        getYErrorRange: undefined,
        getYErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ColumnChartAdapter));

      const option = capturedOption as any;

      expect(option.series[0].label).toBeDefined();
      expect(option.series[0].label.show).toBe(true);
      expect(option.series[0].label.position).toBe("top");
    });
  });

  describe("GroupedColumnChartAdapter", () => {
    it("should transform grouped column chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { category: "A", segment: "S1", value: 10 },
          { category: "A", segment: "S2", value: 15 },
          { category: "B", segment: "S1", value: 20 },
          { category: "B", segment: "S2", value: 25 },
        ],
        xScale: createMockBandScale(["A", "B"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getSegment: (d: { segment: string }) => d.segment,
        segments: ["S1", "S2"],
        colors: (segment: string) => segment === "S1" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        formatXAxisTick: undefined,
        showYUncertainty: false,
        getYErrorRange: undefined,
        getYErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(GroupedColumnChartAdapter));

      const option = capturedOption as any;

      // Should have 2 series, one for each segment
      expect(option.series.length).toBe(2);
      expect(option.series[0].name).toBe("S1");
      expect(option.series[1].name).toBe("S2");

      // Each series should be a bar type
      expect(option.series[0].type).toBe("bar");
      expect(option.series[1].type).toBe("bar");

      // Series should NOT be stacked
      expect(option.series[0].stack).toBeUndefined();
    });

    it("should apply correct colors to each segment", () => {
      const mockState = {
        chartData: [
          { category: "A", segment: "S1", value: 10 },
          { category: "A", segment: "S2", value: 15 },
        ],
        xScale: createMockBandScale(["A"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getSegment: (d: { segment: string }) => d.segment,
        segments: ["S1", "S2"],
        colors: (segment: string) => segment === "S1" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        formatXAxisTick: undefined,
        showYUncertainty: false,
        getYErrorRange: undefined,
        getYErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(GroupedColumnChartAdapter));

      const option = capturedOption as any;

      expect(option.series[0].itemStyle.color).toBe("#ff0000");
      expect(option.series[1].itemStyle.color).toBe("#00ff00");
    });
  });

  describe("StackedColumnChartAdapter", () => {
    it("should transform stacked column chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { category: "A", segment: "S1", value: 10 },
          { category: "A", segment: "S2", value: 15 },
          { category: "B", segment: "S1", value: 20 },
          { category: "B", segment: "S2", value: 25 },
        ],
        xScale: createMockBandScale(["A", "B"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getSegment: (d: { segment: string }) => d.segment,
        segments: ["S1", "S2"],
        colors: (segment: string) => segment === "S1" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        formatXAxisTick: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(StackedColumnChartAdapter));

      const option = capturedOption as any;

      // Should have 2 series, one for each segment
      expect(option.series.length).toBe(2);

      // Series should be stacked
      expect(option.series[0].stack).toBe("total");
      expect(option.series[1].stack).toBe("total");

      // Each series should have emphasis focus on series
      expect(option.series[0].emphasis.focus).toBe("series");
    });
  });

  describe("Swiss Federal Theming", () => {
    it("should apply Swiss Federal font to axis labels", () => {
      const mockState = {
        chartData: [{ category: "A", value: 10, key: "A" }],
        xScale: createMockBandScale(["A"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        showValues: false,
        rotateValues: false,
        formatXAxisTick: undefined,
        showYUncertainty: false,
        getYErrorRange: undefined,
        getYErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ColumnChartAdapter));

      const option = capturedOption as any;

      expect(option.xAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.yAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    });

    it("should apply Swiss Federal colors to axis lines", () => {
      const mockState = {
        chartData: [{ category: "A", value: 10, key: "A" }],
        xScale: createMockBandScale(["A"]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { category: string }) => d.category,
        getY: (d: { value: number }) => d.value,
        getRenderingKey: (d: { key: string }) => d.key,
        colors: createMockColorScale(),
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Category",
        yAxisLabel: "Value",
        showValues: false,
        rotateValues: false,
        formatXAxisTick: undefined,
        showYUncertainty: false,
        getYErrorRange: undefined,
        getYErrorPresent: () => false,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ColumnChartAdapter));

      const option = capturedOption as any;

      expect(option.xAxis.axisLine.lineStyle.color).toBe(SWISS_FEDERAL_COLORS.axis);
      expect(option.yAxis.axisLine.lineStyle.color).toBe(SWISS_FEDERAL_COLORS.axis);
      expect(option.yAxis.splitLine.lineStyle.color).toBe(SWISS_FEDERAL_COLORS.grid);
    });
  });
});
