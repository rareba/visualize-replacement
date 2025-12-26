import React from 'react';
import { css } from '@emotion/css';
import { DataSourcePluginOptionsEditorProps, GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Alert } from '@grafana/ui';

import { LindasDataSourceOptions } from './types';

type Props = DataSourcePluginOptionsEditorProps<LindasDataSourceOptions>;

/**
 * Config Editor for LINDAS Datasource
 *
 * This is intentionally minimal - there's nothing to configure.
 * The datasource always connects to the LINDAS endpoint.
 * Users cannot change the endpoint or add authentication.
 */
export function ConfigEditor(props: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Alert title="LINDAS Datasource" severity="info">
        This datasource connects to the Swiss Linked Data Service (LINDAS).
        No configuration is required - the connection is pre-configured.
      </Alert>

      <div className={styles.info}>
        <h4>About LINDAS</h4>
        <p>
          LINDAS (Linked Data Service) is the Swiss Federal Administration's
          platform for publishing and accessing open government data as Linked Data.
        </p>
        <p>
          <strong>Endpoint:</strong> https://lindas.admin.ch/query
        </p>
        <p>
          When you create a panel, simply select a dataset from the dropdown.
          The data will be automatically fetched and displayed in tabular format.
        </p>
      </div>
    </div>
  );
}

/**
 * Styles
 */
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    max-width: 600px;
  `,
  info: css`
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};

    h4 {
      margin: 0 0 ${theme.spacing(1)} 0;
    }

    p {
      margin: 0 0 ${theme.spacing(1)} 0;
      color: ${theme.colors.text.secondary};

      &:last-child {
        margin-bottom: 0;
      }
    }
  `,
});
