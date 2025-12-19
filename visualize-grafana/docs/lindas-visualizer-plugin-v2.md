# LINDAS Visualizer Plugin v2.0

This document describes the improved LINDAS Visualizer Grafana App Plugin, which replicates the graph creation functionality of visualize.admin.ch.

## Overview

The LINDAS Visualizer plugin allows users to create interactive visualizations from Swiss LINDAS Linked Data Service (https://lindas.admin.ch). It provides a user-friendly interface for browsing datasets, configuring charts, and exporting to Grafana dashboards.

## Key Features

### 1. Dataset Browser

Browse and search available cubes from LINDAS directly within the plugin:

- **Search**: Search datasets by name or description
- **Results**: Displays dataset name, publisher, modification date, and description
- **One-click selection**: Click any dataset to start creating visualizations

The browser queries LINDAS SPARQL endpoint to discover all available cube:Cube resources.

### 2. Enhanced Dimension Detection

The plugin automatically detects dimension types:

- **Temporal Dimensions**: Recognized by data types (date, dateTime, gYear, gYearMonth)
- **Numerical Dimensions**: Detected from numeric data types
- **Ordinal Dimensions**: Identified by scale type metadata
- **Categorical Dimensions**: Default for other dimensions

This allows the plugin to:
- Auto-select the best chart type (timeseries for temporal data, bar charts for categorical)
- Provide appropriate axis recommendations
- Display dimension type badges in the configurator

### 3. Chart Types Supported

| Chart Type | Description | Best For |
|------------|-------------|----------|
| Column | Vertical bar chart | Comparing categories |
| Bar | Horizontal bar chart | Ranking comparisons |
| Line | Line chart | Trends over time |
| Area | Filled area chart | Cumulative data |
| Pie | Pie chart | Parts of a whole |
| Table | Raw data display | Data exploration |

### 4. Visual Configuration

The three-column layout provides:

- **Left Panel**: Chart configuration (type, title, data mapping)
- **Center Panel**: Live preview of the visualization
- **Right Panel**: Data filters for dimension values

### 5. Smart Data Mapping

For each chart type, appropriate field mappings are provided:

- **X/Y Charts**: X Axis (dimension), Y Axis (measure), Series (optional dimension for grouping)
- **Pie Charts**: Value (measure for slice size), Segment (dimension for slices)
- **Tables**: All dimensions and measures displayed automatically

### 6. Dashboard Export

Create a Grafana dashboard with one click:
- Generates SPARQL queries for each dataset
- Creates appropriate Grafana panels with proper visualization types
- Opens the new dashboard in a new tab

## Architecture

### Data Flow

```
1. User browses/searches datasets
   |
   v
2. searchCubes() SPARQL query to LINDAS
   |
   v
3. User selects a dataset
   |
   v
4. fetchCubeMetadata() - Gets dimensions/measures with types
   |
   v
5. User configures chart (type, mappings, filters)
   |
   v
6. generateSparqlQuery() - Creates data query
   |
   v
7. Live preview with transformToDataFrame()
   |
   v
8. User exports to dashboard
   |
   v
9. createGrafanaDashboard() - Creates Grafana dashboard via API
```

### SPARQL Queries

The plugin generates two types of queries:

1. **Metadata Queries**: Fetch cube structure (dimensions, measures, labels)
2. **Data Queries**: Fetch observation data with field mappings and filters

Example data query structure:
```sparql
SELECT ?x ?y ?series WHERE {
  <cubeIri> observationSet/observation ?obs .
  ?obs <xDimension> ?x .
  ?obs <yMeasure> ?y .
  ?obs <seriesDimension> ?series .
  # Filters applied here
}
ORDER BY ?x
LIMIT 10000
```

### Tabular Data Transformation

For Grafana compatibility, data can also be fetched in obs/column/value format:

```sparql
SELECT ?obs ?column ?value WHERE {
  <cubeIri> observationSet/observation ?obs .
  ?obs ?property ?rawValue .
  # Transform to column name and resolved value
}
```

This format allows Grafana's groupingToMatrix transformation to pivot the data.

## Files Structure

```
grafana/plugins/lindas-visualizer-app/
  src/
    module.ts           - Plugin entry point
    components/
      App.tsx           - Main application component
      DatasetBrowser.tsx - Dataset search and browse
      Configurator.tsx  - Chart configuration panel
      ChartPreview.tsx  - Live visualization preview
      Filters.tsx       - Dimension value filters
    utils/
      sparql.ts         - SPARQL utilities and queries
      dashboard.ts      - Grafana dashboard generation
  plugin.json           - Plugin manifest
  package.json          - Dependencies
  webpack.config.js     - Build configuration
  tsconfig.json         - TypeScript configuration
```

## Usage

### Access the Plugin

Navigate to: `http://localhost:3003/a/lindas-visualizer-app`

Or with a pre-selected cube:
`http://localhost:3003/a/lindas-visualizer-app?cube=<cubeIri>`

### Creating a Visualization

1. Click "Browse Datasets" to search LINDAS
2. Select a dataset from the results
3. Configure the chart type and field mappings
4. Apply filters if needed
5. Click "Create Dashboard" to export

### Multiple Datasets

- Add multiple datasets using tabs
- Each dataset gets its own panel in the exported dashboard
- Remove datasets by clicking the X on the tab

## Technical Requirements

- Grafana 10.0.0 or higher
- LINDAS SPARQL datasource configured (uid: lindas-datasource)
- flandersmake-sparql-datasource plugin installed

## Building the Plugin

```bash
cd grafana/plugins/lindas-visualizer-app
npm install
npm run build
```

For development with auto-reload:
```bash
npm run dev
```

## Comparison with visualize.admin.ch

| Feature | visualize.admin.ch | LINDAS Visualizer v2 |
|---------|-------------------|---------------------|
| Dataset browsing | Full catalog | SPARQL-based search |
| Chart types | 8+ types | 6 types (core set) |
| Chart preview | D3.js rendering | Grafana components |
| Configuration | Multi-step wizard | Single-page config |
| Export format | Embed/share URLs | Grafana dashboards |
| Filters | Interactive filters | Multi-select dropdowns |
| Temporal detection | Automatic | Automatic |
| Multiple datasets | Yes | Yes (tabs) |

## Future Improvements

- Map visualization support
- Scatterplot chart type
- Interactive time range filters
- Dashboard template selection
- Export to visualize.admin.ch format

## Changelog

### v2.0.1 (2025-12-19)

**Bug Fixes:**

1. **Fixed SPARQL query error in fetchDimensionValues**
   - Issue: Variable binding conflict in SPARQL query caused HTTP 400 errors
   - Error message: "Variable cannot be bound when already in-scope: label"
   - Solution: Renamed bound variables to avoid conflicts (`?label` -> `?displayLabel`, `?schemaLabel`)

2. **Fixed dashboard creation 412 error**
   - Issue: Creating dashboards failed with HTTP 412 (Precondition Failed) when a dashboard with the same title already existed
   - Solution: Added timestamp to dashboard title to ensure uniqueness (e.g., "New Lindas Dashboard (2025-12-19 20:10:00)")

**Testing:**

- Verified dataset browsing (50 datasets found from LINDAS)
- Verified dimension type auto-detection (temporal, numerical, ordinal, categorical)
- Verified dashboard export creates valid Grafana dashboards
- Verified filters panel loads dimension values correctly
