import { c as colors, s as spacing } from "@interactivethings/swiss-federal-ci";
import { forwardRef, HTMLAttributes, ReactNode, createContext, useContext } from "react";

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  variant: "standard" | "contained" | "pills";
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  variant?: "standard" | "contained" | "pills";
  fullWidth?: boolean;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onChange, variant = "standard", fullWidth, children, style, ...props }, ref) => {
    const containerStyle: React.CSSProperties = {
      display: "flex",
      gap: variant === "pills" ? spacing[1] : 0,
      borderBottom: variant === "standard" ? `1px solid ${colors.monochrome[200]}` : "none",
      backgroundColor: variant === "contained" ? colors.monochrome[100] : "transparent",
      borderRadius: variant === "contained" ? 8 : 0,
      padding: variant === "contained" ? 4 : 0,
      width: fullWidth ? "100%" : "auto",
      ...style,
    };

    return (
      <TabsContext.Provider value={{ value, onChange, variant }}>
        <div ref={ref} role="tablist" style={containerStyle} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ value, label, icon, disabled, style, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) {
      throw new Error("Tab must be used within Tabs");
    }

    const { value: selectedValue, onChange, variant } = context;
    const isSelected = selectedValue === value;

    const getVariantStyles = (): React.CSSProperties => {
      if (variant === "standard") {
        return {
          borderBottom: isSelected ? `2px solid ${colors.red[600]}` : "2px solid transparent",
          marginBottom: -1,
          borderRadius: 0,
          backgroundColor: "transparent",
          color: isSelected ? colors.red[700] : colors.monochrome[600],
        };
      }
      if (variant === "contained") {
        return {
          borderRadius: 6,
          backgroundColor: isSelected ? "#fff" : "transparent",
          color: isSelected ? colors.monochrome[900] : colors.monochrome[600],
          boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        };
      }
      // pills
      return {
        borderRadius: 20,
        backgroundColor: isSelected ? colors.red[600] : colors.monochrome[100],
        color: isSelected ? "#fff" : colors.monochrome[700],
      };
    };

    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[1],
      padding: `${spacing[2]}px ${spacing[3]}px`,
      fontFamily: "'Frutiger Neue', Arial, sans-serif",
      fontSize: 14,
      fontWeight: isSelected ? 600 : 400,
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s ease",
      whiteSpace: "nowrap",
      flex: "none",
      ...getVariantStyles(),
      ...style,
    };

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isSelected}
        disabled={disabled}
        onClick={() => !disabled && onChange(value)}
        style={baseStyle}
        {...props}
      >
        {icon}
        {label}
      </button>
    );
  }
);

Tab.displayName = "Tab";

interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  index: string;
  keepMounted?: boolean;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, index, keepMounted, children, style, ...props }, ref) => {
    const isActive = value === index;

    if (!isActive && !keepMounted) {
      return null;
    }

    const panelStyle: React.CSSProperties = {
      display: isActive ? "block" : "none",
      ...style,
    };

    return (
      <div
        ref={ref}
        role="tabpanel"
        hidden={!isActive}
        style={panelStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabPanel.displayName = "TabPanel";

export default Tabs;
