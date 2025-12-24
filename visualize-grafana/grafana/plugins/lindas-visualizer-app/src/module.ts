import { AppPlugin } from '@grafana/data';
import { VisualBuilderAppRoot } from './scenes';

/**
 * LINDAS Visual Builder Plugin
 *
 * A Grafana App Plugin for browsing and visualizing Swiss Open Data (LINDAS).
 * Built using @grafana/scenes for state management and native Grafana panels.
 *
 * Architecture:
 * - SceneApp manages overall plugin state and URL-based routing
 * - Split layout: sidebar configuration + visualization canvas
 * - Zero D3.js dependencies - all native Grafana panels
 *
 * User Flow:
 * 1. Browse/search datasets in the catalog
 * 2. Click dataset to open Visual Builder
 * 3. Configure: chart type, axes, grouping, filters
 * 4. See live preview with native Grafana panels
 * 5. Save as dashboard or share via URL
 */
export const plugin = new AppPlugin<{}>().setRootPage(VisualBuilderAppRoot);
