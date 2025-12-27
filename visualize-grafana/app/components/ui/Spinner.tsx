import { c as colors } from "@interactivethings/swiss-federal-ci";
import { forwardRef, HTMLAttributes } from "react";

type SpinnerSize = "small" | "medium" | "large";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize | number;
  color?: string;
  thickness?: number;
}

const sizeValues: Record<SpinnerSize, number> = {
  small: 20,
  medium: 32,
  large: 48,
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "medium", color = colors.red[600], thickness = 3, style, ...props }, ref) => {
    const pixelSize = typeof size === "number" ? size : sizeValues[size];

    const containerStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    };

    const spinnerStyle: React.CSSProperties = {
      width: pixelSize,
      height: pixelSize,
      animation: "fedSpinnerRotate 0.8s linear infinite",
    };

    const keyframes = `
      @keyframes fedSpinnerRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    return (
      <div ref={ref} style={containerStyle} role="progressbar" {...props}>
        <style>{keyframes}</style>
        <svg style={spinnerStyle} viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={colors.monochrome[200]}
            strokeWidth={thickness}
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray="31.4 94.2"
          />
        </svg>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

// Linear progress bar variant
interface LinearProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100 for determinate, undefined for indeterminate
  color?: string;
  height?: number;
}

export const LinearProgress = forwardRef<HTMLDivElement, LinearProgressProps>(
  ({ value, color = colors.red[600], height = 4, style, ...props }, ref) => {
    const isIndeterminate = value === undefined;

    const containerStyle: React.CSSProperties = {
      width: "100%",
      height,
      backgroundColor: colors.monochrome[100],
      borderRadius: height / 2,
      overflow: "hidden",
      ...style,
    };

    const barStyle: React.CSSProperties = {
      height: "100%",
      backgroundColor: color,
      borderRadius: height / 2,
      transition: isIndeterminate ? "none" : "width 0.3s ease",
      width: isIndeterminate ? "30%" : `${value}%`,
      ...(isIndeterminate && {
        animation: "fedLinearProgress 1.5s ease-in-out infinite",
      }),
    };

    const keyframes = `
      @keyframes fedLinearProgress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(200%); }
        100% { transform: translateX(-100%); }
      }
    `;

    return (
      <div ref={ref} style={containerStyle} role="progressbar" {...props}>
        {isIndeterminate && <style>{keyframes}</style>}
        <div style={barStyle} />
      </div>
    );
  }
);

LinearProgress.displayName = "LinearProgress";

export default Spinner;
