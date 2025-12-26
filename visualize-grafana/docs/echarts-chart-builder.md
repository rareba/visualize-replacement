# ECharts Chart Builder - Comprehensive Implementation

## Overview

This document describes the comprehensive ECharts-based chart builder that replaces the D3.js visualization system. The implementation follows Swiss Federal CI design guidelines and provides a professional, feature-rich data visualization platform.

## Architecture

### Core Components

1. **Chart Builder Page** (`app/pages/chart-builder.tsx`)
   - Main application entry point
   - Swiss Federal CI styled header with Swiss cross logo
   - Navigation sidebar with multiple views
   - Multiple chart support with vertical stacking
   - Zen mode for distraction-free viewing

2. **SimpleEChartsChart** (`app/charts/simple-echarts/SimpleEChartsChart.tsx`)
   - Core chart rendering component using ECharts
   - Supports 6 chart types: column, bar, line, area, pie, scatter
   - Smart sorting for chronological date/year ordering
   - Label formatting to extract readable text from LINDAS URIs

## Features

### Multi-View Interface

The application provides 5 distinct views accessible from the sidebar:

1. **Visualization** - Main chart view with configuration controls
2. **Data Table** - Tabular view of all data with all dimensions and measures
3. **Filters** - Interactive filtering with checkbox selection per dimension
4. **Settings** - Global configuration options
5. **API / Code** - SPARQL queries, JSON export, and embed code

### Multiple Charts Dashboard

- Add multiple charts that stack vertically
- Each chart has independent configuration:
  - Chart type
  - X/Y axis selection
  - Group by dimension
  - Color palette
  - Legend and tooltip toggles
- Click on a chart to select it for editing
- Tab navigation when multiple charts exist
- Remove individual charts (minimum 1 required)

### Interactive Filters

- Filter data across all charts simultaneously
- Per-dimension filter controls with:
  - Select All / Clear buttons
  - Checkbox list for each unique value
  - Count of selected values shown as chip
- Clear All Filters button when filters are active

### Zen Mode

- Full-screen distraction-free viewing
- Hides header, sidebar, and all controls
- Charts expand to fill the viewport
- Exit button in top-right corner

### Export Options

- **CSV Export** - Data in spreadsheet format
- **JSON Export** - Full configuration including:
  - All chart configurations
  - Global filters
  - Settings

### Settings Panel

- Default color palette selection
- Animation duration slider (0-2000ms)
- Show data labels toggle
- Compact mode toggle
- Export quality selection (low/medium/high)
- Data source information display

### Color Palettes

Six professional color palettes:
- **Swiss** - Official Swiss federal colors (red, blue, green, yellow)
- **Federal** - Alternative federal palette
- **Blue** - Blue gradient scale
- **Warm** - Warm colors (red to green)
- **Cool** - Cool colors (blue to pink)
- **Monochrome** - Grayscale

### API / Code View

- SPARQL query with copy functionality
- Configuration JSON preview
- Embed iframe code generation

## SPARQL Integration

The chart builder queries LINDAS directly using two SPARQL queries:

### Metadata Query
Fetches cube title, dimensions, and measures from the SHACL shape with support for English language labels.

### Observations Query
```sparql
PREFIX cube: <https://cube.link/>

SELECT ?obs ?p ?o WHERE {
  <cubeIri> cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
  ?obs ?p ?o .
} LIMIT 10000
```

Note: Uses `cube:observationSet` pattern which is the correct structure for LINDAS cubes.

## Smart Data Handling

### Sorting
The `sortObservations` function handles various date/time formats:
- Extracts years from URIs like `https://ld.admin.ch/time/year/2020`
- Handles "Year 2020" format strings
- Falls back to numeric then alphabetical sorting

### Label Formatting
The `formatLabel` function extracts readable labels from:
- URIs: Extracts last path segment and decodes
- "Year 2020" format: Extracts just the year
- Other values: Returns as-is

### Statistics
Real-time calculation of:
- Minimum value
- Maximum value
- Average
- Sum
- Count

## Swiss Federal CI Design

The interface follows Swiss Federal CI guidelines:
- Swiss cross logo in header
- Official color scheme (#DC0018 for red accent)
- Dark header with red bottom border
- Clean typography with proper hierarchy
- Consistent spacing and padding

## Usage

Access the chart builder at:
```
/chart-builder?cube=<cube-iri>
```

Example:
```
/chart-builder?cube=https://agriculture.ld.admin.ch/foag/cube/MilkDairyProducts/Production_Index_Year
```

## Responsive Design

- Sidebar collapses to temporary drawer on mobile
- Controls wrap on smaller screens
- Charts resize appropriately

## State Management

- React hooks for local state
- useMemo for computed values
- useCallback for event handlers
- Efficient filtering with Set operations

## Future Improvements

- Annotations support (data structure in place)
- PNG export (canvas capture)
- Save/load configurations
- Multi-language support
- Additional chart types (combo, map)
- Stacked bar/area modes
- Custom color picker
- Chart title editing
