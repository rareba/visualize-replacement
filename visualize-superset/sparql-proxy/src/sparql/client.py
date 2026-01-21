"""
SPARQL client for querying LINDAS endpoints.
"""

import logging
from typing import Any, Dict, List, Optional
from enum import Enum

import httpx
from SPARQLWrapper import SPARQLWrapper, JSON, POST, GET
from cachetools import TTLCache

from .namespaces import get_prefix_declarations

logger = logging.getLogger(__name__)


class LindasEndpoint(str, Enum):
    """Available LINDAS SPARQL endpoints."""
    PROD = "prod"
    INT = "int"
    TEST = "test"


ENDPOINT_URLS = {
    LindasEndpoint.PROD: "https://lindas-cached.cluster.ldbar.ch/query",
    LindasEndpoint.INT: "https://lindas-cached.int.cluster.ldbar.ch/query",
    LindasEndpoint.TEST: "https://lindas-cached.test.cluster.ldbar.ch/query",
}


class SPARQLClient:
    """Client for executing SPARQL queries against LINDAS endpoints."""

    def __init__(
        self,
        default_endpoint: LindasEndpoint = LindasEndpoint.PROD,
        timeout: int = 60,
        cache_ttl: int = 300,
        cache_maxsize: int = 1000,
    ):
        self.default_endpoint = default_endpoint
        self.timeout = timeout
        self._cache = TTLCache(maxsize=cache_maxsize, ttl=cache_ttl)
        self._http_client = httpx.AsyncClient(timeout=timeout)

    def _get_sparql_wrapper(self, endpoint: LindasEndpoint) -> SPARQLWrapper:
        """Create a SPARQLWrapper instance for the given endpoint."""
        url = ENDPOINT_URLS[endpoint]
        sparql = SPARQLWrapper(url)
        sparql.setReturnFormat(JSON)
        sparql.setTimeout(self.timeout)
        return sparql

    def _build_query_with_prefixes(self, query: str) -> str:
        """Add standard prefixes to a SPARQL query if not present."""
        # Check if query already has prefixes
        query_upper = query.strip().upper()
        if query_upper.startswith("PREFIX") or query_upper.startswith("SELECT"):
            # If query starts with SELECT, prepend prefixes
            if query_upper.startswith("SELECT"):
                return f"{get_prefix_declarations()}\n\n{query}"
            return query
        return f"{get_prefix_declarations()}\n\n{query}"

    def _get_cache_key(self, query: str, endpoint: LindasEndpoint) -> str:
        """Generate cache key for a query."""
        import hashlib
        query_hash = hashlib.md5(query.encode()).hexdigest()
        return f"{endpoint.value}:{query_hash}"

    async def execute_query(
        self,
        query: str,
        endpoint: Optional[LindasEndpoint] = None,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute a SPARQL query and return results.

        Args:
            query: The SPARQL query to execute
            endpoint: The LINDAS endpoint to use (defaults to default_endpoint)
            use_cache: Whether to use caching for this query

        Returns:
            Dictionary containing query results in SPARQL JSON format
        """
        endpoint = endpoint or self.default_endpoint
        full_query = self._build_query_with_prefixes(query)

        # Check cache
        cache_key = self._get_cache_key(full_query, endpoint)
        if use_cache and cache_key in self._cache:
            logger.debug(f"Cache hit for query on {endpoint.value}")
            return self._cache[cache_key]

        url = ENDPOINT_URLS[endpoint]
        logger.info(f"Executing SPARQL query on {endpoint.value}: {url}")
        logger.debug(f"Query: {full_query[:500]}...")

        try:
            response = await self._http_client.post(
                url,
                data={"query": full_query},
                headers={
                    "Accept": "application/sparql-results+json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
            response.raise_for_status()
            result = response.json()

            # Cache the result
            if use_cache:
                self._cache[cache_key] = result

            return result

        except httpx.HTTPStatusError as e:
            logger.error(f"SPARQL query failed with status {e.response.status_code}: {e}")
            raise SPARQLQueryError(f"Query failed: {e.response.status_code}") from e
        except httpx.RequestError as e:
            logger.error(f"SPARQL request error: {e}")
            raise SPARQLQueryError(f"Request error: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error executing SPARQL query: {e}")
            raise SPARQLQueryError(f"Unexpected error: {str(e)}") from e

    def execute_query_sync(
        self,
        query: str,
        endpoint: Optional[LindasEndpoint] = None,
    ) -> Dict[str, Any]:
        """
        Execute a SPARQL query synchronously (for use with SQLAlchemy).

        Args:
            query: The SPARQL query to execute
            endpoint: The LINDAS endpoint to use

        Returns:
            Dictionary containing query results
        """
        endpoint = endpoint or self.default_endpoint
        full_query = self._build_query_with_prefixes(query)

        sparql = self._get_sparql_wrapper(endpoint)
        sparql.setQuery(full_query)
        sparql.setMethod(POST)

        try:
            results = sparql.query().convert()
            return results
        except Exception as e:
            logger.error(f"SPARQL query failed: {e}")
            raise SPARQLQueryError(f"Query failed: {str(e)}") from e

    def results_to_table(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Convert SPARQL JSON results to a list of dictionaries (table format).

        Args:
            results: SPARQL results in JSON format

        Returns:
            List of dictionaries, one per result row
        """
        if "results" not in results or "bindings" not in results["results"]:
            return []

        bindings = results["results"]["bindings"]
        variables = results.get("head", {}).get("vars", [])

        rows = []
        for binding in bindings:
            row = {}
            for var in variables:
                if var in binding:
                    value = binding[var]
                    # Extract the actual value
                    row[var] = value.get("value", "")
                else:
                    row[var] = None
            rows.append(row)

        return rows

    async def close(self):
        """Close the HTTP client."""
        await self._http_client.aclose()


class SPARQLQueryError(Exception):
    """Exception raised when a SPARQL query fails."""
    pass


# Singleton client instance
_client: Optional[SPARQLClient] = None


def get_sparql_client() -> SPARQLClient:
    """Get or create the singleton SPARQL client."""
    global _client
    if _client is None:
        _client = SPARQLClient()
    return _client


async def close_sparql_client():
    """Close the singleton SPARQL client."""
    global _client
    if _client is not None:
        await _client.close()
        _client = None
