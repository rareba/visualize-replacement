/* Dimension Selector Component
 * Allows selecting dimensions and measures from a LINDAS cube
 */

import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Checkbox, useStyles2, Spinner, Icon, Tooltip, Badge } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { DimensionConfig } from '../types';
import { LindasDataSource } from '../datasource';

interface DimensionSelectorProps {
  datasource: LindasDataSource;
  cubeIri: string;
  selectedDimensions: DimensionConfig[];
  onDimensionsChange: (dimensions: DimensionConfig[]) => void;
}

export function DimensionSelector({
  datasource,
  cubeIri,
  selectedDimensions,
  onDimensionsChange,
}: DimensionSelectorProps) {
  const styles = useStyles2(getStyles);
  const [dimensions, setDimensions] = useState<DimensionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dimensions when cube changes
  useEffect(() => {
    if (!cubeIri) {
      setDimensions([]);
      return;
    }

    loadDimensions();
  }, [cubeIri]);

  const loadDimensions = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await datasource.getCubeDimensions(cubeIri);
      setDimensions(result);

      // Auto-select first time dimension and first measure if none selected
      if (selectedDimensions.length === 0 && result.length > 0) {
        const autoSelected: DimensionConfig[] = [];

        // Find time dimension
        const timeDim = result.find((d) => d.isTime);
        if (timeDim) {
          autoSelected.push(timeDim);
        }

        // Find first measure
        const measure = result.find((d) => d.isMeasure);
        if (measure) {
          autoSelected.push(measure);
        }

        // If no measure, select first non-time dimension
        if (!measure && result.length > 0) {
          const firstNonTime = result.find((d) => !d.isTime);
          if (firstNonTime) {
            autoSelected.push(firstNonTime);
          }
        }

        if (autoSelected.length > 0) {
          onDimensionsChange(autoSelected);
        }
      }
    } catch (err) {
      setError(`Failed to load dimensions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (dimension: DimensionConfig) => {
    const isSelected = selectedDimensions.some((d) => d.iri === dimension.iri);
    if (isSelected) {
      onDimensionsChange(selectedDimensions.filter((d) => d.iri !== dimension.iri));
    } else {
      onDimensionsChange([...selectedDimensions, dimension]);
    }
  };

  const isSelected = (dimension: DimensionConfig) => {
    return selectedDimensions.some((d) => d.iri === dimension.iri);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="sm" />
        <span>Loading dimensions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Icon name="exclamation-triangle" />
        <span>{error}</span>
      </div>
    );
  }

  if (dimensions.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon name="info-circle" />
        <span>Select a dataset to see available dimensions</span>
      </div>
    );
  }

  // Separate measures from dimensions
  const measures = dimensions.filter((d) => d.isMeasure);
  const regularDimensions = dimensions.filter((d) => !d.isMeasure);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>
          <Icon name="calculator-alt" />
          Measures ({measures.length})
        </h5>
        <div className={styles.dimensionList}>
          {measures.map((dim) => (
            <DimensionItem
              key={dim.iri}
              dimension={dim}
              selected={isSelected(dim)}
              onToggle={() => handleToggle(dim)}
            />
          ))}
          {measures.length === 0 && (
            <span className={styles.noItems}>No measures found</span>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h5 className={styles.sectionTitle}>
          <Icon name="table" />
          Dimensions ({regularDimensions.length})
        </h5>
        <div className={styles.dimensionList}>
          {regularDimensions.map((dim) => (
            <DimensionItem
              key={dim.iri}
              dimension={dim}
              selected={isSelected(dim)}
              onToggle={() => handleToggle(dim)}
            />
          ))}
        </div>
      </div>

      <div className={styles.summary}>
        <span>
          Selected: {selectedDimensions.length} items
          {selectedDimensions.filter((d) => d.isMeasure).length > 0 &&
            ` (${selectedDimensions.filter((d) => d.isMeasure).length} measures)`}
        </span>
      </div>
    </div>
  );
}

// Individual dimension item component
interface DimensionItemProps {
  dimension: DimensionConfig;
  selected: boolean;
  onToggle: () => void;
}

function DimensionItem({ dimension, selected, onToggle }: DimensionItemProps) {
  const styles = useStyles2(getItemStyles);

  return (
    <div className={`${styles.item} ${selected ? styles.selected : ''}`} onClick={onToggle}>
      <Checkbox value={selected} onChange={onToggle} />
      <span className={styles.label}>{dimension.label}</span>
      <div className={styles.badges}>
        {dimension.isTime && (
          <Tooltip content="Time dimension">
            <Badge text="Time" color="blue" icon="clock-nine" />
          </Tooltip>
        )}
        {dimension.isMeasure && (
          <Tooltip content="Measure (numeric value)">
            <Badge text="Measure" color="green" icon="calculator-alt" />
          </Tooltip>
        )}
        {dimension.dataType && (
          <Tooltip content={`Data type: ${dimension.dataType}`}>
            <Badge text={dimension.dataType.split('#').pop() || ''} color="purple" />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
    `,
    section: css`
      background: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.borderRadius()};
      padding: ${theme.spacing(2)};
    `,
    sectionTitle: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      margin: 0 0 ${theme.spacing(1)} 0;
      font-size: ${theme.typography.body.fontSize};
      color: ${theme.colors.text.primary};
    `,
    dimensionList: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(0.5)};
      max-height: 200px;
      overflow-y: auto;
    `,
    loading: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      color: ${theme.colors.text.secondary};
    `,
    error: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      color: ${theme.colors.error.text};
    `,
    empty: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      color: ${theme.colors.text.secondary};
      padding: ${theme.spacing(2)};
    `,
    noItems: css`
      color: ${theme.colors.text.disabled};
      font-style: italic;
    `,
    summary: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      text-align: right;
    `,
  };
}

function getItemStyles(theme: GrafanaTheme2) {
  return {
    item: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
      border-radius: ${theme.shape.borderRadius()};
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: ${theme.colors.action.hover};
      }
    `,
    selected: css`
      background: ${theme.colors.action.selected};
    `,
    label: css`
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    badges: css`
      display: flex;
      gap: ${theme.spacing(0.5)};
    `,
  };
}
