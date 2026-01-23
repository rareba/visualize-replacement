/**
 * Chart Registry - Centralized chart type configuration
 *
 * This file provides a single source of truth for all chart types.
 * Adding a new chart requires only updating this registry.
 *
 * Benefits:
 * - Single place to enable/disable charts
 * - Easy to see all supported chart types
 * - Type-safe chart configurations
 * - Simplifies maintenance
 */

import type { ChartType, RegularChartType } from "@/config-types";

// ============================================================================
// Chart Category Definitions
// ============================================================================

export type ChartCategory =
  | "basic"
  | "partOfWhole"
  | "hierarchical"
  | "statistical"
  | "flow"
  | "specialized"
  | "comparison";

export interface ChartCategoryInfo {
  labelKey: string;
  chartTypes: ChartType[];
}

// ============================================================================
// Chart Metadata
// ============================================================================

export interface ChartMetadata {
  /** The chart type identifier */
  type: ChartType;
  /** Whether this chart is enabled (can be shown in selector) */
  enabled: boolean;
  /** Category this chart belongs to */
  category: ChartCategory;
  /** Order within the category (lower = earlier) */
  order: number;
  /** Symbol type for legend */
  symbol: "square" | "line" | "circle";
  /** Translation key for the chart name */
  labelKey: string;
  /** Translation key for the chart description */
  descriptionKey: string;
  /** Icon name for the chart */
  iconName: string;
  /** Whether this is a combo chart (requires multiple cubes) */
  isCombo: boolean;
  /** Minimum number of dimensions required */
  minDimensions: number;
  /** Minimum number of measures required */
  minMeasures: number;
  /** Whether this chart requires temporal dimension */
  requiresTemporal: boolean;
  /** Whether this chart requires geographical dimension */
  requiresGeo: boolean;
  /** Whether this chart requires categorical dimension */
  requiresCategorical: boolean;
  /** Whether this uses ECharts (vs D3 or other) */
  usesECharts: boolean;
}

// ============================================================================
// Chart Registry - Master Configuration
// ============================================================================

/**
 * Master registry of all chart types.
 * To add a new chart:
 * 1. Add an entry here with enabled: true
 * 2. Create the ECharts adapter in /charts/echarts/adapters/
 * 3. Export it from /charts/echarts/adapters/index.ts
 * 4. Add translations for labelKey and descriptionKey
 */
