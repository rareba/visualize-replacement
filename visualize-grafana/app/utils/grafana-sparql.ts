/**
 * SPARQL Query Generator for Grafana Integration
 * 
 * Generates SPARQL queries from cube IRIs and constructs Grafana URLs
 * with pre-populated queries for the LINDAS SPARQL plugin.
 */

/**
 * Generate a SPARQL query to fetch all observations from a cube
 */
export function generateCubeObservationsQuery(cubeIri: string, limit = 1000): string {
  return `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT ?observation ?predicate ?value ?label
WHERE {
  ?observation a cube:Observation .
  ?observation cube:observedBy <${cubeIri}> .
  ?observation ?predicate ?value .
  
  # Exclude metadata predicates
  FILTER(?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
  FILTER(?predicate != cube:observedBy)
  
  # Get labels for named values
  OPTIONAL { ?value schema:name ?label . }
}
LIMIT ${limit}
  `.trim();
}

/**
 * Generate a simple tabular query that pivots observations into columns
 * This is better for Grafana table panels
 */
export function generateCubeTableQuery(cubeIri: string, limit = 1000): string {
  return `
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>

SELECT *
WHERE {
  ?observation a cube:Observation .
  ?observation cube:observedBy <${cubeIri}> .
  ?observation ?p ?o .
  FILTER(?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
  FILTER(?p != cube:observedBy)
}
LIMIT ${limit}
  `.trim();
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
 * Generate Grafana dashboard URL with cube variable
 */
export function generateGrafanaDashboardUrl(
  grafanaUrl: string,
  dashboardUid: string,
  cubeIri: string
): string {
  return `${grafanaUrl}/d/${dashboardUid}?var-cube=${encodeURIComponent(cubeIri)}`;
}
