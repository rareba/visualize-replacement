import { Trans } from "@lingui/macro";
import { Typography } from "@mui/material";

import {
  EncodingFieldType,
  EncodingOptionChartSubType,
  EncodingSpec,
} from "@/charts/chart-config-ui-options";
import { LegendSymbol } from "@/charts/shared/legend-color";
import { Flex } from "@/components/flex";
import { RadioGroup } from "@/components/form";
import {
  ChartConfig,
  isBarConfig,
  isColorInConfig,
  RegularChartConfig,
} from "@/config-types";
import { ColorPalette } from "@/configurator/components/chart-controls/color-palette";
import {
  ControlSection,
  ControlSectionContent,
  SectionTitle,
} from "@/configurator/components/chart-controls/section";
import {
  ChartOptionRadioField,
  ColorPickerField,
} from "@/configurator/components/field";
import { getFieldLabel } from "@/configurator/components/field-i18n";
import { Component, Measure } from "@/domain/data";

export const LayoutField = ({
  encoding,
  component,
  chartConfig,
  components,
  hasColorPalette,
  hasSubType,
  measures,
}: {
  encoding: EncodingSpec;
  component: Component | undefined;
  chartConfig: RegularChartConfig;
  components: Component[];
  hasColorPalette: boolean;
  hasSubType: boolean;
  measures: Measure[];
}) => {
  const activeField = chartConfig.activeField as EncodingFieldType | undefined;

  if (!activeField) {
    return null;
  }

  const hasColorField = isColorInConfig(chartConfig);
  const colorField = hasColorField ? chartConfig.fields.color : undefined;

  // Get the component ID for single color charts - handle different field structures
  const getSingleColorId = (): string => {
    if (isBarConfig(chartConfig)) {
      return chartConfig.fields.x.componentId;
    }
    // Check if y field exists (most charts have it except sankey, wordcloud, etc.)
    if ("y" in chartConfig.fields && chartConfig.fields.y) {
      return (chartConfig.fields as { y: { componentId: string } }).y.componentId;
    }
    // For sankey charts, use the value field
    if ("value" in chartConfig.fields && chartConfig.fields.value) {
      return (chartConfig.fields as { value: { componentId: string } }).value.componentId;
    }
    // For polar charts, use the radius field
    if ("radius" in chartConfig.fields && chartConfig.fields.radius) {
      return (chartConfig.fields as { radius: { componentId: string } }).radius.componentId;
    }
    // Fallback to first available field
    return "";
  };

  const values: { id: string; symbol: LegendSymbol }[] = hasColorField
    ? colorField?.type === "single"
      ? [
          {
            id: getSingleColorId(),
            symbol: "line",
          },
        ]
      : "colorMapping" in (colorField ?? {})
        ? Object.keys((colorField as { colorMapping: Record<string, string> }).colorMapping).map((key) => ({
            id: key,
            symbol: "line",
          }))
        : []
    : [];

  return encoding.options || hasColorPalette ? (
    <ControlSection collapse>
      <SectionTitle iconName="swatch">
        <Trans id="controls.section.layout-options">Layout Options</Trans>
      </SectionTitle>
      <ControlSectionContent gap="lg">
        {hasSubType && (
          <ChartSubType
            encoding={encoding}
            chartConfig={chartConfig}
            components={components}
            disabled={!component}
          />
        )}
        <ColorPalette
          field={activeField}
          // Faking a component here, because we don't have a real one.
          // We use measure iris as dimension values, because that's how
          // the color mapping is done.
          component={
            {
              __typename: "",
              values: values.map(({ id }) => ({
                value: id,
                label: id,
              })),
            } as any as Component
          }
        />
        {hasColorField && chartConfig.fields.color.type === "single" && (
          <ColorPickerField
            field="color"
            path="color"
            label={measures.find((d) => d.id === values[0].id)!.label}
          />
        )}
      </ControlSectionContent>
    </ControlSection>
  ) : null;
};

const ChartSubType = ({
  encoding,
  chartConfig,
  components,
  disabled,
}: {
  encoding: EncodingSpec;
  chartConfig: ChartConfig;
  components: Component[];
  disabled?: boolean;
}) => {
  const chartSubType = encoding.options
    ?.chartSubType as EncodingOptionChartSubType;
  const values = chartSubType.getValues(chartConfig, components);

  return (
    <Flex flexDirection="column" sx={{ gap: 1 }}>
      <Typography variant="caption">
        <Trans id="controls.select.column.layout">Column layout</Trans>
      </Typography>
      <RadioGroup>
        {values.map((d) => (
          <ChartOptionRadioField
            key={d.value}
            label={getFieldLabel(d.value)}
            field={encoding.field}
            path="type"
            value={d.value}
            disabled={disabled || d.disabled}
            warnMessage={d.warnMessage}
          />
        ))}
      </RadioGroup>
    </Flex>
  );
};
