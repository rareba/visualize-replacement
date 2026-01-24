# Graphic Walker Integration Analysis

## Overview

This document analyzes [Graphic Walker](https://github.com/Kanaries/graphic-walker) as a potential replacement for the custom chart configurator UI.

## What is Graphic Walker?

Graphic Walker is an open-source Tableau alternative that provides:
- Drag-and-drop visual analytics interface
- Grammar of graphics-based chart creation
- Embeddable React component
- Built on Vega-Lite for rendering

## Feature Comparison

| Feature | Current Configurator | Graphic Walker | Notes |
|---------|---------------------|----------------|-------|
| **Chart Types** | 27 types (incl. 3D) | ~10 standard types | GW lacks 3D, specialized charts |
| **Drag-and-Drop** | Yes (fields to encodings) | Yes (fields to channels) | Similar UX |
| **Rendering Engine** | ECharts | Vega-Lite | Different libraries |
| **3D Charts** | Yes (bar3d, scatter3d, etc.) | No | Major gap |
| **Map Support** | Yes (Swiss maps) | Yes (GeoJSON/TopoJSON) | Both support |
| **Interactive Filters** | Yes (time, legend, data) | Limited | Current is more powerful |
| **Multi-Cube Joins** | Yes | No | Major gap |
| **Theming** | Swiss Federal CI | Custom themes | Would need adaptation |
| **Multi-Language** | 4 languages (DE, FR, IT, EN) | Would need i18n | Gap |
| **Data Sources** | SPARQL/RDF endpoints | DuckDB/DataFrames | Different approach |
| **AI/NLP Features** | No | Yes | GW advantage |
| **Computation** | Server-side GraphQL | Client-side DuckDB | Different architecture |
| **Annotations** | Yes | Limited | Current is better |
| **Dashboard Layout** | Yes | Limited | Current is better |
| **Draft/Publish** | Yes | No (needs implementation) | Would need integration |

## Architectural Implications

### If Using Graphic Walker

1. **Data Pipeline Changes**
   - Would need to convert SPARQL results to DataFrames
   - DuckDB integration for client-side computation
   - New data transformation layer

2. **Lost Capabilities**
   - 3D charts (bar3d, scatter3d, line3d, surface, globe, pie3d)
   - Specialized charts (sankey, treemap, sunburst, gauge)
   - Multi-cube joins
   - Complex interactive filters
   - Annotations system

3. **Gained Capabilities**
   - AI/Natural language queries
   - Simpler codebase (remove custom configurator)
   - Community-maintained UI

4. **Integration Work Required**
   - Swiss Federal CI theming
   - i18n integration (4 languages)
   - Custom data source connector
   - Dashboard layout system
   - Draft/publish workflow

## Hybrid Approach Recommendation

Given the feature gaps, a **hybrid approach** may be best:

### Option A: Graphic Walker for Exploration, ECharts for Publication
1. Use Graphic Walker as a data exploration tool
2. Export configuration to ECharts for final rendering
3. Keep existing ECharts charts for 3D and specialized types

### Option B: Graphic Walker for Simple Charts Only
1. Use Graphic Walker for basic charts (bar, line, pie, scatter)
2. Keep custom configurator for advanced charts
3. Gradual migration path

### Option C: Fork and Extend Graphic Walker
1. Fork Graphic Walker
2. Add ECharts as alternative renderer
3. Add missing features (3D, specialized charts)
4. High effort, ongoing maintenance

## Proof of Concept Scope

For the POC, we will:

1. **Install Graphic Walker** as a dependency
2. **Create wrapper component** that:
   - Converts SPARQL data to Graphic Walker format
   - Applies Swiss Federal theming
   - Integrates with existing app routing
3. **Test with real data** from existing data cubes
4. **Evaluate UX** compared to current configurator
5. **Document findings** for decision making

## Technical Requirements

### Dependencies
```json
{
  "@kanaries/graphic-walker": "^0.4.x"
}
```

### Data Transformation
```typescript
// Convert observations to Graphic Walker dataset
interface GWDataset {
  dataSource: Array<Record<string, any>>;
  fields: Array<{
    fid: string;
    name: string;
    semanticType: 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
    analyticType: 'dimension' | 'measure';
  }>;
}
```

### Theme Integration
```typescript
// Apply Swiss Federal colors to Graphic Walker
const swissFederalTheme = {
  colorPalette: ['#006699', '#FF6600', ...],
  // ... other theme properties
};
```

## Decision Criteria

After POC completion, evaluate:

1. **User Experience**: Is GW UX better/worse than current?
2. **Feature Coverage**: What % of current features are covered?
3. **Performance**: Is client-side DuckDB fast enough?
4. **Maintenance**: Is reduced code worth the trade-offs?
5. **Data Integration**: How complex is the SPARQL → GW pipeline?

## Conclusion

Graphic Walker is a promising tool for data exploration but **cannot fully replace** the current configurator due to:
- Missing 3D charts
- Missing specialized chart types
- Different rendering engine (Vega-Lite vs ECharts)
- No multi-cube join support

A hybrid approach or gradual migration may be the best path forward.

---

*Analysis Date: January 2026*

Sources:
- [Graphic Walker GitHub](https://github.com/Kanaries/graphic-walker)
- [Graphic Walker Documentation](https://docs.kanaries.net/graphic-walker)
- [Kanaries Website](https://kanaries.net/graphic-walker)
