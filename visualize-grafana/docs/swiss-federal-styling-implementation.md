# Swiss Federal CI Styling Implementation for ECharts

## Overview

This document describes the implementation of Swiss Federal CI (Corporate Identity) styling for the ECharts-based chart components. The styling was implemented to ensure visual consistency with Swiss government design standards.

## Changes Made

### 1. Created Shared Theme File

**File:** `app/charts/shared/echarts-theme.ts`

This file centralizes all Swiss Federal CI styling constants for ECharts charts:

- **Color Palette (`SWISS_FEDERAL_CHART_COLORS`):** A 10-color palette optimized for data visualization while maintaining consistency with Swiss Federal Design System
- **Typography (`CHART_THEME`):**
  - Font family: Noto Sans with system font fallbacks
  - Font sizes: 12px for body, 16px for titles
  - Text color: Monochrome 800 (#1F2937)
- **Axis Styling:**
  - Axis line color: rgba(0, 0, 0, 0.54)
  - Grid line color: rgba(0, 0, 0, 0.08)
- **Spacing:**
  - Grid margins: left 60px, right 20px, top 60px, bottom 60px
- **Animation:**
  - Duration: 500ms
  - Easing: cubicOut

### 2. Updated SimpleEChartsChart Component

**File:** `app/charts/simple-echarts/SimpleEChartsChart.tsx`

All chart type builders now use the shared theme:
- `buildBarOption()` - Column and bar charts
- `buildLineOption()` - Line and area charts
- `buildPieOption()` - Pie charts
- `buildScatterOption()` - Scatter plots

Each builder applies consistent styling for:
- Global text styles (font family, size, color)
- Title styling
- Tooltip appearance (background, text)
- Legend text
- Grid spacing
- Axis labels and lines
- Animation settings

## Swiss Federal Design System Reference

The implementation follows the Swiss Federal CI guidelines as provided by:
- `@interactivethings/swiss-federal-ci` package (already integrated in project)
- Official Swiss Federal Design System documentation

### Color Palette

The primary colors used are:
1. Blue (#1D4ED8) - Primary
2. Red (#DC2626)
3. Green (#059669)
4. Orange (#D97706)
5. Purple (#7C3AED)
6. Teal (#0891B2)
7. Pink (#DB2777)
8. Gray (#4B5563)
9. Yellow (#FBBF24)
10. Brown (#78350F)

## Feature Parity Status

### Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| Chart Types (6) | Complete | Column, bar, line, area, pie, scatter |
| Tooltips | Complete | Styled with Swiss Federal theme |
| Legends | Complete | Interactive with theme styling |
| Segmentation/Grouping | Complete | Supports multiple series |
| Swiss Federal Styling | Complete | Consistent across all charts |
| Animation | Complete | 500ms cubicOut easing |
| Responsive Width | Complete | 100% width by default |

### Features in D3 Charts Not Yet in SimpleEChartsChart

These features exist in the D3 bridge adapters but not in the standalone SimpleEChartsChart:

| Feature | Status | Location |
|---------|--------|----------|
| Error Whiskers | In bridges | echarts-column-bridge.tsx |
| Dual-axis Support | In bridges | echarts-line-bridge.tsx |
| Time Brushing | Not implemented | Requires additional work |
| Value Labels | In bridges | echarts-column-bridge.tsx |
| Annotations | Not implemented | Requires additional work |
| Reference Lines | Not implemented | Requires additional work |

### ECharts Bridge Adapters

The bridge adapters (`app/charts/adapters/`) provide fuller feature parity:
- `echarts-column-bridge.tsx` - Column chart with full D3 state support
- `echarts-line-bridge.tsx` - Line chart with full D3 state support
- `echarts-pie-bridge.tsx` - Pie chart with full D3 state support

## TypeScript Errors Fixed

During this implementation, the following TypeScript errors were resolved:

1. **ECharts bridges:** Removed non-existent state properties (formatValue, showDots, showPercentages)
2. **DOT_SIZE_MAP:** Fixed case sensitivity (Small/Medium/Large vs small/medium/large)
3. **DatasetBrowser:** Fixed export issues by redirecting to chart-builder
4. **Button size:** Changed from "small" to "sm" for custom MUI theme
5. **ComponentId branded type:** Added proper type casts
6. **timeUnit check:** Changed direct access to "in" operator check
7. **Unused imports:** Cleaned up all unused variables and imports

## Usage

### SimpleEChartsChart

```tsx
import { SimpleEChartsChart } from "@/charts/simple-echarts";

<SimpleEChartsChart
  observations={data}
  xField="year"
  yField="value"
  segmentField="category"
  chartType="column"
  height={400}
  showLegend={true}
  showTooltip={true}
/>
```

### SimpleChartPreview (with controls)

```tsx
import { SimpleChartPreview } from "@/charts/simple-echarts";

<SimpleChartPreview
  observations={data}
  dimensions={dimensions}
  measures={measures}
  initialChartType="line"
  height={500}
  showControls={true}
/>
```

## Files Modified

1. `app/charts/shared/echarts-theme.ts` - Created
2. `app/charts/simple-echarts/SimpleEChartsChart.tsx` - Updated with theme
3. `app/charts/adapters/echarts-column-bridge.tsx` - Fixed TypeScript errors
4. `app/charts/adapters/echarts-line-bridge.tsx` - Fixed TypeScript errors
5. `app/charts/adapters/echarts-pie-bridge.tsx` - Fixed TypeScript errors
6. `app/pages/browse/*.tsx` - Redirected to chart-builder
7. `app/pages/chart-builder.tsx` - Fixed Button size props
8. `app/pages/test-echarts.tsx` - Fixed type errors
9. `app/charts/simple-echarts/SimpleChartPreview.tsx` - Fixed timeUnit check
