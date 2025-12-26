import { Trans } from "@lingui/macro";
import { Box, Button, Typography } from "@mui/material";
import { useCallback, useMemo } from "react";

import { ChartConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import {
  hasChartConfigs,
  useConfiguratorState,
} from "@/configurator/configurator-state";

// Grafana configuration - change this to your Grafana instance
const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3003";
const GRAFANA_DATASOURCE_UID = process.env.NEXT_PUBLIC_GRAFANA_DATASOURCE_UID || "P04A94EA1A6F09114";

/**
 * Generate a SPARQL query from chart configuration
 */
export function generateSparqlQuery(chartConfig: ChartConfig): string {
  const cubeIri = chartConfig.cubes[0]?.iri;
  if (!cubeIri) return "";

  // Extract field IRIs from the chart config
  const fieldIris: string[] = [];
  const fields = (chartConfig as any).fields || {};

  // Collect all component IDs from fields
  Object.values(fields).forEach((field: any) => {
    if (field?.componentId) {
      fieldIris.push(field.componentId);
    }
    // Handle segment fields
    if (field?.componentIds) {
      fieldIris.push(...field.componentIds);
    }
  });

  // Remove duplicates
  const uniqueFieldIris = [...new Set(fieldIris)];

  // Build SELECT variables
  const selectVars = uniqueFieldIris.map((iri, i) => {
    const varName = `dim${i}`;
    return `?${varName} ?${varName}_label`;
  }).join(" ");

  // Build WHERE patterns
  const wherePatterns = uniqueFieldIris.map((iri, i) => {
    const varName = `dim${i}`;
    return `
  ?observation <${iri}> ?${varName} .
  OPTIONAL { ?${varName} <http://schema.org/name> ?${varName}_label . }`;
  }).join("");

  // Build filter clauses from cube filters
  const filterClauses: string[] = [];
  const cubeFilters = chartConfig.cubes[0]?.filters || {};

  Object.entries(cubeFilters).forEach(([dimIri, filterValue]) => {
    if (filterValue && typeof filterValue === "object" && "type" in filterValue) {
      const filter = filterValue as { type: string; value?: string; from?: string; to?: string };
      const varIndex = uniqueFieldIris.indexOf(dimIri);
      if (varIndex >= 0) {
        const varName = `dim${varIndex}`;
        if (filter.type === "single" && filter.value) {
          filterClauses.push(`FILTER(?${varName} = <${filter.value}>)`);
        } else if (filter.type === "range") {
          if (filter.from) filterClauses.push(`FILTER(?${varName} >= "${filter.from}")`);
          if (filter.to) filterClauses.push(`FILTER(?${varName} <= "${filter.to}")`);
        }
      }
    }
  });

  const query = `PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT DISTINCT ${selectVars || "*"}
WHERE {
  ?observation a cube:Observation .
  ?observation cube:observedBy <${cubeIri}> .${wherePatterns}
  ${filterClauses.join("\n  ")}
}
LIMIT 1000`;

  return query;
}

/**
 * Generate Grafana Explore URL with SPARQL query for embedding
 */
export function generateGrafanaEmbedUrl(query: string): string {
  const paneConfig = {
    datasource: GRAFANA_DATASOURCE_UID,
    queries: [
      {
        refId: "A",
        datasource: {
          type: "flandersmake-sparql-datasource",
          uid: GRAFANA_DATASOURCE_UID,
        },
        queryText: query,
      },
    ],
    range: {
      from: "now-6h",
      to: "now",
    },
  };

  const panes = { "A": paneConfig };
  const encodedPanes = encodeURIComponent(JSON.stringify(panes));

  // Add kiosk mode for cleaner embed and hide some UI elements
  return `${GRAFANA_URL}/explore?panes=${encodedPanes}&schemaVersion=1&orgId=1&kiosk`;
}

/**
 * Generate Grafana Dashboard Builder URL
 */
export function generateGrafanaDashboardUrl(query: string, title: string): string {
  // For dashboard creation, we go to dashboard/new with pre-configured panel
  return `${GRAFANA_URL}/dashboard/new?orgId=1&kiosk`;
}

/**
 * Embedded Grafana Dashboard Builder component
 * This replaces the visualization preview with an embedded Grafana interface
 */
export const EmbeddedGrafanaDashboard = () => {
  const [state] = useConfiguratorState(hasChartConfigs);
  const chartConfig = getChartConfig(state);

  const grafanaUrl = useMemo(() => {
    const query = generateSparqlQuery(chartConfig);
    return generateGrafanaEmbedUrl(query);
  }, [chartConfig]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          <Trans id="dashboard.builder.title">Dashboard Builder</Trans>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Trans id="dashboard.builder.hint">
            Create visualizations with your selected data
          </Trans>
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <iframe
          src={grafanaUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          title="Dashboard Builder"
          allow="fullscreen"
        />
      </Box>
    </Box>
  );
};

/**
 * Button to proceed to Dashboard Builder step
 */
export const ProceedToDashboardButton = () => {
  const [, dispatch] = useConfiguratorState(hasChartConfigs);

  const handleClick = useCallback(() => {
    dispatch({
      type: "STEP_NEXT",
      dataCubesComponents: { dimensions: [], measures: [] },
    });
  }, [dispatch]);

  return (
    <Button
      variant="contained"
      size="sm"
      onClick={handleClick}
      sx={{
        backgroundColor: "primary.main",
      }}
    >
      <Trans id="button.create-dashboard">Create Dashboard</Trans>
    </Button>
  );
};
