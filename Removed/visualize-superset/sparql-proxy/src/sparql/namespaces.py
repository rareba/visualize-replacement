"""
RDF Namespaces for LINDAS SPARQL queries.
These match the namespaces used in the visualization-tool project.
"""

from rdflib import Namespace

# Core cube namespaces
CUBE = Namespace("https://cube.link/")
CUBE_VIEW = Namespace("https://cube.link/view/")
CUBE_META = Namespace("https://cube.link/meta/")

# Swiss Admin vocabularies
ADMIN_VOCAB = Namespace("https://ld.admin.ch/vocabulary/")
ADMIN_CH = Namespace("https://ld.admin.ch/")

# Standard vocabularies
SCHEMA = Namespace("http://schema.org/")
RDF = Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
RDFS = Namespace("http://www.w3.org/2000/01/rdf-schema#")
XSD = Namespace("http://www.w3.org/2001/XMLSchema#")
DCT = Namespace("http://purl.org/dc/terms/")
DCAT = Namespace("http://www.w3.org/ns/dcat#")
SKOS = Namespace("http://www.w3.org/2004/02/skos/core#")
QB = Namespace("http://purl.org/linked-data/cube#")
OWL = Namespace("http://www.w3.org/2002/07/owl#")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")
SH = Namespace("http://www.w3.org/ns/shacl#")
TIME = Namespace("http://www.w3.org/2006/time#")
GEO = Namespace("http://www.opengis.net/ont/geosparql#")
QUDT = Namespace("http://qudt.org/schema/qudt/")

# Namespace prefixes for SPARQL queries
PREFIXES = {
    "cube": str(CUBE),
    "cubeView": str(CUBE_VIEW),
    "cubeMeta": str(CUBE_META),
    "schema": str(SCHEMA),
    "rdf": str(RDF),
    "rdfs": str(RDFS),
    "xsd": str(XSD),
    "dct": str(DCT),
    "dcat": str(DCAT),
    "skos": str(SKOS),
    "qb": str(QB),
    "owl": str(OWL),
    "foaf": str(FOAF),
    "sh": str(SH),
    "time": str(TIME),
    "geo": str(GEO),
    "qudt": str(QUDT),
    "adminVocab": str(ADMIN_VOCAB),
    "adminCh": str(ADMIN_CH),
}


def get_prefix_declarations() -> str:
    """Generate SPARQL PREFIX declarations for all namespaces."""
    return "\n".join(
        f"PREFIX {prefix}: <{uri}>"
        for prefix, uri in PREFIXES.items()
    )


def expand_prefixed_uri(prefixed_uri: str) -> str:
    """Expand a prefixed URI (e.g., 'schema:name') to full URI."""
    if ":" not in prefixed_uri:
        return prefixed_uri

    prefix, local = prefixed_uri.split(":", 1)
    if prefix in PREFIXES:
        return f"{PREFIXES[prefix]}{local}"
    return prefixed_uri


def compress_uri(full_uri: str) -> str:
    """Compress a full URI to prefixed form if possible."""
    for prefix, namespace in PREFIXES.items():
        if full_uri.startswith(namespace):
            return f"{prefix}:{full_uri[len(namespace):]}"
    return full_uri
