# RDF/SPARQL Data Visualization Tool Evaluation

**Task Reference:** ADNMUPS-1554 - Visualisation of Graph Data
**Date:** 2025-12-16
**Objective:** Evaluate options for visualizing RDF Triplestore/SPARQL endpoint data

---

## Executive Summary

This document evaluates options for visualizing RDF/SPARQL data. Two main tools were analyzed in detail, along with additional alternatives discovered through research.

**Recommendation:** For LINDAS and Swiss federal RDF data, **visualize.admin.ch (visualization-tool)** is the best choice. For general BI needs with RDF data through an intermediary layer, **Metabase** could be considered but requires additional setup.

---

## 1. Tools Evaluated

### 1.1 visualization-tool (visualize.admin.ch)

**Source:** https://github.com/visualize-admin/visualization-tool
**Live Instance:** https://visualize.admin.ch
**Ownership:** Federal Office for the Environment (FOEN), Switzerland

#### Overview
A Next.js-based data visualization platform specifically designed for creating interactive charts from RDF/SPARQL data sources, particularly the LINDAS Linked Data Service.

#### Key Features

| Feature | Details |
|---------|---------|
| **Native RDF/SPARQL Support** | Built-in SPARQL client using `sparql-http-client` and `rdf-cube-view-query` |
| **Chart Types** | Area, Bar (grouped/stacked), Line, Combo, Maps, Pie, Scatterplot, Tables |
| **Data Layer** | GraphQL API that queries RDF endpoints and transforms data |
| **Frontend** | React/Next.js with D3.js for visualizations |
| **Database** | PostgreSQL (Prisma ORM) for storing chart configurations |
| **Authentication** | Swiss federal eIAM through ADFS |
| **Internationalization** | 4 languages (EN, DE, FR, IT) |
| **Embedding** | Embed charts in external websites via iframe or embed.js |

#### Technical Architecture

```
RDF/SPARQL Endpoints (LINDAS)
         |
         v
    GraphQL Layer (Apollo Server)
         |
         v
    Chart Configurator (React/MUI)
         |
         v
    Chart Rendering (D3.js)
         |
         v
    PostgreSQL (config storage)
```

#### Strengths
- Purpose-built for RDF data cubes
- Native SPARQL query generation
- Understands RDF cube schemas (dimensions, observations, hierarchies)
- Handles versioned dimensions
- Optimized for Swiss government data standards
- Open source (MIT License)
- Production-tested at scale

#### Limitations
- Designed specifically for RDF cube data format
- Requires understanding of LINDAS/RDF data structures
- May need customization for different RDF schemas

---

### 1.2 Metabase

**Source:** https://github.com/metabase/metabase
**Website:** https://www.metabase.com
**License:** AGPL (open source) + Commercial editions

#### Overview
A general-purpose, open-source business intelligence tool for everyone in a company to ask questions and learn from data.

#### Key Features

| Feature | Details |
|---------|---------|
| **Database Support** | PostgreSQL, MySQL, MongoDB, BigQuery, Snowflake, etc. |
| **Query Builder** | Visual query builder + SQL editor |
| **Dashboards** | Interactive dashboards with filters, auto-refresh |
| **Alerts** | Data change notifications via email/Slack |
| **Embedding** | Charts, dashboards, or full Metabase in apps |
| **Models** | Clean up, annotate, combine raw tables |
| **SDK** | Embedded Analytics SDK for React |

#### RDF/SPARQL Support

**Metabase does NOT have native SPARQL/RDF support.**

Possible workarounds:
1. **PostgreSQL Foreign Data Wrapper (rdf_fdw)** - Expose SPARQL endpoints as PostgreSQL tables
2. **ETL Pipeline** - Export RDF data to relational database, then connect Metabase
3. **Custom Driver** - Develop a community SPARQL driver (significant effort)

#### Strengths
- User-friendly interface for non-technical users
- Mature, well-documented product
- Large community and ecosystem
- Cloud and self-hosted options
- Rich embedding capabilities

#### Limitations for RDF Use Cases
- No native RDF/SPARQL support
- Requires intermediary data layer
- Loss of semantic richness when converting to relational model
- Does not understand RDF cube structures

---

## 2. Alternative Tools Considered

Based on web research, these additional tools support RDF visualization:

### 2.1 VisGraph3
**URL:** https://visgraph3.github.io/
A visual tool for reading, creating, and modifying RDF graphs. Supports Notation3, Turtle, N-Triples, and RDF/XML syntaxes. Best for graph exploration rather than dashboards.

