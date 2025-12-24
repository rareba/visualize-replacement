/**
 * Plugin Constants
 */

export const PLUGIN_ID = 'lindas-visualizer-app';
export const PLUGIN_BASE_URL = `/a/${PLUGIN_ID}`;
export const LINDAS_DATASOURCE_UID = 'lindas-datasource';

// Chart type to Grafana panel type mapping
export const CHART_TO_PANEL: Record<string, string> = {
  columns: 'barchart',
  bars: 'barchart', // Horizontal bars handled via panel options
  lines: 'timeseries',
  table: 'table',
  stat: 'stat',
  pie: 'piechart',
  map: 'geomap',
};

// Supported chart types
export const CHART_TYPES = [
  { value: 'columns', label: 'Columns', icon: 'graph-bar' },
  { value: 'bars', label: 'Bars', icon: 'bars' },
  { value: 'lines', label: 'Lines', icon: 'gf-interpolation-linear' },
  { value: 'table', label: 'Table', icon: 'table' },
  { value: 'stat', label: 'Stats', icon: 'calculator-alt' },
  { value: 'pie', label: 'Pie', icon: 'grafana' },
] as const;

export type ChartTypeValue = typeof CHART_TYPES[number]['value'];

// Languages
export const LANGUAGES = [
  { value: 'de', label: 'DE', description: 'Deutsch' },
  { value: 'fr', label: 'FR', description: 'Francais' },
  { value: 'it', label: 'IT', description: 'Italiano' },
  { value: 'en', label: 'EN', description: 'English' },
] as const;

export type LanguageValue = typeof LANGUAGES[number]['value'];

// Row limits
export const ROW_LIMITS = [
  { value: 50, label: '50 rows' },
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1,000 rows' },
  { value: 5000, label: '5,000 rows' },
] as const;
