"""
SPARQL Proxy - FastAPI application.
Provides REST and GraphQL APIs for accessing LINDAS SPARQL data.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from strawberry.fastapi import GraphQLRouter

from .sparql import (
    SPARQLClient,
    SPARQLQueryError,
    LindasEndpoint,
    ENDPOINT_URLS,
    get_sparql_client,
    close_sparql_client,
)
from .sql import translate_sql_to_sparql, SQLParseError, TranslationError
from .gql_schema import schema

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    logger.info("Starting SPARQL Proxy service")
    yield
    logger.info("Shutting down SPARQL Proxy service")
    await close_sparql_client()


# Create FastAPI app
app = FastAPI(
    title="SPARQL Proxy",
    description="SQL-to-SPARQL proxy and GraphQL API for LINDAS endpoints",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GraphQL router
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")


# Pydantic models

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    endpoints: Dict[str, str]


class SQLQueryRequest(BaseModel):
    """SQL query request."""
    sql: str = Field(..., description="SQL query to execute")
    endpoint: str = Field("prod", description="LINDAS endpoint (prod, int, test)")
    cube_mapping: Optional[Dict[str, str]] = Field(
        None,
        description="Optional mapping of table names to cube URIs"
    )


class SPARQLQueryRequest(BaseModel):
    """SPARQL query request."""
    query: str = Field(..., description="SPARQL query to execute")
    endpoint: str = Field("prod", description="LINDAS endpoint (prod, int, test)")


class QueryResponse(BaseModel):
    """Query response."""
    columns: List[str]
    rows: List[Dict[str, Any]]
    sparql_query: Optional[str] = None
    execution_time_ms: int


class CubeResponse(BaseModel):
    """Cube information response."""
    iri: str
    identifier: Optional[str]
    title: str
    description: Optional[str]
    publisher: Optional[str]


class SchemaColumn(BaseModel):
    """Column in a cube schema."""
    name: str
    iri: str
    label: Optional[str] = None
    type: str  # dimension, measure, temporalDimension
    data_type: Optional[str] = None


class SchemaResponse(BaseModel):
    """Cube schema response."""
    cube_iri: str
    columns: List[SchemaColumn]


# REST API endpoints

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        endpoints={
            name.value: url
            for name, url in ENDPOINT_URLS.items()
        }
    )


@app.post("/api/v1/query", response_model=QueryResponse)
async def execute_sql_query(request: SQLQueryRequest):
    """
    Execute a SQL query by translating it to SPARQL.

    The SQL query will be parsed and translated to a SPARQL query
    against the specified LINDAS endpoint.
    """
    import time

    try:
        endpoint = LindasEndpoint(request.endpoint)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid endpoint: {request.endpoint}. Must be one of: prod, int, test"
        )

    start_time = time.time()

    try:
        # Translate SQL to SPARQL
        sparql_query = translate_sql_to_sparql(
            request.sql,
            request.cube_mapping
        )

        # Execute SPARQL query
        client = get_sparql_client()
        results = await client.execute_query(sparql_query, endpoint)

        # Convert to table format
        rows = client.results_to_table(results)
        columns = results.get("head", {}).get("vars", [])

        end_time = time.time()

        return QueryResponse(
            columns=columns,
            rows=rows,
            sparql_query=sparql_query,
            execution_time_ms=int((end_time - start_time) * 1000)
        )

    except SQLParseError as e:
        raise HTTPException(status_code=400, detail=f"SQL parse error: {str(e)}")
    except TranslationError as e:
        raise HTTPException(status_code=400, detail=f"Translation error: {str(e)}")
    except SPARQLQueryError as e:
        raise HTTPException(status_code=500, detail=f"SPARQL query error: {str(e)}")


@app.post("/api/v1/sparql", response_model=QueryResponse)
async def execute_sparql_query(request: SPARQLQueryRequest):
    """
    Execute a raw SPARQL query.

    This endpoint allows direct SPARQL queries against LINDAS endpoints.
    """
    import time

    try:
        endpoint = LindasEndpoint(request.endpoint)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid endpoint: {request.endpoint}. Must be one of: prod, int, test"
        )

    start_time = time.time()

    try:
        client = get_sparql_client()
        results = await client.execute_query(request.query, endpoint)

        rows = client.results_to_table(results)
        columns = results.get("head", {}).get("vars", [])

        end_time = time.time()

        return QueryResponse(
            columns=columns,
            rows=rows,
            sparql_query=request.query,
            execution_time_ms=int((end_time - start_time) * 1000)
        )

    except SPARQLQueryError as e:
        raise HTTPException(status_code=500, detail=f"SPARQL query error: {str(e)}")


@app.get("/api/v1/cubes", response_model=List[CubeResponse])
async def list_cubes(
    endpoint: str = Query("prod", description="LINDAS endpoint"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    List available data cubes.

    Returns a list of data cubes from the specified LINDAS endpoint.
    """
    try:
        lindas_endpoint = LindasEndpoint(endpoint)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid endpoint: {endpoint}"
        )

    client = get_sparql_client()

    search_filter = ""
    if search:
        search_filter = f'FILTER(CONTAINS(LCASE(?title), LCASE("{search}")))'

    query = f"""
SELECT DISTINCT ?cube ?identifier ?title ?description ?publisher
WHERE {{
  ?cube a cube:Cube ;
        schema:name ?title .

  OPTIONAL {{ ?cube schema:identifier ?identifier }}
  OPTIONAL {{ ?cube schema:description ?description }}
  OPTIONAL {{ ?cube schema:publisher/schema:name ?publisher }}

  {search_filter}

  FILTER(LANG(?title) = "en" || LANG(?title) = "de" || LANG(?title) = "")
}}
ORDER BY ?title
LIMIT {limit}
OFFSET {offset}
"""

    try:
        results = await client.execute_query(query, lindas_endpoint)
        rows = client.results_to_table(results)

        return [
            CubeResponse(
                iri=row.get("cube", ""),
                identifier=row.get("identifier"),
                title=row.get("title", ""),
                description=row.get("description"),
                publisher=row.get("publisher"),
            )
            for row in rows
        ]
    except SPARQLQueryError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cubes: {str(e)}")


