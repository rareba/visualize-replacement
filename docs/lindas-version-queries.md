# LINDAS Version Analysis - SPARQL Queries

All queries target the LINDAS SPARQL endpoint: `https://ld.admin.ch/query`

**IMPORTANT**: In LINDAS, each cube's data lives in a named graph. Use `FROM <graphIRI>` to scope queries to a specific graph.

---

## Graph Structure

```
Graph IRI:  https://lindas.admin.ch/sfoe/cube
Cube IRI:   https://energy.ld.admin.ch/sfoe/bfe_ogd84_einmalverguetung_fuer_photovoltaikanlagen/9
```

---

## 1. List All Graphs and Their Cubes

```sparql
PREFIX cube: <https://cube.link/>

SELECT DISTINCT ?graph ?cube WHERE {
  GRAPH ?graph {
    ?cube a cube:Cube .
  }
}
ORDER BY ?graph
```

## 2. Count Observations in a Specific Graph

```sparql
PREFIX cube: <https://cube.link/>

SELECT (COUNT(?obs) as ?totalObs)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?cube a cube:Cube .
  ?cube cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
}
```

## 3. Count Triples in a Specific Graph

```sparql
PREFIX cube: <https://cube.link/>

SELECT (COUNT(*) as ?tripleCount)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?obs a cube:Observation .
  ?obs ?p ?o .
}
```

## 4. List Cube Versions in a Graph

```sparql
PREFIX cube: <https://cube.link/>

SELECT ?cube ?versionNum (COUNT(?obs) as ?obsCount)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?cube a cube:Cube .
  ?cube cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
  BIND(xsd:integer(REPLACE(STR(?cube), "^.*/([0-9]+)$", "$1")) AS ?versionNum)
  FILTER(REGEX(STR(?cube), "/[0-9]+$"))
}
GROUP BY ?cube ?versionNum
ORDER BY DESC(?versionNum)
```

## 5. Find Cube Families with Version Counts (per Graph)

```sparql
PREFIX cube: <https://cube.link/>

SELECT ?baseCube (MAX(?versionNum) as ?latestVersion) (COUNT(?cube) as ?versionCount)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?cube a cube:Cube .
  BIND(REPLACE(STR(?cube), "/[0-9]+$", "") AS ?baseCube)
  BIND(xsd:integer(REPLACE(STR(?cube), "^.*/([0-9]+)$", "$1")) AS ?versionNum)
  FILTER(REGEX(STR(?cube), "/[0-9]+$"))
}
GROUP BY ?baseCube
ORDER BY DESC(?versionCount)
```

## 6. Get Observations Per Version (for Retention Calculation)

```sparql
PREFIX cube: <https://cube.link/>

SELECT ?baseCube ?versionNum (COUNT(?obs) as ?obsCount)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?cube a cube:Cube .
  ?cube cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
  BIND(REPLACE(STR(?cube), "/[0-9]+$", "") AS ?baseCube)
  BIND(xsd:integer(REPLACE(STR(?cube), "^.*/([0-9]+)$", "$1")) AS ?versionNum)
  FILTER(REGEX(STR(?cube), "/[0-9]+$"))
}
GROUP BY ?baseCube ?versionNum
ORDER BY ?baseCube DESC(?versionNum)
```

## 7. Summary Statistics for a Graph

```sparql
PREFIX cube: <https://cube.link/>

SELECT
  (COUNT(DISTINCT ?cube) as ?totalCubes)
  (COUNT(?obs) as ?totalObs)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?cube a cube:Cube .
  ?cube cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
}
```

---

## Cross-Graph Queries (Database-Wide)

**Note**: These query across ALL graphs. Use sparingly as they are resource-intensive.

### List All Graphs with Cube Counts

```sparql
PREFIX cube: <https://cube.link/>

SELECT ?graph (COUNT(DISTINCT ?cube) as ?cubeCount) WHERE {
  GRAPH ?graph {
    ?cube a cube:Cube .
  }
}
GROUP BY ?graph
ORDER BY DESC(?cubeCount)
```

### Find Graphs with Most Versions

```sparql
PREFIX cube: <https://cube.link/>

SELECT ?graph ?baseCube (COUNT(?cube) as ?versionCount) WHERE {
  GRAPH ?graph {
    ?cube a cube:Cube .
    FILTER(REGEX(STR(?cube), "/[0-9]+$"))
  }
  BIND(REPLACE(STR(?cube), "/[0-9]+$", "") AS ?baseCube)
}
GROUP BY ?graph ?baseCube
HAVING(COUNT(?cube) > 10)
ORDER BY DESC(?versionCount)
LIMIT 30
```

---

## Python Script for Retention Calculation

After running Query #6, process the results:

```python
import json
from collections import defaultdict

# Load JSON results from Query #6
data = json.load(open('query6_results.json'))
cube_data = defaultdict(list)

for binding in data['results']['bindings']:
    base = binding['baseCube']['value']
    version = int(binding['versionNum']['value'])
    count = int(binding['obsCount']['value'])
    cube_data[base].append((version, count))

total_obs = 0
newest_2_obs = 0
newest_3_obs = 0

for base, versions in cube_data.items():
    versions.sort(key=lambda x: -x[0])  # Sort by version descending
    for i, (ver, count) in enumerate(versions):
        total_obs += count
        if i < 2:
            newest_2_obs += count
        if i < 3:
            newest_3_obs += count

print(f'Total cube families: {len(cube_data)}')
print(f'Total observations: {total_obs:,}')
print(f'Newest 2 versions: {newest_2_obs:,} ({newest_2_obs*100/total_obs:.1f}%)')
print(f'Newest 3 versions: {newest_3_obs:,} ({newest_3_obs*100/total_obs:.1f}%)')
```

---

## cURL Examples

### Query a Specific Graph

```bash
curl -X POST "https://ld.admin.ch/query" \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/sparql-results+json" \
  --data 'PREFIX cube: <https://cube.link/>
SELECT (COUNT(?obs) as ?totalObs)
FROM <https://lindas.admin.ch/sfoe/cube>
WHERE {
  ?cube a cube:Cube .
  ?cube cube:observationSet ?obsSet .
  ?obsSet cube:observation ?obs .
}'
```

### Save Results to File

```bash
curl -X POST "https://ld.admin.ch/query" \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/sparql-results+json" \
  --data-binary @query.sparql \
  -o results.json
```

---

## Common Graph IRIs

| Domain | Graph IRI |
|--------|-----------|
| **Energy (SFOE)** | **`https://lindas.admin.ch/sfoe/cube`** (used in examples) |
| Energy (ELCOM) | `https://lindas.admin.ch/elcom/electricityprice` |
| Health (FSVO) | `https://lindas.admin.ch/fsvo/cube` |
| Environment (FOEN) | `https://lindas.admin.ch/foen/cube` |
| Culture (SFA) | `https://lindas.admin.ch/sfa/cube` |
| Agriculture (FOAG) | `https://lindas.admin.ch/foag/cube` |
| Communication (OFCOM) | `https://lindas.admin.ch/ofcom/cube` |

---

*Updated: 2026-01-23*
*Fixed: Added FROM <graphIRI> clauses for proper graph scoping*
