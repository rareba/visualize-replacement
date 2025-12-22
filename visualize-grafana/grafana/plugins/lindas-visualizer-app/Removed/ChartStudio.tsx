/**
 * LINDAS Chart Studio
 *
 * The main interface for creating visualizations from LINDAS data.
 * Provides a guided, visual, real-time chart creation experience.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { css } from '@emotion/css';
import { AppRootProps, GrafanaTheme2 } from '@grafana/data';
import {
  useStyles2,
  Button,
  Icon,
  Alert,
  Spinner,
  Input,
  Select,
  Modal,
  Tooltip,
  Switch,
  RadioButtonGroup,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { getBackendSrv, locationService } from '@grafana/runtime';

import {
  ChartType,
  ChartConfig,
  CubeMetadata,
  CubeFullMetadata,
  DataRow,
  CHART_TYPES,
  DEFAULT_CHART_CONFIG,
} from '../types';
import { searchCubes, getCubeMetadata, fetchCubeData, getColumnLabel } from '../services/lindasService';

// Simple chart rendering using SVG
import { SimpleChart } from '../components/SimpleChart';

/**
 * Main Chart Studio Component
 */
export const ChartStudio: React.FC<AppRootProps> = () => {
  const styles = useStyles2(getStyles);

  // Dataset state
  const [searchTerm, setSearchTerm] = useState('');
  const [cubes, setCubes] = useState<CubeMetadata[]>([]);
  const [loadingCubes, setLoadingCubes] = useState(false);
  const [selectedCube, setSelectedCube] = useState<CubeFullMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Data state
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Chart configuration
  const [config, setConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Load cubes on mount and search
  useEffect(() => {
    const loadCubes = async () => {
      setLoadingCubes(true);
      try {
        const results = await searchCubes(searchTerm);
        setCubes(results);
      } catch (err: any) {
        setError(`Failed to load datasets: ${err.message}`);
      } finally {
        setLoadingCubes(false);
      }
    };

    const debounce = setTimeout(loadCubes, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Handle cube selection
  const handleSelectCube = useCallback(async (cube: CubeMetadata) => {
    setLoadingMetadata(true);
    setError(null);
    try {
      const metadata = await getCubeMetadata(cube.uri);
      if (metadata) {
        setSelectedCube(metadata);
        setConfig((prev) => ({
          ...prev,
          title: metadata.label,
          xAxis: metadata.dimensions[0]?.uri,
          yAxis: metadata.measures[0]?.uri,
          groupBy: undefined,
        }));

        // Fetch data
        setLoadingData(true);
        const { data: fetchedData, columns: fetchedColumns } = await fetchCubeData(
          metadata.uri,
          metadata.dimensions,
          metadata.measures,
          config.limit
        );
        setData(fetchedData);
        setColumns(fetchedColumns);
      }
    } catch (err: any) {
      setError(`Failed to load dataset: ${err.message}`);
    } finally {
      setLoadingMetadata(false);
      setLoadingData(false);
    }
  }, [config.limit]);

  // Build dropdown options from dimensions/measures
  const dimensionOptions: Array<SelectableValue<string>> = useMemo(() => {
    if (!selectedCube) return [];
    return selectedCube.dimensions.map((dim) => ({
      label: dim.label,
      value: dim.uri,
      description: dim.isTemporal ? 'Temporal' : dim.scaleType,
    }));
  }, [selectedCube]);

  const measureOptions: Array<SelectableValue<string>> = useMemo(() => {
    if (!selectedCube) return [];
    return selectedCube.measures.map((measure) => ({
      label: measure.label,
      value: measure.uri,
      description: measure.unit,
    }));
  }, [selectedCube]);

  // Update config
  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Save to dashboard
  const handleSave = useCallback(async () => {
    if (!selectedCube || !config.xAxis || !config.yAxis) {
      setError('Please configure the chart before saving');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Build the panel configuration
      const panelType = config.chartType === 'table' ? 'table' :
        config.chartType === 'pie' ? 'piechart' :
        config.chartType === 'scatter' ? 'scatter' : 'timeseries';

      // Generate query
      const xDim = selectedCube.dimensions.find((d) => d.uri === config.xAxis);
      const yMeasure = selectedCube.measures.find((m) => m.uri === config.yAxis);
      const groupDim = config.groupBy ? selectedCube.dimensions.find((d) => d.uri === config.groupBy) : null;

      const dashboard = {
        title: dashboardTitle || `${selectedCube.label} - ${new Date().toISOString().slice(0, 16)}`,
        tags: ['lindas', 'chart-studio'],
        timezone: 'browser',
        schemaVersion: 38,
        panels: [
          {
            id: 1,
            type: panelType,
            title: config.title || selectedCube.label,
            gridPos: { x: 0, y: 0, w: 24, h: 16 },
            datasource: {
              type: 'lindas-datasource',
              uid: 'lindas-datasource',
            },
            targets: [
              {
                refId: 'A',
                cubeUri: selectedCube.uri,
                limit: config.limit,
              },
            ],
            fieldConfig: {
              defaults: {
                custom: {},
              },
              overrides: [],
            },
            options: panelType === 'table' ? { showHeader: true } : { legend: { showLegend: config.showLegend } },
          },
        ],
      };

      const response = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        message: `Created with Chart Studio from ${selectedCube.label}`,
        overwrite: false,
      });

      setShowSaveModal(false);
      locationService.push(`/d/${response.uid}`);
    } catch (err: any) {
      setError(`Failed to save dashboard: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [selectedCube, config, dashboardTitle]);

  // Chart type options for radio buttons
  const chartTypeOptions = CHART_TYPES.map((ct) => ({
    label: ct.label,
    value: ct.id,
    icon: ct.icon,
  }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Icon name="chart-line" size="xl" />
          <div>
            <h1>LINDAS Chart Studio</h1>
            <p>Create beautiful visualizations from Swiss Open Data</p>
          </div>
        </div>
        {selectedCube && (
          <div className={styles.headerActions}>
            <Button
              variant="primary"
              icon="save"
              onClick={() => setShowSaveModal(true)}
              disabled={!config.xAxis || !config.yAxis}
            >
              Save to Dashboard
            </Button>
          </div>
        )}
      </header>

      {error && (
        <Alert title="Error" severity="error" onRemove={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className={styles.mainContent}>
        {/* Left Panel: Dataset Browser */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <Icon name="database" />
            <span>Datasets</span>
          </div>

          <div className={styles.searchBox}>
            <Input
              prefix={<Icon name="search" />}
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </div>

          <div className={styles.datasetList}>
            {loadingCubes ? (
              <div className={styles.loadingState}>
                <Spinner />
                <span>Loading datasets...</span>
              </div>
            ) : cubes.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon name="info-circle" />
                <span>No datasets found</span>
              </div>
            ) : (
              cubes.map((cube) => (
                <div
                  key={cube.uri}
                  className={`${styles.datasetItem} ${selectedCube?.uri === cube.uri ? styles.datasetItemSelected : ''}`}
                  onClick={() => handleSelectCube(cube)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.datasetName}>{cube.label}</div>
                  {cube.publisher && (
                    <div className={styles.datasetMeta}>{cube.publisher}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Panel: Chart Preview */}
        <main className={styles.centerPanel}>
          {!selectedCube ? (
            <div className={styles.placeholder}>
              <Icon name="arrow-left" size="xxxl" className={styles.placeholderIcon} />
              <h2>Select a Dataset</h2>
              <p>Choose a dataset from the left panel to start creating your chart</p>
            </div>
          ) : loadingMetadata || loadingData ? (
            <div className={styles.loadingState}>
              <Spinner size="xl" />
              <span>Loading data...</span>
            </div>
          ) : (
            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h2>{config.title || selectedCube.label}</h2>
                <div className={styles.chartMeta}>
                  {data.length} rows | {columns.length} columns
                </div>
              </div>
              <div className={styles.chartPreview}>
                <SimpleChart
                  data={data}
                  config={config}
                  dimensions={selectedCube.dimensions}
                  measures={selectedCube.measures}
                />
              </div>
            </div>
          )}
        </main>

        {/* Right Panel: Configuration */}
        {selectedCube && (
          <aside className={styles.rightPanel}>
            <div className={styles.panelHeader}>
              <Icon name="cog" />
              <span>Configure</span>
            </div>

            <div className={styles.configSection}>
              <label className={styles.configLabel}>Chart Type</label>
              <div className={styles.chartTypeGrid}>
                {CHART_TYPES.map((ct) => (
                  <Tooltip key={ct.id} content={ct.description}>
                    <button
                      className={`${styles.chartTypeButton} ${config.chartType === ct.id ? styles.chartTypeButtonActive : ''}`}
                      onClick={() => updateConfig({ chartType: ct.id })}
                    >
                      <Icon name={ct.icon as any} size="lg" />
                      <span>{ct.label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className={styles.configSection}>
              <label className={styles.configLabel}>
                {config.chartType === 'pie' ? 'Categories' : 'X-Axis'}
              </label>
              <Select
                options={dimensionOptions}
                value={dimensionOptions.find((o) => o.value === config.xAxis)}
                onChange={(v) => updateConfig({ xAxis: v.value })}
                placeholder="Select dimension..."
              />
            </div>

            <div className={styles.configSection}>
              <label className={styles.configLabel}>
                {config.chartType === 'pie' ? 'Values' : 'Y-Axis'}
              </label>
              <Select
                options={measureOptions}
                value={measureOptions.find((o) => o.value === config.yAxis)}
                onChange={(v) => updateConfig({ yAxis: v.value })}
                placeholder="Select measure..."
              />
            </div>

            {config.chartType !== 'pie' && config.chartType !== 'table' && (
              <div className={styles.configSection}>
                <label className={styles.configLabel}>Group By (optional)</label>
                <Select
                  options={[{ label: 'None', value: '' }, ...dimensionOptions]}
                  value={dimensionOptions.find((o) => o.value === config.groupBy) || { label: 'None', value: '' }}
                  onChange={(v) => updateConfig({ groupBy: v.value || undefined })}
                  placeholder="Select grouping..."
                  isClearable
                />
              </div>
            )}

            <div className={styles.configSection}>
              <label className={styles.configLabel}>Title</label>
              <Input
                value={config.title || ''}
                onChange={(e) => updateConfig({ title: e.currentTarget.value })}
                placeholder="Chart title..."
              />
            </div>

            <div className={styles.configSection}>
              <div className={styles.configRow}>
                <label className={styles.configLabel}>Show Legend</label>
                <Switch
                  value={config.showLegend}
                  onChange={(e) => updateConfig({ showLegend: e.currentTarget.checked })}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Save Modal */}
      <Modal
        title="Save to Dashboard"
        isOpen={showSaveModal}
        onDismiss={() => setShowSaveModal(false)}
      >
        <div className={styles.modalContent}>
          <div className={styles.configSection}>
            <label className={styles.configLabel}>Dashboard Title</label>
            <Input
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.currentTarget.value)}
              placeholder={`${selectedCube?.label || 'Chart'} Dashboard`}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Spinner inline size="sm" /> : <Icon name="save" />}
              {saving ? 'Saving...' : 'Create Dashboard'}
            </Button>
          </div>
        </div>
      </Modal>
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
    background: ${theme.colors.background.canvas};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(2)} ${theme.spacing(3)};
    background: ${theme.colors.background.primary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  headerTitle: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};

    h1 {
      margin: 0;
      font-size: ${theme.typography.h4.fontSize};
    }

    p {
      margin: 0;
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.size.sm};
    }
  `,
  headerActions: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  mainContent: css`
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  `,
  leftPanel: css`
    width: 280px;
    min-width: 250px;
    background: ${theme.colors.background.primary};
    border-right: 1px solid ${theme.colors.border.weak};
    display: flex;
    flex-direction: column;
  `,
  centerPanel: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: ${theme.spacing(2)};
  `,
  rightPanel: css`
    width: 300px;
    min-width: 280px;
    background: ${theme.colors.background.primary};
    border-left: 1px solid ${theme.colors.border.weak};
    overflow-y: auto;
  `,
  panelHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};
    font-weight: ${theme.typography.fontWeightMedium};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  searchBox: css`
    padding: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  datasetList: css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing(1)};
  `,
  datasetItem: css`
    padding: ${theme.spacing(1.5)};
    border-radius: ${theme.shape.radius.default};
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  datasetItemSelected: css`
    background: ${theme.colors.action.selected};
    border-left: 3px solid ${theme.colors.primary.main};
  `,
  datasetName: css`
    font-weight: ${theme.typography.fontWeightMedium};
    font-size: ${theme.typography.size.sm};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  datasetMeta: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
  `,
  placeholder: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: ${theme.colors.text.secondary};

    h2 {
      margin: ${theme.spacing(2)} 0 ${theme.spacing(1)} 0;
    }

    p {
      margin: 0;
    }
  `,
  placeholderIcon: css`
    color: ${theme.colors.text.disabled};
  `,
  loadingState: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
  `,
  emptyState: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(4)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  chartContainer: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: ${theme.colors.background.primary};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
  `,
  chartHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};

    h2 {
      margin: 0;
      font-size: ${theme.typography.h5.fontSize};
    }
  `,
  chartMeta: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
  `,
  chartPreview: css`
    flex: 1;
    padding: ${theme.spacing(2)};
    min-height: 400px;
  `,
  configSection: css`
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  configLabel: css`
    display: block;
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.fontWeightMedium};
    margin-bottom: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
  `,
  configRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  chartTypeGrid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${theme.spacing(1)};
  `,
  chartTypeButton: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(0.5)};
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    cursor: pointer;
    transition: all 0.2s;

    span {
      font-size: ${theme.typography.size.xs};
    }

    &:hover {
      border-color: ${theme.colors.primary.main};
    }
  `,
  chartTypeButtonActive: css`
    background: ${theme.colors.primary.transparent};
    border-color: ${theme.colors.primary.main};
    color: ${theme.colors.primary.text};
  `,
  modalContent: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  modalActions: css`
    display: flex;
    justify-content: flex-end;
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(2)};
  `,
});

export default ChartStudio;
