"""
GraphQL schema for LINDAS data access.
Provides a GraphQL API for querying cube data from LINDAS SPARQL endpoints.
"""

import strawberry
from strawberry.types import Info
from typing import List, Optional, Any, Dict
from enum import Enum
import logging
from datetime import datetime

from ..sparql import (
    get_sparql_client,
    LindasEndpoint,
    SPARQLQueryError,
)

logger = logging.getLogger(__name__)


# Scalar types for flexible data
JSON = strawberry.scalar(
    Dict[str, Any],
    serialize=lambda v: v,
    parse_value=lambda v: v,
)


@strawberry.enum
class Endpoint(Enum):
    """Available LINDAS endpoints."""
    PROD = "prod"
    INT = "int"
    TEST = "test"


@strawberry.type
class CubeInfo:
    """Basic information about a data cube."""
    iri: str
    identifier: str
    title: str
    description: Optional[str] = None
    publisher: Optional[str] = None
    date_published: Optional[str] = None
    date_modified: Optional[str] = None
    version: Optional[str] = None
    themes: List[str] = strawberry.field(default_factory=list)


@strawberry.type
class Dimension:
    """A dimension of a data cube."""
    iri: str
    identifier: str
    label: str
    description: Optional[str] = None
    dimension_type: str = "dimension"  # dimension, measure, temporalDimension
    data_type: Optional[str] = None
    unit: Optional[str] = None
    scale_type: Optional[str] = None  # nominal, ordinal, interval, ratio


@strawberry.type
class DimensionValue:
    """A value in a dimension."""
    iri: str
    label: str
    position: Optional[int] = None


@strawberry.type
class Observation:
    """A single observation from a cube."""
    iri: str
    values: JSON


@strawberry.type
class QueryResult:
    """Result of a SPARQL query."""
    columns: List[str]
    rows: List[JSON]
    total_count: Optional[int] = None
    execution_time_ms: int = 0


@strawberry.type
class CubeData:
    """Data from a cube query."""
    cube: CubeInfo
    dimensions: List[Dimension]
    observations: List[Observation]
    total_count: int


