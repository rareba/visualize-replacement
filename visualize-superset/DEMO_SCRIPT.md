# Demo Script: Visualize Superset vs Visualize-Admin-ECharts

## Audience

Technical stakeholders evaluating which solution should replace the current Swiss Federal visualization tool (visualize.admin.ch).

## Key Message

Visualize Superset is a lightweight, stable, purpose-built alternative that delivers the core visualization workflow in a fraction of the complexity, with fewer bugs and faster time-to-chart.

---

## Part 1: Architecture Comparison (5 min)

### Slide: Infrastructure Overhead

| | Visualize-Admin-ECharts | Visualize Superset |
|---|---|---|
| **Services required** | 6+ (Next.js, PostgreSQL, Redis, Celery, Superset, SPARQL proxy) | 2 (Vite frontend + FastAPI proxy) |
| **Database** | PostgreSQL required | None (stateless) |
| **Startup time** | 30-60s (Docker orchestration) | ~5s |
| **Memory footprint** | ~800MB+ | ~150MB |
| **Backend language** | TypeScript + Python hybrid | Python (FastAPI) |
| **Frontend framework** | Next.js 16 (SSR, complex routing) | Vite + React Router (SPA, fast HMR) |
| **Lines of code (app)** | ~200k+ (monorepo) | ~3k (focused) |
| **Config/state storage** | PostgreSQL + Prisma/Drizzle ORM | Client-side (no persistence needed for demo) |

**Demo action:** Show both startup sequences side by side. Visualize Superset is ready before visualize-admin finishes pulling Docker images.

### Slide: Data Flow

Both connect to the same LINDAS SPARQL endpoints. The difference is how:

```
Visualize-Admin-ECharts:
  Browser -> Next.js SSR -> Apollo Server -> GraphQL resolvers
    -> SPARQL query builder -> LINDAS endpoint
    -> PostgreSQL (config storage)
    -> Redis (caching)

Visualize Superset:
  Browser -> FastAPI proxy -> LINDAS endpoint
  (GraphQL + REST + raw SPARQL all available)
```

**Talking point:** Fewer moving parts means fewer failure points. No database means no migrations, no connection pool issues, no state corruption.

---

## Part 2: Known Stability Issues in Visualize-Admin-ECharts (5 min)

### Slide: Open Bug List (from chart-fixes.md)

The visualize-admin-echarts project has **6 open bugs** that remain unfixed despite a dedicated stabilization effort (the branch is literally called `desperate-attempt-to-make-it-stable`):

| ID | Bug | Severity | Status |
|---|---|---|---|
| CF-02 | Zoom slider crashes on empty time domains | High | OPEN |
| CF-03 | Combo tooltips inject raw HTML (XSS risk) | Critical | OPEN |
| CF-04 | Donut chart crashes on missing params | High | OPEN |
| CF-05 | Combo chart drops duplicate data, O(n^2) perf | Medium | OPEN |
| CF-06 | Combo chart crashes when time unit is undefined | High | OPEN |
| CF-08 | E2E tests don't validate chart output (CI is blind) | Medium | OPEN |

4 bugs were fixed (CF-01, CF-07, CF-09, CF-10), but the remaining 6 represent fundamental fragility in the chart rendering pipeline.

**Talking point:** The HTML injection bug (CF-03) is a security vulnerability. Tooltip formatters interpolate user-controlled labels without escaping. This is an XSS vector in a government application.

### Slide: Complexity Breeds Bugs

Why does visualize-admin-echarts have these issues?

1. **23+ chart types** with individually maintained adapters, state hooks, and tooltip formatters
2. **Adapter pattern mismatch** -- D3.js scale logic mixed with ECharts rendering creates impedance mismatch (e.g., `colors.copy()` bug)
3. **Dual rendering paths** -- Legacy D3 code coexists with new ECharts adapters
4. **Deep state management** -- Chart config is a deeply nested object with dozens of fields per chart type, each requiring separate validation

