# Architecture Overview

## System Architecture

```
+----------------+     +------------------+     +-------------------+
|   React        |---->|  Apache Superset |---->|   SPARQL Proxy    |
|   Frontend     |     |  (Charts/Dash)   |     |   (SQL->SPARQL)   |
|   :3000        |     |  :8088           |     |   :8089           |
+----------------+     +------------------+     +-------------------+
                                                         |
                              +---------------------------+
                              v
                       +-------------+
                       |   LINDAS    |
                       |   SPARQL    |
                       +-------------+
```

## Components

### 1. React Frontend (Port 3000)

The frontend application built with React, TypeScript, and Material-UI. It provides:

- **Home Page**: Overview and quick access to features
- **Data Cube Browser**: Search and explore LINDAS data cubes
- **Dashboard Embedding**: Display Superset dashboards in iframes
- **Chart Embedding**: Display individual Superset charts
- **GraphQL Playground**: Interactive query interface

**Key Technologies:**
- React 18
- TypeScript
- Material-UI (MUI)
- Vite (build tool)
- @tanstack/react-query (data fetching)
- @superset-ui/embedded-sdk (Superset embedding)

### 2. Apache Superset (Port 8088)

Apache Superset is used as the visualization engine. It's configured with:

- **Embedding enabled**: Charts and dashboards can be embedded via guest tokens
- **CORS configured**: Allows requests from the frontend
- **Custom theme**: Styled to match the application

**Key Configuration:**
- `EMBEDDED_SUPERSET: True`
- `GUEST_ROLE_NAME: "Gamma"`
- PostgreSQL backend for metadata
- Redis for caching and Celery

### 3. SPARQL Proxy (Port 8089)

A FastAPI-based proxy service that:

- Translates SQL queries to SPARQL
- Provides a REST API for cube exploration
- Provides a GraphQL API for data access
- Caches query results

**API Endpoints:**
- `GET /api/v1/health` - Health check
- `POST /api/v1/query` - Execute SQL (translated to SPARQL)
- `POST /api/v1/sparql` - Execute raw SPARQL
- `GET /api/v1/cubes` - List data cubes
- `GET /api/v1/schema/{cube_id}` - Get cube schema
- `/graphql` - GraphQL endpoint

### 4. LINDAS SPARQL Endpoints

Swiss Federal Linked Data Service endpoints:

| Environment | URL |
|-------------|-----|
| Production | `https://lindas-cached.cluster.ldbar.ch/query` |
| Integration | `https://lindas-cached.int.cluster.ldbar.ch/query` |
| Test | `https://lindas-cached.test.cluster.ldbar.ch/query` |

## Data Flow

### 1. Direct SPARQL Query Flow

```
User -> Frontend -> SPARQL Proxy -> LINDAS
                         |
                    GraphQL/REST API
```

### 2. Superset Chart Flow

```
User -> Frontend -> Superset -> SPARQL Proxy -> LINDAS
              |          |
         Guest Token   SQL Query
```

### 3. SQL-to-SPARQL Translation

```sql
-- Input SQL
SELECT name, value FROM my_cube WHERE year = 2023 LIMIT 100
```

```sparql
-- Generated SPARQL
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ?name ?value
WHERE {
  ?observation a cube:Observation ;
    cube:observedBy <https://...my_cube> ;
    schema:name ?name ;
    schema:value ?value .
  FILTER(?year = 2023)
}
LIMIT 100
```

## Docker Architecture

```yaml
services:
  postgres:      # Superset metadata database
  redis:         # Caching and Celery broker
  sparql-proxy:  # SQL-to-SPARQL translation
  superset:      # Visualization engine
  superset-init: # One-time initialization
  superset-worker: # Background task processing
  frontend:      # React application
```

## Security Considerations

1. **Guest Tokens**: Superset uses JWT-based guest tokens for embedding
2. **CORS**: Configured to allow only trusted origins
3. **Sandboxed iframes**: Embedded content uses iframe sandbox attributes
4. **No direct database access**: All queries go through the SPARQL proxy

## Scalability

- **Horizontal scaling**: SPARQL Proxy and Frontend are stateless
- **Caching**: Redis caching reduces LINDAS endpoint load
- **Connection pooling**: PostgreSQL connection pools for Superset
