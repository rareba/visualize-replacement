/* LINDAS SPARQL Queries
 * Based on visualize.admin.ch query patterns for RDF Data Cube discovery
 */

// Query to list all available cubes with metadata
export const LIST_CUBES_QUERY = (locale: string = 'en') => `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>

SELECT DISTINCT
  ?cubeIri
  ?title
  ?description
  ?creatorIri
  ?creatorLabel
  ?datePublished
  ?theme
WHERE {
  ?cubeIri a cube:Cube .

  # Filter for visualize-compatible cubes
  ?cubeIri schema:workExample <https://ld.admin.ch/application/visualize> .
  ?cubeIri schema:creativeWorkStatus <https://ld.admin.ch/definedTerm/CreativeWorkStatus/Published> .

  # Get title with language preference
  OPTIONAL {
    ?cubeIri schema:name ?title_${locale} .
    FILTER(LANG(?title_${locale}) = "${locale}")
  }
  OPTIONAL {
    ?cubeIri schema:name ?title_en .
    FILTER(LANG(?title_en) = "en")
  }
  OPTIONAL {
    ?cubeIri schema:name ?title_any .
  }
  BIND(COALESCE(?title_${locale}, ?title_en, ?title_any) AS ?title)

  # Get description
  OPTIONAL {
    ?cubeIri schema:description ?desc_${locale} .
    FILTER(LANG(?desc_${locale}) = "${locale}")
  }
  OPTIONAL {
    ?cubeIri schema:description ?desc_en .
    FILTER(LANG(?desc_en) = "en")
  }
  OPTIONAL {
    ?cubeIri schema:description ?desc_any .
  }
  BIND(COALESCE(?desc_${locale}, ?desc_en, ?desc_any) AS ?description)

  # Get creator
  OPTIONAL {
    ?cubeIri dcterms:creator ?creatorIri .
    OPTIONAL {
      ?creatorIri schema:name ?creatorLabel_${locale} .
      FILTER(LANG(?creatorLabel_${locale}) = "${locale}")
    }
    OPTIONAL {
      ?creatorIri schema:name ?creatorLabel_any .
    }
    BIND(COALESCE(?creatorLabel_${locale}, ?creatorLabel_any) AS ?creatorLabel)
  }

  # Get publish date
  OPTIONAL { ?cubeIri schema:datePublished ?datePublished . }

  # Get themes
  OPTIONAL { ?cubeIri dcat:theme ?theme . }
}
ORDER BY ?title
LIMIT 500
`;

// Query to search cubes by keyword
export const SEARCH_CUBES_QUERY = (searchTerm: string, locale: string = 'en') => `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT DISTINCT ?cubeIri ?title ?description ?creatorLabel
WHERE {
  ?cubeIri a cube:Cube .
  ?cubeIri schema:workExample <https://ld.admin.ch/application/visualize> .
  ?cubeIri schema:creativeWorkStatus <https://ld.admin.ch/definedTerm/CreativeWorkStatus/Published> .

  # Get title
  ?cubeIri schema:name ?title .
  OPTIONAL { ?cubeIri schema:description ?description . }
  OPTIONAL {
    ?cubeIri dcterms:creator ?creator .
    ?creator schema:name ?creatorLabel .
  }

  # Search filter
  FILTER(
    CONTAINS(LCASE(STR(?title)), LCASE("${searchTerm}")) ||
    CONTAINS(LCASE(STR(?description)), LCASE("${searchTerm}")) ||
    CONTAINS(LCASE(STR(?creatorLabel)), LCASE("${searchTerm}"))
  )
}
ORDER BY ?title
LIMIT 100
`;

// Query to get cube dimensions
export const GET_CUBE_DIMENSIONS_QUERY = (cubeIri: string, locale: string = 'en') => `
PREFIX cube: <https://cube.link/>
PREFIX cubeMeta: <https://cube.link/meta/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX qudt: <http://qudt.org/schema/qudt/>

SELECT DISTINCT
  ?dimensionIri
  ?dimensionLabel
  ?dataType
  ?isMeasure
  ?isTime
  ?scaleType
  ?unit
WHERE {
  <${cubeIri}> cube:observationConstraint ?shape .
  ?shape sh:property ?property .
  ?property sh:path ?dimensionIri .

  # Exclude rdf:type and cube:observedBy
  FILTER(?dimensionIri NOT IN (
    <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>,
    <https://cube.link/observedBy>
  ))

  # Get label with language preference
  OPTIONAL {
    ?property schema:name ?label_${locale} .
    FILTER(LANG(?label_${locale}) = "${locale}")
  }
  OPTIONAL {
    ?property schema:name ?label_en .
    FILTER(LANG(?label_en) = "en")
  }
  OPTIONAL {
    ?property schema:name ?label_any .
  }
  BIND(COALESCE(?label_${locale}, ?label_en, ?label_any) AS ?dimensionLabel)

  # Get data type
  OPTIONAL { ?property sh:datatype ?dataType . }

  # Check if measure (MeasureDimension)
  BIND(EXISTS { ?property a cube:MeasureDimension } AS ?isMeasure)

  # Check if temporal
  OPTIONAL {
    ?property cubeMeta:dataKind/time:unitType ?timeUnit .
  }
  BIND(BOUND(?timeUnit) AS ?isTime)

  # Get scale type
  OPTIONAL { ?property cubeMeta:scaleType ?scaleType . }

  # Get unit
  OPTIONAL { ?property qudt:unit ?unit . }
}
ORDER BY DESC(?isMeasure) ?dimensionLabel
`;

