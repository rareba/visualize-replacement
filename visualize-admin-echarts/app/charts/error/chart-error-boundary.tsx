/**
 * Chart Error Boundary
 *
 * Catches rendering errors in chart components and displays a fallback UI
 * instead of crashing the entire application.
 */

import { Component, ReactNode } from "react";

import { SWISS_FEDERAL_COLORS, SWISS_FEDERAL_FONT } from "@/charts/echarts/theme";

// ============================================================================
// Types
// ============================================================================

interface ChartErrorBoundaryProps {
  children: ReactNode;
  /** Chart type for error reporting */
  chartType?: string;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Width for fallback UI */
  width?: number | string;
  /** Height for fallback UI */
  height?: number | string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// Default Fallback Component
// ============================================================================

interface ChartErrorFallbackProps {
  error: Error | null;
  chartType?: string;
  width?: number | string;
  height?: number | string;
  onRetry?: () => void;
}

/**
 * Default fallback UI shown when chart rendering fails
 */
export const ChartErrorFallback = ({
  error,
  chartType,
  width = "100%",
  height = 300,
  onRetry,
}: ChartErrorFallbackProps) => {
  return (
    <div
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafafa",
        border: `1px solid ${SWISS_FEDERAL_COLORS.grid}`,
        borderRadius: "4px",
        padding: "20px",
        fontFamily: SWISS_FEDERAL_FONT.family,
        color: SWISS_FEDERAL_COLORS.text,
      }}
    >
      <div
        style={{
          fontSize: "40px",
          marginBottom: "12px",
          color: SWISS_FEDERAL_COLORS.muted,
        }}
      >
        ⚠
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        Chart could not be displayed
      </div>
      {chartType && (
        <div
          style={{
            fontSize: "12px",
            color: SWISS_FEDERAL_COLORS.muted,
            marginBottom: "8px",
          }}
        >
          Chart type: {chartType}
        </div>
      )}
      {error && (
        <div
          style={{
            fontSize: "12px",
            color: "#d32f2f",
            maxWidth: "300px",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          {error.message}
        </div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: SWISS_FEDERAL_COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: SWISS_FEDERAL_FONT.family,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * Error boundary specifically for chart components.
 * Catches JavaScript errors in chart rendering and displays fallback UI.
 */
export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    console.error("[ChartErrorBoundary] Chart rendering failed:", error);
    console.error("[ChartErrorBoundary] Component stack:", errorInfo.componentStack);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, chartType, width, height } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Otherwise use default fallback
      return (
        <ChartErrorFallback
          error={error}
          chartType={chartType}
          width={width}
          height={height}
          onRetry={this.handleRetry}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * HOC to wrap a chart component with error boundary
 */
export function withChartErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  chartType?: string
): React.FC<P & { onChartError?: (error: Error, errorInfo: React.ErrorInfo) => void }> {
  const WithErrorBoundary: React.FC<
    P & { onChartError?: (error: Error, errorInfo: React.ErrorInfo) => void }
  > = ({ onChartError, ...props }) => {
    return (
      <ChartErrorBoundary chartType={chartType} onError={onChartError}>
        <WrappedComponent {...(props as P)} />
      </ChartErrorBoundary>
    );
  };

  WithErrorBoundary.displayName = `withChartErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundary;
}

// ============================================================================
// Safe Render Utilities
// ============================================================================

/**
 * Safely renders a chart, catching errors and returning fallback
 */
export function safeRenderChart(
  renderFn: () => ReactNode,
  fallback: ReactNode = null
): ReactNode {
  try {
    return renderFn();
  } catch (error) {
    console.error("[safeRenderChart] Chart rendering failed:", error);
    return fallback;
  }
}

/**
 * Validates chart data before rendering
 */
export function validateChartData<T>(
  data: T[] | undefined | null,
  minLength = 0
): { valid: boolean; error?: string } {
  if (data === undefined || data === null) {
    return { valid: false, error: "No data provided" };
  }
  if (!Array.isArray(data)) {
    return { valid: false, error: "Data must be an array" };
  }
  if (data.length < minLength) {
    return { valid: false, error: `Data must have at least ${minLength} items` };
  }
  return { valid: true };
}
