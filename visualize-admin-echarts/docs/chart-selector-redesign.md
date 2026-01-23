# Chart Selector Redesign and ECharts Implementation

## Overview

This document describes the implementation of the new chart selector design and the completion of ECharts chart implementations for all chart types.

## Changes Made

### 1. Chart Enablement Logic Updates

**File:** `app/charts/index.ts`

Added new chart types to the enablement arrays:

```typescript
// Charts that require at least one categorical dimension + numerical measure
const categoricalEnabledChartTypes: RegularChartType[] = [
  "column", "bar", "pie", "donut", "funnel",
  "treemap", "sunburst", "radar", "gauge",
  "boxplot", "waterfall", "polar", "wordcloud",
];

// Charts that require at least two numerical measures
const multipleNumericalMeasuresEnabledChartTypes: RegularChartType[] = [
  "scatterplot", "radar",
];

// Charts that require both categorical and temporal dimensions (for matrix display)
const matrixEnabledChartTypes: RegularChartType[] = [
  "heatmap",
];

// Charts that require two categorical dimensions for flow visualization
const flowEnabledChartTypes: RegularChartType[] = [
  "sankey",
];
```

Added new enablement logic for:
- Heatmap: Requires two dimensions (categorical or temporal) to create a matrix visualization
- Sankey: Requires two categorical dimensions for source/target flow

### 2. Chart Type Selector Redesign

**File:** `app/configurator/components/chart-type-selector.tsx`

Redesigned the chart selector from an accordion-based design to a more visual, card-based interface:

#### Features:
- **Category Chips**: Horizontal chip-based category selection at the top
- **Visual Card Grid**: Large, visually appealing cards with:
  - 32px icons for each chart type
  - Chart type labels below the icon
  - Hover effects with slight elevation
  - Clear selected/enabled/disabled states
- **Tooltips**: Descriptive tooltips explaining each chart type
- **Blue Dot Indicator**: Shows which category contains the currently selected chart

#### Chart Type Categories:
1. **Basic**: Column, Bar, Line, Area, Scatterplot
2. **Part of Whole**: Pie, Donut, Funnel, Waterfall
3. **Hierarchical**: Treemap, Sunburst
4. **Statistical**: Boxplot, Heatmap
5. **Flow**: Sankey
6. **Specialized**: Radar, Gauge, Polar, Wordcloud, Map, Table
7. **Comparison**: Combo Line Single, Combo Line Dual, Combo Line Column

### 3. ECharts Adapters

All ECharts adapters are implemented in `app/charts/echarts/adapters/`:

| Chart Type | Adapter File | Status |
|------------|--------------|--------|
| Column | column-adapter.tsx | Complete |
| Bar | bar-adapter.tsx | Complete |
| Line | line-adapter.tsx | Complete |
| Area | area-adapter.tsx | Complete |
| Pie | pie-adapter.tsx | Complete |
| Scatterplot | scatterplot-adapter.tsx | Complete |
| Donut | donut-adapter.tsx | Complete |
| Radar | radar-adapter.tsx | Complete |
| Funnel | funnel-adapter.tsx | Complete |
| Gauge | gauge-adapter.tsx | Complete |
| Treemap | treemap-adapter.tsx | Complete |
| Sunburst | sunburst-adapter.tsx | Complete |
| Heatmap | heatmap-adapter.tsx | Complete |
| Boxplot | boxplot-adapter.tsx | Complete |
| Waterfall | waterfall-adapter.tsx | Complete |
| Sankey | sankey-adapter.tsx | Complete |
| Polar | polar-adapter.tsx | Complete |
| Wordcloud | wordcloud-adapter.tsx | Complete |
| Combo Line Single | combo-line-single-adapter.tsx | Complete |
| Combo Line Dual | combo-line-dual-adapter.tsx | Complete |
| Combo Line Column | combo-line-column-adapter.tsx | Complete |

### 4. Translations

Added translations for all new chart types and categories in all four languages:

