/**
 * Visual Builder - Simplified for Non-Technical Users
 *
 * A step-by-step wizard to create visualizations from LINDAS datasets.
 * Uses plain language and visual cues instead of technical terminology.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  useStyles2,
  Button,
  Spinner,
  Alert,
  Icon,
  RadioButtonGroup,
  Card,
  IconName,
} from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';

import {
  fetchCubeMetadata,
  CubeMetadata,
  Language,
} from '../sparql';
import {
  LANGUAGES,
  LanguageValue,
} from '../constants';

// ============================================================================
// Types
// ============================================================================

interface VisualBuilderContentProps {
  cubeUri: string;
}

interface ChartOption {
  id: string;
  label: string;
  description: string;
  icon: IconName;
  panelType: string;
  panelOptions?: Record<string, any>;
}

// ============================================================================
// Chart Options - Visual and User-Friendly
// ============================================================================

const CHART_OPTIONS: ChartOption[] = [
  {
    id: 'bar',
    label: 'Bar Chart',
    description: 'Compare values side by side',
    icon: 'graph-bar',
    panelType: 'barchart',
    panelOptions: { orientation: 'horizontal' },
  },
  {
    id: 'timeseries',
    label: 'Line Chart',
    description: 'Show trends over time',
    icon: 'chart-line',
    panelType: 'timeseries',
  },
  {
    id: 'pie',
    label: 'Pie Chart',
    description: 'Show proportions of a whole',
    icon: 'circle',
    panelType: 'piechart',
  },
  {
    id: 'stat',
    label: 'Big Number',
    description: 'Highlight a single value',
    icon: 'calculator-alt',
    panelType: 'stat',
  },
  {
    id: 'table',
    label: 'Data Table',
    description: 'View all data in rows and columns',
    icon: 'table',
    panelType: 'table',
  },
  {
    id: 'gauge',
    label: 'Gauge',
    description: 'Show progress toward a goal',
    icon: 'dashboard',
    panelType: 'gauge',
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const VisualBuilderContent: React.FC<VisualBuilderContentProps> = ({ cubeUri }) => {
  const styles = useStyles2(getStyles);

  // State
  const [language, setLanguage] = useState<LanguageValue>('de');
  const [metadata, setMetadata] = useState<CubeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // User selections - using friendly names
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedGrouping, setSelectedGrouping] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>('bar');

  // Load metadata
  useEffect(() => {
    if (!cubeUri) {
      setError('No dataset selected');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCubeMetadata(cubeUri, language as Language)
      .then((meta) => {
        if (cancelled) return;
        setMetadata(meta);

        // Auto-select sensible defaults
        // Find a temporal dimension for category if available
        const temporalDim = meta.dimensions.find(d => d.dataKind === 'Temporal');
        const firstDim = meta.dimensions[0];
        const firstMeasure = meta.measures[0];

        if (!selectedCategory) {
          setSelectedCategory(temporalDim?.uri || firstDim?.uri || null);
        }
        if (!selectedValue && firstMeasure) {
          setSelectedValue(firstMeasure.uri);
        }
        // Auto-suggest time series if we have temporal data
        if (temporalDim && selectedChart === 'bar') {
          setSelectedChart('timeseries');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load metadata:', err);
        setError(err.message || 'Failed to load dataset');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [cubeUri, language]);

  // Build friendly options for dropdowns
  const categoryOptions = useMemo(() => {
    if (!metadata) return [];
    return metadata.dimensions.map(d => ({
      label: d.label,
      value: d.uri,
      description: d.dataKind === 'Temporal' ? 'Time' : undefined,
    }));
  }, [metadata]);

  const valueOptions = useMemo(() => {
    if (!metadata) return [];
    return metadata.measures.map(m => ({
      label: m.unit ? `${m.label} (${m.unit})` : m.label,
      value: m.uri,
    }));
  }, [metadata]);

  const groupingOptions = useMemo(() => {
    if (!metadata) return [];
    return [
      { label: 'No grouping', value: '', description: 'Show all data together' },
      ...metadata.dimensions
        .filter(d => d.uri !== selectedCategory)
        .map(d => ({
          label: d.label,
          value: d.uri,
        })),
    ];
  }, [metadata, selectedCategory]);

  const languageOptions: Array<SelectableValue<LanguageValue>> = LANGUAGES.map(l => ({
    label: l.label,
    value: l.value,
  }));

  // Handlers
  const handleBack = useCallback(() => {
    window.location.hash = '';
  }, []);

  const handleCreateDashboard = useCallback(async () => {
    if (!metadata || !selectedValue) return;

    setSaving(true);
    setError(null);

    const chartOption = CHART_OPTIONS.find(c => c.id === selectedChart) || CHART_OPTIONS[0];

    // Build SPARQL query for the panel
    const xAxisLabel = metadata.dimensions.find(d => d.uri === selectedCategory)?.label || 'Category';
    const yAxisLabel = metadata.measures.find(m => m.uri === selectedValue)?.label || 'Value';
    const groupLabel = selectedGrouping
      ? metadata.dimensions.find(d => d.uri === selectedGrouping)?.label
      : null;

    // Create dashboard with native Grafana panel
    const dashboard = {
      uid: null, // Let Grafana generate
      title: metadata.label,
      tags: ['lindas', 'swiss-open-data', 'auto-generated'],
      editable: true,
      panels: [
        {
          id: 1,
          type: chartOption.panelType,
          title: metadata.label,
          description: `Data from LINDAS: ${cubeUri}`,
          gridPos: { x: 0, y: 0, w: 24, h: 16 },
          datasource: { type: 'flandersmake-sparql-datasource', uid: 'lindas-sparql' },
          targets: [{
            refId: 'A',
            rawQuery: true,
            queryText: buildSparqlQuery(cubeUri, selectedCategory, selectedValue, selectedGrouping, language),
          }],
          options: chartOption.panelOptions || {},
          fieldConfig: {
            defaults: {
              displayName: yAxisLabel,
            },
            overrides: [],
          },
        },
      ],
      time: { from: 'now-5y', to: 'now' },
      refresh: '',
    };

    try {
      const result = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        overwrite: false,
      });

      // Redirect to the new dashboard
      window.location.href = `/d/${result.uid}?orgId=1`;
    } catch (err: any) {
      console.error('Failed to create dashboard:', err);
      setError(`Could not create dashboard: ${err.message || 'Unknown error'}`);
      setSaving(false);
    }
  }, [metadata, cubeUri, selectedCategory, selectedValue, selectedGrouping, selectedChart, language]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="xl" />
        <p>Loading dataset...</p>
      </div>
    );
  }

  // Error state
  if (error && !metadata) {
    return (
      <div className={styles.errorContainer}>
        <Alert title="Error" severity="error">
          {error}
          <div style={{ marginTop: 16 }}>
            <Button onClick={handleBack}>Back to Catalog</Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!metadata) return null;

  const canCreate = selectedCategory && selectedValue;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button variant="secondary" icon="arrow-left" onClick={handleBack} size="sm">
          Back
        </Button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{metadata.label}</h1>
          <p className={styles.subtitle}>Create a visualization in 3 simple steps</p>
        </div>
        <RadioButtonGroup
          options={languageOptions}
          value={language}
          onChange={setLanguage}
          size="sm"
        />
      </div>

      {error && (
        <Alert title="Error" severity="error" onRemove={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Wizard Steps */}
      <div className={styles.wizard}>
        {/* Step 1: What to compare */}
        <Card className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>1</span>
            <div>
              <h3 className={styles.stepTitle}>What do you want to compare?</h3>
              <p className={styles.stepDescription}>Choose the main category for your chart</p>
            </div>
          </div>
          <div className={styles.stepContent}>
            <div className={styles.optionGrid}>
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.optionButton} ${selectedCategory === opt.value ? styles.optionSelected : ''}`}
                  onClick={() => setSelectedCategory(opt.value)}
                >
                  <Icon name={opt.description === 'Time' ? 'clock-nine' : 'list-ul'} size="lg" />
                  <span>{opt.label}</span>
                  {opt.description && <small>{opt.description}</small>}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Step 2: What values */}
        <Card className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>2</span>
            <div>
              <h3 className={styles.stepTitle}>What values do you want to show?</h3>
              <p className={styles.stepDescription}>Choose the numbers to display</p>
            </div>
          </div>
          <div className={styles.stepContent}>
            <div className={styles.optionGrid}>
              {valueOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.optionButton} ${selectedValue === opt.value ? styles.optionSelected : ''}`}
                  onClick={() => setSelectedValue(opt.value)}
                >
                  <Icon name="calculator-alt" size="lg" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {valueOptions.length === 0 && (
              <p className={styles.noOptions}>This dataset has no numeric values to display.</p>
            )}
          </div>
        </Card>

        {/* Step 3: Visualization type */}
        <Card className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>3</span>
            <div>
              <h3 className={styles.stepTitle}>How do you want to see it?</h3>
              <p className={styles.stepDescription}>Pick a visualization style</p>
            </div>
          </div>
          <div className={styles.stepContent}>
            <div className={styles.chartGrid}>
              {CHART_OPTIONS.map((chart) => (
                <button
                  key={chart.id}
                  className={`${styles.chartButton} ${selectedChart === chart.id ? styles.chartSelected : ''}`}
                  onClick={() => setSelectedChart(chart.id)}
                >
                  <Icon name={chart.icon} size="xxl" />
                  <span className={styles.chartLabel}>{chart.label}</span>
                  <span className={styles.chartDesc}>{chart.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Optional: Grouping */}
        {groupingOptions.length > 1 && (
          <Card className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumberOptional}>+</span>
              <div>
                <h3 className={styles.stepTitle}>Split by category? (optional)</h3>
                <p className={styles.stepDescription}>Add colors to compare different groups</p>
              </div>
            </div>
            <div className={styles.stepContent}>
              <div className={styles.optionGrid}>
                {groupingOptions.map((opt) => (
                  <button
                    key={opt.value || 'none'}
                    className={`${styles.optionButton} ${styles.optionSmall} ${(selectedGrouping || '') === opt.value ? styles.optionSelected : ''}`}
                    onClick={() => setSelectedGrouping(opt.value || null)}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Create Button */}
        <div className={styles.createSection}>
          <Button
            variant="primary"
            size="lg"
            icon={saving ? undefined : 'plus'}
            onClick={handleCreateDashboard}
            disabled={!canCreate || saving}
            className={styles.createButton}
          >
            {saving ? (
              <>
                <Spinner inline size="sm" /> Creating...
              </>
            ) : (
              'Create Visualization'
            )}
          </Button>
          {!canCreate && (
            <p className={styles.createHint}>Please complete steps 1 and 2 to continue</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SPARQL Query Builder
// ============================================================================

function buildSparqlQuery(
  cubeUri: string,
  categoryUri: string | null,
  valueUri: string | null,
  groupUri: string | null,
  lang: string
): string {
  const prefixes = `PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>`;

  const selectVars = ['?category', '?value'];
  if (groupUri) selectVars.push('?grouping');

  const patterns = [`<${cubeUri}> cube:observationSet/cube:observation ?obs .`];

  if (categoryUri) {
    patterns.push(`?obs <${categoryUri}> ?categoryRaw .`);
    patterns.push(`OPTIONAL { ?categoryRaw schema:name ?categoryLabel . FILTER(LANG(?categoryLabel) = "${lang}") }`);
    patterns.push(`BIND(COALESCE(?categoryLabel, STR(?categoryRaw)) AS ?category)`);
  }

  if (valueUri) {
    patterns.push(`?obs <${valueUri}> ?value .`);
  }

  if (groupUri) {
    patterns.push(`?obs <${groupUri}> ?groupRaw .`);
    patterns.push(`OPTIONAL { ?groupRaw schema:name ?groupLabel . FILTER(LANG(?groupLabel) = "${lang}") }`);
    patterns.push(`BIND(COALESCE(?groupLabel, STR(?groupRaw)) AS ?grouping)`);
  }

  return `${prefixes}
SELECT ${selectVars.join(' ')} WHERE {
  ${patterns.join('\n  ')}
}
ORDER BY ?category`;
}

// ============================================================================
// Styles
// ============================================================================

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(3)};
    max-width: 1200px;
    margin: 0 auto;
  `,
  header: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(4)};
    flex-wrap: wrap;
  `,
  titleSection: css`
    flex: 1;
    min-width: 200px;
  `,
  title: css`
    margin: 0;
    font-size: ${theme.typography.h3.fontSize};
  `,
  subtitle: css`
    margin: ${theme.spacing(0.5)} 0 0 0;
    color: ${theme.colors.text.secondary};
  `,
  wizard: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
  `,
  stepCard: css`
    padding: ${theme.spacing(3)};
  `,
  stepHeader: css`
    display: flex;
    align-items: flex-start;
    gap: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(2)};
  `,
  stepNumber: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${theme.colors.primary.main};
    color: ${theme.colors.primary.contrastText};
    font-weight: ${theme.typography.fontWeightBold};
    flex-shrink: 0;
  `,
  stepNumberOptional: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${theme.colors.secondary.main};
    color: ${theme.colors.secondary.contrastText};
    font-weight: ${theme.typography.fontWeightBold};
    flex-shrink: 0;
  `,
  stepTitle: css`
    margin: 0;
    font-size: ${theme.typography.h5.fontSize};
  `,
  stepDescription: css`
    margin: ${theme.spacing(0.5)} 0 0 0;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  stepContent: css`
    margin-left: 48px;
  `,
  optionGrid: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
  `,
  optionButton: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(0.5)};
    padding: ${theme.spacing(2)};
    min-width: 140px;
    border: 2px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.primary};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: ${theme.colors.primary.border};
      background: ${theme.colors.action.hover};
    }

    span {
      font-weight: ${theme.typography.fontWeightMedium};
    }

    small {
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.size.xs};
    }
  `,
  optionSmall: css`
    min-width: 100px;
    padding: ${theme.spacing(1.5)};
  `,
  optionSelected: css`
    border-color: ${theme.colors.primary.main};
    background: ${theme.colors.primary.transparent};

    &:hover {
      border-color: ${theme.colors.primary.main};
      background: ${theme.colors.primary.transparent};
    }
  `,
  chartGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: ${theme.spacing(2)};
  `,
  chartButton: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(3)} ${theme.spacing(2)};
    border: 2px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.primary};
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &:hover {
      border-color: ${theme.colors.primary.border};
      background: ${theme.colors.action.hover};
      transform: translateY(-2px);
    }

    svg {
      color: ${theme.colors.text.secondary};
    }
  `,
  chartSelected: css`
    border-color: ${theme.colors.primary.main};
    background: ${theme.colors.primary.transparent};

    svg {
      color: ${theme.colors.primary.main};
    }

    &:hover {
      border-color: ${theme.colors.primary.main};
      background: ${theme.colors.primary.transparent};
    }
  `,
  chartLabel: css`
    font-weight: ${theme.typography.fontWeightMedium};
    font-size: ${theme.typography.size.md};
  `,
  chartDesc: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.xs};
  `,
  noOptions: css`
    color: ${theme.colors.text.secondary};
    font-style: italic;
  `,
  createSection: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(4)} 0;
  `,
  createButton: css`
    padding: ${theme.spacing(2)} ${theme.spacing(6)};
    font-size: ${theme.typography.size.lg};
  `,
  createHint: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  loading: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(8)};
    color: ${theme.colors.text.secondary};
    gap: ${theme.spacing(2)};
  `,
  errorContainer: css`
    padding: ${theme.spacing(4)};
    max-width: 600px;
    margin: 0 auto;
  `,
});

export default VisualBuilderContent;
