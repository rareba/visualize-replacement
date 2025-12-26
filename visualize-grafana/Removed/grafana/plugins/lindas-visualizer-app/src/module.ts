import { AppPlugin } from '@grafana/data';
import { App } from './App';

/**
 * LINDAS Visual Builder Plugin
 *
 * A Grafana App Plugin for browsing and visualizing Swiss Open Data (LINDAS).
 *
 * Architecture:
 * - Simple React app with hash-based routing
 * - Catalog view: browse/search LINDAS datasets
 * - Builder view: configure and preview visualizations
 * - Uses Grafana datasource proxy for SPARQL queries
 *
 * User Flow:
 * 1. Browse/search datasets in the catalog
 * 2. Click dataset to open Visual Builder
 * 3. Configure: chart type, axes, grouping, filters
 * 4. See live preview
 * 5. Save as dashboard
 */
export const plugin = new AppPlugin<{}>().setRootPage(App);
