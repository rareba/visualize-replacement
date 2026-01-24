/**
 * Test Utilities for Universal Adapters
 *
 * Provides mock data and helper functions for testing universal adapters.
 */

import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";

import type { UniversalChartState, FieldAccessors, ColorAccessors } from "@/charts/core/universal-chart-state";
import type { ChartType } from "@/config-types";
import type { Observation } from "@/domain/data";

/**
 * Creates a mock UniversalChartState for testing.
 */
export const createMockUniversalChartState = (
  overrides: Partial<UniversalChartState> & {
    chartType: ChartType;
    observations?: Observation[];
    segments?: string[];
    categories?: string[];
    fields?: Partial<FieldAccessors>;
    colors?: Partial<ColorAccessors>;
  }
): UniversalChartState => {
  const {
    chartType,
    observations = [],
    segments = [],
    categories = [],
    fields = {},
    colors = {},
    ...rest
  } = overrides;

  // Create default color scale
  const defaultColorScale = scaleOrdinal<string, string>()
    .domain(segments)
    .range(schemeCategory10);

  // Default field accessors
  const defaultFields: FieldAccessors = {
    getX: undefined,
    getY: undefined,
    getSegment: undefined,
    ...fields,
  };

  // Default color accessors
  const defaultColors: ColorAccessors = {
    getColor: (segment: string) => defaultColorScale(segment),
    colorDomain: segments,
    colorScale: defaultColorScale,
    ...colors,
  };

  // Default bounds (Bounds type requires all properties)
  const defaultBounds = {
    width: 600,
    height: 500,
    chartWidth: 500,
    chartHeight: 400,
    aspectRatio: 1.25,
    margins: {
      top: 40,
      right: 40,
      bottom: 60,
      left: 60,
    },
  };

  return {
    chartType,
    chartConfig: {
      version: 1,
      chartType,
      cubes: [],
      fields: {} as any,
      interactiveFiltersConfig: {
        legend: { active: false, componentId: "" },
        timeRange: { active: false, componentId: "", presets: { type: "range", from: "", to: "" } },
        dataFilters: { active: false, componentIds: [], defaultValueOverrides: {}, filterTypes: {} },
        calculation: { active: false, type: "identity" },
      },
      meta: {
        title: {},
        description: {},
        label: {},
      },
    } as any,
    observations,
    allObservations: observations,
    dimensions: [],
    measures: [],
    dimensionsById: {},
    measuresById: {},
    fields: defaultFields,
    colors: defaultColors,
    bounds: defaultBounds,
    segments,
    categories,
    metadata: {
      xAxisLabel: "X Axis",
      yAxisLabel: "Y Axis",
      formatNumber: (v: number) => v.toLocaleString(),
    },
    options: {
      showValues: true,
    },
    interactiveFiltersConfig: {
      legend: { active: false, componentId: "" },
      timeRange: { active: false, componentId: "", presets: { type: "range", from: "", to: "" } },
      dataFilters: { active: false, componentIds: [], defaultValueOverrides: {}, filterTypes: {} },
      calculation: { active: false, type: "identity" },
    },
    ...rest,
  };
};

/**
 * Creates mock observations for testing.
 */
export const createMockObservations = (
  count: number,
  options: {
    segmentField?: string;
    xField?: string;
    yField?: string;
    segments?: string[];
  } = {}
): Observation[] => {
  const {
    segmentField = "segment",
    xField = "x",
    yField = "value",
    segments = ["A", "B", "C"],
  } = options;

  return Array.from({ length: count }, (_, i) => ({
    [segmentField]: segments[i % segments.length],
    [xField]: `Category ${i}`,
    [yField]: (i + 1) * 100,
  }));
};
