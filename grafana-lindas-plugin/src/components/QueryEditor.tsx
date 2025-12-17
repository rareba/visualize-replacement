/* Enhanced Query Editor for LINDAS
 * Combines cube selection, dimension picker, and SPARQL preview
 */

import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import {
  CodeEditor,
  useStyles2,
  Tab,
  TabsBar,
  TabContent,
  Button,
  Icon,
  Alert,
} from '@grafana/ui';
import { QueryEditorProps, GrafanaTheme2 } from '@grafana/data';
import { LindasDataSource } from '../datasource';
import { LindasDataSourceOptions, LindasQuery, CubeMetadata, DimensionConfig, DEFAULT_QUERY } from '../types';
import { CubeSelector } from './CubeSelector';
import { DimensionSelector } from './DimensionSelector';
import { GENERATE_OBSERVATIONS_QUERY } from '../sparql-queries';

type Props = QueryEditorProps<LindasDataSource, LindasQuery, LindasDataSourceOptions>;

type TabType = 'builder' | 'sparql';

export function QueryEditor(props: Props) {
  const { datasource, query, onChange, onRunQuery } = props;
  const styles = useStyles2(getStyles);

  // Merge with defaults
  const currentQuery = { ...DEFAULT_QUERY, ...query };

  const [activeTab, setActiveTab] = useState<TabType>(
    currentQuery.queryMode === 'manual' ? 'sparql' : 'builder'
  );
  const [selectedCube, setSelectedCube] = useState<CubeMetadata | undefined>(
    currentQuery.cubeIri
      ? { iri: currentQuery.cubeIri, title: currentQuery.cubeName || currentQuery.cubeIri }
      : undefined
  );
  const [generatedQuery, setGeneratedQuery] = useState<string>(currentQuery.queryText || '');

  // Generate SPARQL when dimensions change
  useEffect(() => {
    if (activeTab === 'builder' && currentQuery.cubeIri && currentQuery.selectedDimensions?.length) {
      const dimensions = currentQuery.selectedDimensions.filter((d) => !d.isMeasure);
      const measures = currentQuery.selectedDimensions.filter((d) => d.isMeasure);

      const newQuery = GENERATE_OBSERVATIONS_QUERY(
        currentQuery.cubeIri,
        dimensions.map((d) => ({ iri: d.iri, label: d.label })),
        measures.map((m) => ({ iri: m.iri, label: m.label })),
        [],
        1000
      );

      setGeneratedQuery(newQuery);

      // Update the query
      onChange({
        ...currentQuery,
        queryText: newQuery,
        queryMode: 'builder',
      });
    }
  }, [currentQuery.cubeIri, currentQuery.selectedDimensions, activeTab]);

  const handleCubeSelect = (cube: CubeMetadata) => {
    setSelectedCube(cube);
    onChange({
      ...currentQuery,
      cubeIri: cube.iri,
      cubeName: cube.title,
      selectedDimensions: [], // Reset dimensions when cube changes
      queryMode: 'builder',
    });
  };

  const handleDimensionsChange = (dimensions: DimensionConfig[]) => {
    onChange({
      ...currentQuery,
      selectedDimensions: dimensions,
      queryMode: 'builder',
    });
  };

  const handleManualQueryChange = (value: string) => {
    onChange({
      ...currentQuery,
      queryText: value,
      queryMode: 'manual',
    });
    setGeneratedQuery(value);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'sparql') {
      onChange({
        ...currentQuery,
        queryMode: 'manual',
      });
    } else {
      onChange({
        ...currentQuery,
        queryMode: 'builder',
      });
    }
  };

  const handleRunQuery = () => {
    onRunQuery();
  };

  return (
    <div className={styles.container}>
      <TabsBar>
        <Tab
          label="Dataset Browser"
          active={activeTab === 'builder'}
          onChangeTab={() => handleTabChange('builder')}
          icon="database"
        />
        <Tab
          label="SPARQL Editor"
          active={activeTab === 'sparql'}
          onChangeTab={() => handleTabChange('sparql')}
          icon="code-branch"
        />
      </TabsBar>

      <TabContent className={styles.tabContent}>
        {activeTab === 'builder' && (
          <div className={styles.builderContent}>
            <div className={styles.builderSection}>
              <CubeSelector
                datasource={datasource}
                selectedCube={selectedCube}
                onCubeSelect={handleCubeSelect}
              />
            </div>

            {currentQuery.cubeIri && (
              <div className={styles.builderSection}>
                <h4>Select Data Fields</h4>
                <DimensionSelector
                  datasource={datasource}
                  cubeIri={currentQuery.cubeIri}
                  selectedDimensions={currentQuery.selectedDimensions || []}
                  onDimensionsChange={handleDimensionsChange}
                />
              </div>
            )}

            {generatedQuery && (
              <div className={styles.queryPreview}>
                <div className={styles.previewHeader}>
                  <h5>
                    <Icon name="code-branch" /> Generated SPARQL Query
                  </h5>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleTabChange('sparql')}
                  >
                    Edit Query
                  </Button>
                </div>
                <pre className={styles.previewCode}>{generatedQuery}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sparql' && (
          <div className={styles.sparqlContent}>
            <Alert title="Manual SPARQL Mode" severity="info">
              Write custom SPARQL queries against the LINDAS endpoint. Use the Dataset Browser tab for guided query building.
            </Alert>
            <div className={styles.editor}>
              <CodeEditor
                height="300px"
                language="sparql"
                showLineNumbers={true}
                value={currentQuery.queryText || ''}
                onBlur={handleManualQueryChange}
                monacoOptions={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        )}
      </TabContent>

      <div className={styles.footer}>
        <Button onClick={handleRunQuery} icon="play">
          Run Query
        </Button>
        {currentQuery.cubeIri && (
          <span className={styles.cubeInfo}>
            <Icon name="database" />
            {currentQuery.cubeName || currentQuery.cubeIri}
          </span>
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
      gap: ${theme.spacing(1)};
    `,
    tabContent: css`
      padding: ${theme.spacing(2)};
      background: ${theme.colors.background.primary};
      border: 1px solid ${theme.colors.border.weak};
      border-top: none;
      border-radius: 0 0 ${theme.shape.borderRadius()} ${theme.shape.borderRadius()};
    `,
    builderContent: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
    `,
    builderSection: css`
      h4 {
        margin: 0 0 ${theme.spacing(1)} 0;
        font-size: ${theme.typography.body.fontSize};
      }
    `,
    queryPreview: css`
      background: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.borderRadius()};
      padding: ${theme.spacing(2)};
    `,
    previewHeader: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${theme.spacing(1)};

      h5 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: ${theme.spacing(0.5)};
        font-size: ${theme.typography.bodySmall.fontSize};
        color: ${theme.colors.text.secondary};
      }
    `,
    previewCode: css`
      background: ${theme.colors.background.canvas};
      padding: ${theme.spacing(1)};
      border-radius: ${theme.shape.borderRadius()};
      font-size: ${theme.typography.bodySmall.fontSize};
      overflow-x: auto;
      max-height: 150px;
      margin: 0;
    `,
    sparqlContent: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
    `,
    editor: css`
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.borderRadius()};
      overflow: hidden;
    `,
    footer: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${theme.spacing(1)} 0;
    `,
    cubeInfo: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(0.5)};
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
  };
}
