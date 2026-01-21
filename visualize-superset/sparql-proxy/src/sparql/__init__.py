"""SPARQL client and utilities."""

from .client import (
    SPARQLClient,
    SPARQLQueryError,
    LindasEndpoint,
    ENDPOINT_URLS,
    get_sparql_client,
    close_sparql_client,
)
from .namespaces import (
    PREFIXES,
    get_prefix_declarations,
    expand_prefixed_uri,
    compress_uri,
)

__all__ = [
    "SPARQLClient",
    "SPARQLQueryError",
    "LindasEndpoint",
    "ENDPOINT_URLS",
    "get_sparql_client",
    "close_sparql_client",
    "PREFIXES",
    "get_prefix_declarations",
    "expand_prefixed_uri",
    "compress_uri",
]
