# LINDAS Data Browser Plugin v3.0

A Grafana App Plugin that provides a locked-down interface for browsing and visualizing Swiss Linked Data (LINDAS). Users can **only** access LINDAS datasets - no external datasources are permitted.

## Philosophy

This plugin follows the principle of **separation of concerns**:

1. **Plugin** = Data Discovery + Query Building
2. **Grafana** = Visualization + Dashboard Creation

The plugin does NOT embed its own visualization. Instead, it helps users:
- Discover available LINDAS data cubes
- Select dimensions and measures
- Generate SPARQL queries
- Open queries in Grafana's native tools (Explore, Dashboards)

## Key Features

### 1. LINDAS-Only Access

The entire Grafana instance is locked down to only allow LINDAS data:
- Only the LINDAS datasource is provisioned
- Users cannot add external datasources
- Datasource is non-editable
- Users get Editor role (can create dashboards, cannot manage datasources)

### 2. Cube Browser

Users can search and browse RDF Data Cubes from LINDAS:
- Search by keyword
- View cube metadata (description, publisher, dimensions, measures)
- Select which dimensions and measures to include in queries

### 3. Query Generator

The plugin generates optimized SPARQL queries:
- Builds queries based on selected dimensions/measures
- Handles label resolution for dimension values
- Supports query limits
- Shows query preview before execution

### 4. Native Grafana Integration

Instead of embedded visualization, users work with Grafana's native tools:
- **Open in Explore** - Test queries interactively
- **Create Dashboard** - Generate a new dashboard with a pre-configured panel
- Use Grafana's panel editor to change visualization types

## Architecture

```
+------------------------------------------+
|           LINDAS Data Browser            |
|                (Plugin)                  |
+------------------------------------------+
|                                          |
|  +----------------+   +--------------+   |
|  | Cube Browser   |   | Query        |   |
|  | - Search cubes |   | Generator    |   |
|  | - View details |   | - SPARQL     |   |
|  | - Select fields|   | - Preview    |   |
|  +----------------+   +--------------+   |
|                                          |
+------------------------------------------+
                    |
                    | "Open in Explore" or
                    | "Create Dashboard"
                    v
+------------------------------------------+
|         Grafana Native Tools             |
|                                          |
|  +----------------+   +--------------+   |
|  | Explore        |   | Dashboards   |   |
|  | - Run queries  |   | - Create     |   |
|  | - Test filters |   | - Edit       |   |
|  | - Debug        |   | - Share      |   |
|  +----------------+   +--------------+   |
|                                          |
|  +--------------------------------------+|
|  | Panel Editor                         ||
|  | - Table, Time Series, Bar, Pie, etc. ||
|  | - Field config, transformations      ||
|  +--------------------------------------+|
+------------------------------------------+
```

## User Flow

1. **Open Plugin** at `/a/lindas-visualizer-app`
2. **Search** for a data cube by keyword
3. **Select** a cube to view its dimensions and measures
4. **Configure** which fields to include in the query
5. **Generate** the SPARQL query (preview it)
6. **Choose Action**:
   - "Open in Explore" - For testing and ad-hoc analysis
   - "Create Dashboard" - For creating a shareable visualization
7. **Visualize** using Grafana's native panel types

## Configuration

### Grafana Lockdown

The `docker-compose.yml` enforces LINDAS-only access:

```yaml
environment:
  # Users get Editor role - can create dashboards, NOT add datasources
  - GF_AUTH_ANONYMOUS_ORG_ROLE=Editor

  # Disable admin features for editors
  - GF_USERS_EDITORS_CAN_ADMIN=false
  - GF_USERS_VIEWERS_CAN_EDIT=false

  # Disable unnecessary features
  - GF_ALERTING_ENABLED=false
  - GF_UNIFIED_ALERTING_ENABLED=false
```

### Datasource Provisioning

The `grafana/provisioning/datasources/lindas.yml` provisions the LINDAS datasource:

```yaml
datasources:
  - name: LINDAS
    uid: lindas-datasource
    type: flandersmake-sparql-datasource
    url: https://lindas.admin.ch/query
    isDefault: true
    editable: false  # Cannot be modified
```

## File Structure

```
grafana/plugins/lindas-visualizer-app/
  src/
    module.ts                    - Plugin entry point
    types.ts                     - TypeScript interfaces
    components/
      CubeSelector.tsx           - Cube browser and field selection
    scenes/
      ExplorerScene.tsx          - Main plugin page
    services/
      mockCatalog.ts             - Mock data for development
    utils/
      sparql.ts                  - SPARQL utilities
      sparqlBuilder.ts           - Query generation
  plugin.json                    - Plugin manifest
  package.json                   - Dependencies
```

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

Access at: http://localhost:3003/a/lindas-visualizer-app

### Development Mode

```bash
npm run dev  # Watch mode with auto-rebuild
```

## Changelog

### v3.0.0 (2025-12-22)

**Major Architectural Change: Grafana-Native Visualization**

The plugin no longer embeds its own visualization. Instead, it focuses on:
1. Data discovery (browsing LINDAS cubes)
2. Query generation (building SPARQL queries)
3. Integration with Grafana's native tools

**Changes:**
- Removed embedded VizPanel and @grafana/scenes visualization
- Added "Open in Explore" action
- Added "Create Dashboard" action
- Locked down Grafana to LINDAS-only access
- Users now use Grafana's native panel editor for visualization
- Changed default anonymous role from Admin to Editor
- Updated plugin name to "LINDAS Data Browser"

**Why this change?**
The previous version tried to recreate visualize.admin.ch's interface inside Grafana. This was redundant because:
1. Grafana already has excellent visualization tools
2. Users should learn Grafana's native interface
3. Embedding visualization duplicates functionality
4. The goal is to use LINDAS data, not recreate another app

### v2.1.0 (2025-12-19)

Previous version with embedded visualization using @grafana/scenes.

### v2.0.0

Initial Grafana App Plugin with ephemeral dashboards.

## Security

### Datasource Lockdown

Users cannot:
- Add new datasources
- Modify the LINDAS datasource
- Access data from external sources

Users can:
- Browse LINDAS cubes
- Create dashboards using LINDAS data
- Share dashboards with others

### Role-Based Access

| Role    | Capabilities |
|---------|--------------|
| Viewer  | View dashboards only |
| Editor  | Create/edit dashboards, use plugin |
| Admin   | Full access (reserved for system administrators) |

## Troubleshooting

### Plugin Not Loading

1. Check that the plugin is built: `npm run build`
2. Check Grafana logs: `docker-compose logs grafana`
3. Verify plugin is allowed: Check `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS`

### SPARQL Queries Timing Out

Increase the timeout in docker-compose.yml:
```yaml
- GF_DATAPROXY_TIMEOUT=600  # 10 minutes
```

### Cannot Add Datasource

This is intentional. Only LINDAS data is permitted in this Grafana instance.

## Future Improvements

- Live SPARQL endpoint integration (replace mock data)
- Filter UI with dimension value selection
- Dashboard templates for common cube types
- Multi-cube joins for combined visualizations
