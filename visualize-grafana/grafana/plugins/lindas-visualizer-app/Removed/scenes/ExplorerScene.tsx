/**
 * LINDAS Cube Browser
 *
 * A simple interface for discovering LINDAS data cubes and generating
 * SPARQL queries. Users then visualize data using Grafana's native
 * panels (Explore, Dashboards).
 *
 * Philosophy:
 * - This plugin does NOT visualize data itself
 * - It helps users discover cubes and build queries
 * - Actual visualization happens in Grafana's native interface
 * - Users are locked to LINDAS datasource only
 */

import React, { useCallback, useState, useMemo } from 'react';
import { css } from '@emotion/css';
import { AppRootProps, GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Icon, Alert, Spinner, Tooltip, ClipboardButton } from '@grafana/ui';
import { getBackendSrv, locationService } from '@grafana/runtime';

import { CubeSelector } from '../components/CubeSelector';
import { SparqlBuilder } from '../utils/sparqlBuilder';
import { mockCatalogService } from '../services/mockCatalog';
import type {
  CubeMetadata,
  CubeFullMetadata,
  SparqlQueryConfig,
} from '../types';

// Datasource configuration - locked to LINDAS
const LINDAS_DATASOURCE_UID = 'lindas-datasource';
const LINDAS_DATASOURCE_TYPE = 'flandersmake-sparql-datasource';

/**
 * Main App Component - Cube Browser
 *
 * This is NOT a visualization tool. It helps users:
 * 1. Discover available LINDAS cubes
 * 2. Select dimensions and measures
 * 3. Generate SPARQL queries
 * 4. Open in Grafana Explore or create dashboards
 */
