import React, { useState } from 'react';
import { AppRootProps } from '@grafana/data';
import { Button, useStyles2, Icon, Spinner, Alert } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { searchCubes, fetchCubeMetadata, CubeSearchResult } from '../utils/sparql';

interface SelectedCube {
  iri: string;
  label: string;
  dimensions: Array<{ iri: string; label: string }>;
  measures: Array<{ iri: string; label: string }>;
}

export const App = (props: AppRootProps) => {
  const styles = useStyles2(getStyles);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CubeSearchResult[]>([]);
  const [selectedCubes, setSelectedCubes] = useState<SelectedCube[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setError(null);
    try {
      const results = await searchCubes(searchTerm, 100);
      setSearchResults(results);
    } catch (err: any) {
      setError('Failed to search cubes: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCube = async (cube: CubeSearchResult) => {
    if (selectedCubes.find(c => c.iri === cube.iri)) {
      return; // Already selected
    }

    setLoading(true);
    setError(null);
    try {
      const metadata = await fetchCubeMetadata(cube.iri);
      setSelectedCubes(prev => [...prev, {
        iri: cube.iri,
        label: metadata.label,
        dimensions: metadata.dimensions.map(d => ({ iri: d.iri, label: d.label })),
        measures: metadata.measures.map(m => ({ iri: m.iri, label: m.label })),
      }]);
    } catch (err: any) {
      setError('Failed to load cube metadata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCube = (iri: string) => {
    setSelectedCubes(prev => prev.filter(c => c.iri !== iri));
  };

  const generateTabularQuery = (cube: SelectedCube): string => {
    const selectVars: string[] = [];
    const patterns: string[] = [];

    patterns.push(`<${cube.iri}> <https://cube.link/observationSet>/<https://cube.link/observation> ?obs .`);

    // If we have dimensions and measures, use them
    if (cube.dimensions.length > 0 || cube.measures.length > 0) {
      cube.dimensions.forEach((dim, i) => {
        const varName = `dim${i}`;
        selectVars.push(`?${varName}`);
        patterns.push(`OPTIONAL { ?obs <${dim.iri}> ?${varName}_raw . }`);
        // Try to get label for dimension values
        patterns.push(`OPTIONAL { ?${varName}_raw <http://schema.org/name> ?${varName}_label . FILTER(LANG(?${varName}_label) = "en" || LANG(?${varName}_label) = "") }`);
        patterns.push(`BIND(COALESCE(?${varName}_label, STR(?${varName}_raw)) AS ?${varName})`);
      });

      cube.measures.forEach((measure, i) => {
        const varName = `measure${i}`;
        selectVars.push(`?${varName}`);
        patterns.push(`OPTIONAL { ?obs <${measure.iri}> ?${varName} . }`);
      });
    } else {
      // Fallback: get all properties dynamically
      // This generates a query that fetches raw observation data
      selectVars.push('?property');
      selectVars.push('?value');
      patterns.push(`?obs ?property ?value .`);
      patterns.push(`FILTER(?property != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)`);
      patterns.push(`FILTER(?property != <https://cube.link/observedBy>)`);
    }

    const selectClause = selectVars.length > 0 ? selectVars.join(' ') : '*';

    return `SELECT ${selectClause} WHERE {
  ${patterns.join('\n  ')}
}
LIMIT 10000`;
  };

  const handleCreateDashboard = async () => {
    if (selectedCubes.length === 0) {
      setError('Please select at least one cube');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const dashboardTitle = `LINDAS Data (${timestamp})`;

      const panels = selectedCubes.map((cube, index) => {
        const query = generateTabularQuery(cube);

        // Create column labels from dimension/measure names
        const fieldConfig: any = {
          defaults: {},
          overrides: [],
        };

        // Add display name overrides for each field
        cube.dimensions.forEach((dim, i) => {
          fieldConfig.overrides.push({
            matcher: { id: 'byName', options: `dim${i}` },
            properties: [{ id: 'displayName', value: dim.label }],
          });
        });
        cube.measures.forEach((measure, i) => {
          fieldConfig.overrides.push({
            matcher: { id: 'byName', options: `measure${i}` },
            properties: [{ id: 'displayName', value: measure.label }],
          });
        });

        return {
          id: index + 1,
          type: 'table',
          title: cube.label,
          gridPos: { x: 0, y: index * 12, w: 24, h: 12 },
          datasource: {
            type: 'flandersmake-sparql-datasource',
            uid: 'lindas-datasource',
          },
          targets: [{
            refId: 'A',
            queryText: query,
            format: 'table',
          }],
          options: {
            showHeader: true,
            cellHeight: 'sm',
          },
          fieldConfig,
        };
      });

      const dashboard = {
        title: dashboardTitle,
        tags: ['lindas', 'auto-generated'],
        timezone: 'browser',
        schemaVersion: 38,
        panels,
        annotations: { list: [] },
        templating: { list: [] },
        time: { from: 'now-6h', to: 'now' },
        refresh: '',
      };

      const response = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        message: 'Created from LINDAS cubes',
        overwrite: false,
      });

      // Open the new dashboard
      window.open(`/d/${response.uid}`, '_blank');

    } catch (err: any) {
      setError('Failed to create dashboard: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>LINDAS Dataset Import</h1>
        <p>Select datasets from LINDAS, then create a dashboard. Use Grafana's panel editor to customize visualizations.</p>
      </div>

      {error && (
        <Alert title="Error" severity="error" onRemove={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className={styles.mainContent}>
        {/* Left: Search and Results */}
        <div className={styles.searchPanel}>
          <h3>Search LINDAS Datasets</h3>
          <div className={styles.searchBox}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name..."
              className={styles.searchInput}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Spinner size="sm" /> : 'Search'}
            </Button>
          </div>

          <div className={styles.resultsList}>
            {searchResults.length === 0 && !searching && (
              <p className={styles.hint}>Enter a search term or click Search to browse all datasets</p>
            )}
            {searchResults.map((cube) => (
              <div
                key={cube.iri}
                className={`${styles.resultItem} ${selectedCubes.find(c => c.iri === cube.iri) ? styles.resultItemSelected : ''}`}
                onClick={() => handleSelectCube(cube)}
              >
                <div className={styles.resultTitle}>{cube.label}</div>
                {cube.description && (
                  <div className={styles.resultDesc}>{cube.description.slice(0, 100)}...</div>
                )}
                {cube.publisher && (
                  <div className={styles.resultMeta}>{cube.publisher}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Cubes */}
        <div className={styles.selectedPanel}>
          <h3>Selected Datasets ({selectedCubes.length})</h3>

          {loading && (
            <div className={styles.loadingBox}>
              <Spinner /> Loading cube metadata...
            </div>
          )}

          <div className={styles.selectedList}>
            {selectedCubes.map((cube) => (
              <div key={cube.iri} className={styles.selectedItem}>
                <div className={styles.selectedHeader}>
                  <span className={styles.selectedTitle}>{cube.label}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveCube(cube.iri)}
                  >
                    <Icon name="times" />
                  </button>
                </div>
                <div className={styles.selectedMeta}>
                  {cube.dimensions.length} dimensions, {cube.measures.length} measures
                </div>
                <div className={styles.fieldList}>
                  <strong>Columns:</strong> {[...cube.dimensions, ...cube.measures].map(f => f.label).join(', ')}
                </div>
              </div>
            ))}
          </div>

          {selectedCubes.length > 0 && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateDashboard}
              disabled={creating}
              className={styles.createBtn}
            >
              {creating ? <><Spinner size="sm" /> Creating...</> : 'Create Dashboard'}
            </Button>
          )}

          {selectedCubes.length === 0 && (
            <p className={styles.hint}>
              Select datasets from the left panel. Each will become a table panel in the dashboard.
              You can then change the visualization type in Grafana's panel editor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(3)};
    height: 100%;
    display: flex;
    flex-direction: column;
  `,
  header: css`
    margin-bottom: ${theme.spacing(3)};
    h1 {
      margin: 0 0 ${theme.spacing(1)} 0;
    }
    p {
      color: ${theme.colors.text.secondary};
      margin: 0;
    }
  `,
  mainContent: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(3)};
    flex: 1;
    min-height: 0;
  `,
  searchPanel: css`
    display: flex;
    flex-direction: column;
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(2)};
    h3 {
      margin: 0 0 ${theme.spacing(2)} 0;
    }
  `,
  searchBox: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
  `,
  searchInput: css`
    flex: 1;
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    &:focus {
      outline: none;
      border-color: ${theme.colors.primary.main};
    }
  `,
  resultsList: css`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  resultItem: css`
    padding: ${theme.spacing(1.5)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    cursor: pointer;
    &:hover {
      border-color: ${theme.colors.primary.main};
    }
  `,
  resultItemSelected: css`
    border-color: ${theme.colors.primary.main};
    background: ${theme.colors.action.selected};
  `,
  resultTitle: css`
    font-weight: ${theme.typography.fontWeightMedium};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  resultDesc: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  resultMeta: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.disabled};
  `,
  selectedPanel: css`
    display: flex;
    flex-direction: column;
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(2)};
    h3 {
      margin: 0 0 ${theme.spacing(2)} 0;
    }
  `,
  selectedList: css`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
  `,
  selectedItem: css`
    padding: ${theme.spacing(1.5)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
  `,
  selectedHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(0.5)};
  `,
  selectedTitle: css`
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  removeBtn: css`
    background: none;
    border: none;
    cursor: pointer;
    color: ${theme.colors.text.secondary};
    padding: ${theme.spacing(0.5)};
    &:hover {
      color: ${theme.colors.error.main};
    }
  `,
  selectedMeta: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  fieldList: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.disabled};
    word-break: break-word;
  `,
  createBtn: css`
    width: 100%;
  `,
  hint: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    text-align: center;
    padding: ${theme.spacing(2)};
  `,
  loadingBox: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
  `,
});
