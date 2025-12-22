/**
 * SimpleChart Component
 *
 * A lightweight SVG-based chart component for live preview.
 * Supports bar, line, area, pie, scatter, and table visualizations.
 */

import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';

import type { ChartConfig, CubeDimension, CubeMeasure, DataRow } from '../types';

interface SimpleChartProps {
  data: DataRow[];
  config: ChartConfig;
  dimensions: CubeDimension[];
  measures: CubeMeasure[];
}

// Color palette for series
const COLORS = [
  '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42',
  '#1F78C1', '#BA43A9', '#705DA0', '#508642', '#CCA300',
];

/**
 * Get variable name from URI
 */
function uriToVarName(uri: string): string {
  const parts = uri.split(/[/#]/);
  const name = parts[parts.length - 1] || 'var';
  return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

/**
 * Get label for a dimension or measure
 */
function getLabel(uri: string, dimensions: CubeDimension[], measures: CubeMeasure[]): string {
  const varName = uriToVarName(uri);
  const dim = dimensions.find((d) => uriToVarName(d.uri) === varName);
  if (dim) return dim.label;
  const measure = measures.find((m) => uriToVarName(m.uri) === varName);
  return measure?.label || varName;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  config,
  dimensions,
  measures,
}) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  // Prepare data for visualization
  const chartData = useMemo(() => {
    if (!config.xAxis || !config.yAxis || data.length === 0) {
      return null;
    }

    const xVar = uriToVarName(config.xAxis);
    const yVar = uriToVarName(config.yAxis);
    const groupVar = config.groupBy ? uriToVarName(config.groupBy) : null;

    // Aggregate data by x-axis value
    const aggregated = new Map<string, Map<string, number>>();

    data.forEach((row) => {
      const xValue = String(row[xVar] ?? 'Unknown');
      const yValue = Number(row[yVar]) || 0;
      const groupValue = groupVar ? String(row[groupVar] ?? 'Other') : 'Value';

      if (!aggregated.has(xValue)) {
        aggregated.set(xValue, new Map());
      }
      const group = aggregated.get(xValue)!;
      group.set(groupValue, (group.get(groupValue) || 0) + yValue);
    });

    // Convert to array format
    const categories = Array.from(aggregated.keys()).slice(0, 20); // Limit for performance
    const series = new Set<string>();
    aggregated.forEach((groups) => {
      groups.forEach((_, key) => series.add(key));
    });
    const seriesNames = Array.from(series).slice(0, 10); // Limit series

    const values: { category: string; values: { [key: string]: number } }[] = categories.map((cat) => {
      const groups = aggregated.get(cat)!;
      const vals: { [key: string]: number } = {};
      seriesNames.forEach((s) => {
        vals[s] = groups.get(s) || 0;
      });
      return { category: cat, values: vals };
    });

    return { categories, seriesNames, values };
  }, [data, config]);

  // Render empty state
  if (!chartData) {
    return (
      <div className={styles.emptyChart}>
        <p>Configure X-Axis and Y-Axis to see a preview</p>
      </div>
    );
  }

  const { categories, seriesNames, values } = chartData;

  // Calculate chart dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 120, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate max value for scaling
  let maxValue = 0;
  values.forEach((v) => {
    Object.values(v.values).forEach((val) => {
      if (val > maxValue) maxValue = val;
    });
  });
  maxValue = maxValue || 1;

  // Render based on chart type
  const renderChart = () => {
    switch (config.chartType) {
      case 'bar':
        return renderBarChart();
      case 'line':
      case 'area':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'scatter':
        return renderScatterChart();
      case 'table':
        return renderTable();
      default:
        return renderBarChart();
    }
  };

  // Bar Chart
  const renderBarChart = () => {
    const barWidth = chartWidth / categories.length / (seriesNames.length + 1);
    const barPadding = barWidth * 0.1;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke={theme.colors.text.disabled}
        />
        {/* X-axis */}
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight}
          stroke={theme.colors.text.disabled}
        />

        {/* Bars */}
        {values.map((item, i) => {
          const groupX = margin.left + (i + 0.5) * (chartWidth / categories.length);

          return (
            <g key={item.category}>
              {seriesNames.map((series, j) => {
                const value = item.values[series] || 0;
                const barHeight = (value / maxValue) * chartHeight;
                const x = groupX - (seriesNames.length * barWidth) / 2 + j * barWidth + barPadding / 2;
                const y = margin.top + chartHeight - barHeight;

                return (
                  <rect
                    key={series}
                    x={x}
                    y={y}
                    width={barWidth - barPadding}
                    height={barHeight}
                    fill={COLORS[j % COLORS.length]}
                    rx={2}
                  >
                    <title>{`${item.category} - ${series}: ${value.toLocaleString()}`}</title>
                  </rect>
                );
              })}

              {/* X-axis label */}
              <text
                x={groupX}
                y={margin.top + chartHeight + 20}
                textAnchor="middle"
                fontSize={10}
                fill={theme.colors.text.secondary}
              >
                {item.category.length > 10 ? item.category.slice(0, 10) + '...' : item.category}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio}>
            <text
              x={margin.left - 10}
              y={margin.top + chartHeight - ratio * chartHeight + 4}
              textAnchor="end"
              fontSize={10}
              fill={theme.colors.text.secondary}
            >
              {(maxValue * ratio).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
            <line
              x1={margin.left}
              y1={margin.top + chartHeight - ratio * chartHeight}
              x2={margin.left + chartWidth}
              y2={margin.top + chartHeight - ratio * chartHeight}
              stroke={theme.colors.border.weak}
              strokeDasharray="4 4"
            />
          </g>
        ))}

        {/* Legend */}
        {config.showLegend && seriesNames.length > 1 && (
          <g transform={`translate(${margin.left + chartWidth + 10}, ${margin.top})`}>
            {seriesNames.map((series, i) => (
              <g key={series} transform={`translate(0, ${i * 20})`}>
                <rect width={12} height={12} fill={COLORS[i % COLORS.length]} rx={2} />
                <text x={18} y={10} fontSize={11} fill={theme.colors.text.primary}>
                  {series.length > 12 ? series.slice(0, 12) + '...' : series}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Title */}
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill={theme.colors.text.primary}
        >
          {config.title || 'Chart Preview'}
        </text>
      </svg>
    );
  };

  // Line/Area Chart
  const renderLineChart = () => {
    const pointSpacing = chartWidth / (categories.length - 1 || 1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
        {/* Axes */}
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke={theme.colors.text.disabled} />
        <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} stroke={theme.colors.text.disabled} />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={margin.left}
            y1={margin.top + chartHeight - ratio * chartHeight}
            x2={margin.left + chartWidth}
            y2={margin.top + chartHeight - ratio * chartHeight}
            stroke={theme.colors.border.weak}
            strokeDasharray="4 4"
          />
        ))}

        {/* Lines/Areas for each series */}
        {seriesNames.map((series, seriesIndex) => {
          const points = values.map((item, i) => {
            const value = item.values[series] || 0;
            const x = margin.left + i * pointSpacing;
            const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
            return { x, y };
          });

          const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

          if (config.chartType === 'area') {
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${margin.top + chartHeight} L ${points[0].x} ${margin.top + chartHeight} Z`;
            return (
              <g key={series}>
                <path d={areaPath} fill={COLORS[seriesIndex % COLORS.length]} opacity={0.3} />
                <path d={linePath} fill="none" stroke={COLORS[seriesIndex % COLORS.length]} strokeWidth={2} />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={4} fill={COLORS[seriesIndex % COLORS.length]}>
                    <title>{`${values[i].category} - ${series}: ${values[i].values[series]?.toLocaleString()}`}</title>
                  </circle>
                ))}
              </g>
            );
          }

          return (
            <g key={series}>
              <path d={linePath} fill="none" stroke={COLORS[seriesIndex % COLORS.length]} strokeWidth={2} />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill={COLORS[seriesIndex % COLORS.length]}>
                  <title>{`${values[i].category} - ${series}: ${values[i].values[series]?.toLocaleString()}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* X-axis labels */}
        {values.map((item, i) => (
          <text
            key={i}
            x={margin.left + i * pointSpacing}
            y={margin.top + chartHeight + 20}
            textAnchor="middle"
            fontSize={10}
            fill={theme.colors.text.secondary}
          >
            {item.category.length > 8 ? item.category.slice(0, 8) + '...' : item.category}
          </text>
        ))}

        {/* Legend */}
        {config.showLegend && seriesNames.length > 1 && (
          <g transform={`translate(${margin.left + chartWidth + 10}, ${margin.top})`}>
            {seriesNames.map((series, i) => (
              <g key={series} transform={`translate(0, ${i * 20})`}>
                <line x1={0} y1={6} x2={12} y2={6} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                <text x={18} y={10} fontSize={11} fill={theme.colors.text.primary}>
                  {series.length > 12 ? series.slice(0, 12) + '...' : series}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Title */}
        <text x={width / 2} y={20} textAnchor="middle" fontSize={14} fontWeight="bold" fill={theme.colors.text.primary}>
          {config.title || 'Chart Preview'}
        </text>
      </svg>
    );
  };

  // Pie Chart
  const renderPieChart = () => {
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 20;

    // Calculate totals per category
    const totals = values.map((v) => ({
      category: v.category,
      total: Object.values(v.values).reduce((a, b) => a + b, 0),
    }));
    const grandTotal = totals.reduce((a, b) => a + b.total, 0) || 1;

    let currentAngle = -Math.PI / 2;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
        {totals.map((item, i) => {
          const sliceAngle = (item.total / grandTotal) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          currentAngle = endAngle;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          const largeArc = sliceAngle > Math.PI ? 1 : 0;

          const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <path key={item.category} d={path} fill={COLORS[i % COLORS.length]}>
              <title>{`${item.category}: ${item.total.toLocaleString()} (${((item.total / grandTotal) * 100).toFixed(1)}%)`}</title>
            </path>
          );
        })}

        {/* Legend */}
        {config.showLegend && (
          <g transform={`translate(${width - margin.right + 20}, ${margin.top})`}>
            {totals.slice(0, 10).map((item, i) => (
              <g key={item.category} transform={`translate(0, ${i * 18})`}>
                <rect width={12} height={12} fill={COLORS[i % COLORS.length]} rx={2} />
                <text x={18} y={10} fontSize={10} fill={theme.colors.text.primary}>
                  {item.category.length > 15 ? item.category.slice(0, 15) + '...' : item.category}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Title */}
        <text x={width / 2} y={20} textAnchor="middle" fontSize={14} fontWeight="bold" fill={theme.colors.text.primary}>
          {config.title || 'Chart Preview'}
        </text>
      </svg>
    );
  };

  // Scatter Chart
  const renderScatterChart = () => {
    // For scatter, use first two numeric values
    const points = values.map((item, i) => {
      const xVal = (i / (values.length - 1 || 1)) * chartWidth;
      const yVal = ((Object.values(item.values)[0] || 0) / maxValue) * chartHeight;
      return { x: margin.left + xVal, y: margin.top + chartHeight - yVal, label: item.category };
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
        {/* Axes */}
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke={theme.colors.text.disabled} />
        <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} stroke={theme.colors.text.disabled} />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={6} fill={COLORS[0]} opacity={0.7}>
            <title>{p.label}</title>
          </circle>
        ))}

        {/* Title */}
        <text x={width / 2} y={20} textAnchor="middle" fontSize={14} fontWeight="bold" fill={theme.colors.text.primary}>
          {config.title || 'Chart Preview'}
        </text>
      </svg>
    );
  };

  // Table
  const renderTable = () => {
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              {seriesNames.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.slice(0, 20).map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                {seriesNames.map((s) => (
                  <td key={s}>{(item.values[s] || 0).toLocaleString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {values.length > 20 && (
          <div className={styles.tableMore}>
            Showing 20 of {values.length} rows
          </div>
        )}
      </div>
    );
  };

  return <div className={styles.chartWrapper}>{renderChart()}</div>;
};

/**
 * Styles
 */
const getStyles = (theme: GrafanaTheme2) => ({
  chartWrapper: css`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  svg: css`
    max-width: 100%;
    max-height: 100%;
  `,
  emptyChart: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${theme.colors.text.secondary};
  `,
  tableContainer: css`
    width: 100%;
    overflow: auto;
    max-height: 100%;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
    font-size: ${theme.typography.size.sm};

    th, td {
      padding: ${theme.spacing(1)};
      text-align: left;
      border-bottom: 1px solid ${theme.colors.border.weak};
    }

    th {
      background: ${theme.colors.background.secondary};
      font-weight: ${theme.typography.fontWeightMedium};
    }

    tr:hover td {
      background: ${theme.colors.action.hover};
    }
  `,
  tableMore: css`
    padding: ${theme.spacing(1)};
    text-align: center;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
});