export const ExplorerSceneWrapper: React.FC<AppRootProps> = () => {
  const styles = useStyles2(getStyles);

  // State
  const [selectedCube, setSelectedCube] = useState<CubeFullMetadata | null>(null);
  const [queryConfig, setQueryConfig] = useState<SparqlQueryConfig | null>(null);
  const [generatedQuery, setGeneratedQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle cube search
  const handleSearch = useCallback(async (term: string): Promise<CubeMetadata[]> => {
    try {
      return await mockCatalogService.searchCubes(term);
    } catch (err) {
      setError(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return [];
    }
  }, []);

  // Handle cube selection
  const handleSelectCube = useCallback(async (cube: CubeMetadata): Promise<CubeFullMetadata | null> => {
    try {
      setError(null);
      const fullCube = await mockCatalogService.getCubeMetadata(cube.uri);
      if (fullCube) {
        setSelectedCube(fullCube);
        // Initialize query config with all fields selected
        setQueryConfig({
          cubeUri: fullCube.uri,
          selectedDimensions: fullCube.dimensions.map((d) => d.uri),
          selectedMeasures: fullCube.measures.map((m) => m.uri),
          filters: [],
          limit: 10000,
        });
      }
      return fullCube;
    } catch (err) {
      setError(`Failed to load cube: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, []);

  // Handle query config change
  const handleQueryConfigChange = useCallback((config: SparqlQueryConfig) => {
    setQueryConfig(config);
  }, []);

  // Generate SPARQL query
  const handleGenerateQuery = useCallback(() => {
    if (!queryConfig || !selectedCube) {
      return;
    }

    const builder = new SparqlBuilder(
      queryConfig,
      selectedCube.dimensions,
      selectedCube.measures
    );

    const query = builder.build('observation');
    setGeneratedQuery(query);
  }, [queryConfig, selectedCube]);

  // Open in Grafana Explore
  const handleOpenInExplore = useCallback(() => {
    if (!generatedQuery) {
      handleGenerateQuery();
    }

    const query = generatedQuery || '';

    // Navigate to Explore with pre-filled query
    // Encode the query for URL
    const exploreState = {
      datasource: LINDAS_DATASOURCE_UID,
      queries: [
        {
          refId: 'A',
          queryText: query,
          format: 'table',
        },
      ],
    };

    // Use Grafana's location service to navigate to Explore
    const encodedState = encodeURIComponent(JSON.stringify(exploreState));
    locationService.push(`/explore?left=${encodedState}`);
  }, [generatedQuery, handleGenerateQuery]);

  // Create a new dashboard with a panel
  const handleCreateDashboard = useCallback(async () => {
    if (!selectedCube || !queryConfig) {
      setError('Please select a cube and configure your query first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate the query if not already done
      let query = generatedQuery;
      if (!query) {
        const builder = new SparqlBuilder(
          queryConfig,
          selectedCube.dimensions,
          selectedCube.measures
        );
        query = builder.build('observation');
      }

      // Create dashboard with a single table panel
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const dashboard = {
        title: `${selectedCube.label} - ${timestamp}`,
        tags: ['lindas', 'auto-generated'],
        timezone: 'browser',
        schemaVersion: 38,
        panels: [
          {
            id: 1,
            type: 'table',
            title: selectedCube.label,
            gridPos: { x: 0, y: 0, w: 24, h: 12 },
            datasource: {
              type: LINDAS_DATASOURCE_TYPE,
              uid: LINDAS_DATASOURCE_UID,
            },
            targets: [
              {
                refId: 'A',
                queryText: query,
                format: 'table',
              },
            ],
            options: {
              showHeader: true,
              cellHeight: 'sm',
            },
            fieldConfig: {
              defaults: {},
              overrides: [],
            },
          },
        ],
        annotations: { list: [] },
        templating: { list: [] },
        time: { from: 'now-6h', to: 'now' },
        refresh: '',
      };

      // Create the dashboard via API
      const response = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        message: `Created from LINDAS cube: ${selectedCube.label}`,
        overwrite: false,
      });

      // Navigate to the new dashboard
      setSuccessMessage('Dashboard created! Opening...');
      setTimeout(() => {
        locationService.push(`/d/${response.uid}`);
      }, 500);

    } catch (err: any) {
      setError(`Failed to create dashboard: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCube, queryConfig, generatedQuery]);

  // Clear success message after delay
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>LINDAS Data Browser</h1>
          <p>
            Discover Swiss Linked Data cubes and create visualizations using Grafana's native tools.
          </p>
        </div>
        <div className={styles.headerInfo}>
          <Icon name="info-circle" />
          <span>
            This tool helps you find data and build queries.
            Use Grafana's <strong>Explore</strong> or <strong>Dashboards</strong> to visualize.
          </span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert title="Error" severity="error" onRemove={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert title="Success" severity="success">
          {successMessage}
        </Alert>
      )}

      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Left pane: Cube Browser */}
        <div className={styles.leftPane}>
          <CubeSelector
            onSearch={handleSearch}
            onSelectCube={handleSelectCube}
            onQueryConfigChange={handleQueryConfigChange}
            onRunQuery={handleGenerateQuery}
            isLoading={isLoading}
            error={null}
          />
        </div>

        {/* Right pane: Query Preview and Actions */}
        <div className={styles.rightPane}>
          {!selectedCube ? (
            <div className={styles.emptyState}>
              <Icon name="database" size="xxxl" className={styles.emptyIcon} />
              <h2>Select a Data Cube</h2>
              <p>
                Search for a LINDAS data cube in the left panel.
                Once selected, you can configure your query and open it in Grafana.
              </p>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <Icon name="compass" />
                  <span><strong>Explore</strong> - Interactive query testing</span>
                </div>
                <div className={styles.feature}>
                  <Icon name="apps" />
                  <span><strong>Dashboard</strong> - Create shareable visualizations</span>
                </div>
                <div className={styles.feature}>
                  <Icon name="lock" />
                  <span><strong>Secure</strong> - Only LINDAS data accessible</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Cube Info */}
              <div className={styles.cubeInfo}>
                <h3>{selectedCube.label}</h3>
                {selectedCube.description && (
                  <p className={styles.cubeDescription}>{selectedCube.description}</p>
                )}
                <div className={styles.cubeMeta}>
                  {selectedCube.publisher && (
                    <span><Icon name="building" size="sm" /> {selectedCube.publisher}</span>
                  )}
                  <span>
                    <Icon name="list-ul" size="sm" /> {selectedCube.dimensions.length} dimensions
                  </span>
                  <span>
                    <Icon name="calculator-alt" size="sm" /> {selectedCube.measures.length} measures
                  </span>
                </div>
              </div>

              {/* Generated Query Preview */}
              {generatedQuery && (
                <div className={styles.querySection}>
                  <div className={styles.querySectionHeader}>
                    <h4>
                      <Icon name="code-branch" /> Generated SPARQL Query
                    </h4>
                    <ClipboardButton
                      variant="secondary"
                      size="sm"
                      getText={() => generatedQuery}
                      icon="copy"
                    >
                      Copy
                    </ClipboardButton>
                  </div>
                  <pre className={styles.queryPreview}>{generatedQuery}</pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.actions}>
                <h4>What would you like to do?</h4>

                <div className={styles.actionButtons}>
                  <Tooltip content="Test your query interactively in Grafana Explore">
                    <Button
                      variant="primary"
                      size="lg"
                      icon="compass"
                      onClick={handleOpenInExplore}
                      disabled={!queryConfig || (queryConfig.selectedDimensions.length === 0 && queryConfig.selectedMeasures.length === 0)}
                    >
                      Open in Explore
                    </Button>
                  </Tooltip>

                  <Tooltip content="Create a new dashboard with a panel using this query">
                    <Button
                      variant="secondary"
                      size="lg"
                      icon="apps"
                      onClick={handleCreateDashboard}
                      disabled={isLoading || !queryConfig || (queryConfig.selectedDimensions.length === 0 && queryConfig.selectedMeasures.length === 0)}
                    >
                      {isLoading ? (
                        <>
                          <Spinner inline size="sm" /> Creating...
                        </>
                      ) : (
                        'Create Dashboard'
                      )}
                    </Button>
                  </Tooltip>
                </div>

                <p className={styles.actionHint}>
                  <Icon name="info-circle" size="sm" />
                  After opening in Explore or Dashboard, use Grafana's panel editor to change
                  visualization type (table, time series, bar chart, pie chart, etc.)
                </p>
              </div>

              {/* Preview Button */}
              {!generatedQuery && queryConfig && (queryConfig.selectedDimensions.length > 0 || queryConfig.selectedMeasures.length > 0) && (
                <div className={styles.previewSection}>
                  <Button
                    variant="secondary"
                    icon="eye"
                    onClick={handleGenerateQuery}
                  >
                    Preview SPARQL Query
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Styles
 */
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${theme.spacing(2)};
    gap: ${theme.spacing(2)};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${theme.spacing(3)};
    flex-wrap: wrap;
  `,
  headerContent: css`
    h1 {
      margin: 0 0 ${theme.spacing(0.5)} 0;
      font-size: ${theme.typography.h3.fontSize};
    }
    p {
      margin: 0;
      color: ${theme.colors.text.secondary};
    }
  `,
  headerInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1)} ${theme.spacing(2)};
    background: ${theme.colors.info.transparent};
    border-radius: ${theme.shape.radius.default};
    color: ${theme.colors.info.text};
    font-size: ${theme.typography.size.sm};
    max-width: 500px;
  `,
  mainContent: css`
    display: flex;
    flex: 1;
    gap: ${theme.spacing(2)};
    min-height: 0;
  `,
  leftPane: css`
    width: 400px;
    min-width: 350px;
    max-width: 450px;
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
  `,
  rightPane: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    min-width: 0;
    overflow-y: auto;
  `,
  emptyState: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: ${theme.spacing(6)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    flex: 1;

    h2 {
      margin: ${theme.spacing(2)} 0 ${theme.spacing(1)} 0;
    }
    p {
      color: ${theme.colors.text.secondary};
      max-width: 400px;
      margin-bottom: ${theme.spacing(3)};
    }
  `,
  emptyIcon: css`
    color: ${theme.colors.text.disabled};
  `,
  features: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    text-align: left;
  `,
  feature: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  cubeInfo: css`
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};

    h3 {
      margin: 0 0 ${theme.spacing(1)} 0;
    }
  `,
  cubeDescription: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    margin: 0 0 ${theme.spacing(1)} 0;
  `,
  cubeMeta: css`
    display: flex;
    gap: ${theme.spacing(2)};
    flex-wrap: wrap;
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};

    span {
      display: flex;
      align-items: center;
      gap: ${theme.spacing(0.5)};
    }
  `,
  querySection: css`
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
  `,
  querySectionHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(1.5)} ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};

    h4 {
      margin: 0;
      font-size: ${theme.typography.size.sm};
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
    }
  `,
  queryPreview: css`
    margin: 0;
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.canvas};
    font-size: ${theme.typography.size.sm};
    font-family: ${theme.typography.fontFamilyMonospace};
    overflow-x: auto;
    max-height: 300px;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  actions: css`
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};

    h4 {
      margin: 0 0 ${theme.spacing(2)} 0;
    }
  `,
  actionButtons: css`
    display: flex;
    gap: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(2)};
  `,
  actionHint: css`
    display: flex;
    align-items: flex-start;
    gap: ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    margin: 0;
  `,
  previewSection: css`
    display: flex;
    justify-content: center;
  `,
});

export default ExplorerSceneWrapper;
