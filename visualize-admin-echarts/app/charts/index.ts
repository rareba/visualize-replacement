import { t } from "@lingui/macro";
import { ascending, descending, group, rollup, rollups } from "d3-array";
import { schemeCategory10 } from "d3-scale-chromatic";
import produce from "immer";
import get from "lodash/get";
import mapValues from "lodash/mapValues";
import sortBy from "lodash/sortBy";

import {
  AREA_SEGMENT_SORTING,
  COLUMN_SEGMENT_SORTING,
  disableStacked,
  EncodingFieldType,
  PIE_SEGMENT_SORTING,
} from "@/charts/chart-config-ui-options";
import {
  DEFAULT_FIXED_COLOR_FIELD,
  getDefaultCategoricalColorField,
  getDefaultNumericalColorField,
} from "@/charts/map/constants";
import {
  ChartConfigsAdjusters,
  FieldAdjuster,
  InteractiveFiltersAdjusters,
} from "@/config-adjusters";
import {
  AreaSegmentField,
  canBeNormalized,
  ChartConfig,
  ChartSegmentField,
  ChartType,
  ColorField,
  ColumnSegmentField,
  ComboChartType,
  ComboLineColumnFields,
  ComboLineSingleFields,
  Cube,
  Filters,
  GenericChartConfig,
  GenericField,
  GenericFields,
  InteractiveFiltersConfig,
  isColorInConfig,
  isSegmentInConfig,
  LineSegmentField,
  MapAreaLayer,
  MapConfig,
  MapSymbolLayer,
  MeasuresColorField,
  Meta,
  PieSegmentField,
  RegularChartType,
  ScatterPlotSegmentField,
  SegmentColorField,
  ShowValuesSegmentFieldExtension,
  SingleColorField,
  SortingOrder,
  SortingType,
  TableColumn,
  TableFields,
} from "@/config-types";
import { mapValueIrisToColor } from "@/configurator/components/ui-helpers";
import { FIELD_VALUE_NONE } from "@/configurator/constants";
import {
  Component,
  Dimension,
  DimensionType,
  DimensionValue,
  GeoCoordinatesDimension,
  GeoShapesDimension,
  getCategoricalDimensions,
  getGeoDimensions,
  HierarchyValue,
  isGeoDimension,
  isGeoShapesDimension,
  isNumericalMeasure,
  isOrdinalMeasure,
  isTemporalDimension,
  isTemporalEntityDimension,
  Measure,
  NumericalMeasure,
  SEGMENT_ENABLED_COMPONENTS,
} from "@/domain/data";
import { truthy } from "@/domain/types";
import {
  DEFAULT_CATEGORICAL_PALETTE_ID,
  getDefaultCategoricalPaletteId,
} from "@/palettes";
import { theme } from "@/themes/theme";
import { bfs } from "@/utils/bfs";
import { CHART_CONFIG_VERSION } from "@/utils/chart-config/constants";
import { createId } from "@/utils/create-id";
import { isMultiHierarchyNode } from "@/utils/hierarchy";
import { unreachableError } from "@/utils/unreachable";

const chartTypes: ChartType[] = [
  "column",
  "bar",
  "line",
  "area",
  "scatterplot",
  "pie",
  "donut",
  "table",
  "map",
  "radar",
  "funnel",
  "gauge",
  "treemap",
  "sunburst",
  "heatmap",
  "boxplot",
  "waterfall",
  "sankey",
  "polar",
  "wordcloud",
  // 3D Charts (ECharts GL)
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "globe",
  "pie3d",
  // Combo charts
  "comboLineSingle",
  "comboLineDual",
  "comboLineColumn",
];

export const regularChartTypes: RegularChartType[] = [
  "column",
  "bar",
  "line",
  "area",
  "scatterplot",
  "pie",
  "donut",
  "table",
  "map",
  "radar",
  "funnel",
  "gauge",
  "treemap",
  "sunburst",
  "heatmap",
  "boxplot",
  "waterfall",
  "sankey",
  "polar",
  "wordcloud",
  // 3D Charts (ECharts GL)
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "globe",
  "pie3d",
];

const comboDifferentUnitChartTypes: ComboChartType[] = [
  "comboLineDual",
  "comboLineColumn",
];

const comboSameUnitChartTypes: ComboChartType[] = ["comboLineSingle"];

export const comboChartTypes: ComboChartType[] = [
  ...comboSameUnitChartTypes,
  ...comboDifferentUnitChartTypes,
];

/**
 * Chart type categories for compact chart selector.
 * Groups chart types by their primary visualization purpose.
 */
export type ChartCategory =
  | "basic"
  | "partOfWhole"
  | "hierarchical"
  | "statistical"
  | "flow"
  | "specialized"
  | "comparison";

export interface ChartCategoryConfig {
  id: ChartCategory;
  labelKey: string;
  chartTypes: ChartType[];
}

export const chartTypeCategories: ChartCategoryConfig[] = [
  {
    id: "basic",
    labelKey: "controls.chart.category.basic",
    chartTypes: ["column", "bar", "line", "area", "scatterplot", "bar3d", "scatter3d", "line3d", "surface", "globe", "pie3d"],
  },
  {
    id: "partOfWhole",
    labelKey: "controls.chart.category.partOfWhole",
    chartTypes: ["pie", "donut", "funnel", "waterfall"],
  },
  {
    id: "hierarchical",
    labelKey: "controls.chart.category.hierarchical",
    chartTypes: ["treemap", "sunburst"],
  },
  {
    id: "statistical",
    labelKey: "controls.chart.category.statistical",
    chartTypes: ["boxplot", "heatmap"],
  },
  {
    id: "flow",
    labelKey: "controls.chart.category.flow",
    chartTypes: ["sankey"],
  },
  {
    id: "specialized",
    labelKey: "controls.chart.category.specialized",
    chartTypes: ["radar", "gauge", "polar", "wordcloud", "map", "table"],
  },
  {
    id: "comparison",
    labelKey: "controls.chart.category.comparison",
    chartTypes: ["comboLineSingle", "comboLineDual", "comboLineColumn"],
  },
];

type ChartOrder = { [k in ChartType]: number };
function getChartTypeOrder({ cubeCount }: { cubeCount: number }): ChartOrder {
  const multiCubeBoost = cubeCount > 1 ? -100 : 0;
  return {
    column: 0,
    bar: 1,
    line: 2,
    area: 3,
    scatterplot: 4,
    pie: 5,
    donut: 6,
    map: 7,
    table: 8,
    radar: 9,
    funnel: 10,
    gauge: 11,
    treemap: 12,
    sunburst: 13,
    heatmap: 14,
    boxplot: 15,
    waterfall: 16,
    sankey: 17,
    polar: 18,
    wordcloud: 19,
    comboLineSingle: 20 + multiCubeBoost,
    comboLineDual: 21 + multiCubeBoost,
    comboLineColumn: 22 + multiCubeBoost,
    // 3D Charts
    bar3d: 23,
    scatter3d: 24,
    line3d: 25,
    surface: 26,
    globe: 27,
    pie3d: 28,
  };
}

/**
 * Finds the "best" dimension based on a preferred type (e.g. TemporalDimension) and Key Dimension
 *
 * @param dimensions
 * @param preferredType
 */
const findPreferredDimension = (
  dimensions: Component[],
  preferredTypes?: DimensionType[]
) => {
  const dim =
    preferredTypes
      ?.map((preferredType) =>
        dimensions.find(
          (d) => d.__typename === preferredType && d.isKeyDimension
        )
      )
      .filter(truthy)[0] ??
    dimensions.find((d) => d.isKeyDimension) ??
    dimensions[0];

  if (!dim) {
    throw Error("No dimension found for initial config");
  }

  return dim;
};

const getInitialInteractiveFiltersConfig = (options?: {
  timeRangeComponentId?: string;
}): InteractiveFiltersConfig => {
  const { timeRangeComponentId = "" } = options ?? {};

  return {
    legend: {
      active: false,
      componentId: "",
    },
    timeRange: {
      active: false,
      componentId: timeRangeComponentId,
      presets: {
        type: "range",
        from: "",
        to: "",
      },
    },
    dataFilters: {
      active: false,
      componentIds: [],
      defaultValueOverrides: {},
      filterTypes: {},
      defaultOpen: true,
    },
    calculation: {
      active: false,
      type: "identity",
    },
  };
};

type SortingOption = {
  sortingType: SortingType;
  sortingOrder: SortingOrder;
};

export const DEFAULT_SORTING: SortingOption = {
  sortingType: "byAuto",
  sortingOrder: "asc",
};

/**
 * Finds bottommost layer for the first hierarchy
 */
const findBottommostLayers = (dimension: Dimension) => {
  const leaves = [] as HierarchyValue[];
  let hasSeenMultiHierarchyNode = false;
  bfs(dimension?.hierarchy as HierarchyValue[], (node) => {
    if (isMultiHierarchyNode(node)) {
      if (hasSeenMultiHierarchyNode) {
        return bfs.IGNORE;
      }

      hasSeenMultiHierarchyNode = true;
    }

    if ((!node.children || node.children.length === 0) && node.hasValue) {
      leaves.push(node);
    }
  });

  return leaves;
};

const makeInitialFiltersForArea = (dimension: Dimension) => {
  const filters: Filters = {};

  // Setting the filters so that bottommost areas are shown first
  // @ts-ignore
  if (dimension?.hierarchy) {
    const leaves = findBottommostLayers(dimension);
    if (leaves.length > 0) {
      filters[dimension.id] = {
        type: "multi",
        values: Object.fromEntries(leaves.map((x) => [x.value, true])),
      };
    }
  }

  return filters;
};

export const initializeMapLayerField = ({
  chartConfig,
  field,
  componentId,
  dimensions,
  measures,
}: {
  chartConfig: MapConfig;
  field: EncodingFieldType;
  componentId: string;
  dimensions: Dimension[];
  measures: Measure[];
}) => {
  if (field === "areaLayer") {
    chartConfig.fields.areaLayer = getInitialAreaLayer({
      component: dimensions
        .filter(isGeoShapesDimension)
        .find((d) => d.id === componentId)!,
      measure: measures[0],
    });
  } else if (field === "symbolLayer") {
    chartConfig.fields.symbolLayer = getInitialSymbolLayer({
      component: dimensions
        .filter(isGeoDimension)
        .find((d) => d.id === componentId)!,
      measure: measures.find(isNumericalMeasure),
    });
  }
};

const getInitialAreaLayer = ({
  component,
  measure,
}: {
  component: GeoShapesDimension;
  measure: Measure;
}): MapAreaLayer => {
  const paletteId = getDefaultCategoricalPaletteId(measure);

  return {
    componentId: component.id,
    color: isNumericalMeasure(measure)
      ? getDefaultNumericalColorField({
          id: measure.id,
        })
      : getDefaultCategoricalColorField({
          id: measure.id,
          paletteId,
          dimensionValues: measure.values,
        }),
  };
};

const getInitialSymbolLayer = ({
  component,
  measure,
}: {
  component: GeoShapesDimension | GeoCoordinatesDimension;
  measure: NumericalMeasure | undefined;
}): MapSymbolLayer => {
  return {
    componentId: component.id,
    measureId: measure?.id ?? FIELD_VALUE_NONE,
    color: DEFAULT_FIXED_COLOR_FIELD,
  };
};

