/**
 * Chart Preview Component
 *
 * Renders a simple preview of data using native HTML/CSS.
 * This is a lightweight alternative to Scenes SDK for preview purposes.
 *
 * For production dashboards, users save to Grafana and get full native panels.
 */

import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, DataFrame, FieldType } from '@grafana/data';
import { useStyles2, Icon, Spinner } from '@grafana/ui';

// ============================================================================
// Types
// ============================================================================

export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'stat';

interface ChartPreviewProps {
  data: DataFrame | null;
  chartType: ChartType;
  loading?: boolean;
  error?: string | null;
  title?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFieldValues(frame: DataFrame, fieldName: string): any[] {
  const field = frame.fields.find(f => f.name === fieldName);
  return field?.values || [];
}

function aggregateData(
  frame: DataFrame
): Array<{ label: string; value: number }> {
  if (frame.fields.length < 2) return [];

  // Find string and number fields
  const labelField = frame.fields.find(f => f.type === FieldType.string);
  const valueField = frame.fields.find(f => f.type === FieldType.number);

  if (!labelField || !valueField) {
    // Fallback: use first two fields
    const labels = frame.fields[0]?.values || [];
    const values = frame.fields[1]?.values || [];

    const aggregated = new Map<string, number>();
    for (let i = 0; i < Math.min(labels.length, values.length); i++) {
      const label = String(labels[i] || 'Unknown');
      const value = Number(values[i]) || 0;
      aggregated.set(label, (aggregated.get(label) || 0) + value);
    }

    return Array.from(aggregated.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }

  const labels = labelField.values;
  const values = valueField.values;

  const aggregated = new Map<string, number>();
  for (let i = 0; i < Math.min(labels.length, values.length); i++) {
    const label = String(labels[i] || 'Unknown');
    const value = Number(values[i]) || 0;
    aggregated.set(label, (aggregated.get(label) || 0) + value);
  }

  return Array.from(aggregated.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// ============================================================================
// Bar Chart
// ============================================================================

const BarChart: React.FC<{ data: Array<{ label: string; value: number }> }> = ({ data }) => {
  const styles = useStyles2(getChartStyles);

  if (data.length === 0) return <NoData />;

  const displayData = data.slice(0, 25);
  const maxValue = Math.max(...displayData.map(d => d.value), 1);

  return (
    <div className={styles.barChart}>
      {displayData.map((item, i) => (
        <div key={i} className={styles.barRow}>
          <div className={styles.barLabel} title={item.label}>
            {item.label.length > 30 ? item.label.slice(0, 30) + '...' : item.label}
          </div>
          <div className={styles.barContainer}>
            <div
              className={styles.bar}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className={styles.barValue}>
            {item.value.toLocaleString()}
          </div>
        </div>
      ))}
      {data.length > 25 && (
        <div className={styles.moreRows}>
          +{data.length - 25} more rows
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Pie Chart
// ============================================================================

const PieChart: React.FC<{ data: Array<{ label: string; value: number }> }> = ({ data }) => {
  const styles = useStyles2(getChartStyles);

  if (data.length === 0) return <NoData />;

  const displayData = data.slice(0, 10);
  const total = displayData.reduce((sum, d) => sum + d.value, 0);
  const colors = [
    '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42',
    '#1F78C1', '#BA43A9', '#705DA0', '#508642', '#CCA300',
  ];

  // Calculate pie segments
  let cumulativePercent = 0;
  const segments = displayData.map((item, i) => {
    const percent = (item.value / total) * 100;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...item,
      percent,
      start,
      end: cumulativePercent,
      color: colors[i % colors.length],
    };
  });

  return (
    <div className={styles.pieChart}>
      <svg viewBox="0 0 100 100" className={styles.pieSvg}>
        {segments.map((seg, i) => {
          const startAngle = (seg.start / 100) * 360 - 90;
          const endAngle = (seg.end / 100) * 360 - 90;
          const largeArc = seg.percent > 50 ? 1 : 0;

          const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

          const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return <path key={i} d={d} fill={seg.color} />;
        })}
      </svg>
      <div className={styles.pieLegend}>
        {segments.map((seg, i) => (
          <div key={i} className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ backgroundColor: seg.color }}
            />
            <span className={styles.legendLabel}>
              {seg.label.length > 25 ? seg.label.slice(0, 25) + '...' : seg.label}
            </span>
            <span className={styles.legendValue}>
              {seg.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Table
// ============================================================================

const TableView: React.FC<{ frame: DataFrame }> = ({ frame }) => {
  const styles = useStyles2(getChartStyles);

  if (frame.fields.length === 0) return <NoData />;

  const rows = Math.min(frame.length, 100);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {frame.fields.map((field, i) => (
              <th key={i}>{field.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <tr key={rowIdx}>
              {frame.fields.map((field, colIdx) => (
                <td key={colIdx}>
                  {formatValue(field.values[rowIdx], field.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {frame.length > 100 && (
        <div className={styles.moreRows}>
          Showing 100 of {frame.length} rows
        </div>
      )}
    </div>
  );
};

function formatValue(value: any, type: FieldType): string {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case FieldType.number:
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case FieldType.time:
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
}

// ============================================================================
// Stat
// ============================================================================

const StatView: React.FC<{ data: Array<{ label: string; value: number }> }> = ({ data }) => {
  const styles = useStyles2(getChartStyles);

  if (data.length === 0) return <NoData />;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const count = data.length;
  const avg = total / count;

  return (
    <div className={styles.statContainer}>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{total.toLocaleString()}</div>
        <div className={styles.statLabel}>Total</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{count.toLocaleString()}</div>
        <div className={styles.statLabel}>Count</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        <div className={styles.statLabel}>Average</div>
      </div>
    </div>
  );
};

// ============================================================================
// No Data
// ============================================================================

const NoData: React.FC = () => {
  const styles = useStyles2(getChartStyles);
  return (
    <div className={styles.noData}>
      <Icon name="exclamation-triangle" size="xl" />
      <p>No data available</p>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ChartPreview: React.FC<ChartPreviewProps> = ({
  data,
  chartType,
  loading = false,
  error = null,
  title,
}) => {
  const styles = useStyles2(getChartStyles);

  const aggregatedData = useMemo(() => {
    if (!data) return [];
    return aggregateData(data);
  }, [data]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="xl" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Icon name="exclamation-circle" size="xl" />
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.chartArea}>
        {chartType === 'bar' && <BarChart data={aggregatedData} />}
        {chartType === 'line' && <BarChart data={aggregatedData} />}
        {chartType === 'pie' && <PieChart data={aggregatedData} />}
        {chartType === 'table' && <TableView frame={data} />}
        {chartType === 'stat' && <StatView data={aggregatedData} />}
      </div>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const getChartStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
    height: 100%;
    min-height: 300px;
    display: flex;
    flex-direction: column;
  `,
  title: css`
    margin: 0 0 ${theme.spacing(2)} 0;
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  chartArea: css`
    flex: 1;
    overflow: auto;
  `,
  loading: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: ${theme.colors.text.secondary};
    gap: ${theme.spacing(2)};
  `,
  error: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: ${theme.colors.error.text};
    gap: ${theme.spacing(2)};
  `,
  noData: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: ${theme.colors.text.secondary};
    gap: ${theme.spacing(1)};
  `,

  // Bar chart styles
  barChart: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
  `,
  barRow: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  barLabel: css`
    width: 180px;
    flex-shrink: 0;
    text-align: right;
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  barContainer: css`
    flex: 1;
    height: 24px;
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.borderRadius()};
    overflow: hidden;
  `,
  bar: css`
    height: 100%;
    background: ${theme.colors.primary.main};
    border-radius: ${theme.shape.borderRadius()};
    transition: width 0.3s ease;
  `,
  barValue: css`
    width: 80px;
    flex-shrink: 0;
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
  `,
  moreRows: css`
    text-align: center;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    padding: ${theme.spacing(1)};
  `,

  // Pie chart styles
  pieChart: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(4)};

    @media (max-width: 600px) {
      flex-direction: column;
    }
  `,
  pieSvg: css`
    width: 200px;
    height: 200px;
    flex-shrink: 0;
  `,
  pieLegend: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
  `,
  legendItem: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
  `,
  legendColor: css`
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  `,
  legendLabel: css`
    flex: 1;
    color: ${theme.colors.text.primary};
  `,
  legendValue: css`
    color: ${theme.colors.text.secondary};
  `,

  // Table styles
  tableContainer: css`
    overflow: auto;
    max-height: 400px;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
    font-size: ${theme.typography.size.sm};

    th, td {
      padding: ${theme.spacing(1)} ${theme.spacing(2)};
      text-align: left;
      border-bottom: 1px solid ${theme.colors.border.weak};
    }

    th {
      background: ${theme.colors.background.secondary};
      font-weight: ${theme.typography.fontWeightMedium};
      position: sticky;
      top: 0;
    }

    tr:hover td {
      background: ${theme.colors.action.hover};
    }
  `,

  // Stat styles
  statContainer: css`
    display: flex;
    gap: ${theme.spacing(3)};
    justify-content: center;
    flex-wrap: wrap;
  `,
  statCard: css`
    text-align: center;
    padding: ${theme.spacing(3)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.borderRadius()};
    min-width: 120px;
  `,
  statValue: css`
    font-size: ${theme.typography.h2.fontSize};
    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.text.primary};
  `,
  statLabel: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    margin-top: ${theme.spacing(0.5)};
  `,
});

export default ChartPreview;
