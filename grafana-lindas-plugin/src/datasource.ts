/* LINDAS SPARQL Datasource for Grafana
 * Extended from Flanders Make plugin with LINDAS cube browsing capabilities
 */

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { LindasQuery, LindasDataSourceOptions, CubeMetadata, DimensionConfig, LINDAS_ENDPOINTS } from './types';
import {
  LIST_CUBES_QUERY,
  SEARCH_CUBES_QUERY,
  GET_CUBE_DIMENSIONS_QUERY,
  GET_DIMENSION_VALUES_QUERY,
  GENERATE_OBSERVATIONS_QUERY,
  GET_ORGANIZATIONS_QUERY,
  GET_THEMES_QUERY,
} from './sparql-queries';

export class LindasDataSource extends DataSourceApi<LindasQuery, LindasDataSourceOptions> {
  url: string;
  sparqlEndpoint: string;
  locale: string;

  constructor(instanceSettings: DataSourceInstanceSettings<LindasDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url!;
    this.sparqlEndpoint = instanceSettings.jsonData.sparqlEndpoint || LINDAS_ENDPOINTS.production;
    this.locale = instanceSettings.jsonData.defaultLocale || 'en';
  }

  // Execute a SPARQL SELECT query and return results
  async executeSparql(query: string): Promise<any[]> {
    const response = await lastValueFrom(
      getBackendSrv().fetch({
        method: 'POST',
        url: this.url + '/sparql',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/sparql-results+json',
        },
        data: `query=${encodeURIComponent(query)}`,
      })
    );