const META: Meta = {
  title: {
    en: "",
    de: "",
    fr: "",
    it: "",
  },
  description: {
    en: "",
    de: "",
    fr: "",
    it: "",
  },
  label: {
    en: "",
    de: "",
    fr: "",
    it: "",
  },
};

type GetInitialConfigOptions = {
  key?: string;
  iris: {
    iri: string;
    joinBy?: string[];
  }[];
  chartType: ChartType;
  dimensions: Dimension[];
  measures: Measure[];
  meta?: Meta;
};

export const getInitialConfig = (
  options: GetInitialConfigOptions
): ChartConfig => {
  const { key, iris, chartType, dimensions, measures, meta } = options;
  const getGenericConfig = (filters?: Filters): GenericChartConfig => {
    const newConfig = {
      key: key ?? createId(),
      version: CHART_CONFIG_VERSION,
      meta: meta ?? META,
      // Technically, we should scope filters per cube; but as we only set initial
      // filters for area charts, and we can only have multi-cubes for combo charts,
      // we can ignore the filters scoping for now.
      cubes: iris.map(({ iri, joinBy }) => {
        if (joinBy) {
          return {
            iri,
            filters: filters ?? {},
            joinBy,
          };
        } else {
          // We need to completely remove the joinBy if not needed to prevent
          // implicit conversion to null when saving / retrieving the config
          // from the backend.
          return {
            iri,
            filters: filters ?? {},
          };
        }
      }),
      interactiveFiltersConfig: getInitialInteractiveFiltersConfig(),
      annotations: [],
      limits: {},
      conversionUnitsByComponentId: {},
      activeField: undefined,
    };

    return newConfig;
  };
  const numericalMeasures = measures.filter(isNumericalMeasure);
  const temporalDimensions = dimensions.filter(
    (d) => isTemporalDimension(d) || isTemporalEntityDimension(d)
  );

  switch (chartType) {
    case "area":
      const areaXComponentId = temporalDimensions[0].id;

      return {
        ...getGenericConfig(),
        chartType,
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: areaXComponentId,
        }),
        fields: {
          x: { componentId: areaXComponentId },
          y: { componentId: numericalMeasures[0].id, imputationType: "none" },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };

    case "column":
      const columnXComponentId = findPreferredDimension(
        sortBy(dimensions, (d) => (isGeoDimension(d) ? 1 : -1)),
        [
          "TemporalDimension",
          "TemporalEntityDimension",
          "TemporalOrdinalDimension",
        ]
      ).id;

      return {
        ...getGenericConfig(),
        chartType,
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: columnXComponentId,
        }),
        fields: {
          x: {
            componentId: columnXComponentId,
            sorting: DEFAULT_SORTING,
          },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };

    case "bar":
      const barXComponentId = findPreferredDimension(
        sortBy(dimensions, (d) => (isGeoDimension(d) ? 1 : -1)),
        [
          "TemporalDimension",
          "TemporalEntityDimension",
          "TemporalOrdinalDimension",
        ]
      ).id;

      return {
        ...getGenericConfig(),
        chartType,
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: barXComponentId,
        }),
        fields: {
          x: { componentId: numericalMeasures[0].id },
          y: {
            componentId: barXComponentId,
            sorting: DEFAULT_SORTING,
          },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };
    case "line":
      const lineXComponentId = temporalDimensions[0].id;

      return {
        ...getGenericConfig(),
        chartType,
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: lineXComponentId,
        }),
        fields: {
          x: { componentId: lineXComponentId },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };
    case "map":
      const geoDimensions = getGeoDimensions(dimensions);
      const geoShapesDimensions = geoDimensions.filter(isGeoShapesDimension);
      const areaDimension = geoShapesDimensions[0];
      const showAreaLayer = geoShapesDimensions.length > 0;
      const showSymbolLayer = !showAreaLayer;

      return {
        ...getGenericConfig(makeInitialFiltersForArea(areaDimension)),
        chartType,
        baseLayer: {
          show: true,
          locked: false,
          bbox: undefined,
          customLayers: [],
        },
        fields: {
          ...(showAreaLayer
            ? {
                areaLayer: getInitialAreaLayer({
                  component: areaDimension,
                  measure: measures[0],
                }),
              }
            : {}),
          ...(showSymbolLayer
            ? {
                symbolLayer: getInitialSymbolLayer({
                  component: geoDimensions[0],
                  measure: numericalMeasures[0],
                }),
              }
            : {}),
        },
      };
    case "pie":
      const pieSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const piePalette = getDefaultCategoricalPaletteId(pieSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: pieSegmentComponent.id,
            sorting: { sortingType: "byMeasure", sortingOrder: "asc" },
            showValuesMapping: {},
          },
          color: {
            type: "segment",
            paletteId: piePalette,
            colorMapping: mapValueIrisToColor({
              paletteId: piePalette,
              dimensionValues: pieSegmentComponent.values,
            }),
          },
        },
      };
    case "donut":
      const donutSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const donutPalette = getDefaultCategoricalPaletteId(donutSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: donutSegmentComponent.id,
            sorting: { sortingType: "byMeasure", sortingOrder: "asc" },
            showValuesMapping: {},
          },
          color: {
            type: "segment",
            paletteId: donutPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: donutPalette,
              dimensionValues: donutSegmentComponent.values,
            }),
          },
          innerRadius: 0.5, // 50% inner radius for donut
        },
      };
    case "radar":
      const radarSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const radarPalette = getDefaultCategoricalPaletteId(radarSegmentComponent);
      // Get up to 5 dimensions for radar indicators
      const radarIndicatorDimensions = getCategoricalDimensions(dimensions).slice(0, 5);

      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          indicators: radarIndicatorDimensions.map((d) => ({ componentId: d.id })),
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: radarSegmentComponent.id,
            sorting: DEFAULT_SORTING,
          },
          color: {
            type: "segment",
            paletteId: radarPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: radarPalette,
              dimensionValues: radarSegmentComponent.values,
            }),
          },
        },
      };
    case "funnel":
      const funnelSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const funnelPalette = getDefaultCategoricalPaletteId(funnelSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: funnelSegmentComponent.id,
            sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
          },
          color: {
            type: "segment",
            paletteId: funnelPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: funnelPalette,
              dimensionValues: funnelSegmentComponent.values,
            }),
          },
        },
      };
    case "gauge":
      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };
    case "treemap":
      const treemapSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const treemapPalette = getDefaultCategoricalPaletteId(treemapSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: treemapSegmentComponent.id,
            sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
          },
          color: {
            type: "segment",
            paletteId: treemapPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: treemapPalette,
              dimensionValues: treemapSegmentComponent.values,
            }),
          },
        },
      };
    case "sunburst":
      const sunburstSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const sunburstPalette = getDefaultCategoricalPaletteId(sunburstSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: sunburstSegmentComponent.id,
            sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
          },
          color: {
            type: "segment",
            paletteId: sunburstPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: sunburstPalette,
              dimensionValues: sunburstSegmentComponent.values,
            }),
          },
        },
      };
    case "heatmap":
      return {
        ...getGenericConfig(),
        chartType,
        fields: {
          x: {
            componentId: dimensions[0]?.id ?? "",
            sorting: DEFAULT_SORTING,
          },
          y: {
            componentId: dimensions[1]?.id ?? dimensions[0]?.id ?? "",
            sorting: DEFAULT_SORTING,
          },
          value: { componentId: numericalMeasures[0].id },
          color: {
            type: "sequential",
            paletteId: "blues",
          },
        },
      };
    case "scatterplot":
      const scatterplotSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ||
        getGeoDimensions(dimensions)[0];
      const scatterplotPalette = getDefaultCategoricalPaletteId(
        scatterplotSegmentComponent
      );

      return {
        ...getGenericConfig(),
        chartType: "scatterplot",
        fields: {
          x: { componentId: numericalMeasures[0].id },
          y: {
            componentId:
              numericalMeasures.length > 1
                ? numericalMeasures[1].id
                : numericalMeasures[0].id,
          },
          ...(scatterplotSegmentComponent
            ? {
                color: {
                  type: "segment",
                  paletteId: scatterplotPalette,
                  colorMapping: mapValueIrisToColor({
                    paletteId: scatterplotPalette,
                    dimensionValues: scatterplotSegmentComponent.values,
                  }),
                },
                segment: {
                  componentId: scatterplotSegmentComponent.id,
                  showValuesMapping: {},
                },
              }
            : {
                color: {
                  type: "single",
                  paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
                  color: theme.palette.primary.main,
                },
              }),
        },
      };
    case "table":
      const allDimensionsSorted = [...dimensions, ...measures].sort((a, b) =>
        ascending(a.order ?? Infinity, b.order ?? Infinity)
      );

      return {
        ...getGenericConfig(),
        chartType,
        settings: {
          showSearch: true,
          showAllRows: false,
        },
        links: {
          enabled: false,
          baseUrl: "",
          componentId: "",
          targetComponentId: "",
        },
        sorting: [],
        fields: Object.fromEntries<TableColumn>(
          allDimensionsSorted.map((d, i) => [
            d.id,
            {
              componentId: d.id,
              componentType: d.__typename,
              index: i,
              isGroup: false,
              isHidden: false,
              columnStyle: {
                textStyle: "regular",
                type: "text",
                textColor: theme.palette.monochrome[600],
                columnColor: "#fff",
              },
            },
          ])
        ) as TableFields,
      };
    case "comboLineSingle": {
      // It's guaranteed by getEnabledChartTypes that there are at least two units.
      const mostCommonUnit = rollups(
        numericalMeasures.filter((d) => d.unit),
        (v) => v.length,
        (d) => d.unit
      ).sort((a, b) => descending(a[1], b[1]))[0][0];
      const yComponentIds = numericalMeasures
        .filter((d) => d.unit === mostCommonUnit)
        .map((d) => d.id);

      return {
        ...getGenericConfig(),
        chartType: "comboLineSingle",
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: temporalDimensions[0].id,
        }),
        fields: {
          x: { componentId: temporalDimensions[0].id },
          // Use all measures with the most common unit.
          y: {
            componentIds: yComponentIds,
          },
          color: {
            type: "measures",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            colorMapping: mapValueIrisToColor({
              paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
              dimensionValues: yComponentIds.map((id) => ({
                value: id,
                label: id,
              })) as DimensionValue[],
            }),
          },
        },
      };
    }
    case "comboLineDual": {
      // It's guaranteed by getEnabledChartTypes that there are at least two units.
      const [firstUnit, secondUnit] = Array.from(
        new Set(numericalMeasures.filter((d) => d.unit).map((d) => d.unit))
      );
      const leftAxisComponentId = numericalMeasures.find(
        (d) => d.unit === firstUnit
      )!.id;
      const rightAxisComponentId = numericalMeasures.find(
        (d) => d.unit === secondUnit
      )!.id;

      return {
        ...getGenericConfig(),
        chartType: "comboLineDual",
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: temporalDimensions[0].id,
        }),
        fields: {
          x: { componentId: temporalDimensions[0].id },
          y: {
            leftAxisComponentId,
            rightAxisComponentId,
          },
          color: {
            type: "measures",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            colorMapping: mapValueIrisToColor({
              paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
              dimensionValues: [leftAxisComponentId, rightAxisComponentId].map(
                (id) => ({
                  value: id,
                  label: id,
                })
              ),
            }),
          },
        },
      };
    }
    case "comboLineColumn": {
      // It's guaranteed by getEnabledChartTypes that there are at least two units.
      const [firstUnit, secondUnit] = Array.from(
        new Set(numericalMeasures.filter((d) => d.unit).map((d) => d.unit))
      );
      const lineComponentId = numericalMeasures.find(
        (d) => d.unit === firstUnit
      )!.id;
      const columnComponentId = numericalMeasures.find(
        (d) => d.unit === secondUnit
      )!.id;

      return {
        ...getGenericConfig(),
        chartType: "comboLineColumn",
        interactiveFiltersConfig: getInitialInteractiveFiltersConfig({
          timeRangeComponentId: temporalDimensions[0].id,
        }),
        fields: {
          x: { componentId: temporalDimensions[0].id },
          y: {
            lineComponentId,
            lineAxisOrientation: "right",
            columnComponentId,
          },
          color: {
            type: "measures",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            colorMapping: mapValueIrisToColor({
              paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
              dimensionValues: [lineComponentId, columnComponentId].map(
                (id) => ({
                  value: id,
                  label: id,
                })
              ),
            }),
          },
        },
      };
    }

    case "boxplot": {
      const boxplotXComponent = findPreferredDimension(
        sortBy(dimensions, (d) => (isGeoDimension(d) ? 1 : -1)),
        ["TemporalDimension", "TemporalEntityDimension", "TemporalOrdinalDimension"]
      );

      return {
        ...getGenericConfig(),
        chartType: "boxplot",
        fields: {
          x: {
            componentId: boxplotXComponent.id,
            sorting: DEFAULT_SORTING,
          },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };
    }

    case "waterfall": {
      const waterfallXComponent = findPreferredDimension(
        sortBy(dimensions, (d) => (isGeoDimension(d) ? 1 : -1)),
        ["TemporalDimension", "TemporalEntityDimension", "TemporalOrdinalDimension"]
      );

      return {
        ...getGenericConfig(),
        chartType: "waterfall",
        fields: {
          x: {
            componentId: waterfallXComponent.id,
            sorting: DEFAULT_SORTING,
          },
          y: {
            componentId: numericalMeasures[0].id,
            showValues: false,
          },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };
    }

    case "sankey": {
      const categoricalDims = getCategoricalDimensions(dimensions);
      const sourceComponent = categoricalDims[0];
      const targetComponent = categoricalDims[1] ?? categoricalDims[0];

      return {
        ...getGenericConfig(),
        chartType: "sankey",
        fields: {
          source: { componentId: sourceComponent.id },
          target: { componentId: targetComponent.id },
          value: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: DEFAULT_CATEGORICAL_PALETTE_ID,
            color: theme.palette.primary.main,
          },
        },
      };
    }

    case "polar": {
      const polarSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const polarPalette = getDefaultCategoricalPaletteId(polarSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType: "polar",
        fields: {
          angle: { componentId: polarSegmentComponent.id },
          radius: { componentId: numericalMeasures[0].id },
          color: {
            type: "segment",
            paletteId: polarPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: polarPalette,
              dimensionValues: polarSegmentComponent.values,
            }),
          },
        },
      };
    }

    case "wordcloud": {
      const wordcloudSegmentComponent =
        getCategoricalDimensions(dimensions)[0] ??
        getGeoDimensions(dimensions)[0];
      const wordcloudPalette = getDefaultCategoricalPaletteId(wordcloudSegmentComponent);

      return {
        ...getGenericConfig(),
        chartType: "wordcloud",
        fields: {
          word: { componentId: wordcloudSegmentComponent.id },
          size: { componentId: numericalMeasures[0].id },
          color: {
            type: "segment",
            paletteId: wordcloudPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: wordcloudPalette,
              dimensionValues: wordcloudSegmentComponent.values,
            }),
          },
        },
      };
    }

    // 3D Charts (ECharts GL)
    case "bar3d": {
      const bar3dSegment = getCategoricalDimensions(dimensions)[0] ?? getGeoDimensions(dimensions)[0];
      return {
        ...getGenericConfig(),
        chartType: "bar3d",
        fields: {
          x: { componentId: bar3dSegment.id },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: "category10",
            color: schemeCategory10[0],
          },
        },
      };
    }

    case "scatter3d": {
      const scatter3dSegment = getCategoricalDimensions(dimensions)[0] ?? getGeoDimensions(dimensions)[0];
      return {
        ...getGenericConfig(),
        chartType: "scatter3d",
        fields: {
          x: { componentId: scatter3dSegment.id },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: "category10",
            color: schemeCategory10[0],
          },
        },
      };
    }

    case "surface": {
      const surfaceSegment = getCategoricalDimensions(dimensions)[0] ?? getGeoDimensions(dimensions)[0];
      return {
        ...getGenericConfig(),
        chartType: "surface",
        fields: {
          x: { componentId: surfaceSegment.id },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: "category10",
            color: schemeCategory10[0],
          },
        },
      };
    }

    case "line3d": {
      const line3dSegment = getCategoricalDimensions(dimensions)[0] ?? temporalDimensions[0] ?? getGeoDimensions(dimensions)[0];
      return {
        ...getGenericConfig(),
        chartType: "line3d",
        fields: {
          x: { componentId: line3dSegment.id },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: "category10",
            color: schemeCategory10[0],
          },
        },
      };
    }

    case "globe": {
      const globeGeo = getGeoDimensions(dimensions)[0] ?? getCategoricalDimensions(dimensions)[0];
      return {
        ...getGenericConfig(),
        chartType: "globe",
        fields: {
          x: { componentId: globeGeo.id },
          y: { componentId: numericalMeasures[0].id },
          color: {
            type: "single",
            paletteId: "category10",
            color: schemeCategory10[0],
          },
        },
      };
    }

    case "pie3d": {
      const pie3dSegment = getCategoricalDimensions(dimensions)[0] ?? getGeoDimensions(dimensions)[0];
      const pie3dPalette = getDefaultCategoricalPaletteId(pie3dSegment);
      return {
        ...getGenericConfig(),
        chartType: "pie3d",
        fields: {
          y: { componentId: numericalMeasures[0].id },
          segment: {
            componentId: pie3dSegment.id,
            sorting: DEFAULT_SORTING,
          },
          color: {
            type: "segment",
            paletteId: pie3dPalette,
            colorMapping: mapValueIrisToColor({
              paletteId: pie3dPalette,
              dimensionValues: pie3dSegment.values,
            }),
          },
        },
      };
    }

    // This code *should* be unreachable! If it's not, it means we haven't checked
    // all cases (and we should get a TS error).
    default:
      throw unreachableError(chartType);
  }
};

