/**
 * LINDAS Chart Builder
 *
 * A simple, public-friendly interface for creating visualizations.
 * Users select dimensions for axes and the chart updates live.
 *
 * Design: Idiot-proof, no SPARQL knowledge required.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  useStyles2,
  Select,
  Button,
  Spinner,
  Alert,
  RadioButtonGroup,
  Card,
  Icon,
  InlineField,
  InlineFieldRow,
} from '@grafana/ui';
import { getBackendSrv, locationService } from '@grafana/runtime';

// Types
interface Dimension {
  uri: string;
  label: string;
  scaleType?: string;
  dataKind?: string;
}

interface Measure {
  uri: string;
  label: string;
  unit?: string;
}

interface CubeMetadata {
  uri: string;
  label: string;
  description?: string;
  dimensions: Dimension[];
  measures: Measure[];
}

interface ChartConfig {
  xAxis: string | null;
  yAxis: string | null;
  groupBy: string | null;
  chartType: 'bar' | 'line' | 'pie' | 'table';
  limit: number;
}

interface DataRow {
  [key: string]: string | number | null;
}

type Language = 'de' | 'fr' | 'it' | 'en';

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

const CHART_TYPES: Array<SelectableValue<string>> = [
  { label: 'Bar Chart', value: 'bar', icon: 'graph-bar' },
  { label: 'Line Chart', value: 'line', icon: 'gf-interpolation-linear' },
  { label: 'Pie Chart', value: 'pie', icon: 'grafana' },
  { label: 'Table', value: 'table', icon: 'table' },
];

const LIMIT_OPTIONS: Array<SelectableValue<number>> = [
  { label: '10 rows', value: 10 },
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '500 rows', value: 500 },
  { label: '1000 rows', value: 1000 },
];

const PREFIXES = `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
PREFIX cubeMeta: <https://cube.link/meta/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
`;

/**
 * Execute SPARQL query
 */
