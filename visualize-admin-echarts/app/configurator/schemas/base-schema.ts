/**
 * Base JSON Schema definitions for chart configurations
 *
 * These schemas are used with @rjsf/mui to auto-generate the chart configurator UI.
 * They map to the io-ts types in config-types.ts
 */

import type { RJSFSchema, UiSchema } from "@rjsf/utils";

// ============================================================================
// Shared Field Schemas
// ============================================================================

/**
 * Generic field - base for all field types
 * Maps to GenericField in config-types.ts
 */
export const genericFieldSchema: RJSFSchema = {
  type: "object",
  properties: {
    componentId: {
      type: "string",
      title: "Data Field",
      description: "Select the data field to use",
    },
    useAbbreviations: {
      type: "boolean",
      title: "Use Abbreviations",
      description: "Use abbreviated labels where available",
      default: false,
    },
  },
  required: ["componentId"],
};

/**
 * Color field - single color or segment-based
 */
export const colorFieldSchema: RJSFSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      title: "Color Type",
      oneOf: [
        { const: "single", title: "Single Color" },
        { const: "segment", title: "By Segment" },
      ],
      default: "single",
    },
    paletteId: {
      type: "string",
      title: "Color Palette",
      default: "category10",
    },
    color: {
      type: "string",
      title: "Color",
      description: "Single color value (when type is 'single')",
    },
    colorMapping: {
      type: "object",
      title: "Color Mapping",
      description: "Map segment values to colors (when type is 'segment')",
      additionalProperties: { type: "string" },
    },
  },
  required: ["type", "paletteId"],
};

/**
 * Sorting field extension
 */
export const sortingFieldSchema: RJSFSchema = {
  type: "object",
  properties: {
    sorting: {
      type: "object",
      title: "Sorting",
      properties: {
        sortingType: {
          type: "string",
          title: "Sort By",
          oneOf: [
            { const: "byDimensionLabel", title: "Label" },
            { const: "byMeasure", title: "Measure Value" },
            { const: "byTotalSize", title: "Total Size" },
            { const: "byAuto", title: "Auto" },
          ],
          default: "byAuto",
        },
        sortingOrder: {
          type: "string",
          title: "Order",
          oneOf: [
            { const: "asc", title: "Ascending" },
            { const: "desc", title: "Descending" },
          ],
          default: "asc",
        },
      },
    },
  },
};

/**
 * Show values extension
 */
export const showValuesFieldSchema: RJSFSchema = {
  type: "object",
  properties: {
    showValues: {
      type: "boolean",
      title: "Show Values",
      description: "Display data values on the chart",
      default: false,
    },
    valuesRotation: {
      type: "number",
      title: "Value Rotation",
      description: "Rotation angle for value labels (degrees)",
      minimum: -90,
      maximum: 90,
      default: 0,
    },
  },
};

/**
 * Custom scale domain extension
 */
export const customScaleDomainSchema: RJSFSchema = {
  type: "object",
  properties: {
    customScaleDomain: {
      type: "object",
      title: "Custom Scale",
      properties: {
        min: {
          type: "number",
          title: "Minimum",
        },
        max: {
          type: "number",
          title: "Maximum",
        },
      },
    },
  },
};

// ============================================================================
// Chart Type Schemas
// ============================================================================

/**
 * Column chart fields schema
 */
export const columnFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Column Chart Fields",
  properties: {
    x: {
      type: "object",
      title: "X-Axis (Categories)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Y-Axis (Values)",
      properties: {
        ...genericFieldSchema.properties,
        ...showValuesFieldSchema.properties,
        ...customScaleDomainSchema.properties,
      },
      required: ["componentId"],
    },
    segment: {
      type: "object",
      title: "Segment (Grouping)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
        type: {
          type: "string",
          title: "Chart Subtype",
          oneOf: [
            { const: "grouped", title: "Grouped" },
            { const: "stacked", title: "Stacked" },
          ],
          default: "grouped",
        },
        showTitle: {
          type: "boolean",
          title: "Show Segment Title",
          default: true,
        },
      },
    },
    color: colorFieldSchema,
  },
  required: ["x", "y", "color"],
};

/**
 * Bar chart fields schema (horizontal bars)
 */
export const barFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Bar Chart Fields",
  properties: {
    x: {
      type: "object",
      title: "X-Axis (Values)",
      properties: {
        ...genericFieldSchema.properties,
        ...showValuesFieldSchema.properties,
        ...customScaleDomainSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Y-Axis (Categories)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
      required: ["componentId"],
    },
    segment: {
      type: "object",
      title: "Segment (Grouping)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
        type: {
          type: "string",
          title: "Chart Subtype",
          oneOf: [
            { const: "grouped", title: "Grouped" },
            { const: "stacked", title: "Stacked" },
          ],
          default: "grouped",
        },
      },
    },
    color: colorFieldSchema,
  },
  required: ["x", "y", "color"],
};