export const getChartConfigAdjustedToChartType = ({
  chartConfig,
  newChartType,
  dimensions,
  measures,
  isAddingNewCube,
}: {
  chartConfig: ChartConfig;
  newChartType: ChartType;
  dimensions: Dimension[];
  measures: Measure[];
  isAddingNewCube?: boolean;
}): ChartConfig => {
  const oldChartType = chartConfig.chartType;
  const initialConfig = getInitialConfig({
    key: chartConfig.key,
    chartType: newChartType,
    iris: chartConfig.cubes.map(({ iri }) => ({ iri })),
    dimensions,
    measures,
    meta: chartConfig.meta,
  });
  const { interactiveFiltersConfig, ...rest } = chartConfig;

  return getAdjustedChartConfig({
    path: "",
    // Make sure interactiveFiltersConfig is passed as the last item, so that
    // it can be adjusted based on other, already adjusted fields.
    field: {
      ...rest,
      interactiveFiltersConfig,
    },
    adjusters: chartConfigsAdjusters[newChartType],
    pathOverrides: chartConfigsPathOverrides[newChartType][oldChartType],
    oldChartConfig: chartConfig,
    newChartConfig: initialConfig,
    dimensions,
    measures,
    isAddingNewCube,
  });
};

const getAdjustedChartConfig = ({
  path,
  field,
  adjusters,
  pathOverrides,
  oldChartConfig,
  newChartConfig,
  dimensions,
  measures,
  isAddingNewCube,
}: {
  path: string;
  field: Object;
  adjusters: ChartConfigAdjusters;
  pathOverrides: ChartConfigPathOverrides;
  oldChartConfig: ChartConfig;
  newChartConfig: ChartConfig;
  dimensions: Dimension[];
  measures: Measure[];
  isAddingNewCube?: boolean;
}) => {
  // For filters & segments we can't reach a primitive level as we need to
  // pass the whole object. Table fields have an [id: TableColumn] structure,
  // so we also pass a whole field in such case (used in segments).
  const isConfigLeaf = (path: string, configValue: any) => {
    if (typeof configValue !== "object" || Array.isArray(configValue)) {
      return true;
    }

    switch (path) {
      case "fields":
        return (
          oldChartConfig.chartType === "table" &&
          isSegmentInConfig(newChartConfig)
        );
      case "filters":
      case "fields.color":
      case "fields.segment":
      case "fields.animation":
      case "interactiveFiltersConfig.calculation":
      case "interactiveFiltersConfig.dataFilters":
      case "interactiveFiltersConfig.legend":
      case "limits":
      case "conversionUnitsByComponentId":
        return true;
      default:
        return false;
    }
  };

  const go = ({ path, field }: { path: string; field: Object }) => {
    for (const [k, v] of Object.entries(field)) {
      const newPath = path === "" ? k : `${path}.${k}`;

      if (v !== undefined) {
        const overrides = pathOverrides?.[newPath];

        if (isConfigLeaf(newPath, v) || overrides) {
          if (overrides) {
            for (const override of overrides) {
              const getChartConfigWithAdjustedField: FieldAdjuster<
                ChartConfig,
                unknown
              > = get(adjusters, override.path);

              if (getChartConfigWithAdjustedField) {
                newChartConfig = getChartConfigWithAdjustedField({
                  oldValue: override.oldValue ? override.oldValue(v) : v,
                  newChartConfig,
                  oldChartConfig,
                  dimensions,
                  measures,
                  isAddingNewCube,
                });
              }
            }
          } else {
            const getChartConfigWithAdjustedField: FieldAdjuster<
              ChartConfig,
              unknown
            > = get(adjusters, newPath);

            if (getChartConfigWithAdjustedField) {
              newChartConfig = getChartConfigWithAdjustedField({
                oldValue: v,
                newChartConfig,
                oldChartConfig,
                dimensions,
                measures,
                isAddingNewCube,
              });
            }
          }
        } else {
          go({ path: newPath, field: v });
        }
      }
    }

    return newChartConfig;
  };

  return go({ path, field });
};

