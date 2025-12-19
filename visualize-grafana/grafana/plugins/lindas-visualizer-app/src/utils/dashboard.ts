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

export interface ChartConfig {
  cubeIri: string;
  chartType: GrafanaChartType;
  title: string;
  fieldMapping: {
    x?: string;
    y?: string;
    series?: string;
    value?: string;
    segment?: string;
  };
  dimensions: Dimension[];
  measures: Measure[];
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

function generateSparqlQuery(config: ChartConfig): string {
  const { cubeIri, fieldMapping, dimensions, measures, chartType } = config;
  const selectVars: string[] = [];
  const patterns: string[] = [];

  patterns.push(`?obs a <https://cube.link/Observation> .`);
  patterns.push(`?obs <https://cube.link/observedBy> <${cubeIri}> .`);

  if (chartType === 'table') {
    // All fields for table
    dimensions.forEach((d, i) => {
      selectVars.push(`?dim${i}`);
      patterns.push(`OPTIONAL { ?obs <${d.iri}> ?dim${i} . }`);
    });
    measures.forEach((m, i) => {
      selectVars.push(`?measure${i}`);
      patterns.push(`OPTIONAL { ?obs <${m.iri}> ?measure${i} . }`);
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
      return {
        legend: { displayMode: 'list', placement: 'bottom' },
      };
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
  const panelType = getGrafanaPanelType(config.chartType);
  const query = generateSparqlQuery(config);
  const options = getPanelOptions(config.chartType);
  const fieldConfig = getFieldConfig(config.chartType);

  const dashboard = {
    title: config.title,
    tags: ['lindas', 'auto-generated'],
    timezone: 'browser',
    schemaVersion: 38,
    panels: [
      {
        id: 1,
        type: panelType,
        title: config.title,
        gridPos: { x: 0, y: 0, w: 24, h: 16 },
        datasource: {
          type: 'flandersmake-sparql-datasource',
          uid: 'lindas-datasource',
        },
        targets: [
          {
            refId: 'A',
            rawQuery: query,
            format: 'table',
          },
        ],
        options,
        fieldConfig,
      },
    ],
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
    links: [
      {
        title: 'Source Cube',
        url: config.cubeIri,
        icon: 'external link',
        type: 'link',
        targetBlank: true,
      },
    ],
  };

  const response = await getBackendSrv().post('/api/dashboards/db', {
    dashboard,
    folderUid: '',
    message: `Created from LINDAS cube: ${config.cubeIri}`,
    overwrite: false,
  });

  return response.uid;
}
