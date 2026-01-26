/**
 * PowerBI-Style Aggregation Selector
 *
 * Allows users to select how measure values should be aggregated.
 * Similar to PowerBI's aggregation dropdown in field wells.
 *
 * Note: For RDF/SPARQL data sources, aggregation is typically done at the
 * query level. This component provides the UI for selecting aggregation type,
 * which can be used to configure the SPARQL query.
 */

import { t, Trans } from "@lingui/macro";
import {
  alpha,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";

import { Icon, IconName } from "@/icons";

export type AggregationType = "sum" | "average" | "count" | "min" | "max" | "first" | "last" | "none";

export interface AggregationSelectorProps {
  value: AggregationType;
  onChange: (value: AggregationType) => void;
  fieldType: "measure" | "dimension";
  disabled?: boolean;
}

const AGGREGATION_OPTIONS: { value: AggregationType; label: string; icon: IconName; description: string }[] = [
  {
    value: "sum",
    label: "Sum",
    icon: "sum",
    description: "Total of all values",
  },
  {
    value: "average",
    label: "Average",
    icon: "sum",
    description: "Mean of all values",
  },
  {
    value: "count",
    label: "Count",
    icon: "sum",
    description: "Number of records",
  },
  {
    value: "min",
    label: "Minimum",
    icon: "sum",
    description: "Smallest value",
  },
  {
    value: "max",
    label: "Maximum",
    icon: "sum",
    description: "Largest value",
  },
  {
    value: "first",
    label: "First",
    icon: "sum",
    description: "First value in order",
  },
  {
    value: "last",
    label: "Last",
    icon: "sum",
    description: "Last value in order",
  },
  {
    value: "none",
    label: "Don't summarize",
    icon: "text",
    description: "Show individual values",
  },
];

/**
 * Aggregation type selector for PowerBI-style field wells
 */
export const AggregationSelector = ({
  value,
  onChange,
  fieldType,
  disabled = false,
}: AggregationSelectorProps) => {
  // For dimensions, show limited options
  const options =
    fieldType === "dimension"
      ? AGGREGATION_OPTIONS.filter((opt) => ["count", "first", "last", "none"].includes(opt.value))
      : AGGREGATION_OPTIONS;

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as AggregationType);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel id="aggregation-select-label" sx={{ fontSize: "0.75rem" }}>
          <Trans id="powerbi.aggregation.label">Summarize by</Trans>
        </InputLabel>
        <Select
          labelId="aggregation-select-label"
          value={value}
          label={t({ id: "powerbi.aggregation.label", message: "Summarize by" })}
          onChange={handleChange}
          sx={{
            fontSize: "0.75rem",
            "& .MuiSelect-select": {
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
          }}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ fontSize: "0.75rem" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon name={option.icon} size={14} color="var(--mui-palette-text-secondary)" />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {option.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      fontSize: "0.65rem",
                    }}
                  >
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

/**
 * Compact aggregation badge shown in field pills
 */
export const AggregationBadge = ({
  aggregation,
}: {
  aggregation: AggregationType;
}) => {
  const option = AGGREGATION_OPTIONS.find((opt) => opt.value === aggregation);
  if (!option || aggregation === "none") return null;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: "primary.main",
        fontSize: "0.6rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {option.label.substring(0, 3)}
    </Box>
  );
};

export default AggregationSelector;