const interactiveFiltersAdjusters: InteractiveFiltersAdjusters = {
  legend: ({ oldValue, oldChartConfig, newChartConfig }) => {
    if ((oldChartConfig.fields as any).segment !== undefined) {
      return produce(newChartConfig, (draft) => {
        draft.interactiveFiltersConfig.legend = oldValue;
      });
    }

    return newChartConfig;
  },
  timeRange: {
    active: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.interactiveFiltersConfig.timeRange.active = oldValue;
      });
    },
    componentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.interactiveFiltersConfig.timeRange.componentId = oldValue;
      });
    },
    presets: {
      type: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.interactiveFiltersConfig.timeRange.presets.type = oldValue;
        });
      },
      from: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.interactiveFiltersConfig.timeRange.presets.from = oldValue;
        });
      },
      to: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.interactiveFiltersConfig.timeRange.presets.to = oldValue;
        });
      },
    },
  },
  dataFilters: ({ oldValue, newChartConfig, oldChartConfig }) => {
    return produce(newChartConfig, (draft) => {
      const oldComponentIds = oldValue.componentIds ?? [];

      // Do not migrate filters from table, as they have different types anyway.
      if (oldChartConfig.chartType === "table") {
        draft.interactiveFiltersConfig.dataFilters = {
          active: false,
          componentIds: [],
          defaultValueOverrides: {},
          defaultOpen: true,
          filterTypes: {},
        };
        return;
      }

      if (oldComponentIds.length > 0) {
        const fieldComponentIds = Object.values<GenericField>(
          // @ts-ignore - we are only interested in component ids.
          draft.fields
        ).map((d) => d.componentId);
        // Remove component ids that are not in the new chart config, as they
        // can't be used as interactive data filters then.
        const validComponentIds = oldComponentIds.filter(
          (d) => !fieldComponentIds.includes(d)
        );

        const newDefaultValueOverrides = {
          ...oldValue.defaultValueOverrides,
        };
        const removedComponentIds = oldComponentIds.filter(
          (d) => !validComponentIds.includes(d)
        );
        removedComponentIds.forEach((id) => {
          delete newDefaultValueOverrides[id];
        });

        draft.interactiveFiltersConfig.dataFilters.active =
          validComponentIds.length > 0;
        draft.interactiveFiltersConfig.dataFilters.componentIds =
          validComponentIds;
        draft.interactiveFiltersConfig.dataFilters.defaultValueOverrides =
          newDefaultValueOverrides;
      } else {
        draft.interactiveFiltersConfig.dataFilters = oldValue;
      }
    });
  },
  calculation: ({ oldValue, newChartConfig }) => {
    return produce(newChartConfig, (draft) => {
      if (canBeNormalized(newChartConfig)) {
        draft.interactiveFiltersConfig.calculation = oldValue;
      } else {
        draft.interactiveFiltersConfig.calculation = {
          active: false,
          type: "identity",
        };
      }
    });
  },
};

