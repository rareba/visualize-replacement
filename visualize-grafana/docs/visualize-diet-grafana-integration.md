# Visualize Diet: Grafana Integration

This document describes the architectural changes made to simplify the visualize application by delegating chart creation to Grafana.

## Overview

The original visualize application was a full-fledged data visualization platform with D3.js-based chart rendering, complex configuration UI, and PostgreSQL persistence. The "diet" transformation simplifies this by:

1. **Keeping**: Static pages, dataset browser, full frontend functionality
2. **Adding**: Grafana integration for visualization creation
3. **Future**: Potentially remove unused D3.js rendering code (see "Future Work" section)

## Current State

The visualize frontend is fully functional:
- Dataset browsing and selection works
- Dataset preview and description display works
- All existing functionality is preserved
- Grafana integration added for creating visualizations

## User Flow

1. User browses datasets at `/browse`
2. Selects a dataset and previews it (with description and data preview)
3. Clicks "Create visualization"
4. Redirected to Grafana template dashboard with dataset pre-loaded
5. Creates panels/visualizations in Grafana
6. Exports dashboard JSON to save (temporary storage)
7. Can import saved dashboards later via `/dashboards` page

## New Pages

### `/create/new?cube=<cubeIri>` (Redirect to Grafana)
When a user clicks "Create visualization" on a dataset, they are redirected to:
`/create/new?cube=<cubeIri>`

This page detects the `cube` parameter and redirects to Grafana:
`http://localhost:3003/d/lindas-template?var-cube=<encodedCubeIri>`

The Grafana template dashboard automatically loads with the cube IRI set, allowing users to immediately query and visualize the dataset.

### `/dashboards`
Dashboard manager for saving/loading Grafana dashboard JSON exports:
- Instructions for exporting from Grafana
- JSON import form
- List of saved dashboards (localStorage)
- Download/delete saved dashboards

### `/v/[chartId]` and `/embed/[chartId]` (Legacy Redirects)
Legacy URLs redirect to `/browse` for backwards compatibility.

## Grafana Configuration

### Template Dashboard
Location: `grafana/provisioning/dashboards/lindas-template.json`

Features:
- `cube` variable for cube IRI (passed via URL from visualize)
- `limit` variable for row limit (100-10000)
- Pre-configured panels:
  - **Getting Started** - Instructions for using the sandbox
  - **Cube Dimensions** - Shows all dimensions in the cube with names and datatypes
  - **Dataset Observations** - Sample data from the cube (configurable row limit)
  - **Dataset Statistics** - Count of observations and dimensions
  - **Time Series template** - Customize for time-based data
  - **Bar Chart template** - Customize for categorical data
  - **Pie Chart template** - Customize for distribution data
  - **Example Queries** - SPARQL patterns for reference

The Cube Dimensions and Dataset Observations panels work out-of-the-box with any LINDAS cube.
The chart templates require customization with specific dimension predicates from the cube.

### Authentication

Two modes available:
1. **Development** (default): Anonymous access with Admin role (required to read dashboards)
2. **Production**: ADFS OAuth (same login as visualize app)

Note: Anonymous users need Admin role to access provisioned dashboards. Editor role is insufficient.

Set via environment variables:
```
GRAFANA_ANONYMOUS_ENABLED=true   # For development
GRAFANA_OAUTH_ENABLED=false      # Set to true for ADFS

# For ADFS:
ADFS_ID=your-client-id
ADFS_SECRET=your-client-secret
ADFS_ISSUER=https://your-adfs-server
```

### Docker Compose

