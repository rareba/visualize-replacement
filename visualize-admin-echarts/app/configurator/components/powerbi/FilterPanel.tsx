/**
 * PowerBI-Style Filter Panel
 *
 * Configuration panel for interactive data filters.
 * Allows users to:
 * - Toggle dimensions as interactive filters
 * - Configure filter type (single/multi select)
 * - Select filter values directly (PowerBI-style)
 */

import { t, Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import produce from "immer";
import React, { useCallback, useMemo, useState } from "react";

import {
  ChartConfig,
  FilterValueMulti,
  FilterValueSingle,
  InteractiveDataFilterType,
} from "@/config-types";
import {
  ControlSection,
  ControlSectionContent,
  SectionTitle,
} from "@/configurator/components/chart-controls/section";
import {
  isConfiguring,
  useConfiguratorState,
} from "@/configurator/configurator-state";
import { FIELD_VALUE_NONE } from "@/configurator/constants";
import {
  toggleInteractiveFilterDataDimension,
  useInteractiveTimeRangeToggle,
} from "@/configurator/interactive-filters/interactive-filters-config-state";
import { Dimension, isTemporalDimension } from "@/domain/data";
import { Icon } from "@/icons";
import { useChartInteractiveFilters } from "@/stores/interactive-filters";

export interface FilterPanelProps {
  chartConfig: ChartConfig;
  dimensions: Dimension[];
}

export const FilterPanel = ({ chartConfig, dimensions }: FilterPanelProps) => {
  const [, dispatch] = useConfiguratorState(isConfiguring);
  const { interactiveFiltersConfig } = chartConfig;
  const activeFilterIds = interactiveFiltersConfig.dataFilters.componentIds;

  // Get filter values from the interactive filters store
  const dataFilters = useChartInteractiveFilters((d) => d.dataFilters);
  const updateDataFilter = useChartInteractiveFilters((d) => d.updateDataFilter);
  const setMultiDataFilter = useChartInteractiveFilters((d) => d.setMultiDataFilter);
  const addDataFilterValue = useChartInteractiveFilters((d) => d.addDataFilterValue);
  const removeDataFilterValue = useChartInteractiveFilters((d) => d.removeDataFilterValue);

  // Get filterable dimensions (exclude those already used in encodings as primary fields)
  const filterableDimensions = useMemo(() => {
    // All dimensions can potentially be filters
    return dimensions;
  }, [dimensions]);

  // Separate active and inactive filters
  const { activeFilters, availableFilters } = useMemo(() => {
    const active = filterableDimensions.filter((d) =>
      activeFilterIds.includes(d.id)
    );
    const available = filterableDimensions.filter(
      (d) => !activeFilterIds.includes(d.id)
    );
    return { activeFilters: active, availableFilters: available };
  }, [filterableDimensions, activeFilterIds]);

  const handleToggleFilter = (dimensionId: string, filterType: InteractiveDataFilterType = "single") => {
    const newConfig = toggleInteractiveFilterDataDimension(
      interactiveFiltersConfig,
      dimensionId,
      undefined,
      filterType
    );
    dispatch({
      type: "INTERACTIVE_FILTER_CHANGED",
      value: newConfig,
    });
  };

  const handleChangeFilterType = (dimensionId: string, filterType: InteractiveDataFilterType) => {
    const newConfig = produce(interactiveFiltersConfig, (draft) => {
      draft.dataFilters.filterTypes[dimensionId] = filterType;
    });
    dispatch({
      type: "INTERACTIVE_FILTER_CHANGED",
      value: newConfig,
    });
  };

  // Handle filter value changes
  const handleSingleFilterChange = useCallback((dimensionId: string, value: string) => {
    updateDataFilter(dimensionId, value);
  }, [updateDataFilter]);

  const handleMultiFilterToggle = useCallback((dimensionId: string, value: string, checked: boolean) => {
    if (checked) {
      addDataFilterValue(dimensionId, value);
    } else {
      removeDataFilterValue(dimensionId, value);
    }
  }, [addDataFilterValue, removeDataFilterValue]);

  const handleClearFilter = useCallback((dimensionId: string) => {
    updateDataFilter(dimensionId, FIELD_VALUE_NONE);
  }, [updateDataFilter]);

  // Check if time range filter is available
  const hasTemporalDimension = dimensions.some(isTemporalDimension);
  const { checked: timeRangeActive, toggle: toggleTimeRange } =
    useInteractiveTimeRangeToggle();

  return (
    <ControlSection collapse defaultOpen={true}>
      <SectionTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon name="filter" size={16} />
          <Trans id="powerbi.filters.title">Filters</Trans>
          {activeFilterIds.length > 0 && (
            <Chip
              size="small"
              label={activeFilterIds.length}
              sx={{
                height: 18,
                fontSize: "0.65rem",
                backgroundColor: "primary.main",
                color: "primary.contrastText",
              }}
            />
          )}
        </Box>
      </SectionTitle>
      <ControlSectionContent px="small" gap="none">
        <Box sx={{ py: 1 }}>
          {/* Active Filters with Value Selection */}
          {activeFilters.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "text.secondary",
                  display: "block",
                  mb: 1,
                }}
              >
                <Trans id="powerbi.filters.active">Active filters</Trans>
              </Typography>
              {activeFilters.map((dimension) => {
                const filterType = interactiveFiltersConfig.dataFilters.filterTypes[dimension.id] || "single";
                const currentFilter = dataFilters[dimension.id];

                return (
                  <ActiveFilterCard
                    key={dimension.id}
                    dimension={dimension}
                    filterType={filterType}
                    currentFilter={currentFilter}
                    onRemove={() => handleToggleFilter(dimension.id)}
                    onChangeType={(type) => handleChangeFilterType(dimension.id, type)}
                    onSingleValueChange={(value) => handleSingleFilterChange(dimension.id, value)}
                    onMultiValueToggle={(value, checked) => handleMultiFilterToggle(dimension.id, value, checked)}
                    onClear={() => handleClearFilter(dimension.id)}
                  />
                );
              })}
            </Box>
          )}

          {/* Time Range Filter (if temporal dimension exists) */}
          {hasTemporalDimension && chartConfig.chartType !== "table" && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={timeRangeActive}
                    onChange={toggleTimeRange}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Icon name="time" size={14} color="var(--mui-palette-text-secondary)" />
                    <Typography variant="caption">
                      <Trans id="powerbi.filters.timeRange">Time range slider</Trans>
                    </Typography>
                  </Box>
                }
                sx={{ ml: 0 }}
              />
            </Box>
          )}

          {/* Available Filters */}
          {availableFilters.length > 0 && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "text.secondary",
                  display: "block",
                  mb: 1,
                }}
              >
                <Trans id="powerbi.filters.available">Add filter</Trans>
              </Typography>
              <List dense disablePadding>
                {availableFilters.map((dimension) => (
                  <FilterListItem
                    key={dimension.id}
                    dimension={dimension}
                    isActive={false}
                    onToggle={() => handleToggleFilter(dimension.id, "single")}
                  />
                ))}
              </List>
            </Box>
          )}

          {/* Empty state */}
          {filterableDimensions.length === 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              <Trans id="powerbi.filters.empty">No dimensions available for filtering</Trans>
            </Typography>
          )}
        </Box>
      </ControlSectionContent>
    </ControlSection>
  );
};

