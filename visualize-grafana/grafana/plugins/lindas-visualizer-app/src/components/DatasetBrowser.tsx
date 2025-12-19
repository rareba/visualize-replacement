import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  useStyles2,
  Input,
  Button,
  Spinner,
  Icon,
  Card,
  Badge,
} from '@grafana/ui';
import { searchCubes, CubeSearchResult } from '../utils/sparql';

interface DatasetBrowserProps {
  onSelectDataset: (cubeIri: string) => void;
  onClose: () => void;
}

export const DatasetBrowser: React.FC<DatasetBrowserProps> = ({
  onSelectDataset,
  onClose,
}) => {
  const styles = useStyles2(getStyles);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load initial results on mount
  useEffect(() => {
    loadResults('');
  }, []);

  const loadResults = useCallback(async (keyword: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const cubes = await searchCubes(keyword, 50);
      setResults(cubes);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    loadResults(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const truncateDescription = (desc?: string, maxLength: number = 150) => {
    if (!desc) return '';
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="database" /> Browse LINDAS Datasets
        </h2>
        <Button variant="secondary" size="sm" onClick={onClose} icon="times">
          Close
        </Button>
      </div>

      <div className={styles.searchBar}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search datasets by name or description..."
          prefix={<Icon name="search" />}
          className={styles.searchInput}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Search'}
        </Button>
      </div>

      <div className={styles.resultsInfo}>
        {hasSearched && !loading && (
          <span>
            {results.length} dataset{results.length !== 1 ? 's' : ''} found
            {searchTerm && ` for "${searchTerm}"`}
          </span>
        )}
      </div>

      <div className={styles.resultsList}>
        {loading && !hasSearched ? (
          <div className={styles.loadingState}>
            <Spinner size={32} />
            <p>Loading datasets...</p>
          </div>
        ) : results.length === 0 && hasSearched ? (
          <div className={styles.emptyState}>
            <Icon name="info-circle" size="xl" />
            <p>No datasets found. Try a different search term.</p>
          </div>
        ) : (
          results.map((cube) => (
            <Card
              key={cube.iri}
              className={styles.resultCard}
              onClick={() => onSelectDataset(cube.iri)}
            >
              <Card.Heading className={styles.cardHeading}>
                {cube.label}
              </Card.Heading>
              <Card.Meta className={styles.cardMeta}>
                {cube.publisher && (
                  <Badge
                    text={cube.publisher}
                    color="blue"
                    icon="building"
                  />
                )}
                {cube.dateModified && (
                  <span className={styles.dateModified}>
                    <Icon name="clock-nine" size="sm" />
                    {formatDate(cube.dateModified)}
                  </span>
                )}
              </Card.Meta>
              <Card.Description className={styles.cardDescription}>
                {truncateDescription(cube.description) || 'No description available'}
              </Card.Description>
              <Card.Actions>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDataset(cube.iri);
                  }}
                >
                  Select Dataset
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${theme.colors.background.primary};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  title: css`
    margin: 0;
    font-size: ${theme.typography.h4.fontSize};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  searchBar: css`
    display: flex;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
  `,
  searchInput: css`
    flex: 1;
  `,
  resultsInfo: css`
    padding: ${theme.spacing(1, 2)};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    background: ${theme.colors.background.secondary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  resultsList: css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1.5)};
  `,
  loadingState: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: ${theme.colors.text.secondary};
    gap: ${theme.spacing(2)};
  `,
  emptyState: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: ${theme.colors.text.disabled};
    gap: ${theme.spacing(1)};
  `,
  resultCard: css`
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid ${theme.colors.border.weak};

    &:hover {
      border-color: ${theme.colors.primary.main};
      box-shadow: ${theme.shadows.z2};
    }
  `,
  cardHeading: css`
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  cardMeta: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1.5)};
    margin-top: ${theme.spacing(0.5)};
  `,
  cardDescription: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    margin-top: ${theme.spacing(1)};
  `,
  dateModified: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
  `,
});
