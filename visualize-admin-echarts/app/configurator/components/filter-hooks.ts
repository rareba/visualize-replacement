/**
 * Filter Hooks
 *
 * Custom React hooks for filter-related state management.
 */

import { useEffect, useMemo } from "react";

import { ColorMapping, isColorInConfig } from "@/config-types";
import { getChartConfig } from "@/config-utils";
import {
  isConfiguring,
  useConfiguratorState,
  useMultiFilterContext,
} from "@/configurator";
import { DimensionValue } from "@/domain/data";

// ============================================================================
// useEnsureUpToDateColorMapping
// ============================================================================

/**
 * Fixes situations where an old chart is being edited and the cube has changed
 * and contains new values in the color dimension.
 */
export const useEnsureUpToDateColorMapping = ({
  colorComponentValues,
  colorMapping,
}: {
  colorComponentValues?: DimensionValue[];
  colorMapping?: ColorMapping;
}): void => {
  const [state, dispatch] = useConfiguratorState(isConfiguring);
  const chartConfig = getChartConfig(state);
  const { dimensionId, colorConfigPath } = useMultiFilterContext();
  const { activeField } = chartConfig;

  const hasOutdatedMapping = useMemo(() => {
    return colorMapping && colorComponentValues
      ? colorComponentValues.some((value) => !colorMapping[value.value])
      : false;
  }, [colorComponentValues, colorMapping]);

  const field = isColorInConfig(chartConfig) ? "color" : activeField;

  useEffect(() => {
    if (hasOutdatedMapping && colorMapping && colorComponentValues && field) {
      dispatch({
        type: "CHART_CONFIG_UPDATE_COLOR_MAPPING",
        value: {
          dimensionId,
          colorConfigPath,
          colorMapping,
          field,
          values: colorComponentValues,
          random: false,
        },
      });
    }
  }, [
    field,
    chartConfig,
    hasOutdatedMapping,
    dispatch,
    dimensionId,
    colorConfigPath,
    colorMapping,
    colorComponentValues,
  ]);
};
