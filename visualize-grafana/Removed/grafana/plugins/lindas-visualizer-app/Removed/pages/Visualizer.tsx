/**
 * LINDAS Visualizer Page
 *
 * A public-friendly interface for creating visualizations from LINDAS datasets.
 * Uses simple React components for preview, saves to Grafana for full features.
 *
 * Features:
 * - Simple dropdowns for dimension/measure selection
 * - Live preview with lightweight charts
 * - Save to Grafana dashboard for full native panel features
 * - Deep linking via URL parameters
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue, DataFrame } from '@grafana/data';
import {
  useStyles2,
  Select,
  Button,
  Spinner,
  Alert,
  RadioButtonGroup,
  Card,
  Icon,
  Field,
} from '@grafana/ui';
import { getBackendSrv, locationService } from '@grafana/runtime';

import {
  Language,
  CubeMetadata,
  ChartConfig,
  fetchCubeMetadata,
  fetchCubeData,
  serializeStateToUrl,
} from '../sparql';
import { ChartPreview, ChartType } from '../components/ChartPreview';

// ============================================================================
// Types
// ============================================================================

interface VisualizerProps {
  cubeUri: string;
  initialState?: {
    x?: string;
    y?: string;
    group?: string;
    chart?: ChartType;
    limit?: number;
  };
  lang: Language;
  onBack: () => void;
  onStateChange?: (state: {
    x?: string;
    y?: string;
    group?: string;
    chart?: ChartType;
  }) => void;
}

// ============================================================================
// Constants
// ============================================================================

const CHART_TYPE_OPTIONS: Array<SelectableValue<ChartType>> = [
  { label: 'Bar Chart', value: 'bar', icon: 'graph-bar' },
  { label: 'Pie Chart', value: 'pie', icon: 'grafana' },
  { label: 'Table', value: 'table', icon: 'table' },
  { label: 'Stats', value: 'stat', icon: 'calculator-alt' },
];

const LIMIT_OPTIONS: Array<SelectableValue<number>> = [
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '500 rows', value: 500 },
  { label: '1000 rows', value: 1000 },
  { label: '5000 rows', value: 5000 },
];

// Panel type mapping for Grafana dashboards
const CHART_TO_PANEL: Record<ChartType, string> = {
  bar: 'barchart',
  line: 'timeseries',
  pie: 'piechart',
  table: 'table',
  stat: 'stat',
};

// ============================================================================
// Main Component
// ============================================================================

export const Visualizer: React.FC<VisualizerProps> = ({
  cubeUri,
  initialState,
  lang,
  onBack,
  onStateChange,
}) => {
  const styles = useStyles2(getStyles);

  // State
  const [metadata, setMetadata] = useState<CubeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [data, setData] = useState<DataFrame | null>(null);

  const [config, setConfig] = useState<{
    xAxis: string | null;
    yAxis: string | null;
    groupBy: string | null;
    chartType: ChartType;
    limit: number;
  }>({
    xAxis: initialState?.x || null,
    yAxis: initialState?.y || null,
    groupBy: initialState?.group || null,
    chartType: initialState?.chart || 'bar',
    limit: initialState?.limit || 100,
  });

  // Load metadata on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const meta = await fetchCubeMetadata(cubeUri, lang);
        setMetadata(meta);

        // Auto-select first dimension and measure if not provided
        if (!initialState?.x && meta.dimensions.length > 0) {
          setConfig(c => ({ ...c, xAxis: meta.dimensions[0].uri }));
        }
        if (!initialState?.y && meta.measures.length > 0) {
          setConfig(c => ({ ...c, yAxis: meta.measures[0].uri }));
        }
      } catch (err: any) {
        console.error('Failed to load cube metadata:', err);
        setError(err.message || 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cubeUri, lang, initialState]);

  // Fetch data when config changes
  useEffect(() => {
    if (!metadata || (!config.xAxis && !config.yAxis)) {
      setData(null);
      return;
    }

    const load = async () => {
      setDataLoading(true);
      setDataError(null);

      try {
        const chartConfig: ChartConfig = {
          cubeUri,
          xAxis: config.xAxis,
          yAxis: config.yAxis,
          groupBy: config.groupBy,
          filters: {},
          limit: config.limit,
        };

        const frame = await fetchCubeData(chartConfig, metadata, lang);
        setData(frame);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setDataError(err.message || 'Failed to load data');
        setData(null);
      } finally {
        setDataLoading(false);
      }
    };

    const debounce = setTimeout(load, 300);
    return () => clearTimeout(debounce);
  }, [cubeUri, config, metadata, lang]);

  // Notify parent of state changes for URL sync
  useEffect(() => {
    onStateChange?.({
      x: config.xAxis || undefined,
      y: config.yAxis || undefined,
      group: config.groupBy || undefined,
      chart: config.chartType,
    });
  }, [config, onStateChange]);

  // Build dropdown options
  const dimensionOptions = useMemo(() => {
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

  const measureOptions = useMemo(() => {
    if (!metadata) return [];
    return [
      { label: '-- None --', value: '' },
      ...metadata.measures.map(m => ({
        label: m.unit ? `${m.label} (${m.unit})` : m.label,
        value: m.uri,
      })),
    ];
  }, [metadata]);

  // Handle save as dashboard
  const handleSaveDashboard = async () => {
    if (!metadata) return;

    try {
      const panelType = CHART_TO_PANEL[config.chartType] || 'table';

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
            datasource: { type: 'lindas-datasource', uid: 'lindas-datasource' },
            targets: [{
              refId: 'A',
              cubeUri: cubeUri,
              xAxis: config.xAxis,
              yAxis: config.yAxis,
              groupBy: config.groupBy,
              limit: config.limit,
            }],
          },
        ],
      };

      const result = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        overwrite: false,
      });

      locationService.push(`/d/${result.uid}`);
    } catch (err: any) {
      setError(`Failed to save dashboard: ${err.message}`);
    }
  };

  // Generate share link
  const getShareLink = () => {
    const params = serializeStateToUrl({
      cube: cubeUri,
      x: config.xAxis || undefined,
      y: config.yAxis || undefined,
      group: config.groupBy || undefined,
      chart: config.chartType,
      lang,
      limit: config.limit,
    });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
  };

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
      <Alert title="Error" severity="error">
        {error}
        <div style={{ marginTop: 16 }}>
          <Button onClick={onBack}>Back to Catalog</Button>
        </div>
      </Alert>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button variant="secondary" icon="arrow-left" onClick={onBack} size="sm">
          Back
        </Button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{metadata.label}</h1>
          <p className={styles.subtitle}>Configure your visualization</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" icon="link" onClick={handleCopyLink} size="sm">
            Copy Link
          </Button>
          <Button
            variant="primary"
            icon="save"
            onClick={handleSaveDashboard}
            disabled={!config.xAxis && !config.yAxis}
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

      <div className={styles.content}>
        {/* Configuration Panel */}
        <Card className={styles.configPanel}>
          <Card.Heading>Chart Settings</Card.Heading>

          <div className={styles.configForm}>
            {/* Chart Type */}
            <Field label="Chart Type">
              <RadioButtonGroup
                options={CHART_TYPE_OPTIONS}
                value={config.chartType}
                onChange={(v) => setConfig(c => ({ ...c, chartType: v }))}
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
                value={config.xAxis || ''}
                onChange={(v) => setConfig(c => ({ ...c, xAxis: v?.value || null }))}
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
                value={config.yAxis || ''}
                onChange={(v) => setConfig(c => ({ ...c, yAxis: v?.value || null }))}
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
                value={config.groupBy || ''}
                onChange={(v) => setConfig(c => ({ ...c, groupBy: v?.value || null }))}
                placeholder="Optional grouping..."
                isClearable
              />
            </Field>

            {/* Data Limit */}
            <Field label="Data Limit">
              <Select
                options={LIMIT_OPTIONS}
                value={config.limit}
                onChange={(v) => setConfig(c => ({ ...c, limit: v?.value || 100 }))}
              />
            </Field>
          </div>
        </Card>

        {/* Visualization Panel */}
        <Card className={styles.vizPanel}>
          <Card.Heading>
            <div className={styles.vizHeader}>
              <span>Preview</span>
              {dataLoading && <Spinner inline size="sm" />}
            </div>
          </Card.Heading>

          <div className={styles.vizContent}>
            {!config.xAxis && !config.yAxis ? (
              <div className={styles.placeholder}>
                <Icon name="chart-line" size="xxxl" />
                <h3>Select dimensions to visualize</h3>
                <p>Choose an X axis and Y axis from the settings panel</p>
              </div>
            ) : (
              <ChartPreview
                data={data}
                chartType={config.chartType}
                loading={dataLoading}
                error={dataError}
              />
            )}
          </div>

          {data && data.length > 0 && (
            <div className={styles.dataInfo}>
              <Icon name="info-circle" size="sm" />
              <span>{data.length} rows loaded</span>
              <span className={styles.hint}>
                Save as dashboard for full Grafana features
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(3)};
    max-width: 1600px;
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
  `,
  content: css`
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: ${theme.spacing(3)};

    @media (max-width: 1000px) {
      grid-template-columns: 1fr;
    }
  `,
  configPanel: css`
    height: fit-content;
  `,
  configForm: css`
    margin-top: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  vizPanel: css`
    min-height: 500px;
  `,
  vizHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  vizContent: css`
    min-height: 400px;
    padding: ${theme.spacing(2)};
  `,
  placeholder: css`
    height: 100%;
    min-height: 350px;
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
  hint: css`
    margin-left: auto;
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
});

export default Visualizer;