/**
 * Active filter card with value selection (PowerBI-style)
 */
const ActiveFilterCard = ({
  dimension,
  filterType,
  currentFilter,
  onRemove,
  onChangeType,
  onSingleValueChange,
  onMultiValueToggle,
  onClear,
}: {
  dimension: Dimension;
  filterType: InteractiveDataFilterType;
  currentFilter?: FilterValueSingle | FilterValueMulti;
  onRemove: () => void;
  onChangeType: (type: InteractiveDataFilterType) => void;
  onSingleValueChange: (value: string) => void;
  onMultiValueToggle: (value: string, checked: boolean) => void;
  onClear: () => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const isTemporal = isTemporalDimension(dimension);

  // Get current selected values
  const selectedValues = useMemo(() => {
    if (!currentFilter) return new Set<string>();
    if (currentFilter.type === "single") {
      return currentFilter.value !== FIELD_VALUE_NONE
        ? new Set([currentFilter.value as string])
        : new Set<string>();
    }
    return new Set(Object.keys(currentFilter.values));
  }, [currentFilter]);

  // Filter dimension values based on search
  const filteredValues = useMemo(() => {
    if (!searchTerm) return dimension.values;
    const term = searchTerm.toLowerCase();
    return dimension.values.filter((v) =>
      v.label.toLowerCase().includes(term)
    );
  }, [dimension.values, searchTerm]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleTypeChange = (type: InteractiveDataFilterType) => {
    onChangeType(type);
    handleMenuClose();
  };

  const handleValueClick = (value: string) => {
    if (filterType === "single") {
      // Toggle: if already selected, clear it; otherwise select it
      if (selectedValues.has(value)) {
        onClear();
      } else {
        onSingleValueChange(value);
      }
    } else {
      // Multi: toggle the checkbox
      onMultiValueToggle(value, !selectedValues.has(value));
    }
  };

  const selectedCount = selectedValues.size;
  const totalCount = dimension.values.length;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        mb: 1.5,
        overflow: "hidden",
        backgroundColor: "background.paper",
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          cursor: "pointer",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        <Icon
          name={expanded ? "chevronDown" : "chevronRight"}
          size={14}
          color="var(--mui-palette-text-secondary)"
        />
        <Icon
          name={isTemporal ? "time" : "filter"}
          size={14}
          color="var(--mui-palette-primary-main)"
        />
        <Typography
          variant="caption"
          sx={{ flex: 1, fontWeight: 500, color: "text.primary" }}
        >
          {dimension.label}
        </Typography>
        {selectedCount > 0 && (
          <Chip
            size="small"
            label={`${selectedCount}/${totalCount}`}
            sx={{
              height: 18,
              fontSize: "0.6rem",
              backgroundColor: "primary.main",
              color: "primary.contrastText",
            }}
          />
        )}
        <Tooltip title={t({ id: "powerbi.filters.settings", message: "Filter settings" })}>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ p: 0.25 }}
          >
            <Icon name="more" size={14} />
          </IconButton>
        </Tooltip>
        <Tooltip title={t({ id: "powerbi.filters.remove", message: "Remove filter" })}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{ p: 0.25 }}
          >
            <Icon name="close" size={14} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filter content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 1 }}>
          {/* Search box */}
          {dimension.values.length > 5 && (
            <TextField
              size="small"
              placeholder={t({ id: "powerbi.filters.search", message: "Search..." })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Icon name="search" size={14} color="var(--mui-palette-text-secondary)" />
                ),
                sx: { fontSize: "0.75rem", pl: 1 },
              }}
              sx={{
                mb: 1,
                "& .MuiInputBase-root": { height: 28 },
                "& .MuiInputBase-input": { py: 0.5 },
              }}
              fullWidth
            />
          )}

          {/* Value list */}
          <Box
            sx={{
              maxHeight: 200,
              overflow: "auto",
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "divider",
                borderRadius: 3,
              },
            }}
          >
            <List dense disablePadding>
              {filteredValues.map((dimValue) => {
                const isSelected = selectedValues.has(dimValue.value);
                return (
                  <ListItemButton
                    key={dimValue.value}
                    onClick={() => handleValueClick(dimValue.value)}
                    sx={{
                      py: 0.25,
                      px: 0.5,
                      borderRadius: 0.5,
                      minHeight: 28,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {filterType === "multi" ? (
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          sx={{ p: 0 }}
                        />
                      ) : (
                        <Radio
                          size="small"
                          checked={isSelected}
                          sx={{ p: 0 }}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: isSelected ? 500 : 400,
                            color: isSelected ? "primary.main" : "text.primary",
                          }}
                        >
                          {dimValue.label}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}
              {filteredValues.length === 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 1, py: 0.5, display: "block", fontStyle: "italic" }}
                >
                  <Trans id="powerbi.filters.noResults">No matching values</Trans>
                </Typography>
              )}
            </List>
          </Box>

          {/* Clear selection button */}
          {selectedCount > 0 && (
            <Box sx={{ mt: 1, textAlign: "right" }}>
              <Typography
                variant="caption"
                onClick={onClear}
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                <Trans id="powerbi.filters.clear">Clear selection</Trans>
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Settings menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          selected={filterType === "single"}
          onClick={() => handleTypeChange("single")}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Icon name="radioChecked" size={16} />
          </ListItemIcon>
          <ListItemText
            primary={<Trans id="filter.type.single">Single select</Trans>}
          />
        </MenuItem>
        <MenuItem
          selected={filterType === "multi"}
          onClick={() => handleTypeChange("multi")}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Icon name="checkboxChecked" size={16} />
          </ListItemIcon>
          <ListItemText
            primary={<Trans id="filter.type.multi">Multi select</Trans>}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

/**
 * Individual filter list item (for available filters)
 */
const FilterListItem = ({
  dimension,
  isActive,
  filterType,
  onToggle,
  onChangeType,
}: {
  dimension: Dimension;
  isActive: boolean;
  filterType?: InteractiveDataFilterType;
  onToggle: () => void;
  onChangeType?: (type: InteractiveDataFilterType) => void;
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const isTemporal = isTemporalDimension(dimension);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleTypeChange = (type: InteractiveDataFilterType) => {
    onChangeType?.(type);
    handleMenuClose();
  };

  return (
    <ListItem
      onClick={isActive ? undefined : onToggle}
      sx={{
        py: 0.5,
        px: 1,
        borderRadius: 0.5,
        mb: 0.5,
        cursor: isActive ? "default" : "pointer",
        backgroundColor: isActive
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : "transparent",
        border: 1,
        borderColor: isActive ? "primary.light" : "transparent",
        "&:hover": !isActive
          ? {
              backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.04),
              borderColor: "divider",
            }
          : {},
      }}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        <Icon
          name={isTemporal ? "time" : "filter"}
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
          <Typography
            variant="caption"
            sx={{
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "primary.main" : "text.primary",
            }}
          >
            {dimension.label}
          </Typography>
        }
        secondary={
          isActive && filterType ? (
            <Chip
              size="small"
              label={filterType === "multi" ? t({ id: "filter.type.multi", message: "Multi" }) : t({ id: "filter.type.single", message: "Single" })}
              onClick={handleMenuOpen}
              sx={{
                height: 16,
                fontSize: "0.6rem",
                mt: 0.25,
                cursor: "pointer",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          ) : null
        }
      />
      {isActive && (
        <ListItemSecondaryAction>
          <Tooltip title={t({ id: "powerbi.filters.remove", message: "Remove filter" })}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
            >
              <Icon name="close" size={14} />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      )}
      {!isActive && (
        <ListItemSecondaryAction>
          <Icon name="add" size={14} color="var(--mui-palette-text-disabled)" />
        </ListItemSecondaryAction>
      )}

      {/* Filter type menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem
          selected={filterType === "single"}
          onClick={() => handleTypeChange("single")}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Icon name="radioChecked" size={16} />
          </ListItemIcon>
          <ListItemText
            primary={<Trans id="filter.type.single">Single select</Trans>}
            secondary={<Trans id="filter.type.single.desc">User selects one value</Trans>}
          />
        </MenuItem>
        <MenuItem
          selected={filterType === "multi"}
          onClick={() => handleTypeChange("multi")}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Icon name="checkboxChecked" size={16} />
          </ListItemIcon>
          <ListItemText
            primary={<Trans id="filter.type.multi">Multi select</Trans>}
            secondary={<Trans id="filter.type.multi.desc">User selects multiple values</Trans>}
          />
        </MenuItem>
      </Menu>
    </ListItem>
  );
};

export default FilterPanel;
