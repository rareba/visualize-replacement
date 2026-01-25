import gql from "graphql-tag";
import "isomorphic-unfetch";
import { createClient } from "urql";

import { setup } from "./common";

const { test, describe, expect } = setup();

/**
 * Had to copy graphql definitions from graphql/query-hooks
 * due to problem importing rdf-js if we import the definitions
 * from graphql/query-hooks. Please keep the definitions below
 * in sync with graphql/query-hooks.
 */
export const HierarchyValueFieldsFragmentDoc = gql`
  fragment hierarchyValueFields on HierarchyValue {
    value
    dimensionIri
    depth
    label
    alternateName
    hasValue
    position
    identifier
  }
`;

export const HierarchyMetadataFragmentDoc = gql`
  fragment hierarchyMetadata on Dimension {
    hierarchy(sourceType: $sourceType, sourceUrl: $sourceUrl) {
      ...hierarchyValueFields
      children {
        ...hierarchyValueFields
        children {
          ...hierarchyValueFields
          children {
            ...hierarchyValueFields
            children {
              ...hierarchyValueFields
              children {
                ...hierarchyValueFields
              }
            }
          }
        }
      }
    }
  }
  ${HierarchyValueFieldsFragmentDoc}
`;

export const DimensionHierarchyDocument = gql`
  query DimensionHierarchy(
    $sourceType: String!
    $sourceUrl: String!
    $locale: String!
    $cubeIri: String!
    $dimensionIri: String!
  ) {
    dataCubeByIri(
      iri: $cubeIri
      sourceType: $sourceType
      sourceUrl: $sourceUrl
      locale: $locale
    ) {
      dimensionByIri(
        iri: $dimensionIri
        sourceType: $sourceType
        sourceUrl: $sourceUrl
      ) {
        ...hierarchyMetadata
      }
    }
  }
  ${HierarchyMetadataFragmentDoc}
`;

const cubeIris = {
  "C-1029": "https://environment.ld.admin.ch/foen/nfi/nfi_C-1029/cube/2023-1",
};

const runTest = async ({
  cubeIri,
  locale,
  expected,
}: {
  cubeIri: string;
  locale: string;
  expected: { root: string; children: string[] };
}) => {
  const client = createClient({
    url: "http://localhost:3000/api/graphql",
  });
  const res = await client
    .query(DimensionHierarchyDocument, {
      cubeIri: cubeIri,
      sourceUrl: "https://lindas-cached.int.cluster.ldbar.ch/query",
      sourceType: "sparql",
      dimensionIri: "https://environment.ld.admin.ch/foen/nfi/unitOfReference",
      locale,
    })
    .toPromise();
  if (res.error) {
    throw Error(`${res.error.name}: ${res.error.message}`);
  }
  const dimension = res.data.dataCubeByIri.dimensionByIri;
  const {
    hierarchy: [{ label, children }],
  } = dimension;
  expect(label).toBe(expected.root);
  expect(
    children
      .map((x: { label: string }) => x.label)
      .sort((a: string, b: string) => a.localeCompare(b))
  ).toEqual(expected.children);
};

/**
 * Multi-root hierarchy retrieval tests.
 * Tests the GraphQL hierarchy query endpoint for cubes with multi-level hierarchies.
 *
 * Re-enabled with extended timeout and proper error handling.
 * If the test fails due to API changes, check the hierarchy fetch implementation.
 */
describe("multi root hierarchy retrieval", () => {
  test("should work for C-1029", async () => {
    // Extended timeout for network requests
    test.setTimeout(60_000);

    try {
      await runTest({
        cubeIri: cubeIris["C-1029"],
        locale: "en",
        expected: {
          root: "Switzerland",
          children: [
            "Canton",
            "Economic region",
            "Production Region",
            "Protection forest region",
          ],
        },
      });
    } catch (error) {
      // Log error details for debugging but allow test to proceed
      console.error("Hierarchy retrieval test error:", error);
      throw error;
    }
  });

  test("should work for C-1029 with German locale", async () => {
    test.setTimeout(60_000);

    try {
      await runTest({
        cubeIri: cubeIris["C-1029"],
        locale: "de",
        expected: {
          root: "Schweiz",
          children: [
            "Kanton",
            "Produktionsregion",
            "Schutzwaldregion",
            "Wirtschaftsregion",
          ],
        },
      });
    } catch (error) {
      console.error("Hierarchy retrieval test error (de):", error);
      throw error;
    }
  });
});
