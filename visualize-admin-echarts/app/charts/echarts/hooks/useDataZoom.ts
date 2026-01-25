/**
 * useDataZoom Hook
 *
 * Provides shared dataZoom (time range filtering) functionality
 * for time-series charts like line and area charts.
 */

import { useCallback, useMemo } from "react";

import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";
import { useChartInteractiveFilters } from "@/stores/interactive-filters";

import type { DataZoomComponentOption } from "echarts";

/**
 * Validates a time domain and returns a safe domain span in milliseconds.
 * Returns null if domain is invalid (missing, empty, or zero span).
 */
const getValidDomainMs = (xDomain: Date[]): { start: Date; domainMs: number } | null => {
  if (!xDomain || xDomain.length < 2) return null;

  const start = xDomain[0];
  const end = xDomain[1];

  // Validate dates
  if (!(start instanceof Date) || !(end instanceof Date)) return null;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const domainMs = end.getTime() - start.getTime();

  // Ensure finite non-zero span
  if (!isFinite(domainMs) || domainMs <= 0) return null;

  return { start, domainMs };
};

interface UseDataZoomConfig {
  // xScale from D3 returns Date[] from domain(), which we'll cast to [Date, Date]
  xScale: { domain: () => Date[] };
  interactiveFiltersConfig?: {
    timeRange?: {
      active?: boolean;
    };
  };
}

interface UseDataZoomResult {
  showDataZoom: boolean;
  dataZoomStart: number;
  dataZoomEnd: number;
  handleDataZoom: (params: unknown) => void;
  dataZoomConfig: DataZoomComponentOption[] | undefined;
  extraHeight: number;
}

/**
 * Hook for managing dataZoom state and configuration in time-series charts.
 * Handles synchronization with interactive filters store.
 */
export const useDataZoom = (config: UseDataZoomConfig): UseDataZoomResult => {
  const { xScale, interactiveFiltersConfig } = config;

  // Interactive filter state
  const timeRange = useChartInteractiveFilters((d) => d.timeRange);
  const setTimeRange = useChartInteractiveFilters((d) => d.setTimeRange);
  const showDataZoom = interactiveFiltersConfig?.timeRange?.active ?? false;

  // Handle dataZoom changes
  const handleDataZoom = useCallback(
    (params: unknown) => {
      if (!setTimeRange) return;

      const xDomain = xScale.domain();
      const validDomain = getValidDomainMs(xDomain);

      // Skip if domain is invalid
      if (!validDomain) return;

      const { start: domainStart, domainMs } = validDomain;

      const typedParams = params as {
        start?: number;
        end?: number;
        batch?: Array<{ start: number; end: number }>;
      };

      let startPercent: number;
      let endPercent: number;

      if (typedParams.batch && typedParams.batch.length > 0) {
        startPercent = typedParams.batch[0].start;
        endPercent = typedParams.batch[0].end;
      } else {
        startPercent = typedParams.start ?? 0;
        endPercent = typedParams.end ?? 100;
      }

      // Clamp percentages to valid range
      startPercent = Math.max(0, Math.min(100, startPercent));
      endPercent = Math.max(0, Math.min(100, endPercent));

      const newFrom = new Date(
        domainStart.getTime() + (startPercent / 100) * domainMs
      );
      const newTo = new Date(
        domainStart.getTime() + (endPercent / 100) * domainMs
      );

      setTimeRange(newFrom, newTo);
    },
    [setTimeRange, xScale]
  );

  // Calculate initial dataZoom position from timeRange filter
  const { dataZoomStart, dataZoomEnd, isValidDomain } = useMemo(() => {
    let start = 0;
    let end = 100;

    const xDomain = xScale.domain();
    const validDomain = getValidDomainMs(xDomain);

    // If domain is invalid, return defaults with invalid flag
    if (!validDomain) {
      return { dataZoomStart: start, dataZoomEnd: end, isValidDomain: false };
    }

    if (timeRange?.from && timeRange?.to) {
      const { start: domainStart, domainMs } = validDomain;
      start = Math.max(
        0,
        ((timeRange.from.getTime() - domainStart.getTime()) / domainMs) * 100
      );
      end = Math.min(
        100,
        ((timeRange.to.getTime() - domainStart.getTime()) / domainMs) * 100
      );

      // Clamp to ensure valid range
      start = Math.max(0, Math.min(100, start));
      end = Math.max(0, Math.min(100, end));

      // Ensure start <= end
      if (start > end) {
        start = 0;
        end = 100;
      }
    }

    return { dataZoomStart: start, dataZoomEnd: end, isValidDomain: true };
  }, [timeRange, xScale]);

  // Build dataZoom configuration
  const dataZoomConfig = useMemo((): DataZoomComponentOption[] | undefined => {
    // Don't show zoom slider if data zoom is disabled or domain is invalid
    if (!showDataZoom || !isValidDomain) return undefined;

    return [
      {
        type: "slider",
        xAxisIndex: 0,
        start: dataZoomStart,
        end: dataZoomEnd,
        height: 30,
        bottom: 10,
        borderColor: SWISS_FEDERAL_COLORS.grid,
        fillerColor: "rgba(0, 102, 153, 0.2)",
        handleStyle: {
          color: SWISS_FEDERAL_COLORS.primary,
        },
        textStyle: {
          fontFamily: SWISS_FEDERAL_FONT.family,
          fontSize: 10,
          color: SWISS_FEDERAL_COLORS.text,
        },
      },
      {
        type: "inside",
        xAxisIndex: 0,
        start: dataZoomStart,
        end: dataZoomEnd,
      },
    ];
  }, [showDataZoom, isValidDomain, dataZoomStart, dataZoomEnd]);

  const extraHeight = showDataZoom ? 40 : 0;

  return {
    showDataZoom,
    dataZoomStart,
    dataZoomEnd,
    handleDataZoom,
    dataZoomConfig,
    extraHeight,
  };
};

/**
 * Returns event handlers for dataZoom enabled charts.
 */
export const useDataZoomEvents = (
  showDataZoom: boolean,
  handleDataZoom: (params: unknown) => void
) => {
  return useMemo(() => {
    if (!showDataZoom) return undefined;
    return {
      datazoom: handleDataZoom,
    };
  }, [showDataZoom, handleDataZoom]);
};
