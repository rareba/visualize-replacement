/**
 * Area Chart Adapter Tests
 *
 * Tests the transformation of ChartContext state to ECharts configuration
 * for stacked area charts.
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

// Mock the interactive filters store
vi.mock("@/stores/interactive-filters", () => ({
  useChartInteractiveFilters: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      timeRange: null,
      setTimeRange: vi.fn(),
    };
    return selector(state);
  }),
}));

import { useChartState } from "@/charts/shared/chart-state";
import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { AreaChartAdapter } from "./area-adapter";

// Helper to create mock time scale
const createMockTimeScale = (domainDates: [Date, Date]) => {
  const scale = ((value: Date) => value.getTime()) as unknown as {
    domain: () => [Date, Date];
  };
  scale.domain = () => domainDates;
  return scale;
};

const createMockLinearScale = (domainValue: [number, number]) => {
  const scale = ((value: number) => value) as unknown as {
    domain: () => [number, number];
  };
  scale.domain = () => domainValue;
  return scale;
};

describe("Area Chart Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOption = null;
  });

  describe("AreaChartAdapter", () => {
    it("should transform area chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { date: new Date("2020-01-01"), value: 10 },
          { date: new Date("2020-02-01"), value: 20 },
          { date: new Date("2020-03-01"), value: 30 },
        ],
        xScale: createMockTimeScale([new Date("2020-01-01"), new Date("2020-03-01")]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { date: Date }) => d.date,
        getY: (d: { value: number }) => d.value,
        getSegment: () => "default",
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Date",
        yAxisLabel: "Value",
        interactiveFiltersConfig: {
          timeRange: { active: false },
        },
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(AreaChartAdapter));

      const option = capturedOption as any;

      // Check xAxis configuration
      expect(option.xAxis).toBeDefined();
      expect(option.xAxis.type).toBe("category");
      expect(option.xAxis.boundaryGap).toBe(false);

      // Check series
      expect(option.series).toBeDefined();
      expect(option.series.length).toBe(1);
      expect(option.series[0].type).toBe("line");

      // Area chart should have areaStyle defined
      expect(option.series[0].areaStyle).toBeDefined();
      expect(option.series[0].areaStyle.opacity).toBe(0.7);
    });

    it("should use segment keys for grouping data (not labels) - verifying bug fix", () => {
      // This test verifies the fix for the area chart rendering bug
      const mockState = {
        chartData: [
          { date: new Date("2020-01-01"), value: 10, segmentKey: "key_A" },
          { date: new Date("2020-01-01"), value: 15, segmentKey: "key_B" },
        ],
        xScale: createMockTimeScale([new Date("2020-01-01"), new Date("2020-02-01")]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { date: Date }) => d.date,
        getY: (d: { value: number }) => d.value,
        getSegment: (d: { segmentKey: string }) => d.segmentKey,
        getSegmentAbbreviationOrLabel: () => "Label",
        segments: ["key_A", "key_B"],
        colors: (segmentKey: string) => segmentKey === "key_A" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Date",
        yAxisLabel: "Value",
        interactiveFiltersConfig: {
          timeRange: { active: false },
        },
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(AreaChartAdapter));

      const option = capturedOption as any;

      // Verify that data is properly grouped and series have data
      expect(option.series.length).toBe(2);

      // Series should have data (verifying the fix works)
      expect(option.series[0].data.length).toBeGreaterThan(0);
      expect(option.series[1].data.length).toBeGreaterThan(0);

      // First data point should match our input
      expect(option.series[0].data[0]).toBe(10);
      expect(option.series[1].data[0]).toBe(15);
    });

    it("should apply stacking for multiple segments", () => {
      const mockState = {
        chartData: [
          { date: new Date("2020-01-01"), value: 10, segment: "A" },
          { date: new Date("2020-01-01"), value: 15, segment: "B" },
        ],
        xScale: createMockTimeScale([new Date("2020-01-01"), new Date("2020-02-01")]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { date: Date }) => d.date,
        getY: (d: { value: number }) => d.value,
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        segments: ["A", "B"],
        colors: (segment: string) => segment === "A" ? "#ff0000" : "#00ff00",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Date",
        yAxisLabel: "Value",
        interactiveFiltersConfig: {
          timeRange: { active: false },
        },
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(AreaChartAdapter));

      const option = capturedOption as any;

      // Series should be stacked
      expect(option.series[0].stack).toBe("total");
      expect(option.series[1].stack).toBe("total");
    });

    it("should apply Swiss Federal theming", () => {
      const mockState = {
        chartData: [
          { date: new Date("2020-01-01"), value: 10 },
        ],
        xScale: createMockTimeScale([new Date("2020-01-01"), new Date("2020-02-01")]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { date: Date }) => d.date,
        getY: (d: { value: number }) => d.value,
        getSegment: () => "default",
        getSegmentAbbreviationOrLabel: () => "default",
        segments: [],
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        xAxisLabel: "Date",
        yAxisLabel: "Value",
        interactiveFiltersConfig: {
          timeRange: { active: false },
        },
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(AreaChartAdapter));

      const option = capturedOption as any;

      expect(option.xAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.yAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.series[0].itemStyle.color).toBe(SWISS_FEDERAL_COLORS.palette[0]);
    });
  });
});
