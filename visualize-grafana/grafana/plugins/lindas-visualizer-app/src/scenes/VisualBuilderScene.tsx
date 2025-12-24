/**
 * Visual Builder Scene
 *
 * The main visualization builder with split layout:
 * - Left sidebar: Configuration controls (chart type, axis mapping, filters)
 * - Right canvas: Live visualization using native Grafana panels
 *
 * Uses SceneQueryRunner for real-time data updates when config changes.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  SceneObjectBase,
  SceneObjectState,
  SceneComponentProps,
  SceneFlexLayout,
  SceneFlexItem,
  VizPanel,
  SceneQueryRunner,
  SceneDataTransformer,
  PanelBuilders,
} from '@grafana/scenes';
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
  InlineSwitch,
} from '@grafana/ui';
import { locationService, getBackendSrv } from '@grafana/runtime';

import {
  fetchCubeMetadata,
  fetchDimensionValues,
  CubeMetadata,
  CubeDimension,
  CubeMeasure,
  Language,
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

// ============================================================================
// Scene State
// ============================================================================

export interface VisualBuilderSceneState extends SceneObjectState {
  cubeUri: string;
  language: LanguageValue;
  chartType: ChartTypeValue;
  xAxis: string | null;
  yAxis: string | null;
  groupBy: string | null;
  filters: Record<string, string[]>;
  limit: number;
  // Runtime state
  metadata: CubeMetadata | null;
  loading: boolean;
  error: string | null;
  dataLoading: boolean;
}

// ============================================================================
// Scene Object
// ============================================================================

export class VisualBuilderScene extends SceneObjectBase<VisualBuilderSceneState> {
  static Component = VisualBuilderRenderer;

  constructor(state: Partial<VisualBuilderSceneState> & { cubeUri: string }) {
    super({
      language: 'de',
      chartType: 'columns',
      xAxis: null,
      yAxis: null,
      groupBy: null,
      filters: {},
      limit: 100,
      metadata: null,
      loading: true,
      error: null,
      dataLoading: false,
      ...state,
    });
  }

  // Actions
  setLanguage(lang: LanguageValue) {
    this.setState({ language: lang, metadata: null, loading: true });
    this.loadMetadata();
  }

  setChartType(type: ChartTypeValue) {
    this.setState({ chartType: type });
  }

  setXAxis(axis: string | null) {
    this.setState({ xAxis: axis });
  }

  setYAxis(axis: string | null) {
    this.setState({ yAxis: axis });
  }

  setGroupBy(group: string | null) {
    this.setState({ groupBy: group });
  }

  setLimit(limit: number) {
    this.setState({ limit });
  }

  setFilter(dimensionUri: string, values: string[]) {
    this.setState({
      filters: {
        ...this.state.filters,
        [dimensionUri]: values,
      },
    });
  }

  clearFilter(dimensionUri: string) {
    const { [dimensionUri]: _, ...remaining } = this.state.filters;
    this.setState({ filters: remaining });
  }

  // Load cube metadata
  async loadMetadata() {
    const { cubeUri, language } = this.state;

    if (!cubeUri) {
      this.setState({ error: 'No dataset selected', loading: false });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const metadata = await fetchCubeMetadata(cubeUri, language as Language);

      // Auto-select first dimension and measure
      const xAxis = metadata.dimensions[0]?.uri || null;
      const yAxis = metadata.measures[0]?.uri || null;

      this.setState({
        metadata,
        xAxis,
        yAxis,
        loading: false,
      });
    } catch (err: any) {
      console.error('Failed to load metadata:', err);
      this.setState({
        error: err.message || 'Failed to load dataset',
        loading: false,
      });
    }
  }

  // Lifecycle - properly typed to return CancelActivationHandler
  protected _activationHandler() {
    this.loadMetadata();
    return () => {
      // Cleanup on deactivation if needed
    };
  }

  // Navigate back to catalog
  navigateBack() {
    locationService.push(PLUGIN_BASE_URL);
  }

  // Save as dashboard
  async saveDashboard(): Promise<string | null> {
    const { metadata, chartType, xAxis, yAxis, groupBy, limit, cubeUri } = this.state;
    if (!metadata) return null;

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
            cubeUri: cubeUri,
            xAxis: xAxis,
            yAxis: yAxis,
            groupBy: groupBy,
            limit: limit,
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
      return result.uid;
    } catch (err: any) {
      console.error('Failed to save dashboard:', err);
      this.setState({ error: `Failed to save: ${err.message}` });
      return null;
    }
  }

  // Get shareable URL
  getShareUrl(): string {
    const { cubeUri, chartType, xAxis, yAxis, groupBy, language, limit } = this.state;
    const params = new URLSearchParams();
    params.set('chart', chartType);
    if (xAxis) params.set('x', xAxis);
    if (yAxis) params.set('y', yAxis);
    if (groupBy) params.set('group', groupBy);
    params.set('lang', language);
    params.set('limit', String(limit));

    const encodedUri = encodeURIComponent(cubeUri);
    return `${window.location.origin}${PLUGIN_BASE_URL}/builder/${encodedUri}?${params.toString()}`;
  }
}

// ============================================================================
// React Component
// ============================================================================

function VisualBuilderRenderer({ model }: SceneComponentProps<VisualBuilderScene>) {
  const styles = useStyles2(getStyles);
  const state = model.useState();
  const {
    cubeUri,
    language,
    chartType,
    xAxis,
    yAxis,
    groupBy,
    filters,
    limit,
    metadata,
    loading,
    error,
    dataLoading,
  } = state;

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
  const handleSave = useCallback(async () => {
    const uid = await model.saveDashboard();
    if (uid) {
      locationService.push(`/d/${uid}`);
    }
  }, [model]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(model.getShareUrl());
  }, [model]);

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
      <div className={styles.error}>
        <Alert title="Error" severity="error">
          {error}
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => model.navigateBack()}>Back to Catalog</Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          variant="secondary"
          icon="arrow-left"
          onClick={() => model.navigateBack()}
          size="sm"
        >
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
            onChange={(v) => model.setLanguage(v)}
            size="sm"
          />
          <Button variant="secondary" icon="link" onClick={handleCopyLink} size="sm">
            Copy Link
          </Button>
          <Button
            variant="primary"
            icon="save"
            onClick={handleSave}
            disabled={!xAxis && !yAxis}
          >
            Save as Dashboard
          </Button>
        </div>
      </div>

      {error && (
        <Alert title="Error" severity="error" onRemove={() => model.setState({ error: null })}>
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
              {/* Chart Type */}
              <Field label="Chart Type">
                <RadioButtonGroup
                  options={chartTypeOptions}
                  value={chartType}
                  onChange={(v) => model.setChartType(v)}
                  size="md"
                />
              </Field>

              {/* X Axis */}
              <Field
                label="X Axis (Categories)"
                description="What to show along the horizontal axis"
              >
                <Select
                  options={dimensionOptions}
                  value={xAxis || ''}
                  onChange={(v) => model.setXAxis(v?.value || null)}
                  placeholder="Select a dimension..."
                />
              </Field>

              {/* Y Axis */}
              <Field
                label="Y Axis (Values)"
                description="The numeric values to display"
              >
                <Select
                  options={measureOptions}
                  value={yAxis || ''}
                  onChange={(v) => model.setYAxis(v?.value || null)}
                  placeholder="Select a measure..."
                />
              </Field>

              {/* Group By */}
              <Field
                label="Group By (Color)"
                description="Split data into colored groups"
              >
                <Select
                  options={dimensionOptions}
                  value={groupBy || ''}
                  onChange={(v) => model.setGroupBy(v?.value || null)}
                  placeholder="Optional grouping..."
                  isClearable
                />
              </Field>

              {/* Data Limit */}
              <Field label="Data Limit">
                <Select
                  options={limitOptions}
                  value={limit}
                  onChange={(v) => model.setLimit(v?.value || 100)}
                />
              </Field>
            </div>
          </Card>

          {/* Filters Section */}
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
                    onChangeValues={(values) => model.setFilter(dim.uri, values)}
                  />
                ))
              ) : (
                <p className={styles.noFilters}>No dimensions available for filtering</p>
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
                <VisualizationPanel
                  cubeUri={cubeUri}
                  chartType={chartType}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  groupBy={groupBy}
                  filters={filters}
                  limit={limit}
                  onLoadingChange={(loading) => model.setState({ dataLoading: loading })}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
  const styles = useStyles2(getStyles);
  const [options, setOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    if (expanded && options.length === 0) {
      setLoading(true);
      fetchDimensionValues(cubeUri, dimension.uri, language)
        .then(setOptions)
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
// Visualization Panel Component
// ============================================================================

interface VisualizationPanelProps {
  cubeUri: string;
  chartType: ChartTypeValue;
  xAxis: string | null;
  yAxis: string | null;
  groupBy: string | null;
  filters: Record<string, string[]>;
  limit: number;
  onLoadingChange?: (loading: boolean) => void;
}

function VisualizationPanel({
  cubeUri,
  chartType,
  xAxis,
  yAxis,
  groupBy,
  filters,
  limit,
  onLoadingChange,
}: VisualizationPanelProps) {
  const styles = useStyles2(getStyles);

  // Build query target for the datasource
  const queryTarget = useMemo(() => ({
    refId: 'A',
    cubeUri,
    xAxis,
    yAxis,
    groupBy,
    filters,
    limit,
  }), [cubeUri, xAxis, yAxis, groupBy, filters, limit]);

  const panelType = CHART_TO_PANEL[chartType] || 'table';

  // Create the panel configuration
  const panelOptions = useMemo(() => {
    const opts: Record<string, any> = {};

    if (chartType === 'bars') {
      opts.orientation = 'horizontal';
    }

    return opts;
  }, [chartType]);

  // For now, use the ChartPreview component until SceneQueryRunner integration is complete
  // This is a bridge solution that works with the existing SPARQL utilities

  return (
    <div className={styles.vizPanelContainer}>
      <ChartPreviewWrapper
        cubeUri={cubeUri}
        chartType={chartType}
        xAxis={xAxis}
        yAxis={yAxis}
        groupBy={groupBy}
        filters={filters}
        limit={limit}
        onLoadingChange={onLoadingChange}
      />
    </div>
  );
}

// ============================================================================
// Chart Preview Wrapper (Bridge to existing implementation)
// ============================================================================

import { ChartPreview, ChartType } from '../components/ChartPreview';
import { fetchCubeData, ChartConfig } from '../sparql';
import { DataFrame } from '@grafana/data';

interface ChartPreviewWrapperProps {
  cubeUri: string;
  chartType: ChartTypeValue;
  xAxis: string | null;
  yAxis: string | null;
  groupBy: string | null;
  filters: Record<string, string[]>;
  limit: number;
  onLoadingChange?: (loading: boolean) => void;
}

function ChartPreviewWrapper({
  cubeUri,
  chartType,
  xAxis,
  yAxis,
  groupBy,
  filters,
  limit,
  onLoadingChange,
}: ChartPreviewWrapperProps) {
  const [data, setData] = React.useState<DataFrame | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [metadata, setMetadata] = React.useState<CubeMetadata | null>(null);

  // Load metadata
  React.useEffect(() => {
    fetchCubeMetadata(cubeUri, 'de')
      .then(setMetadata)
      .catch((err) => setError(err.message));
  }, [cubeUri]);

  // Fetch data when config changes
  React.useEffect(() => {
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

    setLoading(true);
    onLoadingChange?.(true);
    setError(null);

    const timeout = setTimeout(() => {
      fetchCubeData(config, metadata, 'de')
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => {
          setLoading(false);
          onLoadingChange?.(false);
        });
    }, 300); // Debounce

    return () => clearTimeout(timeout);
  }, [cubeUri, xAxis, yAxis, groupBy, filters, limit, metadata, onLoadingChange]);

  // Map chart types
  const previewChartType: ChartType =
    chartType === 'columns' || chartType === 'bars' ? 'bar' :
    chartType === 'lines' ? 'bar' : // Fallback since ChartPreview doesn't have line
    chartType as ChartType;

  return (
    <ChartPreview
      data={data}
      chartType={previewChartType}
      loading={loading}
      error={error}
    />
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
    min-height: 100vh;
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
  vizPanelContainer: css`
    width: 100%;
    height: 100%;
    min-height: 450px;
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
  error: css`
    padding: ${theme.spacing(4)};
    max-width: 600px;
    margin: 0 auto;
  `,
});
