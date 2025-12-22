import React from 'react';
import { Icon, Select, Field, Input, FieldSet, Badge, Tooltip, IconName } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { GrafanaChartType, DatasetConfig } from '../utils/dashboard';
import { Dimension, Measure } from '../utils/sparql';

interface ConfiguratorProps {
  dataset: DatasetConfig;
  onDatasetChange: (updated: DatasetConfig) => void;
}

interface ChartTypeOption {
  id: GrafanaChartType;
  label: string;
  icon: IconName;
  description: string;
}

const CHART_TYPES: ChartTypeOption[] = [
  { id: 'barchart', label: 'Column', icon: 'graph-bar', description: 'Vertical bars for comparing categories' },
  { id: 'barchart-horizontal', label: 'Bar', icon: 'bars', description: 'Horizontal bars for ranking' },
  { id: 'timeseries', label: 'Line', icon: 'gf-interpolation-linear', description: 'Lines for trends over time' },
  { id: 'timeseries-area', label: 'Area', icon: 'gf-interpolation-linear', description: 'Filled areas for cumulative data' },
  { id: 'piechart', label: 'Pie', icon: 'circle', description: 'Parts of a whole' },
  { id: 'table', label: 'Table', icon: 'table', description: 'Raw data display' },
];

const getDimensionBadge = (dim: Dimension) => {
  if (dim.isTemporal) {
    return { text: 'Time', color: 'blue' as const, icon: 'clock-nine' as IconName };
  }
  if (dim.isNumerical) {
    return { text: 'Numeric', color: 'green' as const, icon: 'calculator-alt' as IconName };
  }
  if (dim.scaleType === 'ordinal') {
    return { text: 'Ordinal', color: 'orange' as const, icon: 'sort-amount-down' as IconName };
  }
  return { text: 'Category', color: 'purple' as const, icon: 'tag-alt' as IconName };
};

