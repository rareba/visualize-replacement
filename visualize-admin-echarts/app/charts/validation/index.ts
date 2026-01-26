/**
 * Chart Validation Utilities
 *
 * Utilities for determining which chart types are available
 * based on data dimensions and measures.
 */

import { t } from "@lingui/macro";
import { rollup } from "d3-array";

import {
  chartTypes,
  comboChartTypes,
  comboDifferentUnitChartTypes,
  comboSameUnitChartTypes,
  getChartTypeOrder,
} from "@/charts/registry";
import type { ChartType, RegularChartType } from "@/config-types";
import {
  Dimension,
  Measure,
  isNumericalMeasure,
  isOrdinalMeasure,
  getCategoricalDimensions,
  getGeoDimensions,
  isTemporalDimension,
  isTemporalEntityDimension,
} from "@/domain/data";

// Charts that require at least one categorical dimension + numerical measure
const categoricalEnabledChartTypes: RegularChartType[] = [
  "column",
  "bar",
  "pie",
  "donut",
  "radar",
  "boxplot",
  "waterfall",
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

/**
 * Determines which chart types are available based on the data structure.
 *
 * @param dimensions - Available dimensions from the dataset
 * @param measures - Available measures from the dataset
 * @param cubeCount - Number of cubes being used
 * @returns Object with enabled chart types and detailed availability info
 */
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