---

## Part 3: Live Demo -- Visualize Superset (10 min)

### Step 1: Browse Data Cubes

1. Open `http://localhost:3001`
2. Click **Data Cubes**
3. Show the cube list loading from LINDAS Production endpoint
4. Search for "Advertising revenue"
5. Click the English version of "Advertising revenue of television broadcasters"

**Highlight:** Cube list loads directly from LINDAS via our lightweight SPARQL proxy. No database seed or data import step.

### Step 2: Explore Cube Schema

1. On the Cube Detail page, show the **Schema tab**:
   - `observationDate` -- detected as **temporalDimension** (from XSD gYear datatype)
   - `advertisingRevenue` -- detected as **measure** (from XSD integer datatype)
   - Other fields correctly typed as **dimension**
2. Click **Preview** tab to show raw data
3. Click **SPARQL** tab to show the generated query

**Highlight:** The system automatically classifies dimensions vs measures by inspecting XML Schema datatypes. Visualize-admin requires manual configuration or relies on the cube publisher to set `cube:MeasureDimension` correctly.

### Step 3: Create a Chart

1. Click **Create Chart**
2. Show the auto-populated configuration:
   - X-Axis: `observationDate` (auto-detected as temporal)
   - Y-Axis: `advertisingRevenue` (auto-detected as measure)
   - Bar chart renders immediately

**Highlight:** Zero configuration needed for the first chart. The system picks sensible defaults.

### Step 4: Switch Chart Types (Stability Test)

Click through all 12 chart types rapidly, showing each renders without crashes:

1. **Bar** -- Standard bar chart with yearly data
2. **Line** -- Trend line
3. **Area** -- Filled area
4. **Pie** -- Proportional view by year
5. **Scatter** -- Data point distribution
6. **Radar** -- Multi-axis comparison (note: handles missing Color By gracefully with "All" default)
7. **Funnel** -- Sorted descending
8. **Gauge** -- KPI average with colored bands
9. **Heatmap** -- Density view
10. **Treemap** -- Proportional tiles
11. **Boxplot** -- Statistical distribution
12. **Table** -- Raw data with scrollable rows

**Highlight:** All 12 chart types render without crashes. No blank screens, no console errors. Compare this to visualize-admin-echarts where switching to combo charts or donut can crash the application.

### Step 5: Drag and Drop

1. Remove the auto-selected X-Axis field (click X)
2. Drag `conceptsendegruppe` from the Dimensions panel to the X-Axis well
3. Show the chart updates in real-time
4. Drag `observationDate` to the Color By well
5. Show grouped/stacked visualization

**Highlight:** Drag-and-drop uses `@dnd-kit` with pointer sensor activation constraints. MUI Chip components don't interfere with drag events. Type validation prevents dropping measures on the X-Axis or dimensions on the Y-Axis.

### Step 6: Filters

1. Expand the Filters panel
2. Add a filter: `observationDate` > `2015`
3. Show the chart updates to show only recent data
4. Add another filter: `advertisingRevenue` > `100000000`
5. Show combined filtering

**Highlight:** Client-side filtering with 7 operators. Instant response, no round-trip to the server.

### Step 7: Error Resilience

1. Remove both X-Axis and Y-Axis fields
2. Show the validation warning: "Add a dimension to X-Axis and a measure to Y-Axis"
3. Show that the app doesn't crash -- it shows a helpful placeholder
4. Re-add fields and show recovery

**Highlight:** Error boundary wraps the chart. Even if ECharts throws, the user sees a friendly error message with a Reset button instead of a white screen.

---

## Part 4: Head-to-Head Comparison (5 min)

### Slide: Feature Matrix

