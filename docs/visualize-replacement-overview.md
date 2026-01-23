# Visualize Replacement - Project Overview

## Introduction

This document provides a comprehensive overview of the **visualize-replacement** project, comparing it to the original [visualize.admin.ch](https://visualize.admin.ch) application. It is intended for colleagues who need to understand, maintain, or extend this codebase.

**Last Updated:** January 2026
**Repository Location:** `C:\Users\gva\repos\visualize-replacement`

---

## Project Goal

The goal of this project is to create a modernized, more maintainable, and extensible version of the Swiss Federal data visualization platform. The original `visualize.admin.ch` uses D3.js for chart rendering with a complex, tightly-coupled architecture. This replacement project explores multiple approaches and ultimately implements a solution based on **Apache ECharts** with a simplified architecture.

---

## Repository Structure

```
visualize-replacement/
|-- visualize-admin-echarts/   # MAIN PROJECT - ECharts-based implementation
|-- visualize-grafana/         # Grafana integration exploration
|-- visualize-oblique/         # Angular Oblique framework exploration
|-- visualize-superset/        # Apache Superset integration exploration
|-- visualization-tool/        # Original forked codebase (reference)
|-- shared-chart-adapter/      # Shared chart adapter logic (experimental)
|-- chart-test/                # Chart testing utilities
|-- docs/                      # Root-level documentation
```

### Key Project: visualize-admin-echarts

This is the **primary implementation** and should be the focus of development. The other projects (grafana, oblique, superset) were explorations that did not fully meet requirements.

---

## Comparison: Original vs Replacement

### Architecture Comparison

| Aspect | Original (visualize.admin.ch) | Replacement (visualize-admin-echarts) |
|--------|-------------------------------|--------------------------------------|
| Chart Library | D3.js (custom implementations) | Apache ECharts 6.0 |
| Chart Count | ~10 chart types | 23 chart types (21 ECharts + 2 non-ECharts) |
| Code Complexity | High (custom D3 rendering) | Medium (adapter pattern) |
| Maintainability | Difficult | Easier (standardized adapters) |
| Performance | Good | Excellent (ECharts optimizations) |
| Bundle Size | Larger | Similar |
| Chart Selector | Accordion-based | Visual card-based with categories |

### Chart Types Comparison

#### Charts in Both Versions
| Chart Type | Original | Replacement |
|------------|----------|-------------|
| Column/Bar | D3.js | ECharts |
| Line | D3.js | ECharts |
| Area | D3.js | ECharts |
| Pie | D3.js | ECharts |
| Scatterplot | D3.js | ECharts |
| Map | Mapbox | Mapbox (unchanged) |
| Table | HTML | HTML (unchanged) |
| Combo Line Single | D3.js | ECharts |
| Combo Line Dual | D3.js | ECharts |
| Combo Line Column | D3.js | ECharts |

#### NEW Charts (Not in Original)
| Chart Type | Description | Use Case |
|------------|-------------|----------|
| Donut | Pie with hollow center | Part-to-whole with center label |
| Radar | Multi-variable comparison | Comparing categories across multiple axes |
| Funnel | Progressive stages | Sales pipelines, conversion rates |
| Gauge | Single value display | KPIs, performance metrics |
| Treemap | Hierarchical rectangles | Hierarchical data with size encoding |
| Sunburst | Radial hierarchy | Multi-level categorical data |
| Heatmap | Color-coded matrix | Two-dimensional data patterns |
| Boxplot | Statistical distribution | Data distribution analysis |
| Waterfall | Cumulative effect | Financial statements, changes |
| Sankey | Flow between nodes | Energy flows, process flows |
| Polar | Circular coordinate | Cyclical data, directional data |
| Wordcloud | Text frequency | Text analysis, keywords |

### Key Technical Differences

#### 1. Chart Registry System (NEW)

The replacement introduces a centralized chart registry (`app/charts/chart-registry.ts`) that eliminates scattered chart configuration:

```typescript
export const CHART_REGISTRY: Record<ChartType, ChartMetadata> = {
  column: {
    type: "column",
    enabled: true,
    category: "basic",
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    usesECharts: true,
  },
  // ... all 23 chart types
};
```

**Benefits:**
- Single source of truth for chart capabilities
- Easy to enable/disable charts
- Automatic chart selector population
- Type-safe chart configuration

#### 2. ECharts Adapter Pattern (NEW)

Each chart type has a dedicated adapter that transforms chart state to ECharts options:

```
app/charts/echarts/adapters/
|-- column-adapter.tsx
|-- bar-adapter.tsx
|-- line-adapter.tsx
|-- area-adapter.tsx
|-- pie-adapter.tsx
|-- donut-adapter.tsx
|-- radar-adapter.tsx
|-- funnel-adapter.tsx
|-- gauge-adapter.tsx
|-- treemap-adapter.tsx
|-- sunburst-adapter.tsx
|-- heatmap-adapter.tsx
|-- boxplot-adapter.tsx
|-- waterfall-adapter.tsx
|-- sankey-adapter.tsx
|-- polar-adapter.tsx
|-- wordcloud-adapter.tsx
|-- scatterplot-adapter.tsx
|-- combo-line-single-adapter.tsx
|-- combo-line-dual-adapter.tsx
|-- combo-line-column-adapter.tsx
```

**Adapter Structure:**
```typescript
export const ColumnAdapter: EChartsAdapter<ColumnConfig> = {
  chartType: "column",
  getOption(chartConfig, observations, dimensions, measures) {
    // Transform data to ECharts format
    return { xAxis, yAxis, series, tooltip, legend };
  },
  getDatasetId(chartConfig) {
    return `column-${chartConfig.key}`;
  }
};
```

#### 3. Visual Chart Selector (REDESIGNED)

**Original:** Accordion-based list with text labels
**Replacement:** Card grid with icons, categories, and tooltips

Features:
- 7 category tabs (Basic, Part of Whole, Hierarchical, Statistical, Flow, Specialized, Comparison)
- 32px icons for visual recognition
- Hover effects with elevation
- Tooltips showing chart descriptions
- Clear enabled/disabled states
- Blue dot indicator for current chart's category

#### 4. Swiss Federal Design Theme

Custom ECharts theme (`app/charts/echarts/theme.ts`) that matches the Swiss Federal CI:
- Brand colors (federal red, secondary colors)
- Typography (Swiss Federal fonts)
- Consistent spacing and padding
- Accessible color contrasts

---

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn package manager
- Docker and Docker Compose (for database)
- PostgreSQL (via Docker or local installation)

### Setup Steps

```bash
# 1. Navigate to the main project
cd visualize-admin-echarts

# 2. Run the complete setup
yarn setup:dev

# 3. Start the development server
yarn dev

# 4. Open the application
# Navigate to http://localhost:3000
```

### Environment Configuration

Copy `.env.example` to `.env.development` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Authentication URL
- `LINDAS_ENDPOINT` - SPARQL endpoint URL

---

## Key Files to Understand

### Chart System

| File | Purpose |
|------|---------|
| `app/charts/chart-registry.ts` | Central chart configuration |
| `app/charts/index.ts` | Chart categories and enablement logic |
| `app/charts/echarts/adapters/` | Individual chart implementations |
| `app/charts/echarts/EChartsWrapper.tsx` | React wrapper for ECharts |
| `app/charts/echarts/theme.ts` | Swiss Federal theme |
| `app/charts/echarts/adapter-utils.ts` | Shared utilities (axes, grids, tooltips) |

### Configuration System

| File | Purpose |
|------|---------|
| `app/config-types.ts` | TypeScript types for all chart configs |
| `app/configurator/components/chart-type-selector.tsx` | Chart selection UI |
| `app/configurator/configurator-state/` | State management |

### Data Flow

| File | Purpose |
|------|---------|
| `app/rdf/` | SPARQL query generation and parsing |
| `app/graphql/` | GraphQL schema and resolvers |
| `app/pages/api/` | API routes |

---

## Testing

### Unit Tests

```bash
# Run all unit tests
yarn test

# Run specific test file
yarn test chart-registry.spec.ts

# Watch mode
yarn test:watch
```

### E2E Tests

```bash
# Against dev server
yarn e2e:dev

# With UI
yarn e2e:ui
```

### Manual Testing

1. Start the dev server: `yarn dev`
2. Navigate to a dataset (e.g., Swiss radio programming data)
3. Test each chart type by selecting it
4. Verify:
   - Chart renders without errors
   - Tooltips work on hover
   - Legend displays correctly
   - Data matches expectations

---

## Adding a New Chart Type

1. **Add to Chart Registry** (`app/charts/chart-registry.ts`):
   ```typescript
   newChart: {
     type: "newChart",
     enabled: true,
     category: "basic",
     // ... configuration
   }
   ```

2. **Create Adapter** (`app/charts/echarts/adapters/newchart-adapter.tsx`):
   ```typescript
   export const NewChartAdapter: EChartsAdapter<NewChartConfig> = {
     chartType: "newChart",
     getOption(chartConfig, observations, dimensions, measures) {
       // Transform data to ECharts format
     },
   };
   ```

3. **Export Adapter** (`app/charts/echarts/adapters/index.ts`)

4. **Add Config Type** (`app/config-types.ts`)

5. **Add Translations** (`app/locales/*/messages.ts`)

6. **Add Icon** (if needed, in `app/icons/`)

---

## Common Issues and Solutions

### Chart Not Rendering

1. Check browser console for errors
2. Verify the adapter is exported in `adapters/index.ts`
3. Check the chart is enabled in registry
4. Verify data transformation is correct

### TypeScript Errors

1. Run `yarn typecheck` to see all errors
2. Ensure chart type is in `ChartType` union
3. Check config types match adapter expectations

### Disabled Chart Types

Charts are disabled when data doesn't meet requirements:
- **Temporal charts** (line, area): Need a temporal dimension
- **Geo charts** (map): Need a geographic dimension
- **Multi-measure charts** (scatterplot, combo): Need 2+ measures
- **Flow charts** (sankey): Need 2+ categorical dimensions

---

## Documentation Files

### In `visualize-admin-echarts/docs/`

| Document | Description |
|----------|-------------|
| `chart-implementation-status.md` | Status of all 23 chart types |
| `chart-selector-redesign.md` | Details of the new chart selector UI |
| `echarts-migration.md` | D3 to ECharts migration details |
| `echarts-adapter-refactoring.md` | Adapter pattern documentation |
| `new-echarts-chart-types.md` | Details on the 12 new chart types |
| `echarts-testing-report.md` | Testing results and coverage |

### In `docs/` (root)

| Document | Description |
|----------|-------------|
| `rdf-visualization-evaluation.md` | Evaluation of visualization tools |
| `visualize-grafana-integration.md` | Grafana integration exploration |
| `grafana-sparql-poc-log.md` | Grafana POC development log |

---

## Exploration Projects Summary

### visualize-grafana

**Status:** Exploration complete, not recommended for production

**Approach:** Embed Grafana dashboards within visualize UI
**Pros:** Powerful dashboard builder, many chart types
**Cons:** Complex integration, authentication issues, limited customization

### visualize-oblique

**Status:** Exploration complete, not recommended for production

**Approach:** Rebuild using Angular with Swiss Federal Oblique framework
**Pros:** Official Swiss Federal framework
**Cons:** Complete rewrite needed, Angular expertise required

### visualize-superset

**Status:** Exploration complete, not recommended for production

**Approach:** Integrate Apache Superset for visualization
**Pros:** Enterprise-ready, many chart types
**Cons:** Heavy deployment, overkill for requirements

---

## Deployment Notes

### Production Build

```bash
cd visualize-admin-echarts
yarn build
```

### Docker Deployment

The project includes Docker support:
- `Dockerfile` - Standard Next.js production build
- `docker-compose.yml` - Development environment with PostgreSQL

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXT_PUBLIC_LINDAS_ENDPOINT` - SPARQL endpoint

---

## Contact and Support

For questions about this project, refer to:
1. This documentation
2. The `CLAUDE.md` file in `visualize-admin-echarts/`
3. Inline code comments
4. Git commit history for change rationale

---

## Changelog Summary

### January 2026

- Completed ECharts migration for all chart types
- Added 12 new chart types (radar, funnel, gauge, etc.)
- Redesigned chart selector with categories and icons
- Created centralized chart registry
- Fixed numerous TypeScript and runtime errors
- Achieved 100% chart implementation coverage
- Comprehensive documentation added

### December 2025

- Initial project setup
- Explored Grafana, Superset, and Oblique approaches
- Created evaluation documentation
- Started ECharts adapter development