@strawberry.type
class Query:
    """GraphQL Query root."""

    @strawberry.field
    async def cubes(
        self,
        info: Info,
        endpoint: Endpoint = Endpoint.PROD,
        search: Optional[str] = None,
        theme: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[CubeInfo]:
        """
        List available data cubes.

        Args:
            endpoint: The LINDAS endpoint to query
            search: Optional search term to filter cubes
            theme: Optional theme to filter by
            limit: Maximum number of results
            offset: Offset for pagination
        """
        client = get_sparql_client()
        lindas_endpoint = LindasEndpoint(endpoint.value)

        query = _build_cubes_query(search, theme, limit, offset)

        try:
            results = await client.execute_query(query, lindas_endpoint)
            return _parse_cubes_results(results)
        except SPARQLQueryError as e:
            logger.error(f"Failed to fetch cubes: {e}")
            return []

    @strawberry.field
    async def cube(
        self,
        info: Info,
        iri: str,
        endpoint: Endpoint = Endpoint.PROD,
    ) -> Optional[CubeInfo]:
        """
        Get information about a specific cube.

        Args:
            iri: The IRI of the cube
            endpoint: The LINDAS endpoint to query
        """
        client = get_sparql_client()
        lindas_endpoint = LindasEndpoint(endpoint.value)

        query = _build_cube_info_query(iri)

        try:
            results = await client.execute_query(query, lindas_endpoint)
            cubes = _parse_cubes_results(results)
            return cubes[0] if cubes else None
        except SPARQLQueryError as e:
            logger.error(f"Failed to fetch cube {iri}: {e}")
            return None

    @strawberry.field
    async def cube_dimensions(
        self,
        info: Info,
        cube_iri: str,
        endpoint: Endpoint = Endpoint.PROD,
    ) -> List[Dimension]:
        """
        Get dimensions of a cube.

        Args:
            cube_iri: The IRI of the cube
            endpoint: The LINDAS endpoint to query
        """
        client = get_sparql_client()
        lindas_endpoint = LindasEndpoint(endpoint.value)

        query = _build_dimensions_query(cube_iri)

        try:
            results = await client.execute_query(query, lindas_endpoint)
            return _parse_dimensions_results(results)
        except SPARQLQueryError as e:
            logger.error(f"Failed to fetch dimensions for {cube_iri}: {e}")
            return []

    @strawberry.field
    async def dimension_values(
        self,
        info: Info,
        cube_iri: str,
        dimension_iri: str,
        endpoint: Endpoint = Endpoint.PROD,
        limit: int = 1000,
    ) -> List[DimensionValue]:
        """
        Get values for a specific dimension.

        Args:
            cube_iri: The IRI of the cube
            dimension_iri: The IRI of the dimension
            endpoint: The LINDAS endpoint to query
            limit: Maximum number of values to return
        """
        client = get_sparql_client()
        lindas_endpoint = LindasEndpoint(endpoint.value)

        query = _build_dimension_values_query(cube_iri, dimension_iri, limit)

        try:
            results = await client.execute_query(query, lindas_endpoint)
            return _parse_dimension_values_results(results)
        except SPARQLQueryError as e:
            logger.error(f"Failed to fetch dimension values: {e}")
            return []

    @strawberry.field
    async def observations(
        self,
        info: Info,
        cube_iri: str,
        endpoint: Endpoint = Endpoint.PROD,
        filters: Optional[JSON] = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[Observation]:
        """
        Get observations from a cube.

        Args:
            cube_iri: The IRI of the cube
            endpoint: The LINDAS endpoint to query
            filters: Optional filters as {dimension_iri: value}
            limit: Maximum number of results
            offset: Offset for pagination
        """
        client = get_sparql_client()
        lindas_endpoint = LindasEndpoint(endpoint.value)

        query = _build_observations_query(cube_iri, filters, limit, offset)

        try:
            results = await client.execute_query(query, lindas_endpoint)
            return _parse_observations_results(results)
        except SPARQLQueryError as e:
            logger.error(f"Failed to fetch observations: {e}")
            return []

    @strawberry.field
    async def execute_sparql(
        self,
        info: Info,
        query: str,
        endpoint: Endpoint = Endpoint.PROD,
    ) -> QueryResult:
        """
        Execute a raw SPARQL query.

        Args:
            query: The SPARQL query to execute
            endpoint: The LINDAS endpoint to query
        """
        import time

        client = get_sparql_client()
        lindas_endpoint = LindasEndpoint(endpoint.value)

        start_time = time.time()

        try:
            results = await client.execute_query(query, lindas_endpoint)
            end_time = time.time()

            rows = client.results_to_table(results)
            columns = results.get("head", {}).get("vars", [])

            return QueryResult(
                columns=columns,
                rows=rows,
                total_count=len(rows),
                execution_time_ms=int((end_time - start_time) * 1000),
            )
        except SPARQLQueryError as e:
            logger.error(f"Failed to execute SPARQL query: {e}")
            raise


# Query builders

def _build_cubes_query(
    search: Optional[str],
    theme: Optional[str],
    limit: int,
    offset: int
) -> str:
    """Build SPARQL query to list cubes."""
    filters = []

    if search:
        filters.append(f'FILTER(CONTAINS(LCASE(?title), LCASE("{search}")))')

    if theme:
        filters.append(f'?cube dcat:theme <{theme}> .')

    filter_clause = "\n  ".join(filters)

    return f"""
SELECT DISTINCT ?cube ?identifier ?title ?description ?publisher ?datePublished ?dateModified
WHERE {{
  ?cube a cube:Cube ;
        schema:name ?title .

  OPTIONAL {{ ?cube schema:identifier ?identifier }}
  OPTIONAL {{ ?cube schema:description ?description }}
  OPTIONAL {{ ?cube schema:publisher/schema:name ?publisher }}
  OPTIONAL {{ ?cube schema:datePublished ?datePublished }}
  OPTIONAL {{ ?cube schema:dateModified ?dateModified }}

  {filter_clause}

  FILTER(LANG(?title) = "en" || LANG(?title) = "de" || LANG(?title) = "")
}}
ORDER BY ?title
LIMIT {limit}
OFFSET {offset}
"""


def _build_cube_info_query(iri: str) -> str:
    """Build SPARQL query to get cube info."""
    return f"""
SELECT ?cube ?identifier ?title ?description ?publisher ?datePublished ?dateModified ?version
WHERE {{
  BIND(<{iri}> AS ?cube)

  ?cube a cube:Cube ;
        schema:name ?title .

  OPTIONAL {{ ?cube schema:identifier ?identifier }}
  OPTIONAL {{ ?cube schema:description ?description }}
  OPTIONAL {{ ?cube schema:publisher/schema:name ?publisher }}
  OPTIONAL {{ ?cube schema:datePublished ?datePublished }}
  OPTIONAL {{ ?cube schema:dateModified ?dateModified }}
  OPTIONAL {{ ?cube schema:version ?version }}

  FILTER(LANG(?title) = "en" || LANG(?title) = "de" || LANG(?title) = "")
}}
LIMIT 1
"""


def _build_dimensions_query(cube_iri: str) -> str:
    """Build SPARQL query to get cube dimensions."""
    return f"""
SELECT DISTINCT ?dimension ?identifier ?label ?description ?dimensionType ?dataType ?unit ?scaleType
WHERE {{
  <{cube_iri}> cube:observationConstraint/sh:property ?shape .

  ?shape sh:path ?dimension .

  OPTIONAL {{ ?dimension schema:name ?label }}
  OPTIONAL {{ ?dimension schema:identifier ?identifier }}
  OPTIONAL {{ ?dimension schema:description ?description }}
  OPTIONAL {{ ?shape cubeMeta:dimensionType ?dimensionType }}
  OPTIONAL {{ ?shape sh:datatype ?dataType }}
  OPTIONAL {{ ?dimension qudt:unit/rdfs:label ?unit }}
  OPTIONAL {{ ?shape cubeMeta:scaleType ?scaleType }}

  FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "" || !BOUND(?label))
}}
"""


def _build_dimension_values_query(
    cube_iri: str,
    dimension_iri: str,
    limit: int
) -> str:
    """Build SPARQL query to get dimension values."""
    return f"""
SELECT DISTINCT ?value ?label ?position
WHERE {{
  ?observation a cube:Observation ;
               cube:observedBy <{cube_iri}> ;
               <{dimension_iri}> ?value .

  OPTIONAL {{ ?value schema:name ?label }}
  OPTIONAL {{ ?value schema:position ?position }}

  FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "" || !BOUND(?label))
}}
ORDER BY ?position ?label
LIMIT {limit}
"""


def _build_observations_query(
    cube_iri: str,
    filters: Optional[Dict[str, Any]],
    limit: int,
    offset: int
) -> str:
    """Build SPARQL query to get observations."""
    filter_clauses = []
    if filters:
        for dim_iri, value in filters.items():
            if isinstance(value, str) and value.startswith("http"):
                filter_clauses.append(f"?observation <{dim_iri}> <{value}> .")
            elif isinstance(value, str):
                filter_clauses.append(f'?observation <{dim_iri}> "{value}" .')
            else:
                filter_clauses.append(f"?observation <{dim_iri}> {value} .")

    filter_clause = "\n  ".join(filter_clauses)

    return f"""
SELECT ?observation ?p ?o
WHERE {{
  ?observation a cube:Observation ;
               cube:observedBy <{cube_iri}> ;
               ?p ?o .

  {filter_clause}
}}
LIMIT {limit}
OFFSET {offset}
"""


# Result parsers

def _parse_cubes_results(results: Dict[str, Any]) -> List[CubeInfo]:
    """Parse SPARQL results into CubeInfo objects."""
    cubes = []
    bindings = results.get("results", {}).get("bindings", [])

    for binding in bindings:
        cube = CubeInfo(
            iri=binding.get("cube", {}).get("value", ""),
            identifier=binding.get("identifier", {}).get("value", ""),
            title=binding.get("title", {}).get("value", ""),
            description=binding.get("description", {}).get("value"),
            publisher=binding.get("publisher", {}).get("value"),
            date_published=binding.get("datePublished", {}).get("value"),
            date_modified=binding.get("dateModified", {}).get("value"),
            version=binding.get("version", {}).get("value"),
        )
        cubes.append(cube)

    return cubes


def _parse_dimensions_results(results: Dict[str, Any]) -> List[Dimension]:
    """Parse SPARQL results into Dimension objects."""
    dimensions = []
    bindings = results.get("results", {}).get("bindings", [])

    for binding in bindings:
        dim_type = binding.get("dimensionType", {}).get("value", "dimension")
        if dim_type:
            # Extract local part of URI
            dim_type = dim_type.split("/")[-1] if "/" in dim_type else dim_type

        dimension = Dimension(
            iri=binding.get("dimension", {}).get("value", ""),
            identifier=binding.get("identifier", {}).get("value", ""),
            label=binding.get("label", {}).get("value", ""),
            description=binding.get("description", {}).get("value"),
            dimension_type=dim_type,
            data_type=binding.get("dataType", {}).get("value"),
            unit=binding.get("unit", {}).get("value"),
            scale_type=binding.get("scaleType", {}).get("value"),
        )
        dimensions.append(dimension)

    return dimensions


def _parse_dimension_values_results(results: Dict[str, Any]) -> List[DimensionValue]:
    """Parse SPARQL results into DimensionValue objects."""
    values = []
    bindings = results.get("results", {}).get("bindings", [])

    for binding in bindings:
        value_iri = binding.get("value", {}).get("value", "")
        label = binding.get("label", {}).get("value", value_iri)
        position = binding.get("position", {}).get("value")

        dim_value = DimensionValue(
            iri=value_iri,
            label=label,
            position=int(position) if position else None,
        )
        values.append(dim_value)

    return values


def _parse_observations_results(results: Dict[str, Any]) -> List[Observation]:
    """Parse SPARQL results into Observation objects."""
    # Group results by observation
    obs_dict: Dict[str, Dict[str, Any]] = {}
    bindings = results.get("results", {}).get("bindings", [])

    for binding in bindings:
        obs_iri = binding.get("observation", {}).get("value", "")
        prop = binding.get("p", {}).get("value", "")
        obj = binding.get("o", {}).get("value", "")

        if obs_iri not in obs_dict:
            obs_dict[obs_iri] = {}

        # Use the local part of the property as the key
        prop_key = prop.split("/")[-1] if "/" in prop else prop
        prop_key = prop_key.split("#")[-1] if "#" in prop_key else prop_key
        obs_dict[obs_iri][prop_key] = obj

    observations = [
        Observation(iri=iri, values=values)
        for iri, values in obs_dict.items()
    ]

    return observations


# Create the schema
schema = strawberry.Schema(query=Query)