async function executeSparql(query: string): Promise<any> {
  const response = await fetch(LINDAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
    },
    body: `query=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`SPARQL query failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch cube metadata (dimensions and measures)
 */
async function fetchCubeMetadata(cubeUri: string, lang: Language): Promise<CubeMetadata> {
  const langPriority = {
    de: ['de', 'en', 'fr', 'it'],
    fr: ['fr', 'de', 'en', 'it'],
    it: ['it', 'de', 'fr', 'en'],
    en: ['en', 'de', 'fr', 'it'],
  };
  const langs = langPriority[lang];

  // Get cube label
  const labelQuery = `${PREFIXES}
SELECT ?label WHERE {
  <${cubeUri}> schema:name ?label .
  FILTER(LANG(?label) = "${langs[0]}" || LANG(?label) = "${langs[1]}" || LANG(?label) = "")
}
LIMIT 1`;

  // Get dimensions and measures
  const structureQuery = `${PREFIXES}
SELECT DISTINCT ?dimension ?label ?unit ?dataKind ?scaleType WHERE {
  <${cubeUri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  FILTER(?dimension != rdf:type && ?dimension != cube:observedBy)

  # Get label with language preference
  OPTIONAL { ?prop schema:name ?label0 . FILTER(LANG(?label0) = "${langs[0]}") }
  OPTIONAL { ?prop schema:name ?label1 . FILTER(LANG(?label1) = "${langs[1]}") }
  OPTIONAL { ?prop schema:name ?label2 . FILTER(LANG(?label2) = "${langs[2]}") }
  OPTIONAL { ?prop rdfs:label ?labelRdfs }
  BIND(COALESCE(?label0, ?label1, ?label2, ?labelRdfs, STRAFTER(STR(?dimension), "#"), REPLACE(STR(?dimension), "^.*/", "")) AS ?label)

  # Unit indicates a measure
  OPTIONAL { ?prop qudt:unit ?unitIri . BIND(STRAFTER(STR(?unitIri), "unit/") AS ?unit) }
  OPTIONAL { ?prop qudt:hasUnit ?hasUnitIri . BIND(STRAFTER(STR(?hasUnitIri), "unit/") AS ?unit) }
  OPTIONAL { ?prop schema:unitCode ?unitCode . BIND(?unitCode AS ?unit) }

  # Data kind for temporal detection
  OPTIONAL { ?prop cubeMeta:dataKind/a ?dataKindType . BIND(STRAFTER(STR(?dataKindType), "cube.link/") AS ?dataKind) }

  # Scale type
  OPTIONAL { ?prop qudt:scaleType ?scaleTypeIri . BIND(STRAFTER(STR(?scaleTypeIri), "scales/") AS ?scaleType) }
}
ORDER BY ?label`;

  const [labelResult, structureResult] = await Promise.all([
    executeSparql(labelQuery),
    executeSparql(structureQuery),
  ]);

  const cubeLabel = labelResult.results.bindings[0]?.label?.value || cubeUri;

  const dimensions: Dimension[] = [];
  const measures: Measure[] = [];

  for (const binding of structureResult.results.bindings) {
    const uri = binding.dimension?.value || '';
    const label = binding.label?.value || uri.split(/[/#]/).pop() || uri;
    const unit = binding.unit?.value;
    const dataKind = binding.dataKind?.value;
    const scaleType = binding.scaleType?.value;

    if (unit) {
      measures.push({ uri, label, unit });
    } else {
      dimensions.push({ uri, label, dataKind, scaleType });
    }
  }

  return {
    uri: cubeUri,
    label: cubeLabel,
    dimensions,
    measures,
  };
}

/**
 * Fetch data based on configuration
 */
async function fetchData(
  cubeUri: string,
  config: ChartConfig,
  metadata: CubeMetadata,
  lang: Language
): Promise<DataRow[]> {
  if (!config.xAxis && !config.yAxis) {
    return [];
  }

  const langPriority = {
    de: ['de', 'en', 'fr', 'it'],
    fr: ['fr', 'de', 'en', 'it'],
    it: ['it', 'de', 'fr', 'en'],
    en: ['en', 'de', 'fr', 'it'],
  };
  const langs = langPriority[lang];

  // Build query based on selected dimensions
  const selectVars: string[] = [];
  const patterns: string[] = [];

  patterns.push(`<${cubeUri}> cube:observationSet/cube:observation ?obs .`);

  // Helper to add a dimension/measure to query
  const addField = (uri: string, varName: string) => {
    selectVars.push(`?${varName}`);
    patterns.push(`OPTIONAL { ?obs <${uri}> ?${varName}_raw . }`);
    // Try to get label for dimension values
    patterns.push(`OPTIONAL { ?${varName}_raw schema:name ?${varName}_label0 . FILTER(LANG(?${varName}_label0) = "${langs[0]}") }`);
    patterns.push(`OPTIONAL { ?${varName}_raw schema:name ?${varName}_label1 . FILTER(LANG(?${varName}_label1) = "${langs[1]}") }`);
    patterns.push(`BIND(COALESCE(?${varName}_label0, ?${varName}_label1, STR(?${varName}_raw)) AS ?${varName})`);
  };

  if (config.xAxis) {
    addField(config.xAxis, 'x');
  }
  if (config.yAxis) {
    selectVars.push('?y');
    patterns.push(`OPTIONAL { ?obs <${config.yAxis}> ?y . }`);
  }
  if (config.groupBy && config.groupBy !== config.xAxis) {
    addField(config.groupBy, 'group');
  }

  const query = `${PREFIXES}
SELECT ${selectVars.join(' ')} WHERE {
  ${patterns.join('\n  ')}
}
LIMIT ${config.limit}`;

  const result = await executeSparql(query);

  return result.results.bindings.map((binding: any) => {
    const row: DataRow = {};
    if (config.xAxis) {
      row.x = binding.x?.value || null;
    }
    if (config.yAxis) {
      const yVal = binding.y?.value;
      row.y = yVal ? Number(yVal) : null;
    }
    if (config.groupBy) {
      row.group = binding.group?.value || null;
    }
    return row;
  });
}

/**
 * Simple SVG Bar Chart
 */
const SimpleBarChart: React.FC<{ data: DataRow[]; xLabel: string; yLabel: string }> = ({ data, xLabel, yLabel }) => {
  const styles = useStyles2(getChartStyles);

  if (!data.length) return <div className={styles.noData}>No data to display</div>;

  // Aggregate data by x value
  const aggregated = new Map<string, number>();
  data.forEach(row => {
    const x = String(row.x || 'Unknown');
    const y = Number(row.y) || 0;
    aggregated.set(x, (aggregated.get(x) || 0) + y);
  });

  const entries = Array.from(aggregated.entries()).slice(0, 20);
  const maxValue = Math.max(...entries.map(([_, v]) => v), 1);

  const barHeight = 28;
  const chartHeight = entries.length * (barHeight + 4) + 40;
  const chartWidth = 600;
  const labelWidth = 150;

  return (
    <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.chart}>
      {entries.map(([label, value], i) => {
        const barWidth = ((value / maxValue) * (chartWidth - labelWidth - 60));
        const y = i * (barHeight + 4) + 20;
        const displayLabel = label.length > 20 ? label.substring(0, 20) + '...' : label;

        return (
          <g key={i}>
            <text x={labelWidth - 8} y={y + barHeight / 2 + 4} textAnchor="end" className={styles.label}>
              {displayLabel}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(barWidth, 2)}
              height={barHeight}
              className={styles.bar}
              rx={3}
            />
            <text x={labelWidth + barWidth + 8} y={y + barHeight / 2 + 4} className={styles.value}>
              {value.toLocaleString()}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/**
 * Simple Table View
 */
const SimpleTable: React.FC<{ data: DataRow[]; xLabel: string; yLabel: string; groupLabel?: string }> = ({
  data, xLabel, yLabel, groupLabel
}) => {
  const styles = useStyles2(getChartStyles);

  if (!data.length) return <div className={styles.noData}>No data to display</div>;

  const hasGroup = data.some(row => row.group !== undefined);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {xLabel && <th>{xLabel}</th>}
          {hasGroup && groupLabel && <th>{groupLabel}</th>}
          {yLabel && <th>{yLabel}</th>}
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 100).map((row, i) => (
          <tr key={i}>
            {xLabel && <td>{String(row.x || '-')}</td>}
            {hasGroup && groupLabel && <td>{String(row.group || '-')}</td>}
            {yLabel && <td>{typeof row.y === 'number' ? row.y.toLocaleString() : '-'}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Main Chart Builder Component
 */
export const ChartBuilder: React.FC<{ cubeUri: string; lang: Language; onBack: () => void }> = ({
  cubeUri,
  lang,
  onBack
}) => {
  const styles = useStyles2(getStyles);

  const [metadata, setMetadata] = useState<CubeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DataRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [config, setConfig] = useState<ChartConfig>({
    xAxis: null,
    yAxis: null,
    groupBy: null,
    chartType: 'bar',
    limit: 100,
  });

  // Load metadata on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const meta = await fetchCubeMetadata(cubeUri, lang);
        setMetadata(meta);

        // Auto-select first dimension and measure
        if (meta.dimensions.length > 0) {
          setConfig(c => ({ ...c, xAxis: meta.dimensions[0].uri }));
        }
        if (meta.measures.length > 0) {
          setConfig(c => ({ ...c, yAxis: meta.measures[0].uri }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cubeUri, lang]);

  // Fetch data when config changes
  useEffect(() => {
    if (!metadata || (!config.xAxis && !config.yAxis)) {
      setData([]);
      return;
    }

    const load = async () => {
      setDataLoading(true);
      try {
        const result = await fetchData(cubeUri, config, metadata, lang);
        setData(result);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setData([]);
      } finally {
        setDataLoading(false);
      }
    };

    const debounce = setTimeout(load, 300);
    return () => clearTimeout(debounce);
  }, [cubeUri, config, metadata, lang]);

  // Build dropdown options
  const dimensionOptions = useMemo(() => {
    if (!metadata) return [];
    return [
      { label: '-- None --', value: '' },
      ...metadata.dimensions.map(d => ({
        label: d.label,
        value: d.uri,
        description: d.dataKind === 'Temporal' ? 'Time dimension' : undefined,
      })),
    ];
  }, [metadata]);

  const measureOptions = useMemo(() => {
    if (!metadata) return [];
    return [
      { label: '-- None --', value: '' },
      ...metadata.measures.map(m => ({
        label: m.unit ? `${m.label} (${m.unit})` : m.label,
        value: m.uri,
      })),
    ];
  }, [metadata]);

  // Get labels for selected fields
  const getLabel = useCallback((uri: string | null, type: 'dim' | 'measure') => {
    if (!uri || !metadata) return '';
    if (type === 'dim') {
      return metadata.dimensions.find(d => d.uri === uri)?.label || '';
    }
    const m = metadata.measures.find(m => m.uri === uri);
    return m ? (m.unit ? `${m.label} (${m.unit})` : m.label) : '';
  }, [metadata]);

  // Handle save as dashboard
  const handleSave = async () => {
    if (!metadata) return;

    try {
      const dashboard = {
        title: metadata.label,
        tags: ['lindas', 'chart-builder'],
        panels: [
          {
            id: 1,
            type: config.chartType === 'bar' ? 'barchart' :
                  config.chartType === 'line' ? 'timeseries' :
                  config.chartType === 'pie' ? 'piechart' : 'table',
            title: metadata.label,
            gridPos: { x: 0, y: 0, w: 24, h: 12 },
            datasource: { type: 'lindas-datasource', uid: 'lindas-datasource' },
            targets: [{
              refId: 'A',
              cubeUri: cubeUri,
              limit: config.limit,
            }],
          },
        ],
      };

      const result = await getBackendSrv().post('/api/dashboards/db', {
        dashboard,
        folderUid: '',
        overwrite: true,
      });

      locationService.push(`/d/${result.uid}`);
    } catch (err: any) {
      setError(`Failed to save: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="xl" />
        <p>Loading dataset structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert title="Error" severity="error">
        {error}
        <div style={{ marginTop: 16 }}>
          <Button onClick={onBack}>Back to Catalog</Button>
        </div>
      </Alert>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button variant="secondary" icon="arrow-left" onClick={onBack} size="sm">
          Back
        </Button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{metadata.label}</h1>
          <p className={styles.subtitle}>Configure your visualization</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Configuration Panel */}
        <Card className={styles.configPanel}>
          <Card.Heading>Chart Settings</Card.Heading>
          <Card.Description>
            Select what data to show on each axis
          </Card.Description>

          <div className={styles.configForm}>
            {/* Chart Type */}
            <InlineFieldRow>
              <InlineField label="Chart Type" labelWidth={14}>
                <RadioButtonGroup
                  options={CHART_TYPES}
                  value={config.chartType}
                  onChange={(v) => setConfig(c => ({ ...c, chartType: v as any }))}
                  size="md"
                />
              </InlineField>
            </InlineFieldRow>

            {/* X Axis */}
            <InlineFieldRow>
              <InlineField
                label="X Axis (Categories)"
                labelWidth={14}
                tooltip="What to show along the bottom of the chart"
              >
                <Select
                  options={dimensionOptions}
                  value={config.xAxis || ''}
                  onChange={(v) => setConfig(c => ({ ...c, xAxis: v?.value || null }))}
                  width={30}
                  placeholder="Select a dimension..."
                />
              </InlineField>
            </InlineFieldRow>

            {/* Y Axis */}
            <InlineFieldRow>
              <InlineField
                label="Y Axis (Values)"
                labelWidth={14}
                tooltip="The numbers to display"
              >
                <Select
                  options={measureOptions}
                  value={config.yAxis || ''}
                  onChange={(v) => setConfig(c => ({ ...c, yAxis: v?.value || null }))}
                  width={30}
                  placeholder="Select a measure..."
                />
              </InlineField>
            </InlineFieldRow>

            {/* Group By */}
            <InlineFieldRow>
              <InlineField
                label="Group By (Color)"
                labelWidth={14}
                tooltip="Optional: Split data into groups"
              >
                <Select
                  options={dimensionOptions}
                  value={config.groupBy || ''}
                  onChange={(v) => setConfig(c => ({ ...c, groupBy: v?.value || null }))}
                  width={30}
                  placeholder="Optional grouping..."
                  isClearable
                />
              </InlineField>
            </InlineFieldRow>

            {/* Limit */}
            <InlineFieldRow>
              <InlineField label="Data Limit" labelWidth={14}>
                <Select
                  options={LIMIT_OPTIONS}
                  value={config.limit}
                  onChange={(v) => setConfig(c => ({ ...c, limit: v?.value || 100 }))}
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleSave} icon="save" disabled={!config.xAxis && !config.yAxis}>
              Save as Dashboard
            </Button>
          </div>
        </Card>

        {/* Preview Panel */}
        <Card className={styles.previewPanel}>
          <Card.Heading>
            Preview
            {dataLoading && <Spinner inline size="sm" style={{ marginLeft: 8 }} />}
          </Card.Heading>

          <div className={styles.preview}>
            {!config.xAxis && !config.yAxis ? (
              <div className={styles.placeholder}>
                <Icon name="chart-line" size="xxxl" />
                <p>Select dimensions above to see a preview</p>
              </div>
            ) : config.chartType === 'table' ? (
              <SimpleTable
                data={data}
                xLabel={getLabel(config.xAxis, 'dim')}
                yLabel={getLabel(config.yAxis, 'measure')}
                groupLabel={getLabel(config.groupBy, 'dim')}
              />
            ) : (
              <SimpleBarChart
                data={data}
                xLabel={getLabel(config.xAxis, 'dim')}
                yLabel={getLabel(config.yAxis, 'measure')}
              />
            )}
          </div>

          {data.length > 0 && (
            <div className={styles.dataInfo}>
              <Icon name="info-circle" size="sm" />
              <span>{data.length} rows loaded</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/**
 * Styles
 */
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(3)};
    max-width: 1400px;
    margin: 0 auto;
  `,
  header: css`
    display: flex;
    align-items: flex-start;
    gap: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(3)};
  `,
  titleSection: css`
    flex: 1;
  `,
  title: css`
    margin: 0;
    font-size: ${theme.typography.h3.fontSize};
  `,
  subtitle: css`
    margin: ${theme.spacing(0.5)} 0 0 0;
    color: ${theme.colors.text.secondary};
  `,
  content: css`
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: ${theme.spacing(3)};

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `,
  configPanel: css`
    height: fit-content;
  `,
  configForm: css`
    margin-top: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  actions: css`
    margin-top: ${theme.spacing(3)};
    padding-top: ${theme.spacing(2)};
    border-top: 1px solid ${theme.colors.border.weak};
  `,
  previewPanel: css`
    min-height: 400px;
  `,
  preview: css`
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  placeholder: css`
    text-align: center;
    color: ${theme.colors.text.secondary};

    svg {
      opacity: 0.3;
      margin-bottom: ${theme.spacing(2)};
    }
  `,
  dataInfo: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
    margin-top: ${theme.spacing(2)};
    padding-top: ${theme.spacing(2)};
    border-top: 1px solid ${theme.colors.border.weak};
  `,
  loading: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(8)};
    color: ${theme.colors.text.secondary};
    gap: ${theme.spacing(2)};
  `,
});

const getChartStyles = (theme: GrafanaTheme2) => ({
  chart: css`
    font-family: ${theme.typography.fontFamily};
  `,
  bar: css`
    fill: ${theme.colors.primary.main};
  `,
  label: css`
    font-size: 12px;
    fill: ${theme.colors.text.primary};
  `,
  value: css`
    font-size: 11px;
    fill: ${theme.colors.text.secondary};
  `,
  noData: css`
    color: ${theme.colors.text.secondary};
    text-align: center;
    padding: ${theme.spacing(4)};
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
    }

    tr:hover td {
      background: ${theme.colors.action.hover};
    }
  `,
});

export default ChartBuilder;
