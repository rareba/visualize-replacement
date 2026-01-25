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
import React, { useMemo, useState } from "react";

import { ChartConfig } from "@/config-types";
import { Icon } from "@/icons";

export interface FormattingPanelProps {
  chartConfig: ChartConfig;
  onConfigChange?: (config: Partial<ChartConfig>) => void;
}

// Formatting sections definition - consolidated for simplicity
interface FormattingSection {
  id: string;
  icon: string;
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
  onConfigChange,
}: FormattingPanelProps) => {
  const [expandedSection, setExpandedSection] = useState<string | false>("appearance");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        />
      ))}

      {/* Advanced sections toggle */}
      {advancedSections.length > 0 && (
        <>
          <Button
            size="small"
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
              />
            ))}
          </Collapse>
        </>
      )}
    </Box>
  );
};

/**
 * Individual formatting accordion section
 */
const FormattingAccordion = ({
  section,
  expanded,
  onChange,
  chartConfig,
}: {
  section: FormattingSection;
  expanded: boolean;
  onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
  chartConfig: ChartConfig;
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
}: {
  sectionId: string;
  chartConfig: ChartConfig;
}) => {
  switch (sectionId) {
    case "appearance":
      return <AppearanceSection chartConfig={chartConfig} />;
    case "labelsText":
      return <LabelsTextSection chartConfig={chartConfig} />;
    case "axes":
      return <AxesSection chartConfig={chartConfig} />;
    case "behavior":
      return <BehaviorSection chartConfig={chartConfig} />;
    default:
      return (
        <Typography variant="caption" color="text.secondary">
          Configure {sectionId} options here
        </Typography>
      );
  }
};

// Consolidated section components

/**
 * Appearance Section - Colors and general styling
 */
const AppearanceSection = ({ chartConfig }: { chartConfig: ChartConfig }) => (
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
      control={<Switch size="small" />}
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
const LabelsTextSection = ({ chartConfig }: { chartConfig: ChartConfig }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {/* Title options */}
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-title">Show title</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />

    {/* Legend options */}
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-legend">Show legend</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />

    {/* Data labels */}
    <FormControlLabel
      control={<Switch size="small" />}
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
const AxesSection = ({ chartConfig }: { chartConfig: ChartConfig }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
      X-Axis
    </Typography>
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-xaxis">Show X-axis</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
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
      control={<Switch size="small" defaultChecked />}
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-yaxis">Show Y-axis</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
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
const BehaviorSection = ({ chartConfig }: { chartConfig: ChartConfig }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.show-tooltip">Show tooltip on hover</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={<Switch size="small" defaultChecked />}
      label={
        <Typography variant="caption">
          <Trans id="powerbi.formatting.enable-animation">Enable animations</Trans>
        </Typography>
      }
      sx={{ ml: 0 }}
    />
    <FormControlLabel
      control={<Switch size="small" />}
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
