# ECharts Chart Builder Implementation

## Overview

This document describes the implementation of the new ECharts-based chart builder that replaces the complex D3.js visualization system. The goal was to create a simpler, more maintainable charting solution with a professional user interface.

## Architecture

### Components Created

1. **SimpleEChartsChart** (`app/charts/simple-echarts/SimpleEChartsChart.tsx`)
   - Core chart rendering component using ECharts
   - Supports 6 chart types: column, bar, line, area, pie, scatter
   - Implements smart sorting for chronological date/year ordering
   - Includes label formatting to extract readable text from LINDAS URIs

2. **EChartsVisualization** (`app/charts/simple-echarts/EChartsVisualization.tsx`)
   - Integration layer that works with the existing ChartDataWrapper
   - Maps chart configuration types to SimpleEChartsChart types
   - Handles data fetching via GraphQL

3. **SimpleChartPreview** (`app/charts/simple-echarts/SimpleChartPreview.tsx`)
   - Simplified preview component for the configurator
   - Uses data from the configurator state

4. **Chart Builder Page** (`app/pages/chart-builder.tsx`)
   - Professional standalone chart creation interface
   - Direct SPARQL queries to LINDAS endpoint
   - Features comprehensive configuration options

## Chart Builder Features

### Data Configuration
- **X-Axis Selection**: Choose dimension for categories (auto-detects time fields)
- **Y-Axis Selection**: Choose measure for values (shows units when available)
- **Group By**: Optional segmentation by another dimension

### Appearance Options
- **Color Palettes**: Swiss (federal), Blue, Earth, Rainbow
- **Show Legend**: Toggle for grouped charts
- **Show Tooltip**: Toggle for interactive tooltips
- **Chart Height**: Adjustable from 300px to 800px

### Views
- **Chart View**: Interactive ECharts visualization
- **Data Table View**: Tabular data display with formatting

### Export
- **PNG Export**: High-quality image download
- **CSV Export**: Spreadsheet-compatible data download

### Data Summary
- Displays Min, Max, Average, and Count statistics

## SPARQL Integration

The chart builder queries LINDAS directly using two SPARQL queries:

### Metadata Query
Fetches cube title, dimensions, and measures from the SHACL shape.

### Observations Query
```sparql
SELECT ?obs ?p ?o WHERE {
  <cubeIri> cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
  ?obs ?p ?o .
} LIMIT 10000
```

Note: Uses `cube:observationSet` pattern which is the correct structure for LINDAS cubes (not `cube:observedBy`).

## Smart Sorting

The `smartSort` function handles various date/time formats:
- Extracts years from URIs like `https://ld.admin.ch/time/year/2020`
- Handles "Year 2020" format strings
- Falls back to numeric then alphabetical sorting

## Label Formatting

The `formatLabel` function extracts readable labels from:
- URIs: Extracts last path segment
- "Year 2020" format: Extracts just the year
- Other values: Returns as-is

## Integration Points

### Configurator Integration
Added `PanelBodyWrapper type="M"` with `ChartPreview` component to the `ConfigureChartStep` in `configurator.tsx`.

### Chart Filters Integration
Updated `chart-with-filters.tsx` to route supported chart types to `EChartsVisualization`.

## Usage

Access the chart builder at:
```
/chart-builder?cube=<cube-iri>
```

Example:
```
/chart-builder?cube=https://agriculture.ld.admin.ch/foag/cube/MilkDairyProducts/Production_Index_Year
```

## Design Decisions

1. **Direct SPARQL**: Bypasses complex GraphQL infrastructure for simpler data flow
2. **ECharts over D3**: More maintainable, better React integration, rich features out-of-box
3. **Swiss Federal Design**: Uses official color palette and styling guidelines
4. **Collapsible Settings**: Maximizes chart space while keeping options accessible
5. **Progressive Disclosure**: Basic options visible, advanced options available when needed

## Future Improvements

- Additional chart types (combo charts, maps)
- Interactive filtering on dimensions
- Save/share chart configurations
- Embedding support
- More color palette options
- Custom color picker
