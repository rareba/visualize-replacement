/**
 * Universal Globe Chart Adapter
 *
 * A pure function adapter for globe visualizations using ECharts GL.
 * Displays data on a 3D globe.
 *
 * Lines of code: ~120
 */

// Animation import removed - not used in globe adapter currently
// import { getDefaultAnimation } from "@/charts/echarts/adapter-utils";
import { getSwissFederalTheme, SWISS_FEDERAL_COLORS } from "@/charts/echarts/theme";
import { registerChartAdapter } from "@/charts/core/chart-adapter-registry";
import type { UniversalChartState } from "@/charts/core/universal-chart-state";

import type { EChartsOption } from "echarts";

// ============================================================================
// Globe Adapter Function
// ============================================================================

/**
 * Universal Globe Chart Adapter
 *
 * Transforms UniversalChartState into ECharts globe configuration.
 * Note: This is a simplified version that displays data points on a globe.
 * For full geo functionality, latitude and longitude fields would be needed.
 */
export const globeUniversalAdapter = (state: UniversalChartState): EChartsOption => {
  const { observations, fields, colors, metadata, segments: _segments } = state;
  const { getX, getY, getSegment } = fields;

  // Build scatter data for globe
  // Without explicit lat/lng fields, we distribute points evenly
  const scatterData: Array<{
    name: string;
    value: [number, number, number]; // [lng, lat, value]
    itemStyle?: { color: string };
  }> = [];

  observations.forEach((d, idx) => {
    if (!getY) return;

    const name = getX ? String(getX(d)) : `Point ${idx}`;
    const value = getY(d) ?? 0;
    const segment = getSegment ? getSegment(d) : "default";

    // Distribute points evenly on globe (simplified - no actual geo data)
    const lng = (idx % 36) * 10 - 180;
    const lat = Math.floor(idx / 36) * 10 - 90;

    scatterData.push({
      name,
      value: [lng, lat, value],
      itemStyle: {
        color: colors.getColor(segment) || SWISS_FEDERAL_COLORS.palette[idx % SWISS_FEDERAL_COLORS.palette.length],
      },
    });
  });

  const maxValue = Math.max(...scatterData.map((d) => d.value[2]), 1);

  return {
    ...getSwissFederalTheme(),
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { name: string; value: [number, number, number] };
        const formattedValue = metadata.formatNumber
          ? metadata.formatNumber(p.value[2])
          : p.value[2];
        return `${p.name}<br/>Value: ${formattedValue}`;
      },
    },
    globe: {
      baseTexture: "data:image/svg+xml," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024">
          <rect fill="#1a1a2e" width="2048" height="1024"/>
          <g fill="none" stroke="#2d2d44" stroke-width="1">
            ${Array.from({ length: 18 }, (_, i) => `<line x1="${i * 114}" y1="0" x2="${i * 114}" y2="1024"/>`).join("")}
            ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 114}" x2="2048" y2="${i * 114}"/>`).join("")}
          </g>
        </svg>
      `),
      heightTexture: undefined,
      shading: "lambert",
      environment: undefined,
      light: {
        main: {
          intensity: 1.5,
          shadow: true,
        },
        ambient: {
          intensity: 0.3,
        },
      },
      viewControl: {
        autoRotate: true,
        autoRotateSpeed: 3,
        distance: 200,
      },
      // Atmosphere effect for realistic globe appearance
      atmosphere: {
        show: true,
        color: "#3a8ec9",
        glowPower: 8,
        innerGlowPower: 2,
      },
      // Post-effects for enhanced visuals
      postEffect: {
        enable: true,
        bloom: {
          enable: true,
          bloomIntensity: 0.05,
        },
        SSAO: {
          enable: true,
          radius: 2,
          intensity: 1,
          quality: "medium",
        },
      },
    },
    series: [
      {
        type: "scatter3D",
        coordinateSystem: "globe",
        data: scatterData,
        symbolSize: (val: [number, number, number]) => {
          return 5 + (val[2] / maxValue) * 15;
        },
        itemStyle: {
          opacity: 0.8,
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
          },
        },
      },
    ],
  } as EChartsOption;
};

// Register the adapter
registerChartAdapter("globe", globeUniversalAdapter);
