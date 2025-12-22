# LINDAS Grafana Integration v4.0

This document describes the LINDAS Grafana integration comprising two plugins:
1. **LINDAS Chart Studio** (App Plugin v4.0) - Visual chart builder with live preview
2. **LINDAS Datasource** (Datasource Plugin v1.0) - Dataset selector for Grafana panels

Both plugins ensure **users never see or write SPARQL** - they work with datasets through visual interfaces only.

---

# Part 1: LINDAS Chart Studio (App Plugin)

A visual chart creation experience for Swiss Open Data. Users select datasets, configure chart types, see live previews, and save to Grafana dashboards.

## Philosophy

**Best Possible UX for Chart Creation**

Users should be able to create beautiful visualizations without any technical knowledge:

1. Search and browse LINDAS datasets
2. Select a dataset to load data
3. Choose chart type (bar, line, pie, etc.)
4. Configure axes with dropdowns
5. See live chart preview
6. Save to Grafana dashboard

All SPARQL and data complexity is completely hidden.

## User Experience

### Chart Studio Interface

```
+------------------------------------------------------------------+
|  LINDAS Chart Studio                          [Save to Dashboard] |
+------------------------------------------------------------------+
|                                                                   |
| +------------------+ +-------------------------+ +--------------+ |
| | DATASETS         | | CHART PREVIEW           | | CONFIGURE    | |
| |                  | |                         | |              | |
| | [Search...]      | |    +-----+              | | Chart Type   | |
| |                  | |    |     |   +-----+    | | [Bar v]      | |
| | Milk Production  | |    |     |   |     |    | |              | |
| | Swiss Exports    | |    |     |   |     |    | | X-Axis       | |
| | Population       | |    +-----+   +-----+    | | [Canton v]   | |
| | Energy Usage     | |                         | |              | |
| | ...              | |     Canton  Year        | | Y-Axis       | |
| |                  | |                         | | [Volume v]   | |
| +------------------+ +-------------------------+ +--------------+ |
+------------------------------------------------------------------+
```

### Three-Panel Layout

| Left Panel | Center Panel | Right Panel |
|------------|--------------|-------------|
| Dataset Browser | Live Chart Preview | Configuration |
| Search & filter | SVG-based rendering | Chart type picker |
| Click to select | Updates in real-time | Axis mapping |
| Shows metadata | Tooltip on hover | Title & legend |

## Architecture

```
+------------------------------------------+
|        LINDAS Chart Studio               |
|        (App Plugin v4.0)                 |
+------------------------------------------+
|                                          |
|  ChartStudio.tsx (Main Component)        |
|  +------------------------------------+  |
|  |                                    |  |
|  |  Dataset Browser   Chart Preview   |  |
|  |  (searchCubes)     (SimpleChart)   |  |
|  |       |                |           |  |
|  |       v                v           |  |
|  |  Configuration    Save to Dashboard |  |
|  |  (Axis Mapping)   (Grafana API)    |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
          |
          | SPARQL (hidden)
          v
+------------------------------------------+
|     lindasService.ts                     |
|     (Internal SPARQL Generator)          |
+------------------------------------------+
|                                          |
|  searchCubes() - Find datasets           |
|  getCubeMetadata() - Get dims/measures   |
|  fetchCubeData() - Get observations      |
|                                          |
+------------------------------------------+
          |
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
      ChartStudio.tsx      - Main Chart Studio component
    components/
      SimpleChart.tsx      - SVG-based chart rendering
    services/
      lindasService.ts     - SPARQL service (hidden)
  plugin.json              - Plugin manifest
  package.json             - Dependencies
  webpack.config.js        - Build config
  module.js                - Built output (28 KiB)
```

## Key Components

### ChartStudio.tsx

The main interface with three-panel layout:

```tsx
// State management
const [selectedCube, setSelectedCube] = useState<CubeFullMetadata | null>(null);
const [config, setConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);
const [data, setData] = useState<DataRow[]>([]);

// Layout
<div className={styles.container}>
  <aside className={styles.leftPanel}>   {/* Dataset Browser */}
  <main className={styles.centerPanel}>  {/* Chart Preview */}
  <aside className={styles.rightPanel}>  {/* Configuration */}
</div>
```

### SimpleChart.tsx

SVG-based chart rendering for live preview:

```tsx
// Supports multiple chart types
switch (config.chartType) {
  case 'bar': return renderBarChart();
  case 'line': return renderLineChart();
  case 'area': return renderAreaChart();
  case 'pie': return renderPieChart();
  case 'scatter': return renderScatterChart();
  case 'table': return renderTable();
}
```

### lindasService.ts

All SPARQL is hidden here:

```typescript
// Search for datasets
export async function searchCubes(searchTerm: string): Promise<CubeMetadata[]>

// Get cube structure
export async function getCubeMetadata(cubeUri: string): Promise<CubeFullMetadata | null>

// Fetch actual data
export async function fetchCubeData(
  cubeUri: string,
  dimensions: CubeDimension[],
  measures: CubeMeasure[],
  limit: number
): Promise<{ data: DataRow[]; columns: string[] }>
```

## Chart Types

| Type | Icon | Description |
|------|------|-------------|
| Bar | graph-bar | Compare values across categories |
| Line | gf-interpolation-linear | Show trends over time |
| Area | gf-interpolation-linear | Show cumulative trends |
| Pie | pie-chart | Show proportions of a whole |
| Scatter | gf-landscape | Show correlation between measures |
| Table | table | Display raw data in rows and columns |

