# Development Log

This document logs the development decisions and implementation details for the visualize-superset project.

## Project Creation Date

2026-01-21

## Implementation Summary

### Phase 1: Project Structure and Docker Infrastructure

Created the base project structure with Docker Compose configuration for orchestrating all services:

1. **docker-compose.yml**: Main orchestration file with services:
   - PostgreSQL 14 (Superset metadata storage)
   - Redis 7 (caching and Celery broker)
   - SPARQL Proxy (custom FastAPI service)
   - Apache Superset 4.0 (visualization engine)
   - Superset Worker (Celery background tasks)
   - React Frontend (custom UI)

2. **Environment Configuration**: Created `.env.example` with configurable options for all services.

### Phase 2: SPARQL Proxy Service

Implemented a FastAPI-based proxy service that bridges SQL/GraphQL to SPARQL:

**Files Created:**
- `sparql-proxy/src/main.py` - FastAPI application with REST endpoints
- `sparql-proxy/src/sparql/client.py` - SPARQL client with caching
- `sparql-proxy/src/sparql/namespaces.py` - RDF namespace definitions matching visualization-tool
- `sparql-proxy/src/sql/parser.py` - SQL query parser using sqlparse
- `sparql-proxy/src/sql/translator.py` - SQL to SPARQL translator
- `sparql-proxy/src/graphql/schema.py` - Strawberry GraphQL schema

**Key Design Decisions:**

1. **Namespace Compatibility**: Used the same RDF namespaces as the visualization-tool project:
   - `cube:` - https://cube.link/
   - `cubeView:` - https://cube.link/view/
   - `cubeMeta:` - https://cube.link/meta/
   - Plus standard vocabularies (schema.org, DCT, DCAT, etc.)

2. **Caching Strategy**: Implemented TTL-based caching using `cachetools` to reduce load on LINDAS endpoints.

3. **Multi-endpoint Support**: Supports all three LINDAS environments (prod, int, test).

4. **GraphQL API**: Added GraphQL support using Strawberry for a modern query interface.

### Phase 3: Apache Superset Configuration

Configured Superset for embedding and LINDAS integration:

**Files Created:**
- `superset/Dockerfile` - Custom Superset image
- `superset/superset_config.py` - Configuration with embedding features
- `superset/requirements.txt` - Python dependencies

**Key Configuration:**
- `EMBEDDED_SUPERSET: True` - Enable embedded dashboards
- `EMBEDDABLE_CHARTS: True` - Enable embedded charts
- CORS configured for frontend origin
- Guest token authentication for embedding
- Redis caching for performance

### Phase 4: React Frontend

Built a modern React frontend with TypeScript and Material-UI:

**Files Created:**
- `frontend/src/App.tsx` - Main application with routing
- `frontend/src/components/Layout/` - Application layout with navigation
- `frontend/src/components/SupersetEmbed/` - Superset embedding component
- `frontend/src/components/CubeSelector/` - Data cube browser
- `frontend/src/services/superset.ts` - Superset API service
- `frontend/src/services/lindas.ts` - LINDAS/SPARQL Proxy service
- `frontend/src/pages/` - Application pages

**Key Features:**
- Responsive Material-UI design
- Data cube browsing with search and filtering
- Superset dashboard and chart embedding
- GraphQL playground interface
- React Query for data fetching and caching

### Phase 5: Scripts and Documentation

Created setup scripts and comprehensive documentation:

**Scripts:**
- `scripts/setup.sh` - Linux/Mac setup script
- `scripts/setup.bat` - Windows setup script
- `scripts/init-superset.sh` - Superset initialization

**Documentation:**
- `docs/README.md` - Documentation index
- `docs/architecture.md` - System architecture
- `docs/getting-started.md` - Setup instructions
- `docs/development-log.md` - This file

## Technical Decisions

### Why FastAPI for SPARQL Proxy?

1. **Async Support**: Native async/await for handling multiple SPARQL queries efficiently
2. **GraphQL Integration**: Easy integration with Strawberry GraphQL
3. **OpenAPI Documentation**: Automatic API documentation
4. **Performance**: High performance with uvicorn

### Why SQL-to-SPARQL Translation?

1. **Superset Compatibility**: Superset uses SQL for queries
2. **Familiar Syntax**: SQL is more familiar to data analysts
3. **Abstraction**: Hides SPARQL complexity from end users

### Why Strawberry GraphQL?

1. **Type Safety**: Python type hints for schema definition
2. **FastAPI Integration**: Native async support and easy integration
3. **Modern API**: Async resolvers and subscriptions support

### Why Material-UI?

1. **Enterprise Ready**: Comprehensive component library
2. **Consistent Design**: Built-in design system
3. **Accessibility**: ARIA-compliant components
4. **Customization**: Theming support

## Known Limitations

1. **SQL Translation**: The SQL-to-SPARQL translator supports basic SELECT queries. Complex joins and subqueries are not fully supported.

2. **Authentication**: The current implementation uses a simple admin login for guest token generation. Production deployments should implement proper authentication.

3. **Cube Discovery**: The cube mapping from SQL table names to cube URIs uses a convention-based approach. A more robust mapping system may be needed for complex scenarios.

## Phase 6: Superset 4.0 Compatibility Fixes (2026-01-23)

### Issues Encountered

1. **Dependency Conflicts**: Superset 4.0 has specific version requirements for celery (>=5.3.6) and redis (<5.0), which conflicted with pinned versions in requirements.txt.

2. **JWT Secret Requirement**: Superset 4.0's async query manager requires a JWT secret of at least 32 bytes, even when GLOBAL_ASYNC_QUERIES is disabled.

3. **TypeScript Errors**: The SupersetEmbed component had unused variables that caused build failures.

### Solutions Implemented

1. **Fixed requirements.txt**: Removed pinned versions for celery, redis, and sqlalchemy to let apache-superset manage its own dependencies.

2. **Updated superset_config.py**:
   - Added default secret key with 42+ characters
   - Added length check to ensure SECRET_KEY is at least 32 bytes
   - Disabled GLOBAL_ASYNC_QUERIES feature flag
   - Added GLOBAL_ASYNC_QUERIES_JWT_SECRET setting

3. **Fixed SupersetEmbed.tsx**: Renamed unused `filters` prop to `_filters` with void statement, removed unused `mounted` state.

### Testing Results

- SPARQL Proxy: Working, health endpoint responding
- Frontend: Working, successfully fetching cubes from LINDAS
- Superset: Working, database connection established
- Database: PostgreSQL "LINDAS Data" database connected and exposed in SQL Lab

### Services Running

| Service | Port | Status |
|---------|------|--------|
| Frontend | 3000 | Healthy |
| Superset | 8088 | Healthy |
| SPARQL Proxy | 8089 | Healthy |
| PostgreSQL | 5432 | Healthy |
| Redis | 6379 | Healthy |

## Future Enhancements

1. **Advanced SQL Support**: Extend SQL-to-SPARQL translation for complex queries
2. **User Authentication**: Implement OAuth/OIDC for user authentication
3. **Chart Builder**: Add a visual chart builder interface
4. **Data Export**: Add support for exporting data to CSV/Excel
5. **Saved Queries**: Allow users to save and share queries
6. **Trino/Presto Integration**: Add Trino connector for native SPARQL-to-SQL federation
