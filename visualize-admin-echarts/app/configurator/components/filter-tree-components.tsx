/**
 * Filter Tree Components
 *
 * Tree-based UI components for displaying hierarchical filter options.
 */

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  Theme,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import { ReactNode, useMemo, useState } from "react";

import { useMultiFilterContext } from "@/configurator";
import {
  areChildrenSelected,
  isHierarchyOptionSelectable,
  validateChildren,
} from "@/configurator/components/filter-utils";
import { HierarchyValue } from "@/domain/data";
import { Icon } from "@/icons";

// ============================================================================
// Styles
// ============================================================================

const useTreeStyles = makeStyles((theme: Theme) => ({
  optionLabel: {
    flexGrow: 1,
  },
  optionColor: {
    flexShrink: 0,
    marginRight: theme.spacing(2),
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: `1px solid ${theme.palette.monochrome[600]}`,
  },
  optionCheck: {
    flexShrink: 0,
    width: 16,
    height: 16,
    marginLeft: theme.spacing(2),
  },
}));

// ============================================================================
// Styled Accordion Components
// ============================================================================

export const StyledAccordion = styled(Accordion)({
  boxShadow: "none",
  minHeight: 0,

  "&:before": {
    display: "none",
  },

  "&.Mui-expanded": {
    minHeight: 0,
  },
});

export const TreeAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  minHeight: 0,
  transition: "background-color 0.1s ease",
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(4),

  "&.Mui-expanded": {
    minHeight: 0,
  },

  "& > .MuiAccordionSummary-content": {
    display: "flex",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
    padding: `${theme.spacing(2)} 0`,
    color: theme.palette.monochrome[600],
  },

  "&:hover": {
    backgroundColor: theme.palette.cobalt[50],

    "& > .MuiAccordionSummary-content": {
      color: theme.palette.monochrome[800],
    },
  },
}));

export const TreeAccordionDetails = styled(AccordionDetails)(() => ({
  padding: 0,
}));

// ============================================================================
// TreeAccordion Component
// ============================================================================

export type TreeNodeState = "SELECTED" | "CHILDREN_SELECTED" | "NOT_SELECTED";

export const TreeAccordion = ({
  flat,
  depth,
  value,
  label,
  state,
  selectable,
  expandable,
  renderExpandButton,
  renderColorCheckbox,
  onSelect,
  children,
}: {
  flat?: boolean;
  depth: number;
  value: string;
  label: string;
  state: TreeNodeState;
  selectable: boolean;
  expandable: boolean;
  renderExpandButton: boolean;
  renderColorCheckbox: boolean;
  onSelect: () => void;
  children?: ReactNode;
}) => {
  const classes = useTreeStyles();
  const { getValueColor } = useMultiFilterContext();
  const [expanded, setExpanded] = useState(() => depth === 0);

  return (
    <StyledAccordion
      expanded={expanded}
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <TreeAccordionSummary
        expandIcon={null}
        onClick={(e) => {
          e.stopPropagation();

          if (selectable) {
            onSelect();
          }
        }}
        sx={{ pl: flat ? 4 : `${(depth + 1) * 8}px` }}
      >
        {renderExpandButton && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{
              alignSelf: "flex-start",
              visibility: expandable ? "visible" : "hidden",
              ml: 2,
              mr: 1,
              p: 1,

              "&:hover": {
                backgroundColor: "cobalt.100", // default hover color is the same
                // as the parent hover color
              },
            }}
          >
            <Icon
              name="chevronRight"
              size={16}
              style={{
                transition: "transform 0.2s ease",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </IconButton>
        )}
        {renderColorCheckbox && (
          <div
            className={classes.optionColor}
            style={{
              visibility: selectable ? "visible" : "hidden",
              backgroundColor:
                state === "SELECTED" ? getValueColor(value) : "transparent",
            }}
          />
        )}
        <Typography variant="body3" className={classes.optionLabel}>
          {label}
        </Typography>
        <Icon
          name={
            state === "SELECTED"
              ? "checkmark"
              : state === "CHILDREN_SELECTED"
                ? "indeterminate"
                : "show"
          }
          className={classes.optionCheck}
          style={{
            visibility: state === "NOT_SELECTED" ? "hidden" : "visible",
          }}
        />
      </TreeAccordionSummary>
      {children && <TreeAccordionDetails>{children}</TreeAccordionDetails>}
    </StyledAccordion>
  );
};

// ============================================================================
// Tree Component
// ============================================================================

export type DepthsMetadata = Record<
  number,
  { selectable: boolean; expandable: boolean }
>;

export const Tree = ({
  flat,
  depthsMetadata,
  options,
  selectedValues,
  selectedValuesSet: externalSet,
  showColors,
  onSelect,
}: {
  flat: boolean;
  depthsMetadata: DepthsMetadata;
  options: HierarchyValue[];
  selectedValues: HierarchyValue[];
  /** Pre-computed Set for O(1) lookups. Created internally if not provided. */
  selectedValuesSet?: Set<string>;
  showColors: boolean;
  onSelect: (newSelectedValues: HierarchyValue[]) => void;
}) => {
  // Create Set once for O(1) lookups instead of O(n) array searches
  const selectedValuesSet = useMemo(
    () => externalSet ?? new Set(selectedValues.map((d) => d.value)),
    [externalSet, selectedValues]
  );

  return (
    <>
      {options.map((d) => {
        const { depth, value, label, children } = d;
        const currentDepthsMetadata = depthsMetadata[depth];
        const hasChildren = validateChildren(children);
        // O(1) Set lookup instead of O(n) array map + includes
        const state: TreeNodeState = selectedValuesSet.has(value)
          ? "SELECTED"
          : areChildrenSelected({ children, selectedValuesSet })
            ? "CHILDREN_SELECTED"
            : "NOT_SELECTED";

        return (
          <TreeAccordion
            key={value}
            flat={flat}
            depth={depth}
            value={value}
            label={label}
            state={state}
            // Has value is only present for hierarchies.
            selectable={isHierarchyOptionSelectable(d)}
            expandable={hasChildren}
            renderExpandButton={currentDepthsMetadata.expandable || depth > 0}
            renderColorCheckbox={
              showColors && (currentDepthsMetadata.selectable || d.depth === -1)
            }
            onSelect={() => {
              if (state === "SELECTED") {
                onSelect(selectedValues.filter((d) => d.value !== value));
              } else {
                onSelect([...selectedValues, d]);
              }
            }}
          >
            {hasChildren ? (
              <Tree
                flat={flat}
                depthsMetadata={depthsMetadata}
                options={children as HierarchyValue[]}
                selectedValues={selectedValues}
                selectedValuesSet={selectedValuesSet}
                showColors={showColors}
                onSelect={onSelect}
              />
            ) : null}
          </TreeAccordion>
        );
      })}
    </>
  );
};