    const data = response.data as any;
    if (data.results && data.results.bindings) {
      return data.results.bindings.map((binding: any) => {
        const row: any = {};
        for (const key in binding) {
          row[key] = binding[key].value;
        }
        return row;
      });
    }
    return [];
  }

  // List all available cubes from LINDAS
  async listCubes(): Promise<CubeMetadata[]> {
    const query = LIST_CUBES_QUERY(this.locale);
    const results = await this.executeSparql(query);

    // Group by cube IRI to combine themes
    const cubeMap = new Map<string, CubeMetadata>();
    for (const row of results) {
      const existing = cubeMap.get(row.cubeIri);
      if (existing) {
        if (row.theme && !existing.themes?.includes(row.theme)) {
          existing.themes = [...(existing.themes || []), row.theme];
        }
      } else {
        cubeMap.set(row.cubeIri, {
          iri: row.cubeIri,
          title: row.title || row.cubeIri,
          description: row.description,
          creator: row.creatorIri,
          creatorLabel: row.creatorLabel,
          datePublished: row.datePublished,
          themes: row.theme ? [row.theme] : [],
        });
      }
    }
    return Array.from(cubeMap.values());
  }

  // Search cubes by keyword
  async searchCubes(searchTerm: string): Promise<CubeMetadata[]> {
    const query = SEARCH_CUBES_QUERY(searchTerm, this.locale);
    const results = await this.executeSparql(query);
    return results.map((row) => ({
      iri: row.cubeIri,
      title: row.title || row.cubeIri,
      description: row.description,
      creatorLabel: row.creatorLabel,
    }));
  }

  // Get dimensions for a specific cube
  async getCubeDimensions(cubeIri: string): Promise<DimensionConfig[]> {
    const query = GET_CUBE_DIMENSIONS_QUERY(cubeIri, this.locale);
    const results = await this.executeSparql(query);
    return results.map((row) => ({
      iri: row.dimensionIri,
      label: row.dimensionLabel || row.dimensionIri,
      dataType: row.dataType,
      isTime: row.isTime === 'true',
      isMeasure: row.isMeasure === 'true',
    }));
  }

  // Get values for a dimension (for filtering)
  async getDimensionValues(cubeIri: string, dimensionIri: string, limit: number = 100): Promise<{ value: string; label: string }[]> {
    const query = GET_DIMENSION_VALUES_QUERY(cubeIri, dimensionIri, this.locale, limit);
    const results = await this.executeSparql(query);
    return results.map((row) => ({
      value: row.value,
      label: row.label || row.value,
    }));
  }

  // Get organizations for filtering
  async getOrganizations(): Promise<{ iri: string; label: string; count: number }[]> {
    const query = GET_ORGANIZATIONS_QUERY(this.locale);
    const results = await this.executeSparql(query);
    return results.map((row) => ({
      iri: row.orgIri,
      label: row.orgLabel || row.orgIri,
      count: parseInt(row.cubeCount, 10),
    }));
  }

  // Get themes for filtering
  async getThemes(): Promise<{ iri: string; label: string; count: number }[]> {
    const query = GET_THEMES_QUERY(this.locale);
    const results = await this.executeSparql(query);
    return results.map((row) => ({
      iri: row.themeIri,
      label: row.themeLabel || row.themeIri,
      count: parseInt(row.cubeCount, 10),
    }));
  }

  // Main query execution
  async query(options: DataQueryRequest<LindasQuery>): Promise<DataQueryResponse> {
    const data = [];

    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }

      let queryText = target.queryText || '';

      // If using builder mode, generate the query
      if (target.queryMode === 'builder' && target.cubeIri) {
        const dimensions = (target.selectedDimensions || []).filter((d) => !d.isMeasure);
        const measures = (target.selectedDimensions || []).filter((d) => d.isMeasure);

        if (dimensions.length > 0 || measures.length > 0) {
          queryText = GENERATE_OBSERVATIONS_QUERY(
            target.cubeIri,
            dimensions.map((d) => ({ iri: d.iri, label: d.label })),
            measures.map((m) => ({ iri: m.iri, label: m.label })),
            [],
            1000
          );
        }
      }

      // Apply template variable substitution
      queryText = getTemplateSrv().replace(queryText, options.scopedVars);

      if (!queryText) {
        continue;
      }

      try {
        const results = await this.executeSparql(queryText);

        if (results.length === 0) {
          continue;
        }

        // Build data frame
        const fields: { [key: string]: any[] } = {};
        const fieldTypes: { [key: string]: FieldType } = {};

        // Initialize fields from first result
        for (const key of Object.keys(results[0])) {
          fields[key] = [];
          // Try to infer field type
          const sampleValue = results[0][key];
          if (!isNaN(parseFloat(sampleValue)) && isFinite(parseFloat(sampleValue))) {
            fieldTypes[key] = FieldType.number;
          } else if (Date.parse(sampleValue)) {
            fieldTypes[key] = FieldType.time;
          } else {
            fieldTypes[key] = FieldType.string;
          }
        }

        // Populate field values
        for (const row of results) {
          for (const key of Object.keys(fields)) {
            const value = row[key];
            if (fieldTypes[key] === FieldType.number) {
              fields[key].push(parseFloat(value));
            } else if (fieldTypes[key] === FieldType.time) {
              fields[key].push(new Date(value).getTime());
            } else {
              fields[key].push(value);
            }
          }
        }

        const frame = new MutableDataFrame({
          refId: target.refId,
          fields: Object.keys(fields).map((name) => ({
            name,
            values: fields[name],
            type: fieldTypes[name],
          })),
        });

        data.push(frame);
      } catch (err) {
        console.error('SPARQL query failed:', err);
        throw err;
      }
    }

    return { data };
  }

  // Test datasource connection
  async testDatasource() {
    try {
      const cubes = await this.listCubes();
      return {
        status: 'success',
        message: `Connected successfully. Found ${cubes.length} datasets.`,
      };
    } catch (err) {
      return {
        status: 'error',
        message: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // Support for Grafana template variables
  async metricFindQuery(query: string, options?: any): Promise<{ text: string; value: string }[]> {
    const interpolatedQuery = getTemplateSrv().replace(query, options?.scopedVars);
    const results = await this.executeSparql(interpolatedQuery);
    return results.map((row) => ({
      text: row.label || row.value || Object.values(row)[0],
      value: row.value || Object.values(row)[0],
    }));
  }
}