**English (en)**:
- Chart Types: Donut, Radar, Funnel, Gauge, Treemap, Sunburst, Heatmap, Boxplot, Waterfall, Sankey, Polar, Wordcloud
- Categories: Basic, Part of Whole, Hierarchical, Statistical, Flow, Specialized, Comparison

**German (de)**:
- Chart Types: Ringdiagramm, Radar, Trichter, Messanzeige, Baumdiagramm, Sunburst, Heatmap, Boxplot, Wasserfall, Sankey, Polar, Wortwolke
- Categories: Basis, Anteile, Hierarchisch, Statistisch, Fluss, Spezialisiert, Vergleich

**French (fr)**:
- Chart Types: Anneau, Radar, Entonnoir, Jauge, Treemap, Sunburst, Carte thermique, Boite a moustaches, Cascade, Sankey, Polaire, Nuage de mots
- Categories: Basique, Proportions, Hierarchique, Statistique, Flux, Specialise, Comparaison

**Italian (it)**:
- Chart Types: Ciambella, Radar, Imbuto, Indicatore, Treemap, Sunburst, Mappa di calore, Box Plot, Cascata, Sankey, Polare, Nuvola di parole
- Categories: Base, Proporzioni, Gerarchico, Statistico, Flusso, Specializzato, Confronto

### 5. Config Types

Added new chart configuration types in `app/config-types.ts`:

```typescript
// Boxplot Config (statistical distribution)
const BoxplotConfig = t.intersection([
  GenericChartConfig,
  t.type({ chartType: t.literal("boxplot"), fields: BoxplotFields }, "BoxplotConfig"),
]);

// Waterfall Config (cumulative effect)
const WaterfallConfig = t.intersection([
  GenericChartConfig,
  t.type({ chartType: t.literal("waterfall"), fields: WaterfallFields }, "WaterfallConfig"),
]);

// Sankey Config (flow diagram)
const SankeyConfig = t.intersection([
  GenericChartConfig,
  t.type({ chartType: t.literal("sankey"), fields: SankeyFields }, "SankeyConfig"),
]);

// Polar Config (radial bar/line)
const PolarConfig = t.intersection([
  GenericChartConfig,
  t.type({ chartType: t.literal("polar"), fields: PolarFields }, "PolarConfig"),
]);

// Wordcloud Config
const WordcloudConfig = t.intersection([
  GenericChartConfig,
  t.type({ chartType: t.literal("wordcloud"), fields: WordcloudFields }, "WordcloudConfig"),
]);
```

## Chart Type Descriptions

Each chart type now has a descriptive tooltip:

| Chart Type | Description |
|------------|-------------|
| Column | Compare values across categories vertically |
| Bar | Compare values across categories horizontally |
| Line | Show trends over time with connected points |
| Area | Display trends with filled areas below lines |
| Scatterplot | Show relationships between two measures |
| Pie | Show proportions of a whole as slices |
| Donut | Proportions with a hollow center |
| Table | Display data in rows and columns |
| Map | Visualize geographical data on a map |
| Radar | Compare multiple variables on radial axes |
| Funnel | Show progression through stages |
| Gauge | Display a single value on a dial |
| Treemap | Show hierarchical data as nested rectangles |
| Sunburst | Display hierarchy in concentric rings |
| Heatmap | Show values using color intensity in a grid |
| Boxplot | Show statistical distribution with quartiles |
| Waterfall | Show cumulative effect of sequential values |
| Sankey | Visualize flow between categories |
| Polar | Display data in circular coordinate system |
| Wordcloud | Show text frequency with varying sizes |
| Combo Line Single | Multiple lines with same scale |
| Combo Line Dual | Lines with dual Y-axes for different units |
| Combo Line Column | Combine lines and columns |

## User Experience Improvements

1. **Easier Discovery**: Visual cards make it easier to browse and discover chart types
2. **Better Feedback**: Clear visual states for enabled/disabled/selected charts
3. **Informative Tooltips**: Users can understand what each chart does before selecting
4. **Category Organization**: Logical grouping helps users find the right chart type
5. **Responsive Grid**: Cards automatically adapt to available width
6. **Expanded Chart Selection**: More chart types available for diverse visualization needs

