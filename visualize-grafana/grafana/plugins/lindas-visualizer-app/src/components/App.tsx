import React, { useState, useEffect } from 'react';
import { AppRootProps, AppEvents } from '@grafana/data';
import {
  Button,
  useStyles2,
  Icon,
  Modal,
  Input,
  Field,
  LoadingPlaceholder,
  Tab,
  TabsBar,
  TabContent,
  ConfirmModal,
  Alert,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { getAppEvents, locationService } from '@grafana/runtime';
import { fetchCubeMetadata, CubeMetadata } from '../utils/sparql';
import { ChartConfig, DatasetConfig, createGrafanaDashboard } from '../utils/dashboard';
import { Configurator } from './Configurator';
import { Filters } from './Filters';
import { ChartPreview } from './ChartPreview';
import { DatasetBrowser } from './DatasetBrowser';

type ViewMode = 'browse' | 'configure';

export const App = (props: AppRootProps) => {
  const styles = useStyles2(getStyles);
  const [config, setConfig] = useState<ChartConfig>({
    title: 'New Lindas Dashboard',
    datasets: [],
  });
  const [activeDatasetIndex, setActiveDatasetIndex] = useState<number>(-1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCubeIri, setNewCubeIri] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [showBrowser, setShowBrowser] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<number | null>(null);

  // Sync with URL cube parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cube = params.get('cube');
    if (cube && config.datasets.length === 0) {
      addDataset(cube);
    }
  }, []);

  const addDataset = async (iri: string) => {
    setLoading(true);
    try {
      const metadata = await fetchCubeMetadata(iri);

      // Auto-detect best defaults for chart configuration
      const temporalDim = metadata.dimensions.find(d => d.isTemporal);
      const firstMeasure = metadata.measures[0];
      const categoricalDim = metadata.dimensions.find(d => !d.isTemporal && d.scaleType === 'nominal');

      const newDataset: DatasetConfig = {
        cubeIri: iri,
        chartType: temporalDim ? 'timeseries' : 'barchart',
        title: metadata.label || 'New Dataset',
        fieldMapping: {
          x: temporalDim?.iri || metadata.dimensions[0]?.iri,
          y: firstMeasure?.iri,
          series: categoricalDim?.iri,
        },
        dimensions: metadata.dimensions,
        measures: metadata.measures,
      };

      setConfig(prev => {
        const updated = {
          ...prev,
          datasets: [...prev.datasets, newDataset],
        };
        return updated;
      });
      setActiveDatasetIndex(config.datasets.length);
      setShowAddModal(false);
      setShowBrowser(false);
      setNewCubeIri('');
      setViewMode('configure');

      getAppEvents().publish({
        type: AppEvents.alertSuccess.name,
        payload: ['Dataset added successfully', `Loaded "${metadata.label}"`],
      });
    } catch (error) {
      getAppEvents().publish({
        type: AppEvents.alertError.name,
        payload: ['Failed to fetch cube metadata', String(error)],
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDataset = (index: number, updated: DatasetConfig) => {
    setConfig(prev => {
      const newDatasets = [...prev.datasets];
      newDatasets[index] = updated;
      return { ...prev, datasets: newDatasets };
    });
  };

  const removeDataset = (index: number) => {
    setConfig(prev => {
      const newDatasets = prev.datasets.filter((_, i) => i !== index);
      return { ...prev, datasets: newDatasets };
    });
    if (activeDatasetIndex >= index) {
      setActiveDatasetIndex(Math.max(0, activeDatasetIndex - 1));
    }
    setShowRemoveConfirm(null);
  };

  const handleExportDashboard = async () => {
    if (config.datasets.length === 0) {
      getAppEvents().publish({
        type: AppEvents.alertWarning.name,
        payload: ['No datasets to export', 'Add at least one dataset first'],
      });
      return;
    }

    setExportLoading(true);
    try {
      const dashboardUid = await createGrafanaDashboard(config);
      getAppEvents().publish({
        type: AppEvents.alertSuccess.name,
        payload: ['Dashboard created!', 'Opening in new tab...'],
      });

      // Open the created dashboard
      window.open(`/d/${dashboardUid}`, '_blank');
    } catch (error) {
      getAppEvents().publish({
        type: AppEvents.alertError.name,
        payload: ['Failed to create dashboard', String(error)],
      });
    } finally {
      setExportLoading(false);
    }
  };

  const activeDataset = config.datasets[activeDatasetIndex];

  // Show browser when in browse mode or when explicitly shown
  if (showBrowser) {
    return (
      <div className={styles.container}>
        <DatasetBrowser
          onSelectDataset={addDataset}
          onClose={() => setShowBrowser(false)}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icon name="chart-line" size="xl" className={styles.headerIcon} />
          <Input
            value={config.title}
            onChange={e => setConfig({ ...config, title: e.currentTarget.value })}
            className={styles.titleInput}
            placeholder="Dashboard Title"
          />
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            onClick={() => setShowBrowser(true)}
            icon="search"
          >
            Browse Datasets
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowAddModal(true)}
            icon="link"
          >
            Add by IRI
          </Button>
          {config.datasets.length > 0 && (
            <Button
              variant="primary"
              onClick={handleExportDashboard}
              icon="external-link-alt"
              disabled={exportLoading}
            >
              {exportLoading ? 'Creating...' : 'Create Dashboard'}
            </Button>
          )}
        </div>
      </div>

      {config.datasets.length > 0 ? (
        <div className={styles.mainLayout}>
          <TabsBar className={styles.tabsBar}>
            {config.datasets.map((d, i) => (
              <div key={i} className={styles.tabWrapper}>
                <Tab
                  label={d.title}
                  active={i === activeDatasetIndex}
                  onChangeTab={() => setActiveDatasetIndex(i)}
                />
                <button
                  className={styles.removeTabBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemoveConfirm(i);
                  }}
                  title="Remove dataset"
                >
                  <Icon name="times" size="sm" />
                </button>
              </div>
            ))}
          </TabsBar>

          <TabContent className={styles.tabContent}>
            {activeDataset && (
              <div className={styles.threeColumn}>
                <div className={styles.columnLeft}>
                  <div className={styles.sectionHeader}>
                    <Icon name="sliders-v-alt" />
                    <span>Chart Configuration</span>
                  </div>
                  <Configurator
                    dataset={activeDataset}
                    onDatasetChange={(updated) => updateDataset(activeDatasetIndex, updated)}
                  />
                </div>

                <div className={styles.columnCenter}>
                  <ChartPreview dataset={activeDataset} />
                </div>

                <div className={styles.columnRight}>
                  <div className={styles.sectionHeader}>
                    <Icon name="filter" />
                    <span>Data Filters</span>
                  </div>
                  <Filters
                    cubeIri={activeDataset.cubeIri}
                    dimensions={activeDataset.dimensions}
                    selectedFilters={activeDataset.fieldMapping.filters || {}}
                    onFiltersChange={(f) => updateDataset(activeDatasetIndex, {
                      ...activeDataset,
                      fieldMapping: { ...activeDataset.fieldMapping, filters: f },
                    })}
                  />
                </div>
              </div>
            )}
          </TabContent>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyCard}>
            <Icon name="database" size="xxxl" style={{ marginBottom: 20, color: 'gray' }} />
            <h2>Create Visualizations from LINDAS Data</h2>
            <p>
              Browse available datasets from the Swiss Linked Data Service or enter a cube IRI directly.
            </p>
            <div className={styles.emptyActions}>
              <Button size="lg" onClick={() => setShowBrowser(true)} icon="search">
                Browse Datasets
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setShowAddModal(true)} icon="link">
                Enter Cube IRI
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dataset Modal */}
      <Modal
        title="Add Dataset by IRI"
        isOpen={showAddModal}
        onDismiss={() => setShowAddModal(false)}
      >
        <Field
          label="Cube IRI"
          description="Enter the IRI of the LINDAS cube (found on visualize.admin.ch)"
        >
          <Input
            value={newCubeIri}
            onChange={e => setNewCubeIri(e.currentTarget.value)}
            placeholder="https://ld.admin.ch/cube/..."
            autoFocus
          />
        </Field>
        {loading && <LoadingPlaceholder text="Fetching metadata..." />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => addDataset(newCubeIri)} disabled={!newCubeIri || loading}>
            Add Dataset
          </Button>
        </div>
      </Modal>

      {/* Remove Dataset Confirmation */}
      <ConfirmModal
        isOpen={showRemoveConfirm !== null}
        title="Remove Dataset"
        body={`Are you sure you want to remove "${config.datasets[showRemoveConfirm ?? 0]?.title}"?`}
        confirmText="Remove"
        dismissText="Cancel"
        onConfirm={() => removeDataset(showRemoveConfirm!)}
        onDismiss={() => setShowRemoveConfirm(null)}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${theme.colors.background.canvas};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(1.5, 3)};
    background: ${theme.colors.background.primary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  headerTitle: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  headerIcon: css`
    color: ${theme.colors.primary.main};
  `,
  titleInput: css`
    width: 300px;
    input {
      font-size: ${theme.typography.size.lg};
      font-weight: ${theme.typography.fontWeightBold};
      border-color: transparent;
      &:hover, &:focus {
        border-color: ${theme.colors.border.medium};
      }
    }
  `,
  headerActions: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  mainLayout: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  tabsBar: css`
    padding: ${theme.spacing(0, 2)};
    background: ${theme.colors.background.primary};
  `,
  tabContent: css`
    flex: 1;
    overflow: hidden;
  `,
  threeColumn: css`
    display: grid;
    grid-template-columns: 320px 1fr 300px;
    height: 100%;
    overflow: hidden;
  `,
  columnLeft: css`
    border-right: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.primary};
    padding: ${theme.spacing(2)};
    overflow-y: auto;
  `,
  columnCenter: css`
    background: ${theme.colors.background.canvas};
    padding: ${theme.spacing(4)};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `,
  columnRight: css`
    border-left: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.primary};
    padding: ${theme.spacing(2)};
    overflow-y: auto;
  `,
  sectionHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding-bottom: ${theme.spacing(1.5)};
    margin-bottom: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.secondary};
  `,
  emptyState: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${theme.colors.background.canvas};
  `,
  emptyCard: css`
    background: ${theme.colors.background.primary};
    padding: ${theme.spacing(6)};
    border-radius: ${theme.shape.borderRadius()};
    border: 1px solid ${theme.colors.border.weak};
    text-align: center;
    max-width: 500px;
    box-shadow: ${theme.shadows.z2};
    h2 { margin-bottom: 12px; }
    p { color: ${theme.colors.text.secondary}; margin-bottom: 24px; }
  `,
  emptyActions: css`
    display: flex;
    gap: ${theme.spacing(2)};
    justify-content: center;
  `,
  tabWrapper: css`
    display: inline-flex;
    align-items: center;
    position: relative;
  `,
  removeTabBtn: css`
    background: none;
    border: none;
    cursor: pointer;
    padding: ${theme.spacing(0.5)};
    margin-left: ${theme.spacing(0.5)};
    opacity: 0.6;
    color: ${theme.colors.text.secondary};
    border-radius: ${theme.shape.borderRadius(0.5)};

    &:hover {
      opacity: 1;
      color: ${theme.colors.error.main};
      background: ${theme.colors.action.hover};
    }
  `,
});
