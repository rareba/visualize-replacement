# Developer Guide: visualize-admin-echarts

This guide explains how to develop the visualize-admin-echarts application and documents the key architectural changes compared to the original [visualize-admin](https://github.com/visualize-admin/visualization-tool) project.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Key Changes from Original](#key-changes-from-original)
4. [Universal Adapter Pattern](#universal-adapter-pattern)
5. [Adding a New Chart Type](#adding-a-new-chart-type)
6. [Directory Structure](#directory-structure)
7. [Configuration Types](#configuration-types)
8. [Testing](#testing)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn (npm is not supported due to workspace configuration)
- Docker (for PostgreSQL database)
- Git

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd visualize-replacement/visualize-admin-echarts

# Install dependencies
yarn install

# Start PostgreSQL database
docker-compose up -d

# Run database migrations
yarn db:migrate:dev

# Compile locales
yarn locales:compile

# Start development server
yarn dev
```

The application will be available at `http://localhost:3001`.

### Common Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn dev:ssl` | Start with HTTPS (for auth flows) |
| `yarn build` | Production build |
| `yarn typecheck` | Run TypeScript type checking |
| `yarn lint` | Run ESLint |
| `yarn test` | Run unit tests with Vitest |
| `yarn test:watch` | Run tests in watch mode |
| `yarn e2e:dev` | Run Playwright E2E tests |
| `yarn graphql:codegen` | Generate GraphQL types |
| `yarn locales:extract` | Extract translation strings |

---

## Architecture Overview

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 14 |
| Language | TypeScript |
| Chart Library | **ECharts** (replaces D3.js for rendering) |
| State Management | React Context + Reducers |
| Data Layer | GraphQL with URQL |
| Database | PostgreSQL with Prisma ORM |
| Styling | Material-UI (MUI) |
| Testing | Vitest + Playwright |

### High-Level Flow

```
User selects chart type in Configurator
    ↓
ChartConfig is created/updated
    ↓
UniversalEChartsChart receives config
    ↓
ChartDataWrapper fetches data via GraphQL
    ↓
UniversalChartProvider creates UniversalChartState
    ↓
Chart adapter transforms state → EChartsOption
    ↓
EChartsWrapper renders the chart
```

---

## Key Changes from Original

### 1. Chart Rendering: D3.js → ECharts

**Original (visualize-admin):**
- Used D3.js for all chart rendering
- Each chart had complex SVG manipulation code
- Required manual handling of scales, axes, animations
- 300-500+ lines per chart type

**New (visualize-admin-echarts):**
- Uses Apache ECharts for chart rendering
- Charts are declarative (JSON configuration)
- ECharts handles scales, axes, animations automatically
- 50-150 lines per chart adapter

### 2. State Management: Chart-Specific → Universal

**Original:**
```typescript
// Each chart had its own state provider
<ColumnChartProvider data={data}>
  <ColumnChartContainer />
</ColumnChartProvider>
```

**New:**
```typescript
// Single universal provider for all charts
<UniversalChartProvider chartConfig={config} observations={data}>
  <UniversalChartRenderer />
</UniversalChartProvider>
```

### 3. Chart Registration: Manual → Auto-Registration

**Original:**
- Charts were manually imported and wired up
- Required changes in multiple files to add a chart

**New:**
- Adapters self-register when imported
- Single import statement enables a chart
- Registry pattern for discovery

### 4. New Chart Types Added

| Category | New Charts |
|----------|------------|
| 3D Charts | bar3d, scatter3d, line3d, surface, globe, pie3d |
| Statistical | boxplot, heatmap |
| Flow | sankey |
| Specialized | wordcloud, polar |

### 5. Code Reduction Summary

| Chart Type | Original LOC | New LOC | Reduction |
|------------|-------------|---------|-----------|
| Pie | ~300 | 80 | 73% |
| Column | ~400 | 150 | 62% |
| Bar | ~400 | 150 | 62% |
| Line | ~350 | 120 | 66% |
| Area | ~350 | 120 | 66% |

---

## Universal Adapter Pattern

### Core Concept

Every ECharts-based chart is a **pure function** that transforms `UniversalChartState` into `EChartsOption`:

```typescript
type ChartAdapter = (state: UniversalChartState) => EChartsOption;
```

### UniversalChartState Interface

All adapters receive the same state structure:

```typescript
interface UniversalChartState {
  // Chart identification
  chartType: ChartType;
  chartConfig: ChartConfig;

  // Raw data
  observations: Observation[];

  // Data structure metadata
  dimensions: Dimension[];
  measures: Measure[];

  // Field extraction functions
  fields: {
    getX: (obs: Observation) => string | number;
    getY: (obs: Observation) => number;
    getSegment?: (obs: Observation) => string;
    // ... other field accessors
  };

  // Color management
  colors: {
    getColor: (segment: string) => string;
    colorDomain: string[];
  };

  // Layout
  bounds: { width: number; height: number; margins: Margins };

  // Derived data
  segments: string[];
  categories: string[];

  // Display options
  options: {
    showValues: boolean;
    showLegend: boolean;
    // ... other options
  };
}
```

### Adapter Registration

Adapters register themselves when imported:

```typescript
// In pie-universal-adapter.ts
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";

const pieUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  // Transform state to ECharts option
  return { /* ... */ };
};

// Self-registration
registerChartAdapter("pie", pieUniversalAdapter);
```

### Rendering Flow

```
UniversalEChartsChart
  └─→ ChartDataWrapper (fetches data)
      └─→ UniversalChartProvider (creates state)
          └─→ UniversalChartRenderer
              └─→ getChartAdapter(chartType)
              └─→ adapter(state) → EChartsOption
              └─→ EChartsWrapper (renders ECharts)
```

---

## Adding a New Chart Type

### Step 1: Create the Adapter (~100 lines)

Create `app/charts/echarts/universal-adapters/mychart-universal-adapter.ts`:

```typescript
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";
import type { EChartsOption } from "echarts";

export const myChartUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, bounds } = state;
  const { getX, getY, getSegment } = fields;

  // Transform data for ECharts
  const seriesData = observations.map((obs) => ({
    name: getX(obs),
    value: getY(obs),
  }));

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      trigger: "item",
    },
    series: [
      {
        type: "myChartType", // ECharts series type
        data: seriesData,
        // ... other series config
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("mychart", myChartUniversalAdapter);
```

### Step 2: Import in Index

Add to `app/charts/echarts/universal-adapters/index.ts`:

```typescript
import "./mychart-universal-adapter";
export { myChartUniversalAdapter } from "./mychart-universal-adapter";
```

### Step 3: Register in Chart Registry

Add to `app/charts/chart-registry.ts`:

```typescript
export const CHART_REGISTRY: Record<ChartType, ChartMetadata> = {
  // ... existing charts
  mychart: {
    type: "mychart",
    enabled: true,
    category: "basic",
    order: 10,
    symbol: "square",
    labelKey: "controls.chart.type.mychart",
    descriptionKey: "controls.chart.type.mychart.description",
    iconName: "mychart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    usesECharts: true,
  },
};
```

### Step 4: Add Configuration Type

Add to `app/config-types.ts`:

```typescript
// Field configuration
export const MyChartFields = t.type({
  x: t.intersection([GenericField, SortingField]),
  y: GenericField,
  color: t.union([SegmentColorField, SingleColorField]),
});

// Chart configuration
export const MyChartConfig = t.intersection([
  GenericChartConfig,
  t.type({
    chartType: t.literal("mychart"),
    fields: MyChartFields,
  }),
]);

// Add to ChartConfig union
export const ChartConfig = t.union([
  // ... existing configs
  MyChartConfig,
]);
```

### Step 5: Add Icon (optional)

Add icon to `app/icons/index.tsx` if needed.

### Step 6: Add Translations

Add to locale files (`app/locales/*/messages.po`):

```po
msgid "controls.chart.type.mychart"
msgstr "My Chart"

msgid "controls.chart.type.mychart.description"
msgstr "Description of my chart type"
```

**That's it!** Your new chart type is now available in the configurator.

---

## Directory Structure

```
app/
├── charts/
│   ├── core/                          # Universal adapter architecture
│   │   ├── chart-adapter-registry.ts  # Adapter registration
│   │   ├── universal-chart-provider.tsx # Context provider
│   │   ├── universal-chart-state.ts   # State interface
│   │   ├── field-accessor-factory.ts  # Field extraction
│   │   └── color-scale-factory.ts     # Color mapping
│   │
│   ├── echarts/
│   │   ├── universal-adapters/        # All chart adapters (26 files)
│   │   │   ├── pie-universal-adapter.ts
│   │   │   ├── column-universal-adapter.ts
│   │   │   ├── bar3d-universal-adapter.ts
│   │   │   └── ...
│   │   ├── EChartsWrapper.tsx         # ECharts React wrapper
│   │   ├── theme.ts                   # Swiss Federal theme
│   │   ├── adapter-utils.ts           # Shared utilities
│   │   └── series-builders.ts         # Series construction
│   │
│   ├── shared/                        # Shared chart utilities
│   ├── chart-registry.ts              # Chart metadata registry
│   ├── chart-data-wrapper.tsx         # Data fetching
│   ├── UniversalEChartsChart.tsx      # Main entry component
│   └── index.ts                       # Public exports
│
├── config-types.ts                    # All configuration types
├── configurator/                      # Chart configuration UI
├── components/                        # Reusable UI components
├── graphql/                           # GraphQL layer
└── pages/                             # Next.js pages
```

---

## Configuration Types

### Chart Type Union

```typescript
export type ChartType =
  // Basic
  | "column" | "bar" | "line" | "area" | "scatterplot"
  // Part of Whole
  | "pie" | "donut" | "funnel" | "waterfall"
  // Hierarchical
  | "treemap" | "sunburst"
  // Statistical
  | "boxplot" | "heatmap"
  // Flow
  | "sankey"
  // Specialized
  | "radar" | "gauge" | "polar" | "wordcloud" | "map" | "table"
  // 3D
  | "bar3d" | "scatter3d" | "surface" | "line3d" | "globe" | "pie3d"
  // Combo
  | "comboLineSingle" | "comboLineDual" | "comboLineColumn";
```

### Field Types

```typescript
// Generic field with component reference
interface GenericField {
  componentId: string;
}

// Color field variants
type ColorField =
  | { type: "single"; paletteId: string; color: string }
  | { type: "segment"; paletteId: string; colorMapping: Record<string, string> };

// Interactive filters
interface InteractiveFiltersConfig {
  legend: { active: boolean; componentId: string };
  timeRange: { active: boolean; componentId: string; presets: Preset[] };
  dataFilters: { active: boolean; componentIds: string[] };
  calculation: { active: boolean; type: "identity" | "percent" };
}
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
yarn test

# Run specific test file
yarn test pie-universal-adapter.spec.ts

# Watch mode
yarn test:watch
```

### E2E Tests (Playwright)

```bash
# Run against dev server
yarn e2e:dev

# Interactive UI mode
yarn e2e:ui
```

### Testing Adapters

Adapters are pure functions, making them easy to test:

```typescript
import { describe, it, expect } from "vitest";
import { pieUniversalAdapter } from "./pie-universal-adapter";

describe("pieUniversalAdapter", () => {
  it("should create valid ECharts option", () => {
    const mockState = createMockUniversalChartState({
      chartType: "pie",
      observations: [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
      ],
    });

    const option = pieUniversalAdapter(mockState);

    expect(option.series).toBeDefined();
    expect(option.series[0].type).toBe("pie");
  });
});
```

---

## Swiss Federal Theme

All charts use the Swiss Federal design system colors:

```typescript
// Primary colors
const SWISS_FEDERAL_COLORS = {
  primary: "#006699",      // Federal Blue
  secondary: "#757575",    // Gray
  background: "#ffffff",
  text: "#333333",

  // Data visualization palette
  palette: [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    "#bcbd22", "#17becf"
  ],
};
```

---

## Troubleshooting

### 3D Charts Not Rendering

3D charts require Canvas renderer (echarts-gl uses WebGL):

```typescript
// EChartsWrapper automatically switches to Canvas for 3D charts
// If issues persist, check that echarts-gl is imported:
import "echarts-gl";
```

### Chart Type Not Appearing in UI

1. Check adapter is registered in `universal-adapters/index.ts`
2. Verify chart is added to `CHART_REGISTRY` with `enabled: true`
3. Ensure `usesECharts: true` for ECharts-based charts

### TypeScript Errors in Config

Ensure your chart config type is added to the `ChartConfig` union in `config-types.ts`.

---

## Resources

- [ECharts Documentation](https://echarts.apache.org/en/index.html)
- [ECharts Examples](https://echarts.apache.org/examples/en/index.html)
- [Original visualize-admin](https://github.com/visualize-admin/visualization-tool)
- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI](https://mui.com/)

---

## Contributing

1. Create a feature branch from `main`
2. Follow the coding style (run `yarn lint`)
3. Add tests for new functionality
4. Update documentation as needed
5. Submit a pull request

---

*Last updated: January 2026*
