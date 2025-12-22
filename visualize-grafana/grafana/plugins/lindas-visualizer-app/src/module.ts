import { AppPlugin } from '@grafana/data';
import { DatasetCatalog } from './pages/DatasetCatalog';

/**
 * LINDAS Dataset Catalog Plugin
 *
 * A Grafana App Plugin for browsing and visualizing Swiss Open Data (LINDAS).
 *
 * Design Philosophy:
 * - Simple, clean interface - just a dataset catalog
 * - One-click dashboard creation
 * - Let Grafana handle visualization through native panel editing
 * - No complex chart builder - users get full Grafana power
 *
 * User Flow:
 * 1. Browse or search datasets
 * 2. Click a dataset to create a dashboard
 * 3. Use Grafana's panel editor to configure visualization
 */
export const plugin = new AppPlugin<{}>().setRootPage(DatasetCatalog);
