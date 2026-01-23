# ECharts Adapter Refactoring

## Date: 2026-01-20 (Updated)

## Overview

This document describes the comprehensive refactoring of ECharts adapters to improve maintainability, reduce code duplication, and establish consistent patterns across all chart types.

## Problem Statement

The original adapter implementations had significant code duplication:
- Repeated axis configuration code (~20-30 lines per adapter)
- Duplicated tooltip configuration
- Error whisker rendering duplicated between column and bar adapters
- Inconsistent handling of bounds/scales across adapters
- No shared utilities for common operations
- DataZoom logic duplicated between line and area adapters
- Combo chart dual-axis configurations repeated across 3 adapters
- No factory pattern for creating series

## Solution

Created a comprehensive shared utilities ecosystem:
1. **Core Utilities** (`adapter-utils.ts`) - Axis, grid, tooltip, legend configurations
2. **Series Builders** (`series-builders.ts`) - Factory functions for all series types
3. **Dual-Axis Utilities** (`dual-axis-utils.ts`) - Combo chart configurations
4. **Hooks** (`hooks/useDataZoom.ts`) - Shared React hooks for interactive features

## Architecture

```
app/charts/echarts/
├── adapter-utils.ts       # Core shared utilities (axis, grid, tooltip, legend)
├── data-utils.ts          # Data transformation utilities (grouping, validation)
├── series-builders.ts     # Series factory functions
├── dual-axis-utils.ts     # Dual Y-axis configurations
├── tooltip-formatters.ts  # Tooltip formatter factory functions
├── ChartContainer.tsx     # React wrapper component with dimension handling
├── hooks/
│   ├── index.ts           # Hook exports
│   └── useDataZoom.ts     # DataZoom hook
├── theme.ts               # Swiss Federal theme
├── EChartsWrapper.tsx     # React ECharts wrapper component
├── index.ts               # Public exports
└── adapters/
    ├── area-adapter.tsx
    ├── bar-adapter.tsx
    ├── column-adapter.tsx
    ├── line-adapter.tsx
    ├── pie-adapter.tsx
    ├── scatterplot-adapter.tsx
    ├── combo-line-column-adapter.tsx
    ├── combo-line-dual-adapter.tsx
    └── combo-line-single-adapter.tsx
```

## Changes Made

### New File: `app/charts/echarts/adapter-utils.ts`

Contains ~400 lines of shared utilities:

#### Safe Scale/Bounds Helpers
- `safeGetDomain()` - Safely retrieves scale domain with fallback for undefined/NaN
- `safeGetNumericDomain()` - Specialized for numeric domains with 0-100 fallback
- `safeGetBounds()` - Safely retrieves chart bounds with defaults

#### Axis Configuration Builders
- `createCategoryAxis()` - Creates category axis with Swiss Federal styling
- `createValueAxis()` - Creates value axis with Swiss Federal styling

#### Grid/Tooltip/Legend
- `createGridConfig()` - Creates grid from bounds
- `createAxisTooltip()` - Creates axis-triggered tooltip
- `createItemTooltip()` - Creates item-triggered tooltip
- `createLegend()` - Creates legend configuration

#### Error Whisker Rendering
- `renderVerticalErrorWhisker()` - For column charts (vertical bars)
- `renderHorizontalErrorWhisker()` - For bar charts (horizontal bars)

#### Data Transformation
- `groupDataBySegment()` - Groups chart data by segment for multi-series charts
- `buildSeriesDataFromMap()` - Builds series data array from segment map

#### Common Properties
- `getDefaultAnimation()` - Returns standard animation settings
- `createNoDataGraphic()` - Creates "No data available" message
- `calculateChartDimensions()` - Calculates container dimensions from bounds

### New File: `app/charts/echarts/series-builders.ts`

Factory functions for creating ECharts series:

#### Bar Series
- `createBarSeries()` - Single bar series with styling
- `createBarSeriesGroup()` - Multiple bar series for grouped/stacked charts

#### Line Series
- `createLineSeries()` - Single line series
- `createLineSeriesGroup()` - Multiple line series

#### Scatter Series
- `createScatterSeries()` - Single scatter series
- `createScatterSeriesGroup()` - Multiple scatter series for segmented charts

#### Area Series
- `createAreaSeries()` - Line with area fill
- `createAreaSeriesGroup()` - Stacked area charts

#### Other
- `createPieSeries()` - Pie chart with Swiss Federal styling
- `createCustomSeries()` - Custom series for advanced rendering (error whiskers)