/**
 * Line chart fields schema
 */
export const lineFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Line Chart Fields",
  properties: {
    x: {
      type: "object",
      title: "X-Axis (Time/Categories)",
      properties: {
        ...genericFieldSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Y-Axis (Values)",
      properties: {
        ...genericFieldSchema.properties,
        ...showValuesFieldSchema.properties,
        ...customScaleDomainSchema.properties,
        showDots: {
          type: "boolean",
          title: "Show Data Points",
          default: false,
        },
        showDotsSize: {
          type: "string",
          title: "Data Point Size",
          oneOf: [
            { const: "Small", title: "Small" },
            { const: "Medium", title: "Medium" },
            { const: "Large", title: "Large" },
          ],
          default: "Medium",
        },
      },
      required: ["componentId"],
    },
    segment: {
      type: "object",
      title: "Segment (Multiple Lines)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
    },
    color: colorFieldSchema,
  },
  required: ["x", "y", "color"],
};

/**
 * Pie/Donut chart fields schema
 */
export const pieFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Pie Chart Fields",
  properties: {
    y: {
      type: "object",
      title: "Values",
      properties: {
        ...genericFieldSchema.properties,
        ...showValuesFieldSchema.properties,
      },
      required: ["componentId"],
    },
    segment: {
      type: "object",
      title: "Segments (Slices)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
      required: ["componentId"],
    },
    color: colorFieldSchema,
  },
  required: ["y", "segment", "color"],
};

/**
 * Scatter plot fields schema
 */
export const scatterplotFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Scatter Plot Fields",
  properties: {
    x: {
      type: "object",
      title: "X-Axis",
      properties: {
        ...genericFieldSchema.properties,
        ...customScaleDomainSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Y-Axis",
      properties: {
        ...genericFieldSchema.properties,
        ...customScaleDomainSchema.properties,
      },
      required: ["componentId"],
    },
    segment: {
      type: "object",
      title: "Color Grouping",
      properties: {
        ...genericFieldSchema.properties,
      },
    },
    size: {
      type: "object",
      title: "Size (Bubble)",
      properties: {
        ...genericFieldSchema.properties,
      },
    },
    color: colorFieldSchema,
  },
  required: ["x", "y", "color"],
};

/**
 * Radar chart fields schema
 */
export const radarFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Radar Chart Fields",
  properties: {
    y: {
      type: "object",
      title: "Values (Measures)",
      description: "Select the measure to display on radar axes",
      properties: {
        ...genericFieldSchema.properties,
      },
      required: ["componentId"],
    },
    segment: {
      type: "object",
      title: "Dimensions (Axes)",
      description: "Each dimension value becomes a radar axis",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
      required: ["componentId"],
    },
    color: colorFieldSchema,
  },
  required: ["y", "segment", "color"],
};

/**
 * Heatmap chart fields schema
 */
export const heatmapFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Heatmap Fields",
  properties: {
    x: {
      type: "object",
      title: "X-Axis (Columns)",
      properties: {
        ...genericFieldSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Y-Axis (Rows)",
      properties: {
        ...genericFieldSchema.properties,
      },
      required: ["componentId"],
    },
    color: {
      type: "object",
      title: "Color (Values)",
      description: "The measure that determines cell color intensity",
      properties: {
        ...genericFieldSchema.properties,
        colorScale: {
          type: "string",
          title: "Color Scale",
          oneOf: [
            { const: "sequential", title: "Sequential" },
            { const: "diverging", title: "Diverging" },
          ],
          default: "sequential",
        },
      },
      required: ["componentId"],
    },
  },
  required: ["x", "y", "color"],
};

/**
 * Boxplot fields schema
 */
export const boxplotFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Box Plot Fields",
  properties: {
    x: {
      type: "object",
      title: "Categories",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Values",
      description: "Measure for box plot distribution",
      properties: {
        ...genericFieldSchema.properties,
        ...customScaleDomainSchema.properties,
      },
      required: ["componentId"],
    },
    color: colorFieldSchema,
  },
  required: ["x", "y", "color"],
};

/**
 * Waterfall chart fields schema
 */