Grafana service configured:
- Port: 3003
- SPARQL plugin: flandersmake-sparql-datasource
- Datasource: LINDAS (https://lindas.admin.ch/query)

## What's Currently Active

### All Pages
- `/` - Homepage (static MDX)
- `/[slug]` - Legal pages (static MDX)
- `/browse/**` - Dataset browser (fully functional)
- `/create/grafana` - Grafana redirect
- `/embed/grafana/[dashboardId]` - Grafana embed
- `/dashboards` - Dashboard manager
- `/statistics` - Dataset stats
- `/docs` - Documentation catalog
- `/api/auth/*` - Authentication
- `/api/graphql` - Browse queries
- All original pages (preview, profile, etc.)

### Core Functionality
- Dataset discovery and browsing
- Dataset description and preview
- SPARQL/RDF data access
- Grafana integration for visualization
- Authentication via ADFS
- Internationalization (4 languages)
- Static content pages

## Environment Variables

```bash
# Auth
ADFS_ISSUER=https://your-adfs-server
ADFS_ID=your-client-id
ADFS_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Grafana
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3003
NEXT_PUBLIC_GRAFANA_DATASOURCE_UID=lindas-datasource
NEXT_PUBLIC_GRAFANA_DASHBOARD_UID=lindas-template
GRAFANA_ANONYMOUS_ENABLED=true
GRAFANA_OAUTH_ENABLED=false
GRAFANA_ADMIN_PASSWORD=admin
```

## Running the Application

```bash
# Start Grafana
docker-compose up -d grafana

# Start Next.js dev server
yarn dev

# Open browser
# - Browse: http://localhost:3000/browse
# - Grafana: http://localhost:3003
# - Dashboards: http://localhost:3000/dashboards
```

## Testing the Integration

1. Go to `/browse`
2. Search for a dataset
3. Click on a dataset to preview
4. Click "Create visualization"
5. Grafana opens with the template dashboard
6. Edit panels and customize SPARQL queries
7. Use Share > Export to save dashboard JSON
8. Go to `/dashboards` to save the export for later

## Future Work: Code Removal (Phase 2)

**IMPORTANT**: The following is optional cleanup that should only be done after thorough testing and with extreme care. The browse functionality depends on many shared utilities.

### Why Previous Removal Failed

The initial attempt to remove the `app/charts/` directory failed because many non-chart components depend on shared utilities:

1. **Shared utilities used by browse**:
   - `@/charts/shared/use-size.tsx` - Used for resize events
   - `@/charts/shared/chart-helpers.tsx` - Used for label formatting
   - Many other helpers used across components

2. **Deep dependencies**:
   - `app/browse/ui/` components import from `@/charts/shared/`
   - `app/components/` depend on chart helpers
   - `app/configurator/` depends on chart state management
   - `app/stores/` depend on chart configuration types

### Safe Removal Strategy (If Needed)

If codebase reduction is truly needed in the future:

1. **Do NOT remove entire directories** - The `app/charts/` directory contains shared utilities that are used throughout the app, not just for rendering charts.

2. **Identify actual D3.js rendering code** - Only the SVG/Canvas rendering code can potentially be removed:
   - `app/charts/area/areas.tsx` - D3 area rendering
   - `app/charts/bar/bars.tsx` - D3 bar rendering
   - `app/charts/line/lines.tsx` - D3 line rendering
   - etc.

3. **Keep all shared utilities**:
   - `app/charts/shared/` - Contains helpers used by browse
   - `app/charts/index.ts` - Type definitions
   - `app/charts/chart-config-ui-options.ts` - Configuration types

4. **Test extensively** - Before any removal, ensure:
   - `/browse` page loads and works
   - Dataset selection and preview work
   - Create visualization button works
   - All API endpoints work

5. **Package.json cleanup** - Only after successful code removal:
   - D3.js packages (d3, d3-array, d3-scale, etc.)
   - Map packages (deck.gl, maplibre-gl)
   - These should NOT be removed until rendering code is removed

### Recommended Approach

For now, the safest approach is to:
1. **Keep the full codebase working** - Current state
2. **Use Grafana for new visualizations** - Users create charts in Grafana
3. **Let unused code naturally deprecate** - Over time, as Grafana becomes the primary visualization tool
4. **Revisit removal later** - Once the system is stable and well-tested

The current implementation successfully achieves the goal of delegating visualization to Grafana while keeping the browse functionality intact.
