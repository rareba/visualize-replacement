import React, { useState, useEffect } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, MultiSelect, Spinner, FieldSet, Field } from '@grafana/ui';
import { css } from '@emotion/css';
import { Dimension, fetchDimensionValues, DimensionValue } from '../utils/sparql';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  filterItem: css`
    margin-bottom: ${theme.spacing(1.5)};
  `,
  loadingContainer: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.disabled};
  `,
});

interface FiltersProps {
  cubeIri: string;
  dimensions: Dimension[];
  selectedFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  cubeIri,
  dimensions,
  selectedFilters,
  onFiltersChange,
}) => {
  const styles = useStyles2(getStyles);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [optionsMap, setOptionsMap] = useState<Record<string, DimensionValue[]>>({});

  useEffect(() => {
    const loadAllValues = async () => {
      // Create a copy of the current loading map to track pending requests
      const newLoadingMap: Record<string, boolean> = {};
      
      dimensions.forEach(async (dim) => {
        if (!optionsMap[dim.iri] && !loadingMap[dim.iri]) {
          setLoadingMap(prev => ({ ...prev, [dim.iri]: true }));
          try {
            const values = await fetchDimensionValues(cubeIri, dim.iri);
            setOptionsMap(prev => ({ ...prev, [dim.iri]: values }));
          } catch (e) {
            console.error(`Failed to load values for ${dim.label}`, e);
          } finally {
            setLoadingMap(prev => ({ ...prev, [dim.iri]: false }));
          }
        }
      });
    };

    if (cubeIri && dimensions.length > 0) {
      loadAllValues();
    }
  }, [cubeIri, dimensions]);

  const handleFilterChange = (dimIri: string, values: any[]) => {
    const selectedIris = values.map(v => v.value);
    onFiltersChange({
      ...selectedFilters,
      [dimIri]: selectedIris
    });
  };

  return (
    <div className={styles.container}>
      <FieldSet label="Filters">
        {dimensions.map(dim => (
          <div key={dim.iri} className={styles.filterItem}>
            <Field label={dim.label}>
              {loadingMap[dim.iri] ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="sm" />
                  <span>Loading values...</span>
                </div>
              ) : (
                <MultiSelect
                  options={(optionsMap[dim.iri] || []).map(v => ({ label: v.label, value: v.iri }))}
                  value={(optionsMap[dim.iri] || [])
                    .filter(v => (selectedFilters[dim.iri] || []).includes(v.iri))
                    .map(v => ({ label: v.label, value: v.iri }))}
                  onChange={(v) => handleFilterChange(dim.iri, v)}
                  placeholder="All values"
                  isClearable
                />
              )}
            </Field>
          </div>
        ))}
      </FieldSet>
    </div>
  );
};