const chartConfigsAdjusters: ChartConfigsAdjusters = {
  column: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          // When switching from a bar chart or scatterplot, x is a measure.
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
        customDomain: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.customDomain = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          // Segment color type is migrated in tandem with the segment field below.
          if (oldValue.type !== "segment") {
            draft.fields.color = getSingleColorField({
              oldColorField: oldValue,
            });
          }
        });
      },
      segment: ({
        oldValue,
        oldChartConfig,
        newChartConfig,
        dimensions,
        measures,
      }) => {
        let newSegment: ColumnSegmentField;
        let newColor: ColorField;

        const yMeasure = measures.find(
          (d) => d.id === newChartConfig.fields.y.componentId
        );

        // When switching from a table chart, a whole fields object is passed as oldValue.
        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields =
            convertTableFieldsToSegmentAndColorFields({
              fields: oldValue as TableFields,
              dimensions,
              measures,
            });

          if (maybeSegmentAndColorFields) {
            newSegment = {
              ...maybeSegmentAndColorFields.segment,
              sorting: DEFAULT_SORTING,
              type: disableStacked(yMeasure) ? "grouped" : "stacked",
              showValuesMapping: {},
            };
            newColor = maybeSegmentAndColorFields.color;
          }
          // Otherwise we are dealing with a segment field. We shouldn't take
          // the segment from oldValue if the component has already been used as
          // x axis.
        } else if (
          newChartConfig.fields.x.componentId !== oldValue.componentId
        ) {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find(
            (d) => d.id === oldValue.componentId
          );
          newSegment = {
            ...oldSegment,
            showValuesMapping: oldSegment.showValuesMapping ?? {},
            // We could encounter byMeasure sorting type (Pie chart); we should
            // switch to byTotalSize sorting then.
            sorting: adjustSegmentSorting({
              segment: oldSegment,
              acceptedValues: COLUMN_SEGMENT_SORTING.map((d) => d.sortingType),
              defaultValue: "byTotalSize",
            }),
            type: disableStacked(yMeasure) ? "grouped" : "stacked",
          };
          newColor = getSegmentColorField({
            oldColorField: oldColor,
            segmentDimension,
          });
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
      animation: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          // Temporal dimension could be used as X axis, in this case we need to
          // remove the animation.
          if (newChartConfig.fields.x.componentId !== oldValue?.componentId) {
            draft.fields.animation = oldValue;
          }
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  bar: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.x.showValues = oldValue;
          });
        },
        customDomain: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.x.customDomain = oldValue;
          });
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          // For most charts, y is a measure.
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              draft.fields.y.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          // Segment color type is migrated in tandem with the segment field below.
          if (oldValue.type !== "segment") {
            draft.fields.color = getSingleColorField({
              oldColorField: oldValue,
            });
          }
        });
      },
      segment: ({
        oldValue,
        oldChartConfig,
        newChartConfig,
        dimensions,
        measures,
      }) => {
        let newSegment: ColumnSegmentField;
        let newColor: ColorField;

        const xMeasure = measures.find(
          (d) => d.id === newChartConfig.fields.x.componentId
        );

        // When switching from a table chart, a whole fields object is passed as oldValue.
        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields =
            convertTableFieldsToSegmentAndColorFields({
              fields: oldValue as TableFields,
              dimensions,
              measures,
            });

          if (maybeSegmentAndColorFields) {
            newSegment = {
              ...maybeSegmentAndColorFields.segment,
              sorting: DEFAULT_SORTING,
              type: disableStacked(xMeasure) ? "grouped" : "stacked",
            };
            newColor = maybeSegmentAndColorFields.color;
          }
          // Otherwise we are dealing with a segment field. We shouldn't take
          // the segment from oldValue if the component has already been used as
          // y axis.
        } else if (
          newChartConfig.fields.y.componentId !== oldValue.componentId
        ) {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find(
            (d) => d.id === oldValue.componentId
          );
          newSegment = {
            ...oldSegment,
            // We could encounter byMeasure sorting type (Pie chart); we should
            // switch to byTotalSize sorting then.
            sorting: adjustSegmentSorting({
              segment: oldSegment,
              acceptedValues: COLUMN_SEGMENT_SORTING.map((d) => d.sortingType),
              defaultValue: "byTotalSize",
            }),
            type: disableStacked(xMeasure) ? "grouped" : "stacked",
          };
          newColor = getSegmentColorField({
            oldColorField: oldColor,
            segmentDimension,
          });
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
      animation: ({ oldValue, newChartConfig }) => {
        if (newChartConfig.chartType !== "bar") {
          return produce(newChartConfig, (draft) => {
            if (newChartConfig.fields.x.componentId !== oldValue?.componentId) {
              draft.fields.animation = oldValue;
            }
          });
        }
        return produce(newChartConfig, (draft) => {
          // Temporal dimension could be used as Y axis, in this case we need to
          // remove the animation.
          if (newChartConfig.fields.y.componentId !== oldValue?.componentId) {
            draft.fields.animation = oldValue;
          }
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  line: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType = "circle", ...rest }) => ({
            ...rest,
            symbolType,
          }))
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          const ok = dimensions.find(
            (d) => isTemporalDimension(d) && d.id === oldValue
          );

          if (ok) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
        customDomain: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.customDomain = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          // Segment color type is migrated in tandem with the segment field below.
          if (oldValue.type !== "segment") {
            draft.fields.color = getSingleColorField({
              oldColorField: oldValue,
            });
          }
        });
      },
      segment: ({
        oldValue,
        oldChartConfig,
        newChartConfig,
        dimensions,
        measures,
      }) => {
        let newSegment: LineSegmentField;
        let newColor: ColorField;

        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields =
            convertTableFieldsToSegmentAndColorFields({
              fields: oldValue as TableFields,
              dimensions,
              measures,
            });

          if (maybeSegmentAndColorFields) {
            newSegment = maybeSegmentAndColorFields.segment;
            newColor = maybeSegmentAndColorFields.color;
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find(
            (d) => d.id === oldValue.componentId
          );

          if (!isTemporalDimension(segmentDimension)) {
            newSegment = {
              componentId: oldSegment.componentId,
              sorting:
                "sorting" in oldSegment &&
                oldSegment.sorting &&
                "sortingOrder" in oldSegment.sorting
                  ? (oldSegment.sorting ?? DEFAULT_FIXED_COLOR_FIELD)
                  : DEFAULT_SORTING,
              showValuesMapping: oldSegment.showValuesMapping,
            };
            newColor = getSegmentColorField({
              oldColorField: oldColor,
              segmentDimension,
            });
          }
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  area: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType = "circle", ...rest }) => ({
            ...rest,
            symbolType,
          }))
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          const ok = dimensions.find(
            (d) => isTemporalDimension(d) && d.id === oldValue
          );

          if (ok) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
        customDomain: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.customDomain = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          // Segment color type is migrated in tandem with the segment field below.
          if (oldValue.type !== "segment") {
            draft.fields.color = getSingleColorField({
              oldColorField: oldValue,
            });
          }
        });
      },
      segment: ({
        oldValue,
        oldChartConfig,
        newChartConfig,
        dimensions,
        measures,
      }) => {
        const yMeasure = measures.find(
          (d) => d.id === newChartConfig.fields.y.componentId
        );

        if (disableStacked(yMeasure)) {
          return produce(newChartConfig, (draft) => {
            delete draft.fields.segment;
          });
        }

        let newSegment: AreaSegmentField;
        let newColor: ColorField;

        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields =
            convertTableFieldsToSegmentAndColorFields({
              fields: oldValue as TableFields,
              dimensions,
              measures,
            });

          if (maybeSegmentAndColorFields) {
            newSegment = {
              ...maybeSegmentAndColorFields.segment,
              sorting: DEFAULT_SORTING,
            };
            newColor = maybeSegmentAndColorFields.color;
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find(
            (d) => d.id === oldValue.componentId
          );

          if (!isTemporalDimension(segmentDimension)) {
            newSegment = {
              componentId: oldSegment.componentId,
              sorting: adjustSegmentSorting({
                segment: oldSegment,
                acceptedValues: AREA_SEGMENT_SORTING.map((d) => d.sortingType),
                defaultValue: "byTotalSize",
              }),
              showValuesMapping: oldSegment.showValuesMapping,
            };
            newColor = getSegmentColorField({
              oldColorField: oldColor,
              segmentDimension,
            });
          }
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  scatterplot: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          const numericalMeasures = measures.filter(isNumericalMeasure);

          // If there is only one numerical measure then x & y are already filled correctly.
          if (numericalMeasures.length > 1) {
            if (numericalMeasures.map((d) => d.id).includes(oldValue)) {
              return produce(newChartConfig, (draft) => {
                draft.fields.x.componentId = oldValue;
              });
            }
          }

          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          const numericalMeasures = measures.filter(isNumericalMeasure);

          // If there is only one numerical measure then x & y are already filled correctly.
          if (numericalMeasures.length > 1) {
            if (
              numericalMeasures.map((d) => d.id).includes(oldValue) &&
              newChartConfig.fields.x.componentId !== oldValue
            ) {
              return produce(newChartConfig, (draft) => {
                draft.fields.y.componentId = oldValue;
              });
            } else {
              const newMeasure = numericalMeasures.find(
                (d) => d.id !== newChartConfig.fields.x.componentId
              );

              if (newMeasure) {
                return produce(newChartConfig, (draft) => {
                  draft.fields.y.componentId = newMeasure.id;
                });
              }
            }
          }

          return newChartConfig;
        },
      },
      color: ({ oldValue, oldChartConfig, newChartConfig, dimensions }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "single") {
            const oldColor = getCompatibleColorField(oldChartConfig);
            const segmentDimension = dimensions.find(
              (d) => d.id === newChartConfig.fields.segment?.componentId
            );

            draft.fields.color = getSegmentColorField({
              oldColorField: oldColor,
              segmentDimension,
            });
          }
        });
      },
      segment: ({
        oldValue,
        oldChartConfig,
        newChartConfig,
        dimensions,
        measures,
      }) => {
        let newSegment: ScatterPlotSegmentField;
        let newColor: ColorField;
        const oldColor = getCompatibleColorField(oldChartConfig);
        const segmentDimension = dimensions.find(
          (d) => d.id === oldValue.componentId
        );

        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields =
            convertTableFieldsToSegmentAndColorFields({
              fields: oldValue as TableFields,
              dimensions,
              measures,
            });

          if (maybeSegmentAndColorFields) {
            newSegment = maybeSegmentAndColorFields.segment;
            newColor = maybeSegmentAndColorFields.color;
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          newSegment = {
            componentId: oldSegment.componentId,
            showValuesMapping: oldSegment.showValuesMapping,
          };
          newColor = getSegmentColorField({
            oldColorField: oldColor,
            segmentDimension,
          });
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
      animation: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.fields.animation = oldValue;
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  pie: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
      },
      color: ({ oldValue, oldChartConfig, newChartConfig, dimensions }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "single") {
            const oldColor = getCompatibleColorField(oldChartConfig);
            const segmentDimension = dimensions.find(
              (d) => d.id === newChartConfig.fields.segment.componentId
            );

            draft.fields.color = getSegmentColorField({
              oldColorField: oldColor,
              segmentDimension,
            });
          }
        });
      },
      segment: ({
        oldValue,
        oldChartConfig,
        newChartConfig,
        dimensions,
        measures,
      }) => {
        let newSegment: PieSegmentField;
        let newColor: ColorField;

        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields =
            convertTableFieldsToSegmentAndColorFields({
              fields: oldValue as TableFields,
              dimensions,
              measures,
            });

          if (maybeSegmentAndColorFields) {
            newSegment = {
              ...maybeSegmentAndColorFields.segment,
              sorting: DEFAULT_SORTING,
            };
            newColor = maybeSegmentAndColorFields.color;
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find(
            (d) => d.id === oldSegment.componentId
          );
          newSegment = {
            componentId: oldSegment.componentId,
            sorting: adjustSegmentSorting({
              segment: oldSegment,
              acceptedValues: PIE_SEGMENT_SORTING.map((d) => d.sortingType),
              defaultValue: "byMeasure",
            }),
            showValuesMapping: oldSegment.showValuesMapping,
          };
          newColor = getSegmentColorField({
            oldColorField: oldColor,
            segmentDimension,
          });
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
      animation: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.fields.animation = oldValue;
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  donut: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "segment") {
            draft.fields.color = oldValue;
          }
        });
      },
      segment: ({ oldValue, oldChartConfig, newChartConfig, dimensions, measures }) => {
        let newSegment: PieSegmentField;
        let newColor: ColorField;

        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields = convertTableFieldsToSegmentAndColorFields({
            fields: oldValue as TableFields,
            dimensions,
            measures,
          });

          if (maybeSegmentAndColorFields) {
            newSegment = {
              ...maybeSegmentAndColorFields.segment,
              sorting: DEFAULT_SORTING,
              showValuesMapping: {},
            };
            newColor = maybeSegmentAndColorFields.color;
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find((d) => d.id === oldSegment.componentId);
          newSegment = {
            componentId: oldSegment.componentId,
            sorting: adjustSegmentSorting({
              segment: oldSegment,
              acceptedValues: PIE_SEGMENT_SORTING.map((d) => d.sortingType),
              defaultValue: "byMeasure",
            }),
            showValuesMapping: (oldSegment as PieSegmentField).showValuesMapping ?? {},
          };
          newColor = getSegmentColorField({ oldColorField: oldColor, segmentDimension });
        }

        return produce(newChartConfig, (draft) => {
          if (newSegment && newColor?.type === "segment") {
            draft.fields.segment = newSegment;
            draft.fields.color = newColor;
          }
        });
      },
      animation: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.fields.animation = oldValue;
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  radar: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "segment") {
            draft.fields.color = oldValue;
          }
        });
      },
      segment: ({ oldValue, oldChartConfig, newChartConfig, dimensions, measures }) => {
        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields = convertTableFieldsToSegmentAndColorFields({
            fields: oldValue as TableFields,
            dimensions,
            measures,
          });

          if (maybeSegmentAndColorFields) {
            const segmentDimension = dimensions.find((d) => d.id === maybeSegmentAndColorFields.segment.componentId);
            return produce(newChartConfig, (draft) => {
              draft.fields.segment = {
                ...maybeSegmentAndColorFields.segment,
                sorting: DEFAULT_SORTING,
              };
              // Radar only accepts segment | single, not measures
              draft.fields.color = maybeSegmentAndColorFields.color.type === "segment"
                ? maybeSegmentAndColorFields.color
                : getSegmentColorField({ oldColorField: maybeSegmentAndColorFields.color, segmentDimension });
            });
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find((d) => d.id === oldSegment.componentId);

          return produce(newChartConfig, (draft) => {
            draft.fields.segment = {
              componentId: oldSegment.componentId,
              sorting: DEFAULT_SORTING,
            };
            draft.fields.color = getSegmentColorField({ oldColorField: oldColor, segmentDimension });
          });
        }
        return newChartConfig;
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  funnel: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "segment") {
            draft.fields.color = oldValue;
          }
        });
      },
      segment: ({ oldValue, oldChartConfig, newChartConfig, dimensions, measures }) => {
        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields = convertTableFieldsToSegmentAndColorFields({
            fields: oldValue as TableFields,
            dimensions,
            measures,
          });

          if (maybeSegmentAndColorFields) {
            const segmentDimension = dimensions.find((d) => d.id === maybeSegmentAndColorFields.segment.componentId);
            return produce(newChartConfig, (draft) => {
              draft.fields.segment = {
                ...maybeSegmentAndColorFields.segment,
                sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
              };
              // Funnel only accepts segment color type
              draft.fields.color = getSegmentColorField({ oldColorField: maybeSegmentAndColorFields.color, segmentDimension });
            });
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find((d) => d.id === oldSegment.componentId);

          return produce(newChartConfig, (draft) => {
            draft.fields.segment = {
              componentId: oldSegment.componentId,
              sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
            };
            draft.fields.color = getSegmentColorField({ oldColorField: oldColor, segmentDimension });
          });
        }
        return newChartConfig;
      },
      animation: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.fields.animation = oldValue;
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  gauge: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "single") {
            draft.fields.color = oldValue;
          }
        });
      },
      segment: ({ newChartConfig }) => {
        // Gauge doesn't use segment, return unchanged
        return newChartConfig;
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  treemap: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "segment") {
            draft.fields.color = oldValue;
          }
        });
      },
      segment: ({ oldValue, oldChartConfig, newChartConfig, dimensions, measures }) => {
        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields = convertTableFieldsToSegmentAndColorFields({
            fields: oldValue as TableFields,
            dimensions,
            measures,
          });

          if (maybeSegmentAndColorFields) {
            const segmentDimension = dimensions.find((d) => d.id === maybeSegmentAndColorFields.segment.componentId);
            return produce(newChartConfig, (draft) => {
              draft.fields.segment = {
                ...maybeSegmentAndColorFields.segment,
                sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
              };
              // Treemap only accepts segment | single, not measures
              draft.fields.color = maybeSegmentAndColorFields.color.type === "segment"
                ? maybeSegmentAndColorFields.color
                : getSegmentColorField({ oldColorField: maybeSegmentAndColorFields.color, segmentDimension });
            });
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find((d) => d.id === oldSegment.componentId);

          return produce(newChartConfig, (draft) => {
            draft.fields.segment = {
              componentId: oldSegment.componentId,
              sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
            };
            draft.fields.color = getSegmentColorField({ oldColorField: oldColor, segmentDimension });
          });
        }
        return newChartConfig;
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  sunburst: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.componentId = oldValue;
          });
        },
        showValues: ({ oldValue, newChartConfig }) => {
          return produce(newChartConfig, (draft) => {
            draft.fields.y.showValues = oldValue;
          });
        },
      },
      color: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "segment") {
            draft.fields.color = oldValue;
          }
        });
      },
      segment: ({ oldValue, oldChartConfig, newChartConfig, dimensions, measures }) => {
        if (oldChartConfig.chartType === "table") {
          const maybeSegmentAndColorFields = convertTableFieldsToSegmentAndColorFields({
            fields: oldValue as TableFields,
            dimensions,
            measures,
          });

          if (maybeSegmentAndColorFields) {
            const segmentDimension = dimensions.find((d) => d.id === maybeSegmentAndColorFields.segment.componentId);
            return produce(newChartConfig, (draft) => {
              draft.fields.segment = {
                ...maybeSegmentAndColorFields.segment,
                sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
              };
              // Sunburst only accepts segment color type
              draft.fields.color = getSegmentColorField({ oldColorField: maybeSegmentAndColorFields.color, segmentDimension });
            });
          }
        } else {
          const oldSegment = oldValue as Exclude<typeof oldValue, TableFields>;
          const oldColor = getCompatibleColorField(oldChartConfig);
          const segmentDimension = dimensions.find((d) => d.id === oldSegment.componentId);

          return produce(newChartConfig, (draft) => {
            draft.fields.segment = {
              componentId: oldSegment.componentId,
              sorting: { sortingType: "byMeasure", sortingOrder: "desc" },
            };
            draft.fields.color = getSegmentColorField({ oldColorField: oldColor, segmentDimension });
          });
        }
        return newChartConfig;
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  heatmap: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              draft.fields.y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => {
        // Heatmap uses sequential/diverging color types which are different from
        // other chart types, so we don't migrate colors - keep the default
        return newChartConfig;
      },
      segment: ({ newChartConfig }) => {
        // Heatmap doesn't use segment, return unchanged
        return newChartConfig;
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  table: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue.map((cube) => ({
          ...cube,
          filters: Object.fromEntries(
            Object.entries(cube.filters).filter(
              ([_, value]) => value.type !== "range"
            )
          ),
        }));
      });
    },
    fields: ({ oldValue, newChartConfig }) => {
      for (const componentId of Object.keys(newChartConfig.fields)) {
        if (componentId === oldValue.componentId) {
          return produce(newChartConfig, (draft) => {
            draft.fields[componentId].isGroup = true;
          });
        }
      }

      return newChartConfig;
    },
  },
  map: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        // Filters have been reset by the initial config of the map.
        // We need to set them back to their old value, taking care not
        // to override the filters that have been set by the initial config
        // of the map.
        for (const oldCube of oldValue) {
          const cube = draft.cubes.find((d) => d.iri === oldCube.iri) as Cube;

          for (const [id, value] of Object.entries(oldCube.filters)) {
            if (cube.filters[id] === undefined) {
              cube.filters[id] = value;
            }
          }

          if (oldCube.joinBy !== undefined) {
            cube.joinBy = oldCube.joinBy;
          }
        }
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      areaLayer: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          const areaDimension = dimensions.find(
            (d) => d.__typename === "GeoShapesDimension" && d.id === oldValue
          );

          if (areaDimension) {
            return produce(newChartConfig, (draft) => {
              if (draft.fields.areaLayer) {
                draft.fields.areaLayer.componentId = oldValue;
              }
            });
          }

          return newChartConfig;
        },
        color: {
          componentId: ({ oldValue, newChartConfig }) => {
            return produce(newChartConfig, (draft) => {
              if (draft.fields.areaLayer) {
                draft.fields.areaLayer.color.componentId = oldValue;
              }

              if (draft.fields.symbolLayer) {
                draft.fields.symbolLayer.measureId = oldValue;
              }
            });
          },
        },
      },
      animation: ({ oldValue, newChartConfig }) => {
        return produce(newChartConfig, (draft) => {
          draft.fields.animation = oldValue;
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  comboLineSingle: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          const ok = dimensions.find(
            (d) => isTemporalDimension(d) && d.id === oldValue
          );

          if (ok) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      y: {
        componentIds: ({
          oldValue,
          newChartConfig,
          oldChartConfig,
          measures,
        }) => {
          const numericalMeasures = measures.filter(
            (d) => isNumericalMeasure(d) && d.unit
          );
          const { unit } =
            numericalMeasures.find((d) => d.id === oldValue) ??
            numericalMeasures[0];
          const componentIds = numericalMeasures
            .filter((d) => d.unit === unit)
            .map((d) => d.id);
          const paletteId = isColorInConfig(oldChartConfig)
            ? (oldChartConfig.fields.color.paletteId ??
              DEFAULT_CATEGORICAL_PALETTE_ID)
            : DEFAULT_CATEGORICAL_PALETTE_ID;

          return produce(newChartConfig, (draft) => {
            draft.fields.y = {
              componentIds,
            };
            draft.fields.color = {
              type: "measures",
              paletteId: paletteId,
              colorMapping: mapValueIrisToColor({
                paletteId,
                dimensionValues: componentIds.map((id) => ({
                  value: id,
                  label: id,
                })),
              }),
            };
          });
        },
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  comboLineDual: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          const ok = dimensions.find(
            (d) => isTemporalDimension(d) && d.id === oldValue
          );

          if (ok) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      y: ({ newChartConfig, oldChartConfig, measures, isAddingNewCube }) => {
        const numericalMeasures = measures.filter(isNumericalMeasure);
        const numericalMeasureIds = numericalMeasures.map((d) => d.id);
        let leftMeasure = numericalMeasures.find(
          (d) => d.id === numericalMeasureIds[0]
        ) as NumericalMeasure;
        let rightMeasureId: string | undefined;
        const getLeftMeasure = (preferredId: string) => {
          const preferredLeftMeasure = numericalMeasures.find(
            (d) => d.id === preferredId
          ) as NumericalMeasure;

          if (isAddingNewCube) {
            const rightMeasure = numericalMeasures.find(
              (d) => d.id === rightMeasureId
            );
            const overrideLeftMeasure = numericalMeasures.find(
              (d) =>
                d.cubeIri !== rightMeasure?.cubeIri &&
                d.unit !== rightMeasure?.unit
            );

            return overrideLeftMeasure ?? preferredLeftMeasure;
          } else {
            return preferredLeftMeasure;
          }
        };

        switch (oldChartConfig.chartType) {
          case "comboLineColumn": {
            const {
              lineComponentId: lineId,
              lineAxisOrientation: lineOrientation,
              columnComponentId: columnId,
            } = oldChartConfig.fields.y;
            const leftAxisId = lineOrientation === "left" ? lineId : columnId;
            rightMeasureId = lineOrientation === "left" ? columnId : lineId;
            leftMeasure = getLeftMeasure(leftAxisId);
            break;
          }
          case "comboLineSingle": {
            leftMeasure = getLeftMeasure(
              oldChartConfig.fields.y.componentIds[0]
            );
            break;
          }
          case "area":
          case "column":
          case "line":
          case "pie":
          case "donut":
          case "radar":
          case "funnel":
          case "treemap":
          case "sunburst":
          case "scatterplot": {
            leftMeasure = getLeftMeasure(oldChartConfig.fields.y.componentId);
            break;
          }
          case "gauge":
          case "heatmap": {
            // Gauge uses y.componentId for measure, heatmap uses value.componentId
            const measureId = oldChartConfig.chartType === "gauge"
              ? oldChartConfig.fields.y.componentId
              : oldChartConfig.fields.value.componentId;
            leftMeasure = getLeftMeasure(measureId);
            break;
          }
          case "map": {
            const { areaLayer, symbolLayer } = oldChartConfig.fields;
            const leftAxisId =
              areaLayer?.color.componentId ?? symbolLayer?.measureId;

            if (leftAxisId) {
              leftMeasure = getLeftMeasure(leftAxisId);
            }

            break;
          }
          case "bar": {
            leftMeasure = getLeftMeasure(oldChartConfig.fields.x.componentId);
            break;
          }
          case "comboLineDual":
          case "table":
          case "boxplot":
          case "waterfall":
          case "sankey":
          case "polar":
          case "wordcloud":
          case "bar3d":
          case "scatter3d":
          case "surface":
          case "line3d":
          case "globe":
          case "pie3d":
            break;
          default:
            const _exhaustiveCheck: never = oldChartConfig;
            return _exhaustiveCheck;
        }

        const rightMeasure = numericalMeasures.find((d) =>
          rightMeasureId ? d.id === rightMeasureId : d.unit !== leftMeasure.unit
        ) as NumericalMeasure;
        rightMeasureId = rightMeasure.id;
        leftMeasure = getLeftMeasure(leftMeasure.id);

        const paletteId = isColorInConfig(oldChartConfig)
          ? (oldChartConfig.fields.color.paletteId ??
            DEFAULT_CATEGORICAL_PALETTE_ID)
          : DEFAULT_CATEGORICAL_PALETTE_ID;

        return produce(newChartConfig, (draft) => {
          draft.fields.y = {
            leftAxisComponentId: leftMeasure.id,
            rightAxisComponentId: rightMeasureId as string,
          };
          draft.fields.color = {
            type: "measures",
            paletteId: paletteId,
            colorMapping: mapValueIrisToColor({
              paletteId,
              dimensionValues: [leftMeasure.id, rightMeasureId].map((id) => ({
                value: id,
                label: id,
              })) as DimensionValue[],
            }),
          };
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  comboLineColumn: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          const ok = dimensions.find(
            (d) => isTemporalDimension(d) && d.id === oldValue
          );

          if (ok) {
            return produce(newChartConfig, (draft) => {
              draft.fields.x.componentId = oldValue;
            });
          }

          return newChartConfig;
        },
      },
      y: ({ newChartConfig, oldChartConfig, measures }) => {
        const numericalMeasures = measures.filter(isNumericalMeasure);
        const numericalMeasureIds = numericalMeasures.map((d) => d.id);
        let leftMeasure = numericalMeasures.find(
          (d) => d.id === numericalMeasureIds[0]
        ) as NumericalMeasure;
        let rightMeasureId: string;
        const getMeasure = (id: string) => {
          return numericalMeasures.find((d) => d.id === id) as NumericalMeasure;
        };

        switch (oldChartConfig.chartType) {
          case "comboLineDual": {
            const leftAxisId = oldChartConfig.fields.y.leftAxisComponentId;
            leftMeasure = getMeasure(leftAxisId);
            rightMeasureId = oldChartConfig.fields.y.rightAxisComponentId;
            break;
          }
          case "comboLineSingle": {
            leftMeasure = getMeasure(oldChartConfig.fields.y.componentIds[0]);
            break;
          }
          case "area":
          case "column":
          case "line":
          case "pie":
          case "donut":
          case "radar":
          case "funnel":
          case "treemap":
          case "sunburst":
          case "scatterplot": {
            leftMeasure = getMeasure(oldChartConfig.fields.y.componentId);
            break;
          }
          case "gauge":
          case "heatmap": {
            const measureId = oldChartConfig.chartType === "gauge"
              ? oldChartConfig.fields.y.componentId
              : oldChartConfig.fields.value.componentId;
            leftMeasure = getMeasure(measureId);
            break;
          }
          case "map": {
            const { areaLayer, symbolLayer } = oldChartConfig.fields;
            const leftAxisId =
              areaLayer?.color.componentId ?? symbolLayer?.measureId;

            if (leftAxisId) {
              leftMeasure = getMeasure(leftAxisId);
            }

            break;
          }
          case "bar": {
            leftMeasure = getMeasure(oldChartConfig.fields.x.componentId);
            break;
          }
          case "comboLineColumn":
          case "table":
          case "boxplot":
          case "waterfall":
          case "sankey":
          case "polar":
          case "wordcloud":
          // 3D Charts (ECharts GL)
          case "bar3d":
          case "scatter3d":
          case "surface":
          case "line3d":
          case "globe":
          case "pie3d":
            break;
          default:
            const _exhaustiveCheck: never = oldChartConfig;
            return _exhaustiveCheck;
        }

        const rightMeasure = numericalMeasures.find((d) =>
          rightMeasureId ? d.id === rightMeasureId : d.unit !== leftMeasure.unit
        ) as NumericalMeasure;
        const lineComponentId = rightMeasure.id;

        const paletteId = isColorInConfig(oldChartConfig)
          ? (oldChartConfig.fields.color.paletteId ??
            DEFAULT_CATEGORICAL_PALETTE_ID)
          : DEFAULT_CATEGORICAL_PALETTE_ID;

        return produce(newChartConfig, (draft) => {
          draft.fields.y = {
            columnComponentId: leftMeasure.id,
            lineComponentId,
            lineAxisOrientation: "right",
          };
          draft.fields.color = {
            type: "measures",
            paletteId: paletteId,
            colorMapping: mapValueIrisToColor({
              paletteId,
              dimensionValues: [leftMeasure.id, lineComponentId].map((id) => ({
                value: id,
                label: id,
              })) as DimensionValue[],
            }),
          };
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  // New ECharts-only chart types - basic adjusters
  boxplot: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  waterfall: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  sankey: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      source: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).source.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      target: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).target.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      value: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).value.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  polar: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      angle: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).angle.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      radius: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).radius.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  wordcloud: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      text: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).text.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      value: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).value.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  // 3D Charts (ECharts GL)
  bar3d: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  scatter3d: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      z: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).z.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  surface: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      z: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).z.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  line3d: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      x: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).x.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  globe: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      geo: {
        componentId: ({ oldValue, newChartConfig, dimensions }) => {
          if (dimensions.find((d) => d.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).geo.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      value: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).value.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ newChartConfig }) => newChartConfig,
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
  pie3d: {
    cubes: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.cubes = oldValue;
      });
    },
    annotations: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.annotations = oldValue;
      });
    },
    limits: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.limits = mapValues(oldValue, (limits) =>
          limits.map(({ symbolType, ...rest }) => rest)
        );
      });
    },
    conversionUnitsByComponentId: ({ oldValue, newChartConfig }) => {
      return produce(newChartConfig, (draft) => {
        draft.conversionUnitsByComponentId = oldValue;
      });
    },
    fields: {
      y: {
        componentId: ({ oldValue, newChartConfig, measures }) => {
          if (measures.find((m) => m.id === oldValue)) {
            return produce(newChartConfig, (draft) => {
              (draft.fields as $IntentionalAny).y.componentId = oldValue;
            });
          }
          return newChartConfig;
        },
      },
      color: ({ oldValue, oldChartConfig, newChartConfig, dimensions }) => {
        return produce(newChartConfig, (draft) => {
          if (oldValue.type === "single") {
            const oldColor = getCompatibleColorField(oldChartConfig);
            const segmentDimension = dimensions.find(
              (d) => d.id === (newChartConfig.fields as $IntentionalAny).segment?.componentId
            );

            draft.fields.color = getSegmentColorField({
              oldColorField: oldColor,
              segmentDimension,
            });
          }
        });
      },
    },
    interactiveFiltersConfig: interactiveFiltersAdjusters,
  },
};
type ChartConfigAdjusters = (typeof chartConfigsAdjusters)[ChartType];

