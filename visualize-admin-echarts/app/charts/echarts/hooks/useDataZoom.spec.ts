/**
 * Tests for useDataZoom Hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";

import { useDataZoom, useDataZoomEvents } from "./useDataZoom";

// ============================================================================
// Mocks
// ============================================================================

// Mock the interactive filters store
const mockSetTimeRange = vi.fn();
let mockTimeRange: { from: Date; to: Date } | undefined;

vi.mock("@/stores/interactive-filters", () => ({
  useChartInteractiveFilters: (selector: (state: unknown) => unknown) => {
    const state = {
      timeRange: mockTimeRange,
      setTimeRange: mockSetTimeRange,
    };
    return selector(state);
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

const createMockXScale = (startDate: Date, endDate: Date) => ({
  domain: () => [startDate, endDate] as [Date, Date],
});

// ============================================================================
// useDataZoom Tests
// ============================================================================

describe("useDataZoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimeRange = undefined;
  });

  describe("showDataZoom", () => {
    it("returns false when timeRange is not active", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: false } },
        })
      );

      expect(result.current.showDataZoom).toBe(false);
    });

    it("returns true when timeRange is active", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      expect(result.current.showDataZoom).toBe(true);
    });

    it("returns false when interactiveFiltersConfig is undefined", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() => useDataZoom({ xScale }));

      expect(result.current.showDataZoom).toBe(false);
    });
  });

  describe("dataZoomStart and dataZoomEnd", () => {
    it("returns 0-100% when no timeRange filter is set", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      expect(result.current.dataZoomStart).toBe(0);
      expect(result.current.dataZoomEnd).toBe(100);
    });

    it("calculates correct percentages from timeRange filter", () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const xScale = createMockXScale(startDate, endDate);

      // Set timeRange to middle 50% of the range
      const midStart = new Date("2023-04-02"); // ~25% into the year
      const midEnd = new Date("2023-10-01"); // ~75% into the year
      mockTimeRange = { from: midStart, to: midEnd };

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      // Should be approximately 25% and 75%
      expect(result.current.dataZoomStart).toBeGreaterThan(20);
      expect(result.current.dataZoomStart).toBeLessThan(30);
      expect(result.current.dataZoomEnd).toBeGreaterThan(70);
      expect(result.current.dataZoomEnd).toBeLessThan(80);
    });

    it("clamps values to 0-100 range", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      // Set timeRange outside the domain
      mockTimeRange = {
        from: new Date("2022-01-01"), // Before domain start
        to: new Date("2024-12-31"), // After domain end
      };

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      expect(result.current.dataZoomStart).toBe(0);
      expect(result.current.dataZoomEnd).toBe(100);
    });
  });

  describe("handleDataZoom", () => {
    it("calls setTimeRange with calculated dates from percentages", () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const xScale = createMockXScale(startDate, endDate);

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      act(() => {
        result.current.handleDataZoom({ start: 25, end: 75 });
      });

      expect(mockSetTimeRange).toHaveBeenCalled();
      const [fromDate, toDate] = mockSetTimeRange.mock.calls[0];

      // Check that the dates are roughly correct (25% and 75% of the year)
      expect(fromDate.getTime()).toBeGreaterThan(startDate.getTime());
      expect(toDate.getTime()).toBeLessThan(endDate.getTime());
    });

    it("handles batch parameters (from slider component)", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      act(() => {
        result.current.handleDataZoom({
          batch: [{ start: 10, end: 90 }],
        });
      });

      expect(mockSetTimeRange).toHaveBeenCalled();
    });

    it("uses default 0-100 when params are missing", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      act(() => {
        result.current.handleDataZoom({});
      });

      expect(mockSetTimeRange).toHaveBeenCalled();
    });
  });

  describe("dataZoomConfig", () => {
    it("returns undefined when showDataZoom is false", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: false } },
        })
      );

      expect(result.current.dataZoomConfig).toBeUndefined();
    });

    it("returns dataZoom configuration when active", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      expect(result.current.dataZoomConfig).toBeDefined();
      expect(result.current.dataZoomConfig).toHaveLength(2);
    });

    it("includes slider and inside dataZoom components", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      const config = result.current.dataZoomConfig!;
      expect(config[0].type).toBe("slider");
      expect(config[1].type).toBe("inside");
    });

    it("uses Swiss Federal styling for slider", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      const sliderConfig = result.current.dataZoomConfig![0] as {
        borderColor?: string;
        handleStyle?: { color?: string };
        textStyle?: { fontFamily?: string };
      };
      expect(sliderConfig.borderColor).toBe(SWISS_FEDERAL_COLORS.grid);
      expect(sliderConfig.handleStyle?.color).toBe(SWISS_FEDERAL_COLORS.primary);
      expect(sliderConfig.textStyle?.fontFamily).toBe(SWISS_FEDERAL_FONT.family);
    });

    it("sets correct start and end percentages", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      mockTimeRange = {
        from: new Date("2023-01-01"),
        to: new Date("2023-07-01"),
      };

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      const config = result.current.dataZoomConfig!;
      // Both slider and inside should have same start/end
      expect(config[0].start).toBe(config[1].start);
      expect(config[0].end).toBe(config[1].end);
    });
  });

  describe("extraHeight", () => {
    it("returns 40 when dataZoom is shown", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: true } },
        })
      );

      expect(result.current.extraHeight).toBe(40);
    });

    it("returns 0 when dataZoom is not shown", () => {
      const xScale = createMockXScale(
        new Date("2023-01-01"),
        new Date("2023-12-31")
      );

      const { result } = renderHook(() =>
        useDataZoom({
          xScale,
          interactiveFiltersConfig: { timeRange: { active: false } },
        })
      );

      expect(result.current.extraHeight).toBe(0);
    });
  });
});

// ============================================================================
// useDataZoomEvents Tests
// ============================================================================

describe("useDataZoomEvents", () => {
  it("returns undefined when showDataZoom is false", () => {
    const mockHandler = vi.fn();

    const { result } = renderHook(() => useDataZoomEvents(false, mockHandler));

    expect(result.current).toBeUndefined();
  });

  it("returns event handlers when showDataZoom is true", () => {
    const mockHandler = vi.fn();

    const { result } = renderHook(() => useDataZoomEvents(true, mockHandler));

    expect(result.current).toBeDefined();
    expect(result.current?.datazoom).toBe(mockHandler);
  });

  it("memoizes the event handlers", () => {
    const mockHandler = vi.fn();

    const { result, rerender } = renderHook(
      ({ show, handler }) => useDataZoomEvents(show, handler),
      { initialProps: { show: true, handler: mockHandler } }
    );

    const firstResult = result.current;
    rerender({ show: true, handler: mockHandler });
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });

  it("updates when handler changes", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ show, handler }) => useDataZoomEvents(show, handler),
      { initialProps: { show: true, handler: handler1 } }
    );

    const firstResult = result.current;
    rerender({ show: true, handler: handler2 });
    const secondResult = result.current;

    expect(firstResult).not.toBe(secondResult);
    expect(secondResult?.datazoom).toBe(handler2);
  });
});
