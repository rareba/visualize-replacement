# New ECharts Chart Types Implementation

This document describes the implementation of seven new chart types added to the visualization platform, all built using Apache ECharts.

## Overview

The following chart types were added:
1. **Donut** - A pie chart variant with a hollow center
2. **Radar** - Spider/web chart for comparing multiple variables
3. **Funnel** - Visualizes stages in a process with decreasing values
4. **Gauge** - Displays a single value within a range (speedometer style)
5. **Treemap** - Hierarchical data shown as nested rectangles
6. **Sunburst** - Hierarchical data shown as concentric rings
7. **Heatmap** - Values displayed as colored cells in a grid

## Architecture

### Config Types (app/config-types.ts)

Each chart type has a corresponding TypeScript configuration type:

```typescript
// Donut - similar to Pie but with innerRadius
export type DonutConfig = ChartConfigBase<"donut", DonutFields>;

// Radar - uses segment color and y-axis measure
export type RadarConfig = ChartConfigBase<"radar", RadarFields>;

// Funnel - uses segment color and y-axis measure
export type FunnelConfig = ChartConfigBase<"funnel", FunnelFields>;

// Gauge - displays a single value
export type GaugeConfig = ChartConfigBase<"gauge", GaugeFields>;

// Treemap - hierarchical with segment dimension
export type TreemapConfig = ChartConfigBase<"treemap", TreemapFields>;

// Sunburst - hierarchical with segment dimension
export type SunburstConfig = ChartConfigBase<"sunburst", SunburstFields>;

// Heatmap - uses x, y axes and sequential/diverging color
export type HeatmapConfig = ChartConfigBase<"heatmap", HeatmapFields>;
```

### Field Structures

#### Donut Fields
```typescript
type DonutFields = {
  y: GenericField;
  segment: GenericSegmentField;
  color: SegmentColorField;
};
```

#### Radar Fields
```typescript
type RadarFields = {
  y: GenericField;
  segment: GenericSegmentField;
  color: SegmentColorField | SingleColorField;
};
```

#### Funnel Fields
```typescript
type FunnelFields = {
  y: GenericField;
  segment: GenericSegmentField;
  color: SegmentColorField;
  animation: AnimationField;
};
```

#### Gauge Fields
```typescript
type GaugeFields = {
  y: GenericField;
};
```

#### Treemap Fields
```typescript
type TreemapFields = {
  y: GenericField;
  segment: GenericSegmentField;
  color: SegmentColorField | SingleColorField;
};
```

#### Sunburst Fields
```typescript
type SunburstFields = {
  y: GenericField;
  segment: GenericSegmentField;
  color: SegmentColorField;
};
```

#### Heatmap Fields
```typescript
type HeatmapFields = {
  x: GenericField;
  y: GenericField;
  color: SequentialColorField | DivergingColorField;
};
```

### ECharts Adapters

Each chart type has an adapter that transforms the configuration into ECharts options:

| Chart Type | Adapter File | Location |
|------------|--------------|----------|
| Donut | donut-adapter.ts | app/charts/echarts/adapters/ |
| Radar | radar-adapter.ts | app/charts/echarts/adapters/ |
| Funnel | funnel-adapter.ts | app/charts/echarts/adapters/ |
| Gauge | gauge-adapter.ts | app/charts/echarts/adapters/ |
| Treemap | treemap-adapter.ts | app/charts/echarts/adapters/ |
| Sunburst | sunburst-adapter.ts | app/charts/echarts/adapters/ |
| Heatmap | heatmap-adapter.ts | app/charts/echarts/adapters/ |

### Adapter Pattern

Each adapter follows a consistent pattern:

```typescript
export const ChartTypeChartAdapter: EChartsAdapter<ChartTypeConfig> = {
  chartType: "chartType",

  getOption(chartConfig, observations, dimensions, measures) {
    // Transform data and config into ECharts option
    return {
      // ECharts option object
    };
  },

  getDatasetId(chartConfig) {
    // Return unique identifier for caching
  }
};
```

## Chart Type Details

### Donut Chart

A pie chart with a configurable inner radius creating a "donut" shape.

**Use Cases:**
- Showing parts of a whole with emphasis on the segments
- Displaying KPIs in the center hole
- Multiple concentric rings for comparison

**Key Configuration:**
- `innerRadius`: Controls the size of the center hole (default: 50%)
- Supports segment coloring with palette customization

### Radar Chart

A spider/web chart displaying multivariate data on axes starting from the center.

