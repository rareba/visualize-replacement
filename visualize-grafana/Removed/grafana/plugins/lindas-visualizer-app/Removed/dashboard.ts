// Grafana dashboard creation utilities

import { getBackendSrv } from '@grafana/runtime';
import { Dimension, Measure } from './sparql';

export type GrafanaChartType =
  | 'barchart'
  | 'barchart-horizontal'
  | 'timeseries'
  | 'timeseries-area'
  | 'piechart'
  | 'table';

export interface DatasetConfig {
  cubeIri: string;
  chartType: GrafanaChartType;
  title: string;
  fieldMapping: {
    x?: string;
    y?: string;
    series?: string;
    value?: string;
    segment?: string;
    filters?: Record<string, string[]>; // dimensionIri -> selectedValueIris
  };
  dimensions: Dimension[];
  measures: Measure[];
}

export interface ChartConfig {
  title: string;
  datasets: DatasetConfig[];
}

function getGrafanaPanelType(chartType: GrafanaChartType): string {
  switch (chartType) {
    case 'barchart':
    case 'barchart-horizontal':
      return 'barchart';
    case 'timeseries':
    case 'timeseries-area':
      return 'timeseries';
    case 'piechart':
      return 'piechart';
    case 'table':
      return 'table';
    default:
      return 'timeseries';
  }
}

export function generateSparqlQuery(config: DatasetConfig): string {
  const { cubeIri, fieldMapping, dimensions, measures, chartType } = config;
  const selectVars: string[] = [];
  const patterns: string[] = [];

  patterns.push(`<${cubeIri}> <https://cube.link/observationSet>/<https://cube.link/observation> ?obs .`);

  if (chartType === 'table') {
    dimensions.forEach((d: Dimension, i: number) => {
      selectVars.push(`?dim${i}`);
      patterns.push(`?obs <${d.iri}> ?dim${i} .`);
    });
    measures.forEach((m: Measure, i: number) => {
      selectVars.push(`?measure${i}`);
      patterns.push(`?obs <${m.iri}> ?measure${i} .`);
    });
  } else if (chartType === 'piechart') {
    if (fieldMapping.value) {
      selectVars.push('?value');
      patterns.push(`?obs <${fieldMapping.value}> ?value .`);
    }
    if (fieldMapping.segment) {
      selectVars.push('?segment');
      patterns.push(`?obs <${fieldMapping.segment}> ?segment .`);
    }
  } else {
    if (fieldMapping.x) {
      selectVars.push('?x');
      patterns.push(`?obs <${fieldMapping.x}> ?x .`);
    }
    if (fieldMapping.y) {
      selectVars.push('?y');
      patterns.push(`?obs <${fieldMapping.y}> ?y .`);
    }
    if (fieldMapping.series) {
      selectVars.push('?series');
      patterns.push(`?obs <${fieldMapping.series}> ?series .`);
    }
  }

  if (fieldMapping.filters) {
    Object.entries(fieldMapping.filters).forEach(([dimIri, values]) => {
      const vals = values as string[];
      if (vals && vals.length > 0) {
        let varName = `?obs_filter_${Math.random().toString(36).substring(7)}`;
        if (fieldMapping.x === dimIri) varName = '?x';
        else if (fieldMapping.series === dimIri) varName = '?series';
        else if (fieldMapping.segment === dimIri) varName = '?segment';
        else {
          patterns.push(`?obs <${dimIri}> ${varName} .`);
        }
        
        const filterVals = vals.map(v => `<${v}>`).join(', ');
        patterns.push(`FILTER(${varName} IN (${filterVals}))`);
      }
    });
  }

  return `SELECT ${selectVars.join(' ')} WHERE {
  ${patterns.join('\n  ')}
}
ORDER BY ?x ?segment
LIMIT 10000`;
}

function getPanelOptions(chartType: GrafanaChartType): any {
  switch (chartType) {
    case 'barchart':
      return {
        orientation: 'vertical',
        xTickLabelRotation: -45,
        legend: { displayMode: 'list', placement: 'bottom' },
      };
    case 'barchart-horizontal':
      return {
        orientation: 'horizontal',
        legend: { displayMode: 'list', placement: 'right' },
      };
    case 'timeseries':
    case 'timeseries-area':
      return {
        legend: { displayMode: 'list', placement: 'bottom' },
      };
    case 'piechart':
      return {
        legend: { displayMode: 'table', placement: 'right', values: ['value', 'percent'] },
        pieType: 'pie',
        displayLabels: ['name', 'percent'],
      };
    case 'table':
      return {
        showHeader: true,
        sortBy: [],
      };
    default:
      return {};
  }
}

function getFieldConfig(chartType: GrafanaChartType): any {
  const defaults: any = { custom: {} };

  if (chartType === 'timeseries-area') {
    defaults.custom.fillOpacity = 50;
    defaults.custom.lineWidth = 1;
  }

  return { defaults, overrides: [] };
}

export async function createGrafanaDashboard(config: ChartConfig): Promise<string> {
  // Add timestamp to title to avoid conflicts
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const dashboardTitle = `${config.title} (${timestamp})`;

  const panels = config.datasets.map((dataset, index) => {
    const panelType = getGrafanaPanelType(dataset.chartType);
    const query = generateSparqlQuery(dataset);
    const options = getPanelOptions(dataset.chartType);
    const fieldConfig = getFieldConfig(dataset.chartType);

    // Arrange in a grid: 2 panels per row
    const w = 12;
    const h = 10;
    const x = (index % 2) * 12;
    const y = Math.floor(index / 2) * 10;

    return {
      id: index + 1,
      type: panelType,
      title: dataset.title,
      gridPos: { x, y, w, h },
      datasource: {
        type: 'flandersmake-sparql-datasource',
        uid: 'lindas-datasource',
      },
      targets: [
        {
          refId: 'A',
          queryText: query,
          format: 'table',
        },
      ],
      options,
      fieldConfig,
    };
  });

  const dashboard = {
    title: dashboardTitle,
    tags: ['lindas', 'auto-generated'],
    timezone: 'browser',
    schemaVersion: 38,
    panels,
    annotations: {
      list: [
        {
          builtIn: 1,
          datasource: { type: 'grafana', uid: '-- Grafana --' },
          enable: true,
          hide: true,
          iconColor: 'rgba(0, 211, 255, 1)',
          name: 'Annotations & Alerts',
          type: 'dashboard',
        },
      ],
    },
    templating: { list: [] },
    time: { from: 'now-6h', to: 'now' },
    refresh: '',
    links: config.datasets.map(d => ({
      title: `Source: ${d.title}`,
      url: d.cubeIri,
      icon: 'external link',
      type: 'link',
      targetBlank: true,
    })),
  };

  const response = await getBackendSrv().post('/api/dashboards/db', {
    dashboard,
    folderUid: '',
    message: `Created from LINDAS cubes`,
    overwrite: false,
  });

  return response.uid;
}
