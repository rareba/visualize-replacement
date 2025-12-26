/**
 * Render Engine Context
 *
 * Provides a way to switch between D3 and ECharts rendering engines.
 * This allows for gradual migration and A/B testing of the new renderer.
 *
 * Usage:
 * 1. Wrap your app with <RenderEngineProvider engine="echarts">
 * 2. Use useRenderEngine() hook to get current engine
 * 3. Conditionally render D3 or ECharts components based on engine
 *
 * Environment variable: NEXT_PUBLIC_RENDER_ENGINE=echarts|d3
 */

import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
} from "react";

export type RenderEngine = "d3" | "echarts";

interface RenderEngineContextValue {
  engine: RenderEngine;
  isECharts: boolean;
  isD3: boolean;
}

const RenderEngineContext = createContext<RenderEngineContextValue>({
  engine: "d3",
  isECharts: false,
  isD3: true,
});

/**
 * Get the render engine from environment or props
 */
function getDefaultEngine(): RenderEngine {
  if (typeof window !== "undefined") {
    // Check URL parameter for testing
    const urlParams = new URLSearchParams(window.location.search);
    const engineParam = urlParams.get("renderEngine");
    if (engineParam === "echarts" || engineParam === "d3") {
      return engineParam;
    }
  }

  // Check environment variable
  const envEngine = process.env.NEXT_PUBLIC_RENDER_ENGINE;
  if (envEngine === "echarts" || envEngine === "d3") {
    return envEngine;
  }

  // Default to echarts - D3 has been replaced
  return "echarts";
}

interface RenderEngineProviderProps {
  engine?: RenderEngine;
}

export const RenderEngineProvider: React.FC<
  PropsWithChildren<RenderEngineProviderProps>
> = ({ children, engine: engineProp }) => {
  const value = useMemo<RenderEngineContextValue>(() => {
    const engine = engineProp ?? getDefaultEngine();
    return {
      engine,
      isECharts: engine === "echarts",
      isD3: engine === "d3",
    };
  }, [engineProp]);

  return (
    <RenderEngineContext.Provider value={value}>
      {children}
    </RenderEngineContext.Provider>
  );
};

/**
 * Hook to get the current render engine
 */
export function useRenderEngine(): RenderEngineContextValue {
  return useContext(RenderEngineContext);
}

/**
 * Higher-order component that switches between D3 and ECharts components
 */
export function withRenderEngine<P extends object>(
  D3Component: React.ComponentType<P>,
  EChartsComponent: React.ComponentType<P>
): React.FC<P> {
  return function RenderEngineSwitch(props: P) {
    const { isECharts } = useRenderEngine();
    const Component = isECharts ? EChartsComponent : D3Component;
    return <Component {...props} />;
  };
}

/**
 * Component that renders children based on render engine
 */
export const RenderIf: React.FC<
  PropsWithChildren<{ engine: RenderEngine }>
> = ({ engine, children }) => {
  const current = useRenderEngine();
  if (current.engine !== engine) {
    return null;
  }
  return <>{children}</>;
};

export default RenderEngineContext;
