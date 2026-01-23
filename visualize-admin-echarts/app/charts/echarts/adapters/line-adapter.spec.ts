/**
 * Line Chart Adapter Tests
 *
 * Tests the transformation of ChartContext state to ECharts configuration
 * for line charts.
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
import { LineChartAdapter } from "./line-adapter";

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

describe("Line Chart Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOption = null;
  });

  describe("LineChartAdapter", () => {
    it("should transform line chart data to ECharts options", () => {
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

      render(React.createElement(LineChartAdapter));

      const option = capturedOption as any;

      // Check xAxis configuration
      expect(option.xAxis).toBeDefined();
      expect(option.xAxis.type).toBe("category");
      expect(option.xAxis.boundaryGap).toBe(false);

      // Check yAxis configuration
      expect(option.yAxis).toBeDefined();
      expect(option.yAxis.type).toBe("value");

      // Check series
      expect(option.series).toBeDefined();
      expect(option.series.length).toBe(1);
      expect(option.series[0].type).toBe("line");
    });

    it("should include dataZoom when timeRange is active", () => {
      const mockState = {
        chartData: [
          { date: new Date("2020-01-01"), value: 10 },
        ],
        xScale: createMockTimeScale([new Date("2020-01-01"), new Date("2020-02-01")]),
        yScale: createMockLinearScale([0, 50]),
        getX: (d: { date: Date }) => d.date,
        getY: (d: { value: number }) => d.value,
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
          timeRange: { active: true },
        },
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(LineChartAdapter));

      const option = capturedOption as any;

      expect(option.dataZoom).toBeDefined();
      expect(option.dataZoom.length).toBe(2);
      expect(option.dataZoom[0].type).toBe("slider");
      expect(option.dataZoom[1].type).toBe("inside");
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

      render(React.createElement(LineChartAdapter));

      const option = capturedOption as any;

      expect(option.xAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.yAxis.axisLabel.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.series[0].itemStyle.color).toBe(SWISS_FEDERAL_COLORS.palette[0]);
    });
  });
});
