/**
 * LINDAS API service for querying SPARQL data through the proxy.
 */

import axios from 'axios';
import { GraphQLClient, gql } from 'graphql-request';

const SPARQL_PROXY_URL = import.meta.env.VITE_SPARQL_PROXY_URL || 'http://localhost:8089';

const api = axios.create({
  baseURL: SPARQL_PROXY_URL,
});

const graphqlClient = new GraphQLClient(`${SPARQL_PROXY_URL}/graphql`);

// Types

export type Endpoint = 'prod' | 'int' | 'test';

export interface CubeInfo {
  iri: string;
  identifier: string | null;
  title: string;
  description: string | null;
  publisher: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}

export interface Dimension {
  iri: string;
  identifier: string;
  label: string;
  description: string | null;
  dimensionType: string;
  dataType: string | null;
  unit: string | null;
  scaleType: string | null;
}

export interface DimensionValue {
  iri: string;
  label: string;
  position: number | null;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  sparqlQuery?: string;
  executionTimeMs: number;
}

// REST API functions

/**
 * Get health status of the SPARQL proxy.
 */
export async function getHealth(): Promise<{
  status: string;
  version: string;
  endpoints: Record<string, string>;
}> {
  const response = await api.get('/api/v1/health');
  return response.data;
}

/**
 * List available data cubes.
 */
export async function listCubes(
  endpoint: Endpoint = 'prod',
  search?: string,
  limit: number = 100,
  offset: number = 0
): Promise<CubeInfo[]> {
  const response = await api.get('/api/v1/cubes', {
    params: {
      endpoint,
      search,
      limit,
      offset,
    },
  });
  return response.data;
}

/**
 * Get schema (dimensions/measures) for a cube.
 */
export async function getCubeSchema(
  cubeId: string,
  endpoint: Endpoint = 'prod'
): Promise<{
  cubeIri: string;
  columns: Array<{
    name: string;
    iri: string;
    label: string;
    type: string;
    dataType: string | null;
  }>;
}> {
  const response = await api.get(`/api/v1/schema/${encodeURIComponent(cubeId)}`, {
    params: { endpoint },
  });
  return response.data;
}

/**
 * Execute a SQL query (translated to SPARQL).
 */
export async function executeSqlQuery(
  sql: string,
  endpoint: Endpoint = 'prod',
  cubeMapping?: Record<string, string>
): Promise<QueryResult> {
  const response = await api.post('/api/v1/query', {
    sql,
    endpoint,
    cube_mapping: cubeMapping,
  });
  return {
    columns: response.data.columns,
    rows: response.data.rows,
    sparqlQuery: response.data.sparql_query,
    executionTimeMs: response.data.execution_time_ms,
  };
}

/**
 * Execute a raw SPARQL query.
 */
export async function executeSparqlQuery(
  query: string,
  endpoint: Endpoint = 'prod'
): Promise<QueryResult> {
  const response = await api.post('/api/v1/sparql', {
    query,
    endpoint,
  });
  return {
    columns: response.data.columns,
    rows: response.data.rows,
    sparqlQuery: response.data.sparql_query,
    executionTimeMs: response.data.execution_time_ms,
  };
}

/**
 * List available endpoints.
 */
export async function listEndpoints(): Promise<
  Record<string, { url: string; name: string }>
> {
  const response = await api.get('/api/v1/endpoints');
  return response.data;
}

// GraphQL queries

const CUBES_QUERY = gql`
  query Cubes($endpoint: Endpoint!, $search: String, $limit: Int!, $offset: Int!) {
    cubes(endpoint: $endpoint, search: $search, limit: $limit, offset: $offset) {
      iri
      identifier
      title
      description
      publisher
      datePublished
      dateModified
    }
  }
`;

const CUBE_QUERY = gql`
  query Cube($iri: String!, $endpoint: Endpoint!) {
    cube(iri: $iri, endpoint: $endpoint) {
      iri
      identifier
      title
      description
      publisher
      datePublished
      dateModified
      version
    }
  }
`;

