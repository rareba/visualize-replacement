# Grafana SPARQL POC - Development Log

**Date:** 2025-12-16
**Task Reference:** ADNMUPS-1554 - Visualisation of Graph Data
**Author:** Development Team

---

## Decision Summary

After reviewing the profitability analysis and tool evaluation documents, the decision was made to create a Proof of Concept (POC) using **Grafana with the Flanders Make SPARQL Datasource plugin**.

### Key Decision Points

1. **NOT forking Grafana** - The analysis initially suggested "forking Grafana", but upon review this was clarified to mean "using Grafana with SPARQL plugin", not literally forking the codebase.

2. **Why not fork Grafana?**
   - Grafana is a massive codebase (~1M+ lines)
   - Forking creates long-term maintenance burden
   - The plugin architecture already supports SPARQL via existing community plugins
   - Forking would require tracking upstream security patches indefinitely

3. **Why use the plugin approach?**
   - Flanders Make SPARQL Datasource plugin already exists and works
   - Built on Comunica (robust SPARQL query engine)
   - Can be extended if needed without forking Grafana
   - Zero frontend maintenance required

---

## POC Implementation

### What Was Created

```
rdf-dashboard-prototype/
├── docker-compose.yml                    # Container orchestration
├── README.md                             # Documentation
├── provisioning/
│   ├── datasources/
│   │   └── datasources.yml               # Pre-configured SPARQL endpoints
│   └── dashboards/
│       └── dashboards.yml                # Dashboard provisioning
└── dashboards/
    ├── lindas-overview.json              # LINDAS data exploration
    └── wikidata-example.json             # Wikidata Switzerland data
```

### Pre-configured Data Sources

| Data Source | Endpoint URL | Purpose |
|-------------|--------------|---------|
| LINDAS Production | https://lindas.admin.ch/query | Swiss Federal Linked Data |
| Wikidata | https://query.wikidata.org/sparql | Reference data, examples |
| DBpedia | https://dbpedia.org/sparql | Additional Linked Data |

### Sample Dashboards

1. **LINDAS Overview** (`lindas-overview.json`)
   - Named graph count (stat panel)
   - Available datasets (table)
   - Top 10 RDF types (pie chart)
   - Top namespaces by predicate usage (bar chart)

2. **Wikidata Switzerland** (`wikidata-example.json`)
   - Swiss cantons by population (bar chart)
   - Swiss cities by population (table)
   - Swiss notable people by native language (pie chart)
   - Companies headquartered in Switzerland (stat)

### Configuration Choices

**Public Access (No Login)**
- `GF_AUTH_ANONYMOUS_ENABLED=true`
- `GF_AUTH_DISABLE_LOGIN_FORM=true`
- `GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer`

This ensures the dashboards are publicly accessible without requiring authentication, matching the requirement for public-facing visualization.

---

## Alignment with Profitability Analysis

The POC validates the recommendations from `adnovum-profitability-analysis.md`:

| Recommendation | POC Validation |
|----------------|----------------|
| Use Grafana + SPARQL plugin | Demonstrated with LINDAS endpoint |
| Zero custom frontend code | All visualizations via Grafana UI |
| Pre-built dashboards | Provisioning system auto-deploys dashboards |
| Focus on data engineering | SPARQL queries are the value-add, not UI code |

---

## Running the POC

```bash
cd rdf-dashboard-prototype
docker-compose up -d
```

Access at: http://localhost:3001

---

## Fork vs Plugin Discussion

### When Forking Grafana Core Might Be Necessary

After evaluating Visualize's capabilities, forking Grafana core may be required if:

1. **Deep UI Integration** - Visualize has tightly integrated RDF-aware components (entity browsers, ontology navigators) that cannot be built as plugins
2. **Cube Data Handling** - Custom cube data loading/caching mechanisms that require core modifications
3. **SHACL Integration** - Form generation based on SHACL shapes that needs deep framework access
4. **Performance Optimizations** - Core-level changes for large RDF dataset handling

### Alternatives Before Forking Core

| Approach | Effort | Maintenance | Best For |
|----------|--------|-------------|----------|
| Use existing plugin | Low | Low | Standard dashboards |
| Extend/fork SPARQL plugin | Medium | Medium | Custom query features |
| Create custom panel plugin | Medium | Medium | Custom visualizations |
| Create Grafana App plugin | High | High | Bundled solution |
| Fork Grafana Core | Very High | Very High | Deep integration needs |

### Recommendation

1. **Phase 1 (Current POC):** Validate with existing plugin
2. **Phase 2:** Identify specific gaps vs Visualize
3. **Phase 3:** If gaps are plugin-solvable, fork/extend the SPARQL plugin
4. **Phase 4:** Only fork Grafana core if absolutely necessary

---

## Next Steps

1. **Validate with stakeholders** - Demo the POC to FOEN/BAFU team
2. **Test real use cases** - Try migrating existing Visualize dashboards
3. **Gap analysis** - Document specific Visualize features missing from Grafana
4. **Performance testing** - Measure SPARQL query response times
5. **Evaluate plugin gaps** - Identify if plugin needs enhancement
6. **Decision point** - Fork plugin vs fork core based on gap analysis

---

## Technical Notes

### Plugin Details

- **Name:** flandersmake-sparql-datasource
- **GitHub:** https://github.com/Flanders-Make-vzw/grafana-sparql-datasource
- **License:** Apache 2.0
- **Technology:** Uses Comunica for SPARQL query execution

### Grafana Version

Using `grafana/grafana:latest` which auto-installs the SPARQL plugin on startup via `GF_INSTALL_PLUGINS` environment variable.

### Volume Mounts

- Provisioning files are mounted as read-only (`:ro`)
- Grafana data persisted in Docker volume `grafana-storage`

---

## References

- [Original Tool Evaluation](./rdf-visualization-evaluation.md)
- [Profitability Analysis](./adnovum-profitability-analysis.md)
- [POC README](../rdf-dashboard-prototype/README.md)
