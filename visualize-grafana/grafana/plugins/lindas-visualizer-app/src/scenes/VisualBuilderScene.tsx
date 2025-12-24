/**
 * Visual Builder Content
 *
 * React component for the visualization builder with split layout.
 * Used within SceneReactObject for Scenes SDK integration.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue, DataFrame } from '@grafana/data';
import {
  useStyles2,
  Button,
  Spinner,
  Alert,
  Icon,
  Field,
  Select,
  RadioButtonGroup,
  Card,
  Collapse,
} from '@grafana/ui';
import { locationService, getBackendSrv } from '@grafana/runtime';

import {
  fetchCubeMetadata,
  fetchDimensionValues,
  fetchCubeData,
  CubeMetadata,
  CubeDimension,
  Language,
  ChartConfig,
} from '../sparql';
import {
  PLUGIN_BASE_URL,
  LINDAS_DATASOURCE_UID,
  CHART_TYPES,
  CHART_TO_PANEL,
  LANGUAGES,
  ROW_LIMITS,
  ChartTypeValue,
  LanguageValue,
} from '../constants';
import { ChartPreview, ChartType } from '../components/ChartPreview';

// ============================================================================
// Types
// ============================================================================

interface VisualBuilderContentProps {
  cubeUri: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const VisualBuilderContent: React.FC<VisualBuilderContentProps> = ({ cubeUri }) => {
  const styles = useStyles2(getStyles);

  // Configuration state
  const [language, setLanguage] = useState<LanguageValue>('de');
  const [chartType, setChartType] = useState<ChartTypeValue>('columns');
  const [xAxis, setXAxis] = useState<string | null>(null);
  const [yAxis, setYAxis] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [limit, setLimit] = useState(100);

  // Runtime state
  const [metadata, setMetadata] = useState<CubeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DataFrame | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Load metadata on mount or language change
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
        // Auto-select first dimension and measure
        if (!xAxis && meta.dimensions.length > 0) {
          setXAxis(meta.dimensions[0].uri);
        }
        if (!yAxis && meta.measures.length > 0) {
          setYAxis(meta.measures[0].uri);
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

  // Fetch data when config changes
  useEffect(() => {
    if (!metadata || (!xAxis && !yAxis)) {
      setData(null);
      return;
    }

    const config: ChartConfig = {
      cubeUri,
      xAxis,
      yAxis,
      groupBy,
      filters,
      limit,
    };

    let cancelled = false;
    setDataLoading(true);
    setDataError(null);

    const timeout = setTimeout(() => {
      fetchCubeData(config, metadata, language as Language)
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch((err) => {
          if (!cancelled) {
            console.error('Failed to fetch data:', err);
            setDataError(err.message || 'Failed to load data');
          }
        })
        .finally(() => {
          if (!cancelled) setDataLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [cubeUri, xAxis, yAxis, groupBy, filters, limit, metadata, language]);

  // Build dropdown options
  const dimensionOptions: Array<SelectableValue<string>> = useMemo(() => {
    if (!metadata) return [];
    return [
      { label: '-- None --', value: '' },
      ...metadata.dimensions.map(d => ({
        label: d.label,
        value: d.uri,
        description: d.dataKind === 'Temporal' ? 'Time dimension' : undefined,
      })),
    ];
  }, [metadata]);

  const measureOptions: Array<SelectableValue<string>> = useMemo(() => {
    if (!metadata) return [];
    return [
      { label: '-- None --', value: '' },
      ...metadata.measures.map(m => ({
        label: m.unit ? `${m.label} (${m.unit})` : m.label,
        value: m.uri,
      })),
    ];
  }, [metadata]);

  const chartTypeOptions: Array<SelectableValue<ChartTypeValue>> = CHART_TYPES.map(t => ({
    label: t.label,
    value: t.value,
    icon: t.icon,
  }));

  const languageOptions: Array<SelectableValue<LanguageValue>> = LANGUAGES.map(l => ({
    label: l.label,
    value: l.value,
    description: l.description,
  }));

  const limitOptions: Array<SelectableValue<number>> = ROW_LIMITS.map(l => ({
    label: l.label,
    value: l.value,
  }));

  // Handlers
  const handleBack = useCallback(() => {
    locationService.push(PLUGIN_BASE_URL);
  }, []);

  const handleSaveDashboard = useCallback(async () => {
    if (!metadata) return;

    const panelType = CHART_TO_PANEL[chartType] || 'table';

    const dashboard = {
      uid: `lindas-${Date.now().toString(36)}`,
      title: metadata.label,
      tags: ['lindas', 'swiss-open-data'],
      editable: true,
      panels: [
        {
          id: 1,
          type: panelType,
          title: metadata.label,
          gridPos: { x: 0, y: 0, w: 24, h: 14 },
          datasource: { type: 'lindas-datasource', uid: LINDAS_DATASOURCE_UID },
          targets: [{
            refId: 'A',
            cubeUri,
            xAxis,
            yAxis,
            groupBy,
            limit,
          }],
          options: chartType === 'bars' ? { orientation: 'horizontal' } : {},
        },
      ],
    };

    try {
      const result = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        overwrite: false,
      });
      locationService.push(`/d/${result.uid}`);
    } catch (err: any) {
      console.error('Failed to save dashboard:', err);
      setError(`Failed to save: ${err.message}`);
    }
  }, [metadata, chartType, cubeUri, xAxis, yAxis, groupBy, limit]);

  const handleCopyLink = useCallback(() => {
    const params = new URLSearchParams();
    params.set('chart', chartType);
    if (xAxis) params.set('x', xAxis);
    if (yAxis) params.set('y', yAxis);
    if (groupBy) params.set('group', groupBy);
    params.set('lang', language);
    params.set('limit', String(limit));

    const encodedUri = encodeURIComponent(cubeUri);
    const url = `${window.location.origin}${PLUGIN_BASE_URL}/builder/${encodedUri}?${params.toString()}`;
    navigator.clipboard.writeText(url);
  }, [cubeUri, chartType, xAxis, yAxis, groupBy, language, limit]);

  const handleSetFilter = useCallback((dimUri: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [dimUri]: values }));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="xl" />
        <p>Loading dataset structure...</p>
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

  if (!metadata) {
    return null;
  }

  // Map chart type for preview
  const previewChartType: ChartType =
    chartType === 'columns' || chartType === 'bars' ? 'bar' :
    chartType === 'lines' ? 'bar' :
    chartType as ChartType;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button variant="secondary" icon="arrow-left" onClick={handleBack} size="sm">
          Back
        </Button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{metadata.label}</h1>
          <p className={styles.subtitle}>Configure your visualization</p>
        </div>
        <div className={styles.headerActions}>
          <RadioButtonGroup
            options={languageOptions}
            value={language}
            onChange={setLanguage}
            size="sm"
          />
          <Button variant="secondary" icon="link" onClick={handleCopyLink} size="sm">
            Copy Link
          </Button>
          <Button
            variant="primary"
            icon="save"
            onClick={handleSaveDashboard}
            disabled={!xAxis && !yAxis}
          >
            Save as Dashboard
          </Button>
        </div>
      </div>

      {error && (
        <Alert title="Error" severity="error" onRemove={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Split Layout */}
      <div className={styles.content}>
        {/* Left Sidebar - Configuration */}
        <div className={styles.sidebar}>
          <Card className={styles.configCard}>
            <Card.Heading>Chart Settings</Card.Heading>
            <div className={styles.configForm}>
              <Field label="Chart Type">
                <RadioButtonGroup
                  options={chartTypeOptions}
                  value={chartType}
                  onChange={setChartType}
                  size="md"
                />
              </Field>

              <Field label="X Axis (Categories)" description="What to show along the horizontal axis">
                <Select
                  options={dimensionOptions}
                  value={xAxis || ''}
                  onChange={(v) => setXAxis(v?.value || null)}
                  placeholder="Select a dimension..."
                />
              </Field>

              <Field label="Y Axis (Values)" description="The numeric values to display">
                <Select
                  options={measureOptions}
                  value={yAxis || ''}
                  onChange={(v) => setYAxis(v?.value || null)}
                  placeholder="Select a measure..."
                />
              </Field>

              <Field label="Group By (Color)" description="Split data into colored groups">
                <Select
                  options={dimensionOptions}
                  value={groupBy || ''}
                  onChange={(v) => setGroupBy(v?.value || null)}
                  placeholder="Optional grouping..."
                  isClearable
                />
              </Field>

              <Field label="Data Limit">
                <Select
                  options={limitOptions}
                  value={limit}
                  onChange={(v) => setLimit(v?.value || 100)}
                />
              </Field>
            </div>
          </Card>

          {/* Filters */}
          <Card className={styles.configCard}>
            <Card.Heading>
              <Icon name="filter" /> Filters
            </Card.Heading>
            <div className={styles.configForm}>
              {metadata.dimensions.length > 0 ? (
                metadata.dimensions.slice(0, 5).map((dim) => (
                  <FilterControl
                    key={dim.uri}
                    dimension={dim}
                    cubeUri={cubeUri}
                    language={language as Language}
                    selectedValues={filters[dim.uri] || []}
                    onChangeValues={(values) => handleSetFilter(dim.uri, values)}
                  />
                ))
              ) : (
                <p className={styles.noFilters}>No dimensions available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Canvas - Visualization */}
        <div className={styles.canvas}>
          <Card className={styles.vizCard}>
            <Card.Heading>
              <div className={styles.vizHeader}>
                <span>Preview</span>
                {dataLoading && <Spinner inline size="sm" />}
              </div>
            </Card.Heading>

            <div className={styles.vizContent}>
              {!xAxis && !yAxis ? (
                <div className={styles.placeholder}>
                  <Icon name="chart-line" size="xxxl" />
                  <h3>Select dimensions to visualize</h3>
                  <p>Choose an X axis and Y axis from the settings panel</p>
                </div>
              ) : (
                <ChartPreview
                  data={data}
                  chartType={previewChartType}
                  loading={dataLoading}
                  error={dataError}
                />
              )}
            </div>

            {data && data.length > 0 && (
              <div className={styles.dataInfo}>
                <Icon name="info-circle" size="sm" />
                <span>{data.length} rows loaded</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Filter Control Component
// ============================================================================

interface FilterControlProps {
  dimension: CubeDimension;
  cubeUri: string;
  language: Language;
  selectedValues: string[];
  onChangeValues: (values: string[]) => void;
}

function FilterControl({
  dimension,
  cubeUri,
  language,
  selectedValues,
  onChangeValues,
}: FilterControlProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded && options.length === 0) {
      setLoading(true);
      fetchDimensionValues(cubeUri, dimension.uri, language)
        .then(setOptions)
        .catch((err) => console.error('Failed to load dimension values:', err))
        .finally(() => setLoading(false));
    }
  }, [expanded, cubeUri, dimension.uri, language, options.length]);

  const selectOptions: Array<SelectableValue<string>> = options.map(o => ({
    label: o.label,
    value: o.value,
  }));

  return (
    <Collapse
      label={dimension.label}
      isOpen={expanded}
      onToggle={() => setExpanded(!expanded)}
      collapsible
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <Select
          options={selectOptions}
          value={selectedValues}
          onChange={(selected) => {
            if (Array.isArray(selected)) {
              onChangeValues(selected.map(s => s.value || '').filter(Boolean));
            } else if (selected?.value) {
              onChangeValues([selected.value]);
            } else {
              onChangeValues([]);
            }
          }}
          placeholder="Select values..."
          isMulti
          isClearable
        />
      )}
    </Collapse>
  );
}