const CUBE_DIMENSIONS_QUERY = gql`
  query CubeDimensions($cubeIri: String!, $endpoint: Endpoint!) {
    cubeDimensions(cubeIri: $cubeIri, endpoint: $endpoint) {
      iri
      identifier
      label
      description
      dimensionType
      dataType
      unit
      scaleType
    }
  }
`;

const DIMENSION_VALUES_QUERY = gql`
  query DimensionValues(
    $cubeIri: String!
    $dimensionIri: String!
    $endpoint: Endpoint!
    $limit: Int!
  ) {
    dimensionValues(
      cubeIri: $cubeIri
      dimensionIri: $dimensionIri
      endpoint: $endpoint
      limit: $limit
    ) {
      iri
      label
      position
    }
  }
`;

const EXECUTE_SPARQL_QUERY = gql`
  query ExecuteSparql($query: String!, $endpoint: Endpoint!) {
    executeSparql(query: $query, endpoint: $endpoint) {
      columns
      rows
      totalCount
      executionTimeMs
    }
  }
`;

// GraphQL API functions

/**
 * List cubes using GraphQL.
 */
export async function listCubesGraphQL(
  endpoint: Endpoint = 'prod',
  search?: string,
  limit: number = 100,
  offset: number = 0
): Promise<CubeInfo[]> {
  const data = await graphqlClient.request<{ cubes: CubeInfo[] }>(CUBES_QUERY, {
    endpoint: endpoint.toUpperCase(),
    search,
    limit,
    offset,
  });
  return data.cubes;
}

/**
 * Get cube info using GraphQL.
 */
export async function getCubeGraphQL(
  iri: string,
  endpoint: Endpoint = 'prod'
): Promise<CubeInfo | null> {
  const data = await graphqlClient.request<{ cube: CubeInfo | null }>(
    CUBE_QUERY,
    {
      iri,
      endpoint: endpoint.toUpperCase(),
    }
  );
  return data.cube;
}

/**
 * Get cube dimensions using GraphQL.
 */
export async function getCubeDimensionsGraphQL(
  cubeIri: string,
  endpoint: Endpoint = 'prod'
): Promise<Dimension[]> {
  const data = await graphqlClient.request<{ cubeDimensions: Dimension[] }>(
    CUBE_DIMENSIONS_QUERY,
    {
      cubeIri,
      endpoint: endpoint.toUpperCase(),
    }
  );
  return data.cubeDimensions;
}

/**
 * Get dimension values using GraphQL.
 */
export async function getDimensionValuesGraphQL(
  cubeIri: string,
  dimensionIri: string,
  endpoint: Endpoint = 'prod',
  limit: number = 1000
): Promise<DimensionValue[]> {
  const data = await graphqlClient.request<{ dimensionValues: DimensionValue[] }>(
    DIMENSION_VALUES_QUERY,
    {
      cubeIri,
      dimensionIri,
      endpoint: endpoint.toUpperCase(),
      limit,
    }
  );
  return data.dimensionValues;
}

/**
 * Execute SPARQL query using GraphQL.
 */
export async function executeSparqlGraphQL(
  query: string,
  endpoint: Endpoint = 'prod'
): Promise<QueryResult> {
  const data = await graphqlClient.request<{
    executeSparql: {
      columns: string[];
      rows: Record<string, any>[];
      totalCount: number;
      executionTimeMs: number;
    };
  }>(EXECUTE_SPARQL_QUERY, {
    query,
    endpoint: endpoint.toUpperCase(),
  });

  return {
    columns: data.executeSparql.columns,
    rows: data.executeSparql.rows,
    executionTimeMs: data.executeSparql.executionTimeMs,
  };
}

export const lindasService = {
  getHealth,
  listCubes,
  getCubeSchema,
  executeSqlQuery,
  executeSparqlQuery,
  listEndpoints,
  // GraphQL versions
  listCubesGraphQL,
  getCubeGraphQL,
  getCubeDimensionsGraphQL,
  getDimensionValuesGraphQL,
  executeSparqlGraphQL,
};
