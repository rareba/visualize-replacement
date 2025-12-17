# RDF/SPARQL Data Visualization Tool Evaluation

**Task Reference:** ADNMUPS-1554 - Visualisation of Graph Data
**Date:** 2025-12-16
**Objective:** Find the best replacement for visualizing RDF Triplestore/SPARQL endpoint data

---

## Executive Summary

This document evaluates alternatives for creating dashboards and visualizations from RDF/SPARQL endpoints. The goal is to find tools that allow easy visualization creation without requiring deep technical knowledge.

**Top Recommendations:**

| Rank | Tool | Best For | Ease of Use |
|------|------|----------|-------------|
| 1 | **Grafana + SPARQL Plugin** | Dashboards, monitoring, time series | High |
| 2 | **Metaphactory** | Enterprise KG visualization | Medium-High |
| 3 | **Looker Studio + SPARQL Connector** | Free dashboards, Google integration | High |
| 4 | **Stardog + BI Tools** | Tableau/Power BI users | High |

---

## 1. Tools with Native SPARQL Support

### 1.1 Grafana + SPARQL Datasource Plugin

**Website:** https://grafana.com/grafana/plugins/flandersmake-sparql-datasource/
**GitHub:** https://github.com/Flanders-Make-vzw/grafana-sparql-datasource
**Cost:** Free (open source)
**Latest Version:** 1.1.0 (October 2025)

#### Overview
Grafana is a mature, widely-used visualization platform. The SPARQL datasource plugin (by Flanders Make) adds direct connectivity to any SPARQL endpoint using the Comunica framework.

#### Key Features
- Direct SPARQL endpoint connection
- Variable interpolation in queries
- Basic HTTP authentication support
- All Grafana visualization types available (graphs, tables, gauges, maps, etc.)
- Dashboard templating and sharing
- Alerting capabilities
- Embedding support

#### Installation
```bash
grafana-cli plugins install flandersmake-sparql-datasource
```

#### Pros
- Mature, well-supported platform
- Rich visualization library
- Active community
- Self-hosted or cloud options
- Free tier available

#### Cons
- Requires writing SPARQL queries
- Plugin is community-maintained
- No visual query builder for SPARQL

#### Rating: 4.5/5 for dashboard creation

---

### 1.2 Metaphactory

**Website:** https://metaphacts.com/product
**Cost:** Commercial (free trial available)

#### Overview
A low-code knowledge graph platform that runs on any SPARQL 1.1 graph database. Designed specifically for enterprise knowledge graph management and visualization.

#### Key Features
- Native SPARQL 1.1 support
- Visual ontology modeling (OWL + SHACL)
- SPARQL query UI and query catalog
- Pre-built dashboard components (tables, charts, maps)
- Semantic search capabilities
- Federation across multiple SPARQL endpoints
- Works with: Amazon Neptune, GraphDB, Stardog, RDFox, Virtuoso

#### Dashboard Components
- Semantic tables
- Charts (bar, line, pie, etc.)
- Semantic maps (geographic)
- Custom graph visualizations
- Faceted search interfaces

#### Pros
- Purpose-built for knowledge graphs
- Low-code/no-code approach
- Enterprise-grade features
- Excellent documentation

#### Cons
- Commercial license required
- Learning curve for full features
- May be overkill for simple dashboards

#### Rating: 4/5 for enterprise use cases

---

### 1.3 Looker Studio + SPARQL Connector

**Website:** https://lookerstudio.google.com/
**Connector:** Community connector by Datafabrics LLC
**Cost:** Free

#### Overview
Google's free BI tool with a community SPARQL connector that enables direct querying of SPARQL endpoints.

#### Key Features
- Free dashboard creation
- SPARQL endpoint connectivity
- Standard chart types (pie, bar, line, table, histogram)
- Calculated fields
- Data extraction and caching
- Shareable dashboards
- Google ecosystem integration

#### Setup Steps
1. Add SPARQL community connector
2. Enter SPARQL endpoint URL
3. Define query and schema
4. Build visualizations

#### Limitations
- Endpoint must be publicly accessible (no authentication)
- Decimal separator format issues with some data
- Single data source per extraction (no blending)
- Manual schema definition required

#### Pros
- Completely free
- Easy to share
- Google integration
- No installation required

#### Cons
- No authentication support
- Limited to public endpoints
- Manual data type mapping

#### Rating: 3.5/5 for simple public data

---

### 1.4 Dataset Dashboard (KBSS-CVUT)

**Website:** https://onto.fel.cvut.cz/dataset-dashboard
**GitHub:** https://github.com/kbss-cvut/dataset-dashboard
**Cost:** Free (open source)

#### Overview
Academic tool designed to explore SPARQL endpoint content from multiple analytical perspectives.

