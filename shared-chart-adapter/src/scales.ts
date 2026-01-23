/**
 * Shared Scale Utilities
 *
 * Helper functions for creating scales that can be used across
 * different charting libraries. Uses d3-scale as the base since
 * it's library-agnostic and provides consistent behavior.
 */

import {
  scaleBand as d3ScaleBand,
  scaleLinear as d3ScaleLinear,
  scaleOrdinal as d3ScaleOrdinal,
  scaleTime as d3ScaleTime,
} from 'd3-scale';
import { extent, max, min } from 'd3-array';
import { schemeCategory10, schemeTableau10 } from 'd3-scale-chromatic';

import type {
  Observation,
  ValueGetter,
  BandScale,
  NumericScale,
  TimeScale,
  ColorScale,
} from './types';

// Swiss Federal color palette
export const SWISS_FEDERAL_COLORS = [
  '#d32f2f', // Red
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#0097a7', // Cyan
  '#c2185b', // Pink
  '#5d4037', // Brown
  '#616161', // Grey
  '#455a64', // Blue Grey
];

/**
 * Create a band scale for categorical data
 */
export function createBandScale(
  data: Observation[],
  getValue: ValueGetter<string>,
  range: [number, number],
  options?: {
    paddingInner?: number;
    paddingOuter?: number;
    sortFn?: (a: string, b: string) => number;
  }
): BandScale {
  const { paddingInner = 0.1, paddingOuter = 0.05, sortFn } = options || {};

  let domain = [...new Set(data.map(getValue))];
  if (sortFn) {
    domain = domain.sort(sortFn);
  }

  const scale = d3ScaleBand<string>()
    .domain(domain)
    .range(range)
    .paddingInner(paddingInner)
    .paddingOuter(paddingOuter);

  return scale as unknown as BandScale;
}

/**
 * Create a linear scale for numeric data
 */
export function createLinearScale(
  data: Observation[],
  getValue: ValueGetter<number | null>,
  range: [number, number],
  options?: {
    includeZero?: boolean;
    nice?: boolean;
    customDomain?: [number, number];
  }
): NumericScale {
  const { includeZero = true, nice = true, customDomain } = options || {};

  let domain: [number, number];

  if (customDomain) {
    domain = customDomain;
  } else {
    const values = data.map(getValue).filter((v): v is number => v !== null && !isNaN(v));
    const minVal = min(values) ?? 0;
    const maxVal = max(values) ?? 0;

    domain = [
      includeZero ? Math.min(0, minVal) : minVal,
      includeZero ? Math.max(0, maxVal) : maxVal,
    ];
  }

  const scale = d3ScaleLinear().domain(domain).range(range);

  if (nice) {
    scale.nice();
  }

  return scale as unknown as NumericScale;
}

/**
 * Create a time scale for temporal data
 */
export function createTimeScale(
  data: Observation[],
  getValue: ValueGetter<Date>,
  range: [number, number],
  options?: {
    nice?: boolean;
    customDomain?: [Date, Date];
  }
): TimeScale {
  const { nice = true, customDomain } = options || {};

  let domain: [Date, Date];

  if (customDomain) {
    domain = customDomain;
  } else {
    const dates = data.map(getValue).filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
    domain = extent(dates) as [Date, Date];
  }

  const scale = d3ScaleTime().domain(domain).range(range);

  if (nice) {
    scale.nice();
  }

  return scale as unknown as TimeScale;
}

/**
 * Create a color scale for categorical data
 */
export function createColorScale(
  data: Observation[],
  getSegment: ValueGetter<string>,
  options?: {
    palette?: string[];
    customColors?: Record<string, string>;
  }
): ColorScale {
  const { palette = SWISS_FEDERAL_COLORS, customColors } = options || {};

  const domain = [...new Set(data.map(getSegment))];

  if (customColors) {
    const colorFn = (value: string): string => {
      return customColors[value] || palette[domain.indexOf(value) % palette.length];
    };
    (colorFn as any).domain = () => domain;
    (colorFn as any).range = () => domain.map(colorFn);
    return colorFn as ColorScale;
  }

  const scale = d3ScaleOrdinal<string, string>()
    .domain(domain)
    .range(palette);

  return scale as unknown as ColorScale;
}

/**
 * Calculate margins based on axis labels and content
 */
export function calculateMargins(options: {
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}): { top: number; right: number; bottom: number; left: number } {
  const {
    showXAxis = true,
    showYAxis = true,
    xAxisLabel,
    yAxisLabel,
    showLegend = false,
    legendPosition = 'right',
  } = options;

  let top = 20;
  let right = 20;
  let bottom = 20;
  let left = 20;

  if (showXAxis) {
    bottom += 30;
    if (xAxisLabel) {
      bottom += 20;
    }
  }

  if (showYAxis) {
    left += 50;
    if (yAxisLabel) {
      left += 20;
    }
  }

  if (showLegend) {
    switch (legendPosition) {
      case 'top':
        top += 30;
        break;
      case 'bottom':
        bottom += 30;
        break;
      case 'left':
        left += 100;
        break;
      case 'right':
        right += 100;
        break;
    }
  }

  return { top, right, bottom, left };
}

/**
 * Generate tick values for a scale
 */
export function generateTicks(
  scale: NumericScale | TimeScale,
  count: number = 5
): number[] | Date[] {
  return scale.ticks(count);
}

/**
 * Format a tick value for display
 */
export function formatTick(
  value: number | Date | string,
  options?: {
    type?: 'number' | 'date' | 'string';
    decimals?: number;
    dateFormat?: string;
  }
): string {
  const { type = 'number', decimals = 2 } = options || {};

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(decimals);
  }

  return String(value);
}
