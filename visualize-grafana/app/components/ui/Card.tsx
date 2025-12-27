import { c as colors, s as spacing, e as elevations } from "@interactivethings/swiss-federal-ci";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "outlined" | "filled";
  padding?: "none" | "small" | "medium" | "large";
  header?: ReactNode;
  footer?: ReactNode;
}

const paddingValues: Record<string, number> = {
  none: 0,
  small: spacing[2],
  medium: spacing[3],
  large: spacing[4],
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "elevated",
      padding = "medium",
      header,
      footer,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<string, React.CSSProperties> = {
      elevated: {
        backgroundColor: "#fff",
        boxShadow: elevations.md,
        border: "none",
      },
      outlined: {
        backgroundColor: "#fff",
        boxShadow: "none",
        border: `1px solid ${colors.monochrome[200]}`,
      },
      filled: {
        backgroundColor: colors.monochrome[50],
        boxShadow: "none",
        border: "none",
      },
    };

    const baseStyle: React.CSSProperties = {
      borderRadius: 8,
      overflow: "hidden",
      ...variantStyles[variant],
      ...style,
    };

    const contentStyle: React.CSSProperties = {
      padding: paddingValues[padding],
    };

    const headerStyle: React.CSSProperties = {
      padding: `${spacing[2]}px ${paddingValues[padding]}px`,
      borderBottom: `1px solid ${colors.monochrome[100]}`,
      fontWeight: 600,
      color: colors.monochrome[800],
    };

    const footerStyle: React.CSSProperties = {
      padding: `${spacing[2]}px ${paddingValues[padding]}px`,
      borderTop: `1px solid ${colors.monochrome[100]}`,
      backgroundColor: colors.monochrome[50],
    };

    return (
      <div ref={ref} style={baseStyle} {...props}>
        {header && <div style={headerStyle}>{header}</div>}
        <div style={contentStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
