# ECharts Migration Documentation

## Overview

This document describes the migration of visualization-tool from D3.js to Apache ECharts for chart rendering.

## Changes Made

### ECharts Adapters Created

The following ECharts adapters were created in `app/charts/echarts/adapters/`:

1. **column-adapter.tsx** - Vertical bar/column charts (single and grouped)
2. **bar-adapter.tsx** - Horizontal bar charts
3. **line-adapter.tsx** - Line charts (single and multi-line)
4. **area-adapter.tsx** - Stacked area charts with time series support
5. **pie-adapter.tsx** - Pie charts with label connectors
6. **scatterplot-adapter.tsx** - Scatter plots

### Combo Chart Adapters

1. **combo-line-column-adapter.tsx** - Combined line and column charts with dual Y axes
2. **combo-line-dual-adapter.tsx** - Dual-axis line charts
3. **combo-line-single-adapter.tsx** - Multi-line charts

### Supporting Infrastructure

1. **EChartsWrapper.tsx** - Core wrapper component for ECharts integration
2. **theme.ts** - Swiss Federal Design System theming for ECharts

## Bug Fixes

### Area Chart Not Rendering Data (Fixed 2026-01-19)

**Issue**: The area chart on the homepage was showing only axes but no data.

**Root Cause**: In `area-adapter.tsx`, the data grouping logic used `getSegmentAbbreviationOrLabel(d)` which returns the display label, but the `segments` array contains segment keys (IDs). This caused a key mismatch where:
- `segmentDataMap` was initialized with segment keys
- Data was being added using segment labels
- Result: No data matched any keys

**Fix**: Changed the data grouping to use `getSegment(d)` which returns the segment key, ensuring consistent key matching:

```typescript
// Before (incorrect)
chartData.forEach((d) => {
  const segment = getSegmentAbbreviationOrLabel(d); // Returns label
  // ...
});

// After (correct)
chartData.forEach((d) => {
  const segment = getSegment(d); // Returns key
  // ...
});
```

## Testing Results

### Unit Test Coverage (2026-01-19)

**Total ECharts Tests: 70 tests passing**

| Test File | Tests | Coverage |
|-----------|-------|----------|
| theme.spec.ts | 20 | 100% |
| EChartsWrapper.spec.tsx | 21 | 94.44% |
| column-adapter.spec.ts | 8 | 85.36% |
| bar-adapter.spec.ts | 5 | 84.04% |
| line-adapter.spec.ts | 3 | 85.58% |
| area-adapter.spec.ts | 4 | 76.47% |
| pie-adapter.spec.ts | 5 | 89.79% |
| scatterplot-adapter.spec.ts | 4 | 99.5% |

**Coverage Summary:**
- ECharts core folder: **96.55%** statement coverage
- ECharts adapters folder: **65.84%** statement coverage

### Chart Types Tested

| Chart Type | Status | Notes |
|------------|--------|-------|
| Column (single) | Working | Renders correctly with Swiss Federal theming |
| Column (grouped) | Working | Multiple series rendered side by side |
| Column (stacked) | Working | Series stacked with proper legend |
| Bar (horizontal) | Working | Horizontal bars with error whisker support |
| Bar (grouped) | Working | Grouped horizontal bars |
| Bar (stacked) | Working | Stacked horizontal bars |
| Line | Working | Single and multi-line with time series support |
| Area (stacked) | Working | Fixed data grouping issue |
| Pie | Working | Label positioning (inside/outside based on slice count) |
| Scatterplot | Working | Requires two numerical measures |

### Manual Browser Testing (2026-01-19)

Tested using Chrome extension against local development server:

**Dataset: Analysis of programming on Swiss private radio stations**

| Chart Type | Test Result | Observations |
|------------|-------------|--------------|
| Columns (stacked) | PASS | 20+ radio stations rendered with distinct colors, proper Y-axis scaling |
| Bars (horizontal stacked) | PASS | Years (2020, 2022, 2024) on Y-axis, radio stations stacked |
| Lines | PASS | Multiple series with different colors, proper time axis |
| Areas (stacked) | PASS | All 20+ segments properly stacked, legend working |
| Pie | PASS | All segments with distinct colors, labels displayed |
| Scatterplot | PASS | Shows validation when insufficient numerical measures |

