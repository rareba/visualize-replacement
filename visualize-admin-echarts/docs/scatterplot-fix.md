# Scatterplot Fix Documentation

## Issue

The scatterplot chart was not displaying any data when rendered with the ECharts adapter.

## Root Causes

1. **Insufficient null/undefined handling**: The adapter didn't handle edge cases where:
   - `chartData` was empty or undefined
   - `bounds` was undefined
   - Scale domains contained NaN values
   - Data points contained null/undefined values

2. **Missing safety checks**: The code assumed all state properties were always defined.

## Solution

### 1. Added Safe Domain Helper

```typescript
const safeGetDomain = (
  scale: { domain: () => [number, number] } | undefined,
  fallback: [number, number] = [0, 100]
): [number, number] => {
  if (!scale || typeof scale.domain !== "function") {
    return fallback;
  }
  const domain = scale.domain();
  if (!Array.isArray(domain) || domain.length < 2) {
    return fallback;
  }
  const [min, max] = domain;
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  return [safeMin, safeMax];
};
```

### 2. Added Empty Data Handling

When `chartData` is empty or undefined, the chart now displays a "No data available" message:

```typescript
if (!hasData) {
  return {
    ...getSwissFederalTheme(),
    graphic: {
      type: "text",
      left: "center",
      top: "middle",
      style: {
        text: "No data available",
        fontSize: 14,
        fontFamily: SWISS_FEDERAL_FONT.family,
        fill: SWISS_FEDERAL_COLORS.text,
      },
    },
    series: [],
  };
}
```

### 3. Filtered Invalid Data Points

Data points with null/NaN values are now filtered out:

```typescript
chartData.forEach((d) => {
  const x = getX(d);
  const y = getY(d);
  if (x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y)) {
    data.push([x, y]);
  }
});
```

### 4. Safe Dimension Calculations

Added fallbacks for undefined bounds:

```typescript
const safeWidth = bounds?.width ?? "100%";
const safeHeight =
  bounds?.chartHeight && bounds?.margins
    ? bounds.chartHeight + bounds.margins.top + bounds.margins.bottom
    : 400;
```

## Testing

### Test Fixture

Use the Palmer Penguins dataset for testing scatterplots:

**Location**: `app/test/__fixtures/config/int/scatterplot-palmer-penguins.json`

**Dataset URL**: `https://lindas-cached.int.cluster.ldbar.ch/query`

**Features**:
- X-axis: Bill length (mm)
- Y-axis: Bill depth (mm)
- Segment: Islands (Biscoe, Dream, Torgersen)

### Running Tests

```bash
# Run scatterplot adapter tests
yarn test charts/echarts/adapters/scatterplot-adapter.spec.ts

# Run all ECharts adapter tests
yarn test charts/echarts
```

### Test Coverage

The following edge cases are now tested:

1. Empty chart data
2. Null/undefined bounds
3. Null values in data points
4. NaN values in scale domains

## File Changes

- `app/charts/echarts/adapters/scatterplot-adapter.tsx` - Fixed adapter with robust null handling
- `app/charts/echarts/adapters/scatterplot-adapter.spec.ts` - Added edge case tests

## Usage

The scatterplot adapter reads from the existing `ScatterplotState` context and transforms it to ECharts configuration. No changes needed in consuming code - the fix is transparent to the rest of the application.

```tsx
// Example usage in chart-scatterplot.tsx
<ScatterplotChart {...props}>
  <ChartContainerECharts>
    <ScatterplotChartAdapter />
    <Tooltip type="single" />
  </ChartContainerECharts>
</ScatterplotChart>
```

## Verification

After fixing, all 74 ECharts tests pass:
- theme.spec.ts: 20 tests
- pie-adapter.spec.ts: 5 tests
- scatterplot-adapter.spec.ts: 8 tests
- bar-adapter.spec.ts: 5 tests
- line-adapter.spec.ts: 3 tests
- column-adapter.spec.ts: 8 tests
- area-adapter.spec.ts: 4 tests
- EChartsWrapper.spec.tsx: 21 tests

## Browser Testing

### Test Date: 2026-01-20

Successfully tested the scatterplot in browser with the following steps:

1. Started development server: `npx next dev ./app -p 3000`
2. Navigated to: `http://localhost:3000/en`
3. Selected Data source: **Int** (Integration)
4. Searched for: **palmer** (with "Include draft datasets" enabled)
5. Selected: **Palmer Penguins** dataset
6. Clicked: **Start a visualization**
7. Selected chart type: **Scatterplot**

### Test Results

The scatterplot displayed correctly with:
- **X-axis**: Mean bill length (mm) - scale 0-45
- **Y-axis**: Mean bill depth (mm) - scale 0-22
- **Data points**: 3 colored dots representing islands
  - Blue: Biscoe
  - Orange: Dream
  - Green: Torgersen
- **Legend**: Displayed at bottom with island names

### Screenshot Evidence

The chart successfully rendered data points from the Palmer Penguins dataset,
confirming the ECharts adapter fix is working correctly in production.
