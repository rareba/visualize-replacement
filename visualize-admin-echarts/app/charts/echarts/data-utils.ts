/**
 * Data Utilities
 *
 * Shared utilities for data transformation and grouping in ECharts adapters.
 * Eliminates duplication of data preparation logic across adapters.
 */

// ============================================================================
// Time Series Data Grouping
// ============================================================================

export interface TimeSeriesGroupResult {
  xValues: number[];
  xLabels: string[];
  segmentDataMap: Map<string, Map<number, number | null>>;
}

/**
 * Groups time-series data by segment for line/area charts.
 * Handles both single-series and multi-series scenarios.
 */
export const groupTimeSeriesData = <T,>(
  chartData: T[],
  segments: string[],
  getSegment: (d: T) => string,
  getX: (d: T) => Date,
  getY: (d: T) => number | null,
  formatDate?: (date: Date) => string
): TimeSeriesGroupResult => {
  // Get unique X values sorted by time
  const xValues = [...new Set(chartData.map((d) => getX(d).getTime()))].sort(
    (a, b) => a - b
  );

  // Format X labels
  const dateFormatter = formatDate ?? ((d: Date) => d.toLocaleDateString());
  const xLabels = xValues.map((t) => dateFormatter(new Date(t)));

  // Group data by segment
  const segmentDataMap = new Map<string, Map<number, number | null>>();

  if (segments.length > 0) {
    // Multi-series: create a map for each segment
    segments.forEach((segment) => {
      segmentDataMap.set(segment, new Map());
    });

    chartData.forEach((d) => {
      const segment = getSegment(d);
      const x = getX(d).getTime();
      const y = getY(d);
      segmentDataMap.get(segment)?.set(x, y);
    });
  } else {
    // Single series: use "default" key
    segmentDataMap.set("default", new Map());
    chartData.forEach((d) => {
      const x = getX(d).getTime();
      const y = getY(d);
      segmentDataMap.get("default")?.set(x, y);
    });
  }

  return { xValues, xLabels, segmentDataMap };
};

/**
 * Builds series data array from segment data map.
 */
export const buildTimeSeriesData = (
  segmentData: Map<number, number | null> | undefined,
  xValues: number[]
): Array<number | null> => {
  return xValues.map((x) => segmentData?.get(x) ?? null);
};

// ============================================================================
// Category Data Grouping
// ============================================================================

export interface CategoryGroupResult<T> {
  categories: string[];
  categoryObservations: Map<string, T | undefined>;
}

/**
 * Groups category-based data for bar/column charts.
 */
export const groupCategoryData = <T,>(
  chartData: T[],
  categories: string[],
  getCategory: (d: T) => string
): CategoryGroupResult<T> => {
  const categoryObservations = new Map<string, T | undefined>();

  categories.forEach((category) => {
    const observation = chartData.find((d) => getCategory(d) === category);
    categoryObservations.set(category, observation);
  });

  return { categories, categoryObservations };
};

// ============================================================================
// Error Whisker Data Building
// ============================================================================

export interface ErrorWhiskerConfig<T> {
  categories: string[];
  chartData: T[];
  getCategory: (d: T) => string;
  getErrorPresent: (d: T) => boolean;
  getErrorRange: (d: T) => [number, number];
}

/**
 * Builds error whisker data for simple bar/column charts.
 * Returns array of [categoryIndex, lowValue, highValue].
 */
export const buildErrorWhiskerData = <T,>(
  config: ErrorWhiskerConfig<T>
): Array<[number, number, number]> => {
  const { categories, chartData, getCategory, getErrorPresent, getErrorRange } = config;
  const errorWhiskerData: Array<[number, number, number]> = [];

  categories.forEach((category, index) => {
    const observation = chartData.find((d) => getCategory(d) === category);
    if (observation && getErrorPresent(observation)) {
      const [low, high] = getErrorRange(observation);
      errorWhiskerData.push([index, low, high]);
    }
  });

  return errorWhiskerData;
};

export interface GroupedErrorWhiskerConfig<T> extends ErrorWhiskerConfig<T> {
  segments: string[];
  getSegment: (d: T) => string;
}