| Feature | Visualize-Admin-ECharts | Visualize Superset |
|---|---|---|
| Chart types | 23+ (many unstable) | 12 (all stable) |
| Data table view | Yes | Yes |
| Drag-and-drop fields | Yes | Yes |
| Auto-detect measures | Partial (relies on RDF metadata) | Yes (XSD datatype heuristic) |
| Error boundaries | Added recently (CF-09) | Built-in from day one |
| Filters | Complex (static + interactive) | Simple and working (7 operators) |
| GraphQL API | Yes (Apollo Server 4) | Yes (Strawberry GraphQL) |
| Raw SPARQL access | Indirect | Direct endpoint |
| SQL-to-SPARQL | No | Yes (sqlglot translation) |
| i18n (de/fr/it/en) | Yes | Not yet |
| Chart persistence | Yes (PostgreSQL) | Not yet (client-side only) |
| Embed/share | Yes | Not yet |
| Dashboard builder | Planned | Not yet |
| 3D charts | Yes (ECharts GL) | No |
| Map visualizations | Yes (WMS/WMTS) | No |
| XSS in tooltips | Yes (CF-03, unfixed) | No |
| Crash-free chart switching | No (CF-02, CF-04, CF-06) | Yes |
| Setup time | 30-60 min (Docker + DB + seed) | 5 min (pip install + npm install) |

### Slide: What Visualize Superset Does Better

1. **Stability** -- Every chart type renders. No crashes. No blank screens. Error boundaries catch the rest.
2. **Simplicity** -- 2 services, no database, 5-second startup. A developer can understand the entire codebase in an afternoon.
3. **Security** -- No HTML injection vulnerabilities in tooltips.
4. **Smart defaults** -- Auto-detects temporal dimensions and measures from XSD datatypes. First chart appears with zero configuration.
5. **Multiple query interfaces** -- GraphQL, REST, SQL-to-SPARQL, and raw SPARQL. Choose what fits.
6. **Performance** -- Stateless proxy with in-memory caching. No ORM overhead, no connection pools.

### Slide: What Visualize Superset Doesn't Do Yet

1. **Persistence** -- Charts are session-only. No save/share/embed.
2. **Internationalization** -- English only.
3. **Advanced chart types** -- No 3D, no maps, no combo charts, no waterfall.
4. **Multi-cube joins** -- Single cube at a time.
5. **User management** -- No auth, no multi-user.

These are additive features that can be built on top of a stable foundation. The visualize-admin-echarts problems are structural -- they stem from complexity that will keep producing new bugs as features are added.

---

## Part 5: Recommendation (2 min)

### The Case for Visualize Superset

The Swiss Federal visualization tool needs to be **reliable**. Government data publications can't show blank charts or inject HTML into tooltips. The current visualize-admin-echarts fork:

- Has a branch called "desperate attempt to make it stable"
- Still has 6 open chart-rendering bugs after focused stabilization
- Carries the weight of 200k+ lines of inherited code with mixed D3/ECharts rendering
- Requires 6+ services to run

Visualize Superset provides:

- A clean, purpose-built codebase of ~3k lines
- Zero known chart-rendering bugs across all 12 chart types
- A 2-service architecture that anyone can deploy and maintain
- A foundation ready for the features that matter (persistence, i18n, more chart types)

**The question is not "does it have every feature?" -- it's "can we build reliably on this foundation?"**

The answer for Visualize Superset is yes. For visualize-admin-echarts, the branch name speaks for itself.

---

## Quick Reference: Running the Demo

```bash
# Terminal 1: Start SPARQL proxy
cd sparql-proxy
source venv/bin/activate    # or venv\Scripts\activate on Windows
cd src && python main.py

# Terminal 2: Start frontend
cd frontend
npm run dev

# Open browser
http://localhost:3001
```

## Demo Checklist

- [ ] SPARQL proxy running on port 8089
- [ ] Frontend running on port 3001 (or 5173)
- [ ] LINDAS Production endpoint reachable
- [ ] Browser DevTools console open (to show zero errors)
- [ ] Visualize-admin-echarts available for comparison (optional)