### Visual Comparison

Compared ECharts version (localhost:3000) with production D3 version (visualize.admin.ch):

1. **Traffic noise pollution** (Column chart) - ECharts renders grouped bars correctly with Night/Day coloring
2. **Distribution of expenses and income by office** (Area chart) - ECharts renders stacked areas with Expenditure/Revenue correctly after fix
3. **Swiss private radio stations** (Multiple chart types) - All chart types render with feature parity

### Features Verified

- Interactive tooltips on hover
- Legend display with proper segment names
- Axis labels and formatting (dates, numbers)
- Data zoom slider for time-series charts
- Swiss Federal Design System colors and fonts
- Multi-segment rendering with color scales
- Series stacking for area and bar charts
- Grouped series for column and bar charts
- Error whiskers for bar charts with uncertainty data
- Label positioning based on data density (pie charts)

## Architecture Notes

### Data Flow

1. **ChartState** (from existing infrastructure) provides:
   - `chartData` - Raw observation data
   - `segments` - List of segment keys
   - `getSegment(d)` - Returns segment key for observation
   - `getSegmentAbbreviationOrLabel(d)` - Returns display label
   - `colors(segment)` - Color scale expecting segment key
   - `getX(d)`, `getY(d)` - Value accessors

2. **ECharts Adapter** transforms data to ECharts option format:
   - Groups data by segment using segment keys
   - Builds series array for ECharts
   - Configures axes, tooltips, legends

3. **EChartsWrapper** renders the chart using the echarts-for-react library

### Key Lessons

- Always use segment keys (from `getSegment()`) for data grouping and color lookups
- Use segment labels (from `getSegmentAbbreviationOrLabel()`) only for display purposes (series names, tooltips)
- The `colors()` scale expects segment keys, not labels

## Console Error Fixes (2026-01-19)

### Fixed: Missing key prop in ChartMoreButton

**Issue**: React warning "Each child in a list should have a unique 'key' prop" in `ChartMoreButton` component.

**Root Cause**: Menu action items were being pushed to an array and rendered without key props.

**Fix**: Added `key` props to all menu action items in both `getPublishedActions()` and `getUnpublishedActions()` callbacks in `app/components/chart-shared.tsx`.

### Fixed: chartKey prop on DOM element

**Issue**: React warning "React does not recognize the `chartKey` prop on a DOM element."

**Root Cause**: In `ChartWrapper` component, the `chartKey` prop was being spread onto the Box component via `{...rest}`.

**Fix**: Destructured `chartKey` explicitly in `app/components/chart-panel.tsx` to prevent it from being spread to the DOM.

### Fixed: notched prop DOM warning

**Issue**: React warning "Received `false` for a non-boolean attribute `notched`" when using Select components with standard or filled variants.

**Root Cause**: In `app/themes/components.tsx`, the `notched` prop was set in MuiSelect default props. However, `notched` is only valid for `OutlinedInput` variants. When used with other variants (standard, filled), the prop gets passed to the DOM element, causing a warning.

**Fix**: Removed the `notched` prop entirely from MuiSelect default props since it's not valid for all Select variants.

### Known External Package Warnings

The following warnings come from the `@interactivethings/swiss-federal-ci` external package and cannot be fixed in this codebase:

- `Invalid DOM property 'fill-rule'. Did you mean 'fillRule'?`
- `Invalid DOM property 'clip-rule'. Did you mean 'clipRule'?`
- `Invalid DOM property 'clip-path'. Did you mean 'clipPath'?`

These are SVG attributes in the Swiss Federal CI package that use HTML naming conventions instead of React JSX naming conventions. This would need to be fixed upstream in the `@interactivethings/swiss-federal-ci` package.
