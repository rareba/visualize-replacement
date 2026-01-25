/**
 * Filter Drawer Component
 *
 * Drawer content for editing filter selections with search and tree display.
 */

import { t, Trans } from "@lingui/macro";
import {
  Box,
  Button,
  IconButton,
  Input,
  InputAdornment,
  Theme,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import uniqBy from "lodash/uniqBy";
import { forwardRef, MutableRefObject, useMemo, useState } from "react";

import { Flex } from "@/components/flex";
import {
  computeDepthsMetadata,
  isHierarchyOptionSelectable,
} from "@/configurator/components/filter-utils";
import { Tree } from "@/configurator/components/filter-tree-components";
import { HierarchyValue } from "@/domain/data";
import { Icon } from "@/icons";
import SvgIcClose from "@/icons/components/IcClose";
import { pruneTree } from "@/rdf/tree-utils";

// ============================================================================
// Styles
// ============================================================================

const useDrawerStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    flexShrink: 0,
    padding: theme.spacing(4),
    paddingBottom: 0,
  },
  textInput: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  autocompleteApplyButtonContainer: {
    padding: theme.spacing(4),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  autocompleteApplyButton: {
    width: "100%",
  },
}));

// ============================================================================
// FilterControls Component
// ============================================================================

export const FilterControls = ({
  selectAll,
  selectNone,
  allKeysLength,
  activeKeysLength,
}: {
  selectAll: () => void;
  selectNone: () => void;
  allKeysLength: number;
  activeKeysLength: number;
}) => {
  return (
    <Flex
      sx={{ justifyContent: "space-between", alignItems: "center", mt: 2 }}
    >
      <Flex sx={{ gap: 2 }}>
        <Button
          variant="text"
          size="xs"
          onClick={selectAll}
          disabled={activeKeysLength === allKeysLength}
        >
          <Trans id="controls.filter.select.all">Select all</Trans>
        </Button>
        <Typography variant="body3" color="text.secondary">
          |
        </Typography>
        <Button
          variant="text"
          size="xs"
          onClick={selectNone}
          disabled={activeKeysLength === 0}
        >
          <Trans id="controls.filter.select.none">Select none</Trans>
        </Button>
      </Flex>
      <Typography variant="caption" color="text.secondary">
        {activeKeysLength} / {allKeysLength}
      </Typography>
    </Flex>
  );
};

// ============================================================================
// DrawerContent Component
// ============================================================================

export const DrawerContent = forwardRef<
  HTMLDivElement,
  {
    onClose: () => void;
    options: HierarchyValue[];
    flatOptions: HierarchyValue[];
    values: HierarchyValue[];
    pendingValuesRef: MutableRefObject<HierarchyValue[]>;
    hasColorMapping: boolean;
  }
>(
  (
    {
      onClose,
      options,
      flatOptions,
      values,
      pendingValuesRef,
      hasColorMapping,
    },
    ref
  ) => {
    const classes = useDrawerStyles();
    const [textInput, setTextInput] = useState("");
    const [pendingValues, setPendingValues] = useState<HierarchyValue[]>(() =>
      // Do not set unselectable options
      values.filter(isHierarchyOptionSelectable)
    );
    pendingValuesRef.current = pendingValues;

    const { depthsMetadata, uniqueSelectableFlatOptions } = useMemo(() => {
      const uniqueSelectableFlatOptions = uniqBy(
        flatOptions.filter(isHierarchyOptionSelectable),
        (d) => d.value
      );

      const depthsMetadata = computeDepthsMetadata(flatOptions);

      return { depthsMetadata, uniqueSelectableFlatOptions };
    }, [flatOptions]);

    const filteredOptions = useMemo(() => {
      return pruneTree(options, (d) =>
        d.label.toLowerCase().includes(textInput.toLowerCase())
      );
    }, [textInput, options]);

    return (
      <div
        ref={ref}
        className={classes.wrapper}
        data-testid="edition-filters-drawer"
      >
        <Box className={classes.header}>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center" gap={1} mb={3}>
              <Icon name="filter" />
              <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
                <Trans id="controls.set-filters">Edit filters</Trans>
              </Typography>
            </Flex>
            <IconButton sx={{ mt: "-0.5rem" }} size="small" onClick={onClose}>
              <SvgIcClose fontSize="inherit" />
            </IconButton>
          </Flex>
          <Typography variant="body3" color="text.secondary">
            <Trans id="controls.set-filters-caption">
              For best results, do not select more than 7 values in the
              visualization.
            </Trans>
          </Typography>
          <Input
            className={classes.textInput}
            size="sm"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t({ id: "select.controls.filters.search" })}
            startAdornment={
              <InputAdornment position="start">
                <Icon name="search" size={16} />
              </InputAdornment>
            }
          />
          <FilterControls
            selectAll={() => setPendingValues(uniqueSelectableFlatOptions)}
            selectNone={() => setPendingValues([])}
            allKeysLength={uniqueSelectableFlatOptions.length}
            activeKeysLength={pendingValues.length}
          />
        </Box>
        <Tree
          flat={Object.keys(depthsMetadata).length === 1}
          depthsMetadata={depthsMetadata}
          options={filteredOptions}
          selectedValues={pendingValues}
          showColors={hasColorMapping}
          onSelect={(newValues: HierarchyValue[]) => {
            setPendingValues(newValues);
          }}
        />
        <div className={classes.autocompleteApplyButtonContainer}>
          <Button
            size="sm"
            className={classes.autocompleteApplyButton}
            fullWidth
            onClick={onClose}
          >
            <Trans id="controls.set-values-apply">Apply filters</Trans>
          </Button>
        </div>
      </div>
    );
  }
);
