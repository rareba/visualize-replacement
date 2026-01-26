import {
  AnimationField,
  AreaConfig,
  AreaFields,
  AreaSegmentField,
  Bar3dConfig,
  BarConfig,
  BarFields,
  BarSegmentField,
  BoxplotConfig,
  CandlestickConfig,
  ChartConfig,
  ColorField,
  ColumnConfig,
  ColumnFields,
  ColumnSegmentField,
  ComboLineColumnConfig,
  ComboLineColumnFields,
  ComboLineDualConfig,
  ComboLineDualFields,
  ComboLineSingleConfig,
  ComboLineSingleFields,
  DonutConfig,
  GenericChartConfig,
  GlobeConfig,
  HeatmapConfig,
  InteractiveFiltersCalculation,
  InteractiveFiltersConfig,
  InteractiveFiltersDataConfig,
  InteractiveFiltersLegend,
  Line3dConfig,
  LineConfig,
  LineFields,
  LineSegmentField,
  MapConfig,
  MapFields,
  Pie3dConfig,
  PieConfig,
  PieFields,
  PieSegmentField,
  RadarConfig,
  Scatter3dConfig,
  ScatterPlotConfig,
  ScatterPlotFields,
  ScatterPlotSegmentField,
  SurfaceConfig,
  TableConfig,
  TableFields,
  ThemeriverConfig,
  WaterfallConfig,
} from "@/config-types";
import { Dimension, Measure } from "@/domain/data";
import { ComponentId } from "@/graphql/make-component-id";

export type FieldAdjuster<
  NewChartConfigType extends ChartConfig,
  OldValueType extends unknown,
> = (params: {
  oldValue: OldValueType;
  oldChartConfig: ChartConfig;
  newChartConfig: NewChartConfigType;
  dimensions: Dimension[];
  measures: Measure[];
  isAddingNewCube?: boolean;
}) => NewChartConfigType;

type AssureKeys<T, U extends { [K in keyof T]: unknown }> = {
  [K in keyof T]: U[K];
};

export type InteractiveFiltersAdjusters = AssureKeys<
  InteractiveFiltersConfig,
  _InteractiveFiltersAdjusters
>;

type _InteractiveFiltersAdjusters = {
  legend: FieldAdjuster<ChartConfig, InteractiveFiltersLegend>;
  timeRange: {
    active: FieldAdjuster<ChartConfig, boolean>;
    componentId: FieldAdjuster<ChartConfig, ComponentId>;
    presets: {
      type: FieldAdjuster<ChartConfig, "range">;
      from: FieldAdjuster<ChartConfig, string>;
      to: FieldAdjuster<ChartConfig, string>;
    };
  };
  dataFilters: FieldAdjuster<ChartConfig, InteractiveFiltersDataConfig>;
  calculation: FieldAdjuster<ChartConfig, InteractiveFiltersCalculation>;
};

type BaseAdjusters<NewChartConfigType extends ChartConfig> = {
  cubes: FieldAdjuster<NewChartConfigType, GenericChartConfig["cubes"]>;
  annotations: FieldAdjuster<
    NewChartConfigType,
    GenericChartConfig["annotations"]
  >;
  limits: FieldAdjuster<NewChartConfigType, GenericChartConfig["limits"]>;
  conversionUnitsByComponentId: FieldAdjuster<
    NewChartConfigType,
    GenericChartConfig["conversionUnitsByComponentId"]
  >;
  interactiveFiltersConfig: InteractiveFiltersAdjusters;
};

type ColumnAdjusters = BaseAdjusters<ColumnConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<ColumnConfig, ComponentId> };
    y: {
      componentId: FieldAdjuster<ColumnConfig, ComponentId>;
      showValues: FieldAdjuster<ColumnConfig, boolean>;
      customDomain: FieldAdjuster<ColumnConfig, [number, number]>;
    };
    color: FieldAdjuster<ColumnConfig, ColorField>;
    segment: FieldAdjuster<
      ColumnConfig,
      | BarSegmentField
      | LineSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
    animation: FieldAdjuster<ColumnConfig, AnimationField | undefined>;
  };
};

type BarAdjusters = BaseAdjusters<BarConfig> & {
  fields: {
    x: {
      componentId: FieldAdjuster<BarConfig, ComponentId>;
      showValues: FieldAdjuster<BarConfig, boolean>;
      customDomain: FieldAdjuster<BarConfig, [number, number]>;
    };
    y: { componentId: FieldAdjuster<BarConfig, ComponentId> };
    color: FieldAdjuster<BarConfig, ColorField>;
    segment: FieldAdjuster<
      BarConfig,
      | ColumnSegmentField
      | LineSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
    animation: FieldAdjuster<BarConfig, AnimationField | undefined>;
  };
};

type LineAdjusters = BaseAdjusters<LineConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<LineConfig, ComponentId> };
    y: {
      componentId: FieldAdjuster<LineConfig, ComponentId>;
      showValues: FieldAdjuster<LineConfig, boolean>;
      customDomain: FieldAdjuster<LineConfig, [number, number]>;
    };
    color: FieldAdjuster<LineConfig, ColorField>;
    segment: FieldAdjuster<
      LineConfig,
      | ColumnSegmentField
      | BarSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
  };
};

