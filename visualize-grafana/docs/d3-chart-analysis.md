# D3.js Chart Implementation Analysis

Analysis of the visualization-tool (visualize.admin.ch) d3.js chart implementations
to inform the creation of alternative charting library versions.

## Chart Types Overview

The visualization-tool supports the following chart types:

| Chart Type | File Location | D3 Features Used |
|------------|---------------|------------------|
| Column | `app/charts/column/` | scaleBand, scaleLinear, rect rendering |
| Bar (horizontal) | `app/charts/bar/` | scaleBand, scaleLinear, horizontal rect |
| Line | `app/charts/line/` | scaleTime/scaleLinear, d3-shape line() |
| Area | `app/charts/area/` | scaleTime/scaleLinear, d3-shape area() |
| Pie | `app/charts/pie/` | arc generator, pie layout |
| Scatterplot | `app/charts/scatterplot/` | scaleLinear x2, circle rendering |
| Map | `app/charts/map/` | deck.gl/maplibre-gl (not d3) |
| Table | `app/charts/table/` | React components (not d3) |
| Combo Line Single | `app/charts/combo/` | Combined line charts |
| Combo Line Dual | `app/charts/combo/` | Dual-axis line charts |
| Combo Line Column | `app/charts/combo/` | Mixed line and column |

## Architecture Pattern

### 1. State Management Pattern

Each chart type follows a consistent pattern:

```
[ChartType]/
  - [chartType]-state.tsx     # Chart state provider and context
  - [chartType]-state-props.tsx  # State variables and data hooks
  - [chartType].tsx           # Main rendering component
  - rendering-utils.ts        # D3 rendering functions
```

#### ChartState Interface

All charts extend a common `CommonChartState`:

```typescript
type CommonChartState = {
  chartType: ChartType;
  chartData: Observation[];
  allData: Observation[];
  bounds: Bounds;
  interactiveFiltersConfig: InteractiveFiltersConfig;
};
```

Chart-specific states add:
- Scale definitions (xScale, yScale)
- Getter functions (getX, getY, getSegment)
- Color scales
- Axis labels
- Rendering keys
- Tooltip/annotation info getters

### 2. Context Provider Pattern

Charts use React Context for state distribution:

```typescript
// From chart-state.ts
export const ChartContext = createContext<ChartState>(undefined);

export const useChartState = () => {
  const ctx = useContext(ChartContext);
  if (ctx === undefined) {
    throw Error("You need to wrap your component in <ChartContext.Provider />");
  }
  return ctx;
};
```

Chart providers wrap children with the context:

```typescript
const ColumnChartProvider = (props) => {
  const variables = useColumnsStateVariables(chartProps);
  const data = useColumnsStateData(chartProps, variables);
  const state = useColumnsState(chartProps, variables, data);

  return (
    <ChartContext.Provider value={state}>{children}</ChartContext.Provider>
  );
};
```

### 3. D3 Rendering Pattern

Charts use a consistent rendering pattern with refs and useEffect:

```typescript
export const Columns = () => {
  const { chartData, xScale, yScale, ... } = useChartState() as ColumnsState;
  const ref = useRef<SVGGElement>(null);
  const enableTransition = useTransitionStore((state) => state.enable);
  const transitionDuration = useTransitionStore((state) => state.duration);

  // Prepare render data with useMemo
  const columnsData = useMemo(() => {
    return chartData.map((d) => ({
      key: getRenderingKey(d),
      x: xScale(getX(d)),
      y: yScale(Math.max(getY(d), 0)),
      width: bandwidth,
      height: Math.abs(yScale(getY(d)) - yScale(0)),
      color: colors(key),
      observation: d,
    }));
  }, [dependencies]);

  // Render with useEffect
  useEffect(() => {
    if (ref.current) {
      renderContainer(ref.current, {
        id: "columns",
        transform: `translate(${margins.left} ${margins.top})`,
        transition: { enable: enableTransition, duration: transitionDuration },
        render: (g, opts) => renderColumns(g, columnsData, { ...opts, y0 }),
      });
    }
  }, [dependencies]);

  return <g ref={ref} />;
};
```

### 4. Render Container Utility

The `renderContainer` function handles enter/update/exit patterns:

