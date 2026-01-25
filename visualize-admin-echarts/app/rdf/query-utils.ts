import { locales } from "@/locales/locales";

export const GROUP_SEPARATOR = "|||";

/**
 * Escapes special characters in SPARQL string literals to prevent injection.
 * Use this when concatenating user-derived values into SPARQL queries.
 */
export const escapeSparqlLiteral = (value: string | number): string => {
  const str = String(value);
  return str
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/"/g, '\\"')   // Escape double quotes
    .replace(/'/g, "\\'")   // Escape single quotes
    .replace(/\n/g, "\\n")  // Escape newlines
    .replace(/\r/g, "\\r")  // Escape carriage returns
    .replace(/\t/g, "\\t"); // Escape tabs
};

export const iriToNode = (iri: string) => {
  return `<${iri}>`;
};

export const buildLocalizedSubQuery = (
  s: string,
  p: string,
  o: string,
  {
    locale,
    fallbackToNonLocalized,
    additionalFallbacks,
  }: {
    locale: string;
    fallbackToNonLocalized?: boolean;
    additionalFallbacks?: string[];
  }
) => {
  const locales = getQueryLocales(locale);

  return `${locales
    .map(
      (locale) =>
        `OPTIONAL { ?${s} ${p} ?${o}_${locale} . FILTER(LANG(?${o}_${locale}) = "${locale}") }`
    )
    .join("\n")}${
    fallbackToNonLocalized
      ? `\nOPTIONAL {
  ?${s} ${p} ?${o}_raw .
}`
      : ""
  }
BIND(COALESCE(${locales.map((locale) => `?${o}_${locale}`).join(", ")}${
    fallbackToNonLocalized ? `, ?${o}_raw` : ``
  }${
    additionalFallbacks
      ? ", " + additionalFallbacks.map((d) => `?${d}`).join(", ")
      : ""
  }) AS ?${o})`;
};

export const getQueryLocales = (locale: string) => {
  return [locale, ...locales.filter((l) => l !== locale), ""];
};

export const makeVisualizeDatasetFilter = (options?: {
  includeDrafts?: boolean;
  cubeIriVar?: string;
}) => {
  const cubeIriVar = options?.cubeIriVar ?? "?iri";
  const includeDrafts = options?.includeDrafts ?? false;

  return `
    ${cubeIriVar} schema:workExample <https://ld.admin.ch/application/visualize> .
    ${
      includeDrafts
        ? ""
        : `${cubeIriVar} schema:creativeWorkStatus <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .`
    }
    ${cubeIriVar} cube:observationConstraint ?shape .
    FILTER NOT EXISTS { ${cubeIriVar} schema:expires ?expiryDate }`;
};
