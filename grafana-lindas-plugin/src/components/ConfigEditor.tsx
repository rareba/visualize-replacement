/* Configuration Editor for LINDAS Datasource
 * Allows configuring the SPARQL endpoint and locale
 */

import React, { ChangeEvent } from 'react';
import { css } from '@emotion/css';
import { InlineField, Input, Select, useStyles2 } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { LindasDataSourceOptions, LindasSecureJsonData, LINDAS_ENDPOINTS } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<LindasDataSourceOptions, LindasSecureJsonData> {}

const LOCALE_OPTIONS: SelectableValue<string>[] = [
  { label: 'English', value: 'en' },
  { label: 'German (Deutsch)', value: 'de' },
  { label: 'French (Francais)', value: 'fr' },
  { label: 'Italian (Italiano)', value: 'it' },
];

const ENDPOINT_OPTIONS: SelectableValue<string>[] = [
  { label: 'LINDAS Production', value: LINDAS_ENDPOINTS.production, description: 'https://lindas.admin.ch/query' },
  { label: 'LINDAS Integration', value: LINDAS_ENDPOINTS.test, description: 'https://lindas-int.admin.ch/query' },
  { label: 'Custom', value: 'custom' },
];

export function ConfigEditor(props: Props) {
  const { options, onOptionsChange } = props;
  const { jsonData } = options;
  const styles = useStyles2(getStyles);

  const onEndpointChange = (option: SelectableValue<string>) => {
    if (option.value === 'custom') {
      onOptionsChange({
        ...options,
        jsonData: {
          ...jsonData,
          sparqlEndpoint: '',
        },
      });
    } else {
      onOptionsChange({
        ...options,
        jsonData: {
          ...jsonData,
          sparqlEndpoint: option.value,
        },
      });
    }
  };

  const onCustomEndpointChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        sparqlEndpoint: event.target.value,
      },
    });
  };

  const onLocaleChange = (option: SelectableValue<string>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        defaultLocale: option.value,
      },
    });
  };

  const selectedEndpoint = ENDPOINT_OPTIONS.find(
    (opt) => opt.value === jsonData.sparqlEndpoint
  ) || ENDPOINT_OPTIONS.find((opt) => opt.value === 'custom');

  const isCustomEndpoint = selectedEndpoint?.value === 'custom';

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>LINDAS Connection Settings</h3>

      <InlineField label="SPARQL Endpoint" labelWidth={20} tooltip="Select the LINDAS SPARQL endpoint to connect to">
        <Select
          options={ENDPOINT_OPTIONS}
          value={selectedEndpoint}
          onChange={onEndpointChange}
          width={40}
        />
      </InlineField>

      {isCustomEndpoint && (
        <InlineField label="Custom Endpoint URL" labelWidth={20} tooltip="Enter a custom SPARQL endpoint URL">
          <Input
            value={jsonData.sparqlEndpoint || ''}
            placeholder="https://example.com/sparql"
            onChange={onCustomEndpointChange}
            width={40}
          />
        </InlineField>
      )}

      <InlineField label="Default Language" labelWidth={20} tooltip="Preferred language for dataset labels and descriptions">
        <Select
          options={LOCALE_OPTIONS}
          value={LOCALE_OPTIONS.find((opt) => opt.value === jsonData.defaultLocale) || LOCALE_OPTIONS[0]}
          onChange={onLocaleChange}
          width={40}
        />
      </InlineField>

      <div className={styles.info}>
        <h4>About LINDAS</h4>
        <p>
          LINDAS (Linked Data Services) enables Swiss public administrations to publish their data
          as Knowledge Graphs. This datasource allows you to browse and visualize datasets
          published on LINDAS.
        </p>
        <p>
          <a href="https://lindas.admin.ch" target="_blank" rel="noopener noreferrer">
            Learn more about LINDAS
          </a>
        </p>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      max-width: 600px;
    `,
    sectionTitle: css`
      margin-bottom: ${theme.spacing(2)};
    `,
    info: css`
      margin-top: ${theme.spacing(3)};
      padding: ${theme.spacing(2)};
      background: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.borderRadius()};

      h4 {
        margin: 0 0 ${theme.spacing(1)} 0;
      }

      p {
        margin: 0 0 ${theme.spacing(1)} 0;
        color: ${theme.colors.text.secondary};
      }

      a {
        color: ${theme.colors.text.link};
      }
    `,
  };
}