#### Key Features
- RDF summaries and statistics
- Dataset relationship visualization
- GeoSPARQL support (maps)
- Temporal data visualization
- Docker deployment

#### Pros
- Purpose-built for RDF exploration
- GeoSPARQL support
- Open source

#### Cons
- Academic project (limited support)
- Less polished than commercial tools
- Limited chart variety

#### Rating: 3/5 for data exploration

---

## 2. BI Tools with SPARQL Bridges

### 2.1 Stardog BI/SQL Server + Tableau/Power BI

**Website:** https://www.stardog.com/blog/introducing-the-stardog-bi/sql-server/
**Cost:** Stardog license required

#### Overview
Stardog provides a SQL layer that automatically translates SQL queries to SPARQL, allowing any SQL-based BI tool to work with knowledge graph data.

#### How It Works
```
Tableau/Power BI --> SQL Query --> Stardog BI Server --> SPARQL --> Knowledge Graph
```

#### Supported BI Tools
- Tableau
- Power BI
- Any SQL-compatible tool

#### Pros
- No SPARQL knowledge required
- Use familiar BI tools
- Auto-generated schema
- Full BI tool capabilities

#### Cons
- Requires Stardog as triplestore
- Commercial license
- SQL-to-SPARQL translation limitations

#### Rating: 4/5 for BI-centric organizations

---

### 2.2 GraphDB JDBC Driver + BI Tools

**Website:** https://graphdb.ontotext.com/documentation/standard/sql-access-over-jdbc.html
**Cost:** GraphDB license required

#### Overview
GraphDB provides a JDBC driver that creates SQL views from SPARQL queries, enabling connectivity to Tableau, Power BI (via ODBC bridge), and other tools.

#### Key Features
- SQL views from SPARQL queries
- JDBC connectivity
- Works with Tableau directly
- Power BI via ODBC-JDBC bridge (e.g., Easysoft)

#### Pros
- Leverage existing BI investments
- GraphDB is mature triplestore
- SPARQL federation support

#### Cons
- Requires GraphDB
- Power BI needs additional bridge
- SQL view configuration needed

#### Rating: 3.5/5 for GraphDB users

---

## 3. Lightweight JavaScript Libraries

### 3.1 Sgvizler

**Website:** https://www.bobdc.com/blog/making-charts-out-of-sparql-qu/
**Cost:** Free (open source)

#### Overview
JavaScript library that generates charts from SPARQL query results. Embed in any HTML page.

#### Usage
```html
<div id="chart"
     data-sgvizler-query="SELECT ?x ?y WHERE {...}"
     data-sgvizler-endpoint="https://sparql.example.com"
     data-sgvizler-chart="google.visualization.PieChart">
</div>
```

#### Chart Types
- Pie charts
- Bar charts
- Line charts
- Tables
- Google Charts integration

#### Pros
- Simple to embed
- No server required
- Customizable

#### Cons
- Dated library
- Limited interactivity
- Requires HTML/JS knowledge

#### Rating: 2.5/5 for quick embeds

---

### 3.2 SPARQL-Visualizer

**GitHub:** https://github.com/MadsHolten/sparql-visualizer
**Cost:** Free (open source)

#### Overview
Angular-based web app for visualizing SPARQL results as force-directed graphs or tables.

#### Features
- Force graph visualization (D3.js)
- Table view for SELECT queries
- Built-in triplestore (rdfstore)
- Material Design UI

#### Pros
- Good for ontology exploration
- Interactive graph view
- Modern stack

#### Cons
- Graph-focused (not business charts)
- Requires deployment
- Limited chart types

#### Rating: 3/5 for graph exploration

---

## 4. Comparison Matrix

| Tool | SPARQL Native | Chart Types | Ease of Setup | Cost | Best Use Case |
|------|--------------|-------------|---------------|------|---------------|
| **Grafana + Plugin** | Yes | 15+ | Easy | Free | Dashboards, monitoring |
| **Metaphactory** | Yes | 10+ | Medium | Paid | Enterprise KG |
| **Looker Studio** | Yes (connector) | 10+ | Easy | Free | Public data dashboards |
| **Dataset Dashboard** | Yes | 5+ | Medium | Free | Data exploration |
| **Stardog + BI** | Via SQL | Full BI | Medium | Paid | BI-centric orgs |
| **GraphDB + JDBC** | Via SQL | Full BI | Hard | Paid | GraphDB users |
| **Sgvizler** | Yes | 8+ | Easy | Free | Simple embeds |
| **SPARQL-Visualizer** | Yes | 2 | Medium | Free | Graph exploration |

---

## 5. Recommendations by Use Case

### For General Dashboard Creation: **Grafana + SPARQL Plugin**

**Why:**
- Most versatile option
- Rich visualization library
- Active development
- Free and open source
- Can combine SPARQL with other data sources