### 2.2 SPARQL-Visualizer
**URL:** https://github.com/MadsHolten/sparql-visualizer
Angular-based app with D3.js for visualizing knowledge base content. Force graph visualization. More suitable for ontology exploration than business charts.

### 2.3 GraphDB (Ontotext)
**URL:** https://graphdb.ontotext.com/
Enterprise triplestore with built-in visualization. Custom graph views, SPARQL filtering. Commercial product with learning curve.

### 2.4 G.V() (Graph Visualization)
**URL:** https://gdotv.com/
Recently added RDF support (Nov 2025). Connects to AllegroGraph, Amazon Neptune, Stardog, Virtuoso. Desktop application.

### 2.5 Sgvizler
JavaScript library that visualizes SPARQL result sets. Lightweight but dated. Requires custom integration.

### 2.6 QueDI
Question-answering and visualization tool for LOD. Academic project. Allows data visualization without SPARQL knowledge.

---

## 3. Comparison Matrix

| Criteria | visualization-tool | Metabase | GraphDB | G.V() |
|----------|-------------------|----------|---------|-------|
| **Native SPARQL Support** | Yes | No | Yes | Yes |
| **RDF Cube Understanding** | Yes | No | Partial | No |
| **Dashboard Creation** | Yes | Yes | Limited | No |
| **Chart Variety** | 8+ types | 10+ types | Limited | Graph-focused |
| **Embedding** | Yes | Yes | Limited | No |
| **Open Source** | Yes | Yes (AGPL) | No | No |
| **Swiss Gov Integration** | Yes | No | No | No |
| **LINDAS Compatible** | Yes | Via workaround | Via SPARQL | Via SPARQL |
| **User-Friendly** | Medium | High | Medium | Medium |
| **Setup Complexity** | Medium | Low | High | Low |
| **Cost** | Free | Free/Paid | Paid | Paid |

---

## 4. Recommendations

### For LINDAS/Swiss Federal Data: Use visualization-tool

**Rationale:**
1. Purpose-built for LINDAS and RDF data cubes
2. Understands Swiss federal data standards
3. Native SPARQL query generation
4. Already in production at visualize.admin.ch
5. Open source with active development
6. Handles versioned dimensions and hierarchies
7. Swiss federal authentication integration

### For General BI with RDF Data: Consider Hybrid Approach

If business requirements include:
- Non-technical users needing self-service analytics
- Data from multiple sources (RDF + relational)
- Advanced alerting and subscriptions

**Option A:** Use visualization-tool for RDF-specific visualizations + Metabase for relational data

**Option B:** Set up rdf_fdw PostgreSQL extension to expose SPARQL data to Metabase (adds complexity, loses semantic richness)

---

## 5. Implementation Considerations

### visualization-tool Setup Requirements
- Node.js server
- PostgreSQL database
- Docker (optional, for local development)
- SPARQL endpoint access (e.g., LINDAS)

### Key Files for Customization
- `/app/rdf/queries.ts` - Core SPARQL query logic
- `/app/rdf/sparql-utils.ts` - SPARQL utilities
- `/app/charts/` - Chart rendering components
- `/app/graphql/` - GraphQL schema and resolvers

### Data Requirements
The visualization-tool expects RDF data in cube format with:
- Dimensions (categorical, temporal, geographical)
- Observations (data points)
- Metadata (labels, units, hierarchies)

---

## 6. Conclusion

For the specific use case of visualizing RDF Triplestore/SPARQL endpoint data, particularly within the Swiss federal context and LINDAS ecosystem, **visualization-tool** is the clear winner. It provides:

1. Native, optimized RDF/SPARQL support
2. Production-proven reliability
3. Swiss federal data compatibility
4. Open source flexibility
5. Modern web technologies

Metabase remains an excellent choice for traditional BI needs but is not suitable as a direct RDF visualization tool without significant additional infrastructure.

---

## Sources

- [visualize.admin.ch Documentation](https://visualize.admin.ch/docs/)
- [LINDAS - Linked Data Service](https://lindas.admin.ch/)
- [visualization-tool GitHub](https://github.com/visualize-admin/visualization-tool)
- [Metabase Documentation](https://www.metabase.com/docs/)
- [rdf_fdw PostgreSQL Extension](https://pgxn.org/dist/rdf_fdw/)
- [G.V() RDF Support Announcement](https://gdotv.com/blog/gdotv-rdf-triplestore-support-announcement/)
- [VisGraph3](https://visgraph3.github.io/)
- [SPARQL-Visualizer](https://github.com/MadsHolten/sparql-visualizer)
