/**
 * Cube Selector Component
 *
 * Provides UI for selecting RDF Data Cubes, dimensions, and measures.
 * Used in the left pane of the Explorer Scene.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { css } from '@emotion/css';
import {
  Button,
  Input,
  Checkbox,
  Spinner,
  Alert,
  useStyles2,
  Icon,
  Collapse,
  Select,
} from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';

import type {
  CubeMetadata,
  CubeFullMetadata,
  CubeDimension,
  CubeMeasure,
  SparqlQueryConfig,
  DimensionFilter,
} from '../types';

/**
 * Props for the CubeSelector component
 */
interface CubeSelectorProps {
  /** Callback when search is triggered */
  onSearch: (term: string) => Promise<CubeMetadata[]>;
  /** Callback when a cube is selected */
  onSelectCube: (cube: CubeMetadata) => Promise<CubeFullMetadata | null>;
  /** Callback when query config changes */
  onQueryConfigChange: (config: SparqlQueryConfig) => void;
  /** Callback when "Run Query" is clicked */
  onRunQuery: () => void;
  /** Current loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Initial search results */
  initialResults?: CubeMetadata[];
}

/**
 * CubeSelector Component
 * Handles cube discovery and field selection
 */
export const CubeSelector: React.FC<CubeSelectorProps> = ({
  onSearch,
  onSelectCube,
  onQueryConfigChange,
  onRunQuery,
  isLoading = false,
  error,
  initialResults = [],
}) => {
  const styles = useStyles2(getStyles);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CubeMetadata[]>(initialResults);
  const [searching, setSearching] = useState(false);
  const [selectedCube, setSelectedCube] = useState<CubeFullMetadata | null>(null);
  const [loadingCube, setLoadingCube] = useState(false);

  // Query configuration state
  const [selectedDimensions, setSelectedDimensions] = useState<Set<string>>(new Set());
  const [selectedMeasures, setSelectedMeasures] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<DimensionFilter[]>([]);
  const [limit, setLimit] = useState(10000);

  // Collapsible sections
  const [showDimensions, setShowDimensions] = useState(true);
  const [showMeasures, setShowMeasures] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Update parent when config changes
  useEffect(() => {
    if (selectedCube) {
      const config: SparqlQueryConfig = {
        cubeUri: selectedCube.uri,
        selectedDimensions: Array.from(selectedDimensions),
        selectedMeasures: Array.from(selectedMeasures),
        filters,
        limit,
      };
      onQueryConfigChange(config);
    }
  }, [selectedCube, selectedDimensions, selectedMeasures, filters, limit, onQueryConfigChange]);

  // Handle search
  const handleSearch = useCallback(async () => {
    setSearching(true);
    try {
      const results = await onSearch(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [searchTerm, onSearch]);

  // Handle cube selection
  const handleSelectCube = useCallback(async (cube: CubeMetadata) => {
    setLoadingCube(true);
    try {
      const fullCube = await onSelectCube(cube);
      if (fullCube) {
        setSelectedCube(fullCube);
        // Auto-select all dimensions and measures by default
        setSelectedDimensions(new Set(fullCube.dimensions.map((d) => d.uri)));
        setSelectedMeasures(new Set(fullCube.measures.map((m) => m.uri)));
        setFilters([]);
      }
    } catch (err) {
      console.error('Failed to load cube:', err);
    } finally {
      setLoadingCube(false);
    }
  }, [onSelectCube]);

  // Toggle dimension selection
  const toggleDimension = useCallback((uri: string) => {
    setSelectedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  }, []);

  // Toggle measure selection
  const toggleMeasure = useCallback((uri: string) => {
    setSelectedMeasures((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  }, []);

  // Clear cube selection
  const handleClearCube = useCallback(() => {
    setSelectedCube(null);
    setSelectedDimensions(new Set());
    setSelectedMeasures(new Set());
    setFilters([]);
  }, []);

  // Limit options
  const limitOptions: Array<SelectableValue<number>> = [
    { label: '100 rows', value: 100 },
    { label: '1,000 rows', value: 1000 },
    { label: '10,000 rows', value: 10000 },
    { label: '50,000 rows', value: 50000 },
  ];

  return (
    <div className={styles.container}>
      {error && (
        <Alert title="Error" severity="error" className={styles.alert}>
          {error}
        </Alert>
      )}

      {/* Search Section */}
      {!selectedCube && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Icon name="search" className={styles.sectionIcon} />
            Search Data Cubes
          </h4>
          <div className={styles.searchRow}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or keyword..."
              className={styles.searchInput}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Spinner inline size="sm" /> : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          <div className={styles.resultsList}>
            {searchResults.length === 0 && !searching && (
              <p className={styles.hint}>
                Enter a search term or click Search to browse available cubes
              </p>
            )}
            {searchResults.map((cube) => (
              <div
                key={cube.uri}
                className={styles.resultItem}
                onClick={() => handleSelectCube(cube)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectCube(cube)}
              >
                <div className={styles.resultTitle}>{cube.label}</div>
                {cube.description && (
                  <div className={styles.resultDesc}>
                    {cube.description.length > 100
                      ? `${cube.description.slice(0, 100)}...`
                      : cube.description}
                  </div>
                )}
                {cube.publisher && (
                  <div className={styles.resultMeta}>{cube.publisher}</div>
                )}
              </div>
            ))}
          </div>

          {loadingCube && (
            <div className={styles.loadingOverlay}>
              <Spinner /> Loading cube metadata...
            </div>
          )}
        </div>
      )}

      {/* Selected Cube */}
      {selectedCube && (
        <>
          <div className={styles.section}>
            <div className={styles.selectedCubeHeader}>
              <div>
                <h4 className={styles.sectionTitle}>
                  <Icon name="database" className={styles.sectionIcon} />
                  Selected Cube
                </h4>
                <div className={styles.selectedCubeLabel}>{selectedCube.label}</div>
                {selectedCube.publisher && (
                  <div className={styles.selectedCubeMeta}>{selectedCube.publisher}</div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearCube}
                icon="times"
              >
                Change
              </Button>
            </div>
          </div>

          {/* Dimensions */}
          <div className={styles.section}>
            <Collapse
              label={
                <span className={styles.collapseLabel}>
                  <Icon name="list-ul" className={styles.sectionIcon} />
                  Dimensions ({selectedCube.dimensions.length})
                </span>
              }
              isOpen={showDimensions}
              onToggle={() => setShowDimensions(!showDimensions)}
            >
              <div className={styles.checkboxList}>
                {selectedCube.dimensions.map((dim) => (
                  <DimensionCheckbox
                    key={dim.uri}
                    dimension={dim}
                    checked={selectedDimensions.has(dim.uri)}
                    onChange={() => toggleDimension(dim.uri)}
                  />
                ))}
                {selectedCube.dimensions.length === 0 && (
                  <p className={styles.hint}>No dimensions found</p>
                )}
              </div>
            </Collapse>
          </div>

          {/* Measures */}
          <div className={styles.section}>
            <Collapse
              label={
                <span className={styles.collapseLabel}>
                  <Icon name="calculator-alt" className={styles.sectionIcon} />
                  Measures ({selectedCube.measures.length})
                </span>
              }
              isOpen={showMeasures}
              onToggle={() => setShowMeasures(!showMeasures)}
            >
              <div className={styles.checkboxList}>
                {selectedCube.measures.map((measure) => (
                  <MeasureCheckbox
                    key={measure.uri}
                    measure={measure}
                    checked={selectedMeasures.has(measure.uri)}
                    onChange={() => toggleMeasure(measure.uri)}
                  />
                ))}
                {selectedCube.measures.length === 0 && (
                  <p className={styles.hint}>No measures found</p>
                )}
              </div>
            </Collapse>
          </div>

          {/* Query Options */}
          <div className={styles.section}>
            <Collapse
              label={
                <span className={styles.collapseLabel}>
                  <Icon name="cog" className={styles.sectionIcon} />
                  Query Options
                </span>
              }
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            >
              <div className={styles.optionRow}>
                <label>Row Limit:</label>
                <Select
                  options={limitOptions}
                  value={limitOptions.find((o) => o.value === limit)}
                  onChange={(v) => v.value && setLimit(v.value)}
                  width={20}
                />
              </div>
            </Collapse>
          </div>

          {/* Generate Query Button */}
          <div className={styles.actionSection}>
            <Button
              variant="primary"
              size="lg"
              onClick={onRunQuery}
              disabled={isLoading || (selectedDimensions.size === 0 && selectedMeasures.size === 0)}
              fullWidth
            >
              {isLoading ? (
                <>
                  <Spinner inline size="sm" /> Generating...
                </>
              ) : (
                <>
                  <Icon name="code-branch" /> Generate Query
                </>
              )}
            </Button>
            <p className={styles.selectionSummary}>
              {selectedDimensions.size} dimensions, {selectedMeasures.size} measures selected
            </p>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Dimension checkbox with type indicator
 */
interface DimensionCheckboxProps {
  dimension: CubeDimension;
  checked: boolean;
  onChange: () => void;
}

const DimensionCheckbox: React.FC<DimensionCheckboxProps> = ({
  dimension,
  checked,
  onChange,
}) => {
  const styles = useStyles2(getStyles);

  const getTypeIcon = () => {
    if (dimension.isTemporal || dimension.scaleType === 'temporal') {
      return 'clock-nine';
    }
    if (dimension.isNumerical || dimension.scaleType === 'numerical') {
      return 'calculator-alt';
    }
    return 'tag-alt';
  };

  return (
    <div className={styles.checkboxItem}>
      <Checkbox
        value={checked}
        onChange={onChange}
        label=""
      />
      <Icon name={getTypeIcon()} className={styles.typeIcon} />
      <span className={styles.checkboxLabel}>{dimension.label}</span>
      {dimension.scaleType && (
        <span className={styles.typeBadge}>{dimension.scaleType}</span>
      )}
    </div>
  );
};

/**
 * Measure checkbox with unit indicator
 */
interface MeasureCheckboxProps {
  measure: CubeMeasure;
  checked: boolean;
  onChange: () => void;
}

const MeasureCheckbox: React.FC<MeasureCheckboxProps> = ({
  measure,
  checked,
  onChange,
}) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.checkboxItem}>
      <Checkbox
        value={checked}
        onChange={onChange}
        label=""
      />
      <Icon name="graph-bar" className={styles.typeIcon} />
      <span className={styles.checkboxLabel}>{measure.label}</span>
      {measure.unit && (
        <span className={styles.unitBadge}>{measure.unit}</span>
      )}
    </div>
  );
};

/**
 * Styles for the CubeSelector component
 */
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    height: 100%;
    overflow-y: auto;
  `,
  section: css`
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(2)};
  `,
  sectionTitle: css`
    margin: 0 0 ${theme.spacing(1.5)} 0;
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  sectionIcon: css`
    color: ${theme.colors.text.secondary};
  `,
  searchRow: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
  `,
  searchInput: css`
    flex: 1;
  `,
  resultsList: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    max-height: 300px;
    overflow-y: auto;
  `,
  resultItem: css`
    padding: ${theme.spacing(1.5)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: ${theme.colors.primary.main};
    }

    &:focus {
      outline: none;
      border-color: ${theme.colors.primary.main};
      box-shadow: 0 0 0 2px ${theme.colors.primary.transparent};
    }
  `,
  resultTitle: css`
    font-weight: ${theme.typography.fontWeightMedium};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  resultDesc: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  resultMeta: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.disabled};
  `,
  hint: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    text-align: center;
    padding: ${theme.spacing(2)};
  `,
  loadingOverlay: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
  `,
  selectedCubeHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  `,
  selectedCubeLabel: css`
    font-weight: ${theme.typography.fontWeightMedium};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  selectedCubeMeta: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
  `,
  collapseLabel: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  checkboxList: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
    padding: ${theme.spacing(1)} 0;
  `,
  checkboxItem: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    border-radius: ${theme.shape.radius.default};

    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  checkboxLabel: css`
    flex: 1;
    font-size: ${theme.typography.size.sm};
  `,
  typeIcon: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  typeBadge: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.disabled};
    background: ${theme.colors.background.canvas};
    padding: 2px 6px;
    border-radius: ${theme.shape.radius.pill};
  `,
  unitBadge: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.info.text};
    background: ${theme.colors.info.transparent};
    padding: 2px 6px;
    border-radius: ${theme.shape.radius.pill};
  `,
  optionRow: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(1)} 0;

    label {
      font-size: ${theme.typography.size.sm};
      color: ${theme.colors.text.secondary};
    }
  `,
  actionSection: css`
    margin-top: auto;
    padding-top: ${theme.spacing(2)};
  `,
  selectionSummary: css`
    text-align: center;
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    margin-top: ${theme.spacing(1)};
  `,
  alert: css`
    margin-bottom: ${theme.spacing(2)};
  `,
});

export default CubeSelector;
