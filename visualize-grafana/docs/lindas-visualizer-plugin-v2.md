# LINDAS Grafana Integration v5.0

This document describes the LINDAS Grafana integration comprising two plugins:
1. **Swiss Open Data** (App Plugin v5.0) - Simple dataset catalog with one-click dashboard creation
2. **LINDAS Datasource** (Datasource Plugin v1.0) - Dataset selector for Grafana panels

Both plugins ensure **users never see or write SPARQL** - they work with datasets through visual interfaces only.

---

# Part 1: Swiss Open Data (App Plugin)

A simple, clean interface for browsing Swiss Open Data datasets. Click a dataset to create a Grafana dashboard for visualization.

## Philosophy

**Grafana-Native Approach**

Let Grafana do what it does best - visualization. Our plugin focuses on:

1. Browsing and discovering LINDAS datasets
2. One-click dashboard creation from any dataset
3. Letting users customize with Grafana's native panel editor

No complex custom chart builder needed - Grafana already has excellent visualization tools.

## User Experience

### Dataset Catalog Interface

```
+------------------------------------------------------------------+
|  Swiss Open Data                               [About LINDAS]     |
|  Browse and visualize datasets from LINDAS                        |
+------------------------------------------------------------------+
|                                                                   |
| [Search datasets by name, description, or publisher...]           |
|                                                                   |
| 200 datasets found                                                |
|                                                                   |
| +------------------+ +------------------+ +------------------+     |
| | Milk Production  | | Swiss Exports    | | Population       |    |
| | Publisher Name   | | Publisher Name   | | Publisher Name   |    |
| | Description...   | | Description...   | | Description...   |    |
| | [Create Dashboard]| [Create Dashboard]| [Create Dashboard] |    |
| +------------------+ +------------------+ +------------------+     |
|                                                                   |
+------------------------------------------------------------------+
```

### Simple Card Grid Layout

| Feature | Description |
|---------|-------------|
| Search | Filter datasets by name, description, or publisher |
| Cards | Clean display with title, publisher, and description |
| One-Click | "Create Dashboard" instantly creates and opens a Grafana dashboard |
| Grafana Native | Users customize visualizations using Grafana's panel editor |

## Architecture

```
+------------------------------------------+
|        Swiss Open Data                   |
|        (App Plugin v5.0)                 |
+------------------------------------------+
|                                          |
|  DatasetCatalog.tsx (Main Component)     |
|  +------------------------------------+  |
|  |                                    |  |
|  |  Search Bar (filter datasets)     |  |
|  |       |                           |  |
|  |       v                           |  |
|  |  Card Grid (200 datasets)         |  |
|  |       |                           |  |
|  |       v                           |  |
|  |  Create Dashboard (Grafana API)   |  |
|  |       |                           |  |
|  |       v                           |  |
|  |  Navigate to Dashboard            |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
          |
          | SPARQL (hidden)
          v
+------------------------------------------+
|     https://lindas.admin.ch/query        |
|     (Swiss SPARQL Endpoint)              |
+------------------------------------------+
```

## Plugin Files

```
grafana/plugins/lindas-visualizer-app/
  src/
    module.ts              - Plugin entry point
    types.ts               - TypeScript interfaces
    pages/
      DatasetCatalog.tsx   - Main catalog component
  plugin.json              - Plugin manifest
  package.json             - Dependencies
  webpack.config.js        - Build config
  module.js                - Built output
  Removed/                 - Old unused files (ChartStudio, SimpleChart, etc.)
```

## Key Components

### DatasetCatalog.tsx

The main interface with search and card grid:

```tsx
// State management
const [searchTerm, setSearchTerm] = useState('');
const [datasets, setDatasets] = useState<Dataset[]>([]);
const [loading, setLoading] = useState(true);
const [creating, setCreating] = useState<string | null>(null);

// Fetch datasets from LINDAS
useEffect(() => {
  const results = await fetchDatasets(searchTerm);
  setDatasets(results);
}, [searchTerm]);

// Create dashboard and navigate
const handleSelect = async (dataset: Dataset) => {
  const uid = await createDashboard(dataset);
  locationService.push(`/d/${uid}`);
};
```

### createDashboard Function

Creates a Grafana dashboard with a pre-configured table panel:

```typescript
async function createDashboard(dataset: Dataset): Promise<string> {
  const dashboard = {
    title: dataset.label,
    tags: ['lindas', 'swiss-data'],
    panels: [{
      type: 'table',
      title: dataset.label,
      datasource: {
        type: 'lindas-datasource',
        uid: 'lindas-datasource',
      },
      targets: [{
        cubeUri: dataset.uri,
        cubeLabel: dataset.label,
        limit: 1000,
      }],
    }],
  };

  const result = await getBackendSrv().post('/api/dashboards/db', {
    dashboard,
    overwrite: true,
  });

  return result.uid;
}
```

## Grafana Configuration

### Docker Compose Settings for Anonymous Dashboard Creation

