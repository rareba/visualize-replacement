# Architecture Overview

This document provides a visual overview of the visualize-admin-echarts architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Configurator  │    │  Chart Preview  │    │   Published     │     │
│  │   (Edit Mode)   │    │   (Preview)     │    │   (View Mode)   │     │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘     │
│           │                      │                      │               │
│           └──────────────────────┼──────────────────────┘               │
│                                  │                                       │
│                    ┌─────────────▼─────────────┐                        │
│                    │  UniversalEChartsChart    │                        │
│                    │  (Main Entry Component)   │                        │
│                    └─────────────┬─────────────┘                        │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼───────────────────────────────────────┐
│                        DATA LAYER│                                        │
│                    ┌─────────────▼─────────────┐                        │
│                    │    ChartDataWrapper       │                        │
│                    │   (GraphQL Fetching)      │                        │
│                    └─────────────┬─────────────┘                        │
│                                  │                                       │
│    ┌─────────────────────────────┼─────────────────────────────────┐    │
│    │                             │                                  │    │
│    ▼                             ▼                                  ▼    │
│  Observations              Dimensions                          Measures  │
│  (Data Points)           (Categories)                         (Values)   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼───────────────────────────────────────┐
│                  STATE MANAGEMENT│                                        │
│                    ┌─────────────▼─────────────┐                        │
│                    │  UniversalChartProvider   │                        │
│                    │   (React Context)         │                        │
│                    └─────────────┬─────────────┘                        │
│                                  │                                       │
│           Creates UniversalChartState containing:                        │
│           • chartConfig    • observations    • dimensions               │
│           • fields         • colors          • bounds                   │
│           • segments       • categories      • options                  │
│                                                                          │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼───────────────────────────────────────┐
│                    ADAPTER LAYER │                                        │
│                    ┌─────────────▼─────────────┐                        │
│                    │  UniversalChartRenderer   │                        │
│                    └─────────────┬─────────────┘                        │
│                                  │                                       │
│                    ┌─────────────▼─────────────┐                        │
│                    │   Chart Adapter Registry  │                        │
│                    │   getChartAdapter(type)   │                        │
│                    └─────────────┬─────────────┘                        │
│                                  │                                       │
│    ┌─────────────────────────────┼─────────────────────────────────────┐ │
│    │                             │                                      │ │
│    ▼                             ▼                                      ▼ │
│  ┌─────────┐               ┌─────────┐                          ┌─────────┐
│  │   Pie   │               │ Column  │          ...             │  Bar3D  │
│  │ Adapter │               │ Adapter │                          │ Adapter │
│  └────┬────┘               └────┬────┘                          └────┬────┘
│       │                         │                                    │     │
│       └─────────────────────────┼────────────────────────────────────┘     │
│                                 │                                          │
│                    Pure Function: (state) => EChartsOption                 │
│                                                                            │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼───────────────────────────────────────────┐
│                  RENDERING LAYER                                           │
│                    ┌───────────▼───────────┐                              │
│                    │    EChartsWrapper     │                              │
│                    │  (React-ECharts)      │                              │
│                    └───────────┬───────────┘                              │
│                                │                                           │
│                    ┌───────────▼───────────┐                              │
│                    │    Apache ECharts     │                              │
│                    │   (Canvas/SVG/WebGL)  │                              │
│                    └───────────────────────┘                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Adapter Pattern Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ADAPTER EXECUTION FLOW                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. IMPORT TRIGGERS REGISTRATION                                          │
│   ┌──────────────────────────────────────────────────────────────────┐    │
│   │  // In universal-adapters/index.ts                                │    │
│   │  import "./pie-universal-adapter";    ──────┐                     │    │
│   │  import "./column-universal-adapter";       │ Side effect:       │    │
│   │  import "./bar-universal-adapter";          │ registerChartAdapter()  │
│   │  ...                                        ▼                     │    │
│   │                              ┌─────────────────────────────┐      │    │
│   │                              │   ADAPTER_REGISTRY          │      │    │
│   │                              │   Map<ChartType, Adapter>   │      │    │
│   │                              └─────────────────────────────┘      │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│   2. RUNTIME ADAPTER LOOKUP                                                │
│   ┌──────────────────────────────────────────────────────────────────┐    │
│   │  UniversalChartRenderer:                                          │    │
│   │                                                                   │    │
│   │  const adapter = getChartAdapter(state.chartType);  // "pie"     │    │
│   │                           │                                       │    │
│   │                           ▼                                       │    │
│   │  ┌─────────────────────────────────────────────────────────┐     │    │
│   │  │  ADAPTER_REGISTRY.get("pie")                             │     │    │
│   │  │  → pieUniversalAdapter function                          │     │    │
│   │  └─────────────────────────────────────────────────────────┘     │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│   3. ADAPTER EXECUTION                                                     │
│   ┌──────────────────────────────────────────────────────────────────┐    │
│   │                                                                   │    │
│   │  ┌─────────────────────┐     ┌─────────────────────────────┐    │    │
│   │  │ UniversalChartState │────▶│  pieUniversalAdapter(state) │    │    │
│   │  │                     │     │                             │    │    │
│   │  │ • chartType: "pie"  │     │  // Pure transformation     │    │    │
│   │  │ • observations: []  │     │  return {                   │    │    │
│   │  │ • fields: {...}     │     │    series: [{               │    │    │
│   │  │ • colors: {...}     │     │      type: "pie",           │    │    │
│   │  │ • bounds: {...}     │     │      data: [...]            │    │    │
│   │  │ • segments: [...]   │     │    }],                      │    │    │
│   │  │ • ...               │     │    tooltip: {...},          │    │    │
│   │  │                     │     │    legend: {...}            │    │    │
│   │  └─────────────────────┘     │  };                         │    │    │
│   │                              └───────────────┬─────────────┘    │    │
│   │                                              │                   │    │
│   │                                              ▼                   │    │
│   │                              ┌─────────────────────────────┐    │    │
│   │                              │      EChartsOption          │    │    │
│   │                              │   (JSON Configuration)      │    │    │
│   │                              └─────────────────────────────┘    │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## Chart Type Categories

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          SUPPORTED CHART TYPES                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BASIC (5)                                                            │   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐         │   │
│  │ │ Column │ │  Bar   │ │  Line  │ │  Area  │ │ Scatterplot│         │   │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PART OF WHOLE (4)                                                    │   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐                      │   │
│  │ │  Pie   │ │ Donut  │ │ Funnel │ │ Waterfall │                      │   │
│  │ └────────┘ └────────┘ └────────┘ └───────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ HIERARCHICAL (2)              STATISTICAL (3)                        │   │
│  │ ┌─────────┐ ┌──────────┐     ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │ │ Treemap │ │ Sunburst │     │ Boxplot │ │ Heatmap │ │ Surface │   │   │
│  │ └─────────┘ └──────────┘     └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SPECIALIZED (7)                                                      │   │
│  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────────┐ ┌─────┐ ┌───────┐     │   │
│  │ │ Radar │ │ Gauge │ │ Polar │ │ Wordcloud │ │ Map │ │ Table │     │   │
│  │ └───────┘ └───────┘ └───────┘ └───────────┘ └─────┘ └───────┘     │   │
│  │ ┌───────┐                                                           │   │
│  │ │ Globe │                                                           │   │
│  │ └───────┘                                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FLOW (1)                      COMPARISON/COMBO (3)                   │   │
│  │ ┌────────┐                    ┌────────────┐ ┌──────────┐           │   │
│  │ │ Sankey │                    │ Line+Line  │ │ Dual Axis│           │   │
│  │ └────────┘                    └────────────┘ └──────────┘           │   │
│  │                               ┌─────────────┐                        │   │
│  │                               │ Line+Column │                        │   │
│  │                               └─────────────┘                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3D CHARTS (6) - Require ECharts GL                                   │   │
│  │ ┌───────┐ ┌───────────┐ ┌────────┐ ┌─────────┐ ┌───────┐ ┌───────┐ │   │
│  │ │ Bar3D │ │ Scatter3D │ │ Line3D │ │ Surface │ │ Globe │ │ Pie3D │ │   │
│  │ └───────┘ └───────────┘ └────────┘ └─────────┘ └───────┘ └───────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  TOTAL: 32 Chart Types                                                      │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## State Transformation

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    DATA TRANSFORMATION PIPELINE                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. RAW DATA (from GraphQL)                                                │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ observations: [                                                   │     │
│  │   { date: "2020", category: "A", value: 100 },                   │     │
│  │   { date: "2020", category: "B", value: 150 },                   │     │
│  │   { date: "2021", category: "A", value: 120 },                   │     │
│  │   { date: "2021", category: "B", value: 180 },                   │     │
│  │ ]                                                                 │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                   │                                         │
│                                   ▼                                         │
│  2. FIELD ACCESSORS (from chartConfig)                                     │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ fields: {                                                         │     │
│  │   getX: (obs) => obs.date,           // "2020", "2021"           │     │
│  │   getY: (obs) => obs.value,          // 100, 150, ...            │     │
│  │   getSegment: (obs) => obs.category, // "A", "B"                 │     │
│  │ }                                                                 │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                   │                                         │
│                                   ▼                                         │
│  3. DERIVED DATA                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ segments: ["A", "B"]                                              │     │
│  │ categories: ["2020", "2021"]                                      │     │
│  │                                                                   │     │
│  │ colors: {                                                         │     │
│  │   getColor: (segment) => colorMapping[segment],                   │     │
│  │   colorDomain: ["A", "B"],                                        │     │
│  │ }                                                                 │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                   │                                         │
│                                   ▼                                         │
│  4. ECHARTS OPTION (output)                                                │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ {                                                                 │     │
│  │   xAxis: { type: "category", data: ["2020", "2021"] },           │     │
│  │   yAxis: { type: "value" },                                       │     │
│  │   series: [                                                       │     │
│  │     { name: "A", type: "bar", data: [100, 120], color: "#1f77b4" },│    │
│  │     { name: "B", type: "bar", data: [150, 180], color: "#ff7f0e" },│    │
│  │   ],                                                              │     │
│  │   legend: { data: ["A", "B"] },                                   │     │
│  │   tooltip: { trigger: "axis" },                                   │     │
│  │ }                                                                 │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## File Organization

