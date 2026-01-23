import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SupersetResource {
  type: 'dashboard' | 'chart';
  id: string;
}

export interface GuestTokenPayload {
  user: {
    username: string;
    first_name: string;
    last_name: string;
  };
  resources: SupersetResource[];
  rls: { clause: string; dataset?: number }[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface DashboardInfo {
  id: number;
  dashboard_title: string;
  slug: string | null;
  url: string;
  published: boolean;
  changed_on_delta_humanized: string;
}

export interface ChartInfo {
  id: number;
  slice_name: string;
  viz_type: string;
  datasource_name_text: string;
  changed_on_delta_humanized: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupersetService {
  private supersetUrl = environment.supersetUrl || 'http://localhost:8088';

  constructor(private http: HttpClient) {}

  /**
   * Login to Superset and get access token
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.supersetUrl}/api/v1/security/login`,
      {
        username,
        password,
        provider: 'db',
        refresh: true
      },
      { withCredentials: true }
    );
  }

  /**
   * Get CSRF token from Superset
   */
  getCsrfToken(): Observable<string> {
    return this.http.get<{ result: string }>(
      `${this.supersetUrl}/api/v1/security/csrf_token/`,
      { withCredentials: true }
    ).pipe(
      map(response => response.result)
    );
  }

  /**
   * Get guest token for embedding
   */
  getGuestToken(
    accessToken: string,
    resources: SupersetResource[],
    user = { username: 'guest', firstName: 'Guest', lastName: 'User' }
  ): Observable<string> {
    const payload: GuestTokenPayload = {
      user: {
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName
      },
      resources,
      rls: []
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<{ token: string }>(
      `${this.supersetUrl}/api/v1/security/guest_token/`,
      payload,
      { headers, withCredentials: true }
    ).pipe(
      map(response => response.token)
    );
  }

  /**
   * Get guest token for a dashboard
   */
  getDashboardGuestToken(accessToken: string, dashboardId: string): Observable<string> {
    return this.getGuestToken(accessToken, [{ type: 'dashboard', id: dashboardId }]);
  }

  /**
   * Get guest token for a chart
   */
  getChartGuestToken(accessToken: string, chartId: string): Observable<string> {
    return this.getGuestToken(accessToken, [{ type: 'chart', id: chartId }]);
  }

  /**
   * List available dashboards
   */
  listDashboards(accessToken: string): Observable<DashboardInfo[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const params = {
      q: JSON.stringify({ page: 0, page_size: 100 })
    };

    return this.http.get<{ result: DashboardInfo[] }>(
      `${this.supersetUrl}/api/v1/dashboard/`,
      { headers, params, withCredentials: true }
    ).pipe(
      map(response => response.result)
    );
  }

  /**
   * List available charts
   */
  listCharts(accessToken: string): Observable<ChartInfo[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const params = {
      q: JSON.stringify({ page: 0, page_size: 100 })
    };

    return this.http.get<{ result: ChartInfo[] }>(
      `${this.supersetUrl}/api/v1/chart/`,
      { headers, params, withCredentials: true }
    ).pipe(
      map(response => response.result)
    );
  }

  /**
   * Get dashboard info
   */
  getDashboard(accessToken: string, dashboardId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    return this.http.get<{ result: any }>(
      `${this.supersetUrl}/api/v1/dashboard/${dashboardId}`,
      { headers, withCredentials: true }
    ).pipe(
      map(response => response.result)
    );
  }

  /**
   * Get chart info
   */
  getChart(accessToken: string, chartId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    return this.http.get<{ result: any }>(
      `${this.supersetUrl}/api/v1/chart/${chartId}`,
      { headers, withCredentials: true }
    ).pipe(
      map(response => response.result)
    );
  }

  /**
   * Helper: Login and get guest token in one step
   */
  authenticateAndGetGuestToken(
    dashboardId: string,
    type: 'dashboard' | 'chart' = 'dashboard'
  ): Observable<string> {
    const username = environment.supersetUsername || 'admin';
    const password = environment.supersetPassword || 'admin';

    return this.login(username, password).pipe(
      switchMap(loginResponse => {
        if (type === 'dashboard') {
          return this.getDashboardGuestToken(loginResponse.access_token, dashboardId);
        } else {
          return this.getChartGuestToken(loginResponse.access_token, dashboardId);
        }
      }),
      catchError(error => {
        console.error('Superset authentication failed:', error);
        return throwError(() => new Error('Failed to authenticate with Superset'));
      })
    );
  }
}
