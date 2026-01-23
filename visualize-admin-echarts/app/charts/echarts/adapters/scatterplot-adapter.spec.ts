/**
 * Scatterplot Chart Adapter Tests
 *
 * Tests the transformation of ChartContext state to ECharts configuration
 * for scatterplot charts.
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

// Mock the EChartsWrapper component
vi.mock("@/charts/echarts/EChartsWrapper", () => ({
  EChartsWrapper: ({ option }: { option: unknown }) => {
    capturedOption = option;
    return React.createElement("div", { "data-testid": "echarts-wrapper" });
  },
}));

import { useChartState } from "@/charts/shared/chart-state";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { ScatterplotChartAdapter } from "./scatterplot-adapter";

// Helper to create mock linear scale
const createMockLinearScale = (domainValue: [number, number]) => {
  const scale = ((value: number) => value) as unknown as {
    domain: () => [number, number];
  };
  scale.domain = () => domainValue;
  return scale;
};

describe("Scatterplot Chart Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOption = null;
  });

  describe("ScatterplotChartAdapter - Single Series", () => {
    it("should transform single series scatterplot data to ECharts options", () => {
      const mockState = {
        chartData: [
          { x: 10, y: 20 },
          { x: 15, y: 25 },
          { x: 20, y: 30 },
        ],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      // Check xAxis configuration
      expect(option.xAxis).toBeDefined();
      expect(option.xAxis.type).toBe("value");
      expect(option.xAxis.name).toBe("X Value");

      // Check yAxis configuration
      expect(option.yAxis).toBeDefined();
      expect(option.yAxis.type).toBe("value");
      expect(option.yAxis.name).toBe("Y Value");

      // Check series
      expect(option.series).toBeDefined();
      expect(option.series.length).toBe(1);
      expect(option.series[0].type).toBe("scatter");

      // Check data points
      expect(option.series[0].data.length).toBe(3);
      expect(option.series[0].data[0]).toEqual([10, 20]);
    });

    it("should use first palette color for single series", () => {
      const mockState = {
        chartData: [
          { x: 10, y: 20 },
        ],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      expect(option.series[0].itemStyle.color).toBe(SWISS_FEDERAL_COLORS.palette[0]);
    });
  });

  describe("ScatterplotChartAdapter - Multiple Segments", () => {
    it("should transform multi-segment scatterplot data to ECharts options", () => {
      const mockState = {
        chartData: [
          { x: 10, y: 20, segment: "A" },
          { x: 15, y: 25, segment: "A" },
          { x: 12, y: 22, segment: "B" },
        ],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        segments: ["A", "B"],
        colors: (segment: string) => segment === "A" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      // Should have 2 series, one for each segment
      expect(option.series.length).toBe(2);
      expect(option.series[0].name).toBe("A");
      expect(option.series[1].name).toBe("B");

      // Each series should be scatter type
      expect(option.series[0].type).toBe("scatter");
      expect(option.series[1].type).toBe("scatter");
    });
  });

  describe("Swiss Federal Theming", () => {
    it("should apply Swiss Federal theming", () => {
      const mockState = {
        chartData: [
          { x: 10, y: 20 },
        ],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      expect(option.xAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.yAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.xAxis.axisLine.lineStyle.color).toBe(SWISS_FEDERAL_COLORS.axis);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty chart data", () => {
      const mockState = {
        chartData: [],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      // Should show "No data available" message
      expect(option.graphic).toBeDefined();
      expect(option.series).toEqual([]);
    });

    it("should handle null/undefined bounds", () => {
      const mockState = {
        chartData: [{ x: 10, y: 20 }],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: undefined,
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      // Should not throw
      expect(() => render(React.createElement(ScatterplotChartAdapter))).not.toThrow();
    });

    it("should handle null values in data", () => {
      const mockState = {
        chartData: [
          { x: 10, y: 20 },
          { x: null, y: 25 },
          { x: 15, y: null },
          { x: 20, y: 30 },
        ],
        xScale: createMockLinearScale([0, 30]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number | null }) => d.x,
        getY: (d: { y: number | null }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      // Should only have 2 valid data points (filtered out null values)
      expect(option.series[0].data.length).toBe(2);
      expect(option.series[0].data[0]).toEqual([10, 20]);
      expect(option.series[0].data[1]).toEqual([20, 30]);
    });

    it("should handle NaN values in scale domain", () => {
      const mockState = {
        chartData: [{ x: 10, y: 20 }],
        xScale: createMockLinearScale([NaN, NaN]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { x: number }) => d.x,
        getY: (d: { y: number }) => d.y,
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "X Value",
        yAxisLabel: "Y Value",
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(ScatterplotChartAdapter));

      const option = capturedOption as any;

      // Should use fallback domain values
      expect(option.xAxis.min).toBe(0);
      expect(option.xAxis.max).toBe(100);
    });
  });
});
