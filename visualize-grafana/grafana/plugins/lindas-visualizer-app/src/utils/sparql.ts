// SPARQL utilities using Grafana's backend proxy

import { getBackendSrv } from '@grafana/runtime';

const LINDAS_ENDPOINT = 'https://lindas.admin.ch/query';

export interface Dimension {
  iri: string;
  label: string;
  order?: number;
}

export interface Measure {
  iri: string;
  label: string;
}

export interface CubeMetadata {
  iri: string;
  label: string;
  description?: string;
  dimensions: Dimension[];
  measures: Measure[];
}

// Use Grafana's backend proxy to avoid CORS issues
async function executeSparql(query: string): Promise<any> {
  try {
    // Use datasource proxy if available, otherwise direct fetch through backend
    const response = await getBackendSrv().fetch({
      url: `/api/datasources/proxy/uid/lindas-datasource`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
      },
      data: query,
    }).toPromise();

    return response?.data;
  } catch (proxyError) {
    // Fallback to direct fetch if proxy fails
    console.log('Proxy failed, trying direct fetch:', proxyError);
    try {
      const response = await fetch(LINDAS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/sparql-results+json',
        },
        body: query,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }

      return response.json();
    } catch (fetchError) {
      throw new Error(`SPARQL request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }
  }
}

export async function fetchCubeMetadata(cubeIri: string): Promise<CubeMetadata> {
  // Query for cube label
  const metadataQuery = `
PREFIX schema: <http://schema.org/>
PREFIX cube: <https://cube.link/>

SELECT ?label ?description WHERE {
  <${cubeIri}> a cube:Cube .
  OPTIONAL { <${cubeIri}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "") }
  OPTIONAL { <${cubeIri}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "") }
} LIMIT 1
  `.trim();

  // Query for dimensions
  const dimensionsQuery = `
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX cube: <https://cube.link/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>

SELECT DISTINCT ?dimension ?label ?order WHERE {
  <${cubeIri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .

  FILTER NOT EXISTS { ?prop qudt:unit ?unit }
  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }
  FILTER NOT EXISTS { ?prop qudt:hasUnit ?hasUnit }

  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "") }
  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }
  OPTIONAL { ?prop sh:order ?order }

  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)
}
ORDER BY ?order ?label
  `.trim();

  // Query for measures
  const measuresQuery = `
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX cube: <https://cube.link/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX qudt: <http://qudt.org/schema/qudt/>

SELECT DISTINCT ?measure ?label WHERE {
  <${cubeIri}> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?measure .

  { ?prop qudt:unit ?unit }
  UNION { ?prop schema:unitCode ?unitCode }
  UNION { ?prop qudt:hasUnit ?hasUnit }

  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "") }
  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }

  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)
}
ORDER BY ?label
  `.trim();

  // Execute queries
  const [metadataResult, dimensionsResult, measuresResult] = await Promise.all([
    executeSparql(metadataQuery),
    executeSparql(dimensionsQuery),
    executeSparql(measuresQuery),
  ]);

  // Parse metadata
  const metadataBindings = metadataResult?.results?.bindings || [];
  const label = metadataBindings[0]?.label?.value || cubeIri.split('/').pop() || 'Unnamed Cube';
  const description = metadataBindings[0]?.description?.value;

  // Parse dimensions - deduplicate
  const dimensionMap = new Map<string, Dimension>();
  (dimensionsResult?.results?.bindings || []).forEach((b: any) => {
    const iri = b.dimension?.value;
    if (iri && !dimensionMap.has(iri)) {
      dimensionMap.set(iri, {
        iri,
        label: b.label?.value || iri.split('/').pop() || iri,
        order: b.order?.value ? parseInt(b.order.value, 10) : undefined,
      });
    }
  });

  // Parse measures - deduplicate
  const measureMap = new Map<string, Measure>();
  (measuresResult?.results?.bindings || []).forEach((b: any) => {
    const iri = b.measure?.value;
    if (iri && !measureMap.has(iri)) {
      measureMap.set(iri, {
        iri,
        label: b.label?.value || iri.split('/').pop() || iri,
      });
    }
  });

  return {
    iri: cubeIri,
    label,
    description,
    dimensions: Array.from(dimensionMap.values()),
    measures: Array.from(measureMap.values()),
  };
}
