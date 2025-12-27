# Chart Builder Embedding System

This document describes the embedding system implemented for the chart-builder page.

## Overview

The chart-builder now supports embedding charts in external websites using URL-encoded configuration. This approach eliminates the need for database storage while maintaining full chart functionality.

## Architecture

### Components

1. **Chart Config Encoder** (`app/utils/chart-config-encoder.ts`)
   - Encodes/decodes chart configuration to URL-safe base64
   - Supports compression for large configurations
   - Provides utilities for generating embed codes

2. **Embeddable Chart Component** (`app/components/chart-builder/EmbeddableChart.tsx`)
   - Minimal chart rendering component for embeds
   - Uses Swiss Federal CI design tokens
   - Supports all chart types (column, bar, line, area, pie, scatter)

3. **Embed Page** (`app/pages/embed/chart/[configId].tsx`)
   - Server-side rendered embed page
   - Parses configuration from URL
   - Applies embed options (removeBorder, hideTitle, etc.)

4. **Lightweight UI Components** (`app/components/ui/`)
   - Button, Card, Alert, Chip, Dialog, Spinner, Divider, Tabs
   - All use Swiss Federal CI design tokens
   - Ready for future MUI replacement

## URL Format

```
/embed/chart/[base64-encoded-config]?options...
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `removeBorder` | boolean | Remove container border and shadow |
| `optimizeSpace` | boolean | Minimize padding for compact display |
| `hideTitle` | boolean | Hide chart title |
| `hideLegend` | boolean | Hide chart legend |
| `height` | number | Custom height in pixels |

## Configuration Structure

```typescript
interface EmbedPayload {
  version: 1;
  chart: {
    chartType: "column" | "bar" | "line" | "area" | "pie" | "scatter";
    xField: string;
    yField: string;
    groupField: string;
    title: string;
    colorPalette: string;
    showLegend: boolean;
    showTooltip: boolean;
    height?: number;
  };
  dataset: {
    title: string;
    dimensions: Array<{ id: string; label: string }>;
    measures: Array<{ id: string; label: string; unit?: string }>;
    observations: Array<Record<string, string | number | null>>;
  };
  filters?: Record<string, string[]>;
  customPalettes?: Record<string, string[]>;
}
```

## Usage

### In Chart Builder

1. Create a chart in the chart-builder
2. Go to "API / Code" view
3. Click "Get Embed Code" next to the chart
4. Configure embed options in the dialog
5. Copy the iframe code or direct URL

### Embedding in External Sites

**Fixed Height:**
```html
<iframe
  src="https://your-domain.ch/embed/chart/[config]"
  width="100%"
  height="400"
  style="border:none;">
</iframe>
```

**Responsive (with auto-resize):**
```html
<iframe
  id="chart-embed"
  src="https://your-domain.ch/embed/chart/[config]"
  style="width:100%;border:none;min-height:400px;">
</iframe>
<script src="https://cdn.jsdelivr.net/npm/@iframe-resizer/parent"></script>
<script>iframeResize({ license: 'GPLv3' }, '#chart-embed')</script>
```

## Limitations

1. **URL Length**: Browser URL length limits (typically 2000-8000 characters)
2. **Data Size**: Large datasets are automatically sampled to 1000 observations
3. **Client-Side Only**: All processing happens in the browser

## Security

- Content Security Policy headers allow embedding
- No server-side data storage required
- Configuration is validated on decode

## Swiss Federal CI Integration

The embed pages use Swiss Federal CI design tokens:
- Colors from `@interactivethings/swiss-federal-ci`
- Typography: Frutiger Neue font family
- Spacing: Consistent with federal design guidelines

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
    chart-builder.tsx            # Main page with embed UI
    embed/
      chart/
        [configId].tsx           # Embed page
  utils/
    chart-config-encoder.ts      # Encoding/decoding utilities
```

## Dependencies Used

### Essential for Embedding
- `echarts`, `echarts-for-react` - Chart rendering
- `@interactivethings/swiss-federal-ci` - Design tokens
- `next`, `react`, `react-dom` - Framework
- `@open-iframe-resizer/core` - Responsive embeds

### Currently Used by Chart Builder (MUI)
- `@mui/material` - UI components (48+ components)
- `@emotion/react`, `@emotion/styled` - CSS-in-JS

### Candidates for Removal (Not Used by Chart Builder)
- `@deck.gl/*` - 3D map layers
- `@lexical/*`, `lexical` - Rich text editor
- `@mdxeditor/*` - MDX editor
- `@apollo/client`, `apollo-server-micro` - GraphQL (chart-builder uses direct SPARQL)
- `@prisma/client` - Database ORM
- `maplibre-gl`, `react-map-gl` - Maps
- `react-grid-layout` - Dashboard layout
- Most `d3-*` libraries - Using ECharts instead
- `framer-motion` - Animations
- `zustand` - State management
- `urql`, `wonka` - GraphQL client
