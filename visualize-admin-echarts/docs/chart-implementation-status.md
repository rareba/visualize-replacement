# ECharts Chart Implementation Status

This document tracks the implementation status of all chart types in the visualization tool.

## Summary

- **Total Chart Types**: 23
- **ECharts-based**: 21 (91%)
- **Non-ECharts**: 2 (map uses Mapbox, table uses HTML table)
- **Implementation Status**: Complete
- **Build Status**: Passing (Next.js build successful)
- **TypeScript**: No errors

## Chart Types by Category

### Basic Charts (5)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Column | column-adapter.tsx | Implemented |
| Bar | bar-adapter.tsx | Implemented |
| Line | line-adapter.tsx | Implemented |
| Area | area-adapter.tsx | Implemented |
| Scatterplot | scatterplot-adapter.tsx | Implemented |

### Part of Whole (4)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Pie | pie-adapter.tsx | Implemented |
| Donut | donut-adapter.tsx | Implemented |
| Funnel | funnel-adapter.tsx | Implemented |
| Waterfall | waterfall-adapter.tsx | Implemented |

### Hierarchical (2)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Treemap | treemap-adapter.tsx | Implemented |
| Sunburst | sunburst-adapter.tsx | Implemented |

### Statistical (2)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Boxplot | boxplot-adapter.tsx | Implemented |
| Heatmap | heatmap-adapter.tsx | Implemented |

### Flow (1)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Sankey | sankey-adapter.tsx | Implemented |

### Specialized (6)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Radar | radar-adapter.tsx | Implemented |
| Gauge | gauge-adapter.tsx | Implemented |
| Polar | polar-adapter.tsx | Implemented |
| Wordcloud | wordcloud-adapter.tsx | Implemented |
| Map | N/A (Mapbox) | Uses Mapbox |
| Table | N/A (HTML) | Uses HTML table |

### Comparison / Combo (3)

| Chart Type | Adapter | Status |
|------------|---------|--------|
| Combo Line Single | combo-line-single-adapter.tsx | Implemented |
| Combo Line Dual | combo-line-dual-adapter.tsx | Implemented |
| Combo Line Column | combo-line-column-adapter.tsx | Implemented |

## Chart Selector

The chart selector organizes charts into categories with tabs:
- Visual card-based selection with icons
- Tooltips showing chart descriptions
- Disabled states for charts not compatible with current dataset
- Category filtering with chip navigation

## Key Files

- **Chart Registry**: `app/charts/chart-registry.ts` - Central configuration for all chart types
- **Chart Selector**: `app/configurator/components/chart-type-selector.tsx` - UI for selecting charts
- **ECharts Adapters**: `app/charts/echarts/adapters/` - Individual chart implementations
- **Chart Categories**: `app/charts/index.ts` - Category definitions and ordering

## Technical Notes

1. All ECharts adapters follow the same pattern:
   - Accept chart state from context
   - Transform data to ECharts format
   - Use shared utilities from adapter-utils.ts
   - Apply Swiss Federal design theme

2. Chart enabling logic in `getEnabledChartTypes()` considers:
   - Number of dimensions and measures
   - Temporal dimension availability
   - Categorical dimension availability
   - Geographic dimension availability
   - Unit compatibility for combo charts

3. TypeScript exhaustive checks ensure all chart types are handled in:
   - Switch statements
   - Configuration adjusters
   - Annotation support
   - Limit calculations