export const Configurator: React.FC<ConfiguratorProps> = ({
  dataset,
  onDatasetChange,
}) => {
  const styles = useStyles2(getStyles);

  const dimensionOptions: Array<SelectableValue<string>> = dataset.dimensions.map(d => {
    const badge = getDimensionBadge(d);
    return {
      label: d.label,
      value: d.iri,
      description: badge.text,
      icon: badge.icon,
    };
  });

  const measureOptions: Array<SelectableValue<string>> = dataset.measures.map(m => ({
    label: m.label,
    value: m.iri,
    description: m.unit || 'Measure',
  }));

  const handleFieldChange = (field: string, value: string | undefined) => {
    onDatasetChange({
      ...dataset,
      fieldMapping: {
        ...dataset.fieldMapping,
        [field]: value,
      },
    });
  };

  const handleChartTypeChange = (chartType: GrafanaChartType) => {
    // Reset field mappings when changing to pie chart or table
    if (chartType === 'piechart') {
      onDatasetChange({
        ...dataset,
        chartType,
        fieldMapping: {
          ...dataset.fieldMapping,
          value: dataset.measures[0]?.iri,
          segment: dataset.dimensions.find(d => !d.isTemporal)?.iri,
        },
      });
    } else if (chartType === 'table') {
      onDatasetChange({
        ...dataset,
        chartType,
        fieldMapping: {},
      });
    } else {
      onDatasetChange({ ...dataset, chartType });
    }
  };

  // Suggest best X axis based on chart type
  const suggestedX = dataset.chartType.includes('timeseries')
    ? dataset.dimensions.find(d => d.isTemporal)
    : dataset.dimensions.find(d => d.scaleType === 'nominal' || d.scaleType === 'ordinal');

  return (
    <div className={styles.container}>
      <FieldSet label="Chart Settings">
        <Field label="Title">
          <Input
            value={dataset.title}
            onChange={e => onDatasetChange({ ...dataset, title: e.currentTarget.value })}
            placeholder="Enter chart title..."
          />
        </Field>

        <Field label="Chart Type">
          <div className={styles.chartTypeGrid}>
            {CHART_TYPES.map(ct => (
              <Tooltip key={ct.id} content={ct.description} placement="top">
                <button
                  title={ct.label}
                  className={`${styles.chartTypeBtn} ${dataset.chartType === ct.id ? styles.chartTypeBtnActive : ''}`}
                  onClick={() => handleChartTypeChange(ct.id)}
                >
                  <Icon name={ct.icon} size="xl" />
                  <span className={styles.chartLabels}>{ct.label}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </Field>
      </FieldSet>

      <FieldSet label="Data Mapping">
        {dataset.chartType !== 'table' && dataset.chartType !== 'piechart' && (
          <>
            <Field
              label="X Axis"
              description={dataset.chartType.includes('timeseries') ? 'Select a temporal dimension' : 'Category or time dimension'}
            >
              <Select
                options={dimensionOptions}
                value={dimensionOptions.find(o => o.value === dataset.fieldMapping.x)}
                onChange={v => handleFieldChange('x', v?.value)}
                isClearable
                placeholder="Select dimension..."
                formatOptionLabel={(opt) => (
                  <div className={styles.optionLabel}>
                    {opt.icon && <Icon name={opt.icon as IconName} size="sm" />}
                    <span>{opt.label}</span>
                    {opt.description && (
                      <Badge text={opt.description} color="blue" className={styles.optionBadge} />
                    )}
                  </div>
                )}
              />
            </Field>
            <Field label="Y Axis" description="Numeric measure to display">
              <Select
                options={measureOptions}
                value={measureOptions.find(o => o.value === dataset.fieldMapping.y)}
                onChange={v => handleFieldChange('y', v?.value)}
                isClearable
                placeholder="Select measure..."
              />
            </Field>
            <Field label="Series / Color" description="Optional: Split data by category">
              <Select
                options={dimensionOptions}
                value={dimensionOptions.find(o => o.value === dataset.fieldMapping.series)}
                onChange={v => handleFieldChange('series', v?.value)}
                isClearable
                placeholder="None (optional)"
              />
            </Field>
          </>
        )}

        {dataset.chartType === 'piechart' && (
          <>
            <Field label="Value (Size)" description="Numeric measure for slice size">
              <Select
                options={measureOptions}
                value={measureOptions.find(o => o.value === dataset.fieldMapping.value)}
                onChange={v => handleFieldChange('value', v?.value)}
                isClearable
                placeholder="Select measure..."
              />
            </Field>
            <Field label="Segment (Slices)" description="Category dimension for pie slices">
              <Select
                options={dimensionOptions}
                value={dimensionOptions.find(o => o.value === dataset.fieldMapping.segment)}
                onChange={v => handleFieldChange('segment', v?.value)}
                isClearable
                placeholder="Select dimension..."
              />
            </Field>
          </>
        )}

        {dataset.chartType === 'table' && (
          <div className={styles.infoBox}>
            <Icon name="info-circle" />
            <div>
              <strong>Table View</strong>
              <p>All dimensions and measures will be displayed. Use filters on the right to limit the data.</p>
            </div>
          </div>
        )}
      </FieldSet>

      <FieldSet label="Dataset Info" className={styles.infoSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Dimensions</span>
            <span className={styles.statValue}>{dataset.dimensions.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Measures</span>
            <span className={styles.statValue}>{dataset.measures.length}</span>
          </div>
        </div>
        <div className={styles.dimensionList}>
          {dataset.dimensions.slice(0, 5).map(d => {
            const badge = getDimensionBadge(d);
            return (
              <div key={d.iri} className={styles.dimensionItem}>
                <Icon name={badge.icon} size="sm" />
                <span className={styles.dimensionLabel}>{d.label}</span>
                <Badge text={badge.text} color={badge.color} />
              </div>
            );
          })}
          {dataset.dimensions.length > 5 && (
            <div className={styles.moreItems}>
              +{dataset.dimensions.length - 5} more dimensions
            </div>
          )}
        </div>
      </FieldSet>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  chartTypeGrid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(1)};
  `,
  chartTypeBtn: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(1.5)};
    background: ${theme.colors.background.secondary};
    border: 2px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    cursor: pointer;
    transition: all 0.2s;
    color: ${theme.colors.text.secondary};

    &:hover {
      background: ${theme.colors.emphasize(theme.colors.background.secondary, 0.03)};
      border-color: ${theme.colors.border.medium};
    }
  `,
  chartTypeBtnActive: css`
    background: ${theme.colors.action.selected};
    border-color: ${theme.colors.primary.main};
    color: ${theme.colors.primary.text};
  `,
  chartLabels: css`
    font-size: ${theme.typography.size.xs};
    margin-top: ${theme.spacing(0.5)};
  `,
  optionLabel: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  optionBadge: css`
    margin-left: auto;
  `,
  infoBox: css`
    display: flex;
    gap: ${theme.spacing(1.5)};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.borderRadius()};
    border: 1px solid ${theme.colors.border.weak};

    p {
      margin: ${theme.spacing(0.5)} 0 0 0;
      font-size: ${theme.typography.size.sm};
      color: ${theme.colors.text.secondary};
    }
  `,
  infoSection: css`
    margin-top: auto;
  `,
  statsGrid: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
  `,
  statItem: css`
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.borderRadius()};
    text-align: center;
  `,
  statLabel: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
  `,
  statValue: css`
    font-size: ${theme.typography.h4.fontSize};
    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.primary.main};
  `,
  dimensionList: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
  `,
  dimensionItem: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5, 1)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.borderRadius(0.5)};
    font-size: ${theme.typography.size.sm};
  `,
  dimensionLabel: css`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  moreItems: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.disabled};
    font-style: italic;
    padding: ${theme.spacing(0.5, 1)};
  `,
});
