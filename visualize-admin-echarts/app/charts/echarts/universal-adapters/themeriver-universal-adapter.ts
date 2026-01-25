/**
 * Universal ThemeRiver Chart Adapter
 *
 * A pure function adapter for ThemeRiver (streamgraph) charts.
 * Displays data as a flowing river showing how themes/categories
 * evolve over time.
 *
 * Lines of code: ~150
 */

import {
  createAxisTooltip,
  createLegend,
  safeGetBounds,
} from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// ThemeRiver Adapter Function
// ============================================================================

/**
 * Universal ThemeRiver Chart Adapter
 *
 * Transforms UniversalChartState into ECharts themeRiver configuration.
 * ThemeRiver displays data as stacked streamgraph where:
 * - X axis: time/category dimension
 * - Streams: segments/categories
 * - Width: values
 */
export const themeriverUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, bounds, metadata, segments, categories } = state;
  const { getX, getY, getSegment } = fields;

  const safeBounds = safeGetBounds(bounds);

  // Build data matrix for themeRiver
  // Format: [date/time, value, theme/segment]
  const riverData: Array<[string, number, string]> = [];
  const segmentSet = new Set<string>();
  const timeSet = new Set<string>();

  observations.forEach((d) => {
    if (!getX || !getY) return;

    const time = String(getX(d));
    const value = getY(d) ?? 0;
    const segment = getSegment ? getSegment(d) : "default";

    timeSet.add(time);
    segmentSet.add(segment);
    riverData.push([time, value, segment]);
  });

  // Get sorted unique segments and times
  const uniqueSegments = segments.length > 0 ? segments : Array.from(segmentSet);
  const uniqueTimes = categories.length > 0 ? categories : Array.from(timeSet).sort();

  // Build complete data matrix (fill missing combinations with 0)
  const completeData: Array<[string, number, string]> = [];

  uniqueTimes.forEach((time) => {
    uniqueSegments.forEach((segment) => {
      const existing = riverData.find(
        (d) => d[0] === time && d[2] === segment
      );
      if (existing) {
        completeData.push(existing);
      } else {
        // Fill with 0 for missing data points
        completeData.push([time, 0, segment]);
      }
    });
  });

  // Build legend data
  const legendData = uniqueSegments.map((segment, idx) => ({
    name: segment,
    itemStyle: {
      color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[idx % SWISS_FEDERAL_COLORS.palette.length],
    },
  }));

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      ...createAxisTooltip(),
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as {
          name: string;
          data: [string, number, string];
          color: string;
        };
        if (!p.data) return "";
        const [time, value, theme] = p.data;
        const format = metadata.formatNumber || ((v: number) => v.toLocaleString());
        return `
          <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${p.color};"></span>
          <strong>${theme}</strong><br/>
          Time: ${time}<br/>
          Value: ${format(value)}
        `;
      },
    },
    legend: {
      ...createLegend(),
      data: legendData.map((d) => d.name),
      selectedMode: "multiple",
    },
    singleAxis: {
      top: safeBounds.margins?.top || 50,
      bottom: safeBounds.margins?.bottom || 50,
      left: safeBounds.margins?.left || 50,
      right: safeBounds.margins?.right || 50,
      type: "category",
      data: uniqueTimes,
      axisLabel: {
        interval: Math.floor(uniqueTimes.length / 10),
        rotate: uniqueTimes.length > 15 ? 45 : 0,
      },
      name: metadata.xAxisLabel,
      nameLocation: "center",
      nameGap: 35,
    },
    series: [
      {
        type: "themeRiver",
        emphasis: {
          focus: "series",
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        label: {
          show: true,
          position: "inside",
        },
        data: completeData,
        // Apply colors to each segment
        color: uniqueSegments.map(
          (segment, idx) =>
            colors.getColor(segment) ||
            SWISS_FEDERAL_COLORS.palette[idx % SWISS_FEDERAL_COLORS.palette.length]
        ),
      },
    ],
  };
};

// Register the adapter
registerChartAdapter("themeriver", themeriverUniversalAdapter);