// ============================================================================
// Styles
// ============================================================================

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(3)};
    max-width: 1800px;
    margin: 0 auto;
  `,
  header: css`
    display: flex;
    align-items: flex-start;
    gap: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(3)};
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
  headerActions: css`
    display: flex;
    gap: ${theme.spacing(1)};
    flex-wrap: wrap;
    align-items: center;
  `,
  content: css`
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: ${theme.spacing(3)};

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  `,
  sidebar: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  canvas: css`
    min-height: 600px;
  `,
  configCard: css`
    height: fit-content;
  `,
  configForm: css`
    margin-top: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  vizCard: css`
    height: 100%;
    min-height: 600px;
    display: flex;
    flex-direction: column;
  `,
  vizHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  vizContent: css`
    flex: 1;
    min-height: 500px;
    padding: ${theme.spacing(2)};
  `,
  placeholder: css`
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: ${theme.colors.text.secondary};

    svg {
      opacity: 0.3;
      margin-bottom: ${theme.spacing(2)};
    }

    h3 {
      margin: 0 0 ${theme.spacing(1)} 0;
      color: ${theme.colors.text.primary};
    }

    p {
      margin: 0;
    }
  `,
  dataInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    padding: ${theme.spacing(2)};
    border-top: 1px solid ${theme.colors.border.weak};
  `,
  noFilters: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    font-style: italic;
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