## Save to Dashboard

When users save, Chart Studio creates a Grafana dashboard:

```typescript
const dashboard = {
  title: dashboardTitle,
  tags: ['lindas', 'chart-studio'],
  panels: [{
    type: panelType,  // timeseries, piechart, table, etc.
    datasource: {
      type: 'lindas-datasource',
      uid: 'lindas-datasource',
    },
    targets: [{
      refId: 'A',
      cubeUri: selectedCube.uri,
      limit: config.limit,
    }],
  }],
};

// POST to Grafana API
await getBackendSrv().post('/api/dashboards/db', { dashboard });
```

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

## Architecture

```
+------------------------------------------+
|           Grafana Panel Editor           |
+------------------------------------------+
|                                          |
|  Query Editor (from lindas-datasource)   |
|  +------------------------------------+  |
|  | Dataset: [Select a dataset...  v]  |  |
|  | Limit:   [10,000 rows         v]  |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
                    |
                    | User selects dataset
                    v
+------------------------------------------+
|         LINDAS Datasource Plugin         |
|         (Internal - Hidden)              |
+------------------------------------------+
|                                          |
|  1. Fetch cube metadata (dims/measures)  |
|  2. Generate SPARQL query automatically  |
|  3. Execute against lindas.admin.ch      |
|  4. Convert results to DataFrame         |
|                                          |
+------------------------------------------+
                    |
                    v
+------------------------------------------+
|         Grafana Visualization            |
|   Table | Bar | Pie | Time Series | ...  |
+------------------------------------------+
```

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

## Key Components

### QueryEditor.tsx

The only UI users interact with:

```tsx
<Select
  options={cubeOptions}           // List of LINDAS datasets
  value={selectedCube}            // Currently selected
  onChange={handleCubeChange}     // Triggers data fetch
  placeholder="Select a dataset..."
  isSearchable                    // Can search by name
/>
```

### datasource.ts

Handles all SPARQL internally:

```typescript
class LindasDataSource {
  // Fetch list of available cubes (for dropdown)
  async getCubes(): Promise<CubeInfo[]>;

  // Get cube metadata (dimensions, measures)
  async getCubeMetadata(cubeUri: string): Promise<CubeMetadata>;

  // Build SPARQL query (INTERNAL - never shown to users)
  private buildDataQuery(cubeUri, metadata, limit): string;

  // Main query method - called by Grafana
  async query(request): Promise<DataQueryResponse>;
}
```

## Grafana Configuration

### Datasource Provisioning (lindas.yml)

```yaml
datasources:
  - name: LINDAS
    uid: lindas-datasource
    type: lindas-datasource
    isDefault: true
    editable: false  # Users cannot modify
```

### Docker Compose

```yaml
environment:
  # Allow unsigned plugin
  - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=lindas-datasource

  # Users get Editor role (can't add datasources)
  - GF_AUTH_ANONYMOUS_ORG_ROLE=Editor
```

## Security

### Datasource Lockdown

- LINDAS is the **only** datasource
- Users **cannot** add other datasources
- Datasource configuration is **read-only**
- Users get **Editor** role (not Admin)

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
cd grafana/plugins/lindas-datasource
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

## How It Works Internally

When a user selects a dataset:

1. **QueryEditor** calls `onChange({ cubeUri: selectedUri })`
2. Grafana calls `datasource.query(request)`
3. **datasource.ts**:
   - Fetches cube metadata (dimensions, measures)
   - Generates SPARQL query automatically
   - Executes against `https://lindas.admin.ch/query`
   - Converts SPARQL JSON results to Grafana DataFrame
4. Grafana renders the data in the chosen visualization

### Example Generated SPARQL (Hidden from Users)

```sparql
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ?year ?canton ?volume WHERE {
  <https://agriculture.ld.admin.ch/foag/cube/MilkProduction>
    cube:observationSet/cube:observation ?obs .

  OPTIONAL { ?obs <.../dimension/year> ?year_raw . }
  OPTIONAL { ?year_raw schema:name ?year_label . }
  BIND(COALESCE(?year_label, STR(?year_raw)) AS ?year)

  OPTIONAL { ?obs <.../dimension/canton> ?canton_raw . }
  OPTIONAL { ?canton_raw schema:name ?canton_label . }
  BIND(COALESCE(?canton_label, STR(?canton_raw)) AS ?canton)

  OPTIONAL { ?obs <.../measure/volume> ?volume . }
}
LIMIT 10000
```

Users never see this. They just see:
- Dropdown: "Milk Production by Canton"
- Data table with columns: Year, Canton, Volume

## Changelog

### v4.0.0 (2025-12-22)

**LINDAS Chart Studio - Best UX for Chart Creation**

- Redesigned App Plugin as Chart Studio
- Three-panel layout: Dataset Browser, Chart Preview, Configuration
- Visual chart type picker with 6 chart types
- Live SVG-based chart preview
- Axis mapping with dropdown selectors
- Group By support for multi-series charts
- Save to Dashboard with one click
- No SPARQL visible - all hidden internally

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

### Previous Approach (Deprecated)

Previous versions used:
- `flandersmake-sparql-datasource` (required SPARQL knowledge)
- Custom App Plugin with embedded visualization

These are replaced by the new Chart Studio + Datasource approach.

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
2. Check `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS` includes `lindas-datasource`
3. Restart Grafana: `docker-compose restart grafana`
