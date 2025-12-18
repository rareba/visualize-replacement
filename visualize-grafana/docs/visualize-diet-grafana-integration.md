# Visualize Diet: Grafana Integration

This document describes the architectural changes made to simplify the visualize application by delegating chart creation to Grafana.

## Overview

The original visualize application was a full-fledged data visualization platform with D3.js-based chart rendering, complex configuration UI, and PostgreSQL persistence. The "diet" transformation simplifies this by delegating visualization to Grafana.

## Two Architecture Options

### Option A: Hybrid (Next.js + Grafana)
- **Next.js**: Dataset browsing, descriptions, authentication
- **Grafana**: Visualization creation only
- **Pro**: Rich browse UI, full feature set
- **Con**: Two applications to maintain

### Option B: Grafana-Only (Recommended for simplicity)
- **Grafana**: Everything - catalog, descriptions, visualization
- **Pro**: Single application, simple deployment
- **Con**: Requires custom HTML/CSS styling to match visualize design

This document covers both options.

## Swiss Federal Design Implementation

The Grafana dashboards have been styled to match the Swiss Federal design system (Oblique framework) used by visualize.admin.ch. Key design elements include:

### Visual Components
- **Swiss Coat of Arms**: CSS-based cross using positioned divs (SVG is sanitized by Grafana)
- **Header**: Federal branding with four-language text (Schweizerische Eidgenossenschaft, etc.)
- **Color Palette**: Blue accent (#1565c0), red coat of arms (#ff0000), neutral grays
- **Typography**: System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Cards**: Subtle borders (#e0e0e0), light blue creator tags (#e3f2fd)
- **Sidebar**: Organization facets with counts, blue underline headers

### Implementation Approach
The dashboards use the **Dynamic Text (Business Text) plugin** (`marcusolsson-dynamictext-panel`) to combine SPARQL query results with Handlebars templates. This allows rich, styled layouts that render data dynamically.

Key features of the Dynamic Text approach:
- **Handlebars templates**: Use `{{#each data}}` to iterate over query results
- **Multiple queries**: Combine metadata, dimensions, and counts in one panel
- **Custom helpers**: Register helpers for URL encoding, array length, etc.
- **Inline CSS**: All styles are inline within the template HTML

For static content (headers, navigation), transparent text panels with inline HTML are used alongside the dynamic panels.

### Key Styling Decisions
1. **Inline styles only**: Grafana sanitizes `<style>` tags, so all CSS must be inline
2. **Transparent backgrounds**: All panels use `transparent: true`
3. **Multiple panels for layout**: Use Grafana's grid system for sidebar/content positioning
4. **System font stack**: `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
5. **Swiss Federal colors**: Blue accent (#1565c0), red coat of arms (#ff0000)

### Grafana HTML Sanitization
**Important**: Grafana sanitizes HTML content in text panels for security. This means:
- `<style>` tags are stripped or displayed as raw text
- `<script>` tags are not allowed
- Only inline `style` attributes work for styling
- Some CSS properties like `clip-path` may work in inline styles

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

## Grafana-Only Architecture (Option B)

For the simplest deployment, Grafana can handle everything:

### Dashboard Structure

1. **lindas-catalog** (Home page)
   - **Swiss Federal header** with CSS-based coat of arms and four-language text
   - **Blue hero section** with title and description
   - **Left sidebar** (5 columns): Organizations filter with dataset counts
   - **Right content** (19 columns): Dataset cards in vertical list layout
   - Each card shows: title (blue link), description, creator tag, modified date
   - SPARQL queries for organizations facet and dataset listing
   - Clicking a card navigates to the description page with cube IRI parameter

2. **lindas-description** (Cube details)
   - **Swiss Federal header** matching the catalog page design
   - **Navigation bar**: "Back to datasets" and "Start a visualization" buttons
   - **Left sidebar** (5 columns): Metadata display
     - Source (creator organization)
     - Date created
     - Version
     - Contact (if available)
     - Further information links (LINDAS portal, OpenData.swiss)
   - **Right content** (19 columns):
     - Dataset title and description
     - "Data Preview" section header
     - Tabular data preview with proper column names (Year, Location, Value)
     - Row count footer (20 rows shown)
   - Link to visualization sandbox with cube pre-loaded

3. **lindas-template** (Visualization sandbox)
   - Pre-configured SPARQL queries
   - Template panels for customization
   - Export/import dashboard JSON

4. **lindas-browser** (Optional dynamic browser)
   - SPARQL-powered cube search
   - Filters by language
   - Alternative to catalog page

### User Flow (Grafana-Only)

```
http://localhost:3003/d/lindas-catalog
    |
    v
[Dynamic Catalog] -- click dataset card --> [Description Page]
    |                                              |
    |                                              v
    |                                    [See metadata, dimensions]
    |                                              |
    v                                              v
[50 most recent datasets]              [Click "Create visualization"]
                                                   |
                                                   v
                                          [Grafana Sandbox]
                                                   |
                                                   v
                                          [Create charts & panels]
                                                   |
                                                   v
                                          [Export dashboard JSON]
```

### Dataset Discovery

The catalog page **automatically discovers** all available datasets from LINDAS. No manual configuration is needed - new datasets published to LINDAS will appear automatically (up to 50 most recent).

The SPARQL query fetches:
- Cube URI (for linking)
- Name (English preferred, fallback to any language)
- Description (English preferred)
- Creator organization name
- Last modified date

## Grafana Configuration

### Template Dashboard
Location: `grafana/provisioning/dashboards/lindas-template.json`

Features:
- `cube` variable for cube IRI (passed via URL from visualize)
- Pre-configured panels that work with ANY LINDAS cube:
  - **Dataset Observations** - Full tabular view with ALL columns automatically detected
    - Uses SPARQL to query all observation properties
    - Grafana's `groupingToMatrix` transformation pivots data into proper columns
    - No row limit - shows all available data
  - **Available Dimensions** - Column names with data types and predicate URIs
    - Useful for building custom SPARQL queries
  - **How to Create Charts** - Instructions with example SPARQL query patterns

The Dataset Observations table uses a dynamic query that:
1. Fetches all properties from each observation
2. Resolves labels for IRI values (preferring English)
3. Automatically pivots into columns using Grafana transformations

This provides ready-to-use tabular data for creating charts immediately.

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
- Dynamic Text plugin: marcusolsson-dynamictext-panel
- Datasource: LINDAS (https://lindas.admin.ch/query)

### Plugins

Two plugins are required:

1. **flandersmake-sparql-datasource** (unsigned, local)
   - Enables SPARQL queries to RDF endpoints
   - Installed via volume mount: `./grafana/plugins:/var/lib/grafana/plugins`
   - Requires: `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=flandersmake-sparql-datasource`

2. **marcusolsson-dynamictext-panel** (official Grafana plugin)
   - Enables Handlebars templates with query data
   - Installed via: `GF_INSTALL_PLUGINS=marcusolsson-dynamictext-panel`
   - Documentation: https://grafana.com/docs/plugins/marcusolsson-dynamictext-panel/

### Handlebars Template Examples

**Iterating over query results:**
```handlebars
{{#each data}}
  <div>{{name}} - {{description}}</div>
{{/each}}
```

**Accessing specific query by index (multiple queries):**
```handlebars
{{#each (lookup data 1)}}
  <tr><td>{{columnName}}</td><td>{{dataType}}</td></tr>
{{/each}}
```

**Custom helpers (defined in panel options):**
```javascript
// NOTE: Use context.handlebars (not just handlebars)
context.handlebars.registerHelper('len', function(arr) {
  return arr ? arr.length : 0;
});
```

**Recommended: Use SPARQL for URL encoding instead of Handlebars helpers:**
```sparql
SELECT (ENCODE_FOR_URI(STR(?cube)) AS ?cubeUriEncoded) WHERE { ... }
```
This avoids the need for custom JavaScript helpers and is more reliable.

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
