/**
 * Safe JSON parsing utilities with size limits and validation
 */

import { SearchCubeResultOrder } from "@/graphql/query-hooks";

/** Maximum allowed JSON string length (100KB) */
const MAX_JSON_SIZE = 100 * 1024;

/**
 * Safely parses JSON with size limit to prevent DoS attacks.
 * Returns null if parsing fails or size exceeds limit.
 */
export const softJSONParse = <T = unknown>(
  v: string | undefined | null,
  maxSize = MAX_JSON_SIZE
): T | null => {
  if (!v || typeof v !== "string") {
    return null;
  }

  // Enforce size limit
  if (v.length > maxSize) {
    console.warn("[softJSONParse] Input exceeds size limit:", v.length, "bytes");
    return null;
  }

  try {
    return JSON.parse(v) as T;
  } catch (e) {
    return null;
  }
};

/**
 * Valid types for browse params
 */
const VALID_BROWSE_TYPES = ["theme", "organization", "dataset", "termset"] as const;
type BrowseType = (typeof VALID_BROWSE_TYPES)[number];

const VALID_ORDERS = Object.values(SearchCubeResultOrder);

/**
 * Validates that a value is a valid SearchCubeResultOrder
 */
const isValidOrder = (v: unknown): v is SearchCubeResultOrder => {
  return typeof v === "string" && VALID_ORDERS.includes(v as SearchCubeResultOrder);
};

/**
 * Validated browse params structure
 */
export interface ValidatedBrowseParams {
  type?: BrowseType;
  iri?: string;
  subtype?: Exclude<BrowseType, "dataset">;
  subiri?: string;
  subsubtype?: Exclude<BrowseType, "dataset">;
  subsubiri?: string;
  topic?: string;
  includeDrafts?: boolean;
  order?: SearchCubeResultOrder;
  search?: string;
  dataset?: string;
}

/**
 * Validates a string value is non-empty and not too long
 */
const isValidStringValue = (v: unknown): v is string => {
  return typeof v === "string" && v.length > 0 && v.length < 1000;
};

/**
 * Validates a type is one of the allowed browse types
 */
const isValidBrowseType = (v: unknown): v is BrowseType => {
  return typeof v === "string" && VALID_BROWSE_TYPES.includes(v as BrowseType);
};

/**
 * Parses and validates browse params from JSON.
 * Returns null if validation fails.
 */
export const parseAndValidateBrowseParams = (
  rawJson: string | undefined | null
): ValidatedBrowseParams | null => {
  const parsed = softJSONParse<Record<string, unknown>>(rawJson);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const result: ValidatedBrowseParams = {};

  // Validate type fields
  if (parsed.type !== undefined) {
    if (!isValidBrowseType(parsed.type)) return null;
    result.type = parsed.type;
  }
  if (parsed.subtype !== undefined) {
    if (!isValidBrowseType(parsed.subtype)) return null;
    result.subtype = parsed.subtype as Exclude<BrowseType, "dataset">;
  }
  if (parsed.subsubtype !== undefined) {
    if (!isValidBrowseType(parsed.subsubtype)) return null;
    result.subsubtype = parsed.subsubtype as Exclude<BrowseType, "dataset">;
  }

  // Validate IRI fields
  if (parsed.iri !== undefined) {
    if (!isValidStringValue(parsed.iri)) return null;
    result.iri = parsed.iri;
  }
  if (parsed.subiri !== undefined) {
    if (!isValidStringValue(parsed.subiri)) return null;
    result.subiri = parsed.subiri;
  }
  if (parsed.subsubiri !== undefined) {
    if (!isValidStringValue(parsed.subsubiri)) return null;
    result.subsubiri = parsed.subsubiri;
  }

  // Validate optional string fields
  if (parsed.topic !== undefined) {
    if (!isValidStringValue(parsed.topic)) return null;
    result.topic = parsed.topic;
  }
  if (parsed.search !== undefined) {
    if (!isValidStringValue(parsed.search)) return null;
    result.search = parsed.search;
  }
  if (parsed.dataset !== undefined) {
    if (!isValidStringValue(parsed.dataset)) return null;
    result.dataset = parsed.dataset;
  }

  // Validate order
  if (parsed.order !== undefined) {
    if (!isValidOrder(parsed.order)) {
      return null;
    }
    result.order = parsed.order;
  }

  // Validate boolean
  if (parsed.includeDrafts !== undefined) {
    if (typeof parsed.includeDrafts !== "boolean") return null;
    result.includeDrafts = parsed.includeDrafts;
  }

  return result;
};
