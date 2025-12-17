/* LINDAS SPARQL Datasource Plugin Module
 * Main entry point for the Grafana plugin
 */

import { DataSourcePlugin } from '@grafana/data';
import { LindasDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { LindasQuery, LindasDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<LindasDataSource, LindasQuery, LindasDataSourceOptions>(
  LindasDataSource
)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
