/**
 * LINDAS Dataset Catalog
 *
 * A simple, clean interface for browsing Swiss Open Data datasets.
 * Click a dataset to create a Grafana dashboard for visualization.
 *
 * Design Philosophy:
 * - Simple card grid, not a complex multi-panel layout
 * - One-click dashboard creation
 * - Let Grafana handle visualization via native panel editing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { AppRootProps, GrafanaTheme2 } from '@grafana/data';
import {
  useStyles2,
  Input,
  Icon,
  Spinner,
  Alert,
  Button,
  Card,
  LinkButton,
} from '@grafana/ui';
import { getBackendSrv, locationService } from '@grafana/runtime';
import type { Dataset, SparqlResult } from '../types';

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

/**
 * SPARQL query to get cubes from LINDAS
 */
const CUBES_QUERY = `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT DISTINCT ?cube ?label ?description ?publisher WHERE {
  ?cube a cube:Cube .

  # Get label with language preference
  OPTIONAL { ?cube schema:name ?labelDe . FILTER(LANG(?labelDe) = "de") }
  OPTIONAL { ?cube schema:name ?labelEn . FILTER(LANG(?labelEn) = "en") }
  OPTIONAL { ?cube schema:name ?labelAny . FILTER(LANG(?labelAny) = "") }
  BIND(COALESCE(?labelDe, ?labelEn, ?labelAny, STR(?cube)) AS ?label)

  # Get description
  OPTIONAL { ?cube schema:description ?descDe . FILTER(LANG(?descDe) = "de") }
  OPTIONAL { ?cube schema:description ?descEn . FILTER(LANG(?descEn) = "en") }
  BIND(COALESCE(?descDe, ?descEn, "") AS ?description)

  # Get publisher
  OPTIONAL {
    ?cube dcterms:creator ?creatorIri .
    ?creatorIri schema:name ?publisherName .
  }
  BIND(COALESCE(?publisherName, "") AS ?publisher)

  # Only cubes with actual observations
  FILTER EXISTS { ?cube cube:observationSet/cube:observation ?obs }
}
ORDER BY ?label
LIMIT 200
`;

/**
 * Execute SPARQL query against LINDAS
 * Uses the datasource proxy to avoid CORS issues
 */
async function fetchDatasets(searchTerm: string = ''): Promise<Dataset[]> {
  try {
    // Get datasource info first
    const datasources = await getBackendSrv().get('/api/datasources');
    const lindasDs = datasources.find((ds: any) => ds.type === 'lindas-datasource');

    if (!lindasDs) {
      // Fallback: direct query (may fail due to CORS in some environments)
      return await directQuery(searchTerm);
    }

    // Use datasource proxy
    const response = await getBackendSrv().post(
      `/api/datasources/proxy/${lindasDs.id}`,
      `query=${encodeURIComponent(CUBES_QUERY)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json',
        },
      }
    );

    return parseResults(response, searchTerm);
  } catch (error) {
    console.error('Failed to fetch via proxy, trying direct:', error);
    return await directQuery(searchTerm);
  }
}

/**
 * Direct SPARQL query (fallback)
 */
async function directQuery(searchTerm: string): Promise<Dataset[]> {
  const response = await fetch(LINDAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
    },
    body: `query=${encodeURIComponent(CUBES_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`SPARQL query failed: ${response.status}`);
  }

  const result: SparqlResult = await response.json();
  return parseResults(result, searchTerm);
}

/**
 * Parse SPARQL results into Dataset array
 */
function parseResults(result: SparqlResult, searchTerm: string): Dataset[] {
  const datasets = result.results.bindings.map((binding) => ({
    uri: binding.cube?.value || '',
    label: binding.label?.value || 'Unknown',
    description: binding.description?.value || undefined,
    publisher: binding.publisher?.value || undefined,
  }));

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    return datasets.filter(
      (d) =>
        d.label.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term) ||
        d.publisher?.toLowerCase().includes(term)
    );
  }

  return datasets;
}

/**
 * Create a dashboard with a panel configured for the dataset
 * Uses Grafana's backend service to ensure proper session auth
 */
