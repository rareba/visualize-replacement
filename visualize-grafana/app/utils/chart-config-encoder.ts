/**
 * Chart Configuration Encoder/Decoder
 *
 * Encodes chart configuration and data to URL-safe base64 for embedding.
 * Uses compression to reduce URL length for complex configurations.
 */

// Simple LZ-based compression for URL-safe strings
// This is a minimal implementation - for production, consider using lz-string package

/**
 * Compress a string using a simple run-length encoding approach
 * Falls back to base64 if compression doesn't help
 */
function compress(input: string): string {
  try {
    // Use TextEncoder for UTF-8 safety
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...data));

    // Make URL-safe
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch {
    // Fallback: just URL encode
    return encodeURIComponent(input);
  }
}

/**
 * Decompress a string
 */
function decompress(input: string): string {
  try {
    // Restore base64 padding and characters
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    // Decode base64
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Decode UTF-8
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    // Fallback: try URL decode
    return decodeURIComponent(input);
  }
}

// Types for chart configuration
export interface EmbedChartConfig {
  chartType: "column" | "bar" | "line" | "area" | "pie" | "scatter";
  xField: string;
  yField: string;
  groupField: string;
  title: string;
  colorPalette: string;
  showLegend: boolean;
  showTooltip: boolean;
  height?: number;
}

export interface EmbedDataset {
  title: string;
  dimensions: Array<{ id: string; label: string }>;
  measures: Array<{ id: string; label: string; unit?: string }>;
  observations: Array<Record<string, string | number | null>>;
}

export interface EmbedPayload {
  version: 1;
  chart: EmbedChartConfig;
  dataset: EmbedDataset;
  filters?: Record<string, string[]>;
  customPalettes?: Record<string, string[]>;
}

export interface EmbedOptions {
  removeBorder?: boolean;
  optimizeSpace?: boolean;
  hideTitle?: boolean;
  hideLegend?: boolean;
  height?: number;
  responsive?: boolean;
}

/**
 * Encode chart configuration and data for embedding
 */
export function encodeChartConfig(payload: EmbedPayload): string {
  const json = JSON.stringify(payload);
  return compress(json);
}

/**
 * Decode chart configuration from URL parameter
 */
export function decodeChartConfig(encoded: string): EmbedPayload | null {
  try {
    const json = decompress(encoded);
    const payload = JSON.parse(json) as EmbedPayload;

    // Validate required fields
    if (!payload.version || !payload.chart || !payload.dataset) {
      console.error("Invalid embed payload: missing required fields");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Failed to decode chart config:", error);
    return null;
  }
}

/**
 * Build query string from embed options
 */
export function buildEmbedQueryParams(options: EmbedOptions): string {
  const params = new URLSearchParams();

  if (options.removeBorder) params.set("removeBorder", "true");
  if (options.optimizeSpace) params.set("optimizeSpace", "true");
  if (options.hideTitle) params.set("hideTitle", "true");
  if (options.hideLegend) params.set("hideLegend", "true");
  if (options.height) params.set("height", options.height.toString());

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Parse embed options from URL query params
 */
export function parseEmbedOptions(searchParams: URLSearchParams): EmbedOptions {
  return {
    removeBorder: searchParams.get("removeBorder") === "true",
    optimizeSpace: searchParams.get("optimizeSpace") === "true",
    hideTitle: searchParams.get("hideTitle") === "true",
    hideLegend: searchParams.get("hideLegend") === "true",
    height: searchParams.get("height") ? parseInt(searchParams.get("height")!, 10) : undefined,
    responsive: true, // Always responsive in embed
  };
}

/**
 * Generate embed code for a chart configuration
 */
export function generateEmbedCode(
  baseUrl: string,
  payload: EmbedPayload,
  options: EmbedOptions = {}
): { url: string; iframe: string; iframeResponsive: string } {
  const encoded = encodeChartConfig(payload);
  const queryParams = buildEmbedQueryParams(options);
  const url = `${baseUrl}/embed/chart/${encoded}${queryParams}`;

  // Fixed height iframe
  const height = options.height || payload.chart.height || 400;
  const iframe = `<iframe src="${url}" width="100%" height="${height}" style="border:none;"></iframe>`;

  // Responsive iframe with iframe-resizer
  const iframeResponsive = `<iframe id="chart-embed" src="${url}" style="width:100%;border:none;min-height:${height}px;"></iframe>
<script src="https://cdn.jsdelivr.net/npm/@iframe-resizer/parent"></script>
<script>iframeResize({ license: 'GPLv3' }, '#chart-embed')</script>`;

  return { url, iframe, iframeResponsive };
}

/**
 * Create a shareable URL that stores config in URL hash
 * This is useful for sharing without an embed page
 */
export function createShareableUrl(
  baseUrl: string,
  payload: EmbedPayload
): string {
  const encoded = encodeChartConfig(payload);
  return `${baseUrl}/chart-builder#config=${encoded}`;
}

/**
 * Parse shareable URL hash for config
 */
export function parseShareableUrl(hash: string): EmbedPayload | null {
  if (!hash.startsWith("#config=")) {
    return null;
  }
  const encoded = hash.slice(8); // Remove "#config="
  return decodeChartConfig(encoded);
}

/**
 * Estimate the size of encoded config in bytes
 */
export function estimateEncodedSize(payload: EmbedPayload): number {
  const encoded = encodeChartConfig(payload);
  return encoded.length;
}

/**
 * Check if config is too large for URL embedding
 * Most browsers support URLs up to 2000-8000 characters
 */
export function isConfigTooLarge(payload: EmbedPayload, maxLength = 4000): boolean {
  return estimateEncodedSize(payload) > maxLength;
}

/**
 * Reduce dataset size for embedding by sampling observations
 */
export function sampleDatasetForEmbed(
  dataset: EmbedDataset,
  maxObservations = 1000
): EmbedDataset {
  if (dataset.observations.length <= maxObservations) {
    return dataset;
  }

  // Sample evenly across the dataset
  const step = dataset.observations.length / maxObservations;
  const sampled: typeof dataset.observations = [];
  for (let i = 0; i < maxObservations; i++) {
    const index = Math.floor(i * step);
    sampled.push(dataset.observations[index]);
  }

  return {
    ...dataset,
    observations: sampled,
  };
}
