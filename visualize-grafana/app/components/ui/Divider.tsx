import { c as colors, s as spacing } from "@interactivethings/swiss-federal-ci";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "fullWidth" | "inset" | "middle";
  textAlign?: "left" | "center" | "right";
  children?: ReactNode;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      orientation = "horizontal",
      variant = "fullWidth",
      textAlign = "center",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isHorizontal = orientation === "horizontal";
    const hasChildren = Boolean(children);

    const marginValues: Record<string, { left: number; right: number }> = {
      fullWidth: { left: 0, right: 0 },
      inset: { left: spacing[4], right: 0 },
      middle: { left: spacing[3], right: spacing[3] },
    };

    if (hasChildren && isHorizontal) {
      // Divider with text
      const containerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        width: "100%",
        margin: `${spacing[2]}px 0`,
        ...style,
      };

      const lineStyle: React.CSSProperties = {
        flex: 1,
        height: 1,
        backgroundColor: colors.monochrome[200],
      };

      const textStyle: React.CSSProperties = {
        padding: `0 ${spacing[2]}px`,
        color: colors.monochrome[500],
        fontSize: 12,
        fontFamily: "'Frutiger Neue', Arial, sans-serif",
        whiteSpace: "nowrap",
      };

      const leftFlex = textAlign === "left" ? 0.1 : textAlign === "right" ? 1 : 1;
      const rightFlex = textAlign === "left" ? 1 : textAlign === "right" ? 0.1 : 1;

      return (
        <div style={containerStyle}>
          <span style={{ ...lineStyle, flex: leftFlex }} />
          <span style={textStyle}>{children}</span>
          <span style={{ ...lineStyle, flex: rightFlex }} />
        </div>
      );
    }

    const baseStyle: React.CSSProperties = isHorizontal
      ? {
          width: "100%",
          height: 1,
          margin: `${spacing[2]}px 0`,
          marginLeft: marginValues[variant].left,
          marginRight: marginValues[variant].right,
          border: "none",
          backgroundColor: colors.monochrome[200],
        }
      : {
          width: 1,
          height: "auto",
          alignSelf: "stretch",
          margin: `0 ${spacing[2]}px`,
          border: "none",
          backgroundColor: colors.monochrome[200],
        };

    return <hr ref={ref} style={{ ...baseStyle, ...style }} {...props} />;
  }
);

Divider.displayName = "Divider";

export default Divider;
