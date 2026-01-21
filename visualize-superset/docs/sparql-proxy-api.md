# SPARQL Proxy REST API

The SPARQL Proxy provides a REST API for querying LINDAS data cubes.

## Base URL

```
http://localhost:8089
```

## Endpoints

### Health Check

```http
GET /api/v1/health
```

Returns the health status of the proxy service.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "endpoints": {
    "prod": "https://lindas-cached.cluster.ldbar.ch/query",
    "int": "https://lindas-cached.int.cluster.ldbar.ch/query",
    "test": "https://lindas-cached.test.cluster.ldbar.ch/query"
  }
}
```

### Execute SQL Query

```http
POST /api/v1/query
Content-Type: application/json
```

Executes a SQL query by translating it to SPARQL.

**Request Body:**
```json
{
  "sql": "SELECT name, value FROM my_cube LIMIT 100",
  "endpoint": "prod",
  "cube_mapping": {
    "my_cube": "https://environment.ld.admin.ch/foen/cube/example"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sql | string | Yes | SQL SELECT query |
| endpoint | string | No | LINDAS endpoint (prod, int, test). Default: prod |
| cube_mapping | object | No | Mapping of table names to cube URIs |

**Response:**
```json
{
  "columns": ["name", "value"],
  "rows": [
    {"name": "Example 1", "value": 100},
    {"name": "Example 2", "value": 200}
  ],
  "sparql_query": "PREFIX cube: ...",
  "execution_time_ms": 150
}
```

### Execute SPARQL Query

```http
POST /api/v1/sparql
Content-Type: application/json
```

Executes a raw SPARQL query against LINDAS.

**Request Body:**
```json
{
  "query": "SELECT ?cube ?title WHERE { ?cube a cube:Cube ; schema:name ?title } LIMIT 10",
  "endpoint": "prod"
}
```

**Response:**
```json
{
  "columns": ["cube", "title"],
  "rows": [
    {"cube": "https://...", "title": "Example Cube"}
  ],
  "sparql_query": "...",
  "execution_time_ms": 200
}
```

### List Data Cubes

```http
GET /api/v1/cubes
```

Lists available data cubes from LINDAS.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| endpoint | string | No | LINDAS endpoint. Default: prod |
| search | string | No | Search term to filter cubes |
| limit | integer | No | Maximum results (1-1000). Default: 100 |
| offset | integer | No | Pagination offset. Default: 0 |

**Example:**
```http
GET /api/v1/cubes?endpoint=prod&search=environment&limit=20
```

**Response:**
```json
[
  {
    "iri": "https://environment.ld.admin.ch/foen/cube/example",
    "identifier": "example",
    "title": "Example Environmental Data",
    "description": "Sample data cube description",
    "publisher": "Federal Office for the Environment"
  }
]
```

### Get Cube Schema

```http
GET /api/v1/schema/{cube_id}
```

Gets the schema (dimensions/measures) of a specific cube.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cube_id | string | Cube IRI or identifier |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| endpoint | string | No | LINDAS endpoint. Default: prod |

**Example:**
```http
GET /api/v1/schema/https%3A%2F%2Fenvironment.ld.admin.ch%2Ffoen%2Fcube%2Fexample?endpoint=prod
```

**Response:**
```json
{
  "cube_iri": "https://environment.ld.admin.ch/foen/cube/example",
  "columns": [
    {
      "name": "year",
      "iri": "https://environment.ld.admin.ch/foen/cube/example/year",
      "label": "Year",
      "type": "temporalDimension",
      "data_type": "xsd:gYear"
    },
    {
      "name": "canton",
      "iri": "https://environment.ld.admin.ch/foen/cube/example/canton",
      "label": "Canton",
      "type": "dimension",
      "data_type": null
    },
    {
      "name": "value",
      "iri": "https://environment.ld.admin.ch/foen/cube/example/value",
      "label": "Measured Value",
      "type": "measure",
      "data_type": "xsd:decimal"
    }
  ]
}
```

### List Available Endpoints

```http
GET /api/v1/endpoints
```

Lists all available LINDAS SPARQL endpoints.

**Response:**
```json
{
  "prod": {
    "url": "https://lindas-cached.cluster.ldbar.ch/query",
    "name": "PROD"
  },
  "int": {
    "url": "https://lindas-cached.int.cluster.ldbar.ch/query",
    "name": "INT"
  },
  "test": {
    "url": "https://lindas-cached.test.cluster.ldbar.ch/query",
    "name": "TEST"
  }
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "detail": "Error message describing the problem"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 500 | Internal Server Error (SPARQL execution failed) |

## SQL Support

The SQL-to-SPARQL translator supports:

- `SELECT` statements with column lists or `*`
- `FROM` clause with table name or cube URI
- `WHERE` clause with basic comparisons (=, !=, <, <=, >, >=, LIKE)
- `GROUP BY` clause
- `ORDER BY` clause (ASC/DESC)
- `LIMIT` and `OFFSET` clauses
- Aggregate functions: COUNT, SUM, AVG, MIN, MAX
- `DISTINCT` keyword

**Limitations:**
- JOINs are not supported
- Subqueries are not supported
- UNION is not supported
- Complex expressions in SELECT are limited
