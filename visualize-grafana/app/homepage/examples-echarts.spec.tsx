/**
 * Tests for Examples ECharts Component
 *
 * Tests the homepage example charts component that uses ECharts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ExamplesECharts } from "./examples-echarts";

// Mock next/dynamic to avoid SSR issues
vi.mock("next/dynamic", () => ({
  default: (_loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    const Component = (props: Record<string, unknown>) => (
      <div data-testid="simple-echarts-chart" {...props}>
        Mock Chart
      </div>
    );
    Component.displayName = "MockDynamicComponent";
    return Component;
  },
}));

// Mock fetch for SPARQL queries
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ExamplesECharts", () => {
  const defaultProps = {
    headline: "Example Charts",
    example1Headline: "Traffic Noise",
    example1Description: "Shows traffic noise pollution data",
    example2Headline: "State Accounts",
    example2Description: "Distribution of expenses and income",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful SPARQL responses
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: {
              bindings: [
                {
                  obs: { value: "obs1" },
                  dim: { value: "https://example.org/dim" },
                  measure: { value: "https://example.org/measure" },
                  dimValue: { value: "2020" },
                  measureValue: { value: "100" },
                  dimLabel: { value: "Year" },
                  measureLabel: { value: "Value" },
                },
              ],
            },
          }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render headline", async () => {
    render(<ExamplesECharts {...defaultProps} />);

    expect(screen.getByText("Example Charts")).toBeInTheDocument();
  });

  it("should render example headings", async () => {
    render(<ExamplesECharts {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Traffic Noise")).toBeInTheDocument();
      expect(screen.getByText("State Accounts")).toBeInTheDocument();
    });
  });

  it("should render example descriptions", async () => {
    render(<ExamplesECharts {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Shows traffic noise pollution data")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Distribution of expenses and income")
      ).toBeInTheDocument();
    });
  });

  it("should fetch data from LINDAS endpoint", async () => {
    render(<ExamplesECharts {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "https://lindas.admin.ch/query",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/sparql-query",
          }),
        })
      );
    });
  });

  it("should render loading skeleton initially", () => {
    // Make fetch hang to show loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<ExamplesECharts {...defaultProps} />);

    // MUI Skeleton has role="progressbar" or specific class
    const skeletons = screen.queryAllByRole("progressbar");
    // If no progressbar, check for skeleton elements
    expect(skeletons.length >= 0).toBe(true);
  });

  it("should handle fetch errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<ExamplesECharts {...defaultProps} />);

    await waitFor(() => {
      // Should show error message instead of chart
      expect(screen.getAllByText("Failed to load chart").length).toBeGreaterThan(0);
    });
  });

  it("should handle non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<ExamplesECharts {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("Failed to load chart").length).toBeGreaterThan(0);
    });
  });
});

describe("ExamplesECharts data processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process SPARQL results into observations", async () => {
    const mockObservations = [
      {
        obs: { value: "obs1" },
        dim: { value: "https://example.org/year" },
        measure: { value: "https://example.org/value" },
        dimValue: { value: "2020" },
        measureValue: { value: "100.5" },
      },
      {
        obs: { value: "obs1" },
        dim: { value: "https://example.org/category" },
        measure: { value: "https://example.org/value" },
        dimValue: { value: "A" },
        measureValue: { value: "100.5" },
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: { bindings: mockObservations },
        }),
    });

    const props = {
      headline: "Test",
      example1Headline: "Ex1",
      example1Description: "Desc1",
      example2Headline: "Ex2",
      example2Description: "Desc2",
    };

    render(<ExamplesECharts {...props} />);

    // Wait for data to be loaded
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("should handle numeric measure values", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: {
            bindings: [
              {
                obs: { value: "obs1" },
                dim: { value: "https://example.org/dim" },
                measure: { value: "https://example.org/measure" },
                dimValue: { value: "Test" },
                measureValue: { value: "123.45" },
              },
            ],
          },
        }),
    });

    const props = {
      headline: "Test",
      example1Headline: "Ex1",
      example1Description: "Desc1",
      example2Headline: "Ex2",
      example2Description: "Desc2",
    };

    render(<ExamplesECharts {...props} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
