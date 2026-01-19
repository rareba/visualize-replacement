import { c as colors, s as spacing } from "@interactivethings/swiss-federal-ci";
import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "text" | "danger";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.red[600],
    color: "#fff",
    border: "none",
  },
  secondary: {
    backgroundColor: colors.cobalt[100],
    color: colors.cobalt[800],
    border: "none",
  },
  outline: {
    backgroundColor: "transparent",
    color: colors.monochrome[700],
    border: `1px solid ${colors.monochrome[300]}`,
  },
  text: {
    backgroundColor: "transparent",
    color: colors.cobalt[600],
    border: "none",
  },
  danger: {
    backgroundColor: colors.red[600],
    color: "#fff",
    border: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  small: {
    padding: `${spacing(1)} ${spacing(2)}`,
    fontSize: 12,
    minHeight: 28,
  },
  medium: {
    padding: `${spacing(2)} ${spacing(3)}`,
    fontSize: 14,
    minHeight: 36,
  },
  large: {
    padding: `${spacing(3)} ${spacing(4)}`,
    fontSize: 16,
    minHeight: 44,
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      startIcon,
      endIcon,
      fullWidth,
      loading,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing(1),
      fontFamily: "'Frutiger Neue', Arial, sans-serif",
      fontWeight: 500,
      borderRadius: 4,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.6 : 1,
      transition: "all 0.2s ease",
      width: fullWidth ? "100%" : "auto",
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={baseStyle}
        {...props}
      >
        {loading && <Spinner size={14} />}
        {!loading && startIcon}
        {children}
        {!loading && endIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

// Inline mini spinner for button loading state
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        animation: "spin 1s linear infinite",
      }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Button;
