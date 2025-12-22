/**
 * LINDAS Dataset Catalog
 *
 * A simple, clean interface for browsing Swiss Open Data datasets.
 * Click a dataset to create a Grafana dashboard for visualization.
 *
 * Design Philosophy:
 * - Simple card grid, not a complex multi-panel layout
 * - One-click dashboard creation with template (instructions + histogram)
 * - Let Grafana handle visualization via native panel editing
 * - Multi-language support (DE, FR, IT, EN)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { AppRootProps, GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  useStyles2,
  Input,
  Icon,
  Spinner,
  Alert,
  Button,
  Card,
  LinkButton,
  Select,
  RadioButtonGroup,
} from '@grafana/ui';
import { getBackendSrv, locationService } from '@grafana/runtime';
import type { Dataset, SparqlResult } from '../types';

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

/** Available languages for dataset labels */
type Language = 'de' | 'fr' | 'it' | 'en';

const LANGUAGE_OPTIONS: Array<SelectableValue<Language>> = [
  { label: 'DE', value: 'de', description: 'Deutsch' },
  { label: 'FR', value: 'fr', description: 'Francais' },
  { label: 'IT', value: 'it', description: 'Italiano' },
  { label: 'EN', value: 'en', description: 'English' },
];

/**
 * Generate SPARQL query for cubes with language preference
 */
function getCubesQuery(lang: Language): string {
  // Language priority: selected language first, then fallbacks
  const langPriority = {
    de: ['de', 'en', 'fr', 'it'],
    fr: ['fr', 'de', 'en', 'it'],
    it: ['it', 'de', 'fr', 'en'],
    en: ['en', 'de', 'fr', 'it'],
  };
  const langs = langPriority[lang];

  return `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT DISTINCT ?cube ?label ?description ?publisher WHERE {
  ?cube a cube:Cube .

  # Get label with language preference (${lang} first)
  OPTIONAL { ?cube schema:name ?label0 . FILTER(LANG(?label0) = "${langs[0]}") }
  OPTIONAL { ?cube schema:name ?label1 . FILTER(LANG(?label1) = "${langs[1]}") }
  OPTIONAL { ?cube schema:name ?label2 . FILTER(LANG(?label2) = "${langs[2]}") }
  OPTIONAL { ?cube schema:name ?label3 . FILTER(LANG(?label3) = "${langs[3]}") }
  OPTIONAL { ?cube schema:name ?labelAny . FILTER(LANG(?labelAny) = "") }
  BIND(COALESCE(?label0, ?label1, ?label2, ?label3, ?labelAny, STR(?cube)) AS ?label)

  # Get description with language preference
  OPTIONAL { ?cube schema:description ?desc0 . FILTER(LANG(?desc0) = "${langs[0]}") }
  OPTIONAL { ?cube schema:description ?desc1 . FILTER(LANG(?desc1) = "${langs[1]}") }
  OPTIONAL { ?cube schema:description ?desc2 . FILTER(LANG(?desc2) = "${langs[2]}") }
  OPTIONAL { ?cube schema:description ?desc3 . FILTER(LANG(?desc3) = "${langs[3]}") }
  BIND(COALESCE(?desc0, ?desc1, ?desc2, ?desc3, "") AS ?description)

  # Get publisher with language preference
  OPTIONAL {
    ?cube dcterms:creator ?creatorIri .
    OPTIONAL { ?creatorIri schema:name ?pub0 . FILTER(LANG(?pub0) = "${langs[0]}") }
    OPTIONAL { ?creatorIri schema:name ?pub1 . FILTER(LANG(?pub1) = "${langs[1]}") }
    OPTIONAL { ?creatorIri schema:name ?pub2 . FILTER(LANG(?pub2) = "${langs[2]}") }
    OPTIONAL { ?creatorIri schema:name ?pub3 . FILTER(LANG(?pub3) = "${langs[3]}") }
    OPTIONAL { ?creatorIri schema:name ?pubAny . FILTER(LANG(?pubAny) = "") }
  }
  BIND(COALESCE(?pub0, ?pub1, ?pub2, ?pub3, ?pubAny, "") AS ?publisher)

  # Only cubes with actual observations
  FILTER EXISTS { ?cube cube:observationSet/cube:observation ?obs }
}
ORDER BY ?label
LIMIT 200
`;
}

/**
 * Execute SPARQL query against LINDAS
 * Uses the datasource proxy to avoid CORS issues
 */