type AreaAdjusters = BaseAdjusters<AreaConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<AreaConfig, ComponentId> };
    y: {
      componentId: FieldAdjuster<AreaConfig, ComponentId>;
      showValues: FieldAdjuster<AreaConfig, boolean>;
      customDomain: FieldAdjuster<AreaConfig, [number, number]>;
    };
    color: FieldAdjuster<AreaConfig, ColorField>;
    segment: FieldAdjuster<
      AreaConfig,
      | ColumnSegmentField
      | BarSegmentField
      | LineSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
  };
};

type ScatterPlotAdjusters = BaseAdjusters<ScatterPlotConfig> & {
  fields: {
    x: {
      componentId: FieldAdjuster<ScatterPlotConfig, ComponentId>;
    };
    y: {
      componentId: FieldAdjuster<ScatterPlotConfig, ComponentId>;
    };
    color: FieldAdjuster<ScatterPlotConfig, ColorField>;
    segment: FieldAdjuster<
      ScatterPlotConfig,
      | ColumnSegmentField
      | BarSegmentField
      | LineSegmentField
      | AreaSegmentField
      | PieSegmentField
      | TableFields
    >;
    animation: FieldAdjuster<ScatterPlotConfig, AnimationField | undefined>;
  };
};

type PieAdjusters = BaseAdjusters<PieConfig> & {
  fields: {
    y: {
      componentId: FieldAdjuster<PieConfig, ComponentId>;
      showValues: FieldAdjuster<PieConfig, boolean>;
    };
    color: FieldAdjuster<PieConfig, ColorField>;
    segment: FieldAdjuster<
      PieConfig,
      | ColumnSegmentField
      | BarSegmentField
      | LineSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | TableFields
    >;
    animation: FieldAdjuster<PieConfig, AnimationField | undefined>;
  };
};

// New chart type adjusters (based on Pie)
type DonutAdjusters = BaseAdjusters<DonutConfig> & {
  fields: {
    y: {
      componentId: FieldAdjuster<DonutConfig, ComponentId>;
      showValues: FieldAdjuster<DonutConfig, boolean>;
    };
    color: FieldAdjuster<DonutConfig, ColorField>;
    segment: FieldAdjuster<
      DonutConfig,
      | ColumnSegmentField
      | BarSegmentField
      | LineSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
    animation: FieldAdjuster<DonutConfig, AnimationField | undefined>;
  };
};

type RadarAdjusters = BaseAdjusters<RadarConfig> & {
  fields: {
    y: {
      componentId: FieldAdjuster<RadarConfig, ComponentId>;
    };
    color: FieldAdjuster<RadarConfig, ColorField>;
    segment: FieldAdjuster<
      RadarConfig,
      | ColumnSegmentField
      | BarSegmentField
      | LineSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
  };
};

type HeatmapAdjusters = BaseAdjusters<HeatmapConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<HeatmapConfig, ComponentId> };
    y: {
      componentId: FieldAdjuster<HeatmapConfig, ComponentId>;
    };
    color: FieldAdjuster<HeatmapConfig, ColorField>;
    segment: FieldAdjuster<
      HeatmapConfig,
      | ColumnSegmentField
      | BarSegmentField
      | LineSegmentField
      | AreaSegmentField
      | ScatterPlotSegmentField
      | PieSegmentField
      | TableFields
    >;
  };
};

// Boxplot uses column-like structure
type BoxplotAdjusters = BaseAdjusters<BoxplotConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<BoxplotConfig, ComponentId> };
    y: { componentId: FieldAdjuster<BoxplotConfig, ComponentId> };
    color: FieldAdjuster<BoxplotConfig, ColorField>;
  };
};

// Waterfall uses column-like structure
type WaterfallAdjusters = BaseAdjusters<WaterfallConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<WaterfallConfig, ComponentId> };
    y: { componentId: FieldAdjuster<WaterfallConfig, ComponentId> };
    color: FieldAdjuster<WaterfallConfig, ColorField>;
  };
};

type TableAdjusters = {
  cubes: FieldAdjuster<TableConfig, GenericChartConfig["cubes"]>;
  fields: FieldAdjuster<
    TableConfig,
    | ColumnSegmentField
    | BarSegmentField
    | LineSegmentField
    | AreaSegmentField
    | ScatterPlotSegmentField
    | PieSegmentField
  >;
};

type MapAdjusters = BaseAdjusters<MapConfig> & {
  fields: {
    areaLayer: {
      componentId: FieldAdjuster<MapConfig, ComponentId>;
      color: {
        componentId: FieldAdjuster<MapConfig, ComponentId>;
      };
    };
    animation: FieldAdjuster<MapConfig, AnimationField | undefined>;
  };
};

type ComboLineSingleAdjusters = BaseAdjusters<ComboLineSingleConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<ComboLineSingleConfig, ComponentId> };
    y: {
      componentIds: FieldAdjuster<ComboLineSingleConfig, ComponentId>;
    };
  };
};

