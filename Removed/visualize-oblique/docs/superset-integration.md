# Superset Integration Documentation

This document describes the Apache Superset integration added to the visualize-oblique application.

## Overview

The application now supports embedding Apache Superset dashboards and charts directly into the Angular application. This allows users to view interactive visualizations of LINDAS data.

## Components Added

### 1. SupersetService (`src/app/services/superset.service.ts`)

A service that handles communication with the Superset API:

- **Authentication**: Logs into Superset and obtains access tokens
- **Guest Token Management**: Obtains guest tokens for embedding dashboards/charts
- **API Calls**: Lists available dashboards and charts

**Key Methods:**

| Method | Description |
|--------|-------------|
| `login(username, password)` | Authenticates with Superset |
| `getGuestToken(accessToken, resources)` | Gets a guest token for embedding |
| `getDashboardGuestToken(accessToken, dashboardId)` | Gets a guest token for a specific dashboard |
| `getChartGuestToken(accessToken, chartId)` | Gets a guest token for a specific chart |
| `listDashboards(accessToken)` | Lists all available dashboards |
| `listCharts(accessToken)` | Lists all available charts |
| `authenticateAndGetGuestToken(id, type)` | Convenience method that handles full auth flow |

### 2. SupersetEmbedComponent (`src/app/components/superset-embed/superset-embed.component.ts`)

A reusable component for embedding Superset content:

**Inputs:**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `'dashboard' \| 'chart'` | `'dashboard'` | Type of content to embed |
| `id` | `string` | required | The ID of the dashboard or chart |
| `height` | `string` | `'600px'` | Height of the embedded content |

**Features:**

- Automatic authentication flow
- Loading state with spinner
- Error handling with user-friendly messages
- Secure iframe embedding with guest tokens

### 3. Dashboard Page (`src/app/pages/dashboard/dashboard.component.ts`)

A page component for viewing embedded Superset dashboards:

- Route: `/dashboard/:dashboardId`
- Shows breadcrumbs for navigation
- Displays informational banner about Superset requirements
- Error handling for missing dashboard ID

### 4. Chart Page (`src/app/pages/chart/chart.component.ts`)

A page component for viewing embedded Superset charts:

- Route: `/chart/:chartId`
- Shows breadcrumbs for navigation
- Displays informational banner about Superset requirements
- Error handling for missing chart ID

## Configuration

Environment variables for Superset are configured in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  sparqlProxyUrl: 'http://localhost:8089',
  supersetUrl: 'http://localhost:8088',
  supersetUsername: 'admin',
  supersetPassword: 'admin'
};
```

## Routes Added

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard/:dashboardId` | DashboardComponent | Embedded Superset dashboard |
| `/chart/:chartId` | ChartComponent | Embedded Superset chart |

## Home Page Updates

The home page was updated to:

1. **Improved UI**:
   - Better hero section with gradient background
   - Feature cards with colored icon wrappers
   - Responsive design for mobile devices

2. **Feature Links**:
   - Data Cubes -> `/cubes`
   - Dashboards -> `/dashboard/1`
   - Charts -> `/chart/1`
   - GraphQL API -> `/graphql`

3. **LINDAS Endpoints Information**:
   - Production: `lindas-cached.cluster.ldbar.ch`
   - Integration: `lindas-cached.int.cluster.ldbar.ch`
   - Test: `lindas-cached.test.cluster.ldbar.ch`

## Prerequisites

For the Superset integration to work:

1. **Apache Superset** must be running (default: `http://localhost:8088`)
2. **CORS** must be enabled on Superset to allow embedding
3. **Guest Token** feature must be enabled in Superset
4. Valid credentials must be configured in the environment

## Security Considerations

1. **Guest Tokens**: The application uses Superset's guest token feature for embedding. This provides time-limited, scoped access to specific resources.

2. **CORS**: Superset must be configured to allow requests from the Angular application's origin.

3. **Credentials**: In production, credentials should be stored securely (environment variables, secrets management).

## Error Handling

The components handle various error scenarios:

- **Authentication Failure**: Displays error message if login fails
- **Missing Resource**: Shows appropriate error if dashboard/chart doesn't exist
- **Network Errors**: Gracefully handles connection issues with retry suggestions

## Future Improvements

Potential enhancements for the Superset integration:

1. Add dashboard/chart browser to list available content
2. Implement caching for guest tokens to reduce API calls
3. Add support for filter parameters in embedded content
4. Create admin interface for managing Superset credentials
