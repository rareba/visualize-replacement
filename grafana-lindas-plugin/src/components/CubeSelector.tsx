/* Cube Selector Component
 * Allows browsing and selecting LINDAS datasets (cubes)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { Select, Input, useStyles2, Spinner, Card, TagList, Icon } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { CubeMetadata } from '../types';
import { LindasDataSource } from '../datasource';

interface CubeSelectorProps {
  datasource: LindasDataSource;
  selectedCube?: CubeMetadata;
  onCubeSelect: (cube: CubeMetadata) => void;
}

export function CubeSelector({ datasource, selectedCube, onCubeSelect }: CubeSelectorProps) {
  const styles = useStyles2(getStyles);
  const [cubes, setCubes] = useState<CubeMetadata[]>([]);
  const [filteredCubes, setFilteredCubes] = useState<CubeMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load cubes on mount
  useEffect(() => {
    loadCubes();
  }, [datasource]);

  const loadCubes = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await datasource.listCubes();
      setCubes(result);
      setFilteredCubes(result);
    } catch (err) {
      setError(`Failed to load datasets: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter cubes based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCubes(cubes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = cubes.filter(
      (cube) =>
        cube.title.toLowerCase().includes(term) ||
        cube.description?.toLowerCase().includes(term) ||
        cube.creatorLabel?.toLowerCase().includes(term)
    );
    setFilteredCubes(filtered);
  }, [searchTerm, cubes]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Convert to Select options
  const cubeOptions: SelectableValue<string>[] = filteredCubes.map((cube) => ({
    label: cube.title,
    value: cube.iri,
    description: cube.creatorLabel,
  }));

  const selectedValue = selectedCube
    ? { label: selectedCube.title, value: selectedCube.iri }
    : undefined;

  const handleSelect = (option: SelectableValue<string>) => {
    const cube = cubes.find((c) => c.iri === option.value);
    if (cube) {
      onCubeSelect(cube);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <span>Loading datasets from LINDAS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Icon name="exclamation-triangle" />
        <span>{error}</span>
        <button onClick={loadCubes}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Select Dataset from LINDAS</h4>
        <span className={styles.count}>{filteredCubes.length} datasets available</span>
      </div>

      <div className={styles.searchRow}>
        <Input
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<Icon name="search" />}
        />
      </div>

      <Select
        options={cubeOptions}
        value={selectedValue}
        onChange={handleSelect}
        placeholder="Choose a dataset..."
        isSearchable={true}
        isClearable={true}
        menuPlacement="bottom"
        maxMenuHeight={300}
      />

      {selectedCube && (
        <Card className={styles.selectedCard}>
          <Card.Heading>{selectedCube.title}</Card.Heading>
          <Card.Description>{selectedCube.description}</Card.Description>
          <Card.Meta>
            {selectedCube.creatorLabel && <span>Publisher: {selectedCube.creatorLabel}</span>}
            {selectedCube.datePublished && <span>Published: {selectedCube.datePublished}</span>}
          </Card.Meta>
          {selectedCube.themes && selectedCube.themes.length > 0 && (
            <Card.Tags>
              <TagList tags={selectedCube.themes.map((t) => t.split('/').pop() || t)} />
            </Card.Tags>
          )}
        </Card>
      )}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)};
      background: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.borderRadius()};
    `,
    header: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      h4 {
        margin: 0;
      }
    `,
    count: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    searchRow: css`
      display: flex;
      gap: ${theme.spacing(1)};
    `,
    loading: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2)};
      color: ${theme.colors.text.secondary};
    `,
    error: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2)};
      color: ${theme.colors.error.text};
      background: ${theme.colors.error.transparent};
      border-radius: ${theme.shape.borderRadius()};
    `,
    selectedCard: css`
      margin-top: ${theme.spacing(1)};
    `,
  };
}