```typescript
function renderContainer(g: SVGGElement, options: RenderContainerOptions) {
  const { id, transform, render, renderUpdate, transition } = options;

  return select(g)
    .selectAll(`#${id}`)
    .data([null])
    .join(
      (enter) => { /* create group, call render */ },
      (update) => { /* maybe transition, call renderUpdate or render */ },
      (exit) => { /* remove */ }
    );
}
```

### 5. Transition System

Transitions are managed through a global store:

```typescript
const enableTransition = useTransitionStore((state) => state.enable);
const transitionDuration = useTransitionStore((state) => state.duration);
```

The `maybeTransition` helper conditionally applies transitions:

```typescript
function maybeTransition<S, T>(g: S, options: MaybeTransitionOptions<S, T>) {
  const { transition, s, t } = options;
  return transition.enable
    ? (t ?? s)(g.transition().duration(transition.duration)).selection()
    : s(g);
}
```

## D3 Dependencies Used

From `package.json`:

```json
{
  "d3-array": "^3.2.4",      // Data manipulation
  "d3-axis": "^3.0.0",       // Axis generation
  "d3-brush": "^3.0.0",      // Selection brushing
  "d3-color": "^3.1.0",      // Color manipulation
  "d3-delaunay": "^6.0.4",   // Voronoi/Delaunay
  "d3-dsv": "^3.0.1",        // CSV/TSV parsing
  "d3-format": "^3.1.0",     // Number formatting
  "d3-geo": "^3.1.1",        // Geographic projections
  "d3-interpolate": "^3.0.1", // Value interpolation
  "d3-interpolate-path": "^2.3.0", // Path morphing
  "d3-scale": "^4.0.2",      // Scale functions
  "d3-scale-chromatic": "^3.1.0", // Color schemes
  "d3-selection": "^3.0.0",  // DOM selection
  "d3-shape": "^3.2.0",      // Shape generators
  "d3-time": "^3.1.0",       // Time utilities
  "d3-time-format": "^4.1.0", // Time formatting
  "d3-transition": "^3.0.1"   // Animations
}
```

## Key Interfaces for Chart Adapter

### RenderDatum Types

Each chart type defines its render datum interface:

```typescript
// Column/Bar
type RenderColumnDatum = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  focused?: boolean;
  observation: Observation;
};

// Line (uses d3-shape line generator)
// Returns SVG path string

// Pie
type RenderDatum = {
  key: string;
  value: number;
  arcDatum: PieArcDatum;
  color: string;
  segment: string;
};

// Scatterplot
type RenderDatum = {
  key: string;
  cx: number;
  cy: number;
  color: string;
};
```

### Scale Types Used

```typescript
// Band scales (categorical x-axis)
ScaleBand<string>  // Column, Bar

// Linear scales (numerical axes)
ScaleLinear<number, number>  // Y-axis for most charts

// Time scales
ScaleTime<number, number>  // Line, Area charts

// Ordinal scales (colors)
ScaleOrdinal<string, string>  // Color mapping
```

## Chart-Specific Features

### Column Chart
- Vertical bars with band scale
- Support for error whiskers (uncertainty visualization)
- Value labels on bars
- Animation on data change

### Bar Chart (horizontal)
- Horizontal orientation of column chart
- Similar features to column

### Line Chart
- Multi-series support (grouped by segment)
- Optional dots at data points
- Line interpolation
- Error whiskers

### Area Chart
- Stacked area support
- Uses d3-shape area generator
- Series from d3.stack()

### Pie Chart
- Arc generator for slices
- Value label connectors
- Hover interactions

### Scatterplot
- Circle rendering
- Size and color encoding
- Segment-based coloring

### Map
- Uses deck.gl/maplibre-gl (NOT d3)
- GeoJSON layer for areas
- Scatterplot layer for symbols
- WMS/WMTS tile support

### Table
- Pure React components (NOT d3)
- No migration needed

## Theming

Charts use `useChartTheme()` hook for styling:

```typescript
const { labelFontSize, fontFamily } = useChartTheme();
```

## Data Flow Summary

```
Observation[] (raw data)
    |
    v
useChartData() - filters, sorts, processes
    |
    v
ChartStateData { chartData, scalesData, allData, ... }
    |
    v
useXxxState() - creates scales, getters, computed values
    |
    v
ChartContext.Provider
    |
    v
Rendering Components (Columns, Bars, Lines, etc.)
    |
    v
renderContainer() + specific render functions
    |
    v
SVG elements with D3 enter/update/exit
```

## Migration Considerations

### What Can Be Reused
1. State management pattern (`useChartState()`)
2. Data processing (`useChartData()`, filtering, sorting)
3. Theme system (`useChartTheme()`)
4. Transition store (`useTransitionStore()`)
5. Tooltip/interaction systems
6. Bounds/margin calculations

### What Must Be Replaced
1. D3 selections and joins -> Library-specific rendering
2. D3 scale functions -> Library equivalents or keep d3-scale
3. D3 shape generators -> Library shape APIs
4. SVG rendering -> Library components

### Library-Specific Mapping

| D3 Feature | ECharts | Observable Plot | Plotly.js |
|------------|---------|-----------------|-----------|
| scaleBand | Built-in | Built-in | categoryarray |
| scaleLinear | Built-in | Built-in | Built-in |
| scaleTime | Built-in | Built-in | Built-in |
| line() | series.line | Plot.line | scatter+line |
| area() | series.area | Plot.area | scatter+fill |
| arc() | series.pie | Plot.arc | pie |
| selection | ReactECharts | React DOM | Plotly.react |
| transition | animation config | N/A | animate |

---

*Document created: 2025-12-25*
*For visualize-grafana charting library migration project*
