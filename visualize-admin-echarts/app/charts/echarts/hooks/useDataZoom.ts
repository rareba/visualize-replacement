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

      const typedParams = params as {
        start?: number;
        end?: number;
        batch?: Array<{ start: number; end: number }>;
      };
      const xDomain = xScale.domain();
      const domainMs = xDomain[1].getTime() - xDomain[0].getTime();

      let startPercent: number;
      let endPercent: number;

      if (typedParams.batch && typedParams.batch.length > 0) {
        startPercent = typedParams.batch[0].start;
        endPercent = typedParams.batch[0].end;
      } else {
        startPercent = typedParams.start ?? 0;
        endPercent = typedParams.end ?? 100;
      }

      const newFrom = new Date(
        xDomain[0].getTime() + (startPercent / 100) * domainMs
      );
      const newTo = new Date(
        xDomain[0].getTime() + (endPercent / 100) * domainMs
      );

      setTimeRange(newFrom, newTo);
    },
    [setTimeRange, xScale]
  );

  // Calculate initial dataZoom position from timeRange filter
  const { dataZoomStart, dataZoomEnd } = useMemo(() => {
    let start = 0;
    let end = 100;

    if (timeRange?.from && timeRange?.to) {
      const xDomain = xScale.domain();
      const domainMs = xDomain[1].getTime() - xDomain[0].getTime();
      start = Math.max(
        0,
        ((timeRange.from.getTime() - xDomain[0].getTime()) / domainMs) * 100
      );
      end = Math.min(
        100,
        ((timeRange.to.getTime() - xDomain[0].getTime()) / domainMs) * 100
      );
    }

    return { dataZoomStart: start, dataZoomEnd: end };
  }, [timeRange, xScale]);

  // Build dataZoom configuration
  const dataZoomConfig = useMemo((): DataZoomComponentOption[] | undefined => {
    if (!showDataZoom) return undefined;

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
  }, [showDataZoom, dataZoomStart, dataZoomEnd]);

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
