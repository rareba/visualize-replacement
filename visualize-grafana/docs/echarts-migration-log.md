# ECharts Migration Log

This document tracks the changes made during the migration from D3.js to ECharts for chart visualization.

## Date: 2025-01-20

### Summary

Completed the creation of ECharts adapters for all main chart types, ensuring feature parity with the original D3.js implementation while making the codebase easier to maintain.

### Changes Made

#### 1. Fixed React Warnings in Test Files

**File:** `app/homepage/examples-echarts.spec.tsx`

- Fixed the mock for `next/dynamic` to properly filter out non-DOM props (xField, yField, segmentField, chartType, etc.)
- This prevents React warnings about unknown props being passed to DOM elements

#### 2. Fixed React Key Warning

**File:** `app/components/chart-shared.tsx`

- Added unique `key` props to all menu action items in both `getPublishedActions()` and `getUnpublishedActions()` functions
- Keys added: "table-view", "download-png", "copy", "share", "edit", "duplicate", "delete"

#### 3. Created ECharts Scatterplot Adapter

**File:** `app/charts/adapters/echarts-scatterplot-bridge.tsx`

- Bridges the existing `ScatterplotState` to ECharts rendering
- Features:
  - Groups data points by segment for multi-series scatter plots
  - Applies Swiss Federal design theme
  - Supports tooltips with coordinate display
  - Interactive legend for segment filtering
  - Smooth animations with configurable transition

#### 4. Created ECharts Area Chart Adapter

**File:** `app/charts/adapters/echarts-area-bridge.tsx`

- Bridges the existing `AreasState` to ECharts rendering
- Features:
  - Supports stacked area charts
  - Time-series x-axis support
  - Legend and tooltip integration
  - Consistent styling with Swiss Federal design

#### 5. Created ECharts Bar Chart Adapter (Horizontal Bars)

**File:** `app/charts/adapters/echarts-bar-bridge.tsx`

- Bridges the existing `BarsState` to ECharts rendering
- Features:
  - Horizontal bar orientation (different from column chart)
  - Value labels at bar ends
  - Interactive tooltips
  - Consistent styling with other chart types

#### 6. Updated Adapters Index

**File:** `app/charts/adapters/index.ts`

- Exported all new adapters:
  - `EChartsScatterplot`
  - `EChartsAreas`
  - `EChartsBars`
- Organized exports with clear comments indicating chart types

### Complete List of ECharts Adapters

| Chart Type | D3 Component | ECharts Adapter | Status |
|------------|--------------|-----------------|--------|
| Column (Vertical Bars) | `Columns` | `EChartsColumns` | Exists |
| Column Error Whiskers | `ErrorWhiskers` | `EChartsErrorWhiskers` | Exists |
| Bar (Horizontal Bars) | `Bars` | `EChartsBars` | New |
| Line | `Lines` | `EChartsLines` | Exists |
| Area | `Areas` | `EChartsAreas` | New |
| Pie | `Pie` | `EChartsPie` | Exists |
| Donut | `Pie` | `EChartsDonut` | Exists |
| Scatterplot | `Scatterplot` | `EChartsScatterplot` | New |
| Map | `Map` | N/A | Geographic, special handling |
| Table | `Table` | N/A | Not visual chart |
| Combo | Various | N/A | Complex, needs separate work |

### Architecture Notes

The adapter pattern allows:
1. **Gradual migration**: Components can be switched individually
2. **Feature flag toggle**: Use `NEXT_PUBLIC_RENDER_ENGINE=echarts` or `?renderEngine=echarts` URL parameter
3. **A/B testing**: Compare performance between renderers
4. **Easy rollback**: If issues arise, switch back to D3

### Testing Results

- All 492 unit tests passing
- TypeScript compilation successful with no errors
- React warnings addressed

### Next Steps

1. Map chart support (geographic visualizations)
2. Combo charts (multiple chart types combined)
3. Performance testing comparison D3 vs ECharts
4. Browser console error testing in production builds