```yaml
environment:
  # Allow anonymous access with Admin role
  - GF_AUTH_ANONYMOUS_ENABLED=true
  - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin

  # Disable access control for anonymous dashboard management
  - GF_RBAC_PERMISSION_VALIDATION_ENABLED=false
  - GF_FEATURE_TOGGLES_ENABLE=disableAccessControl
```

Note: These settings are for development mode. Production uses OAuth authentication.

---

# Part 2: LINDAS Datasource Plugin

A Grafana Datasource Plugin that provides access to Swiss Linked Data (LINDAS) through a simple dataset selector. **Users never see or write SPARQL** - they just pick a dataset from a dropdown.

## Philosophy

**Zero Query Complexity**

Users should not need to know SPARQL, RDF, or linked data concepts. They simply:

1. Create a panel
2. Select a dataset from a dropdown
3. Get tabular data automatically
4. Choose any visualization (table, bar, pie, etc.)

All SPARQL query generation happens internally, hidden from users.

## User Experience

### Adding Data to a Panel

```
1. Create new panel (or edit existing)
2. In "Query" tab, datasource is "LINDAS" (the only option)
3. See dropdown: "Select a dataset..."
4. Click dropdown, search/scroll to find dataset
5. Select dataset (e.g., "Milk Production by Canton")
6. Data appears automatically in tabular format
7. Switch visualization type as needed
```

### No SPARQL Visible

Unlike traditional SPARQL tools, users see:

| What Users See | What They DON'T See |
|----------------|---------------------|
| Dataset dropdown | SPARQL query text |
| Row limit selector | Dimension/measure URIs |
| Data table | RDF vocabulary |

## Plugin Files

```
grafana/plugins/lindas-datasource/
  src/
    module.ts           - Plugin entry point
    types.ts            - TypeScript interfaces
    datasource.ts       - Core logic (SPARQL hidden here)
    QueryEditor.tsx     - Dataset dropdown UI
    ConfigEditor.tsx    - Minimal config (just info)
  plugin.json           - Plugin manifest
  package.json          - Dependencies
  webpack.config.js     - Build config
  module.js             - Built output (11.5 KiB)
```

## Security

### Datasource Lockdown

- LINDAS is the **only** datasource
- Users **cannot** add other datasources
- Datasource configuration is **read-only**
- Users get **Editor** role (not Admin) in production

### What Users CAN Do

- Create dashboards
- Add panels with LINDAS data
- Choose visualization types
- Share dashboards

### What Users CANNOT Do

- Add external datasources
- Modify LINDAS connection
- Access non-LINDAS data
- See/modify SPARQL queries

## Development

### Building the Plugin

```bash
cd grafana/plugins/lindas-visualizer-app
npm install
npm run build
```

### Starting Grafana

```bash
docker-compose up -d grafana
```

Access at: http://localhost:3003

### Development Mode

```bash
npm run dev  # Watch mode
```

## Changelog

### v5.0.0 (2025-12-22)

**Swiss Open Data - Simplified Catalog Approach**

- Complete redesign from Chart Studio to simple Dataset Catalog
- Card grid layout showing 200 datasets from LINDAS
- Search/filter by name, description, or publisher
- One-click dashboard creation with pre-configured table panel
- Let Grafana handle visualization - users customize with native panel editor
- Fixed Grafana 10 RBAC issues for anonymous dashboard creation
- Moved old Chart Studio files to Removed folder

### v4.0.0 (2025-12-22)

**LINDAS Chart Studio - Best UX for Chart Creation** (Deprecated)

- Three-panel layout: Dataset Browser, Chart Preview, Configuration
- Visual chart type picker with 6 chart types
- Live SVG-based chart preview
- Replaced by simpler catalog approach in v5.0

### v3.0.0 (2025-12-22)

**Grafana-Native Approach**

- Removed embedded visualization
- Added "Open in Explore" and "Create Dashboard" buttons
- Locked Grafana to LINDAS-only access

### v1.0.0 (2025-12-22)

**LINDAS Datasource Plugin - Initial Release**

- Created custom LINDAS datasource plugin
- QueryEditor shows only dataset dropdown (no SPARQL)
- All query generation hidden internally
- Automatic dimension/measure discovery
- Tabular data output
- Locked to LINDAS endpoint only

## Troubleshooting

### No Datasets in Dropdown

1. Check Grafana logs: `docker-compose logs grafana`
2. Verify LINDAS endpoint is reachable
3. Check network/firewall settings

### Data Not Loading

1. Check browser console for errors
2. Verify dataset has observations
3. Try reducing row limit

### Plugin Not Loading

1. Verify plugin is built: Check for `module.js`
2. Check `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS` includes `lindas-visualizer-app`
3. Restart Grafana: `docker-compose restart grafana`

### "Access denied to save dashboard" Error

This occurs when Grafana's RBAC prevents anonymous users from creating dashboards.

**Solution**: Ensure these settings in docker-compose.yml:
```yaml
- GF_RBAC_PERMISSION_VALIDATION_ENABLED=false
- GF_FEATURE_TOGGLES_ENABLE=disableAccessControl
```

Then restart Grafana with a fresh volume:
```bash
docker-compose down -v
docker-compose up -d
```
