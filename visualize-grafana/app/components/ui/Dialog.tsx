import { c as colors, s as spacing, e as elevations } from "@interactivethings/swiss-federal-ci";
import { forwardRef, useEffect, useRef, ReactNode, HTMLAttributes } from "react";

interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, "title"> {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  fullScreen?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKey?: boolean;
}

const maxWidthValues: Record<string, string> = {
  xs: "400px",
  sm: "500px",
  md: "600px",
  lg: "800px",
  xl: "1000px",
  full: "100%",
};

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  (
    {
      open,
      onClose,
      title,
      actions,
      maxWidth = "sm",
      fullScreen,
      disableBackdropClick,
      disableEscapeKey,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDialogElement>) || dialogRef;

    useEffect(() => {
      const dialog = resolvedRef.current;
      if (!dialog) return;

      if (open) {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.close();
      }
    }, [open, resolvedRef]);

    useEffect(() => {
      const dialog = resolvedRef.current;
      if (!dialog) return;

      const handleCancel = (e: Event) => {
        if (disableEscapeKey) {
          e.preventDefault();
        } else {
          onClose();
        }
      };

      const handleClick = (e: MouseEvent) => {
        if (disableBackdropClick) return;
        const rect = dialog.getBoundingClientRect();
        const isInDialog =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInDialog) {
          onClose();
        }
      };

      dialog.addEventListener("cancel", handleCancel);
      dialog.addEventListener("click", handleClick);

      return () => {
        dialog.removeEventListener("cancel", handleCancel);
        dialog.removeEventListener("click", handleClick);
      };
    }, [onClose, disableBackdropClick, disableEscapeKey, resolvedRef]);

    const dialogStyle: React.CSSProperties = {
      position: "fixed",
      padding: 0,
      border: "none",
      borderRadius: fullScreen ? 0 : 12,
      boxShadow: elevations[4],
      backgroundColor: "#fff",
      maxWidth: fullScreen ? "100vw" : maxWidthValues[maxWidth],
      width: fullScreen ? "100vw" : "calc(100% - 32px)",
      maxHeight: fullScreen ? "100vh" : "calc(100vh - 64px)",
      height: fullScreen ? "100vh" : "auto",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Frutiger Neue', Arial, sans-serif",
      ...style,
    };

    const backdropStyle = `
      dialog::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
      }
    `;

    const headerStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `${spacing(3)} ${spacing(4)}`,
      borderBottom: `1px solid ${colors.monochrome[100]}`,
      flexShrink: 0,
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      fontSize: 18,
      fontWeight: 600,
      color: colors.monochrome[900],
    };

    const closeButtonStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 6,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.monochrome[500],
      transition: "background-color 0.15s ease",
    };

    const contentStyle: React.CSSProperties = {
      flex: 1,
      overflow: "auto",
      padding: spacing(4),
    };

    const actionsStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing(2),
      padding: `${spacing(3)} ${spacing(4)}`,
      borderTop: `1px solid ${colors.monochrome[100]}`,
      backgroundColor: colors.monochrome[50],
      flexShrink: 0,
    };

    return (
      <>
        <style>{backdropStyle}</style>
        <dialog ref={resolvedRef} style={dialogStyle} {...props}>
          {title && (
            <div style={headerStyle}>
              <h2 style={titleStyle}>{title}</h2>
              <button
                type="button"
                onClick={onClose}
                style={closeButtonStyle}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          )}
          <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
          {actions && <div style={actionsStyle}>{actions}</div>}
        </dialog>
      </>
    );
  }
);

Dialog.displayName = "Dialog";

export default Dialog;
