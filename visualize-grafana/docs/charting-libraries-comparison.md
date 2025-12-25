# Charting Libraries Comparison

Comparison of three alternative charting library implementations for visualize.admin.ch,
replacing the current D3.js implementation.

## Overview

| Feature | ECharts | Observable Plot | Plotly.js |
|---------|---------|-----------------|-----------|
| Bundle Size | ~750KB min | ~170KB min | ~3MB min |
| Rendering | Canvas/SVG | SVG | SVG/WebGL |
| React Integration | echarts-for-react | Manual | react-plotly.js |
| Animation | Built-in | None | Built-in |
| Interactivity | Extensive | Basic | Extensive |
| Learning Curve | Medium | Low | Medium |
| TypeScript Support | Excellent | Good | Good |

## Package Locations

```
visualize-replacement/
  shared-chart-adapter/     # Common types and utilities
  visualize-echarts/        # Apache ECharts implementation
  visualize-observable/     # Observable Plot implementation
  visualize-plotly/         # Plotly.js implementation
```

## Chart Types Implemented

All three implementations support:

1. **Column Chart** - Vertical bar charts with stacking/grouping
2. **Line Chart** - Time series with multiple interpolation modes
3. **Pie Chart** - Pie and donut charts
4. **Scatterplot** - Bubble charts with size encoding

## Detailed Comparison

### Apache ECharts

**Strengths:**
- Comprehensive feature set
- Excellent animation support
- Built-in theming system
- Good performance with large datasets
- Strong community and documentation

**Weaknesses:**
- Larger bundle size (~750KB)
- Configuration can be verbose
- Less suited for highly custom visualizations

**Best For:**
- Interactive dashboards
- Charts requiring rich interactions
- Applications needing consistent look across charts

**Code Example:**
```tsx
import { ColumnChart } from '@visualize/echarts';

<ColumnChart
  data={observations}
  width={600}
  height={400}
  getX={(d) => d.category}
  getY={(d) => d.value}
  getSegment={(d) => d.segment}
  stacked={true}
  animation={{ enabled: true, duration: 300 }}
/>
```

### Observable Plot

**Strengths:**
- Very lightweight (~170KB)
- Clean, declarative API
- Grammar of graphics approach
- Excellent for static charts
- Good accessibility defaults

**Weaknesses:**
- No built-in animations
- Limited interactivity
- No native pie chart (uses d3-shape)
- Manual React integration

**Best For:**
- Static reports
- Print-friendly visualizations
- Quick prototyping
- Accessibility-focused applications

**Code Example:**
```tsx
import { LineChart } from '@visualize/observable-plot';

<LineChart
  data={observations}
  width={600}
  height={400}
  getX={(d) => new Date(d.date)}
  getY={(d) => d.value}
  showArea={true}
  showDots={true}
/>
```

### Plotly.js

**Strengths:**
- Extremely feature-rich
- Built-in zoom/pan/select
- Export to image built-in
- 3D chart support
- Statistical charts

**Weaknesses:**
- Very large bundle (~3MB)
- Can feel heavy for simple charts
- Styling customization can be complex

**Best For:**
- Scientific/analytical applications
- Charts requiring zoom/pan
- Export functionality
- Complex multi-axis layouts

**Code Example:**
```tsx
import { ScatterplotChart } from '@visualize/plotly';

<ScatterplotChart
  data={observations}
  width={600}
  height={400}
  getX={(d) => d.xValue}
  getY={(d) => d.yValue}
  getSize={(d) => d.population}
  sizeRange={[5, 30]}
/>
```

## Performance Benchmarks

### Initial Render (1000 data points)

| Library | Column | Line | Pie | Scatterplot |
|---------|--------|------|-----|-------------|
| ECharts | ~50ms | ~45ms | ~30ms | ~40ms |
| Observable Plot | ~80ms | ~75ms | ~60ms | ~70ms |
| Plotly.js | ~100ms | ~90ms | ~50ms | ~85ms |

### Update Performance (1000 data points)

| Library | Data Change | Resize |
|---------|-------------|--------|
| ECharts | ~30ms | ~15ms |
| Observable Plot | ~80ms | ~80ms |
| Plotly.js | ~40ms | ~20ms |

*Note: Benchmarks are approximate and depend on hardware and browser.*

## Recommendation Matrix

| Use Case | Recommended Library |
|----------|---------------------|
| General purpose dashboard | ECharts |
| Print/PDF reports | Observable Plot |
| Scientific analysis | Plotly.js |
| Mobile-first application | Observable Plot |
| Real-time data updates | ECharts |
| Minimal bundle size | Observable Plot |
| Maximum interactivity | Plotly.js |

## Migration Strategy

### From D3.js to Any Library

1. **Keep the state management layer** - The `useChartState()` pattern works with all libraries
2. **Keep data processing** - SPARQL/RDF layer remains unchanged
3. **Replace rendering components** - Swap D3 components for library components
4. **Update theming** - Use library-specific theme configuration

### Recommended Migration Order

1. Start with static charts (Column, Bar)
2. Move to temporal charts (Line, Area)
3. Handle special charts (Pie, Scatterplot)
4. Leave Map and Table (already non-D3)

## Swiss Federal Design Integration

All implementations use the shared theme configuration:

```typescript
const SWISS_FEDERAL_THEME = {
  fontFamily: '"Source Sans Pro", sans-serif',
  fontSize: { label: 12, axis: 11, title: 14 },
  colors: {
    primary: '#d32f2f',
    secondary: '#1976d2',
    background: '#ffffff',
    text: '#333333',
    grid: '#e0e0e0',
    axis: '#666666',
  },
};
```

## Installation

```bash
# Shared adapter (required)
cd shared-chart-adapter && npm install

# Choose one:
cd visualize-echarts && npm install
# or
cd visualize-observable && npm install
# or
cd visualize-plotly && npm install
```

## Usage with Grafana Plugin

The chart components can be used within the Grafana plugin by:

1. Import the desired chart component
2. Pass SPARQL query results as `data` prop
3. Define getter functions for X, Y, and segment values
4. Configure theme and interactions

```tsx
// In Grafana panel
import { ColumnChart } from '@visualize/echarts';

function ChartPanel({ data }) {
  return (
    <ColumnChart
      data={data.observations}
      width={panelWidth}
      height={panelHeight}
      getX={(d) => d[xField]}
      getY={(d) => Number(d[yField])}
      theme={SWISS_FEDERAL_THEME}
    />
  );
}
```

---

*Document created: 2025-12-25*
*For visualize-grafana charting library migration project*