// Query to get dimension values (for filters)
export const GET_DIMENSION_VALUES_QUERY = (cubeIri: string, dimensionIri: string, locale: string = 'en', limit: number = 100) => `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT DISTINCT ?value ?label
WHERE {
  ?observation a cube:Observation .
  ?observation cube:observedBy <${cubeIri}> .
  ?observation <${dimensionIri}> ?value .

  OPTIONAL {
    ?value schema:name ?label_${locale} .
    FILTER(LANG(?label_${locale}) = "${locale}")
  }
  OPTIONAL {
    ?value schema:name ?label_any .
  }
  BIND(COALESCE(?label_${locale}, ?label_any, STR(?value)) AS ?label)
}
ORDER BY ?label
LIMIT ${limit}
`;

// Generate observation query from cube and dimension selection
export const GENERATE_OBSERVATIONS_QUERY = (
  cubeIri: string,
  dimensions: { iri: string; label: string }[],
  measures: { iri: string; label: string }[],
  filters: { dimensionIri: string; value: string }[] = [],
  limit: number = 1000
) => {
  const selectVars = [...dimensions, ...measures]
    .map((d) => `?${sanitizeVarName(d.label)}`)
    .join(' ');

  const dimensionPatterns = dimensions
    .map((d) => `  ?observation <${d.iri}> ?${sanitizeVarName(d.label)}_raw .`)
    .join('\n');

  const measurePatterns = measures
    .map((m) => `  ?observation <${m.iri}> ?${sanitizeVarName(m.label)} .`)
    .join('\n');

  // For dimensions that are IRIs, try to get labels
  const labelPatterns = dimensions
    .map(
      (d) => `
  OPTIONAL {
    ?${sanitizeVarName(d.label)}_raw schema:name ?${sanitizeVarName(d.label)}_label .
    FILTER(LANG(?${sanitizeVarName(d.label)}_label) = "en" || LANG(?${sanitizeVarName(d.label)}_label) = "")
  }
  BIND(COALESCE(?${sanitizeVarName(d.label)}_label, STR(?${sanitizeVarName(d.label)}_raw)) AS ?${sanitizeVarName(d.label)})`
    )
    .join('\n');

  const filterPatterns = filters
    .map((f) => `  FILTER(?observation_${sanitizeVarName(f.dimensionIri)} = <${f.value}>)`)
    .join('\n');

  return `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ${selectVars}
WHERE {
  ?observation a cube:Observation .
  ?observation cube:observedBy <${cubeIri}> .

${dimensionPatterns}
${measurePatterns}
${labelPatterns}
${filterPatterns}
}
ORDER BY ${dimensions.length > 0 ? `?${sanitizeVarName(dimensions[0].label)}` : '?observation'}
LIMIT ${limit}
`;
};

// Helper to sanitize variable names for SPARQL
function sanitizeVarName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Query to get organizations (for filtering)
export const GET_ORGANIZATIONS_QUERY = (locale: string = 'en') => `
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX cube: <https://cube.link/>

SELECT DISTINCT ?orgIri ?orgLabel (COUNT(?cube) AS ?cubeCount)
WHERE {
  ?cube a cube:Cube .
  ?cube schema:workExample <https://ld.admin.ch/application/visualize> .
  ?cube dcterms:creator ?orgIri .

  OPTIONAL {
    ?orgIri schema:name ?label_${locale} .
    FILTER(LANG(?label_${locale}) = "${locale}")
  }
  OPTIONAL {
    ?orgIri schema:name ?label_any .
  }
  BIND(COALESCE(?label_${locale}, ?label_any) AS ?orgLabel)
}
GROUP BY ?orgIri ?orgLabel
ORDER BY DESC(?cubeCount)
`;

// Query to get themes (for filtering)
export const GET_THEMES_QUERY = (locale: string = 'en') => `
PREFIX schema: <http://schema.org/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX cube: <https://cube.link/>

SELECT DISTINCT ?themeIri ?themeLabel (COUNT(?cube) AS ?cubeCount)
WHERE {
  ?cube a cube:Cube .
  ?cube schema:workExample <https://ld.admin.ch/application/visualize> .
  ?cube dcat:theme ?themeIri .

  OPTIONAL {
    ?themeIri schema:name ?label_${locale} .
    FILTER(LANG(?label_${locale}) = "${locale}")
  }
  OPTIONAL {
    ?themeIri schema:name ?label_any .
  }
  BIND(COALESCE(?label_${locale}, ?label_any, STR(?themeIri)) AS ?themeLabel)
}
GROUP BY ?themeIri ?themeLabel
ORDER BY DESC(?cubeCount)
`;
