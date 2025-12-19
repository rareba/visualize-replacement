import React, { useState, useEffect, useMemo } from 'react';
import { AppRootProps, GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Alert, Spinner, Icon, Select, Input, IconName } from '@grafana/ui';
import { css } from '@emotion/css';
import { fetchCubeMetadata, CubeMetadata, Dimension, Measure } from '../utils/sparql';
import { createGrafanaDashboard, ChartConfig, GrafanaChartType } from '../utils/dashboard';
import { locationService } from '@grafana/runtime';

// Chart types matching visualize.admin.ch style
interface ChartTypeOption {
  id: GrafanaChartType;
  label: string;
  icon: IconName;
  description: string;
}

const CHART_TYPES: ChartTypeOption[] = [
  { id: 'barchart', label: 'Column', icon: 'graph-bar', description: 'Compare values vertically' },
  { id: 'barchart-horizontal', label: 'Bar', icon: 'bars', description: 'Compare values horizontally' },
  { id: 'timeseries', label: 'Line', icon: 'gf-interpolation-linear', description: 'Show trends over time' },
  { id: 'timeseries-area', label: 'Area', icon: 'gf-interpolation-linear', description: 'Filled line chart' },
  { id: 'piechart', label: 'Pie', icon: 'circle', description: 'Show proportions' },
  { id: 'table', label: 'Table', icon: 'table', description: 'Tabular data view' },
];

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.canvas};
  `,
  header: css`
    margin-bottom: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    padding-bottom: ${theme.spacing(2)};
  `,
  title: css`
    font-size: 24px;
    font-weight: 500;
    margin: 0 0 4px 0;
  `,
  subtitle: css`
    color: ${theme.colors.text.secondary};
    margin: 0;
    font-size: 14px;
  `,
  layout: css`
    display: grid;
    grid-template-columns: 180px 1fr 280px;
    gap: ${theme.spacing(2)};
    flex: 1;
    min-height: 0;
  `,
  // Chart type panel (left)
  chartTypePanel: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  sectionLabel: css`
    font-size: 11px;
    font-weight: 600;
    color: ${theme.colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: ${theme.spacing(0.5)};
  `,
  chartTypeBtn: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1.5)};
    padding: ${theme.spacing(1.5)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: 4px;
    background: ${theme.colors.background.primary};
    cursor: pointer;
    transition: all 0.1s ease;
    text-align: left;
    font-size: 14px;

    &:hover {
      border-color: ${theme.colors.border.medium};
      background: ${theme.colors.background.secondary};
    }
  `,
  chartTypeBtnActive: css`
    border-color: ${theme.colors.primary.border};
    background: ${theme.colors.primary.transparent};
    &:hover {
      border-color: ${theme.colors.primary.border};
    }
  `,
  // Preview panel (center)
  previewPanel: css`
    display: flex;
    flex-direction: column;
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: 4px;
    overflow: hidden;
  `,
  previewHeader: css`
    padding: ${theme.spacing(1.5)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
  `,
  previewBody: css`
    flex: 1;
    padding: ${theme.spacing(2)};
    overflow: auto;
    display: flex;
    flex-direction: column;
  `,
  summaryTable: css`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-top: ${theme.spacing(2)};

    th, td {
      padding: ${theme.spacing(1)};
      border: 1px solid ${theme.colors.border.weak};
      text-align: left;
    }
    th {
      background: ${theme.colors.background.secondary};
      font-weight: 500;
    }
    td:last-child {
      color: ${theme.colors.primary.text};
      font-weight: 500;
    }
  `,
  // Config panel (right)
  configPanel: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  configSection: css`
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: 4px;
    padding: ${theme.spacing(2)};
  `,
  fieldRow: css`
    margin-bottom: ${theme.spacing(2)};
    &:last-child { margin-bottom: 0; }
  `,
  fieldLabel: css`
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: ${theme.colors.text.secondary};
    margin-bottom: 4px;
  `,
  createBtn: css`
    margin-top: auto;
  `,
  // Loading/error states
  centerBox: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: ${theme.spacing(2)};
    text-align: center;
  `,
  cubeInput: css`
    max-width: 500px;
    margin-bottom: ${theme.spacing(2)};
  `,
  hint: css`
    font-size: 12px;
    color: ${theme.colors.text.secondary};
    margin-top: ${theme.spacing(1)};
  `,
});

interface FieldMapping {
  x?: string;
  y?: string;
  series?: string;
  value?: string;
  segment?: string;
}

export const App = (props: AppRootProps) => {
  const styles = useStyles2(getStyles);
  const [cubeIri, setCubeIri] = useState('');
  const [cubeMetadata, setCubeMetadata] = useState<CubeMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<GrafanaChartType>('barchart');
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [creating, setCreating] = useState(false);
  const [chartTitle, setChartTitle] = useState('');

  // Read cube from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cube = params.get('cube');
    if (cube) {
      setCubeIri(cube);
    }
  }, []);

  // Load cube metadata
  useEffect(() => {
    if (!cubeIri) {
      setCubeMetadata(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCubeMetadata(cubeIri);
        setCubeMetadata(data);
        setChartTitle(data.label);

        // Auto-select defaults
        if (data.measures.length > 0) {
          setFieldMapping(prev => ({ ...prev, y: data.measures[0].iri, value: data.measures[0].iri }));
        }
        if (data.dimensions.length > 0) {
          setFieldMapping(prev => ({ ...prev, x: data.dimensions[0].iri, segment: data.dimensions[0].iri }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cube');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [cubeIri]);

  // Select options
  const dimOptions = useMemo(() =>
    cubeMetadata?.dimensions.map(d => ({ label: d.label, value: d.iri })) || [],
    [cubeMetadata]
  );

  const measureOptions = useMemo(() =>
    cubeMetadata?.measures.map(m => ({ label: m.label, value: m.iri })) || [],
    [cubeMetadata]
  );

  // Can create?
  const canCreate = useMemo(() => {
    if (!cubeMetadata || !chartTitle) return false;
    if (chartType === 'table') return true;
    if (chartType === 'piechart') return !!fieldMapping.value && !!fieldMapping.segment;
    return !!fieldMapping.x && !!fieldMapping.y;
  }, [cubeMetadata, chartTitle, chartType, fieldMapping]);

  // Create dashboard
  const handleCreate = async () => {
    if (!cubeMetadata) return;
    setCreating(true);
    try {
      const config: ChartConfig = {
        cubeIri,
        chartType,
        title: chartTitle,
        fieldMapping,
        dimensions: cubeMetadata.dimensions,
        measures: cubeMetadata.measures,
      };
      const uid = await createGrafanaDashboard(config);
      locationService.push(`/d/${uid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dashboard');
      setCreating(false);
    }
  };

  // No cube - show input
  if (!cubeIri) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Chart</h1>
          <p className={styles.subtitle}>Enter a LINDAS cube IRI to start</p>
        </div>
        <div className={styles.cubeInput}>
          <Input
            placeholder="https://example.org/cube/..."
            onChange={(e) => setCubeIri(e.currentTarget.value)}
          />
          <p className={styles.hint}>Tip: Pass cube IRI via URL: ?cube=https://...</p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className={styles.centerBox}>
        <Spinner size="xl" />
        <p>Loading cube metadata...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.container}>
        <Alert severity="error" title="Error">{error}</Alert>
        <Button variant="secondary" onClick={() => { setCubeIri(''); setError(null); }} style={{ marginTop: 16 }}>
          Try different cube
        </Button>
      </div>
    );
  }

  // Main UI
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create Chart</h1>
        <p className={styles.subtitle}>{cubeMetadata?.label || cubeIri}</p>
      </div>

      <div className={styles.layout}>
        {/* Left - Chart Types */}
        <div className={styles.chartTypePanel}>
          <div className={styles.sectionLabel}>Chart Type</div>
          {CHART_TYPES.map(ct => (
            <button
              key={ct.id}
              className={`${styles.chartTypeBtn} ${chartType === ct.id ? styles.chartTypeBtnActive : ''}`}
              onClick={() => setChartType(ct.id)}
              title={ct.description}
            >
              <Icon name={ct.icon} />
              <span>{ct.label}</span>
            </button>
          ))}
        </div>

        {/* Center - Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <Input
              value={chartTitle}
              onChange={(e) => setChartTitle(e.currentTarget.value)}
              placeholder="Chart title"
            />
          </div>
          <div className={styles.previewBody}>
            <p style={{ color: '#666', marginBottom: 8 }}>
              <strong>{CHART_TYPES.find(c => c.id === chartType)?.label}</strong> with {cubeMetadata?.dimensions.length} dimensions, {cubeMetadata?.measures.length} measures
            </p>
            <table className={styles.summaryTable}>
              <thead>
                <tr><th>Field</th><th>Name</th><th>Role</th></tr>
              </thead>
              <tbody>
                {cubeMetadata?.dimensions.map(d => (
                  <tr key={d.iri}>
                    <td>Dimension</td>
                    <td>{d.label}</td>
                    <td>
                      {fieldMapping.x === d.iri && 'X Axis'}
                      {fieldMapping.segment === d.iri && chartType === 'piechart' && 'Segment'}
                      {fieldMapping.series === d.iri && 'Series'}
                    </td>
                  </tr>
                ))}
                {cubeMetadata?.measures.map(m => (
                  <tr key={m.iri}>
                    <td>Measure</td>
                    <td>{m.label}</td>
                    <td>
                      {fieldMapping.y === m.iri && 'Y Axis'}
                      {fieldMapping.value === m.iri && chartType === 'piechart' && 'Value'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right - Config */}
        <div className={styles.configPanel}>
          <div className={styles.configSection}>
            <div className={styles.sectionLabel}>Field Mapping</div>

            {chartType === 'piechart' ? (
              <>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel}>Value (measure)</label>
                  <Select
                    options={measureOptions}
                    value={measureOptions.find(o => o.value === fieldMapping.value)}
                    onChange={(v) => setFieldMapping(p => ({ ...p, value: v?.value }))}
                    placeholder="Select..."
                  />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel}>Segment (dimension)</label>
                  <Select
                    options={dimOptions}
                    value={dimOptions.find(o => o.value === fieldMapping.segment)}
                    onChange={(v) => setFieldMapping(p => ({ ...p, segment: v?.value }))}
                    placeholder="Select..."
                  />
                </div>
              </>
            ) : chartType === 'table' ? (
              <p style={{ color: '#666', fontSize: 12 }}>All fields displayed as columns</p>
            ) : (
              <>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel}>X Axis (dimension)</label>
                  <Select
                    options={dimOptions}
                    value={dimOptions.find(o => o.value === fieldMapping.x)}
                    onChange={(v) => setFieldMapping(p => ({ ...p, x: v?.value }))}
                    placeholder="Select..."
                  />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel}>Y Axis (measure)</label>
                  <Select
                    options={measureOptions}
                    value={measureOptions.find(o => o.value === fieldMapping.y)}
                    onChange={(v) => setFieldMapping(p => ({ ...p, y: v?.value }))}
                    placeholder="Select..."
                  />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel}>Series (optional)</label>
                  <Select
                    options={dimOptions}
                    value={dimOptions.find(o => o.value === fieldMapping.series)}
                    onChange={(v) => setFieldMapping(p => ({ ...p, series: v?.value }))}
                    placeholder="None"
                    isClearable
                  />
                </div>
              </>
            )}
          </div>

          <Button
            className={styles.createBtn}
            variant="primary"
            size="lg"
            disabled={!canCreate || creating}
            onClick={handleCreate}
          >
            {creating ? 'Creating...' : 'Create Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
};
