/**
 * Dataset Catalog Scene
 *
 * A SceneObject that displays the LINDAS dataset catalog.
 * Users can browse/search datasets and click to open the Visual Builder.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  SceneObjectBase,
  SceneObjectState,
  SceneComponentProps,
} from '@grafana/scenes';
import {
  useStyles2,
  Input,
  Icon,
  Spinner,
  Alert,
  Button,
  Card,
  LinkButton,
  RadioButtonGroup,
} from '@grafana/ui';
import { locationService } from '@grafana/runtime';

import { fetchDatasets, Dataset, Language } from '../sparql';
import { PLUGIN_BASE_URL, LANGUAGES, LanguageValue } from '../constants';

// ============================================================================
// Scene State
// ============================================================================

export interface DatasetCatalogSceneState extends SceneObjectState {
  language?: LanguageValue;
}

// ============================================================================
// Scene Object
// ============================================================================

export class DatasetCatalogScene extends SceneObjectBase<DatasetCatalogSceneState> {
  static Component = DatasetCatalogRenderer;

  constructor(state: Partial<DatasetCatalogSceneState>) {
    super({
      language: 'de',
      ...state,
    });
  }

  setLanguage(lang: LanguageValue) {
    this.setState({ language: lang });
  }

  navigateToBuilder(cubeUri: string) {
    const encodedUri = encodeURIComponent(cubeUri);
    locationService.push(`${PLUGIN_BASE_URL}/builder/${encodedUri}`);
  }
}

// ============================================================================
// React Component
// ============================================================================

function DatasetCatalogRenderer({ model }: SceneComponentProps<DatasetCatalogScene>) {
  const styles = useStyles2(getStyles);
  const { language = 'de' } = model.useState();

  const [searchTerm, setSearchTerm] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load datasets when search term or language changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchDatasets(language as Language, searchTerm);
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

  const handleSelect = useCallback((dataset: Dataset) => {
    model.navigateToBuilder(dataset.uri);
  }, [model]);

  const handleLanguageChange = useCallback((value: LanguageValue) => {
    model.setLanguage(value);
  }, [model]);

  const languageOptions: Array<SelectableValue<LanguageValue>> = LANGUAGES.map(l => ({
    label: l.label,
    value: l.value,
    description: l.description,
  }));

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
              options={languageOptions}
              value={language}
              onChange={handleLanguageChange}
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
                    icon="chart-line"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(dataset);
                    }}
                  >
                    Visualize
                  </Button>
                </Card.Actions>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

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