async function fetchDatasets(searchTerm: string = '', lang: Language = 'de'): Promise<Dataset[]> {
  const query = getCubesQuery(lang);

  try {
    // Get datasource info first
    const datasources = await getBackendSrv().get('/api/datasources');
    const lindasDs = datasources.find((ds: any) => ds.type === 'lindas-datasource');

    if (!lindasDs) {
      // Fallback: direct query (may fail due to CORS in some environments)
      return await directQuery(searchTerm, lang);
    }

    // Use datasource proxy
    const response = await getBackendSrv().post(
      `/api/datasources/proxy/${lindasDs.id}`,
      `query=${encodeURIComponent(query)}`,
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
    return await directQuery(searchTerm, lang);
  }
}

/**
 * Direct SPARQL query (fallback)
 */
async function directQuery(searchTerm: string, lang: Language): Promise<Dataset[]> {
  const query = getCubesQuery(lang);

  const response = await fetch(LINDAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
    },
    body: `query=${encodeURIComponent(query)}`,
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
 * Instructions text for the dashboard template
 */
const DASHBOARD_INSTRUCTIONS = `
# How to Customize Your Dashboard

Welcome to your new Swiss Open Data dashboard! Here's how to make it your own:

## Adding New Panels

1. Click the **"Add"** button in the top menu bar
2. Select **"Visualization"** to add a new panel
3. The LINDAS datasource is already configured - just select your dataset

## Editing Panels

1. **Hover** over any panel and click the **title** to open the menu
2. Select **"Edit"** to modify the visualization
3. In the panel editor:
   - **Query tab**: Change the dataset or limit
   - **Panel options**: Change title, description
   - **Visualization**: Switch between Table, Bar chart, Pie chart, etc.

## Visualization Types

- **Table**: Best for exploring raw data
- **Bar chart**: Compare values across categories
- **Time series**: Show trends over time
- **Stat**: Display a single important number
- **Pie chart**: Show proportions

## Tips

- Use **Ctrl+S** (or Cmd+S) to save your dashboard
- Click the **floppy disk icon** in the top right to save
- Use **Variables** (gear icon > Variables) to make interactive filters

---
*This panel can be deleted once you're familiar with the dashboard.*
`;

/**
 * Create a dashboard with template panels:
 * 1. Instructions panel at top
 * 2. Bar chart (histogram) showing the data
 * 3. Table panel for raw data exploration
 */
async function createDashboard(dataset: Dataset): Promise<string> {
  const dashboard = {
    title: dataset.label,
    tags: ['lindas', 'swiss-data'],
    timezone: 'browser',
    schemaVersion: 38,
    panels: [
      // Instructions panel at top
      {
        id: 1,
        type: 'text',
        title: 'Getting Started',
        gridPos: { x: 0, y: 0, w: 24, h: 8 },
        options: {
          mode: 'markdown',
          content: DASHBOARD_INSTRUCTIONS,
        },
      },
      // Bar chart (histogram) panel
      {
        id: 2,
        type: 'barchart',
        title: `${dataset.label} - Bar Chart`,
        gridPos: { x: 0, y: 8, w: 24, h: 10 },
        datasource: {
          type: 'lindas-datasource',
          uid: 'lindas-datasource',
        },
        targets: [
          {
            refId: 'A',
            cubeUri: dataset.uri,
            cubeLabel: dataset.label,
            limit: 100,
          },
        ],
        options: {
          orientation: 'horizontal',
          showValue: 'auto',
          stacking: 'none',
          groupWidth: 0.7,
          barWidth: 0.97,
          legend: {
            displayMode: 'list',
            placement: 'bottom',
            showLegend: true,
          },
          tooltip: {
            mode: 'single',
            sort: 'none',
          },
        },
        fieldConfig: {
          defaults: {
            color: {
              mode: 'palette-classic',
            },
            custom: {
              axisCenteredZero: false,
              axisColorMode: 'text',
              axisLabel: '',
              axisPlacement: 'auto',
              fillOpacity: 80,
              gradientMode: 'none',
              hideFrom: {
                legend: false,
                tooltip: false,
                viz: false,
              },
              lineWidth: 1,
              scaleDistribution: {
                type: 'linear',
              },
            },
          },
          overrides: [],
        },
      },
      // Data table panel
      {
        id: 3,
        type: 'table',
        title: `${dataset.label} - Data Table`,
        gridPos: { x: 0, y: 18, w: 24, h: 10 },
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
          footer: {
            show: true,
            reducer: ['count'],
            fields: '',
          },
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
  const [language, setLanguage] = useState<Language>('de');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  // Load datasets when search term or language changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchDatasets(searchTerm, language);
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
  }, [searchTerm, language]);

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
        <div className={styles.headerActions}>
          <div className={styles.languageSelector}>
            <span className={styles.languageLabel}>Language:</span>
            <RadioButtonGroup
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={(v) => setLanguage(v)}
              size="sm"
            />
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
    flex-wrap: wrap;
    gap: ${theme.spacing(2)};
  `,
  headerActions: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    flex-wrap: wrap;
  `,
  languageSelector: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  languageLabel: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
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
