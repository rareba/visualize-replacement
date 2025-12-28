/**
 * Tests for SimpleEChartsChart Component
 *
 * Tests the standalone ECharts chart component that bypasses D3.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock echarts-for-react before importing the component
vi.mock("echarts-for-react", () => ({
  default: React.forwardRef(({ option, style }: { option: unknown; style?: React.CSSProperties }, _ref) => (
    <div data-testid="echarts" data-option={JSON.stringify(option)} style={style}>
      ECharts Mock
    </div>
  )),
}));

// Import after mocking
import { SimpleEChartsChart, type SimpleChartType } from "./SimpleEChartsChart";

describe("SimpleEChartsChart", () => {
  const createTestObservations = () => [
    { year: "2020", category: "A", value: 100 },
    { year: "2021", category: "A", value: 150 },
    { year: "2020", category: "B", value: 200 },
    { year: "2021", category: "B", value: 250 },
  ];

  const defaultProps = {
    observations: createTestObservations(),
    xField: "year",
    yField: "value",
    chartType: "column" as SimpleChartType,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the chart", () => {
    render(<SimpleEChartsChart {...defaultProps} />);
    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });

  it("should apply custom dimensions", () => {
    render(
      <SimpleEChartsChart {...defaultProps} width={800} height={500} />
    );

    const chart = screen.getByTestId("echarts");
    expect(chart).toHaveStyle({ width: "800px", height: "500px" });
  });

  it("should apply string dimensions", () => {
    render(
      <SimpleEChartsChart {...defaultProps} width="100%" height="400px" />
    );

    const chart = screen.getByTestId("echarts");
    expect(chart).toHaveStyle({ width: "100%", height: "400px" });
  });

  describe("column chart", () => {
    it("should generate bar series for column chart type", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="column" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series).toBeDefined();
      expect(option.series[0].type).toBe("bar");
    });

    it("should include category x-axis", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="column" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.xAxis.type).toBe("category");
      expect(option.xAxis.data).toContain("2020");
      expect(option.xAxis.data).toContain("2021");
    });
  });

  describe("bar chart (horizontal)", () => {
    it("should generate horizontal bar chart", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="bar" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].type).toBe("bar");
      // For horizontal bar, x and y axes are swapped
      expect(option.yAxis.type).toBe("category");
      expect(option.xAxis.type).toBe("value");
    });
  });

  describe("line chart", () => {
    it("should generate line series", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="line" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].type).toBe("line");
    });

    it("should apply smooth curves", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="line" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].smooth).toBe(true);
    });
  });

  describe("area chart", () => {
    it("should generate area chart with fill", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="area" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].type).toBe("line");
      expect(option.series[0].areaStyle).toBeDefined();
    });
  });

  describe("pie chart", () => {
    it("should generate pie series", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="pie" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].type).toBe("pie");
    });

    it("should aggregate data for pie chart", () => {
      const observations = [
        { year: "2020", value: 100 },
        { year: "2020", value: 50 },
        { year: "2021", value: 200 },
      ];

      render(
        <SimpleEChartsChart
          observations={observations}
          xField="year"
          yField="value"
          chartType="pie"
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      // 2020 should be aggregated to 150
      const data2020 = option.series[0].data.find(
        (d: { name: string }) => d.name === "2020"
      );
      expect(data2020.value).toBe(150);
    });

    it("should not include x/y axes for pie chart", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="pie" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.xAxis).toBeUndefined();
      expect(option.yAxis).toBeUndefined();
    });
  });

  describe("scatter chart", () => {
    it("should generate scatter series", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="scatter" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].type).toBe("scatter");
    });

    it("should use value axes for scatter", () => {
      render(<SimpleEChartsChart {...defaultProps} chartType="scatter" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.xAxis.type).toBe("value");
      expect(option.yAxis.type).toBe("value");
    });
  });

  describe("segmented data", () => {
    it("should create multiple series when segmentField is provided", () => {
      render(
        <SimpleEChartsChart
          {...defaultProps}
          segmentField="category"
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series.length).toBe(2);
      expect(option.series.map((s: { name: string }) => s.name)).toContain("A");
      expect(option.series.map((s: { name: string }) => s.name)).toContain("B");
    });
  });

  describe("legend and tooltip", () => {
    it("should show legend when segmentField is provided", () => {
      render(<SimpleEChartsChart {...defaultProps} segmentField="category" />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.legend).toBeDefined();
    });

    it("should not show legend when no segmentField", () => {
      render(<SimpleEChartsChart {...defaultProps} />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      // Legend is undefined when there's no segment
      expect(option.legend).toBeUndefined();
    });

    it("should hide legend when showLegend is false", () => {
      render(
        <SimpleEChartsChart
          {...defaultProps}
          segmentField="category"
          showLegend={false}
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.legend).toBeUndefined();
    });

    it("should show tooltip by default", () => {
      render(<SimpleEChartsChart {...defaultProps} />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.tooltip).toBeDefined();
    });

    it("should hide tooltip when showTooltip is false", () => {
      render(<SimpleEChartsChart {...defaultProps} showTooltip={false} />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.tooltip).toBeUndefined();
    });
  });

  describe("custom colors", () => {
    it("should use custom colors", () => {
      const customColors = ["#FF0000", "#00FF00", "#0000FF"];
      render(
        <SimpleEChartsChart
          {...defaultProps}
          segmentField="category"
          colors={customColors}
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[0].itemStyle.color).toBe("#FF0000");
      expect(option.series[1].itemStyle.color).toBe("#00FF00");
    });

    it("should cycle colors when more series than colors", () => {
      const observations = [
        { year: "2020", category: "A", value: 100 },
        { year: "2020", category: "B", value: 200 },
        { year: "2020", category: "C", value: 300 },
      ];
      const customColors = ["#FF0000", "#00FF00"];

      render(
        <SimpleEChartsChart
          observations={observations}
          xField="year"
          yField="value"
          chartType="column"
          segmentField="category"
          colors={customColors}
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.series[2].itemStyle.color).toBe("#FF0000");
    });
  });

  describe("title and labels", () => {
    it("should include title when provided", () => {
      render(
        <SimpleEChartsChart {...defaultProps} title="My Chart Title" />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.title).toBeDefined();
      expect(option.title.text).toBe("My Chart Title");
    });

    it("should include axis labels when provided", () => {
      render(
        <SimpleEChartsChart
          {...defaultProps}
          xAxisLabel="Year"
          yAxisLabel="Value (CHF)"
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.xAxis.name).toBe("Year");
      expect(option.yAxis.name).toBe("Value (CHF)");
    });
  });

  describe("data handling", () => {
    it("should show no data message for empty observations", () => {
      render(
        <SimpleEChartsChart
          observations={[]}
          xField="year"
          yField="value"
          chartType="column"
        />
      );

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should handle null values", () => {
      const observations = [
        { year: "2020", value: null },
        { year: "2021", value: 100 },
      ];

      render(
        <SimpleEChartsChart
          observations={observations}
          xField="year"
          yField="value"
          chartType="column"
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      // Null should be treated as 0
      expect(option.series[0].data[0]).toBe(0);
      expect(option.series[0].data[1]).toBe(100);
    });

    it("should handle URI values in x-axis", () => {
      const observations = [
        { year: "https://example.org/year/2020", value: 100 },
        { year: "https://example.org/year/2021", value: 200 },
      ];

      render(
        <SimpleEChartsChart
          observations={observations}
          xField="year"
          yField="value"
          chartType="column"
        />
      );

      const chart = screen.getByTestId("echarts");
      expect(chart).toBeInTheDocument();
    });

    it("should sort years chronologically", () => {
      const observations = [
        { year: "2021", value: 200 },
        { year: "2020", value: 100 },
        { year: "2019", value: 50 },
      ];

      render(
        <SimpleEChartsChart
          observations={observations}
          xField="year"
          yField="value"
          chartType="column"
        />
      );

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.xAxis.data).toEqual(["2019", "2020", "2021"]);
    });
  });

  describe("animation", () => {
    it("should use default animation duration", () => {
      render(<SimpleEChartsChart {...defaultProps} />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.animationDuration).toBe(500);
    });

    it("should use custom animation duration", () => {
      render(<SimpleEChartsChart {...defaultProps} animationDuration={1000} />);

      const chart = screen.getByTestId("echarts");
      const option = JSON.parse(chart.getAttribute("data-option") || "{}");

      expect(option.animationDuration).toBe(1000);
    });
  });
});
