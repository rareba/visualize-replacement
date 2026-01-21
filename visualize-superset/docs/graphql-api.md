# GraphQL API

The SPARQL Proxy also provides a GraphQL API for querying LINDAS data.

## Endpoint

```
http://localhost:8089/graphql
```

## Interactive Playground

A GraphQL playground is available at the same URL when accessed in a browser.

## Schema

### Enums

#### Endpoint

```graphql
enum Endpoint {
  PROD
  INT
  TEST
}
```

### Types

#### CubeInfo

```graphql
type CubeInfo {
  iri: String!
  identifier: String!
  title: String!
  description: String
  publisher: String
  datePublished: String
  dateModified: String
  version: String
  themes: [String!]!
}
```

#### Dimension

```graphql
type Dimension {
  iri: String!
  identifier: String!
  label: String!
  description: String
  dimensionType: String!
  dataType: String
  unit: String
  scaleType: String
}
```

#### DimensionValue

```graphql
type DimensionValue {
  iri: String!
  label: String!
  position: Int
}
```

#### Observation

```graphql
type Observation {
  iri: String!
  values: JSON!
}
```

#### QueryResult

```graphql
type QueryResult {
  columns: [String!]!
  rows: [JSON!]!
  totalCount: Int
  executionTimeMs: Int!
}
```

## Queries

### cubes

List available data cubes.

```graphql
query Cubes(
  $endpoint: Endpoint = PROD
  $search: String
  $theme: String
  $limit: Int = 100
  $offset: Int = 0
) {
  cubes(
    endpoint: $endpoint
    search: $search
    theme: $theme
    limit: $limit
    offset: $offset
  ) {
    iri
    identifier
    title
    description
    publisher
    datePublished
    dateModified
  }
}
```

**Example:**
```graphql
query {
  cubes(endpoint: PROD, search: "environment", limit: 10) {
    iri
    title
    description
    publisher
  }
}
```

### cube

Get information about a specific cube.

```graphql
query Cube($iri: String!, $endpoint: Endpoint = PROD) {
  cube(iri: $iri, endpoint: $endpoint) {
    iri
    identifier
    title
    description
    publisher
    datePublished
    dateModified
    version
  }
}
```

**Example:**
```graphql
query {
  cube(
    iri: "https://environment.ld.admin.ch/foen/ubd000502/7"
    endpoint: PROD
  ) {
    title
    description
    publisher
  }
}
```

### cubeDimensions

Get dimensions of a cube.

```graphql
query CubeDimensions($cubeIri: String!, $endpoint: Endpoint = PROD) {
  cubeDimensions(cubeIri: $cubeIri, endpoint: $endpoint) {
    iri
    identifier
    label
    description
    dimensionType
    dataType
    unit
    scaleType
  }
}
```

**Example:**
```graphql
query {
  cubeDimensions(
    cubeIri: "https://environment.ld.admin.ch/foen/ubd000502/7"
    endpoint: PROD
  ) {
    iri
    label
    dimensionType
    dataType
  }
}
```

### dimensionValues

Get values for a specific dimension.

```graphql
query DimensionValues(
  $cubeIri: String!
  $dimensionIri: String!
  $endpoint: Endpoint = PROD
  $limit: Int = 1000
) {
  dimensionValues(
    cubeIri: $cubeIri
    dimensionIri: $dimensionIri
    endpoint: $endpoint
    limit: $limit
  ) {
    iri
    label
    position
  }
}
```

### observations

Get observations from a cube.

```graphql
query Observations(
  $cubeIri: String!
  $endpoint: Endpoint = PROD
  $filters: JSON
  $limit: Int = 1000
  $offset: Int = 0
) {
  observations(
    cubeIri: $cubeIri
    endpoint: $endpoint
    filters: $filters
    limit: $limit
    offset: $offset
  ) {
    iri
    values
  }
}
```

### executeSparql

Execute a raw SPARQL query.

```graphql
query ExecuteSparql($query: String!, $endpoint: Endpoint = PROD) {
  executeSparql(query: $query, endpoint: $endpoint) {
    columns
    rows
    totalCount
    executionTimeMs
  }
}
```

**Example:**
```graphql
query {
  executeSparql(
    query: """
      SELECT ?cube ?title
      WHERE {
        ?cube a cube:Cube ;
          schema:name ?title .
        FILTER(LANG(?title) = "en")
      }
      LIMIT 10
    """
    endpoint: PROD
  ) {
    columns
    rows
    executionTimeMs
  }
}
```

## Complete Example

Here's a complete example that fetches cubes and their dimensions:

```graphql
query GetCubesWithDimensions {
  cubes(endpoint: PROD, limit: 5) {
    iri
    title
    description
  }
}

query GetCubeDimensions($cubeIri: String!) {
  cubeDimensions(cubeIri: $cubeIri, endpoint: PROD) {
    iri
    label
    dimensionType
    dataType
  }
}
```

## Using with JavaScript

```javascript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('http://localhost:8089/graphql');

const query = gql`
  query ListCubes($search: String) {
    cubes(endpoint: PROD, search: $search, limit: 10) {
      iri
      title
      description
    }
  }
`;

const data = await client.request(query, { search: 'environment' });
console.log(data.cubes);
```

## Error Handling

GraphQL errors are returned in the standard format:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Error description",
      "locations": [{"line": 2, "column": 3}],
      "path": ["cubes"]
    }
  ]
}
```
