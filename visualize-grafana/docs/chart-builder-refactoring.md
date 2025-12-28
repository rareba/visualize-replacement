# Chart Builder Refactoring Summary

This document summarizes the refactoring work done on the chart-builder page to reduce dependencies, implement embedding, and maintain Swiss Federal look and feel.

## Completed Work

### Phase 1: Lightweight UI Component Library

Created reusable UI components in `app/components/ui/` that use Swiss Federal CI design tokens instead of MUI:

| Component | File | Replaces MUI |
|-----------|------|--------------|
| Button | Button.tsx | MUI Button (partial) |
| Card | Card.tsx | MUI Card/CardContent |
| Alert | Alert.tsx | MUI Alert |
| Chip | Chip.tsx | MUI Chip |
| Dialog | Dialog.tsx | MUI Dialog (uses HTML dialog) |
| Spinner | Spinner.tsx | MUI CircularProgress |
| LinearProgress | Spinner.tsx | MUI LinearProgress |
| Divider | Divider.tsx | MUI Divider |
| Tabs | Tabs.tsx | MUI Tabs/Tab |

All components use:
- `@interactivethings/swiss-federal-ci` design tokens (colors, spacing, typography, elevations)
- Inline styles for maximum portability
- Minimal external dependencies

### Phase 2 & 4: URL-Based Embedding System

Implemented chart embedding without database storage:

**Files Created:**
- `app/utils/chart-config-encoder.ts` - Encode/decode chart configs to URL-safe base64
- `app/components/chart-builder/EmbeddableChart.tsx` - Minimal chart render component
- `app/pages/embed/chart/[configId].tsx` - Embed page with CSP headers

**Features:**
- Chart data encoded directly in URL (no server storage needed)
- Support for embed options (removeBorder, hideTitle, hideLegend, height)
- Fixed and responsive iframe code generation
- iframe-resizer integration for auto-sizing
- Copy-to-clipboard functionality

**Usage in chart-builder:**
1. Go to "API / Code" view
2. Click "Get Embed Code" for any chart
3. Configure options and copy iframe code

### Phase 3: Component Replacement

Replaced MUI components in chart-builder.tsx with lightweight alternatives:

| MUI Component | Replaced With | Notes |
|---------------|---------------|-------|
| Alert | @/components/ui Alert | Except in Snackbar |
| Chip | @/components/ui Chip | With style instead of sx |
| Divider | @/components/ui Divider | With style instead of sx |
| CircularProgress | @/components/ui Spinner | Same API |

**MUI Components Still Used:**
- Box, Container, Paper, Typography - Layout utilities
- Select, MenuItem, FormControl, InputLabel - Form controls
- Button, Tabs, Tab - Navigation (MUI provides good a11y)
- Table components - Data display
- TextField, Slider, Switch - Form inputs
- Dialog, DialogTitle, DialogContent, DialogActions - Complex modals
- Drawer, List, ListItem - Navigation
- Snackbar + MuiAlert - Notifications
- Card, CardContent, CardActions - Card layouts
- Grid - Layout grid

### Phase 5: Dependency Analysis

**Dependencies Used by Chart Builder:**

Essential:
- `echarts`, `echarts-for-react` - Chart rendering
- `@interactivethings/swiss-federal-ci` - Design tokens
- `next`, `react`, `react-dom` - Framework
- `@emotion/react`, `@emotion/styled` - CSS-in-JS
- `@open-iframe-resizer/core` - Responsive embeds
- `@mui/material` - UI components (reduced usage)

**Dependencies NOT Used by Chart Builder:**

These could be removed if chart-builder were extracted as standalone:

