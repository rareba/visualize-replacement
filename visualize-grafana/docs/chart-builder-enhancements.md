# Chart Builder Enhancements

## Overview

This document describes the enhancements made to the chart-builder page to improve error handling and add dataset join functionality.

## Changes Made

### 1. Error Handling for Charts Without Measures

**Problem:** When clicking the "+ Chart" button on a dataset with no measures (numeric fields), the button silently did nothing, leaving users confused.

**Solution:** Added proper error messages that display when attempting to create a chart from an invalid dataset.

**Implementation:**

1. Added `errorMessage` state to track error messages:
```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

2. Updated `addChartFromDataset` function to set error messages:
```typescript
if (dataset.measures.length === 0) {
  const msg = "Dataset has no measures (numeric fields) - cannot create chart...";
  setErrorMessage(msg);
  setSnackbar({ open: true, message: msg });
  return;
}
```

3. Added inline Alert component in the Loaded Datasets section for visibility:
```tsx
{errorMessage && (
  <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
    {errorMessage}
  </Alert>
)}
```

### 2. Dataset Join Functionality

**Problem:** Users needed to combine data from multiple datasets but had no way to join them on common fields.

**Solution:** Implemented a comprehensive dataset join feature with auto-detection and manual field selection.

**Features:**

1. **Join Datasets Button:** Appears when 2 or more datasets are loaded
2. **Join Dialog:** Modal dialog for configuring the join operation
3. **Auto-Detection:** Automatically detects common fields between datasets based on value overlap
4. **Manual Selection:** Allows users to manually select which fields to join on
5. **Join Types:** Supports Inner Join, Left Join, and Full Outer Join
6. **Virtual Datasets:** Creates new virtual datasets from the join result

**Implementation Details:**

#### Helper Functions

1. `findCommonFields()` - Detects potential join keys between two datasets:
   - Compares all dimension values between datasets
   - Calculates match score based on common value overlap
   - Returns sorted list of potential join fields

2. `joinDatasets()` - Performs the actual join operation:
   - Supports inner, left, and full outer joins
   - Merges observations from both datasets
   - Combines dimensions and measures from both datasets

#### State Variables

```typescript
const [joinDialogOpen, setJoinDialogOpen] = useState(false);
const [selectedJoinDatasets, setSelectedJoinDatasets] = useState<{ left: string; right: string }>();
const [selectedJoinFields, setSelectedJoinFields] = useState<{ leftField: string; rightField: string }>();
const [joinType, setJoinType] = useState<"inner" | "left" | "full">("inner");
```

#### UI Components

- **Join Dialog:** Contains dataset selection dropdowns, field selection dropdowns, join type selector
- **Auto-detected suggestions:** Displayed as chips showing match score percentage
- **Create Joined Dataset button:** Creates virtual dataset from join configuration

## Files Modified

1. `app/pages/chart-builder.tsx` - Main implementation file

## Usage

### Error Handling

1. Add a dataset with no measures
2. Click the "+ Chart" button
3. Error message appears: "Dataset has no measures (numeric fields) - cannot create chart..."

### Dataset Joining

1. Add two or more datasets
2. Click "Join Datasets" button (appears next to "Add by IRI")
3. Select left and right datasets from dropdowns
4. Auto-detected common fields appear as suggestions (if any)
5. Or manually select fields from each dataset
6. Choose join type (Inner/Left/Full)
7. Click "Create Joined Dataset"
8. New virtual dataset appears in the loaded datasets list

## Technical Notes

- Join operations are performed client-side in memory
- Virtual datasets are stored in the same datasets array with a special "joined" prefix
- Joined datasets can be used just like regular datasets for chart creation
- The join auto-detection uses value matching to find compatible fields

## Bug Fix: Measure Detection

### Problem
All datasets were showing "0 measures" because the SPARQL query was incorrectly using `qudt:hasUnit` to identify measures.

### Solution
Changed measure detection to use the correct RDF type check:
- **Measures**: Properties with `rdf:type cube:MeasureDimension`
- **Dimensions**: Properties without this type

### SPARQL Queries

**Dimensions Query:**
```sparql
SELECT DISTINCT ?dimension ?dimensionLabel WHERE {
  <cubeIri> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop sh:path ?dimension .
  ?prop schema:name ?dimensionLabel .
  FILTER NOT EXISTS { ?prop rdf:type cube:MeasureDimension }
}
```

**Measures Query:**
```sparql
SELECT DISTINCT ?measure ?measureLabel ?unit WHERE {
  <cubeIri> cube:observationConstraint ?shape .
  ?shape sh:property ?prop .
  ?prop rdf:type cube:MeasureDimension .
  ?prop sh:path ?measure .
  ?prop schema:name ?measureLabel .
}
```

This matches the approach used in the original visualize.admin.ch codebase (`app/rdf/parse.ts`).

## UI/UX Improvements

### 3. Editable Chart Titles

**Problem:** Chart titles were static and could not be customized after creation.

**Solution:** Replaced static Typography with an editable TextField with a subtle dashed underline style.

**Implementation:**
```typescript
<TextField
  value={chart.title}
  onChange={(e) => updateChart(chart.id, { title: e.target.value })}
  variant="standard"
  size="small"
  sx={{
    flex: 1,
    "& .MuiInput-input": {
      fontSize: 14,
      fontWeight: 500,
      color: "text.secondary",
      py: 0.5
    },
    "& .MuiInput-underline:before": { borderBottom: "1px dashed rgba(0,0,0,0.2)" },
    "& .MuiInput-underline:hover:before": { borderBottom: "1px solid rgba(0,0,0,0.4)" },
  }}
  placeholder="Chart title..."
