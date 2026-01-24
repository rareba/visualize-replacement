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

// Import echarts-gl only on client side (uses WebGL which requires browser)
if (typeof window !== "undefined") {
  import("echarts-gl");
}

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
  // Force 3D/Canvas renderer (for 3D chart types)
  use3DRenderer?: boolean;
}

export interface EChartsWrapperRef {
  getEchartsInstance: () => ECharts | undefined;
  resize: () => void;
}

// 3D series types that require Canvas renderer (echarts-gl)
const GL_SERIES_TYPES = [
  "bar3D", "scatter3D", "line3D", "surface", "map3D", "globe",
  "lines3D", "polygons3D", "scatterGL", "linesGL", "flowGL"
];

/**
 * Check if the ECharts option contains any 3D/GL series that require Canvas renderer
 */
const requires3DRenderer = (option: EChartsOption): boolean => {
  if (!option || !option.series) return false;
  const series = Array.isArray(option.series) ? option.series : [option.series];
  return series.some((s: { type?: string }) => s?.type && GL_SERIES_TYPES.includes(s.type));
};

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
      use3DRenderer = false,
    },
    ref
  ) => {
    // Force Canvas renderer for 3D charts (echarts-gl requires Canvas, not SVG)
    // use3DRenderer prop takes precedence, then we check option series as fallback
    const is3DChart = use3DRenderer || requires3DRenderer(option);
    const effectiveOpts = is3DChart
      ? { ...opts, renderer: "canvas" as const }
      : opts;
    // Key changes when renderer type changes, forcing re-mount with new renderer
    const rendererKey = is3DChart ? "canvas-3d" : "svg-2d";
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
        key={rendererKey}
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
        opts={effectiveOpts}
        onEvents={onEvents}
      />
    );
  }
);

EChartsWrapper.displayName = "EChartsWrapper";
