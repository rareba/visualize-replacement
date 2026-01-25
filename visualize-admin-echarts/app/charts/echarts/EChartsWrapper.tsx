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
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { mergeWithTheme, SWISS_FEDERAL_ANIMATION } from "./theme";

// WebGL module loading state (global to avoid reloading across component instances)
let webGLModuleLoaded = false;
let webGLModuleError: Error | null = null;
let webGLLoadPromise: Promise<void> | null = null;

/**
 * Load echarts-gl module (WebGL) on client side only.
 * Returns a promise that resolves when the module is ready.
 */
const loadWebGLModule = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (webGLModuleLoaded) {
    return Promise.resolve();
  }
  if (webGLModuleError) {
    return Promise.reject(webGLModuleError);
  }
  if (webGLLoadPromise) {
    return webGLLoadPromise;
  }
  webGLLoadPromise = import("echarts-gl")
    .then(() => {
      webGLModuleLoaded = true;
    })
    .catch((err) => {
      webGLModuleError = err;
      throw err;
    });
  return webGLLoadPromise;
};

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
      notMerge = true,
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

    // Track WebGL module loading state for 3D charts
    const [webGLReady, setWebGLReady] = useState(webGLModuleLoaded);
    const [webGLError, setWebGLError] = useState<Error | null>(webGLModuleError);

    // Load WebGL module when 3D chart is needed
    useEffect(() => {
      if (is3DChart && !webGLReady && !webGLError) {
        loadWebGLModule()
          .then(() => setWebGLReady(true))
          .catch((err) => setWebGLError(err));
      }
    }, [is3DChart, webGLReady, webGLError]);

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

    // Handle window resize with debouncing to prevent performance issues
    const handleResize = useDebouncedCallback(() => {
      chartRef.current?.getEchartsInstance()?.resize();
    }, 150);

    useEffect(() => {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        handleResize.cancel();
      };
    }, [handleResize]);

    // Show loading/error state for 3D charts while WebGL loads
    if (is3DChart && !webGLReady) {
      const containerStyle = {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        color: "#666",
        fontSize: "14px",
        ...style,
      };

      if (webGLError) {
        return (
          <div style={containerStyle} className={className}>
            <span>3D chart unavailable: WebGL failed to load</span>
          </div>
        );
      }

      return (
        <div style={containerStyle} className={className}>
          <span>Loading 3D chart...</span>
        </div>
      );
    }

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
