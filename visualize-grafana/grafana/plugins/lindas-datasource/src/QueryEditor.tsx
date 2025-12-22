import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { QueryEditorProps, SelectableValue, GrafanaTheme2 } from '@grafana/data';
import { InlineField, Select, InlineFieldRow, useStyles2, Spinner, Alert } from '@grafana/ui';

import { LindasDataSource } from './datasource';
import { LindasDataSourceOptions, LindasQuery, CubeInfo, DEFAULT_QUERY } from './types';

type Props = QueryEditorProps<LindasDataSource, LindasQuery, LindasDataSourceOptions>;

/**
 * Query Editor for LINDAS Datasource
 *
 * DESIGN PRINCIPLE: Users should NEVER see or write SPARQL.
 * They simply select a dataset from a dropdown, and data appears.
 *
 * This editor shows:
 * 1. A searchable dropdown of available LINDAS datasets
 * 2. An optional row limit selector
 *
 * That's it. No query text, no dimension selection, no complexity.
 * The datasource handles everything internally.
 */
export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const styles = useStyles2(getStyles);

  // State
  const [cubes, setCubes] = useState<CubeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available cubes on mount
  useEffect(() => {
    let cancelled = false;

    const loadCubes = async () => {
      setLoading(true);
      setError(null);
      try {
        const cubeList = await datasource.getCubes();
        if (!cancelled) {
          setCubes(cubeList);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(`Failed to load datasets: ${err.message || 'Unknown error'}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCubes();

    return () => {
      cancelled = true;
    };
  }, [datasource]);

  // Convert cubes to Select options
  const cubeOptions: Array<SelectableValue<string>> = cubes.map((cube) => ({
    label: cube.label,
    value: cube.uri,
    description: cube.publisher || undefined,
  }));

  // Find selected cube option
  const selectedCube = cubeOptions.find((opt) => opt.value === query.cubeUri);

  // Handle cube selection
  const onCubeChange = useCallback(
    (option: SelectableValue<string>) => {
      const selectedCubeInfo = cubes.find((c) => c.uri === option.value);
      onChange({
        ...query,
        cubeUri: option.value,
        cubeLabel: selectedCubeInfo?.label || option.label,
      });
      onRunQuery();
    },
    [cubes, onChange, onRunQuery, query]
  );

  // Limit options
  const limitOptions: Array<SelectableValue<number>> = [
    { label: '100 rows', value: 100 },
    { label: '1,000 rows', value: 1000 },
    { label: '10,000 rows', value: 10000 },
    { label: '50,000 rows', value: 50000 },
  ];

  const selectedLimit = limitOptions.find((opt) => opt.value === (query.limit || DEFAULT_QUERY.limit));

  // Handle limit change
  const onLimitChange = useCallback(
    (option: SelectableValue<number>) => {
      onChange({ ...query, limit: option.value });
      if (query.cubeUri) {
        onRunQuery();
      }
    },
    [onChange, onRunQuery, query]
  );

  if (error) {
    return (
      <Alert title="Error" severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <div className={styles.container}>
      <InlineFieldRow>
        <InlineField
          label="Dataset"
          labelWidth={12}
          tooltip="Select a LINDAS dataset to visualize"
          grow
        >
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="sm" />
              <span>Loading datasets...</span>
            </div>
          ) : (
            <Select
              options={cubeOptions}
              value={selectedCube}
              onChange={onCubeChange}
              placeholder="Select a dataset..."
              isClearable
              isSearchable
              menuPlacement="bottom"
              className={styles.select}
            />
          )}
        </InlineField>

        <InlineField label="Limit" labelWidth={8} tooltip="Maximum number of rows to return">
          <Select
            options={limitOptions}
            value={selectedLimit}
            onChange={onLimitChange}
            width={20}
          />
        </InlineField>
      </InlineFieldRow>

      {/* Show selected dataset info */}
      {query.cubeUri && selectedCube && (
        <div className={styles.selectedInfo}>
          <span className={styles.selectedLabel}>Selected:</span>
          <span className={styles.selectedValue}>{selectedCube.label}</span>
          {selectedCube.description && (
            <span className={styles.selectedPublisher}>({selectedCube.description})</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Styles
 */
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  loadingContainer: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
  `,
  select: css`
    min-width: 300px;
  `,
  selectedInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    font-size: ${theme.typography.size.sm};
  `,
  selectedLabel: css`
    color: ${theme.colors.text.secondary};
  `,
  selectedValue: css`
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  selectedPublisher: css`
    color: ${theme.colors.text.disabled};
  `,
});
