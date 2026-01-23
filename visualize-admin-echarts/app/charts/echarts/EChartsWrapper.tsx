/**
 * ECharts Wrapper Component
 *
 * A React wrapper for Apache ECharts that provides:
 * - Automatic resize handling
 * - Theme integration
 * - Tooltip customization
 * - Event handling
 */

import ReactECharts from "echarts-for-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { mergeWithTheme, SWISS_FEDERAL_ANIMATION } from "./theme";

import type { ECharts, EChartsOption } from "echarts";

export interface EChartsWrapperProps {
  option: EChartsOption;
  width?: number | string;
  height?: number | string;
  loading?: boolean;
  showLoading?: boolean;
  onEvents?: Record<string, (params: unknown) => void>;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  theme?: string | object;
  opts?: {
    renderer?: "canvas" | "svg";
    devicePixelRatio?: number;
    width?: number | "auto" | null;
    height?: number | "auto" | null;
    locale?: string;
  };
  // Animation control
  enableAnimation?: boolean;
  animationDuration?: number;
  // Accessibility
  ariaLabel?: string;
  // Custom class
  className?: string;
  style?: React.CSSProperties;
}

export interface EChartsWrapperRef {
  getEchartsInstance: () => ECharts | undefined;
  resize: () => void;
}

/**
 * ECharts wrapper component with Swiss Federal theming
 */
export const EChartsWrapper = forwardRef<EChartsWrapperRef, EChartsWrapperProps>(
  (
    {
      option,
      width = "100%",
      height = "100%",
      loading = false,
      showLoading = false,
      onEvents,
      notMerge = false,
      lazyUpdate = false,
      theme,
      opts = { renderer: "svg" },
      enableAnimation = true,
      animationDuration = SWISS_FEDERAL_ANIMATION.duration,
      ariaLabel,
      className,
      style,
    },
    ref
  ) => {
    const chartRef = useRef<ReactECharts>(null);

    // Apply theme and animation settings
    const themedOption = useCallback((): EChartsOption => {
      const baseOption = mergeWithTheme(option);

      return {
        ...baseOption,
        animation: enableAnimation,
        animationDuration: animationDuration,
        aria: ariaLabel
          ? {
              enabled: true,
              label: {
                description: ariaLabel,
              },
            }
          : undefined,
      };
    }, [option, enableAnimation, animationDuration, ariaLabel]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => chartRef.current?.getEchartsInstance(),
      resize: () => chartRef.current?.getEchartsInstance()?.resize(),
    }));

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        chartRef.current?.getEchartsInstance()?.resize();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <ReactECharts
        ref={chartRef}
        option={themedOption()}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        className={className}
        showLoading={loading || showLoading}
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
        theme={theme}
        opts={opts}
        onEvents={onEvents}
      />
    );
  }
);

EChartsWrapper.displayName = "EChartsWrapper";