```
app/charts/
│
├── core/                               # Universal Architecture
│   ├── chart-adapter-registry.ts       # Adapter registration & lookup
│   ├── universal-chart-provider.tsx    # React Context provider
│   ├── universal-chart-state.ts        # State interface definition
│   ├── field-accessor-factory.ts       # Creates field extractors
│   ├── color-scale-factory.ts          # Creates color mappers
│   └── index.ts                        # Core exports
│
├── echarts/
│   ├── universal-adapters/             # All chart adapters
│   │   ├── index.ts                    # Imports all adapters
│   │   ├── pie-universal-adapter.ts
│   │   ├── column-universal-adapter.ts
│   │   ├── bar-universal-adapter.ts
│   │   ├── line-universal-adapter.ts
│   │   ├── area-universal-adapter.ts
│   │   ├── scatterplot-universal-adapter.ts
│   │   ├── donut-universal-adapter.ts
│   │   ├── funnel-universal-adapter.ts
│   │   ├── waterfall-universal-adapter.ts
│   │   ├── treemap-universal-adapter.ts
│   │   ├── sunburst-universal-adapter.ts
│   │   ├── boxplot-universal-adapter.ts
│   │   ├── heatmap-universal-adapter.ts
│   │   ├── radar-universal-adapter.ts
│   │   ├── gauge-universal-adapter.ts
│   │   ├── polar-universal-adapter.ts
│   │   ├── sankey-universal-adapter.ts
│   │   ├── wordcloud-universal-adapter.ts
│   │   ├── bar3d-universal-adapter.ts
│   │   ├── scatter3d-universal-adapter.ts
│   │   ├── line3d-universal-adapter.ts
│   │   ├── surface-universal-adapter.ts
│   │   ├── globe-universal-adapter.ts
│   │   └── pie3d-universal-adapter.ts
│   │
│   ├── EChartsWrapper.tsx              # React wrapper for ECharts
│   ├── theme.ts                        # Swiss Federal theme
│   ├── adapter-utils.ts                # Shared utility functions
│   ├── series-builders.ts              # Series construction helpers
│   └── data-utils.ts                   # Data transformation
│
├── shared/                             # Shared utilities
│   ├── chart-helpers.tsx
│   ├── use-size.tsx
│   └── ...
│
├── chart-registry.ts                   # Chart metadata registry
├── chart-data-wrapper.tsx              # Data fetching component
├── UniversalEChartsChart.tsx           # Main entry component
└── index.ts                            # Public API
```