| Package | Purpose | Used By |
|---------|---------|---------|
| @deck.gl/* | 3D map layers | Map visualizations |
| @lexical/*, lexical | Rich text editor | Content editing |
| @mdxeditor/* | MDX editor | Documentation |
| @apollo/client, apollo-server-micro | GraphQL | Original API |
| @prisma/client, prisma | Database ORM | Chart storage |
| maplibre-gl, react-map-gl | Maps | Map charts |
| react-grid-layout | Dashboard layout | Dashboard builder |
| d3-* (most) | D3 visualization | D3-based charts |
| framer-motion | Animations | UI animations |
| zustand | State management | Complex state |
| urql, wonka | GraphQL client | GraphQL queries |
| clownface, rdf-* | RDF parsing | Complex RDF |
| react-beautiful-dnd | Drag and drop | Sortable lists |

**Note:** These dependencies are still needed by other parts of the application. Only remove if extracting chart-builder as a separate project.

## Commits

1. `8baf9d8` - Add URL-based chart embedding system and lightweight UI components
2. `c6701f6` - Replace MUI components with lightweight Swiss Federal alternatives
3. `9f3ee53` - Add refactoring summary documentation
4. `bb52270` - Fix URL-based chart embedding for large datasets
5. `16e77f8` - Add data catalog page as main entry point

### Phase 6: Data Catalog Entry Point

Created a data catalog page as the main entry point for the application:

**File Created:**
- `app/pages/data-catalog.tsx` - Browse and search LINDAS datasets

**Features:**
- Swiss Federal branded header
- Search functionality with SPARQL queries to LINDAS endpoint
- Dataset cards showing title, publisher, description, themes
- "Create Visualization" button redirects to chart-builder with dataset pre-selected
- Navigation from chart-builder back to data catalog

**User Flow:**
1. User visits `/data-catalog` (main entry point)
2. Browse or search for datasets from LINDAS
3. Click "Create Visualization" on a dataset
4. Redirected to `/chart-builder?cube=<dataset-IRI>`
5. Chart builder loads with selected dataset
6. User can navigate back to data catalog via header link

## Testing Checklist

All features have been tested and verified:

- [x] All chart types render correctly (column, bar, line, area, pie, scatter)
- [x] Filters work and update charts
- [x] Multiple charts on dashboard work
- [x] Custom color palettes work
- [x] Editable chart titles work
- [x] Data table view works
- [x] Export JSON/CSV works
- [x] Embed code generation works
- [x] Swiss Federal styling maintained
- [x] Embedded charts render correctly
- [x] URL-based embedding works with payload minimization
- [x] Data catalog page loads and displays datasets
- [x] Dataset search functionality works
- [x] Navigation between data catalog and chart builder works

### Embed Payload Minimization

The initial URL-based embedding caused HTTP 431 errors (Request Header Fields Too Large) because observations contained all dimension columns with full URIs.

**Fix implemented in `bb52270`:**
- `preparePayloadForEmbed()` - Minimizes payload for URL embedding
- Removes unused dimension columns (keeps only xField, yField, groupField)
- Shortens URI field names to local names (e.g., "date" instead of full URI)
- Samples observations to max 100 rows
- Reduces URL size from ~500KB to ~3KB for typical datasets

## File Structure

```
app/
  components/
    ui/                          # Lightweight UI components
      Button.tsx
      Card.tsx
      Alert.tsx
      Chip.tsx
      Dialog.tsx
      Spinner.tsx
      Divider.tsx
      Tabs.tsx
      index.ts
    chart-builder/
      EmbeddableChart.tsx        # Embed chart component
  pages/
    data-catalog.tsx             # Main entry point - browse datasets
    chart-builder.tsx            # Chart configuration page
    embed/
      chart/
        [configId].tsx           # Embed page
  utils/
    chart-config-encoder.ts      # Encoding/decoding utilities
docs/
  chart-builder-embedding.md     # Embedding documentation
  chart-builder-refactoring.md   # This file
```

## Next Steps

1. **Standalone Extraction**: If needed, extract chart-builder as a separate Next.js project with minimal dependencies
2. **Further MUI Replacement**: Replace remaining MUI components (Select, TextField, Dialog) if bundle size is critical
3. **Performance Optimization**: Add code splitting and lazy loading for chart components
4. **Homepage Redirect**: Consider adding redirect from `/` to `/data-catalog`