/>
```

### 4. Inline Filters in Visualization Tab

**Problem:** Filters were in a separate tab, requiring users to navigate away from the visualization to apply filters.

**Solution:** Moved filters to a collapsible section directly in the Visualization tab, making them immediately accessible.

**Implementation:**

1. Removed Filters from navigation:
```typescript
const NAV_ITEMS = [
  { id: "datasets", label: "Datasets", icon: "[+]" },
  { id: "chart", label: "Visualization", icon: "[=]" },
  { id: "table", label: "Data Table", icon: "[#]" },
  { id: "settings", label: "Settings", icon: "[*]" },
  { id: "code", label: "API / Code", icon: "[<>]" },
];
```

2. Added `filtersExpanded` state for collapse/expand behavior

3. Added collapsible Paper component in Visualization view with:
   - Header showing "Filters" with active filter count badge
   - Multi-select dropdowns for each dimension (up to 50 unique values)
   - CheckedBox items for filter selection

### 5. Custom Color Palettes

**Problem:** Users could only choose from built-in color palettes without ability to create their own.

**Solution:** Added comprehensive custom palette creation in Settings.

**Implementation:**

1. New state variables:
```typescript
const [customPalettes, setCustomPalettes] = useState<Record<string, string[]>>({});
const [newPaletteName, setNewPaletteName] = useState("");
const [newPaletteColors, setNewPaletteColors] = useState<string[]>(["#DC0018", "#2D6B9F", "#66B573", "#F9B21A"]);
const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

// Combined palettes
const allPalettes = useMemo(() => ({ ...COLOR_PALETTES, ...customPalettes }), [customPalettes]);
```

2. UI features in Settings:
   - Display existing custom palettes with delete buttons
   - Palette name input field
   - Interactive color boxes (click to edit with color picker)
   - Small "x" badges on colors to remove them
   - "+" button to add new colors
   - Hex color input field for manual entry
   - "Create Palette" button (disabled until name is entered)

3. Updated all palette dropdowns to use `allPalettes` instead of `COLOR_PALETTES`

**Usage:**

1. Navigate to Settings tab
2. Scroll to "Custom Color Palettes" section
3. Enter a palette name
4. Click color boxes to edit colors, or click "+" to add more
5. Click "Create Palette" to save
6. New palette appears in all color palette dropdowns
