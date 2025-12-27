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
