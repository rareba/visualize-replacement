# Bug Report

This document lists newly discovered chart-focused issues from the latest scan. Older items have been removed.

## Chart Issues (Latest Scan)

### 1. Single-series bar/column colors collapse to first palette color
- **Title:** Single-series bar/column colors collapse to first palette color
- **Location(s):**
  - [`bar-adapter.tsx`](app/charts/echarts/adapters/bar-adapter.tsx:88)
  - [`column-adapter.tsx`](app/charts/echarts/adapters/column-adapter.tsx:93)
- **Symptom/Impact:** Single-series bars/columns render with only the first palette color, masking intended per-datum color mapping and confusing category differentiation.
- **Root Cause:** Per-datum scale copies reset the ordinal domain, so the scale restarts for every datum.
- **Complete Solution:** Create one shared ordinal color scale instance per series, pre-seed its domain with all datum keys/categories, and apply the same scale per datum without copying.

### 2. Zoom slider breaks on empty/degenerate time domains
- **Title:** Zoom slider breaks on empty/degenerate time domains
- **Location(s):**
  - [`useDataZoom()`](app/charts/echarts/hooks/useDataZoom.ts:38)
  - [`useDataZoom()`](app/charts/echarts/hooks/useDataZoom.ts:83)
- **Symptom/Impact:** The zoom slider throws, renders incorrectly, or becomes unusable when the time domain is missing, empty, or has zero span.
- **Root Cause:** The logic assumes a valid two-date domain with a finite span.
- **Complete Solution:** Validate domain length and date validity, ensure a finite non-zero span, clamp start/end values, and return an empty zoom config when invalid to avoid rendering the slider.

### 3. Combo tooltip formatters inject raw HTML and lack param validation
- **Title:** Combo tooltip formatters inject raw HTML and lack param validation
- **Location(s):**
  - [`createCategoryComboTooltipFormatter()`](app/charts/echarts/dual-axis-utils.ts:177)
  - [`createTimeComboTooltipFormatter()`](app/charts/echarts/dual-axis-utils.ts:200)
- **Symptom/Impact:** Tooltip rendering can inject raw HTML or crash when params are malformed.
- **Root Cause:** Params are accessed without validation and labels are interpolated without escaping.
- **Complete Solution:** Add param shape guards, short-circuit on invalid payloads, and escape all dynamic labels via [`escapeHtml()`](app/charts/echarts/tooltip-formatters.ts:340).

### 4. Donut tooltip/label param assertions can throw
- **Title:** Donut tooltip/label param assertions can throw
- **Location(s):**
  - [`createDonutLabelConfig()`](app/charts/echarts/adapters/donut-adapter.tsx:60)
  - [`createDonutTooltipFormatter()`](app/charts/echarts/adapters/donut-adapter.tsx:113)
- **Symptom/Impact:** Donut charts can crash when tooltip or label params are missing or unexpected.
- **Root Cause:** Non-null assertions and unchecked casts assume params are always present.
- **Complete Solution:** Guard params and default to empty label/tooltip output when missing, mirroring [`createPieLabelConfig()`](app/charts/echarts/adapters/pie-adapter.tsx:91).

### 5. Combo line+column adapter drops duplicate-category data and scales poorly
- **Title:** Combo line+column adapter drops duplicate-category data and scales poorly
- **Location(s):**
  - [`combo-line-column-adapter.tsx`](app/charts/echarts/adapters/combo-line-column-adapter.tsx:66)
- **Symptom/Impact:** Duplicate categories are overwritten or ignored, and performance degrades on larger datasets.
- **Root Cause:** Per-category linear searches occur without aggregation or indexing.
- **Complete Solution:** Pre-index or aggregate series data, reuse [`groupTimeSeriesData()`](app/charts/echarts/data-utils.ts:22) and [`buildTimeSeriesData()`](app/charts/echarts/data-utils.ts:70), and avoid repeated scans per category.

### 6. Combo line+column state assumes time unit always defined
- **Title:** Combo line+column state assumes time unit always defined
- **Location(s):**
  - [`combo-line-column-state.tsx`](app/charts/combo/combo-line-column-state.tsx:110)
- **Symptom/Impact:** State initialization can throw when the time unit is missing.
- **Root Cause:** The time unit is cast/used without validation.
- **Complete Solution:** Guard against undefined units, derive a default from data/config, or return a safe empty state with a warning.

### 7. Horizontal bar tooltip placement uses wrong anchor
- **Title:** Horizontal bar tooltip placement uses wrong anchor
- **Location(s):**
  - [`bars-state.tsx`](app/charts/bar/bars-state.tsx:341)
- **Symptom/Impact:** Tooltip placement is offset or off-screen for horizontal bars.
- **Root Cause:** The placement helper uses a vertical coordinate even when axes are flipped.
- **Complete Solution:** Use the x-scale anchor for horizontal bars or add a flipped-axis placement helper for accurate anchoring.

### 8. Chart snapshots e2e spec doesn’t validate rendering output
- **Title:** Chart snapshots e2e spec doesn’t validate rendering output
- **Location(s):**
  - [`chart-snapshots.spec.ts`](e2e/chart-snapshots.spec.ts:22)
- **Symptom/Impact:** CI can pass even when charts fail to render, allowing regressions through.
- **Root Cause:** The test only waits and performs no assertions.
- **Complete Solution:** Add screenshot or DOM assertions for the chart canvas/SVG, verify rendered output, and integrate the checks into CI.

