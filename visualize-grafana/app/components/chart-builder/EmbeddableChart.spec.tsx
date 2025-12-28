/**
 * Tests for EmbeddableChart Component
 *
 * Tests the minimal chart rendering component for embedding.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmbeddableChart } from "./EmbeddableChart";
import type { EmbedPayload, EmbedOptions } from "@/utils/chart-config-encoder";

// Mock next/dynamic for ReactECharts
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockECharts = ({ option, style }: { option: unknown; style: React.CSSProperties }) => (
      <div data-testid="echarts" data-option={JSON.stringify(option)} style={style}>
        ECharts Mock
      </div>
    );
    MockECharts.displayName = "MockECharts";
    return MockECharts;
  },
}));

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // Trigger initial resize
    this.callback(
      [
        {
          contentRect: { width: 800, height: 400 } as DOMRectReadOnly,
        } as ResizeObserverEntry,
      ],
      this
    );
  }
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe("EmbeddableChart", () => {
  const createTestPayload = (): EmbedPayload => ({
    version: 1,
    chart: {
      chartType: "column",
      xField: "year",
      yField: "value",
      groupField: "category",
      title: "Test Chart",
      colorPalette: "swiss",
      showLegend: true,
      showTooltip: true,
      height: 400,
    },
    dataset: {
      title: "Test Dataset",
      dimensions: [
        { id: "year", label: "Year" },
        { id: "category", label: "Category" },
      ],
      measures: [{ id: "value", label: "Value" }],
      observations: [
        { year: "2020", category: "A", value: 100 },
        { year: "2021", category: "A", value: 150 },
        { year: "2020", category: "B", value: 200 },
        { year: "2021", category: "B", value: 250 },
      ],
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the chart container", () => {
    const payload = createTestPayload();
    render(<EmbeddableChart payload={payload} />);

    expect(screen.getByTestId("echarts")).toBeInTheDocument();
  });

  it("should apply default container styles", () => {
    const payload = createTestPayload();
    const { container } = render(<EmbeddableChart payload={payload} />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({
      width: "100%",
      backgroundColor: "rgb(255, 255, 255)",
    });
  });

  it("should apply transparent background when removeBorder is true", () => {
    const payload = createTestPayload();
    const options: EmbedOptions = { removeBorder: true };

    const { container } = render(
      <EmbeddableChart payload={payload} options={options} />
    );

    const outerDiv = container.firstChild as HTMLElement;
    // Check via style property directly since toHaveStyle can have matching issues
    expect(outerDiv.style.backgroundColor).toBe("transparent");
  });

  it("should remove padding when optimizeSpace is true", () => {
    const payload = createTestPayload();
    const options: EmbedOptions = { optimizeSpace: true };

    const { container } = render(
      <EmbeddableChart payload={payload} options={options} />
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({
      padding: "0px",
    });
  });

  it("should use custom height from options", () => {
    const payload = createTestPayload();
    const options: EmbedOptions = { height: 600 };

    const { container } = render(
      <EmbeddableChart payload={payload} options={options} />
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({
      height: "600px",
    });
  });

  it("should pass chart type to ECharts", () => {
    const payload = createTestPayload();
    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series).toBeDefined();
    expect(option.series[0].type).toBe("bar"); // column maps to bar in ECharts
  });

  it("should render pie chart correctly", () => {
    const payload = createTestPayload();
    payload.chart.chartType = "pie";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series[0].type).toBe("pie");
    expect(option.series[0].radius).toBeDefined();
  });

  it("should render line chart correctly", () => {
    const payload = createTestPayload();
    payload.chart.chartType = "line";
    payload.chart.groupField = "";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series[0].type).toBe("line");
    expect(option.series[0].smooth).toBe(true);
  });

  it("should render area chart with areaStyle", () => {
    const payload = createTestPayload();
    payload.chart.chartType = "area";
    payload.chart.groupField = "";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series[0].type).toBe("line");
    expect(option.series[0].areaStyle).toBeDefined();
  });

  it("should render scatter chart correctly", () => {
    const payload = createTestPayload();
    payload.chart.chartType = "scatter";
    payload.chart.groupField = "";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series[0].type).toBe("scatter");
    expect(option.series[0].symbolSize).toBeDefined();
  });

  it("should render bar chart correctly", () => {
    const payload = createTestPayload();
    payload.chart.chartType = "bar";
    payload.chart.groupField = "";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series[0].type).toBe("bar");
    // Bar chart has category on y-axis
    expect(option.yAxis.type).toBe("category");
  });

  it("should hide legend when hideLegend option is true", () => {
    const payload = createTestPayload();
    const options: EmbedOptions = { hideLegend: true };

    render(<EmbeddableChart payload={payload} options={options} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.legend).toBeUndefined();
  });

  it("should hide title when hideTitle option is true", () => {
    const payload = createTestPayload();
    const options: EmbedOptions = { hideTitle: true };

    render(<EmbeddableChart payload={payload} options={options} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.title).toBeUndefined();
  });

  it("should use custom color palette", () => {
    const payload = createTestPayload();
    payload.chart.colorPalette = "blue";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    // Blue palette starts with #1565C0
    expect(option.color[0]).toBe("#1565C0");
  });

  it("should use custom palettes when provided", () => {
    const payload = createTestPayload();
    payload.chart.colorPalette = "myCustom";
    payload.customPalettes = {
      myCustom: ["#FF0000", "#00FF00", "#0000FF"],
    };

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.color).toEqual(["#FF0000", "#00FF00", "#0000FF"]);
  });

  it("should filter observations when filters are provided", () => {
    const payload = createTestPayload();
    payload.filters = {
      category: ["A"],
    };

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    // Should only have series for category A
    expect(option.series.length).toBe(1);
    expect(option.series[0].name).toBe("A");
  });

  it("should handle empty observations", () => {
    const payload = createTestPayload();
    payload.dataset.observations = [];

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    expect(echarts).toBeInTheDocument();
  });

  it("should handle null values in observations", () => {
    const payload = createTestPayload();
    payload.dataset.observations = [
      { year: "2020", category: "A", value: null },
      { year: "2021", category: "A", value: 100 },
    ];

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    expect(echarts).toBeInTheDocument();
  });

  it("should include tooltip configuration when showTooltip is true", () => {
    const payload = createTestPayload();
    payload.chart.showTooltip = true;

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.tooltip).toBeDefined();
    expect(option.tooltip.trigger).toBe("axis");
  });

  it("should not include tooltip when showTooltip is false", () => {
    const payload = createTestPayload();
    payload.chart.showTooltip = false;

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.tooltip).toBeUndefined();
  });

  it("should set data-iframe-height attribute for iframe-resizer", () => {
    const payload = createTestPayload();
    const { container } = render(<EmbeddableChart payload={payload} />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveAttribute("data-iframe-height");
  });

  it("should handle grouped data with multiple categories", () => {
    const payload = createTestPayload();
    payload.dataset.observations = [
      { year: "2020", category: "A", value: 100 },
      { year: "2020", category: "B", value: 200 },
      { year: "2020", category: "C", value: 300 },
      { year: "2021", category: "A", value: 150 },
      { year: "2021", category: "B", value: 250 },
      { year: "2021", category: "C", value: 350 },
    ];

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    expect(option.series.length).toBe(3);
    expect(option.series.map((s: { name: string }) => s.name)).toEqual(["A", "B", "C"]);
  });

  it("should fall back to swiss palette for unknown palette", () => {
    const payload = createTestPayload();
    payload.chart.colorPalette = "unknown-palette";

    render(<EmbeddableChart payload={payload} />);

    const echarts = screen.getByTestId("echarts");
    const option = JSON.parse(echarts.getAttribute("data-option") || "{}");

    // Should use swiss palette (first color is #DC0018)
    expect(option.color[0]).toBe("#DC0018");
  });
});
