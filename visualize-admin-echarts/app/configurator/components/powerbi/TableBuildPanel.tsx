/**
 * PowerBI-Style Table Build Panel
 *
 * Configuration panel for table charts that replaces FieldWells.
 * Provides column management, grouping, and sorting configuration.
 */

import { t, Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
} from "@mui/material";
import React, { useMemo } from "react";

import { TableConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import {
  ControlSection,
  ControlSectionContent,
  SectionTitle,
} from "@/configurator/components/chart-controls/section";
import { FilterPanel } from "./FilterPanel";
import { PowerBIChartTypePicker } from "./PowerBIChartTypePicker";
import { useOrderedTableColumns } from "@/configurator/components/ui-helpers";
import { useConfiguratorState } from "@/configurator/configurator-state";
import { Dimension, Measure } from "@/domain/data";
import { Icon } from "@/icons";

export interface TableBuildPanelProps {
  chartConfig: TableConfig;
  dimensions: Dimension[];
  measures: Measure[];
  onColumnClick?: (columnId: string) => void;
  activeField?: string;
  state: any;
}

export const TableBuildPanel = ({
  chartConfig,
  dimensions,
  measures,
  onColumnClick,
  activeField,
  state,
}: TableBuildPanelProps) => {
  const [, dispatch] = useConfiguratorState();
  const fieldsArray = useOrderedTableColumns(chartConfig.fields);

  const groupFields = useMemo(
    () => fieldsArray.filter((f) => f.isGroup),
    [fieldsArray]
  );
  const columnFields = useMemo(
    () => fieldsArray.filter((f) => !f.isGroup),
    [fieldsArray]
  );

  const handleColumnClick = (columnId: string) => {
    onColumnClick?.(columnId);
    dispatch({
      type: "CHART_ACTIVE_FIELD_CHANGE",
      value: columnId,
    });
  };

  const handleSortingClick = () => {
    dispatch({
      type: "CHART_ACTIVE_FIELD_CHANGE",
      value: "table-sorting",
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Chart type selector - collapsible */}
      <ControlSection collapse defaultOpen={false}>
        <SectionTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon name="table" size={16} />
            <Trans id="powerbi.chart-type.title">Chart type</Trans>
          </Box>
        </SectionTitle>
        <ControlSectionContent px="none" gap="none">
          <PowerBIChartTypePicker
            state={state}
            type="edit"
            chartKey={chartConfig.key}
            showSearch={false}
          />
        </ControlSectionContent>
      </ControlSection>

      <Divider />

      {/* Table Configuration Section */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "text.secondary",
            mb: 1.5,
            display: "block",
          }}
        >
          <Trans id="powerbi.table.configure">Configure table</Trans>
        </Typography>

        {/* Sorting Configuration */}
        <TableConfigItem
          icon="sort"
          label={t({ id: "controls.table.sorting", message: "Sorting" })}
          description={t({
            id: "powerbi.table.sorting.description",
            message: "Configure column sorting order",
          })}
          isActive={activeField === "table-sorting"}
          onClick={handleSortingClick}
        />

        {/* Search toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1,
            px: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon name="search" size={16} color="var(--mui-palette-text-secondary)" />
            <Typography variant="caption">
              <Trans id="controls.tableSettings.showSearch">Show Search</Trans>
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={chartConfig.settings?.showSearch ?? false}
            onChange={(e) => {
              dispatch({
                type: "CHART_CONFIG_UPDATE_COLOR_MAPPING",
                value: {
                  field: null,
                  path: "settings.showSearch",
                  value: e.target.checked,
                },
              });
            }}
          />
        </Box>
      </Box>

      <Divider />

      {/* Groups Section */}
      {groupFields.length > 0 && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="overline"
              sx={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "text.secondary",
                mb: 1,
                display: "block",
              }}
            >
              <Trans id="controls.section.groups">Groups</Trans>
              <Chip
                size="small"
                label={groupFields.length}
                sx={{ ml: 1, height: 18, fontSize: "0.65rem" }}
              />
            </Typography>
            <List dense disablePadding>
              {groupFields.map((field) => (
                <ColumnListItem
                  key={field.id}
                  field={field}
                  isActive={activeField === field.id}
                  onClick={() => handleColumnClick(field.id)}
                  isGroup
                />
              ))}
            </List>
          </Box>
          <Divider />
        </>
      )}

      {/* Columns Section */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "text.secondary",
            mb: 1,
            display: "block",
          }}
        >
          <Trans id="controls.section.columns">Columns</Trans>
          <Chip
            size="small"
            label={columnFields.length}
            sx={{ ml: 1, height: 18, fontSize: "0.65rem" }}
          />
        </Typography>
        <List dense disablePadding>
          {columnFields.map((field, index) => (
            <ColumnListItem
              key={field.id}
              field={field}
              index={index + 1}
              isActive={activeField === field.id}
              onClick={() => handleColumnClick(field.id)}
            />
          ))}
        </List>
      </Box>

      <Divider />

      {/* Filters panel */}
      <FilterPanel
        chartConfig={chartConfig}
        dimensions={dimensions}
      />
    </Box>
  );
};

/**
 * Table configuration item (sorting, filters, etc.)
 */
const TableConfigItem = ({
  icon,
  label,
  description,
  isActive,
  onClick,
}: {
  icon: string;
  label: string;
  description?: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: isActive ? "primary.main" : "divider",
        backgroundColor: isActive
          ? (theme) => alpha(theme.palette.primary.main, 0.04)
          : "transparent",
        cursor: "pointer",
        mb: 1,
        transition: "all 0.15s ease-in-out",
        "&:hover": {
          borderColor: "primary.light",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <Icon
        name={icon}
        size={18}
        color={
          isActive
            ? "var(--mui-palette-primary-main)"
            : "var(--mui-palette-text-secondary)"
        }
      />
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "primary.main" : "text.primary",
            display: "block",
          }}
        >
          {label}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "0.65rem" }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {isActive && (
        <Icon
          name="chevronRight"
          size={14}
          color="var(--mui-palette-primary-main)"
        />
      )}
    </Box>
  );
};

/**
 * Column list item
 */
const ColumnListItem = ({
  field,
  index,
  isActive,
  onClick,
  isGroup,
}: {
  field: { id: string; label: string; componentType?: string };
  index?: number;
  isActive: boolean;
  onClick: () => void;
  isGroup?: boolean;
}) => {
  return (
    <ListItem
      onClick={onClick}
      sx={{
        py: 0.75,
        px: 1.5,
        borderRadius: 0.5,
        mb: 0.5,
        cursor: "pointer",
        backgroundColor: isActive
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : "transparent",
        "&:hover": {
          backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.04),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        <Icon
          name={isGroup ? "group" : "columns"}
          size={14}
          color={
            isActive
              ? "var(--mui-palette-primary-main)"
              : "var(--mui-palette-text-secondary)"
          }
        />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {index !== undefined && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", minWidth: 16 }}
              >
                {index}.
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "primary.main" : "text.primary",
              }}
            >
              {field.label}
            </Typography>
          </Box>
        }
        sx={{ my: 0 }}
      />
      {isActive && (
        <Icon
          name="chevronRight"
          size={12}
          color="var(--mui-palette-primary-main)"
        />
      )}
    </ListItem>
  );
};

export default TableBuildPanel;
