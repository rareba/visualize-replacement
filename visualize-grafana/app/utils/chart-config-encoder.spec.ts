/**
 * Tests for Chart Configuration Encoder/Decoder
 *
 * This module tests URL-safe encoding/decoding of chart configurations
 * for embedding charts without database storage.
 */

import { describe, it, expect, vi } from "vitest";
import {
  encodeChartConfig,
  decodeChartConfig,
  buildEmbedQueryParams,
  parseEmbedOptions,
  generateEmbedCode,
  createShareableUrl,
  parseShareableUrl,
  estimateEncodedSize,
  isConfigTooLarge,
  sampleDatasetForEmbed,
  minimizeObservationsForEmbed,
  preparePayloadForEmbed,
  type EmbedPayload,
  type EmbedChartConfig,
  type EmbedDataset,
  type EmbedOptions,
} from "./chart-config-encoder";

// Mock console.error to suppress expected error messages in tests
vi.spyOn(console, "error").mockImplementation(() => {});

describe("chart-config-encoder", () => {
  // Test data fixtures
  const createTestPayload = (): EmbedPayload => ({
    version: 1,
    chart: {
      chartType: "column",
      xField: "https://example.org/dimension/year",
      yField: "https://example.org/measure/value",
      groupField: "https://example.org/dimension/category",
      title: "Test Chart",
      colorPalette: "swiss",
      showLegend: true,
      showTooltip: true,
      height: 400,
    },
    dataset: {
      title: "Test Dataset",
      dimensions: [
        { id: "https://example.org/dimension/year", label: "Year" },
        { id: "https://example.org/dimension/category", label: "Category" },
      ],
      measures: [
        { id: "https://example.org/measure/value", label: "Value", unit: "CHF" },
      ],
      observations: [
        { "https://example.org/dimension/year": "2020", "https://example.org/dimension/category": "A", "https://example.org/measure/value": 100 },
        { "https://example.org/dimension/year": "2021", "https://example.org/dimension/category": "A", "https://example.org/measure/value": 150 },
        { "https://example.org/dimension/year": "2020", "https://example.org/dimension/category": "B", "https://example.org/measure/value": 200 },
        { "https://example.org/dimension/year": "2021", "https://example.org/dimension/category": "B", "https://example.org/measure/value": 250 },
      ],
    },
  });

  describe("encodeChartConfig and decodeChartConfig", () => {
    it("should encode and decode a valid payload", () => {
      const payload = createTestPayload();
      const encoded = encodeChartConfig(payload);
      const decoded = decodeChartConfig(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.version).toBe(1);
      expect(decoded?.chart.chartType).toBe("column");
      expect(decoded?.chart.title).toBe("Test Chart");
      expect(decoded?.dataset.title).toBe("Test Dataset");
      expect(decoded?.dataset.observations).toHaveLength(4);
    });

    it("should produce URL-safe strings without +, /, or =", () => {
      const payload = createTestPayload();
      const encoded = encodeChartConfig(payload);

      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
    });

    it("should handle special characters in payload", () => {
      const payload = createTestPayload();
      payload.chart.title = "Test & Chart <with> special \"chars\"";
      payload.dataset.title = "Dataset with unicode: Zurich";

      const encoded = encodeChartConfig(payload);
      const decoded = decodeChartConfig(encoded);

      expect(decoded?.chart.title).toBe("Test & Chart <with> special \"chars\"");
      expect(decoded?.dataset.title).toBe("Dataset with unicode: Zurich");
    });

    it("should handle empty observations array", () => {
      const payload = createTestPayload();
      payload.dataset.observations = [];

      const encoded = encodeChartConfig(payload);
      const decoded = decodeChartConfig(encoded);

      expect(decoded?.dataset.observations).toHaveLength(0);
    });

    it("should return null for invalid encoded string", () => {
      const decoded = decodeChartConfig("invalid-base64-string!");
      expect(decoded).toBeNull();
    });

    it("should return null for empty encoded string", () => {
      const decoded = decodeChartConfig("");
      expect(decoded).toBeNull();
    });

    it("should return null for valid JSON missing required fields", () => {
      const invalidPayload = { chart: {} };
      const encoded = encodeChartConfig(invalidPayload as unknown as EmbedPayload);
      const decoded = decodeChartConfig(encoded);

      expect(decoded).toBeNull();
    });

    it("should handle filters in payload", () => {
      const payload = createTestPayload();
      payload.filters = {
        "https://example.org/dimension/category": ["A", "B"],
      };

      const encoded = encodeChartConfig(payload);
      const decoded = decodeChartConfig(encoded);

      expect(decoded?.filters).toBeDefined();
      expect(decoded?.filters?.["https://example.org/dimension/category"]).toEqual(["A", "B"]);
    });

    it("should handle customPalettes in payload", () => {
      const payload = createTestPayload();
      payload.customPalettes = {
        myPalette: ["#FF0000", "#00FF00", "#0000FF"],
      };

      const encoded = encodeChartConfig(payload);
      const decoded = decodeChartConfig(encoded);

      expect(decoded?.customPalettes?.myPalette).toEqual(["#FF0000", "#00FF00", "#0000FF"]);
    });

    it("should handle all chart types", () => {
      const chartTypes = ["column", "bar", "line", "area", "pie", "scatter"] as const;

      for (const chartType of chartTypes) {
        const payload = createTestPayload();
        payload.chart.chartType = chartType;

        const encoded = encodeChartConfig(payload);
        const decoded = decodeChartConfig(encoded);

        expect(decoded?.chart.chartType).toBe(chartType);
      }
    });
  });

  describe("buildEmbedQueryParams", () => {
    it("should return empty string when no options set", () => {
      const params = buildEmbedQueryParams({});
      expect(params).toBe("");
    });

    it("should include removeBorder when true", () => {
      const params = buildEmbedQueryParams({ removeBorder: true });
      expect(params).toContain("removeBorder=true");
    });

    it("should include all options when set", () => {
      const params = buildEmbedQueryParams({
        removeBorder: true,
        optimizeSpace: true,
        hideTitle: true,
        hideLegend: true,
        height: 500,
      });

      expect(params).toContain("removeBorder=true");
      expect(params).toContain("optimizeSpace=true");
      expect(params).toContain("hideTitle=true");
      expect(params).toContain("hideLegend=true");
      expect(params).toContain("height=500");
    });

    it("should not include options when false", () => {
      const params = buildEmbedQueryParams({
        removeBorder: false,
        optimizeSpace: false,
      });
      expect(params).toBe("");
    });

    it("should start with ? when options present", () => {
      const params = buildEmbedQueryParams({ height: 400 });
      expect(params.startsWith("?")).toBe(true);
    });
  });

  describe("parseEmbedOptions", () => {
    it("should parse all options from URL params", () => {
      const params = new URLSearchParams(
        "removeBorder=true&optimizeSpace=true&hideTitle=true&hideLegend=true&height=500"
      );
      const options = parseEmbedOptions(params);

      expect(options.removeBorder).toBe(true);
      expect(options.optimizeSpace).toBe(true);
      expect(options.hideTitle).toBe(true);
      expect(options.hideLegend).toBe(true);
      expect(options.height).toBe(500);
      expect(options.responsive).toBe(true);
    });

    it("should return false for missing boolean options", () => {
      const params = new URLSearchParams("");
      const options = parseEmbedOptions(params);

      expect(options.removeBorder).toBe(false);
      expect(options.optimizeSpace).toBe(false);
      expect(options.hideTitle).toBe(false);
      expect(options.hideLegend).toBe(false);
    });

    it("should return undefined for missing height", () => {
      const params = new URLSearchParams("");
      const options = parseEmbedOptions(params);

      expect(options.height).toBeUndefined();
    });

    it("should parse height as integer", () => {
      const params = new URLSearchParams("height=400.5");
      const options = parseEmbedOptions(params);

      expect(options.height).toBe(400);
    });
  });

  describe("generateEmbedCode", () => {
    it("should generate URL with encoded config", () => {
      const payload = createTestPayload();
      const { url } = generateEmbedCode("https://example.com", payload);

      expect(url).toContain("https://example.com/embed/chart/");
    });

    it("should generate fixed height iframe", () => {
      const payload = createTestPayload();
      const { iframe } = generateEmbedCode("https://example.com", payload);

      expect(iframe).toContain("<iframe");
      expect(iframe).toContain('height="400"');
      expect(iframe).toContain('style="border:none;"');
    });

    it("should generate responsive iframe with iframe-resizer", () => {
      const payload = createTestPayload();
      const { iframeResponsive } = generateEmbedCode("https://example.com", payload);

      expect(iframeResponsive).toContain("<iframe");
      expect(iframeResponsive).toContain("iframe-resizer");
      expect(iframeResponsive).toContain("iframeResize");
    });

    it("should use custom height from options", () => {
      const payload = createTestPayload();
      const { iframe } = generateEmbedCode("https://example.com", payload, { height: 600 });

      expect(iframe).toContain('height="600"');
    });

    it("should include query params when options set", () => {
      const payload = createTestPayload();
      const { url } = generateEmbedCode("https://example.com", payload, {
        removeBorder: true,
        hideTitle: true,
      });

      expect(url).toContain("?");
      expect(url).toContain("removeBorder=true");
      expect(url).toContain("hideTitle=true");
    });
  });

  describe("createShareableUrl and parseShareableUrl", () => {
    it("should create a shareable URL with hash", () => {
      const payload = createTestPayload();
      const url = createShareableUrl("https://example.com", payload);

      expect(url).toContain("https://example.com/chart-builder#config=");
    });

    it("should parse shareable URL hash", () => {
      const payload = createTestPayload();
      const url = createShareableUrl("https://example.com", payload);
      const hash = url.split("#")[1];

      const parsed = parseShareableUrl(`#${hash}`);

      expect(parsed).not.toBeNull();
      expect(parsed?.chart.title).toBe("Test Chart");
    });

    it("should return null for non-config hash", () => {
      const parsed = parseShareableUrl("#other=value");
      expect(parsed).toBeNull();
    });

    it("should return null for empty hash", () => {
      const parsed = parseShareableUrl("");
      expect(parsed).toBeNull();
    });
  });

  describe("estimateEncodedSize", () => {
    it("should return size in bytes", () => {
      const payload = createTestPayload();
      const size = estimateEncodedSize(payload);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("should increase with more observations", () => {
      const smallPayload = createTestPayload();
      const largePayload = createTestPayload();

      // Add many more observations
      for (let i = 0; i < 100; i++) {
        largePayload.dataset.observations.push({
          "https://example.org/dimension/year": `202${i}`,
          "https://example.org/dimension/category": "X",
          "https://example.org/measure/value": i * 10,
        });
      }

      const smallSize = estimateEncodedSize(smallPayload);
      const largeSize = estimateEncodedSize(largePayload);

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe("isConfigTooLarge", () => {
    it("should return false for small payloads", () => {
      const payload = createTestPayload();
      expect(isConfigTooLarge(payload)).toBe(false);
    });

    it("should return true for very large payloads", () => {
      const payload = createTestPayload();

      // Add many observations to make it large
      for (let i = 0; i < 5000; i++) {
        payload.dataset.observations.push({
          "https://example.org/dimension/year": `${2000 + i}`,
          "https://example.org/dimension/category": `Category${i}`,
          "https://example.org/measure/value": i * 100,
        });
      }

      expect(isConfigTooLarge(payload)).toBe(true);
    });

    it("should use custom maxLength", () => {
      const payload = createTestPayload();
      expect(isConfigTooLarge(payload, 100)).toBe(true);
      expect(isConfigTooLarge(payload, 10000)).toBe(false);
    });
  });

  describe("sampleDatasetForEmbed", () => {
    it("should not sample if under maxObservations", () => {
      const dataset: EmbedDataset = {
        title: "Test",
        dimensions: [],
        measures: [],
        observations: [{ a: 1 }, { a: 2 }, { a: 3 }],
      };

      const sampled = sampleDatasetForEmbed(dataset, 10);
      expect(sampled.observations).toHaveLength(3);
    });

    it("should sample if over maxObservations", () => {
      const observations = Array.from({ length: 500 }, (_, i) => ({ value: i }));
      const dataset: EmbedDataset = {
        title: "Test",
        dimensions: [],
        measures: [],
        observations,
      };

      const sampled = sampleDatasetForEmbed(dataset, 100);
      expect(sampled.observations).toHaveLength(100);
    });

    it("should sample evenly across the dataset", () => {
      const observations = Array.from({ length: 100 }, (_, i) => ({ value: i }));
      const dataset: EmbedDataset = {
        title: "Test",
        dimensions: [],
        measures: [],
        observations,
      };

      const sampled = sampleDatasetForEmbed(dataset, 10);

      // Check that first and last are from beginning and end
      expect(sampled.observations[0].value).toBe(0);
      expect(sampled.observations[9].value).toBe(90);
    });
  });

  describe("minimizeObservationsForEmbed", () => {
    it("should keep only required fields", () => {
      const observations = [
        {
          "https://example.org/x": "A",
          "https://example.org/y": 100,
          "https://example.org/extra": "unused",
        },
      ];

      const chartConfig: EmbedChartConfig = {
        chartType: "column",
        xField: "https://example.org/x",
        yField: "https://example.org/y",
        groupField: "",
        title: "Test",
        colorPalette: "swiss",
        showLegend: true,
        showTooltip: true,
      };

      const minimized = minimizeObservationsForEmbed(observations, chartConfig);

      expect(minimized[0]).toHaveProperty("x");
      expect(minimized[0]).toHaveProperty("y");
      expect(minimized[0]).not.toHaveProperty("extra");
    });

    it("should include groupField when set", () => {
      const observations = [
        {
          "https://example.org/x": "A",
          "https://example.org/y": 100,
          "https://example.org/group": "G1",
        },
      ];

      const chartConfig: EmbedChartConfig = {
        chartType: "column",
        xField: "https://example.org/x",
        yField: "https://example.org/y",
        groupField: "https://example.org/group",
        title: "Test",
        colorPalette: "swiss",
        showLegend: true,
        showTooltip: true,
      };

      const minimized = minimizeObservationsForEmbed(observations, chartConfig);

      expect(minimized[0]).toHaveProperty("group");
    });

    it("should include filter fields", () => {
      const observations = [
        {
          "https://example.org/x": "A",
          "https://example.org/y": 100,
          "https://example.org/filter": "F1",
        },
      ];

      const chartConfig: EmbedChartConfig = {
        chartType: "column",
        xField: "https://example.org/x",
        yField: "https://example.org/y",
        groupField: "",
        title: "Test",
        colorPalette: "swiss",
        showLegend: true,
        showTooltip: true,
      };

      const minimized = minimizeObservationsForEmbed(
        observations,
        chartConfig,
        ["https://example.org/filter"]
      );

      expect(minimized[0]).toHaveProperty("filter");
    });

    it("should shorten URI values", () => {
      const observations = [
        {
          "https://example.org/x": "https://example.org/value/test-value",
          "https://example.org/y": 100,
        },
      ];

      const chartConfig: EmbedChartConfig = {
        chartType: "column",
        xField: "https://example.org/x",
        yField: "https://example.org/y",
        groupField: "",
        title: "Test",
        colorPalette: "swiss",
        showLegend: true,
        showTooltip: true,
      };

      const minimized = minimizeObservationsForEmbed(observations, chartConfig);

      expect(minimized[0].x).toBe("test-value");
    });

    it("should keep numeric values as-is", () => {
      const observations = [
        {
          "https://example.org/x": "A",
          "https://example.org/y": 123.45,
        },
      ];

      const chartConfig: EmbedChartConfig = {
        chartType: "column",
        xField: "https://example.org/x",
        yField: "https://example.org/y",
        groupField: "",
        title: "Test",
        colorPalette: "swiss",
        showLegend: true,
        showTooltip: true,
      };

      const minimized = minimizeObservationsForEmbed(observations, chartConfig);

      expect(minimized[0].y).toBe(123.45);
    });
  });

  describe("preparePayloadForEmbed", () => {
    it("should minimize and sample payload", () => {
      const payload = createTestPayload();
      const prepared = preparePayloadForEmbed(payload, 100);

      expect(prepared.version).toBe(1);
      expect(prepared.chart.xField).not.toContain("https://");
      expect(prepared.chart.yField).not.toContain("https://");
    });

    it("should sample when over maxObservations", () => {
      const payload = createTestPayload();
      for (let i = 0; i < 200; i++) {
        payload.dataset.observations.push({
          "https://example.org/dimension/year": `${2000 + i}`,
          "https://example.org/dimension/category": "X",
          "https://example.org/measure/value": i,
        });
      }

      const prepared = preparePayloadForEmbed(payload, 50);
      expect(prepared.dataset.observations.length).toBe(50);
    });

    it("should minimize dimensions and measures", () => {
      const payload = createTestPayload();
      const prepared = preparePayloadForEmbed(payload);

      // Only relevant dimensions/measures should remain
      expect(prepared.dataset.dimensions.length).toBeLessThanOrEqual(
        payload.dataset.dimensions.length
      );
    });

    it("should minimize filter keys", () => {
      const payload = createTestPayload();
      payload.filters = {
        "https://example.org/dimension/category": ["https://example.org/value/A"],
      };

      const prepared = preparePayloadForEmbed(payload);

      expect(prepared.filters).toBeDefined();
      const filterKeys = Object.keys(prepared.filters || {});
      expect(filterKeys[0]).not.toContain("https://");
    });

    it("should preserve customPalettes", () => {
      const payload = createTestPayload();
      payload.customPalettes = {
        myPalette: ["#FF0000"],
      };

      const prepared = preparePayloadForEmbed(payload);

      expect(prepared.customPalettes?.myPalette).toEqual(["#FF0000"]);
    });
  });

  describe("roundtrip encode/decode with prepared payload", () => {
    it("should work end-to-end", () => {
      const originalPayload = createTestPayload();
      originalPayload.filters = {
        "https://example.org/dimension/category": ["A"],
      };

      // Prepare for embed (minimize)
      const prepared = preparePayloadForEmbed(originalPayload);

      // Encode
      const encoded = encodeChartConfig(prepared);

      // Verify URL-safe
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");

      // Decode
      const decoded = decodeChartConfig(encoded);

      // Verify structure
      expect(decoded).not.toBeNull();
      expect(decoded?.version).toBe(1);
      expect(decoded?.chart.chartType).toBe("column");
      expect(decoded?.dataset.observations.length).toBeGreaterThan(0);
    });
  });
});