export const waterfallFieldsSchema: RJSFSchema = {
  type: "object",
  title: "Waterfall Chart Fields",
  properties: {
    x: {
      type: "object",
      title: "Categories (Steps)",
      properties: {
        ...genericFieldSchema.properties,
        ...sortingFieldSchema.properties,
      },
      required: ["componentId"],
    },
    y: {
      type: "object",
      title: "Values (Changes)",
      properties: {
        ...genericFieldSchema.properties,
        ...showValuesFieldSchema.properties,
        ...customScaleDomainSchema.properties,
      },
      required: ["componentId"],
    },
    color: colorFieldSchema,
  },
  required: ["x", "y", "color"],
};

// ============================================================================
// UI Schemas
// ============================================================================

/**
 * UI Schema for field selectors
 * Tells RJSF to render componentId as a dropdown
 */
export const fieldUiSchema: UiSchema = {
  componentId: {
    "ui:widget": "select",
    "ui:placeholder": "Select a field...",
  },
  useAbbreviations: {
    "ui:widget": "checkbox",
  },
};

/**
 * UI Schema for color fields
 */
export const colorUiSchema: UiSchema = {
  type: {
    "ui:widget": "radio",
  },
  color: {
    "ui:widget": "color",
  },
  colorMapping: {
    "ui:widget": "hidden",
  },
};

/**
 * UI Schema for column chart
 */
export const columnUiSchema: UiSchema = {
  x: {
    ...fieldUiSchema,
    sorting: {
      "ui:options": {
        label: false,
      },
    },
  },
  y: {
    ...fieldUiSchema,
    showValues: {
      "ui:widget": "checkbox",
    },
    valuesRotation: {
      "ui:widget": "range",
    },
  },
  segment: {
    ...fieldUiSchema,
    type: {
      "ui:widget": "radio",
    },
  },
  color: colorUiSchema,
};

/**
 * UI Schema for line chart
 */
export const lineUiSchema: UiSchema = {
  x: fieldUiSchema,
  y: {
    ...fieldUiSchema,
    showDots: {
      "ui:widget": "checkbox",
    },
    showDotsSize: {
      "ui:widget": "select",
    },
  },
  segment: fieldUiSchema,
  color: colorUiSchema,
};

/**
 * UI Schema for pie chart
 */
export const pieUiSchema: UiSchema = {
  y: {
    ...fieldUiSchema,
    showValues: {
      "ui:widget": "checkbox",
    },
  },
  segment: fieldUiSchema,
  color: colorUiSchema,
};

// ============================================================================
// Schema Registry
// ============================================================================

export type ChartType =
  | "column"
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatterplot"
  | "radar"
  | "heatmap"
  | "boxplot"
  | "waterfall"
  | "bar3d"
  | "scatter3d"
  | "surface"
  | "line3d"
  | "globe"
  | "pie3d";

export interface ChartSchemaConfig {
  schema: RJSFSchema;
  uiSchema: UiSchema;
}

/**
 * Registry mapping chart types to their schemas
 */
export const chartSchemaRegistry: Record<ChartType, ChartSchemaConfig> = {
  // Axis-based charts
  column: { schema: columnFieldsSchema, uiSchema: columnUiSchema },
  bar: { schema: barFieldsSchema, uiSchema: columnUiSchema },
  line: { schema: lineFieldsSchema, uiSchema: lineUiSchema },
  area: { schema: lineFieldsSchema, uiSchema: lineUiSchema },
  scatterplot: { schema: scatterplotFieldsSchema, uiSchema: columnUiSchema },
  boxplot: { schema: boxplotFieldsSchema, uiSchema: columnUiSchema },
  waterfall: { schema: waterfallFieldsSchema, uiSchema: columnUiSchema },
  heatmap: { schema: heatmapFieldsSchema, uiSchema: columnUiSchema },

  // Pie-family charts (no axes)
  pie: { schema: pieFieldsSchema, uiSchema: pieUiSchema },
  donut: { schema: pieFieldsSchema, uiSchema: pieUiSchema },

  // Specialized charts (no axes)
  radar: { schema: radarFieldsSchema, uiSchema: pieUiSchema },

  // 3D charts
  bar3d: { schema: columnFieldsSchema, uiSchema: columnUiSchema },
  scatter3d: { schema: scatterplotFieldsSchema, uiSchema: columnUiSchema },
  surface: { schema: scatterplotFieldsSchema, uiSchema: columnUiSchema },
  line3d: { schema: lineFieldsSchema, uiSchema: lineUiSchema },
  globe: { schema: pieFieldsSchema, uiSchema: pieUiSchema },
  pie3d: { schema: pieFieldsSchema, uiSchema: pieUiSchema },
};

/**
 * Get schema configuration for a chart type
 */
export const getChartSchema = (chartType: ChartType): ChartSchemaConfig => {
  return chartSchemaRegistry[chartType] || chartSchemaRegistry.column;
};
