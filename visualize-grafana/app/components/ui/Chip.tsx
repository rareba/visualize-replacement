import { c as colors, s as spacing } from "@interactivethings/swiss-federal-ci";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

type ChipVariant = "filled" | "outlined";
type ChipColor = "default" | "primary" | "secondary" | "success" | "error" | "warning";
type ChipSize = "small" | "medium";

interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  label: string;
  variant?: ChipVariant;
  color?: ChipColor;
  size?: ChipSize;
  icon?: ReactNode;
  onDelete?: () => void;
  clickable?: boolean;
}

const colorStyles: Record<ChipColor, { filled: { bg: string; text: string }; outlined: { border: string; text: string } }> = {
  default: {
    filled: { bg: colors.monochrome[100], text: colors.monochrome[800] },
    outlined: { border: colors.monochrome[300], text: colors.monochrome[700] },
  },
  primary: {
    filled: { bg: colors.red[100], text: colors.red[800] },
    outlined: { border: colors.red[400], text: colors.red[700] },
  },
  secondary: {
    filled: { bg: colors.cobalt[100], text: colors.cobalt[800] },
    outlined: { border: colors.cobalt[400], text: colors.cobalt[700] },
  },
  success: {
    filled: { bg: "#D1FAE5", text: "#065F46" },
    outlined: { border: "#34D399", text: "#047857" },
  },
  error: {
    filled: { bg: colors.red[50], text: colors.red[800] },
    outlined: { border: colors.red[400], text: colors.red[700] },
  },
  warning: {
    filled: { bg: "#FEF3C7", text: "#92400E" },
    outlined: { border: "#FBBF24", text: "#B45309" },
  },
};

const sizeStyles: Record<ChipSize, { height: number; fontSize: number; padding: string }> = {
  small: { height: 24, fontSize: 11, padding: `0 ${spacing(2)}` },
  medium: { height: 32, fontSize: 13, padding: `0 ${spacing(3)}` },
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      label,
      variant = "filled",
      color = "default",
      size = "medium",
      icon,
      onDelete,
      clickable,
      style,
      onClick,
      ...props
    },
    ref
  ) => {
    const colorStyle = colorStyles[color][variant];
    const sizeStyle = sizeStyles[size];

    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: spacing(1),
      height: sizeStyle.height,
      padding: sizeStyle.padding,
      borderRadius: sizeStyle.height / 2,
      fontFamily: "'Frutiger Neue', Arial, sans-serif",
      fontSize: sizeStyle.fontSize,
      fontWeight: 500,
      whiteSpace: "nowrap",
      cursor: clickable || onClick ? "pointer" : "default",
      transition: "all 0.15s ease",
      backgroundColor: variant === "filled" ? (colorStyle as { bg: string }).bg : "transparent",
      color: colorStyle.text,
      border: variant === "outlined" ? `1px solid ${(colorStyle as { border: string }).border}` : "none",
      ...style,
    };

    const deleteButtonStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: sizeStyle.height - 10,
      height: sizeStyle.height - 10,
      marginLeft: spacing(1),
      marginRight: `calc(-1 * ${spacing(1)})`,
      borderRadius: "50%",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "inherit",
      opacity: 0.7,
      padding: 0,
    };

    return (
      <span ref={ref} style={baseStyle} onClick={onClick} {...props}>
        {icon && <span style={{ display: "flex", marginLeft: `calc(-1 * ${spacing(1)})` }}>{icon}</span>}
        {label}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={deleteButtonStyle}
            aria-label="Remove"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L7 6.293l1.646-1.647a.5.5 0 01.708.708L7.707 7l1.647 1.646a.5.5 0 01-.708.708L7 7.707l-1.646 1.647a.5.5 0 01-.708-.708L6.293 7 4.646 5.354a.5.5 0 010-.708z" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = "Chip";

export default Chip;