### New File: `app/charts/echarts/dual-axis-utils.ts`

Utilities for combo charts with dual Y-axes:

- `createDualYAxis()` - Creates left/right Y-axis pair with proper styling
- `createTimeAxis()` - Time-based X-axis for temporal data
- `createCrossTooltip()` - Cross-style tooltip for combo charts
- `createComboGrid()` - Grid with extra margin for dual axes
- `createCategoryComboTooltipFormatter()` - Category-based tooltip formatting
- `createTimeComboTooltipFormatter()` - Time-based tooltip formatting

### New File: `app/charts/echarts/hooks/useDataZoom.ts`

React hook for dataZoom (time range filtering):

- `useDataZoom()` - Manages dataZoom state and synchronization with interactive filters
- `useDataZoomEvents()` - Returns event handlers for dataZoom-enabled charts

Features:
- Synchronizes with interactive filters store
- Calculates zoom percentages from time ranges
- Provides slider and inside dataZoom configurations
- Swiss Federal styling for slider component

### Refactored Adapters

#### `column-adapter.tsx`
- Reduced from 579 lines to 400 lines (~30% reduction)
- Now uses shared utilities for:
  - Axis configuration
  - Grid configuration
  - Error whisker rendering
  - Bounds/scale access

#### `bar-adapter.tsx`
- Reduced from 573 lines to 396 lines (~30% reduction)
- Same improvements as column adapter

#### `scatterplot-adapter.tsx`
- Reduced from 307 lines to 219 lines (~28% reduction)
- Uses shared utilities for:
  - Axis configuration
  - "No data" graphic
  - Bounds handling

#### `line-adapter.tsx`
- Reduced from 263 lines to 238 lines (~10% reduction)
- Uses shared utilities for:
  - Axis configuration
  - Grid configuration
  - Animation settings

#### `area-adapter.tsx`
- Reduced from 271 lines to 186 lines (~31% reduction)
- Uses:
  - `useDataZoom` hook for time filtering
  - `createAreaSeriesGroup` for stacked areas
  - Shared axis and grid utilities

#### `pie-adapter.tsx`
- Refactored to use shared tooltip, legend, animation utilities
- Local helpers extracted for pie-specific formatting

#### `combo-line-column-adapter.tsx`
- Reduced from 231 lines to 171 lines (~26% reduction)
- Uses:
  - `createDualYAxis` for dual axes
  - `createBarSeries` and `createLineSeries`
  - `createComboGrid` for proper margins

#### `combo-line-dual-adapter.tsx`
- Reduced from 229 lines to 158 lines (~31% reduction)
- Uses:
  - `createDualYAxis` with colored axis lines
  - `createTimeAxis` for temporal data
  - `createLineSeries` for both lines

#### `combo-line-single-adapter.tsx`
- Reduced from 177 lines to 132 lines (~25% reduction)
- Uses:
  - `createTimeAxis` for X-axis
  - `createLineSeries` for multiple lines
  - Shared grid and tooltip utilities

### New File: `app/charts/echarts/data-utils.ts`

Data transformation and grouping utilities:

- `groupTimeSeriesData()` - Groups time-series data by segment
- `buildTimeSeriesData()` - Builds series data from segment map
- `groupCategoryData()` - Groups category-based data
- `buildErrorWhiskerData()` - Builds error whisker data for simple charts
- `buildGroupedErrorWhiskerData()` - Builds error whisker data for grouped charts
- `buildCategorySeriesData()` - Builds series data for category charts
- `buildScatterData()` - Builds scatter plot data
- `groupScatterDataBySegment()` - Groups scatter data by segment
- `isDataValid()` - Validates chart data
- `filterNullValues()` - Filters null values from data
- `getDataRange()` - Gets min/max range from data

### New File: `app/charts/echarts/tooltip-formatters.ts`

Tooltip formatter factory functions:

- `createBaseTooltipConfig()` - Base Swiss Federal styled tooltip config
- `createCategoryTooltipFormatter()` - For bar/column charts
- `createTimeSeriesFormatter()` - For line/area charts
- `createScatterTooltipFormatter()` - For scatter plots
- `createPieTooltipFormatter()` - For pie charts
- `createItemTooltipFormatter()` - For single items
- `createDualAxisCategoryFormatter()` - For dual-axis category charts
- `createDualAxisTimeFormatter()` - For dual-axis time charts

