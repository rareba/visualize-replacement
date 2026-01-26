/**
 * PowerBI-Style Chart Configurator
 *
 * Main configurator component that combines:
 * - Chart type picker
 * - Field wells for data mapping
 * - Formatting panel
 *
 * This replaces the traditional ChartConfigurator with a PowerBI-inspired layout.
 */

import { Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import { EncodingFieldType } from "@/charts/chart-config-ui-options";
import { ChartConfig, ConfiguratorStateConfiguringChart, TableConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import { useConfiguratorState } from "@/configurator/configurator-state";
import {
  ControlSection,
  ControlSectionContent,
  ControlSectionSkeleton,
  SectionTitle,
} from "@/configurator/components/chart-controls/section";
import { ChartAnnotator } from "@/configurator/components/annotators";
import { ChartAnnotations } from "@/configurator/components/chart-annotations/chart-annotations";
import { DatasetsControlSection } from "@/configurator/components/dataset-control-section";
import { ChartOptionsSelector } from "@/configurator/components/chart-options-selector";
import { InteractiveFiltersConfigurator } from "@/configurator/interactive-filters/interactive-filters-configurator";
import { useDataCubesComponentsQuery } from "@/graphql/hooks";
import { Icon } from "@/icons";
import { useLocale } from "@/locales/use-locale";
import { InteractiveFiltersChartProvider } from "@/stores/interactive-filters";

import { PowerBIChartTypePicker } from "./PowerBIChartTypePicker";
import { FieldWells } from "./FieldWells";
import { FieldListPanel } from "./FieldListPanel";
import { FilterPanel } from "./FilterPanel";
import { FormattingPanel } from "./FormattingPanel";
import { TableBuildPanel } from "./TableBuildPanel";

// Tab panel IDs
type TabId = "build" | "format";

interface TabPanelProps {
  children?: React.ReactNode;
  id: TabId;
  activeTab: TabId;
}

const TabPanel = ({ children, id, activeTab }: TabPanelProps) => {
  return (
    <Box
      role="tabpanel"
      hidden={activeTab !== id}
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      sx={{ height: "100%" }}
    >
      {activeTab === id && children}
    </Box>
  );
};

export interface PowerBIConfiguratorProps {
  state: ConfiguratorStateConfiguringChart;
}

export const PowerBIConfigurator = ({ state }: PowerBIConfiguratorProps) => {
  const locale = useLocale();
  const chartConfig = getChartConfig(state);
  const [activeTab, setActiveTab] = useState<TabId>("build");
  const [, dispatch] = useConfiguratorState();

  const [{ data, fetching }] = useDataCubesComponentsQuery({
    chartConfig,
    variables: {
      sourceType: state.dataSource.type,
      sourceUrl: state.dataSource.url,
      locale,
      cubeFilters: chartConfig.cubes.map((cube) => ({
        iri: cube.iri,
        joinBy: cube.joinBy,
        loadValues: true,
      })),
    },
    keepPreviousData: true,
  });

  const dimensions = data?.dataCubesComponents?.dimensions ?? [];
  const measures = data?.dataCubesComponents?.measures ?? [];
  const components = useMemo(
    () => [...dimensions, ...measures],
    [dimensions, measures]
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabId) => {
    setActiveTab(newValue);
  };

  const handleFieldClick = (field: string) => {
    // Set active field to open the options drawer
    dispatch({
      type: "CHART_ACTIVE_FIELD_CHANGE",
      value: field,
    });
  };

  const handleFieldDragStart = (component: any) => {
    // TODO: Track dragged field for drop target highlighting
    console.log("Field drag started:", component);
  };

  const handleFieldDrop = (wellField: string, droppedComponent: { id: string; label: string; type: string }) => {
    console.log("Field dropped:", wellField, droppedComponent);

    // Dispatch action to update the field
    dispatch({
      type: "CHART_FIELD_CHANGED",
      value: {
        locale,
        field: wellField as EncodingFieldType,
        componentId: droppedComponent.id,
      },
    });

    // Also set the active field so the options panel opens
    dispatch({
      type: "CHART_ACTIVE_FIELD_CHANGE",
      value: wellField,
    });
  };

  if (fetching && components.length === 0) {
    return (
      <>
        <ControlSectionSkeleton />
        <ControlSectionSkeleton />
      </>
    );
  }

  return (
    <InteractiveFiltersChartProvider chartConfigKey={chartConfig.key}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Dataset section */}
        <DatasetsControlSection />

        {/* PowerBI-style tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                minHeight: 40,
                py: 1,
                fontSize: "0.75rem",
                fontWeight: 500,
                textTransform: "none",
              },
            }}
          >
            <Tab
              value="build"
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Icon name="chartColumn" size={16} />
                  <Trans id="powerbi.tab.build">Build visual</Trans>
                </Box>
              }
            />
            <Tab
              value="format"
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Icon name="formatting" size={16} />
                  <Trans id="powerbi.tab.format">Format</Trans>
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.5),
          }}
        >
          <TabPanel id="build" activeTab={activeTab}>
            <BuildPanel
              state={state}
              chartConfig={chartConfig}
              dimensions={dimensions}
              measures={measures}
              onFieldClick={handleFieldClick}
              onFieldDragStart={handleFieldDragStart}
              onFieldDrop={handleFieldDrop}
            />
          </TabPanel>

          <TabPanel id="format" activeTab={activeTab}>
            <FormattingPanel
              chartConfig={chartConfig}
              onFormattingChange={(formatting) => {
                dispatch({
                  type: "CHART_CONFIG_UPDATE_FORMATTING",
                  value: {
                    formatting,
                  },
                });
              }}
            />
          </TabPanel>
        </Box>

        {/* Annotations section (always visible) */}
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          <ChartAnnotator />
          <ChartAnnotations />
        </Box>

        {/* Interactive filters (always visible) */}
        {chartConfig.chartType !== "table" && (
          <InteractiveFiltersConfigurator state={state} />
        )}
      </Box>
    </InteractiveFiltersChartProvider>
  );
};

/**
 * Build panel - contains chart type picker, field wells, and field list
 * For table charts, uses TableBuildPanel instead of FieldWells
 */
const BuildPanel = ({
  state,
  chartConfig,
  dimensions,
  measures,
  onFieldClick,
  onFieldDragStart,
  onFieldDrop,
}: {
  state: ConfiguratorStateConfiguringChart;
  chartConfig: ChartConfig;
  dimensions: any[];
  measures: any[];
  onFieldClick: (field: string) => void;
  onFieldDragStart?: (component: any) => void;
  onFieldDrop?: (wellField: string, droppedComponent: { id: string; label: string; type: string }) => void;
}) => {
  // For table charts, use the dedicated TableBuildPanel
  if (chartConfig.chartType === "table") {
    return (
      <TableBuildPanel
        chartConfig={chartConfig as TableConfig}
        dimensions={dimensions}
        measures={measures}
        onColumnClick={onFieldClick}
        activeField={chartConfig.activeField}
        state={state}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Chart type selector - collapsible */}
      <ControlSection collapse defaultExpanded={false}>
        <SectionTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon name="chartColumn" size={16} />
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

      {/* Field wells */}
      <Box sx={{ p: 2 }}>
        <FieldWells
          chartConfig={chartConfig}
          dimensions={dimensions}
          measures={measures}
          onFieldClick={onFieldClick}
          onFieldDrop={onFieldDrop}
          activeField={chartConfig.activeField}
        />
      </Box>

      <Divider />

      {/* Field options (when a field is active) */}
      {chartConfig.activeField && (
        <Box sx={{ p: 0 }}>
          <ChartOptionsSelector />
        </Box>
      )}

      {/* Available fields list */}
      <FieldListPanel
        dimensions={dimensions}
        measures={measures}
        onFieldClick={(component) => onFieldClick(component.id)}
        onFieldDragStart={onFieldDragStart}
      />

      <Divider />

      {/* Filters panel */}
      <FilterPanel
        chartConfig={chartConfig}
        dimensions={dimensions}
      />
    </Box>
  );
};

export default PowerBIConfigurator;
