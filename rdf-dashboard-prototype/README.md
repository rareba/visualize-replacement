# RDF Dashboard Prototype - Grafana + SPARQL POC

This prototype demonstrates the integration of **Grafana** with **SPARQL endpoints** as a replacement for custom visualization tools. It showcases how organizations can leverage mature, open-source dashboarding infrastructure to visualize RDF/Linked Data without maintaining custom frontend code.

## Strategic Rationale

Instead of forking Grafana or maintaining custom visualization code, this approach:

1. **Uses Grafana as-is** - Leverages the mature, well-supported Grafana platform
2. **Extends via plugins** - Uses the Flanders Make SPARQL Datasource plugin
3. **Zero frontend maintenance** - All dashboard features are provided by Grafana
4. **Focus on data engineering** - Effort shifts to high-value SPARQL query optimization

## Architecture

```
+------------------+     +---------------------+     +------------------+
|     Grafana      | --> | SPARQL Datasource   | --> | SPARQL Endpoints |
|   (Frontend)     |     | Plugin (Comunica)   |     | (LINDAS, etc.)   |
+------------------+     +---------------------+     +------------------+
        |
        v
+------------------+
| Pre-provisioned  |
| Dashboards + DS  |
+------------------+
```

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Start the prototype:**

   ```bash
   docker-compose up -d
   ```

2. **Access Grafana:**

   Open your browser and navigate to: http://localhost:3001

   - No login required - publicly accessible
   - The LINDAS Overview dashboard loads automatically as the home page

3. **Pre-configured dashboards:**

   Go to **Dashboards** > **LINDAS** folder to see:
   - **LINDAS Overview** - Queries the Swiss Federal LINDAS platform
   - **Wikidata Switzerland** - Queries Wikidata for Swiss-related data

## Pre-configured Data Sources

| Name | Endpoint | Description |
|------|----------|-------------|
| LINDAS Production | https://lindas.admin.ch/query | Swiss Federal Linked Data Service |
| Wikidata | https://query.wikidata.org/sparql | Wikidata Query Service |
| DBpedia | https://dbpedia.org/sparql | DBpedia SPARQL endpoint |

## Project Structure

```
rdf-dashboard-prototype/
├── docker-compose.yml              # Container orchestration
├── README.md                       # This file
├── provisioning/
│   ├── datasources/
│   │   └── datasources.yml         # Auto-configured SPARQL endpoints
│   └── dashboards/
│       └── dashboards.yml          # Dashboard provisioning config
└── dashboards/
    ├── lindas-overview.json        # LINDAS data exploration dashboard
    └── wikidata-example.json       # Wikidata Switzerland dashboard
```

## Creating New Dashboards

1. Navigate to **Dashboards** > **New** > **New Dashboard**
2. Add a panel and select a SPARQL datasource
3. Write your SPARQL query in the query editor
4. Choose a visualization type (table, bar chart, pie chart, etc.)
5. Save and optionally export as JSON

### Example SPARQL Query (for Grafana panels)

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?type ?label (COUNT(?instance) AS ?count) WHERE {
  ?instance rdf:type ?type .
  OPTIONAL { ?type rdfs:label ?label }
}
GROUP BY ?type ?label
ORDER BY DESC(?count)
LIMIT 20
```

## Visualization Types Supported

Grafana provides 20+ visualization types that work with SPARQL query results:

- **Tables** - Raw query results
- **Bar Charts** - Categorical comparisons
- **Pie Charts** - Distribution visualization
- **Time Series** - Temporal data (if SPARQL returns timestamps)
- **Stat Panels** - Single value metrics
- **Gauges** - Progress/status indicators
- **Heatmaps** - Dense data visualization
- **Geomap** - Geographic data (requires lat/lon)
- And many more...

## Advantages Over Custom Solutions

| Aspect | Custom Solution | Grafana + SPARQL |
|--------|----------------|------------------|
| Maintenance | High (frontend code) | Low (plugin only) |
| Features | Limited by dev capacity | Full Grafana ecosystem |
| Alerting | Must build | Built-in |
| Multi-tenancy | Must build | Built-in |
| Embedding | Must build | Built-in |
| Mobile | Must build | Responsive by default |
| Updates | Manual | Automatic |

## Cleanup

To stop and remove the container:

```bash
docker-compose down
```

To also remove the persistent volume:

```bash
docker-compose down -v
```

## Next Steps for Production

1. **Authentication**: Configure proper auth (OAuth, LDAP, etc.)
2. **HTTPS**: Set up SSL/TLS termination
3. **Performance**: Consider caching layers for heavy SPARQL queries
4. **Managed Service**: Consider Grafana Cloud for hosted option
5. **Custom Plugin**: If needed, contribute to or fork the SPARQL plugin (not Grafana itself)

## References

- [Grafana SPARQL Plugin](https://grafana.com/grafana/plugins/flandersmake-sparql-datasource/)
- [Flanders Make SPARQL Plugin GitHub](https://github.com/Flanders-Make-vzw/grafana-sparql-datasource)
- [LINDAS - Swiss Federal Linked Data](https://lindas.admin.ch)
- [Grafana Provisioning Docs](https://grafana.com/docs/grafana/latest/administration/provisioning/)
