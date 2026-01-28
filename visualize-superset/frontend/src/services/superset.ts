/**
 * Superset API service for guest token authentication and embedding.
 */

import axios from 'axios';

const SUPERSET_URL = import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088';

const api = axios.create({
  baseURL: SUPERSET_URL,
  withCredentials: true,
});

interface GuestTokenResponse {
  token: string;
}

interface SupersetResource {
  type: 'dashboard' | 'chart';
  id: string;
}

interface RlsRule {
  clause: string;
  dataset?: number;
}

interface GuestTokenPayload {
  user: {
    username: string;
    first_name: string;
    last_name: string;
  };
  resources: SupersetResource[];
  rls: RlsRule[];
}

/**
 * Get CSRF token from Superset.
 */
async function getCsrfToken(): Promise<string> {
  const response = await api.get('/api/v1/security/csrf_token/');
  return response.data.result;
}

/**
 * Login to Superset (for development/testing).
 */
export async function loginToSuperset(
  username: string,
  password: string
): Promise<{ access_token: string; refresh_token: string }> {
  const response = await api.post('/api/v1/security/login', {
    username,
    password,
    provider: 'db',
    refresh: true,
  });

  return response.data;
}

/**
 * Get a guest token for embedding a dashboard or chart.
 * This requires admin authentication first.
 */
export async function getGuestToken(
  accessToken: string,
  resources: SupersetResource[],
  user: { username: string; firstName: string; lastName: string } = {
    username: 'guest',
    firstName: 'Guest',
    lastName: 'User',
  }
): Promise<string> {
  const payload: GuestTokenPayload = {
    user: {
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
    },
    resources,
    rls: [],
  };

  const response = await api.post<GuestTokenResponse>(
    '/api/v1/security/guest_token/',
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data.token;
}

/**
 * Get a guest token for embedding a specific dashboard.
 */
export async function getDashboardGuestToken(
  accessToken: string,
  dashboardId: string
): Promise<string> {
  return getGuestToken(accessToken, [{ type: 'dashboard', id: dashboardId }]);
}

/**
 * Get a guest token for embedding a specific chart.
 */
export async function getChartGuestToken(
  accessToken: string,
  chartId: string
): Promise<string> {
  return getGuestToken(accessToken, [{ type: 'chart', id: chartId }]);
}

/**
 * List available dashboards.
 */
export async function listDashboards(accessToken: string): Promise<any[]> {
  const response = await api.get('/api/v1/dashboard/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      q: JSON.stringify({
        page: 0,
        page_size: 100,
      }),
    },
  });

  return response.data.result;
}

/**
 * List available charts.
 */
export async function listCharts(accessToken: string): Promise<any[]> {
  const response = await api.get('/api/v1/chart/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      q: JSON.stringify({
        page: 0,
        page_size: 100,
      }),
    },
  });

  return response.data.result;
}

/**
 * Get dashboard info.
 */
export async function getDashboard(
  accessToken: string,
  dashboardId: string
): Promise<any> {
  const response = await api.get(`/api/v1/dashboard/${dashboardId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.result;
}

/**
 * Get chart info.
 */
export async function getChart(accessToken: string, chartId: string): Promise<any> {
  const response = await api.get(`/api/v1/chart/${chartId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.result;
}

export const supersetService = {
  getCsrfToken,
  loginToSuperset,
  getGuestToken,
  getDashboardGuestToken,
  getChartGuestToken,
  listDashboards,
  listCharts,
  getDashboard,
  getChart,
};
