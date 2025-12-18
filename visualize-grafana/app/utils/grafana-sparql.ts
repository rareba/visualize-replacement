/**
 * SPARQL Query Generator for Grafana Integration
 *
 * Generates SPARQL queries from cube IRIs and constructs Grafana URLs
 * with pre-populated queries for the LINDAS SPARQL plugin.
 *
 * Architecture:
 * - Web app generates SPARQL query for cube observations
 * - Query is passed to Grafana as URL parameter
 * - Grafana executes query and displays tabular data
 * - Users can create visualizations from the pre-loaded data
 */

/**
 * Generate a SPARQL query that produces tabular data for Grafana
 *
 * This query:
 * 1. Fetches all observations from a cube
 * 2. Gets all properties for each observation
 * 3. Resolves labels for IRI values (preferring English)
 * 4. Returns data in a format suitable for Grafana's groupingToMatrix transformation
 */
export function generateCubeTableQuery(cubeIri: string): string {
  return `PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ?obs ?column ?value WHERE {
  <${cubeIri}> cube:observationSet/cube:observation ?obs .
  ?obs ?property ?rawValue .
  FILTER(?property != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
  FILTER(?property != cube:observedBy)

  OPTIONAL { ?rawValue schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "") }
  BIND(COALESCE(?label, IF(isLiteral(?rawValue), STR(?rawValue), REPLACE(STR(?rawValue), "^.*/", ""))) AS ?value)
  BIND(REPLACE(STR(?property), "^.*/", "") AS ?column)
}
ORDER BY ?obs ?column`;
}

/**
 * Generate a simple observations query (for debugging/testing)
 */
export function generateCubeObservationsQuery(cubeIri: string, limit = 1000): string {
  return `PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ?observation ?predicate ?value ?label
WHERE {
  <${cubeIri}> cube:observationSet/cube:observation ?observation .
  ?observation ?predicate ?value .

  FILTER(?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
  FILTER(?predicate != cube:observedBy)

  OPTIONAL { ?value schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "") }
}
LIMIT ${limit}`;
}

/**
 * Generate a query to fetch cube dimensions metadata
 */
export function generateCubeDimensionsQuery(cubeIri: string): string {
  return `PREFIX cube: <https://cube.link/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX schema: <http://schema.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT
  (COALESCE(?label, REPLACE(STR(?dimension), "^.*/", "")) AS ?column_name)
  (IF(BOUND(?dt), REPLACE(STR(?dt), "^.*#", ""), "IRI/text") AS ?data_type)
  (STR(?dimension) AS ?predicate_uri)
WHERE {
  <${cubeIri}> cube:observationConstraint/sh:property ?prop .
  ?prop sh:path ?dimension .
  OPTIONAL { ?prop schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "") }
  OPTIONAL { ?prop sh:datatype ?dt . }
  FILTER(?dimension != cube:observedBy)
  FILTER(?dimension != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
}
ORDER BY ?column_name`;
}

/**
 * Generate Grafana Explore URL with pre-populated SPARQL query
 */
export function generateGrafanaExploreUrl(
  grafanaUrl: string,
  datasourceUid: string,
  sparqlQuery: string
): string {
  const exploreState = {
    datasource: datasourceUid,
    queries: [
      {
        refId: "A",
        queryText: sparqlQuery,
      },
    ],
    range: {
      from: "now-1y",
      to: "now",
    },
  };

  const encodedState = encodeURIComponent(JSON.stringify(exploreState));
  return `${grafanaUrl}/explore?left=${encodedState}`;
}

/**
 * Generate Grafana dashboard URL with cube variable (legacy)
 *
 * @deprecated Use generateGrafanaDashboardWithQuery instead
 */
export function generateGrafanaDashboardUrl(
  grafanaUrl: string,
  dashboardUid: string,
  cubeIri: string
): string {
  return `${grafanaUrl}/d/${dashboardUid}?var-cube=${encodeURIComponent(cubeIri)}`;
}

/**
 * Generate Grafana dashboard URL with pre-built SPARQL query
 *
 * This is the preferred method - it passes the complete query to Grafana
 * so users have tabular data ready for immediate visualization.
 */
export function generateGrafanaDashboardWithQuery(
  grafanaUrl: string,
  dashboardUid: string,
  cubeIri: string
): string {
  const query = generateCubeTableQuery(cubeIri);
  const dimensionsQuery = generateCubeDimensionsQuery(cubeIri);

  return `${grafanaUrl}/d/${dashboardUid}?var-cube=${encodeURIComponent(cubeIri)}&var-query=${encodeURIComponent(query)}&var-dimensionsQuery=${encodeURIComponent(dimensionsQuery)}`;
}
