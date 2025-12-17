# Visualize Diet: Grafana Integration

This document describes the architectural changes made to simplify the visualize application by delegating chart creation to Grafana.

## Overview

The original visualize application was a full-fledged data visualization platform with D3.js-based chart rendering, complex configuration UI, and PostgreSQL persistence. The "diet" transformation simplifies this by:

1. **Keeping**: Static pages, dataset browser
2. **Removing**: Native chart creation, database storage
3. **Adding**: Grafana integration for visualization

## User Flow

1. User browses datasets at `/browse`
2. Selects a dataset and previews it
3. Clicks "Create visualization"
4. Redirected to Grafana template dashboard with dataset pre-loaded
5. Creates panels/visualizations in Grafana
6. Exports dashboard JSON to save (temporary storage)
7. Can import saved dashboards later via `/dashboards` page

## New Pages

### `/create/grafana?cube=<cubeIri>`
Redirects to Grafana template dashboard with the cube IRI set as a variable.

### `/dashboards`
Dashboard manager for saving/loading Grafana dashboard JSON exports:
- Instructions for exporting from Grafana
- JSON import form
- List of saved dashboards (localStorage)
- Download/delete saved dashboards

### `/embed/grafana/[dashboardId]`
Embeds Grafana panels for external websites.

## Legacy URL Redirects

- `/v/[chartId]` -> Redirects to `/browse`
- `/embed/[chartId]` -> Redirects to `/browse`

## Grafana Configuration

### Template Dashboard
Location: `grafana/provisioning/dashboards/lindas-template.json`

Features:
- `cube` variable for cube IRI (passed via URL)
- `limit` variable for row limit (100-10000)
- Pre-configured panels:
  - Getting Started info panel
  - Table panel with SPARQL query
  - Time series template
  - Bar chart template
  - Pie chart template
  - Statistics panel

### Authentication

Two modes available:
1. **Development** (default): Anonymous access with Editor role
2. **Production**: ADFS OAuth (same login as visualize app)

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

PostgreSQL removed (no longer needed). Only Grafana service remains:
- Port: 3003
- SPARQL plugin: flandersmake-sparql-datasource
- Datasource: LINDAS (https://lindas.admin.ch/query)

## Files Moved to /Removed

The following directories/files were moved to reduce codebase size:

### Database Layer
- `app/prisma/` - Prisma schema and migrations
- `app/db/` - Database client and operations

### Charts (D3.js)
- `app/charts/` - All D3.js chart implementations

### API Routes
- `app/pages/api/config/` - Chart config CRUD endpoints
- `app/pages/api/config-create.ts`
- `app/pages/api/config-update.ts`
- `app/pages/api/config-remove.ts`
- `app/pages/api/user/` - User preferences

### Pages
- `app/pages/v/[chartId].tsx` - Original published chart view
- `app/pages/embed/[chartId].tsx` - Original embed page
- `app/pages/preview.tsx` - Chart preview
- `app/pages/preview_post.tsx` - Chart preview (POST)
- `app/pages/_charts.tsx` - Charts helper
- `app/pages/_pivot.tsx` - Pivot table
- `app/pages/_preview.tsx` - Preview helper
- `app/pages/_preview_post.tsx` - Preview POST helper
- `app/pages/profile.tsx` - User profile

### Other
- `app/embed-templates/` - Embed template files
- `embed/` - Embed script source
- `e2e/` - End-to-end tests

## What Remains

### Active Pages
- `/` - Homepage (static MDX)
- `/[slug]` - Legal pages (static MDX)
- `/browse/**` - Dataset browser
- `/create/grafana` - Grafana redirect
- `/embed/grafana/[dashboardId]` - Grafana embed
- `/dashboards` - Dashboard manager
- `/statistics` - Dataset stats
- `/docs` - Documentation catalog
- `/api/auth/*` - Authentication
- `/api/graphql` - Browse queries

### Core Functionality
- Dataset discovery and browsing
- SPARQL/RDF data access
- Grafana integration for visualization
- Authentication via ADFS
- Internationalization (4 languages)
- Static content pages

## Future Work

### Recommended Cleanup (Phase 2)
The following can be removed after verifying browse functionality:
- `app/configurator/` - Most components (currently kept for browse dependencies)
- D3.js packages from package.json
- Database packages (Prisma)
- Map packages (deck.gl, maplibre-gl)

### Statistics Page
Update `/statistics` to use SPARQL-only statistics:
- Remove database queries
- Add cube/dataset statistics from SPARQL

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