## Comparison: Old vs New Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE COMPARISON                                  │
├───────────────────────────────┬────────────────────────────────────────────┤
│       ORIGINAL (D3.js)        │       NEW (ECharts + Universal)            │
├───────────────────────────────┼────────────────────────────────────────────┤
│                               │                                             │
│  ChartConfig                  │  ChartConfig                               │
│       │                       │       │                                     │
│       ▼                       │       ▼                                     │
│  ┌─────────────────┐         │  ┌─────────────────┐                       │
│  │ PieChartProvider│         │  │ UniversalChart  │                       │
│  │ (chart-specific)│         │  │ Provider        │                       │
│  └────────┬────────┘         │  │ (one for all)   │                       │
│           │                   │  └────────┬────────┘                       │
│           ▼                   │           │                                 │
│  ┌─────────────────┐         │           ▼                                 │
│  │  D3 Scales      │         │  ┌─────────────────┐                       │
│  │  • arcGenerator │         │  │  Pure Function   │                       │
│  │  • colorScale   │         │  │  Adapter         │                       │
│  │  • pieData      │         │  │  (50-150 lines)  │                       │
│  └────────┬────────┘         │  └────────┬────────┘                       │
│           │                   │           │                                 │
│           ▼                   │           ▼                                 │
│  ┌─────────────────┐         │  ┌─────────────────┐                       │
│  │  SVG Rendering  │         │  │  EChartsOption   │                       │
│  │  (manual paths, │         │  │  (JSON config)   │                       │
│  │   animations)   │         │  └────────┬────────┘                       │
│  └────────┬────────┘         │           │                                 │
│           │                   │           ▼                                 │
│           ▼                   │  ┌─────────────────┐                       │
│  ┌─────────────────┐         │  │  ECharts Library │                       │
│  │  <svg>          │         │  │  (handles all    │                       │
│  │    <g>          │         │  │   rendering)     │                       │
│  │      <path>     │         │  └────────┬────────┘                       │
│  │      <path>     │         │           │                                 │
│  │    </g>         │         │           ▼                                 │
│  │  </svg>         │         │  ┌─────────────────┐                       │
│  └─────────────────┘         │  │  <canvas> or    │                       │
│                               │  │  <svg>          │                       │
│  ~300-500 lines/chart        │  │  (auto-managed) │                       │
│                               │  └─────────────────┘                       │
│                               │                                             │
│                               │  ~50-150 lines/chart                       │
│                               │                                             │
├───────────────────────────────┼────────────────────────────────────────────┤
│  PROS:                        │  PROS:                                     │
│  • Full control over SVG      │  • Less code to maintain                   │
│  • Custom animations          │  • Consistent look & feel                  │
│  • No external dependency     │  • Built-in interactions                   │
│                               │  • 3D chart support                        │
│  CONS:                        │  • Easier to add new charts               │
│  • Lots of boilerplate        │                                            │
│  • Hard to maintain           │  CONS:                                     │
│  • No 3D support              │  • Less customization                      │
│  • Inconsistent across charts │  • External dependency                     │
│                               │                                             │
└───────────────────────────────┴────────────────────────────────────────────┘
```

---

*This document provides a visual overview. See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed implementation instructions.*
