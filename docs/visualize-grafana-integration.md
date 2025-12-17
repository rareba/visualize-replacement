# Visualize-Grafana Integration

## Overview

This document describes the integration of visualize.admin.ch with Grafana to provide a seamless LINDAS dataset visualization experience. The solution combines:

1. **visualize.admin.ch** - For dataset discovery and dimension selection (the parts it does well)
2. **Grafana** - For flexible dashboard creation and visualization (embedded seamlessly)

## Architecture

```
+---------------------------+
|    visualize-grafana      |
|  (Next.js Application)    |
+---------------------------+
|                           |
|  1. Dataset Selection     |  <-- Uses visualize.admin.ch UI
|     - Browse LINDAS       |
|     - Select dimensions   |
|     - Configure filters   |
|                           |
+---------------------------+
|                           |
|  2. Dashboard Builder     |  <-- Embedded Grafana (iframe)
|     - Create panels       |
|     - Choose chart types  |
|     - Build dashboards    |
|                           |
+---------------------------+
           |
           v
+---------------------------+
|         Grafana           |
|    (Port 3003)            |
+---------------------------+
|  - SPARQL Datasource      |
|  - LINDAS Connection      |
|  - Dashboard Storage      |
+---------------------------+
           |
           v
+---------------------------+
|   LINDAS SPARQL Endpoint  |
|  lindas.admin.ch/query    |
+---------------------------+
```

## Key Components

### 1. Modified Configurator (`configurator.tsx`)

The chart configurator step now embeds Grafana instead of the original D3.js preview:

- Left panel: Dimension/measure selection (unchanged)
- Right panel: Embedded Grafana dashboard builder (new)

### 2. SPARQL Query Generator (`grafana-export.tsx`)

Generates SPARQL queries from the visualize chart configuration:

```typescript
generateSparqlQuery(chartConfig: ChartConfig): string
```

This function:
- Extracts the cube IRI from the configuration
- Collects selected dimension/measure IRIs
- Builds appropriate WHERE patterns
- Applies filters from the configuration

### 3. Grafana Embed Component (`EmbeddedGrafanaDashboard`)

Renders Grafana in kiosk mode within the visualize interface:

- Uses iframe with proper styling
- Passes the generated SPARQL query via URL parameters
- Maintains consistent look and feel

### 4. Docker Compose Setup

The `docker-compose.yml` runs both services:

- PostgreSQL (for visualize user data)
- Grafana with SPARQL plugin and LINDAS datasource pre-configured

## Environment Variables

```env
# Grafana Integration
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3003
NEXT_PUBLIC_GRAFANA_DATASOURCE_UID=lindas-datasource
```

## Running the Application

### Prerequisites

- Docker and Docker Compose
- Node.js 22+
- Yarn

### Steps

1. Start the infrastructure:
   ```bash
   cd visualize-grafana
   docker-compose up -d
   ```

2. Wait for Grafana to initialize (installs SPARQL plugin)

3. Start the visualize application:
   ```bash
   cd app
   yarn setup:dev
   yarn dev
   ```

4. Open http://localhost:3000

### User Flow

1. **Browse Datasets**: Navigate to browse page, select a LINDAS dataset
2. **Configure Data**: Select dimensions and measures you want to visualize
3. **Build Dashboard**: The embedded Grafana appears in the preview area
4. **Create Visualizations**: Use Grafana's full dashboard capabilities

## Grafana Configuration

### SPARQL Datasource

Pre-configured to connect to LINDAS:

```yaml
datasources:
  - name: LINDAS
    uid: lindas-datasource
    type: flandersmake-sparql-datasource
    url: https://lindas.admin.ch/query
```

### Embedding Settings

Grafana is configured for seamless embedding:

- `GF_SECURITY_ALLOW_EMBEDDING=true` - Allow iframe embedding
- `GF_AUTH_ANONYMOUS_ENABLED=true` - No login required
- `GF_AUTH_ANONYMOUS_ORG_ROLE=Editor` - Users can create dashboards
- `GF_USERS_DEFAULT_THEME=light` - Match visualize's theme

## Limitations and Future Work

### Current Limitations

1. **Query Passing**: Complex filters may not translate perfectly to SPARQL
2. **State Sync**: Dashboard changes in Grafana are not synced back to visualize
3. **Authentication**: Grafana runs with anonymous access (not production-ready)

### Future Improvements

1. **Custom Grafana Plugin**: Build a dedicated panel type for LINDAS data
2. **Bidirectional Sync**: Save Grafana dashboards linked to visualize configs
3. **SSO Integration**: Share authentication between visualize and Grafana
4. **Theming**: Better CSS integration to match visualize's design system

## Technical Notes

### Why This Approach?

1. **Reuse Existing Work**: visualize.admin.ch already has excellent dataset discovery
2. **Grafana Strengths**: Powerful, well-maintained dashboard builder
3. **Avoid Reinventing**: No need to build another charting library
4. **Extensibility**: Grafana's plugin ecosystem enables future enhancements

### SPARQL Query Format

The generated queries follow the cube.link vocabulary:

```sparql
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT DISTINCT ?dim0 ?dim0_label ?dim1 ?dim1_label
WHERE {
  ?observation a cube:Observation .
  ?observation cube:observedBy <CUBE_IRI> .
  ?observation <DIMENSION_IRI_0> ?dim0 .
  OPTIONAL { ?dim0 schema:name ?dim0_label . }
  ?observation <DIMENSION_IRI_1> ?dim1 .
  OPTIONAL { ?dim1 schema:name ?dim1_label . }
}
LIMIT 1000
```

## References

- [visualize.admin.ch Documentation](https://github.com/visualize-admin/visualization-tool)
- [Grafana SPARQL Datasource](https://github.com/Flanders-Make-vzw/grafana-sparql-datasource)
- [LINDAS Documentation](https://lindas.admin.ch)
- [RDF Data Cube Vocabulary](https://www.w3.org/TR/vocab-data-cube/)
