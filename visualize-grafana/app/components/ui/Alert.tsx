import { c as colors, s as spacing } from "@interactivethings/swiss-federal-ci";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

type AlertSeverity = "error" | "warning" | "info" | "success";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  severity?: AlertSeverity;
  title?: string;
  onClose?: () => void;
  icon?: ReactNode;
  action?: ReactNode;
}

const severityStyles: Record<AlertSeverity, { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg: colors.red[50],
    border: colors.red[200],
    text: colors.red[800],
    icon: colors.red[600],
  },
  warning: {
    bg: "#FFF7ED",
    border: "#FED7AA",
    text: "#9A3412",
    icon: "#EA580C",
  },
  info: {
    bg: colors.cobalt[50],
    border: colors.cobalt[200],
    text: colors.cobalt[800],
    icon: colors.cobalt[600],
  },
  success: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#065F46",
    icon: "#059669",
  },
};

const defaultIcons: Record<AlertSeverity, ReactNode> = {
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      severity = "info",
      title,
      onClose,
      icon,
      action,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const styles = severityStyles[severity];

    const baseStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "flex-start",
      gap: spacing(2),
      padding: spacing(3),
      borderRadius: 6,
      backgroundColor: styles.bg,
      border: `1px solid ${styles.border}`,
      color: styles.text,
      fontFamily: "'Frutiger Neue', Arial, sans-serif",
      fontSize: 14,
      ...style,
    };

    const iconStyle: React.CSSProperties = {
      flexShrink: 0,
      color: styles.icon,
      marginTop: 1,
    };

    const contentStyle: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
    };

    const titleStyle: React.CSSProperties = {
      fontWeight: 600,
      marginBottom: children ? spacing(1) : 0,
    };

    const closeButtonStyle: React.CSSProperties = {
      flexShrink: 0,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 4,
      color: styles.text,
      opacity: 0.7,
      borderRadius: 4,
    };

    return (
      <div ref={ref} role="alert" style={baseStyle} {...props}>
        <span style={iconStyle}>{icon ?? defaultIcons[severity]}</span>
        <div style={contentStyle}>
          {title && <div style={titleStyle}>{title}</div>}
          {children}
        </div>
        {action}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;
