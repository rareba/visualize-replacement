import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Spinner,
  useTheme2,
  Alert,
} from '@grafana/ui';
import { DataFrame } from '@grafana/data';
import { DatasetConfig, generateSparqlQuery } from '../utils/dashboard';
import { executeSparqlQuery, transformToDataFrame, fetchTabularData } from '../utils/sparql';
import { css } from '@emotion/css';

interface ChartPreviewProps {
  dataset: DatasetConfig;
}

export const ChartPreview: React.FC<ChartPreviewProps> = ({ dataset }) => {
  const [data, setData] = useState<DataFrame | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const theme = useTheme2();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Skip if no field mappings configured (except for table mode)
      if (dataset.chartType !== 'table') {
        const hasX = dataset.fieldMapping.x || dataset.fieldMapping.segment;
        const hasY = dataset.fieldMapping.y || dataset.fieldMapping.value;
        if (!hasX && !hasY) {
          setData(null);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const query = generateSparqlQuery(dataset);
        const result = await executeSparqlQuery(query);
        const frame = transformToDataFrame(result);

        if (isMounted) {
          setData(frame);
          setRowCount(frame.length);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch chart data');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [dataset]);

  const styles = useMemo(() => ({
    container: css`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.borderRadius()};
      overflow: hidden;
      min-height: 400px;
      padding: ${theme.spacing(2)};
    `,
    chartWrapper: css`
      width: 100%;
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    chartTitle: css`
      font-size: ${theme.typography.h4.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      margin-bottom: ${theme.spacing(2)};
      color: ${theme.colors.text.primary};
    `,
    rowCount: css`
      margin-top: ${theme.spacing(1)};
      font-size: ${theme.typography.size.sm};
      color: ${theme.colors.text.secondary};
    `,
    emptyState: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: ${theme.colors.text.secondary};
      padding: ${theme.spacing(4)};

      h4 {
        margin: ${theme.spacing(2)} 0 ${theme.spacing(1)} 0;
        color: ${theme.colors.text.primary};
      }

      p {
        margin: 0;
        max-width: 300px;
      }
    `,
    previewBadge: css`
      position: absolute;
      top: ${theme.spacing(1)};
      right: ${theme.spacing(1)};
      background: ${theme.colors.warning.main};
      color: ${theme.colors.warning.contrastText};
      padding: ${theme.spacing(0.5, 1)};
      border-radius: ${theme.shape.borderRadius(0.5)};
      font-size: ${theme.typography.size.xs};
    `,
    chartContainer: css`
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    `,
    previewNote: css`
      font-size: ${theme.typography.size.sm};
      color: ${theme.colors.text.secondary};
      background: ${theme.colors.background.secondary};
      padding: ${theme.spacing(0.5, 1)};
      border-radius: ${theme.shape.borderRadius(0.5)};
      margin-bottom: ${theme.spacing(1)};
      text-align: center;
    `,
  }), [theme]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Spinner size={32} />
        <div style={{ marginTop: theme.spacing(1) }}>Loading visualization...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Alert title="Error loading data" severity="error">
          {error}
        </Alert>
      </div>
    );
  }

  // Show empty state when no field mappings
  if (!data && dataset.chartType !== 'table') {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-4-4-3 3" />
          </svg>
          <h4>Configure Your Chart</h4>
          <p>Select dimensions and measures on the left panel to preview your visualization.</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <Alert title="No data" severity="info">
          No data found for this configuration. Try adjusting your filters.
        </Alert>
      </div>
    );
  }

  const getChartTypeLabel = (chartType: string): string => {
    const labels: Record<string, string> = {
      'timeseries': 'Line Chart',
      'timeseries-area': 'Area Chart',
      'barchart': 'Column Chart',
      'barchart-horizontal': 'Bar Chart',
      'piechart': 'Pie Chart',
      'table': 'Table',
    };
    return labels[chartType] || chartType;
  };

  const renderChart = () => {
    const { chartType } = dataset;

    if (!data) return null;

    // For table mode, show without preview note
    if (chartType === 'table') {
      return (
        <Table
          data={data}
          width={800}
          height={400}
        />
      );
    }

    // For all other chart types, show data as table with a note
    // The actual visualization will render correctly in the exported Grafana dashboard
    return (
      <div className={styles.chartContainer}>
        <div className={styles.previewNote}>
          {getChartTypeLabel(chartType)} - Data Preview (Full chart in exported dashboard)
        </div>
        <Table
          data={data}
          width={800}
          height={350}
        />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.chartTitle}>{dataset.title}</div>
      <div className={styles.chartWrapper}>
        {renderChart()}
      </div>
      <div className={styles.rowCount}>
        {rowCount} data point{rowCount !== 1 ? 's' : ''} loaded
      </div>
    </div>
  );
};