## Technical Notes

- The chart selector uses MUI components (Box, ButtonBase, Paper, Chip, Tooltip)
- Icons are from the existing icon system (`@/icons`)
- Colors follow the Swiss Federal theme
- Transitions are smooth (0.15s ease-in-out)
- Disabled charts show pointer cursor to indicate they can still show tooltips
- New chart types use placeholder icons from similar existing charts

## Recent Updates (January 2026)

### Chart Selector Translation Fix
Fixed issue where category labels were showing translation keys instead of translated text:
- Added `getFieldLabel` switch cases for all category labels in `field-i18n.ts`
- Added `defineMessage` entries for new chart types (boxplot, waterfall, sankey, polar, wordcloud)
- Added `defineMessage` entries for new categories (statistical, flow)

### Chart Type Adjusters
Added chart config adjusters in `config-adjusters.ts` for:
- BoxplotAdjusters
- WaterfallAdjusters
- SankeyAdjusters
- PolarAdjusters
- WordcloudAdjusters

### Chart Path Overrides
Added path overrides in `charts/index.ts` for new chart types to enable smooth switching between chart types.

### Chart Registry System (NEW)

Created a centralized chart registry (`app/charts/chart-registry.ts`) that makes adding new charts very easy:

```typescript
// To add a new chart, just add an entry to CHART_REGISTRY:
export const CHART_REGISTRY: Record<ChartType, ChartMetadata> = {
  myNewChart: {
    type: "myNewChart",
    enabled: true,  // Set to false to disable
    category: "basic",
    order: 6,
    symbol: "square",
    labelKey: "chart.myNewChart.title",
    descriptionKey: "chart.myNewChart.description",
    iconName: "myNewChartIcon",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  // ... other charts
};
```

**Helper functions provided:**
- `getEnabledChartTypesFromRegistry()` - Get all enabled chart types
- `getAllChartTypes()` - Get all chart types (including disabled)
- `getRegularChartTypes()` - Get non-combo chart types
- `getComboChartTypes()` - Get combo chart types
- `getChartTypesByCategory(category)` - Get charts in a specific category
- `getChartMetadata(chartType)` - Get metadata for a chart
- `isChartEnabled(chartType)` - Check if chart is enabled
- `isEChartsChart(chartType)` - Check if chart uses ECharts

### Chart Rendering Fix

Added missing chart types to `chart-with-filters.tsx` switch statement:
- **Pie-like charts** (polar, wordcloud): Use PieVisualization as fallback
- **Column-like charts** (heatmap, boxplot, waterfall, sankey): Use ColumnsVisualization as fallback

This fixes the crash that occurred when selecting new chart types.

### Disabled Chart Click Handling Fix (January 2026)

Fixed a critical bug where clicking on disabled chart type cards caused runtime errors.

**Problem:**
- Clicking on a disabled chart type (e.g., "Columns" when dataset has no numerical measures) caused:
  - "This should be unreachable! but got undefined" error
  - "Cannot read properties of undefined (reading 'id')" error
- Root cause: Two issues combined:
  1. `value` attribute on ButtonBase with `component={Paper}` doesn't reliably pass the value
  2. `pointerEvents: "auto"` on disabled state (needed for Tooltip) allowed click events through

**Solution:**
1. Changed from `value={chartType}` to `data-chart-type={chartType}` for reliable attribute access
2. Added guard in `handleClick` to check for undefined chartType
3. Added `handleCardClick` wrapper in `ChartTypeCard` that prevents click processing on disabled cards

**Code Changes:**
```typescript
// In handleClick:
const newChartType = e.currentTarget.dataset.chartType as ChartType | undefined;
if (!newChartType) {
  return;
}

// In ChartTypeCard:
const handleCardClick = useCallback(
  (e: SyntheticEvent<HTMLButtonElement, Event>) => {
    if (!enabled) {
      e.preventDefault();
      return;
    }
    onClick(e);
  },
  [enabled, onClick]
);
```

**Files Modified:**
- `app/configurator/components/chart-type-selector.tsx`
