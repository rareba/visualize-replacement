/**
 * Pie Chart Adapter Tests
 *
 * Tests the transformation of ChartContext state to ECharts configuration
 * for pie charts.
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
import { PieChartAdapter } from "./pie-adapter";

describe("Pie Chart Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOption = null;
  });

  describe("PieChartAdapter", () => {
    it("should transform pie chart data to ECharts options", () => {
      const mockState = {
        chartData: [
          { segment: "A", value: 30 },
          { segment: "B", value: 20 },
          { segment: "C", value: 50 },
        ],
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        getY: (d: { value: number }) => d.value,
        colors: (segment: string) => `#color-${segment}`,
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        showValues: true,
        valueLabelFormatter: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(PieChartAdapter));

      const option = capturedOption as any;

      // Check series
      expect(option.series).toBeDefined();
      expect(option.series.length).toBe(1);
      expect(option.series[0].type).toBe("pie");

      // Check data
      expect(option.series[0].data.length).toBe(3);
      expect(option.series[0].data[0].name).toBe("A");
      expect(option.series[0].data[0].value).toBe(30);
    });

    it("should filter out zero values", () => {
      const mockState = {
        chartData: [
          { segment: "A", value: 30 },
          { segment: "B", value: 0 },
          { segment: "C", value: 50 },
        ],
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        getY: (d: { value: number }) => d.value,
        colors: (segment: string) => `#color-${segment}`,
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        showValues: true,
        valueLabelFormatter: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(PieChartAdapter));

      const option = capturedOption as any;

      // Zero value should be filtered out
      expect(option.series[0].data.length).toBe(2);
      expect(option.series[0].data.map((d: { name: string }) => d.name)).toEqual(["A", "C"]);
    });

    it("should show labels inside for 4 or fewer slices", () => {
      const mockState = {
        chartData: [
          { segment: "A", value: 30 },
          { segment: "B", value: 70 },
        ],
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        getY: (d: { value: number }) => d.value,
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        showValues: true,
        valueLabelFormatter: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(PieChartAdapter));

      const option = capturedOption as any;

      expect(option.series[0].label.position).toBe("inside");
    });

    it("should show labels outside for more than 4 slices", () => {
      const mockState = {
        chartData: [
          { segment: "A", value: 20 },
          { segment: "B", value: 20 },
          { segment: "C", value: 20 },
          { segment: "D", value: 20 },
          { segment: "E", value: 20 },
        ],
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        getY: (d: { value: number }) => d.value,
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        showValues: true,
        valueLabelFormatter: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(PieChartAdapter));

      const option = capturedOption as any;

      expect(option.series[0].label.position).toBe("outside");
    });

    it("should apply Swiss Federal theming", () => {
      const mockState = {
        chartData: [
          { segment: "A", value: 30 },
        ],
        getSegment: (d: { segment: string }) => d.segment,
        getSegmentAbbreviationOrLabel: (d: { segment: string }) => d.segment,
        getY: (d: { value: number }) => d.value,
        colors: () => "#ff0000",
        bounds: {
          width: 500,
          chartHeight: 300,
          margins: { left: 50, right: 20, top: 20, bottom: 50 },
        },
        showValues: true,
        valueLabelFormatter: undefined,
      };

      vi.mocked(useChartState).mockReturnValue(mockState as any);

      render(React.createElement(PieChartAdapter));

      const option = capturedOption as any;

      expect(option.series[0].label.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
      expect(option.series[0].select.itemStyle.borderColor).toBe(SWISS_FEDERAL_COLORS.primary);
    });
  });
});