Pre-built formatters:
- `defaultNumberFormatter` - With thousand separators
- `percentFormatter` - Percentage formatting
- `chfFormatter` - Swiss Franc currency
- `compactFormatter` - Compact numbers (K, M, B)

### New File: `app/charts/echarts/ChartContainer.tsx`

Reusable chart container components:

- `ChartContainer` - React component with automatic dimension handling
- `useChartContainer()` - Hook for dimension calculations
- `withChartContainer()` - HOC for adapter composition
- `renderChart()` - Utility function for simple renders

### Test Coverage

Comprehensive tests for all utilities:

| Test File | Tests |
|-----------|-------|
| `adapter-utils.spec.ts` | 34 |
| `data-utils.spec.ts` | 28 |
| `series-builders.spec.ts` | 28 |
| `dual-axis-utils.spec.ts` | 29 |
| `tooltip-formatters.spec.ts` | 29 |
| `hooks/useDataZoom.spec.ts` | 20 |
| `theme.spec.ts` | 20 |
| `EChartsWrapper.spec.tsx` | 21 |
| `pie-adapter.spec.ts` | 5 |
| `scatterplot-adapter.spec.ts` | 8 |
| `bar-adapter.spec.ts` | 5 |
| `line-adapter.spec.ts` | 3 |
| `column-adapter.spec.ts` | 8 |
| `area-adapter.spec.ts` | 4 |

**Total: 242 tests passing**

## Benefits

### 1. Reduced Code Duplication
- Eliminated ~1000+ lines of duplicate code
- Single source of truth for styling configurations
- Factory pattern eliminates repetitive series configuration

### 2. Improved Maintainability
- Changes to Swiss Federal theming only need to be made in one place
- Consistent patterns make it easier to understand and modify
- Clear separation between configuration and rendering logic

### 3. Better Error Handling
- Centralized null/undefined checks
- Consistent fallback behaviors
- Type-safe factory functions

### 4. Easier Testing
- Shared utilities can be tested independently (77 new tests)
- Adapters have less complex code to test
- Hook testing with React Testing Library

### 5. Easier Extension
- Adding new chart types is simpler
- New adapters can reuse proven utilities
- Factory functions make series creation declarative

### 6. Improved Code Organization
- Clear module boundaries
- Hooks for stateful logic
- Pure functions for configuration building

## Usage Examples

### Creating a Bar Chart
```tsx
import { createBarSeriesGroup } from "@/charts/echarts/series-builders";
import { createCategoryAxis, createValueAxis } from "@/charts/echarts/adapter-utils";

const series = createBarSeriesGroup(
  segments,
  (segment) => getData(segment),
  (segment) => getColor(segment),
  { stack: "total" }
);

const option = {
  xAxis: createCategoryAxis({ categories, name: "Category" }),
  yAxis: createValueAxis({ name: "Value", min: 0, max: 100 }),
  series,
};
```

### Creating a Combo Chart with Dual Axes
```tsx
import { createDualYAxis, createTimeAxis } from "@/charts/echarts/dual-axis-utils";
import { createLineSeries, createBarSeries } from "@/charts/echarts/series-builders";

const [leftAxis, rightAxis] = createDualYAxis({
  left: { name: "Sales", min: 0, max: 1000 },
  right: { name: "Revenue", min: 0, max: 5000 },
});

const option = {
  xAxis: createTimeAxis({ min: startDate, max: endDate }),
  yAxis: [leftAxis, rightAxis],
  series: [
    createBarSeries({ data: barData, yAxisIndex: 0 }),
    createLineSeries({ data: lineData, yAxisIndex: 1 }),
  ],
};
```

### Using the DataZoom Hook
```tsx
import { useDataZoom, useDataZoomEvents } from "@/charts/echarts/hooks";

const {
  showDataZoom,
  handleDataZoom,
  dataZoomConfig,
  extraHeight,
} = useDataZoom({ xScale, interactiveFiltersConfig });

const events = useDataZoomEvents(showDataZoom, handleDataZoom);

return (
  <EChartsWrapper
    option={{ ...option, dataZoom: dataZoomConfig }}
    onEvents={events}
    style={{ height: baseHeight + extraHeight }}
  />
);
```

## Future Improvements

1. **Interactive Features**: Add shared hooks for brush selection and legend interactivity

2. **Animation Utilities**: Create utilities for coordinated animations across series

3. **Responsive Utilities**: Add responsive sizing utilities for different breakpoints

4. **Data Validation**: Add runtime validation for chart data before rendering