@app.get("/api/v1/schema/{cube_id:path}", response_model=SchemaResponse)
async def get_cube_schema(
    cube_id: str,
    endpoint: str = Query("prod", description="LINDAS endpoint"),
):
    """
    Get the schema (dimensions/measures) of a cube.

    The cube_id can be either:
    - A full IRI (e.g., https://environment.ld.admin.ch/foen/cube/...)
    - A local identifier that will be expanded
    """
    try:
        lindas_endpoint = LindasEndpoint(endpoint)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid endpoint: {endpoint}"
        )

    # Expand cube_id if needed
    if not cube_id.startswith("http"):
        cube_iri = f"https://environment.ld.admin.ch/foen/cube/{cube_id}"
    else:
        cube_iri = cube_id

    client = get_sparql_client()

    query = f"""
SELECT DISTINCT ?dimension ?label ?dimensionType ?dataType
WHERE {{
  <{cube_iri}> cube:observationConstraint ?constraint .
  ?constraint sh:property ?shape .
  ?shape sh:path ?dimension .

  OPTIONAL {{ ?dimension schema:name ?label }}
  OPTIONAL {{ ?shape cubeMeta:dimensionType ?dimensionType }}
  OPTIONAL {{ ?shape sh:datatype ?dataType }}

  FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "" || !BOUND(?label))
}}
"""

    try:
        results = await client.execute_query(query, lindas_endpoint)
        rows = client.results_to_table(results)

        columns = []
        for row in rows:
            dim_iri = row.get("dimension", "")
            dim_type = row.get("dimensionType", "dimension")
            if dim_type:
                dim_type = dim_type.split("/")[-1] if "/" in dim_type else dim_type

            # Extract the local name from the IRI
            dim_name = dim_iri.split("/")[-1] if "/" in dim_iri else dim_iri
            dim_name = dim_name.split("#")[-1] if "#" in dim_name else dim_name

            # Use label if available, otherwise use the extracted name
            label = row.get("label") or dim_name

            columns.append(SchemaColumn(
                name=dim_name,
                iri=dim_iri,
                label=label,
                type=dim_type or "dimension",
                data_type=row.get("dataType"),
            ))

        return SchemaResponse(
            cube_iri=cube_iri,
            columns=columns
        )
    except SPARQLQueryError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch schema: {str(e)}")


@app.get("/api/v1/endpoints")
async def list_endpoints():
    """List available LINDAS endpoints."""
    return {
        name.value: {
            "url": url,
            "name": name.value.upper(),
        }
        for name, url in ENDPOINT_URLS.items()
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "SPARQL Proxy",
        "version": "1.0.0",
        "description": "SQL-to-SPARQL proxy and GraphQL API for LINDAS endpoints",
        "endpoints": {
            "health": "/api/v1/health",
            "sql_query": "POST /api/v1/query",
            "sparql_query": "POST /api/v1/sparql",
            "cubes": "GET /api/v1/cubes",
            "schema": "GET /api/v1/schema/{cube_id}",
            "graphql": "/graphql",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8089)
