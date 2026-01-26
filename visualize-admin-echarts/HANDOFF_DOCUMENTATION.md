# Visualize Replacement - Handoff Documentation

**Project:** visualize-replacement
**Version:** Based on visualize.admin.ch 6.2.5
**Date:** January 2026
**Author:** Adnovum Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Background](#2-project-background)
3. [Architecture Overview](#3-architecture-overview)
4. [Key Changes from Original Visualize](#4-key-changes-from-original-visualize)
5. [Technology Stack](#5-technology-stack)
6. [Directory Structure](#6-directory-structure)
7. [ECharts Integration](#7-echarts-integration)
8. [Universal Adapter Pattern](#8-universal-adapter-pattern)
9. [PowerBI-Style Configurator](#9-powerbi-style-configurator)
10. [Chart Types and Adapters](#10-chart-types-and-adapters)
11. [Configuration System](#11-configuration-system)
12. [Data Flow](#12-data-flow)
13. [Recent Migration Work](#13-recent-migration-work)
14. [Development Guide](#14-development-guide)
15. [Testing Strategy](#15-testing-strategy)
16. [Deployment](#16-deployment)
17. [Known Issues](#17-known-issues)
18. [Future Work](#18-future-work)
19. [Handoff Checklist](#19-handoff-checklist)

---

## 1. Executive Summary

This project is a **fork and enhancement** of the Swiss Federal Government's data visualization tool ([visualize.admin.ch](https://visualize.admin.ch)). The primary goals were:

1. **Replace D3.js with ECharts** - Unified charting library for better performance and maintainability
2. **Add PowerBI-style configurator** - Intuitive drag-and-drop interface for non-technical users
3. **Modernize the stack** - Upgrade to Next.js 16, TypeScript 5.7, Apollo Server 4
4. **Improve code organization** - Extract monolithic files into focused modules

### Key Outcomes

| Aspect | Original | Our Version |
|--------|----------|-------------|
| Charting Library | Custom D3.js per chart | ECharts (unified) |
| Next.js Version | 14.2.x | 16.1.4 |
| TypeScript | 4.9.5 | 5.7.3 |
| Apollo Server | apollo-server-micro | @apollo/server 4.11.0 |
| Configurator UI | Basic form-based | PowerBI-style with field wells |
| Chart Architecture | Component-based adapters | Universal pure-function adapters |

---

## 2. Project Background

### Original Project

- **Name:** visualize.admin.ch
- **Source:** [github.com/visualize-admin/visualization-tool](https://github.com/visualize-admin/visualization-tool)
- **Owner:** Federal Office for the Environment FOEN (BAFU), Swiss Government
- **Purpose:** Visualize RDF data cubes from LINDAS (Linked Data Service)
- **License:** BSD-3-Clause

### Why Fork?

The original project uses custom D3.js implementations for each chart type, leading to:
- Code duplication across chart types
- Inconsistent behavior and bugs
- High maintenance burden
- Performance issues with large datasets

### Our Approach

We chose to:
1. Replace D3.js chart rendering with ECharts
2. Keep D3 utilities (scales, color schemes) where appropriate
3. Create a universal adapter pattern for future library flexibility
4. Add a modern PowerBI-style configuration interface
5. Maintain backward compatibility with existing configurations

---

## 3. Architecture Overview

```
+---------------------------------------------------------------------+
|                         USER INTERFACE                              |
+---------------------------------------------------------------------+
|  +----------------+  +----------------+  +----------------------+   |
|  |  Chart Editor  |  | Published View |  |   Embed Widget       |   |
|  |  /create/new   |  | /v/[chartId]   |  |   /embed/[chartId]   |   |
|  +-------+--------+  +-------+--------+  +-----------+----------+   |
|          |                   |                       |              |
|          +-------------------+-----------------------+              |
|                              v                                      |
|  +----------------------------------------------------------+      |
|  |              CONFIGURATOR (PowerBI-Style)                |      |
|  |  +--------------+ +--------------+ +-------------------+ |      |
|  |  | Chart Type   | | Field Wells  | | Formatting Panel  | |      |
|  |  | Picker       | | (X, Y, etc.) | | (Axes, Legend)    | |      |
|  |  +--------------+ +--------------+ +-------------------+ |      |
|  +----------------------------------------------------------+      |
|                              v                                      |
+---------------------------------------------------------------------+
|                      CHART RENDERING LAYER                          |
+---------------------------------------------------------------------+
|  +----------------------------------------------------------+      |
|  |              Universal Chart State                        |      |
|  |  { observations, fields, colors, bounds, metadata }       |      |
|  +----------------------------------------------------------+      |
|                              v                                      |
|  +----------------------------------------------------------+      |
|  |              ECharts Universal Adapters                   |      |
|  |  +--------+ +--------+ +--------+ +--------+ +--------+  |      |
|  |  | Column | |  Bar   | |  Line  | |  Area  | |  Pie   |  |      |
|  |  +--------+ +--------+ +--------+ +--------+ +--------+  |      |
|  |  +--------+ +--------+ +--------+ +--------+ +--------+  |      |
|  |  |Scatter | | Combo  | |Heatmap | | Radar  | |Boxplot |  |      |
|  |  +--------+ +--------+ +--------+ +--------+ +--------+  |      |
|  +----------------------------------------------------------+      |
|                              v                                      |
|  +----------------------------------------------------------+      |
|  |              ECharts Renderer                             |      |
|  |              (EChartsWrapper component)                   |      |
|  +----------------------------------------------------------+      |
|                                                                     |
+---------------------------------------------------------------------+
|                         DATA LAYER                                  |
+---------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+   |
|  | GraphQL API      |  | RDF/SPARQL       |  | PostgreSQL       |   |
|  | (Apollo Server)  |  | (LINDAS)         |  | (Prisma ORM)     |   |
|  +------------------+  +------------------+  +------------------+   |
+---------------------------------------------------------------------+
```

---

## 4. Key Changes from Original Visualize

### 4.1 Charting Library Migration (D3 -> ECharts)

**Original Approach:**
- Each chart type had custom D3.js implementation (150-300 lines each)
- Shared utilities scattered across files
- Manual handling of animations, tooltips, legends

**Our Approach:**
- ECharts handles all rendering, animations, interactions
- Universal adapters are pure functions (50-150 lines each)
- D3 utilities preserved for scales and color schemes only

**Files Changed:**
```
app/charts/echarts/
├── universal-adapters/         # NEW - Pure function adapters
│   ├── column-universal-adapter.ts
│   ├── bar-universal-adapter.ts
│   ├── line-universal-adapter.ts
│   ├── area-universal-adapter.ts
│   ├── pie-universal-adapter.ts
│   ├── scatterplot-universal-adapter.ts
│   ├── combo-line-single-adapter.ts
│   └── shared/                 # Shared utilities
│       ├── formatting.ts       # Formatting options resolver
│       └── index.ts
├── adapters/                   # DEPRECATED - Legacy component-based
├── adapter-utils.ts            # Axis, tooltip, legend factories
├── series-builders.ts          # Series configuration builders
└── theme.ts                    # Swiss Federal theme for ECharts
```

### 4.2 Universal Adapter Architecture

**Original:** Component-based adapters mixing rendering logic with React lifecycle

**Our Version:** Pure function adapters that transform `UniversalChartState` -> `EChartsOption`

```typescript
// Original (component-based)
export const ColumnAdapter = ({ chartConfig, observations, ... }) => {
  useEffect(() => {
    // D3 rendering logic mixed with React
  }, [dependencies]);
  return <svg ref={svgRef} />;
};

// Our version (pure function)
export const columnUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  // Pure transformation, no side effects
  return {
    xAxis: createXCategoryAxis({ categories: state.categories }),
    yAxis: createYValueAxis({ min: yDomain[0], max: yDomain[1] }),
    series: createBarSeriesGroup(...),
  };
};
```

### 4.3 PowerBI-Style Configurator

**Original:** Basic form-based configuration with many separate panels

**Our Version:** Unified PowerBI-style interface with:
- Visual chart type picker (icon grid)
- Field wells (drag-and-drop data mapping)
- Collapsible formatting sections
- Real-time preview

**New Components:**
```
app/configurator/components/powerbi/
├── PowerBIConfigurator.tsx      # Main configurator component
├── PowerBIChartTypePicker.tsx   # Visual chart type selector
├── FieldWells.tsx               # Drag-and-drop field mapping
├── FieldListPanel.tsx           # Available fields list
├── FormattingPanel.tsx          # Visual formatting options
├── FilterPanel.tsx              # Interactive filters
├── TableBuildPanel.tsx          # Table-specific configuration
├── AggregationSelector.tsx      # Measure aggregation options
└── index.ts                     # Organized exports
```

### 4.4 Formatting System

**Original:** Limited formatting options, inconsistently applied

**Our Version:** Comprehensive `FormattingConfig` type with:
- Axis visibility toggles (X/Y axis, labels, gridlines)
- Legend and title controls
- Animation and zoom options
- Tooltip customization
- Transparent background option

```typescript
interface FormattingConfig {
  showXAxis?: boolean;
  showXAxisLabels?: boolean;
  showYAxis?: boolean;
  showYAxisLabels?: boolean;
  showGridlines?: boolean;
  showLegend?: boolean;
  showTitle?: boolean;
  showDataValues?: boolean;
  showTooltip?: boolean;
  enableAnimation?: boolean;
  enableZoom?: boolean;
  transparentBg?: boolean;
}
```

### 4.5 Code Organization

**Original:** Large monolithic files
- `charts/index.ts` - 4,358 lines
- `config-types.ts` - 1,887 lines
- `chart-config-ui-options.ts` - 1,872 lines

**Our Version:** Modular structure with focused files

```
app/charts/
├── index.ts                 # Reduced to 3,913 lines
├── registry/                # NEW - Chart type definitions
│   ├── chart-types.ts
│   └── chart-categories.ts
├── field-utils/             # NEW - Field utility functions
│   └── index.ts
├── validation/              # NEW - Chart type validation
│   └── index.ts
└── echarts/
    └── universal-adapters/  # NEW - Pure function adapters

app/config/                  # NEW - Centralized config module
├── index.ts
├── types/index.ts
├── utils/index.ts
├── adjusters/index.ts
└── ui-options/index.ts

app/utils/index.ts           # NEW - Organized utility exports
```

### 4.6 Dependency Upgrades

| Dependency | Original | Our Version | Notes |
|------------|----------|-------------|-------|
| Next.js | 14.2.26 | 16.1.4 | Via 15.5.9 intermediate |
| TypeScript | 4.9.5 | 5.7.3 | New strict features |
| Apollo Server | apollo-server-micro | @apollo/server 4.11.0 | Modern API |
| React | 18.2.0 | 18.2.0 | Unchanged |
| ECharts | - | 5.x | NEW |

---

## 5. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.4 | React framework with SSR/SSG |
| React | 18.2.0 | UI library |
| TypeScript | 5.7.3 | Type safety |
| Material-UI | 5.x | Component library |
| ECharts | 5.x | Chart rendering |
| D3 (utilities only) | 7.x | Scales, colors |
| Lingui | 4.x | Internationalization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Apollo Server | 4.11.0 | GraphQL server |
| URQL | 4.x | GraphQL client |
| Prisma | 5.x | Database ORM |
| PostgreSQL | 15+ | Data persistence |
| Next-auth | 4.24.x | Authentication |

### Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| k6 | Performance testing |
| Storybook | Component documentation |

---

## 6. Directory Structure

```
visualize-replacement/
├── visualize-admin-echarts/        # Main application
│   ├── app/
│   │   ├── charts/                 # Chart rendering
│   │   │   ├── echarts/            # ECharts implementation
│   │   │   │   ├── universal-adapters/  # Pure function adapters
│   │   │   │   ├── adapters/       # Legacy (deprecated)
│   │   │   │   ├── adapter-utils.ts
│   │   │   │   ├── series-builders.ts
│   │   │   │   └── theme.ts
│   │   │   ├── core/               # Universal chart interfaces
│   │   │   ├── registry/           # Chart type definitions
│   │   │   ├── field-utils/        # Field utilities
│   │   │   ├── validation/         # Chart type validation
│   │   │   └── [chart-type]/       # Per-chart components
│   │   ├── config/                 # Configuration module
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── adjusters/
│   │   │   └── ui-options/
│   │   ├── configurator/           # Chart configuration UI
│   │   │   ├── components/
│   │   │   │   └── powerbi/        # PowerBI-style components
│   │   │   └── state/              # Configuration state
│   │   ├── graphql/                # GraphQL schema & resolvers
│   │   ├── rdf/                    # SPARQL query logic
│   │   ├── pages/                  # Next.js routes
│   │   ├── components/             # Shared UI components
│   │   ├── prisma/                 # Database schema
│   │   ├── locales/                # i18n (en, de, fr, it)
│   │   └── utils/                  # Utility functions
│   ├── embed/                      # Embeddable widget
│   ├── e2e/                        # Playwright tests
│   └── k6/                         # Performance tests
│
├── shared-chart-adapter/           # Universal adapter types
│   └── src/
│       ├── types.ts                # ChartAdapter interface
│       └── scales.ts               # D3 scale utilities
│
├── Removed/                        # Abandoned approaches
│   ├── visualize-oblique/          # Angular attempt
│   └── visualize-superset/         # Superset attempt
│
└── docs/                           # Documentation
```

---

## 7. ECharts Integration

### Why ECharts?

1. **Unified library** - One library for all chart types vs custom D3 per chart
2. **Performance** - Optimized canvas/SVG rendering for large datasets
3. **Built-in features** - Animations, tooltips, legends, zoom out of the box
4. **Maintainability** - Configuration-based vs imperative D3 code
5. **Community** - Large ecosystem, extensive documentation

### D3 Utilities Preserved

We kept D3 for specific utilities where ECharts doesn't provide equivalent functionality:

```typescript
// Preserved D3 imports
import { max, min } from "d3-array";      // Array statistics
import { scaleLinear, scaleTime } from "d3-scale";  // Scale functions
import { schemeCategory10 } from "d3-scale-chromatic";  // Color palettes
```

### Swiss Federal Theme

Custom ECharts theme matching Swiss Federal design guidelines:

```typescript
// app/charts/echarts/theme.ts
export const getSwissFederalTheme = (): EChartsOption => ({
  color: ['#dc0018', '#006699', '#66cc00', ...],  // Swiss palette
  textStyle: {
    fontFamily: 'FrutigerNeue, Arial, sans-serif',
    fontSize: 12,
  },
  // ... axis styles, grid, legend, tooltip
});
```

### Adapter Architecture

Each chart type has a universal adapter that transforms `UniversalChartState` to `EChartsOption`:

```typescript
// app/charts/echarts/universal-adapters/column-universal-adapter.ts
export const columnUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, options, segments, categories } = state;

  // 1. Calculate domains
  const yDomain = calculateYDomain(state, isStacked);

  // 2. Build series
  const series = hasSegments
    ? createBarSeriesGroup(segments, getData, getColor, { stack: isStacked ? "total" : undefined })
    : [createBarSeries({ data: buildSimpleColumnData(state) })];

  // 3. Build axes with formatting
  const xAxis = { ...createXCategoryAxis({ categories }), show: formatting.showXAxis };
  const yAxis = { ...createYValueAxis({ min, max }), show: formatting.showYAxis };

  // 4. Return ECharts option
  return {
    ...getSwissFederalTheme(),
    grid: createGridConfig(bounds),
    tooltip: formatting.showTooltip ? createAxisTooltip() : { show: false },
    legend: formatting.showLegend ? createLegend() : { show: false },
    xAxis,
    yAxis,
    series,
  };
};
```

---

## 8. Universal Adapter Pattern

### Core Concept

The universal adapter pattern allows swappable chart library implementations without changing business logic.

### Key Interfaces

```typescript
// shared-chart-adapter/src/types.ts

interface UniversalChartState {
  observations: Observation[];           // Data points
  fields: ChartFields;                   // Field accessors
  colors: ColorConfig;                   // Color mapping
  bounds: ChartBounds;                   // Dimensions
  metadata: ChartMetadata;               // Labels, titles
  options: ChartOptions;                 // Stacking, grouping
  segments: string[];                    // Segment values
  categories: string[];                  // Category values
  chartConfig: ChartConfig;              // Full config
}

interface ChartAdapter {
  libraryName: string;
  version: string;

  render(container: HTMLElement, props: ChartProps): ChartRenderResult;
  update(result: ChartRenderResult, props: Partial<ChartProps>): void;
  resize(result: ChartRenderResult, width: number, height: number): void;
  exportImage(result: ChartRenderResult, format: 'png' | 'svg'): Promise<Blob>;
  getAccessibleDescription(result: ChartRenderResult): string;
}
```

### Registration System

```typescript
// app/charts/core/chart-adapter-registry.ts
const adapterRegistry = new Map<string, AdapterFunction>();

export const registerChartAdapter = (chartType: string, adapter: AdapterFunction) => {
  adapterRegistry.set(chartType, adapter);
};

export const getChartAdapter = (chartType: string): AdapterFunction | undefined => {
  return adapterRegistry.get(chartType);
};

// Usage in adapters
registerChartAdapter("column", columnUniversalAdapter);
registerChartAdapter("bar", barUniversalAdapter);
```

### Benefits

1. **Testability** - Pure functions are easy to unit test
2. **Flexibility** - Can swap ECharts for Plotly, Observable Plot, etc.
3. **Maintainability** - Clear separation of concerns
4. **Performance** - No React lifecycle overhead in adapters

---

## 9. PowerBI-Style Configurator

### Overview

The PowerBI-style configurator provides an intuitive interface for non-technical users to build charts.

### Components

| Component | Purpose |
|-----------|---------|
| `PowerBIConfigurator` | Main container, manages state |
| `PowerBIChartTypePicker` | Visual grid of chart type icons |
| `FieldWells` | Drag-and-drop zones for X, Y, Segment, Color |
| `FieldListPanel` | List of available dimensions/measures |
| `FormattingPanel` | Visual toggles for chart appearance |
| `FilterPanel` | Interactive filter configuration |
| `AggregationSelector` | Measure aggregation (sum, avg, etc.) |

### State Management

```typescript
// Configuration state flow
FormattingPanel (user toggles switch)
    |
    v
dispatch({ type: "CHART_CONFIG_UPDATE_FORMATTING", payload: newFormatting })
    |
    v
reducer updates chartConfig.formatting
    |
    v
UniversalChartProvider builds UniversalChartState
    |
    v
Universal adapter reads state.chartConfig.formatting via resolveFormatting()
    |
    v
ECharts option includes formatting (axis show/hide, etc.)
```

### Formatting Panel Sections

```typescript
const FORMATTING_SECTIONS = [
  { id: "appearance", icon: "swatch", label: "Appearance" },
  { id: "labelsText", icon: "text", label: "Labels & Text" },
  { id: "axes", icon: "chartColumn", label: "Axes", chartTypes: [...] },
  { id: "behavior", icon: "settings", label: "Behavior", isAdvanced: true },
];
```

---

## 10. Chart Types and Adapters

### Supported Chart Types

| Chart Type | Adapter File | Variants |
|------------|--------------|----------|
| Column | `column-universal-adapter.ts` | Simple, Grouped, Stacked |
| Bar | `bar-universal-adapter.ts` | Simple, Grouped, Stacked |
| Line | `line-universal-adapter.ts` | Simple, Multi-line |
| Area | `area-universal-adapter.ts` | Simple, Stacked |
| Pie | `pie-universal-adapter.ts` | - |
| Donut | `donut-universal-adapter.ts` | - |
| Scatterplot | `scatterplot-universal-adapter.ts` | Simple, Segmented |
| Combo Line/Column | `combo-line-column-adapter.ts` | - |
| Combo Line Single | `combo-line-single-adapter.ts` | - |
| Combo Line Dual | `combo-line-dual-adapter.ts` | - |
| Heatmap | `heatmap-adapter.ts` | - |
| Radar | `radar-adapter.ts` | - |
| Boxplot | `boxplot-adapter.ts` | - |
| Map | (uses Mapbox) | Symbols, Areas |
| Table | (React component) | - |

### 3D Charts (Experimental)

| Chart Type | Status |
|------------|--------|
| Bar 3D | Experimental |
| Scatter 3D | Experimental |
| Line 3D | Experimental |
| Surface | Experimental |
| Globe | Experimental |
| Pie 3D | Experimental |

### Removed Chart Types

The following were removed to reduce maintenance burden:
- Gauge
- Sankey
- Polar
- Wordcloud
- Treemap
- Funnel
- Sunburst

---

## 11. Configuration System

### ChartConfig Type

```typescript
interface ChartConfig {
  key: string;                        // Unique identifier
  version: string;                    // Config version for migrations
  chartType: ChartType;               // "column", "bar", "line", etc.
  meta: Meta;                         // Title, description
  cubes: Cube[];                      // Data source references
  fields: ChartFields;                // Field mappings (x, y, segment, color)
  filters: Filters;                   // Data filters
  interactiveFiltersConfig: InteractiveFiltersConfig;
  formatting?: FormattingConfig;      // Visual appearance
}
```

### Module Structure

```
app/config/
├── index.ts                 # Main barrel file
├── types/index.ts           # Re-exports from @/config-types
├── utils/index.ts           # Re-exports from @/config-utils
├── adjusters/index.ts       # Re-exports from @/config-adjusters
└── ui-options/index.ts      # Re-exports from @/charts/chart-config-ui-options
```

### Import Paths

```typescript
// New canonical paths (recommended)
import { ChartConfig, Filters } from "@/config/types";
import { getChartConfig } from "@/config/utils";

// Legacy paths (still work for backward compatibility)
import { ChartConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
```

---

## 12. Data Flow

### From SPARQL to Chart

```
1. User selects dataset (LINDAS cube)
                |
                v
2. GraphQL query fetches cube metadata
   - Dimensions, measures, values
                |
                v
3. User configures chart in Configurator
   - Maps fields to X, Y, Segment, Color
   - Sets formatting options
                |
                v
4. ChartConfig saved to state
                |
                v
5. UniversalChartProvider builds UniversalChartState
   - Fetches observations via SPARQL
   - Extracts field values
   - Computes domains, colors
                |
                v
6. Universal adapter transforms state -> EChartsOption
                |
                v
7. EChartsWrapper renders chart
```

### Key Files in Data Flow

| Step | File |
|------|------|
| SPARQL Queries | `app/rdf/queries/*.ts` |
| GraphQL Resolvers | `app/graphql/resolvers/*.ts` |
| Config State | `app/configurator/configurator-state/*.tsx` |
| State Provider | `app/charts/core/universal-chart-provider.tsx` |
| Adapters | `app/charts/echarts/universal-adapters/*.ts` |
| Renderer | `app/charts/echarts/EChartsWrapper.tsx` |

---

## 13. Recent Migration Work

### Phase 1: Foundation (Completed)

- TypeScript 4.9.5 -> 5.7.3
- Apollo Server migration to @apollo/server 4.11.0
- next-auth upgrade deferred (v5 not stable for Pages Router)

### Phase 2: Next.js 16 Migration (Completed)

- Next.js 14.2.26 -> 16.1.4
- Added `--webpack` flag for Turbopack compatibility
- Removed deprecated `eslint` config from next.config.js
- Removed unused React imports for `jsx: "react-jsx"`

### Phase 3: Chart Adapter Consolidation (Completed)

- Added deprecation notices to 14 legacy component-based adapters
- Universal adapters are the recommended approach
- Legacy adapters maintained for backward compatibility

### Phase 4: Config File Reorganization (Completed)

- Created `app/config/` module structure
- Barrel files re-export from legacy locations
- Migration to split files can happen incrementally

### Phase 5: Charts Directory Restructure (Completed)

- Created `app/charts/registry/` for chart type definitions
- Created `app/charts/field-utils/` for field utilities
- Created `app/charts/validation/` for chart type validation
- Reduced `charts/index.ts` from 4,358 -> 3,913 lines

### Phase 6: Utils Cleanup (Completed)

- Created `app/utils/index.ts` barrel file
- Organized ~50 utility exports by category

### Formatting Toggles Fix (Completed)

Fixed axis formatting toggles not working:
- Updated 5 universal adapters to properly merge axis labels
- Added full formatting support to area and scatterplot adapters
- Pattern: spread base axis config, then override with formatting

---

## 14. Development Guide

### Prerequisites

- Node.js 18+
- Yarn 1.22+
- Docker (for PostgreSQL)
- Git

### Setup

```bash
# Clone repository
git clone [repository-url]
cd visualize-replacement/visualize-admin-echarts

# Install dependencies and setup
yarn setup:dev

# Start development server
yarn dev

# Or with HTTPS (required for auth)
yarn dev:ssl
```

### Common Commands

```bash
# Development
yarn dev                    # Start dev server
yarn dev:ssl               # HTTPS mode
yarn dev:rollup            # Build embed script

# Building
yarn build                 # Full production build
yarn typecheck            # TypeScript validation
yarn lint                 # ESLint checks

# Testing
yarn test                 # Unit tests
yarn test:watch          # Watch mode
yarn e2e:dev             # E2E tests
yarn e2e:ui              # E2E with UI

# Database
yarn db:migrate:dev      # Run migrations (dev)

# GraphQL & i18n
yarn graphql:codegen     # Generate types
yarn locales:extract     # Extract strings
yarn locales:compile     # Compile translations
```

### Environment Variables

Create `.env.local` from `.env.example`:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
LINDAS_ENDPOINT=https://lindas.admin.ch/query
```

---

## 15. Testing Strategy

### Unit Tests (Vitest)

```bash
yarn test
yarn test chart-adapter  # Run specific tests
yarn test:watch         # Watch mode
```

Key test files:
- `app/charts/echarts/universal-adapters/*.spec.ts`
- `app/config-types.spec.ts`
- `app/config-utils.spec.ts`

### E2E Tests (Playwright)

```bash
yarn e2e:dev           # Run all E2E tests
yarn e2e:ui            # Interactive mode
```

Test coverage:
- Chart creation workflow
- Configuration changes
- Data filtering
- Export functionality

### Visual Regression

Using Playwright screenshots for chart rendering consistency.

### Performance Tests (k6)

```bash
cd k6
k6 run graphql-load-test.js
```

---

## 16. Deployment

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000 | Local development |
| Preview | Vercel preview URLs | PR reviews |
| Staging | staging.visualize.ch | Pre-production |
| Production | visualize.admin.ch | Live |

### Build Process

```bash
yarn build
# Outputs:
# - .next/          # Next.js build
# - dist/embed.js   # Embeddable widget
# - storybook-static/ # Component docs
```

### Database Migrations

- **Development:** Manual via `yarn db:migrate:dev`
- **Production:** Automatic on app start
- **Preview:** Shared database (careful with schema changes)

---

## 17. Known Issues

### ESLint Configuration

The `yarn lint` command fails with a circular JSON error due to eslint-config-next incompatibility. This is a known issue from the Next.js 16 migration.

**Workaround:** Use `yarn typecheck` for validation instead.

### Pre-existing Test Failures

4 unit tests fail due to pre-existing issues:
- `shared-utilities.spec.ts` - Animation duration test
- `shared-utilities.spec.ts` - Rotation angle test
- `data-source/index.spec.ts` - URL param test

These are not related to recent changes.

### next-auth v5 Migration

next-auth v5 is designed for App Router and has incomplete Pages Router support. The upgrade was deferred until:
- v5 stabilizes for Pages Router, or
- Project migrates to App Router

---

## 18. Future Work

### Short Term

1. **Fix ESLint configuration** for Next.js 16
2. **Fix pre-existing test failures**
3. **Complete adapter migration** - Remove deprecated component-based adapters
4. **Split large files** - Further modularize `charts/index.ts`

### Medium Term

1. **App Router migration** - Move from Pages to App Router
2. **next-auth v5** - Upgrade after App Router migration
3. **3D chart stabilization** - Production-ready 3D charts
4. **Performance optimization** - Large dataset handling

### Long Term

1. **Observable Plot adapter** - Alternative to ECharts
2. **Real-time data** - WebSocket support for live updates
3. **Collaborative editing** - Multi-user chart editing
4. **AI-assisted configuration** - Natural language chart creation

---

## 19. Handoff Checklist

### Understanding the Project

- [ ] Read this documentation completely
- [ ] Understand the D3 -> ECharts migration rationale
- [ ] Review the universal adapter pattern
- [ ] Study the PowerBI-style configurator
- [ ] Explore the SPARQL/RDF data flow

### Local Setup

- [ ] Clone repository
- [ ] Run `yarn setup:dev`
- [ ] Start dev server with `yarn dev`
- [ ] Create a test chart in the editor
- [ ] Run `yarn typecheck` successfully

### Key Files to Review

- [ ] `app/charts/echarts/universal-adapters/` - Adapter implementations
- [ ] `app/charts/core/universal-chart-state.ts` - State interface
- [ ] `app/configurator/components/powerbi/` - Configurator UI
- [ ] `app/charts/echarts/adapter-utils.ts` - Shared utilities
- [ ] `app/config-types.ts` - Type definitions

### Testing

- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn e2e:dev`
- [ ] Test chart creation workflow manually

### Code Patterns

- [ ] Understand `resolveFormatting()` for formatting options
- [ ] Understand `createXCategoryAxis()`, `createYValueAxis()` axis factories
- [ ] Understand `createBarSeries()`, `createLineSeries()` series builders
- [ ] Understand adapter registration with `registerChartAdapter()`

### Contacts

- **Original Project:** visualize@bafu.admin.ch
- **Repository:** github.com/visualize-admin/visualization-tool

---

## Appendix A: Migration Commit History

Key commits in chronological order:

```
a705c2f feat: Add schema-based chart configurator POC using @rjsf/mui
48aff70 Implement Universal Adapter Architecture with ECharts
1da1db2 Add Chart Builder with ECharts for LINDAS data visualization
df4e3d5 Remove unused chart types: gauge, sankey, polar, etc.
5807729 fix: use @rjsf/core instead of @rjsf/mui
[phase1] TypeScript 5.7.3, Apollo Server 4.11.0
[phase2] Next.js 16.1.4 migration
[phase3] Adapter deprecation notices
[phase4] Config module reorganization
[phase5] Charts directory restructure
[phase6] Utils organization
[fix] Formatting toggles fix
```

---

## Appendix B: File Size Comparison

### Before Migration

| File | Lines |
|------|-------|
| charts/index.ts | 4,358 |
| config-types.ts | 1,887 |
| chart-config-ui-options.ts | 1,872 |

### After Migration

| File | Lines | Change |
|------|-------|--------|
| charts/index.ts | 3,913 | -445 |
| charts/registry/index.ts | ~100 | NEW |
| charts/field-utils/index.ts | ~83 | NEW |
| charts/validation/index.ts | ~250 | NEW |

---

## Appendix C: Import Path Reference

### New Canonical Paths

```typescript
// Config
import { ChartConfig } from "@/config/types";
import { getChartConfig } from "@/config/utils";
import { getChartSpec } from "@/config/ui-options";

// Charts
import { chartTypes, chartTypeCategories } from "@/charts/registry";
import { getFieldComponentIds, getChartSymbol } from "@/charts/field-utils";
import { getEnabledChartTypes } from "@/charts/validation";

// Utils
import { createId, useLocalState, hexToRgba } from "@/utils";
```

### Legacy Paths (Still Work)

```typescript
import { ChartConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import { chartTypes } from "@/charts";
```

---

*End of Handoff Documentation*
