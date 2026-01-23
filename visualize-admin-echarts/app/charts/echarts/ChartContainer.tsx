/**
 * Chart Container
 *
 * A wrapper component that handles the common rendering pattern for all chart adapters.
 * Eliminates duplication of dimension calculation and wrapper rendering.
 */

import React, { useMemo } from "react";

import { calculateChartDimensions, safeGetBounds } from "@/charts/echarts/adapter-utils";
import { EChartsWrapper, EChartsWrapperProps } from "@/charts/echarts/EChartsWrapper";

import type { EChartsOption } from "echarts";

// ============================================================================
// Types
// ============================================================================

export interface ChartBounds {
  width?: number;
  height?: number;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartContainerProps {
  /** The ECharts option configuration */
  option: EChartsOption;
  /** Chart bounds from state */
  bounds: ChartBounds | undefined;
  /** Extra height for interactive elements like dataZoom */
  extraHeight?: number;
  /** Event handlers for ECharts events */
  onEvents?: EChartsWrapperProps["onEvents"];
  /** Additional CSS class name */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Container component for ECharts that handles dimension calculation and rendering.
 * Use this to wrap chart options for consistent rendering across adapters.
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  option,
  bounds,
  extraHeight = 0,
  onEvents,
  className,
  loading = false,
  ariaLabel,
}) => {
  const dimensions = useMemo(() => {
    const safeBounds = safeGetBounds(bounds);
    return calculateChartDimensions(safeBounds, extraHeight);
  }, [bounds, extraHeight]);

  const style = useMemo(
    () => ({
      width: dimensions.width,
      height: dimensions.height,
    }),
    [dimensions]
  );

  return (
    <div
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <EChartsWrapper
        option={option}
        onEvents={onEvents}
        style={style}
        loading={loading}
      />
    </div>
  );
};

// ============================================================================
// Hook for Building Chart Props
// ============================================================================

export interface UseChartContainerProps {
  bounds: ChartBounds | undefined;
  extraHeight?: number;
}

export interface UseChartContainerResult {
  dimensions: { width: number; height: number };
  safeBounds: ReturnType<typeof safeGetBounds>;
}

/**
 * Hook that provides computed dimensions and safe bounds for chart adapters.
 * Use this when you need access to dimensions in the option building phase.
 */
export const useChartContainer = ({
  bounds,
  extraHeight = 0,
}: UseChartContainerProps): UseChartContainerResult => {
  const safeBounds = useMemo(() => safeGetBounds(bounds), [bounds]);

  const dimensions = useMemo(
    () => calculateChartDimensions(safeBounds, extraHeight),
    [safeBounds, extraHeight]
  );

  return { dimensions, safeBounds };
};

// ============================================================================
// Higher-Order Component for Adapters
// ============================================================================

export interface AdapterConfig<TState> {
  /** Function to extract bounds from chart state */
  getBounds: (state: TState) => ChartBounds | undefined;
  /** Function to compute extra height (e.g., for dataZoom) */
  getExtraHeight?: (state: TState) => number;
  /** Function to get event handlers */
  getEvents?: (state: TState) => EChartsWrapperProps["onEvents"];
}

/**
 * Creates a wrapped adapter component with automatic dimension handling.
 *
 * @example
 * ```tsx
 * const MyChartAdapter = withChartContainer(
 *   (state: MyChartState) => {
 *     // Build and return ECharts option
 *     return { ... };
 *   },
 *   {
 *     getBounds: (state) => state.bounds,
 *     getExtraHeight: (state) => state.showDataZoom ? 40 : 0,
 *   }
 * );
 * ```
 */
export function withChartContainer<TState>(
  buildOption: (state: TState, safeBounds: ReturnType<typeof safeGetBounds>) => EChartsOption,
  config: AdapterConfig<TState>
) {
  return function ChartAdapter({ state }: { state: TState }) {
    const bounds = config.getBounds(state);
    const extraHeight = config.getExtraHeight?.(state) ?? 0;
    const events = config.getEvents?.(state);

    const safeBounds = safeGetBounds(bounds);
    const dimensions = calculateChartDimensions(safeBounds, extraHeight);

    const option = useMemo(
      () => buildOption(state, safeBounds),
      [state, safeBounds]
    );

    return (
      <EChartsWrapper
        option={option}
        onEvents={events}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
    );
  };
}

// ============================================================================
// Render Function Pattern
// ============================================================================

export interface RenderChartProps {
  option: EChartsOption;
  bounds: ChartBounds | undefined;
  extraHeight?: number;
  onEvents?: EChartsWrapperProps["onEvents"];
}

/**
 * Utility function for rendering a chart with standard configuration.
 * Use this for simple render patterns without a full component.
 */
export const renderChart = ({
  option,
  bounds,
  extraHeight = 0,
  onEvents,
}: RenderChartProps): JSX.Element => {
  const safeBounds = safeGetBounds(bounds);
  const dimensions = calculateChartDimensions(safeBounds, extraHeight);

  return (
    <EChartsWrapper
      option={option}
      onEvents={onEvents}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};