/**
 * Builds error whisker data for grouped bar/column charts.
 * Returns array of [categoryIndex + offset, lowValue, highValue, segmentIndex].
 */
export const buildGroupedErrorWhiskerData = <T,>(
  config: GroupedErrorWhiskerConfig<T>
): Array<[number, number, number, number]> => {
  const {
    categories,
    chartData,
    segments,
    getCategory,
    getSegment,
    getErrorPresent,
    getErrorRange,
  } = config;
  const errorWhiskerData: Array<[number, number, number, number]> = [];
  const numSegments = segments.length;

  categories.forEach((category, catIndex) => {
    segments.forEach((segment, segIndex) => {
      const observation = chartData.find(
        (d) => getCategory(d) === category && getSegment(d) === segment
      );
      if (observation && getErrorPresent(observation)) {
        const [low, high] = getErrorRange(observation);
        const offset = (segIndex - (numSegments - 1) / 2) / numSegments;
        errorWhiskerData.push([catIndex + offset, low, high, segIndex]);
      }
    });
  });

  return errorWhiskerData;
};

// ============================================================================
// Category Series Building
// ============================================================================

export interface CategorySeriesDataConfig<T> {
  categories: string[];
  chartData: T[];
  getCategory: (d: T) => string;
  getValue: (d: T) => number | null;
  getColor?: (d: T) => string;
}

/**
 * Builds series data for category-based charts.
 * Returns array of values with optional itemStyle colors.
 */
export const buildCategorySeriesData = <T,>(
  config: CategorySeriesDataConfig<T>
): Array<number | null | { value: number | null; itemStyle: { color: string } }> => {
  const { categories, chartData, getCategory, getValue, getColor } = config;

  return categories.map((category) => {
    const observation = chartData.find((d) => getCategory(d) === category);
    if (!observation) return null;

    const value = getValue(observation);

    if (getColor) {
      return {
        value,
        itemStyle: { color: getColor(observation) },
      };
    }

    return value;
  });
};

// ============================================================================
// Scatter Data Building
// ============================================================================

export interface ScatterDataPoint {
  x: number;
  y: number;
  segment?: string;
  label?: string;
  color?: string;
}

/**
 * Builds scatter plot data with optional segmentation.
 */
export const buildScatterData = <T,>(
  chartData: T[],
  getX: (d: T) => number | null,
  getY: (d: T) => number | null,
  getSegment?: (d: T) => string,
  getLabel?: (d: T) => string,
  getColor?: (d: T) => string
): ScatterDataPoint[] => {
  return chartData
    .filter((d) => getX(d) !== null && getY(d) !== null)
    .map((d) => ({
      x: getX(d)!,
      y: getY(d)!,
      segment: getSegment?.(d),
      label: getLabel?.(d),
      color: getColor?.(d),
    }));
};

/**
 * Groups scatter data by segment.
 */
export const groupScatterDataBySegment = (
  data: ScatterDataPoint[],
  segments: string[]
): Map<string, Array<[number, number]>> => {
  const segmentDataMap = new Map<string, Array<[number, number]>>();

  segments.forEach((segment) => {
    const segmentPoints = data
      .filter((d) => d.segment === segment)
      .map((d): [number, number] => [d.x, d.y]);
    segmentDataMap.set(segment, segmentPoints);
  });

  return segmentDataMap;
};

// ============================================================================
// Data Validation
// ============================================================================

/**
 * Checks if chart data is valid for rendering.
 */
export const isDataValid = <T,>(
  chartData: T[],
  getValue: (d: T) => number | null
): boolean => {
  if (!chartData || chartData.length === 0) return false;
  return chartData.some((d) => getValue(d) !== null);
};

/**
 * Filters out null values from data array.
 */
export const filterNullValues = <T,>(
  data: T[],
  getValue: (d: T) => number | null
): T[] => {
  return data.filter((d) => getValue(d) !== null);
};

/**
 * Gets the range of numeric values in data.
 */
export const getDataRange = <T,>(
  data: T[],
  getValue: (d: T) => number | null
): [number, number] | null => {
  const values = data.map(getValue).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return [Math.min(...values), Math.max(...values)];
};
