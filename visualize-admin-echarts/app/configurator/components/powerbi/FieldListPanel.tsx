/**
 * PowerBI-Style Field List Panel
 *
 * Shows available dimensions and measures that can be dragged to field wells.
 * Inspired by PowerBI's field list pane.
 */

import { t, Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  Collapse,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import { Component, Dimension, Measure } from "@/domain/data";
import { Icon, IconName } from "@/icons";

export interface FieldListPanelProps {
  dimensions: Dimension[];
  measures: Measure[];
  onFieldClick?: (component: Component) => void;
  onFieldDragStart?: (component: Component) => void;
}

/**
 * Field List Panel - shows available data fields
 */
export const FieldListPanel = ({
  dimensions,
  measures,
  onFieldClick,
  onFieldDragStart,
}: FieldListPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDimensionsExpanded, setIsDimensionsExpanded] = useState(true);
  const [isMeasuresExpanded, setIsMeasuresExpanded] = useState(true);

  // Filter components by search query
  const filteredDimensions = useMemo(() => {
    if (!searchQuery) return dimensions;
    const query = searchQuery.toLowerCase();
    return dimensions.filter(
      (d) =>
        d.label.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
    );
  }, [dimensions, searchQuery]);

  const filteredMeasures = useMemo(() => {
    if (!searchQuery) return measures;
    const query = searchQuery.toLowerCase();
    return measures.filter(
      (m) =>
        m.label.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query)
    );
  }, [measures, searchQuery]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "text.secondary",
          }}
        >
          <Trans id="powerbi.field-list.title">Data Fields</Trans>
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ px: 1.5, py: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={t({ id: "powerbi.field-list.search", message: "Search fields..." })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="search" size={16} color="var(--mui-palette-text-secondary)" />
              </InputAdornment>
            ),
            sx: {
              fontSize: "0.75rem",
              "& .MuiInputBase-input": {
                py: 0.75,
              },
            },
          }}
        />
      </Box>

      {/* Field lists */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {/* Dimensions section */}
        <FieldSection
          title={<Trans id="powerbi.field-list.dimensions">Dimensions</Trans>}
          icon="categories"
          isExpanded={isDimensionsExpanded}
          onToggle={() => setIsDimensionsExpanded(!isDimensionsExpanded)}
          count={filteredDimensions.length}
        >
          <List dense disablePadding>
            {filteredDimensions.map((dim) => (
              <FieldItem
                key={dim.id}
                component={dim}
                type="dimension"
                onClick={() => onFieldClick?.(dim)}
                onDragStart={() => onFieldDragStart?.(dim)}
              />
            ))}
            {filteredDimensions.length === 0 && (
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, color: "text.disabled", display: "block" }}
              >
                <Trans id="powerbi.field-list.no-dimensions">No dimensions found</Trans>
              </Typography>
            )}
          </List>
        </FieldSection>

        {/* Measures section */}
        <FieldSection
          title={<Trans id="powerbi.field-list.measures">Measures</Trans>}
          icon="listNumber"
          isExpanded={isMeasuresExpanded}
          onToggle={() => setIsMeasuresExpanded(!isMeasuresExpanded)}
          count={filteredMeasures.length}
        >
          <List dense disablePadding>
            {filteredMeasures.map((measure) => (
              <FieldItem
                key={measure.id}
                component={measure}
                type="measure"
                onClick={() => onFieldClick?.(measure)}
                onDragStart={() => onFieldDragStart?.(measure)}
              />
            ))}
            {filteredMeasures.length === 0 && (
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, color: "text.disabled", display: "block" }}
              >
                <Trans id="powerbi.field-list.no-measures">No measures found</Trans>
              </Typography>
            )}
          </List>
        </FieldSection>
      </Box>
    </Box>
  );
};

/**
 * Collapsible field section
 */
const FieldSection = ({
  title,
  icon,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: React.ReactNode;
  icon: IconName;
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) => {
  return (
    <Box>
      <ListItemButton
        onClick={onToggle}
        sx={{
          py: 0.75,
          px: 1.5,
          minHeight: 36,
          backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.02),
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.08),
          },
        }}
      >
        <Icon
          name={isExpanded ? "chevronDown" : "chevronRight"}
          size={14}
          color="var(--mui-palette-text-secondary)"
        />
        <Icon
          name={icon}
          size={14}
          color="var(--mui-palette-text-secondary)"
          style={{ marginLeft: 4 }}
        />
        <Typography
          variant="caption"
          sx={{
            ml: 1,
            fontWeight: 600,
            color: "text.secondary",
            flexGrow: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            fontSize: "0.65rem",
          }}
        >
          {count}
        </Typography>
      </ListItemButton>
      <Collapse in={isExpanded}>{children}</Collapse>
    </Box>
  );
};

/**
 * Individual field item
 */
const FieldItem = ({
  component,
  type,
  onClick,
  onDragStart,
}: {
  component: Component;
  type: "dimension" | "measure";
  onClick?: () => void;
  onDragStart?: () => void;
}) => {
  const icon = type === "dimension" ? "text" : "listNumber";
  const iconColor =
    type === "dimension"
      ? "var(--mui-palette-info-main)"
      : "var(--mui-palette-success-main)";

  return (
    <ListItem disablePadding>
      <Tooltip title={component.description || component.label} placement="right" arrow>
        <ListItemButton
          onClick={onClick}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", component.id);
            e.dataTransfer.setData("application/json", JSON.stringify({
              id: component.id,
              label: component.label,
              type,
            }));
            onDragStart?.();
          }}
          sx={{
            py: 0.5,
            px: 2,
            pl: 4,
            minHeight: 32,
            cursor: "grab",
            "&:active": {
              cursor: "grabbing",
            },
            "&:hover": {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <Icon name={icon} size={14} color={iconColor} />
          </ListItemIcon>
          <ListItemText
            primary={component.label}
            primaryTypographyProps={{
              variant: "caption",
              sx: {
                fontSize: "0.7rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
};

export default FieldListPanel;