**Use Cases:**
- Comparing multiple variables for a single entity
- Showing skill profiles or performance metrics
- Displaying survey results across dimensions

**Key Configuration:**
- Each axis represents a different variable
- Can show multiple data series for comparison
- Supports area fill and line styling

### Funnel Chart

Displays stages in a process where values typically decrease from top to bottom.

**Use Cases:**
- Sales pipeline visualization
- Conversion rate analysis
- Process flow with attrition

**Key Configuration:**
- Segments ordered by value (largest to smallest)
- Supports both ascending and descending orientation
- Label positioning inside or outside segments

### Gauge Chart

A speedometer-style chart showing a single value within a defined range.

**Use Cases:**
- KPI dashboards
- Progress indicators
- Performance metrics with targets

**Key Configuration:**
- Min/max range values
- Color bands for different value ranges
- Customizable pointer and tick marks

### Treemap Chart

Hierarchical data represented as nested rectangles proportional to values.

**Use Cases:**
- File system visualization
- Budget allocation breakdown
- Market share analysis

**Key Configuration:**
- Rectangle sizing based on measure values
- Color by category or value
- Drill-down navigation support

### Sunburst Chart

Hierarchical data shown as concentric rings expanding outward from center.

**Use Cases:**
- Organizational structure
- Category breakdown
- Sequence analysis

**Key Configuration:**
- Ring levels represent hierarchy depth
- Segment angle proportional to values
- Interactive drill-down support

### Heatmap Chart

Values displayed as colored cells in a two-dimensional grid.

**Use Cases:**
- Correlation matrices
- Time-based activity patterns
- Geographic density analysis

**Key Configuration:**
- X and Y axes define the grid
- Color scale (sequential or diverging)
- Cell labels for exact values

## Color Types

### Standard Color Fields (Most Charts)
- `SegmentColorField`: Colors based on categorical segments
- `SingleColorField`: Uniform color for all data

### Heatmap-Specific Color Fields
- `SequentialColorField`: Single-hue gradient for continuous values
- `DivergingColorField`: Two-hue gradient with midpoint for deviation data

## Integration Points

### Chart Type Selector (chart-type-selector.tsx)

The chart type selector UI was updated to display new chart types in a compact grid layout grouped by category:
- Basic: Column, Bar, Line, Area
- Distribution: Pie, Donut, Scatterplot
- Specialized: Radar, Funnel, Gauge
- Hierarchical: Treemap, Sunburst
- Grid: Table, Heatmap
- Geographic: Map
- Combined: ComboLineSingle, ComboLineDual, ComboLineColumn

### Chart Adjusters (charts/index.ts)

Each chart type has:
1. **Initial config function**: Creates default configuration
2. **Adjuster function**: Transforms config when switching between chart types
3. **Symbol function**: Returns the icon for the chart type

### Files Modified

1. `app/config-types.ts` - Type definitions for new charts
2. `app/charts/index.ts` - Chart adjusters and initial configs
3. `app/charts/chart-config-ui-options.ts` - UI field specifications
4. `app/components/chart-with-filters.tsx` - Chart rendering switch
5. `app/config-utils.ts` - Config utility functions
6. `app/configurator/components/chart-type-selector.tsx` - UI for chart selection
7. `app/icons/components/` - SVG icons for new chart types
8. `app/charts/echarts/adapters/` - ECharts adapter implementations

## Testing

To test the new chart types:

1. Run the development server:
   ```bash
   yarn dev
   ```

2. Navigate to a dataset and create a new chart

3. Select one of the new chart types from the chart type selector

4. Configure the chart fields (dimensions, measures, colors)

5. Verify the chart renders correctly with the ECharts engine

## Known Limitations

1. **Fallback Rendering**: New chart types currently use the Pie visualization component as a fallback. Dedicated visualization components should be created for production use.

2. **Animation Field**: Only Donut and Funnel charts support the animation field for time-based playback.

3. **Heatmap Colors**: Heatmap uses sequential/diverging color scales which are incompatible with the standard segment/single color types used by other charts.

4. **Map Integration**: None of the new chart types support the map overlay features.

## Future Improvements

1. Create dedicated visualization components for each new chart type
2. Add comprehensive unit tests for each adapter
3. Implement full interactive filter support
4. Add export capabilities (PNG, SVG, CSV)
5. Performance optimization for large datasets
6. Accessibility improvements for screen readers

## Related Documentation

- [ECharts Migration](./echarts-migration.md)
- [ECharts Adapter Refactoring](./echarts-adapter-refactoring.md)
- [ECharts Testing Report](./echarts-testing-report.md)