export const CHART_REGISTRY: Record<ChartType, ChartMetadata> = {
  // ============================================================================
  // Basic Charts
  // ============================================================================
  column: {
    type: "column",
    enabled: true,
    category: "basic",
    order: 1,
    symbol: "square",
    labelKey: "chart.column.title",
    descriptionKey: "chart.column.description",
    iconName: "columnChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  bar: {
    type: "bar",
    enabled: true,
    category: "basic",
    order: 2,
    symbol: "square",
    labelKey: "chart.bar.title",
    descriptionKey: "chart.bar.description",
    iconName: "barChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  line: {
    type: "line",
    enabled: true,
    category: "basic",
    order: 3,
    symbol: "line",
    labelKey: "chart.line.title",
    descriptionKey: "chart.line.description",
    iconName: "lineChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: true,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },
  area: {
    type: "area",
    enabled: true,
    category: "basic",
    order: 4,
    symbol: "square",
    labelKey: "chart.area.title",
    descriptionKey: "chart.area.description",
    iconName: "areaChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: true,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },
  scatterplot: {
    type: "scatterplot",
    enabled: true,
    category: "basic",
    order: 5,
    symbol: "circle",
    labelKey: "chart.scatterplot.title",
    descriptionKey: "chart.scatterplot.description",
    iconName: "scatterplotChart",
    isCombo: false,
    minDimensions: 0,
    minMeasures: 2,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },

  // ============================================================================
  // Part of Whole Charts
  // ============================================================================
  pie: {
    type: "pie",
    enabled: true,
    category: "partOfWhole",
    order: 1,
    symbol: "square",
    labelKey: "chart.pie.title",
    descriptionKey: "chart.pie.description",
    iconName: "pieChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  donut: {
    type: "donut",
    enabled: true,
    category: "partOfWhole",
    order: 2,
    symbol: "square",
    labelKey: "chart.donut.title",
    descriptionKey: "chart.donut.description",
    iconName: "donutChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  funnel: {
    type: "funnel",
    enabled: true,
    category: "partOfWhole",
    order: 3,
    symbol: "square",
    labelKey: "chart.funnel.title",
    descriptionKey: "chart.funnel.description",
    iconName: "funnelChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  waterfall: {
    type: "waterfall",
    enabled: true,
    category: "partOfWhole",
    order: 4,
    symbol: "square",
    labelKey: "chart.waterfall.title",
    descriptionKey: "chart.waterfall.description",
    iconName: "waterfallChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },

  // ============================================================================
  // Hierarchical Charts
  // ============================================================================
  treemap: {
    type: "treemap",
    enabled: true,
    category: "hierarchical",
    order: 1,
    symbol: "square",
    labelKey: "chart.treemap.title",
    descriptionKey: "chart.treemap.description",
    iconName: "treemapChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  sunburst: {
    type: "sunburst",
    enabled: true,
    category: "hierarchical",
    order: 2,
    symbol: "square",
    labelKey: "chart.sunburst.title",
    descriptionKey: "chart.sunburst.description",
    iconName: "sunburstChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },

  // ============================================================================
  // Statistical Charts
  // ============================================================================
  boxplot: {
    type: "boxplot",
    enabled: true,
    category: "statistical",
    order: 1,
    symbol: "square",
    labelKey: "chart.boxplot.title",
    descriptionKey: "chart.boxplot.description",
    iconName: "boxplotChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  heatmap: {
    type: "heatmap",
    enabled: true,
    category: "statistical",
    order: 2,
    symbol: "square",
    labelKey: "chart.heatmap.title",
    descriptionKey: "chart.heatmap.description",
    iconName: "heatmapChart",
    isCombo: false,
    minDimensions: 2,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },

  // ============================================================================
  // Flow Charts
  // ============================================================================
  sankey: {
    type: "sankey",
    enabled: true,
    category: "flow",
    order: 1,
    symbol: "square",
    labelKey: "chart.sankey.title",
    descriptionKey: "chart.sankey.description",
    iconName: "sankeyChart",
    isCombo: false,
    minDimensions: 2,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },

  // ============================================================================
  // Specialized Charts
  // ============================================================================
  radar: {
    type: "radar",
    enabled: true,
    category: "specialized",
    order: 1,
    symbol: "line",
    labelKey: "chart.radar.title",
    descriptionKey: "chart.radar.description",
    iconName: "radarChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  gauge: {
    type: "gauge",
    enabled: true,
    category: "specialized",
    order: 2,
    symbol: "circle",
    labelKey: "chart.gauge.title",
    descriptionKey: "chart.gauge.description",
    iconName: "gaugeChart",
    isCombo: false,
    minDimensions: 0,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },
  polar: {
    type: "polar",
    enabled: true,
    category: "specialized",
    order: 3,
    symbol: "circle",
    labelKey: "chart.polar.title",
    descriptionKey: "chart.polar.description",
    iconName: "polarChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  wordcloud: {
    type: "wordcloud",
    enabled: true,
    category: "specialized",
    order: 4,
    symbol: "square",
    labelKey: "chart.wordcloud.title",
    descriptionKey: "chart.wordcloud.description",
    iconName: "wordcloudChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: true,
    usesECharts: true,
  },
  map: {
    type: "map",
    enabled: true,
    category: "specialized",
    order: 5,
    symbol: "square",
    labelKey: "chart.map.title",
    descriptionKey: "chart.map.description",
    iconName: "mapChart",
    isCombo: false,
    minDimensions: 1,
    minMeasures: 1,
    requiresTemporal: false,
    requiresGeo: true,
    requiresCategorical: false,
    usesECharts: false, // Uses Mapbox
  },
  table: {
    type: "table",
    enabled: true,
    category: "specialized",
    order: 6,
    symbol: "square",
    labelKey: "chart.table.title",
    descriptionKey: "chart.table.description",
    iconName: "tableChart",
    isCombo: false,
    minDimensions: 0,
    minMeasures: 0,
    requiresTemporal: false,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: false, // Uses HTML table
  },

  // ============================================================================
  // Comparison (Combo) Charts
  // ============================================================================
  comboLineSingle: {
    type: "comboLineSingle",
    enabled: true,
    category: "comparison",
    order: 1,
    symbol: "line",
    labelKey: "chart.comboLineSingle.title",
    descriptionKey: "chart.comboLineSingle.description",
    iconName: "comboLineSingleChart",
    isCombo: true,
    minDimensions: 1,
    minMeasures: 2,
    requiresTemporal: true,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },
  comboLineDual: {
    type: "comboLineDual",
    enabled: true,
    category: "comparison",
    order: 2,
    symbol: "line",
    labelKey: "chart.comboLineDual.title",
    descriptionKey: "chart.comboLineDual.description",
    iconName: "comboLineDualChart",
    isCombo: true,
    minDimensions: 1,
    minMeasures: 2,
    requiresTemporal: true,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },
  comboLineColumn: {
    type: "comboLineColumn",
    enabled: true,
    category: "comparison",
    order: 3,
    symbol: "square",
    labelKey: "chart.comboLineColumn.title",
    descriptionKey: "chart.comboLineColumn.description",
    iconName: "comboLineColumnChart",
    isCombo: true,
    minDimensions: 1,
    minMeasures: 2,
    requiresTemporal: true,
    requiresGeo: false,
    requiresCategorical: false,
    usesECharts: true,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Get all enabled chart types */
export const getEnabledChartTypesFromRegistry = (): ChartType[] => {
  return Object.values(CHART_REGISTRY)
    .filter((meta) => meta.enabled)
    .map((meta) => meta.type);
};

/** Get all chart types (including disabled) */
export const getAllChartTypes = (): ChartType[] => {
  return Object.keys(CHART_REGISTRY) as ChartType[];
};

/** Get regular (non-combo) chart types */
export const getRegularChartTypes = (): RegularChartType[] => {
  return Object.values(CHART_REGISTRY)
    .filter((meta) => !meta.isCombo)
    .map((meta) => meta.type) as RegularChartType[];
};

/** Get combo chart types */
export const getComboChartTypes = (): ChartType[] => {
  return Object.values(CHART_REGISTRY)
    .filter((meta) => meta.isCombo)
    .map((meta) => meta.type);
};

/** Get chart types by category */
export const getChartTypesByCategory = (category: ChartCategory): ChartType[] => {
  return Object.values(CHART_REGISTRY)
    .filter((meta) => meta.category === category && meta.enabled)
    .sort((a, b) => a.order - b.order)
    .map((meta) => meta.type);
};

/** Get chart metadata */
export const getChartMetadata = (chartType: ChartType): ChartMetadata => {
  return CHART_REGISTRY[chartType];
};

/** Get chart symbol */
export const getChartSymbolFromRegistry = (
  chartType: ChartType
): "square" | "line" | "circle" => {
  return CHART_REGISTRY[chartType].symbol;
};

/** Check if chart is enabled */
export const isChartEnabled = (chartType: ChartType): boolean => {
  return CHART_REGISTRY[chartType].enabled;
};

/** Get category info */
export const getChartCategories = (): ChartCategoryInfo[] => {
  const categories: ChartCategory[] = [
    "basic",
    "partOfWhole",
    "hierarchical",
    "statistical",
    "flow",
    "specialized",
    "comparison",
  ];

  return categories.map((cat) => ({
    labelKey: `controls.chart.type.category.${cat}`,
    chartTypes: getChartTypesByCategory(cat),
  }));
};

/** Get ECharts-based chart types */
export const getEChartsChartTypes = (): ChartType[] => {
  return Object.values(CHART_REGISTRY)
    .filter((meta) => meta.usesECharts && meta.enabled)
    .map((meta) => meta.type);
};

/** Check if chart uses ECharts */
export const isEChartsChart = (chartType: ChartType): boolean => {
  return CHART_REGISTRY[chartType].usesECharts;
};