async function createDashboard(dataset: Dataset): Promise<string> {
  const dashboard = {
    title: dataset.label,
    tags: ['lindas', 'swiss-data'],
    timezone: 'browser',
    schemaVersion: 38,
    panels: [
      {
        id: 1,
        type: 'table',
        title: dataset.label,
        gridPos: { x: 0, y: 0, w: 24, h: 12 },
        datasource: {
          type: 'lindas-datasource',
          uid: 'lindas-datasource',
        },
        targets: [
          {
            refId: 'A',
            cubeUri: dataset.uri,
            cubeLabel: dataset.label,
            limit: 1000,
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
    annotations: {
      list: [],
    },
    templating: {
      list: [],
    },
  };

  // Use Grafana's backend service - this uses the current session auth
  const result = await getBackendSrv().post('/api/dashboards/db', {
    dashboard,
    folderUid: '',
    message: `Created from LINDAS dataset: ${dataset.label}`,
    overwrite: true,
  });

  return result.uid;
}

/**
 * Main Dataset Catalog Component
 */
export const DatasetCatalog: React.FC<AppRootProps> = () => {
  const styles = useStyles2(getStyles);
  const [searchTerm, setSearchTerm] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  // Load datasets
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchDatasets(searchTerm);
        if (!cancelled) {
          setDatasets(results);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load datasets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const debounce = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [searchTerm]);

  // Handle dataset selection
  const handleSelect = useCallback(async (dataset: Dataset) => {
    setCreating(dataset.uri);
    setError(null);
    try {
      const uid = await createDashboard(dataset);
      locationService.push(`/d/${uid}`);
    } catch (err: any) {
      setError(`Failed to create dashboard: ${err.message}`);
      setCreating(null);
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Swiss Open Data</h1>
          <p className={styles.subtitle}>
            Browse and visualize datasets from LINDAS
          </p>
        </div>
        <LinkButton
          href="https://lindas.admin.ch"
          target="_blank"
          variant="secondary"
          icon="external-link-alt"
        >
          About LINDAS
        </LinkButton>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <Input
          prefix={<Icon name="search" />}
          placeholder="Search datasets by name, description, or publisher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Error */}
      {error && (
        <Alert title="Error" severity="error" onRemove={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="xl" />
          <p>Loading datasets from LINDAS...</p>
        </div>
      ) : datasets.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Icon name="database" size="xxxl" className={styles.emptyIcon} />
          <h2>No datasets found</h2>
          <p>Try a different search term</p>
        </div>
      ) : (
        <>
          <div className={styles.resultsCount}>
            {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} found
          </div>
          <div className={styles.grid}>
            {datasets.map((dataset) => (
              <Card
                key={dataset.uri}
                className={styles.card}
                onClick={() => handleSelect(dataset)}
                isSelected={creating === dataset.uri}
              >
                <Card.Heading>{dataset.label}</Card.Heading>
                {dataset.publisher && (
                  <Card.Meta>
                    <span className={styles.publisher}>
                      <Icon name="building" size="sm" /> {dataset.publisher}
                    </span>
                  </Card.Meta>
                )}
                {dataset.description && (
                  <Card.Description className={styles.description}>
                    {dataset.description.length > 150
                      ? dataset.description.slice(0, 150) + '...'
                      : dataset.description}
                  </Card.Description>
                )}
                <Card.Actions>
                  <Button
                    size="sm"
                    icon={creating === dataset.uri ? undefined : 'plus'}
                    disabled={!!creating}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(dataset);
                    }}
                  >
                    {creating === dataset.uri ? (
                      <>
                        <Spinner inline size="sm" /> Creating...
                      </>
                    ) : (
                      'Create Dashboard'
                    )}
                  </Button>
                </Card.Actions>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Styles
 */
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(3)};
    max-width: 1400px;
    margin: 0 auto;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${theme.spacing(3)};
  `,
  title: css`
    margin: 0;
    font-size: ${theme.typography.h2.fontSize};
  `,
  subtitle: css`
    margin: ${theme.spacing(0.5)} 0 0 0;
    color: ${theme.colors.text.secondary};
  `,
  searchContainer: css`
    margin-bottom: ${theme.spacing(3)};
  `,
  searchInput: css`
    max-width: 600px;
  `,
  resultsCount: css`
    margin-bottom: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: ${theme.spacing(2)};
  `,
  card: css`
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.z3};
    }
  `,
  publisher: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
    color: ${theme.colors.text.secondary};
  `,
  description: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  loadingContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(8)};
    color: ${theme.colors.text.secondary};
    gap: ${theme.spacing(2)};
  `,
  emptyContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(8)};
    color: ${theme.colors.text.secondary};
    text-align: center;

    h2 {
      margin: ${theme.spacing(2)} 0 ${theme.spacing(1)} 0;
    }

    p {
      margin: 0;
    }
  `,
  emptyIcon: css`
    color: ${theme.colors.text.disabled};
  `,
});

export default DatasetCatalog;