type ComboLineDualAdjusters = BaseAdjusters<ComboLineDualConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<ComboLineDualConfig, ComponentId> };
    y: FieldAdjuster<
      ComboLineDualConfig,
      | AreaFields
      | ColumnFields
      | BarFields
      | LineFields
      | MapFields
      | PieFields
      | ScatterPlotFields
      | TableFields
      | ComboLineSingleFields
      | ComboLineColumnFields
    >;
  };
};

type ComboLineColumnAdjusters = BaseAdjusters<ComboLineColumnConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<ComboLineColumnConfig, ComponentId> };
    y: FieldAdjuster<
      ComboLineColumnConfig,
      | AreaFields
      | ColumnFields
      | BarFields
      | LineFields
      | MapFields
      | PieFields
      | ScatterPlotFields
      | TableFields
      | ComboLineSingleFields
      | ComboLineDualFields
    >;
  };
};

// ============================================================================
// 3D and Specialized Chart Adjusters
// ============================================================================

type CandlestickAdjusters = BaseAdjusters<CandlestickConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<CandlestickConfig, ComponentId> };
    y: { componentId: FieldAdjuster<CandlestickConfig, ComponentId> };
    color: FieldAdjuster<CandlestickConfig, ColorField>;
  };
};

type ThemeriverAdjusters = BaseAdjusters<ThemeriverConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<ThemeriverConfig, ComponentId> };
    y: { componentId: FieldAdjuster<ThemeriverConfig, ComponentId> };
    segment: { componentId: FieldAdjuster<ThemeriverConfig, ComponentId> };
    color: FieldAdjuster<ThemeriverConfig, ColorField>;
  };
};

// 3D chart adjusters use permissive types due to additional fields (z, geo)
// that may exist at runtime but aren't fully typed in config-types
type Bar3dAdjusters = BaseAdjusters<Bar3dConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<Bar3dConfig, ComponentId> };
    y: { componentId: FieldAdjuster<Bar3dConfig, ComponentId> };
    z?: { componentId: FieldAdjuster<Bar3dConfig, ComponentId> };
    color: FieldAdjuster<Bar3dConfig, ColorField>;
  };
};

type Scatter3dAdjusters = BaseAdjusters<Scatter3dConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<Scatter3dConfig, ComponentId> };
    y: { componentId: FieldAdjuster<Scatter3dConfig, ComponentId> };
    z?: { componentId: FieldAdjuster<Scatter3dConfig, ComponentId> };
    color: FieldAdjuster<Scatter3dConfig, ColorField>;
  };
};

type SurfaceAdjusters = BaseAdjusters<SurfaceConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<SurfaceConfig, ComponentId> };
    y: { componentId: FieldAdjuster<SurfaceConfig, ComponentId> };
    z?: { componentId: FieldAdjuster<SurfaceConfig, ComponentId> };
    color: FieldAdjuster<SurfaceConfig, ColorField>;
  };
};

type Line3dAdjusters = BaseAdjusters<Line3dConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<Line3dConfig, ComponentId> };
    y: { componentId: FieldAdjuster<Line3dConfig, ComponentId> };
    z?: { componentId: FieldAdjuster<Line3dConfig, ComponentId> };
    color: FieldAdjuster<Line3dConfig, ColorField>;
  };
};

type GlobeAdjusters = BaseAdjusters<GlobeConfig> & {
  fields: {
    x: { componentId: FieldAdjuster<GlobeConfig, ComponentId> };
    y: { componentId: FieldAdjuster<GlobeConfig, ComponentId> };
    geo?: { componentId: FieldAdjuster<GlobeConfig, ComponentId> };
    color: FieldAdjuster<GlobeConfig, ColorField>;
  };
};

type Pie3dAdjusters = BaseAdjusters<Pie3dConfig> & {
  fields: {
    y: { componentId: FieldAdjuster<Pie3dConfig, ComponentId> };
    color: FieldAdjuster<Pie3dConfig, ColorField>;
  };
};

export type ChartConfigsAdjusters = {
  column: ColumnAdjusters;
  bar: BarAdjusters;
  line: LineAdjusters;
  area: AreaAdjusters;
  scatterplot: ScatterPlotAdjusters;
  pie: PieAdjusters;
  donut: DonutAdjusters;
  table: TableAdjusters;
  map: MapAdjusters;
  radar: RadarAdjusters;
  heatmap: HeatmapAdjusters;
  boxplot: BoxplotAdjusters;
  waterfall: WaterfallAdjusters;
  comboLineSingle: ComboLineSingleAdjusters;
  comboLineDual: ComboLineDualAdjusters;
  comboLineColumn: ComboLineColumnAdjusters;
  // 3D and specialized chart types
  candlestick: CandlestickAdjusters;
  themeriver: ThemeriverAdjusters;
  bar3d: Bar3dAdjusters;
  scatter3d: Scatter3dAdjusters;
  surface: SurfaceAdjusters;
  line3d: Line3dAdjusters;
  globe: GlobeAdjusters;
  pie3d: Pie3dAdjusters;
};
