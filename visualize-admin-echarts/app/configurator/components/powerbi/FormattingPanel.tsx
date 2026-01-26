/**
 * PowerBI-Style Formatting Panel
 *
 * A formatting panel with collapsible sections for chart customization.
 * Provides visual toggles, color pickers, and other formatting options.
 */

import { Trans } from "@lingui/macro";
import {
  alpha,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Collapse,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import React, { useCallback, useMemo } from "react";

import { ChartConfig, FormattingConfig } from "@/config-types";
import { Icon, IconName } from "@/icons";

export interface FormattingPanelProps {
  chartConfig: ChartConfig;
  onFormattingChange?: (formatting: FormattingConfig) => void;
}

// Default formatting values
const DEFAULT_FORMATTING: Required<FormattingConfig> = {
  showXAxis: true,
  showXAxisLabels: true,
  showYAxis: true,
  showGridlines: true,
  showLegend: true,
  showTitle: true,
  showDataValues: false,
  showTooltip: true,
  enableAnimation: true,
  enableZoom: false,
  transparentBg: false,
};

// Formatting sections definition - consolidated for simplicity
interface FormattingSection {
  id: string;
  icon: IconName;
  label: string;
  chartTypes?: string[]; // If specified, only show for these chart types
  isAdvanced?: boolean; // Advanced sections hidden by default
}

// Simplified section structure - fewer, more logical groupings
const FORMATTING_SECTIONS: FormattingSection[] = [
  // Essential sections (always visible)
  { id: "appearance", icon: "swatch", label: "Appearance" }, // Colors + general styling
  { id: "labelsText", icon: "text", label: "Labels & Text" }, // Title, legend, data labels combined
  { id: "axes", icon: "chartColumn", label: "Axes", chartTypes: ["column", "bar", "line", "area", "scatterplot", "boxplot", "heatmap", "comboLineSingle", "comboLineDual", "comboLineColumn"] },
  // Advanced sections (hidden by default)
  { id: "behavior", icon: "settings", label: "Behavior", isAdvanced: true }, // Tooltip, animation, interactions
];

export const FormattingPanel = ({
  chartConfig,
  onFormattingChange,
}: FormattingPanelProps) => {
  const [expandedSection, setExpandedSection] = React.useState<string | false>("appearance");
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Get current formatting from chartConfig or use defaults
  const formattingState: Required<FormattingConfig> = useMemo(() => ({
    ...DEFAULT_FORMATTING,
    ...(chartConfig.formatting || {}),
  }), [chartConfig.formatting]);

  const handleFormattingChange = useCallback((key: keyof FormattingConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.checked;
    const newFormatting: FormattingConfig = {
      ...formattingState,
      [key]: newValue,
    };
    onFormattingChange?.(newFormatting);
  }, [formattingState, onFormattingChange]);

  // Filter sections based on chart type and advanced toggle
  const { essentialSections, advancedSections } = useMemo(() => {
    const visible = FORMATTING_SECTIONS.filter(
      (section) =>
        !section.chartTypes || section.chartTypes.includes(chartConfig.chartType)
    );
    return {
      essentialSections: visible.filter((s) => !s.isAdvanced),
      advancedSections: visible.filter((s) => s.isAdvanced),
    };
  }, [chartConfig.chartType]);

  const handleSectionChange = (sectionId: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedSection(isExpanded ? sectionId : false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography
        variant="overline"
        sx={{
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "text.secondary",
          px: 2,
          py: 1.5,
        }}
      >
        <Trans id="powerbi.formatting.title">Format visual</Trans>
      </Typography>

      <Divider />

      {/* Essential formatting sections */}
      {essentialSections.map((section) => (
        <FormattingAccordion
          key={section.id}
          section={section}
          expanded={expandedSection === section.id}
          onChange={handleSectionChange(section.id)}
          chartConfig={chartConfig}
          formattingState={formattingState}
          onFormattingChange={handleFormattingChange}
        />
      ))}

      {/* Advanced sections toggle */}
      {advancedSections.length > 0 && (
        <>
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={
              <Icon
                name={showAdvanced ? "chevronUp" : "chevronDown"}
                size={14}
              />
            }
            sx={{
              alignSelf: "flex-start",
              fontSize: "0.7rem",
              textTransform: "none",
              color: "text.secondary",
              px: 2,
              py: 1,
              "&:hover": {
                backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.04),
              },
            }}
          >
            {showAdvanced ? (
              <Trans id="powerbi.formatting.hideAdvanced">Hide advanced</Trans>
            ) : (
              <Trans id="powerbi.formatting.showAdvanced">
                Show advanced ({advancedSections.length})
              </Trans>
            )}
          </Button>

          <Collapse in={showAdvanced}>
            {advancedSections.map((section) => (
              <FormattingAccordion
                key={section.id}
                section={section}
                expanded={expandedSection === section.id}
                onChange={handleSectionChange(section.id)}
                chartConfig={chartConfig}
                formattingState={formattingState}
                onFormattingChange={handleFormattingChange}
              />
            ))}
          </Collapse>
        </>
      )}
    </Box>
  );
};

// Type alias for formatting state (uses FormattingConfig from config-types)
type FormattingState = Required<FormattingConfig>;

/**
 * Individual formatting accordion section
 */
const FormattingAccordion = ({
  section,
  expanded,
  onChange,
  chartConfig,
  formattingState,
  onFormattingChange,
}: {
  section: FormattingSection;
  expanded: boolean;
  onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
  chartConfig: ChartConfig;
  formattingState: FormattingState;
  onFormattingChange: (key: keyof FormattingState) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={onChange}
      disableGutters
      elevation={0}
      sx={{
        "&:before": { display: "none" },
        backgroundColor: "transparent",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <AccordionSummary
        expandIcon={<Icon name="chevronDown" size={16} />}
        sx={{
          minHeight: 44,
          px: 2,
          "&.Mui-expanded": {
            minHeight: 44,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          },
          "& .MuiAccordionSummary-content": {
            my: 0,
            gap: 1.5,
            alignItems: "center",
          },
        }}
      >
        <Icon
          name={section.icon}
          size={16}
          color={
            expanded
              ? "var(--mui-palette-primary-main)"
              : "var(--mui-palette-text-secondary)"
          }
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: expanded ? 600 : 400,
            color: expanded ? "primary.main" : "text.primary",
          }}
        >
          {section.label}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, py: 1.5 }}>
        <FormattingSectionContent
          sectionId={section.id}
          chartConfig={chartConfig}
          formattingState={formattingState}
          onFormattingChange={onFormattingChange}
        />
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * Content for each formatting section
 */
const FormattingSectionContent = ({
  sectionId,
  chartConfig,
  formattingState,
  onFormattingChange,
}: {
  sectionId: string;
  chartConfig: ChartConfig;
  formattingState: FormattingState;
  onFormattingChange: (key: keyof FormattingState) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  switch (sectionId) {
    case "appearance":
      return <AppearanceSection chartConfig={chartConfig} formattingState={formattingState} onFormattingChange={onFormattingChange} />;
    case "labelsText":
      return <LabelsTextSection chartConfig={chartConfig} formattingState={formattingState} onFormattingChange={onFormattingChange} />;
    case "axes":
      return <AxesSection chartConfig={chartConfig} formattingState={formattingState} onFormattingChange={onFormattingChange} />;
    case "behavior":
      return <BehaviorSection chartConfig={chartConfig} formattingState={formattingState} onFormattingChange={onFormattingChange} />;
    default:
      return (
        <Typography variant="caption" color="text.secondary">
          Configure {sectionId} options here
        </Typography>
      );
  }
};

// Section props type
interface SectionProps {
  chartConfig: ChartConfig;
  formattingState: FormattingState;
  onFormattingChange: (key: keyof FormattingState) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Appearance Section - Colors and general styling
 */
const AppearanceSection = ({ formattingState, onFormattingChange }: SectionProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
      <Trans id="powerbi.formatting.color-palette">Color palette</Trans>
    </Typography>
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {/* Placeholder color swatches */}
      {["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"].map((color) => (
        <Box
          key={color}
          sx={{
            width: 24,
            height: 24,
            borderRadius: 0.5,
            backgroundColor: color,
            cursor: "pointer",
            border: 1,
            borderColor: "divider",
            "&:hover": {
              transform: "scale(1.1)",
            },
          }}
        />
      ))}
    </Box>
    <Divider sx={{ my: 0.5 }} />
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.transparentBg}
          onChange={onFormattingChange("transparentBg")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.transparent-bg">Transparent background</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
  </Box>
);

/**
 * Labels & Text Section - Title, legend, data labels combined
 */
const LabelsTextSection = ({ formattingState, onFormattingChange }: SectionProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {/* Title options */}
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showTitle}
          onChange={onFormattingChange("showTitle")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-title">Show title</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />

    {/* Legend options */}
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showLegend}
          onChange={onFormattingChange("showLegend")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-legend">Show legend</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />

    {/* Data labels */}
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showDataValues}
          onChange={onFormattingChange("showDataValues")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-values">Show data values</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
  </Box>
);

/**
 * Axes Section - X and Y axis configuration
 */
const AxesSection = ({ formattingState, onFormattingChange }: SectionProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
      X-Axis
    </Typography>
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showXAxis}
          onChange={onFormattingChange("showXAxis")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-xaxis">Show X-axis</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showXAxisLabels}
          onChange={onFormattingChange("showXAxisLabels")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-xaxis-labels">Show labels</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />

    <Divider sx={{ my: 0.5 }} />

    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
      Y-Axis
    </Typography>
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showYAxis}
          onChange={onFormattingChange("showYAxis")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-yaxis">Show Y-axis</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showGridlines}
          onChange={onFormattingChange("showGridlines")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-gridlines">Show gridlines</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
  </Box>
);

/**
 * Behavior Section - Tooltip, animation, interactions (advanced)
 */
const BehaviorSection = ({ formattingState, onFormattingChange }: SectionProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.showTooltip}
          onChange={onFormattingChange("showTooltip")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-tooltip">Show tooltip on hover</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.enableAnimation}
          onChange={onFormattingChange("enableAnimation")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.enable-animation">Enable animations</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={formattingState.enableZoom}
          onChange={onFormattingChange("enableZoom")}
        />
      }
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.enable-zoom">Enable zoom/pan</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
  </Box>
);

export default FormattingPanel;