// Needed to correctly retain chart options when switching to maps and tables.
const chartConfigsPathOverrides: {
  [newChartType in ChartType]: {
    [oldChartType in ChartType]?: {
      [oldFieldToOverride: string]: {
        path: string;
        oldValue?: (d: any) => any;
      }[];
    };
  };
} = {
  column: {
    bar: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.x.showValues": [{ path: "fields.y.showValues" }],
      "fields.x.customDomain": [{ path: "fields.y.customDomain" }],
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
    },
    map: {
      "fields.areaLayer.componentId": [{ path: "fields.x.componentId" }],
      "fields.areaLayer.color.componentId": [{ path: "fields.y.componentId" }],
    },
    table: {
      fields: [{ path: "fields.segment" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [{ path: "fields.y.componentId" }],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  bar: {
    column: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
      "fields.y.showValues": [{ path: "fields.x.showValues" }],
      "fields.y.customDomain": [{ path: "fields.x.customDomain" }],
    },
    line: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
      "fields.y.showValues": [{ path: "fields.x.showValues" }],
      "fields.y.customDomain": [{ path: "fields.x.customDomain" }],
    },
    area: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
      "fields.y.showValues": [{ path: "fields.x.showValues" }],
      "fields.y.customDomain": [{ path: "fields.x.customDomain" }],
    },
    pie: {
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
      "fields.y.showValues": [{ path: "fields.x.showValues" }],
    },
    map: {
      "fields.areaLayer.componentId": [{ path: "fields.y.componentId" }],
      "fields.areaLayer.color.componentId": [{ path: "fields.x.componentId" }],
    },
    table: {
      fields: [{ path: "fields.segment" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.x.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [{ path: "fields.x.componentId" }],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.x.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  line: {
    bar: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.x.showValues": [{ path: "fields.y.showValues" }],
      "fields.x.customDomain": [{ path: "fields.y.customDomain" }],
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
    },
    map: {
      "fields.areaLayer.color.componentId": [{ path: "fields.y.componentId" }],
    },
    table: {
      fields: [{ path: "fields.segment" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [{ path: "fields.y.componentId" }],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  area: {
    bar: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.x.showValues": [{ path: "fields.y.showValues" }],
      "fields.x.customDomain": [{ path: "fields.y.customDomain" }],
      "fields.y.componentId": [{ path: "fields.x.componentId" }],
    },
    map: {
      "fields.areaLayer.color.componentId": [{ path: "fields.y.componentId" }],
    },
    table: {
      fields: [{ path: "fields.segment" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [{ path: "fields.y.componentId" }],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  scatterplot: {
    map: {
      "fields.areaLayer.color.componentId": [{ path: "fields.y.componentId" }],
    },
    table: {
      fields: [{ path: "fields.segment" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [{ path: "fields.y.componentId" }],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  pie: {
    bar: {
      "fields.x.componentId": [{ path: "fields.y.componentId" }],
      "fields.x.showValues": [{ path: "fields.y.showValues" }],
      // We want to avoid running the logic for the y component twice.
      "fields.y.componentId": [{ path: "SKIP" }],
    },
    map: {
      "fields.areaLayer.componentId": [{ path: "fields.segment.componentId" }],
      "fields.areaLayer.color.componentId": [{ path: "fields.y.componentId" }],
    },
    table: {
      fields: [{ path: "fields.segment" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [{ path: "fields.y.componentId" }],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.y.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  table: {
    column: {
      "fields.segment": [{ path: "fields" }],
    },
    line: {
      "fields.segment": [{ path: "fields" }],
    },
    area: {
      "fields.segment": [{ path: "fields" }],
    },
    scatterplot: {
      "fields.segment": [{ path: "fields" }],
    },
    pie: {
      "fields.segment": [{ path: "fields" }],
    },
  },
  map: {
    column: {
      "fields.x.componentId": [{ path: "fields.areaLayer.componentId" }],
      "fields.y.componentId": [{ path: "fields.areaLayer.color.componentId" }],
    },
    bar: {
      "fields.x.componentId": [{ path: "fields.areaLayer.color.componentId" }],
      "fields.y.componentId": [{ path: "fields.areaLayer.componentId" }],
    },
    line: {
      "fields.y.componentId": [{ path: "fields.areaLayer.color.componentId" }],
    },
    area: {
      "fields.y.componentId": [{ path: "fields.areaLayer.color.componentId" }],
    },
    scatterplot: {
      "fields.y.componentId": [{ path: "fields.areaLayer.color.componentId" }],
    },
    pie: {
      "fields.x.componentId": [{ path: "fields.areaLayer.componentId" }],
      "fields.y.componentId": [{ path: "fields.areaLayer.color.componentId" }],
    },
    comboLineSingle: {
      "fields.y.componentIds": [
        {
          path: "fields.areaLayer.color.componentId",
          oldValue: (d: ComboLineSingleFields["y"]["componentIds"]) => d[0],
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [
        { path: "fields.areaLayer.color.componentId" },
      ],
    },
    comboLineColumn: {
      "fields.y": [
        {
          path: "fields.areaLayer.color.componentId",
          oldValue: (d: ComboLineColumnFields["y"]) => {
            return d.lineAxisOrientation === "left"
              ? d.lineComponentId
              : d.columnComponentId;
          },
        },
      ],
    },
  },
  comboLineSingle: {
    column: {
      "fields.y.componentId": [{ path: "fields.y.componentIds" }],
    },
    bar: {
      "fields.x.componentId": [{ path: "fields.y.componentIds" }],
    },
    line: {
      "fields.y.componentId": [{ path: "fields.y.componentIds" }],
    },
    area: {
      "fields.y.componentId": [{ path: "fields.y.componentIds" }],
    },
    scatterplot: {
      "fields.y.componentId": [{ path: "fields.y.componentIds" }],
    },
    pie: {
      "fields.y.componentId": [{ path: "fields.y.componentIds" }],
    },
    map: {
      "fields.areaLayer.color.componentId": [
        {
          path: "fields.y.componentIds",
        },
      ],
    },
    comboLineDual: {
      "fields.y.leftAxisComponentId": [
        {
          path: "fields.y.componentIds",
        },
      ],
    },
    comboLineColumn: {
      "fields.y.lineComponentId": [{ path: "fields.y.componentIds" }],
    },
  },
  comboLineDual: {
    column: {
      "fields.y": [{ path: "fields.y" }],
    },
    bar: {
      "fields.x": [{ path: "fields.y" }],
    },
    line: {
      "fields.y": [{ path: "fields.y" }],
    },
    area: {
      "fields.y": [{ path: "fields.y" }],
    },
    scatterplot: {
      "fields.y": [{ path: "fields.y" }],
    },
    pie: {
      "fields.y": [{ path: "fields.y" }],
    },
    map: {
      "fields.areaLayer": [{ path: "fields.y" }],
    },
    comboLineSingle: {
      "fields.y": [{ path: "fields.y" }],
    },
    comboLineColumn: {
      "fields.y": [{ path: "fields.y" }],
    },
  },
  comboLineColumn: {
    column: {
      "fields.y": [{ path: "fields.y" }],
    },
    bar: {
      "fields.x": [{ path: "fields.y" }],
    },
    line: {
      "fields.y": [{ path: "fields.y" }],
    },
    area: {
      "fields.y": [{ path: "fields.y" }],
    },
    scatterplot: {
      "fields.y": [{ path: "fields.y" }],
    },
    pie: {
      "fields.y": [{ path: "fields.y" }],
    },
    map: {
      "fields.areaLayer": [{ path: "fields.y" }],
    },
    comboLineSingle: {
      "fields.y": [{ path: "fields.y" }],
    },
    comboLineDual: {
      "fields.y": [{ path: "fields.y" }],
    },
  },
  // New chart types - minimal overrides needed as they're self-contained
  donut: {
    pie: {
      // Donut and pie have identical field structure
    },
  },
  radar: {
    // Radar has unique indicators field, minimal overlap with other charts
  },
  funnel: {
    pie: {
      // Funnel is similar to pie with segment-based data
    },
  },
  gauge: {
    // Gauge is a simple measure display, minimal field overlap
  },
  treemap: {
    pie: {
      // Treemap is similar to pie with segment-based hierarchical data
    },
  },
  sunburst: {
    pie: {
      // Sunburst is similar to pie with segment-based hierarchical data
    },
    treemap: {
      // Treemap and sunburst have similar structure
    },
  },
  heatmap: {
    scatterplot: {
      // Both have x/y axes
    },
    column: {
      // Heatmap can be viewed as a matrix version of columns
    },
  },
  // New ECharts-only chart types
  boxplot: {
    column: {
      // Boxplot has similar x/y structure to column
    },
  },
  waterfall: {
    column: {
      // Waterfall has similar x/y structure to column
    },
  },
  sankey: {
    // Sankey has unique source/target/value structure
  },
  polar: {
    pie: {
      // Polar is radial like pie
    },
  },
  wordcloud: {
    pie: {
      // Wordcloud uses categorical data like pie
    },
  },
  // 3D Charts (ECharts GL)
  bar3d: {
    column: {
      // Bar3d has similar x/y structure to column
    },
  },
  scatter3d: {
    scatterplot: {
      // Scatter3d extends scatterplot with z dimension
    },
  },
  surface: {
    // Surface has unique x/y/z grid structure
  },
  line3d: {
    line: {
      // Line3d has similar structure to line
    },
  },
  globe: {
    map: {
      // Globe has similar geo structure to map
    },
  },
  pie3d: {
    pie: {
      // Pie3d has same structure as pie
    },
  },
};
type ChartConfigPathOverrides =
  (typeof chartConfigsPathOverrides)[ChartType][ChartType];

const adjustSegmentSorting = ({
  segment,
  acceptedValues,
  defaultValue,
}: {
  segment: ChartSegmentField;
  acceptedValues: SortingType[];
  defaultValue: SortingType;
}): SortingOption => {
  const sorting = (segment as any).sorting as SortingOption | undefined;
  const sortingType = sorting?.sortingType;
  const newSorting = sorting
    ? sortingType && acceptedValues.includes(sortingType)
      ? sorting
      : { ...sorting, sortingType: defaultValue }
    : DEFAULT_SORTING;

  return newSorting;
};

// Charts that require at least one categorical dimension + numerical measure
const categoricalEnabledChartTypes: RegularChartType[] = [
  "column",
  "bar",
  "pie",
  "donut",
  "funnel",
  "treemap",
  "sunburst",
  "radar",
  "gauge",
  "boxplot",
  "waterfall",
  "polar",
  "wordcloud",
  // 3D Charts
  "bar3d",
  "scatter3d",
  "surface",
  "line3d",
  "pie3d",
];

// Charts that require at least one geographical dimension
const geoEnabledChartTypes: RegularChartType[] = [
  "column",
  "bar",
  "map",
  "pie",
  "globe", // 3D globe visualization
];

// Charts that require two categorical dimensions for flow visualization
const flowEnabledChartTypes: RegularChartType[] = [
  "sankey",
];

// Charts that require at least two numerical measures
const multipleNumericalMeasuresEnabledChartTypes: RegularChartType[] = [
  "scatterplot",
  "radar",
];

// Charts that require at least one temporal dimension
const timeEnabledChartTypes: RegularChartType[] = [
  "area",
  "column",
  "bar",
  "line",
];

// Charts that require both categorical and temporal dimensions (for matrix display)
const matrixEnabledChartTypes: RegularChartType[] = [
  "heatmap",
];

export const getEnabledChartTypes = ({
  dimensions,
  measures,
  cubeCount,
}: {
  dimensions: Dimension[];
  measures: Measure[];
  cubeCount: number;
}) => {
  const numericalMeasures = measures.filter(isNumericalMeasure);
  const ordinalMeasures = measures.filter(isOrdinalMeasure);
  const categoricalDimensions = getCategoricalDimensions(dimensions);
  const geoDimensions = getGeoDimensions(dimensions);
  const temporalDimensions = dimensions.filter(
    (d) => isTemporalDimension(d) || isTemporalEntityDimension(d)
  );

  const possibleChartTypesDict = Object.fromEntries(
    chartTypes.map((chartType) => [
      chartType,
      {
        enabled: chartType === "table",
        message: undefined,
      },
    ])
  ) as Record<
    ChartType,
    {
      enabled: boolean;
      message: string | undefined;
    }
  >;
  const enableChartType = (chartType: ChartType) => {
    possibleChartTypesDict[chartType] = {
      enabled: true,
      message: undefined,
    };
  };
  const enableChartTypes = (chartTypes: ChartType[]) => {
    for (const chartType of chartTypes) {
      enableChartType(chartType);
    }
  };
  const maybeDisableChartType = (chartType: ChartType, message: string) => {
    if (
      !possibleChartTypesDict[chartType].enabled &&
      !possibleChartTypesDict[chartType].message
    ) {
      possibleChartTypesDict[chartType] = {
        enabled: false,
        message,
      };
    }
  };
  const maybeDisableChartTypes = (chartTypes: ChartType[], message: string) => {
    for (const chartType of chartTypes) {
      maybeDisableChartType(chartType, message);
    }
  };

  if (numericalMeasures.length > 0) {
    if (categoricalDimensions.length > 0) {
      enableChartTypes(categoricalEnabledChartTypes);
    } else {
      maybeDisableChartTypes(
        categoricalEnabledChartTypes,
        t({
          id: "controls.chart.disabled.categorical",
          message: "At least one categorical dimension is required.",
        })
      );
    }

    if (geoDimensions.length > 0) {
      enableChartTypes(geoEnabledChartTypes);
    } else {
      maybeDisableChartTypes(
        geoEnabledChartTypes,
        t({
          id: "controls.chart.disabled.geographical",
          message: "At least one geographical dimension is required.",
        })
      );
    }

    if (numericalMeasures.length > 1) {
      enableChartTypes(multipleNumericalMeasuresEnabledChartTypes);

      if (temporalDimensions.length > 0) {
        const measuresWithUnit = numericalMeasures.filter((d) => d.unit);
        const uniqueUnits = Array.from(
          new Set(measuresWithUnit.map((d) => d.unit))
        );

        if (uniqueUnits.length > 1) {
          enableChartTypes(comboDifferentUnitChartTypes);
        } else {
          maybeDisableChartTypes(
            comboDifferentUnitChartTypes,
            t({
              id: "controls.chart.disabled.different-unit",
              message:
                "At least two numerical measures with different units are required.",
            })
          );
        }

        const unitCounts = rollup(
          measuresWithUnit,
          (v) => v.length,
          (d) => d.unit
        );

        if (Array.from(unitCounts.values()).some((d) => d > 1)) {
          enableChartTypes(comboSameUnitChartTypes);
        } else {
          maybeDisableChartTypes(
            comboSameUnitChartTypes,
            t({
              id: "controls.chart.disabled.same-unit",
              message:
                "At least two numerical measures with the same unit are required.",
            })
          );
        }
      } else {
        maybeDisableChartTypes(
          comboChartTypes,
          t({
            id: "controls.chart.disabled.temporal",
            message: "At least one temporal dimension is required.",
          })
        );
      }
    } else {
      maybeDisableChartTypes(
        [...multipleNumericalMeasuresEnabledChartTypes, ...comboChartTypes],
        t({
          id: "controls.chart.disabled.multiple-measures",
          message: "At least two numerical measures are required.",
        })
      );
    }

    if (temporalDimensions.length > 0) {
      enableChartTypes(timeEnabledChartTypes);
    } else {
      maybeDisableChartTypes(
        timeEnabledChartTypes,
        t({
          id: "controls.chart.disabled.temporal",
          message: "At least one temporal dimension is required.",
        })
      );
    }

    // Heatmap requires two dimensions (for rows and columns) to create a matrix
    if (categoricalDimensions.length >= 2 || (categoricalDimensions.length >= 1 && temporalDimensions.length >= 1)) {
      enableChartTypes(matrixEnabledChartTypes);
    } else {
      maybeDisableChartTypes(
        matrixEnabledChartTypes,
        t({
          id: "controls.chart.disabled.matrix",
          message: "At least two dimensions (categorical or temporal) are required for matrix charts.",
        })
      );
    }

    // Sankey requires at least two categorical dimensions for source/target flow
    if (categoricalDimensions.length >= 2) {
      enableChartTypes(flowEnabledChartTypes);
    } else {
      maybeDisableChartTypes(
        flowEnabledChartTypes,
        t({
          id: "controls.chart.disabled.flow",
          message: "At least two categorical dimensions are required for flow charts.",
        })
      );
    }
  } else {
    maybeDisableChartTypes(
      chartTypes.filter((d) => d !== "table"),
      t({
        id: "controls.chart.disabled.numerical",
        message: "At least one numerical measure is required.",
      })
    );
  }

  if (ordinalMeasures.length > 0 && geoDimensions.length > 0) {
    enableChartType("map");
  } else {
    maybeDisableChartType(
      "map",
      "At least one ordinal measure and one geographical dimension are required."
    );
  }

  const chartTypesOrder = getChartTypeOrder({ cubeCount });
  const enabledChartTypes = chartTypes
    .filter((d) => possibleChartTypesDict[d].enabled)
    .sort((a, b) => chartTypesOrder[a] - chartTypesOrder[b]);

  return {
    enabledChartTypes,
    possibleChartTypesDict,
  };
};

export const getFieldComponentIds = (fields: ChartConfig["fields"]) => {
  return new Set(
    Object.values(fields).flatMap((f) =>
      f?.componentId ? [f.componentId] : []
    )
  );
};

export const getGroupedFieldIds = (fields: GenericFields) => {
  return new Set(
    Object.values(fields).flatMap((f) =>
      f && (f as $IntentionalAny).isGroup ? [f.componentId] : []
    )
  );
};

export const getHiddenFieldIds = (fields: GenericFields) => {
  return new Set(
    Object.values(fields).flatMap((f) =>
      f && (f as $IntentionalAny).isHidden ? [f.componentId] : []
    )
  );
};

export const getFieldComponentId = (
  fields: ChartConfig["fields"],
  field: string
): string | undefined => {
  // Multi axis charts have multiple component ids in the y field.
  return (fields as $IntentionalAny)[field]?.componentId;
};

/**
 * Gets the color field from a chart config if it's a compatible type (segment, single, or measures).
 * Returns undefined for heatmap's sequential/diverging color types which can't be migrated to other charts.
 */
const getCompatibleColorField = (chartConfig: ChartConfig): ColorField | undefined => {
  if (!isColorInConfig(chartConfig)) {
    return undefined;
  }
  const colorField = chartConfig.fields.color;
  // Filter out sequential/diverging color types (from heatmap)
  if (
    colorField.type === "sequential" ||
    colorField.type === "diverging"
  ) {
    return undefined;
  }
  return colorField as ColorField;
};

const getSingleColorField = ({
  oldColorField,
}: {
  oldColorField: SingleColorField | MeasuresColorField;
}): SingleColorField => {
  return {
    type: "single",
    paletteId: oldColorField.paletteId,
    color:
      oldColorField.type === "single"
        ? oldColorField.color
        : Object.values(oldColorField.colorMapping)[0],
  };
};

const getSegmentColorField = ({
  oldColorField,
  segmentDimension,
}: {
  oldColorField?: ColorField;
  segmentDimension?: Dimension;
}): SegmentColorField => {
  const paletteId = oldColorField?.paletteId ?? DEFAULT_CATEGORICAL_PALETTE_ID;

  return {
    type: "segment",
    paletteId,
    colorMapping: mapValueIrisToColor({
      paletteId,
      dimensionValues: segmentDimension?.values ?? [],
      colorMapping:
        oldColorField?.type === "segment"
          ? oldColorField.colorMapping
          : undefined,
    }),
  };
};

const convertTableFieldsToSegmentAndColorFields = ({
  fields,
  dimensions,
  measures,
}: {
  fields: TableFields;
  dimensions: Dimension[];
  measures: Measure[];
}):
  | {
      segment: GenericField & ShowValuesSegmentFieldExtension;
      color: ColorField;
    }
  | undefined => {
  const groupedColumns = group(Object.values(fields), (d) => d.isGroup)
    .get(true)
    ?.filter((d) => SEGMENT_ENABLED_COMPONENTS.includes(d.componentType))
    .sort((a, b) => a.index - b.index);
  const component = groupedColumns?.[0];

  if (!component) {
    return;
  }

  const { componentId } = component;
  const actualComponent = [...dimensions, ...measures].find(
    (d) => d.id === componentId
  ) as Component;
  const paletteId = getDefaultCategoricalPaletteId(actualComponent);

  return {
    segment: {
      componentId,
      showValuesMapping: {},
    },
    color: {
      type: "segment",
      paletteId: paletteId,
      colorMapping: mapValueIrisToColor({
        paletteId: paletteId,
        dimensionValues: actualComponent.values,
      }),
    },
  };
};

export const getChartSymbol = (
  chartType: ChartType
): "square" | "line" | "circle" => {
  switch (chartType) {
    case "area":
    case "column":
    case "bar":
    case "comboLineColumn":
    case "pie":
    case "donut":
    case "funnel":
    case "treemap":
    case "sunburst":
    case "heatmap":
    case "map":
    case "table":
    case "boxplot":
    case "waterfall":
    case "sankey":
    case "wordcloud":
    case "bar3d":
    case "pie3d":
    case "surface":
      return "square";
    case "comboLineDual":
    case "comboLineSingle":
    case "line":
    case "radar":
    case "line3d":
      return "line";
    case "scatterplot":
    case "gauge":
    case "polar":
    case "scatter3d":
    case "globe":
      return "circle";
    default:
      const _exhaustiveCheck: never = chartType;
      return _exhaustiveCheck;
  }
};