### For Enterprise/Large Scale: **Metaphactory**

**Why:**
- Built for knowledge graphs
- Low-code approach
- Enterprise features (access control, federation)
- Professional support

### For Quick, Free Dashboards: **Looker Studio**

**Why:**
- Zero cost
- No installation
- Easy sharing
- Familiar Google interface

*Limitation:* Only works with public (unauthenticated) endpoints

### For Existing Tableau/Power BI Users: **Stardog or GraphDB with SQL Bridge**

**Why:**
- Leverage existing BI skills
- No SPARQL learning required
- Full BI tool capabilities

---

## 6. Next Steps

1. **Evaluate Grafana first** - Best balance of features, ease of use, and cost
2. **Test with your SPARQL endpoint** - Verify connectivity and query performance
3. **Prototype a dashboard** - Create sample visualizations with real data
4. **Assess user needs** - Determine if self-service or developer-built dashboards are needed

## 7. Prototype Implementation: Custom LINDAS Grafana Plugin

### The Problem with Standard SPARQL Plugins

The standard Grafana SPARQL plugin only provides a raw SPARQL query editor. It does NOT replicate the user experience of visualize.admin.ch which offers:
- Dataset browsing and search
- Automatic dimension discovery
- Visual query building

### Solution: Custom LINDAS Grafana Plugin

We created a forked/enhanced Grafana plugin (`grafana-lindas-plugin/`) that provides visualize.admin.ch-like functionality:

**Features:**
- **Dataset Browser**: Search and browse all LINDAS datasets
- **Dimension Selector**: Visual selection of data fields
- **Auto Query Generation**: Generates SPARQL automatically
- **Manual Mode**: Full SPARQL editor for advanced users

### How It Works

```
User Interface                    Backend
+------------------+              +------------------+
| 1. Select Dataset| -- browse -> | LINDAS Endpoint  |
| 2. Pick Dimensions| -- discover | lindas.admin.ch  |
| 3. View Chart    | <- query --- +------------------+
+------------------+
```

The plugin queries LINDAS for:
1. Available `cube:Cube` datasets (LIST_CUBES_QUERY)
2. Dimensions for selected cube (GET_CUBE_DIMENSIONS_QUERY)
3. Observation data (GENERATE_OBSERVATIONS_QUERY)

### Running the Prototype

```bash
cd grafana-lindas-plugin

# Build the plugin (requires Node.js 18+)
npm install
npm run build

# Start with Docker
docker-compose up -d

# Access at http://localhost:3001
```

### Plugin Structure

```
grafana-lindas-plugin/
  src/
    components/
      CubeSelector.tsx      # Dataset browser UI
      DimensionSelector.tsx # Dimension picker UI
      QueryEditor.tsx       # Combined editor with tabs
      ConfigEditor.tsx      # Datasource settings
    datasource.ts           # API methods for LINDAS
    sparql-queries.ts       # SPARQL query templates
    types.ts                # TypeScript interfaces
  proxy/
    server.js               # CORS proxy for SPARQL
  docker-compose.yml        # POC deployment
```

### Comparison: visualize.admin.ch vs LINDAS Plugin

| Feature | visualize.admin.ch | LINDAS Plugin |
|---------|-------------------|---------------|
| Dataset Browser | Yes | Yes |
| Dimension Selection | Yes | Yes |
| Auto Query Generation | Yes | Yes |
| Chart Types | 8 fixed | 15+ (Grafana) |
| Custom Queries | No | Yes (SPARQL editor) |
| Multi-source Dashboards | No | Yes |
| Alerting | No | Yes |
| Embedding | Yes | Yes |

---

## Sources

- [Grafana SPARQL Plugin](https://grafana.com/grafana/plugins/flandersmake-sparql-datasource/)
- [Grafana SPARQL GitHub](https://github.com/Flanders-Make-vzw/grafana-sparql-datasource)
- [Metaphactory](https://metaphacts.com/product)
- [Looker Studio SPARQL Guide](http://blog.sparna.fr/2022/10/18/dashboards-from-sparql-knowledge-graphs-using-looker-studio-google-data-studio/)
- [Dataset Dashboard](https://github.com/kbss-cvut/dataset-dashboard)
- [Stardog BI Server](https://www.stardog.com/blog/introducing-the-stardog-bi/sql-server/)
- [GraphDB JDBC](https://graphdb.ontotext.com/documentation/standard/sql-access-over-jdbc.html)
- [Sgvizler Guide](https://www.bobdc.com/blog/making-charts-out-of-sparql-qu/)
- [SPARQL-Visualizer](https://github.com/MadsHolten/sparql-visualizer)
- [Virtuoso + Tableau](https://medium.com/virtuoso-blog/virtuoso-tableau-sparql-f9411852a87d)
