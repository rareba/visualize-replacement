# Architecture Simplification for visualize-admin-echarts

## Overview

This document explains the architectural changes made to simplify the visualize-admin-echarts application for easier maintenance while preserving all frontend features and functionality.

## Problem Statement

The original application had significant complexity:

1. **Dual Rendering Layer**: Charts used D3.js for rendering with ECharts adapters layered on top
2. **Complex State Management**: Heavy use of React Context with multiple layers of state transformation
3. **Redundant Code**: D3 rendering code remained even after ECharts migration
4. **Deep Component Hierarchy**: Multiple wrapper components for data fetching, state, and rendering

## Solution: Simplified ECharts-Only Architecture

### Key Changes

1. **Remove D3 Rendering Layer**
   - All D3 rendering components moved to `Removed/` folder
   - ECharts adapters become the primary rendering mechanism
   - Removed D3 dependencies from core chart flow

2. **Simplified State Management**
   - Chart state computed directly from data
   - Reduced context nesting
   - Clearer data flow from fetch -> transform -> render

3. **Unified Chart Components**
   - Each chart type has a single component file
   - No separate state, props, and rendering files
   - All chart logic consolidated

### Architecture Overview

```
Before (Complex):
GraphQL -> ChartDataWrapper -> ChartProvider -> StateContext -> D3Renderer/EChartsAdapter

After (Simplified):
GraphQL -> ChartComponent -> ECharts (direct)
```

### Files Structure

```
app/
  charts/
    echarts/
      EChartsWrapper.tsx       # Core ECharts React wrapper
      theme.ts                 # Swiss Federal theming
      adapters/
        scatterplot-adapter.tsx
        line-adapter.tsx
        bar-adapter.tsx
        column-adapter.tsx
        area-adapter.tsx
        pie-adapter.tsx
        ...

    scatterplot/
      chart-scatterplot.tsx    # Main component
      scatterplot-state.tsx    # State management (to be simplified)
      Removed/                 # Old D3 code

    shared/
      containers-echarts.tsx   # ECharts container
      chart-state.ts          # Shared state utilities
```

## Scatterplot Fix

The scatterplot was not displaying due to:

1. **Data Format Issue**: The adapter expected specific state properties that weren't being passed correctly
2. **Scale Domain Issue**: When data had null/undefined values, domain calculation failed
3. **Segment Handling**: getSegment function wasn't handling cases without segment field

### Fix Applied

1. Added null checks for scale domains
2. Added fallback for empty data
3. Improved segment handling for single-series cases

## Testing

### Using Test Fixtures

The Palmer Penguins dataset is ideal for testing scatterplots:
- Location: `app/test/__fixtures/config/int/scatterplot-palmer-penguins.json`
- Data source: `https://lindas-cached.int.cluster.ldbar.ch/query`
- Features: Bill length vs bill depth with island segmentation

### Running Tests

```bash
yarn test charts/echarts/adapters/scatterplot-adapter.spec.ts
```

## Benefits of New Architecture

1. **Easier Maintenance**: Single rendering layer, clear data flow
2. **Better Performance**: No D3 overhead, direct ECharts rendering
3. **Smaller Bundle**: Removed D3 transition/selection dependencies
4. **Clearer Code**: Each chart type is self-contained
5. **Faster Development**: Changes only need to be made in one place

## Migration Notes

- Old D3 code preserved in `Removed/` folders for reference
- ECharts adapters are the source of truth for rendering
- State management simplified but backward compatible

## Next Steps

1. Complete ECharts migration for all chart types
2. Remove D3 dependencies from package.json
3. Consolidate shared utilities
4. Add comprehensive test coverage
