import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type Endpoint = 'prod' | 'int' | 'test';

export interface CubeInfo {
  iri: string;
  identifier: string;
  title: string;
  description: string;
  publisher: string;
  dateCreated: string;
  dateModified: string;
}

export interface Dimension {
  iri: string;
  identifier: string;
  label: string;
  description: string;
  type: string;
  dataType: string;
  unit: string | null;
}

export interface DimensionValue {
  iri: string;
  label: string;
  position: number | null;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  sparqlQuery: string;
  executionTimeMs: number;
}

export interface CubesResponse {
  cubes: CubeInfo[];
  total: number;
}

export interface SchemaResponse {
  cube: CubeInfo;
  dimensions: Dimension[];
}

@Injectable({
  providedIn: 'root'
})
export class LindasService {
  private readonly baseUrl = environment.sparqlProxyUrl;

  constructor(private http: HttpClient) {}

  getHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.baseUrl}/api/v1/health`);
  }

  listCubes(
    endpoint: Endpoint = 'prod',
    search?: string,
    limit: number = 100,
    offset: number = 0
  ): Observable<CubesResponse> {
    let params = new HttpParams()
      .set('endpoint', endpoint)
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<CubesResponse>(`${this.baseUrl}/api/v1/cubes`, { params });
  }

  getCubeSchema(cubeId: string, endpoint: Endpoint = 'prod'): Observable<SchemaResponse> {
    const params = new HttpParams().set('endpoint', endpoint);
    return this.http.get<SchemaResponse>(
      `${this.baseUrl}/api/v1/schema/${encodeURIComponent(cubeId)}`,
      { params }
    );
  }

  executeSparqlQuery(query: string, endpoint: Endpoint = 'prod'): Observable<QueryResult> {
    return this.http.post<QueryResult>(`${this.baseUrl}/api/v1/sparql`, {
      query,
      endpoint
    });
  }

  executeSqlQuery(
    sql: string,
    endpoint: Endpoint = 'prod',
    cubeMapping?: Record<string, string>
  ): Observable<QueryResult> {
    return this.http.post<QueryResult>(`${this.baseUrl}/api/v1/query`, {
      sql,
      endpoint,
      cubeMapping
    });
  }

  listEndpoints(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/api/v1/endpoints`);
  }

  // GraphQL methods
  listCubesGraphQL(
    endpoint: Endpoint = 'prod',
    search?: string,
    limit: number = 100,
    offset: number = 0
  ): Observable<CubesResponse> {
    const query = `
      query ListCubes($endpoint: Endpoint!, $search: String, $limit: Int, $offset: Int) {
        cubes(endpoint: $endpoint, search: $search, limit: $limit, offset: $offset) {
          iri
          identifier
          title
          description
          publisher
          dateCreated
          dateModified
        }
      }
    `;

    return this.http.post<{ data: { cubes: CubeInfo[] } }>(`${this.baseUrl}/graphql`, {
      query,
      variables: { endpoint: endpoint.toUpperCase(), search, limit, offset }
    }).pipe(
      map(response => ({
        cubes: response.data.cubes,
        total: response.data.cubes.length
      }))
    );
  }

  getCubeDimensionsGraphQL(cubeIri: string, endpoint: Endpoint = 'prod'): Observable<Dimension[]> {
    const query = `
      query CubeDimensions($cubeIri: String!, $endpoint: Endpoint!) {
        cubeDimensions(cubeIri: $cubeIri, endpoint: $endpoint) {
          iri
          identifier
          label
          description
          type
          dataType
          unit
        }
      }
    `;

    return this.http.post<{ data: { cubeDimensions: Dimension[] } }>(`${this.baseUrl}/graphql`, {
      query,
      variables: { cubeIri, endpoint: endpoint.toUpperCase() }
    }).pipe(
      map(response => response.data.cubeDimensions)
    );
  }

  executeSparqlGraphQL(sparqlQuery: string, endpoint: Endpoint = 'prod'): Observable<QueryResult> {
    const query = `
      query ExecuteSparql($query: String!, $endpoint: Endpoint!) {
        executeSparql(query: $query, endpoint: $endpoint) {
          columns
          rows
          sparqlQuery
          executionTimeMs
        }
      }
    `;

    return this.http.post<{ data: { executeSparql: QueryResult } }>(`${this.baseUrl}/graphql`, {
      query,
      variables: { query: sparqlQuery, endpoint: endpoint.toUpperCase() }
    }).pipe(
      map(response => response.data.executeSparql)
    );
  }
}
