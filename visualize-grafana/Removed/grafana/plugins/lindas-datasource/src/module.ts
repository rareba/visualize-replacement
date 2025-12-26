import { DataSourcePlugin } from '@grafana/data';

import { LindasDataSource } from './datasource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { LindasQuery, LindasDataSourceOptions } from './types';

/**
 * LINDAS Datasource Plugin
 *
 * This datasource provides access to Swiss Linked Data (LINDAS)
 * without exposing any SPARQL complexity to users.
 *
 * User Experience:
 * 1. Add the LINDAS datasource (no configuration needed)
 * 2. Create a panel
 * 3. Select a dataset from the dropdown
 * 4. Data appears in tabular format
 * 5. Choose any visualization type (table, bar, pie, etc.)
 *
 * The datasource handles all SPARQL query generation internally.
 * Users never see or write SPARQL.
 */
export const plugin = new DataSourcePlugin<LindasDataSource, LindasQuery, LindasDataSourceOptions>(
  LindasDataSource
)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
