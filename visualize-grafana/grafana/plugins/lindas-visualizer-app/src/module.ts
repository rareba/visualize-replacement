import { AppPlugin } from '@grafana/data';
import { ChartStudio } from './pages/ChartStudio';

/**
 * LINDAS Chart Studio Plugin
 *
 * A Grafana App Plugin for creating visualizations from Swiss Linked Data (LINDAS).
 *
 * Philosophy:
 * - Users should never see or write SPARQL queries
 * - Provide a visual, intuitive chart creation experience
 * - All data queries are generated automatically
 * - The entire Grafana instance is locked to LINDAS-only access
 *
 * User Flow:
 * 1. Search and browse LINDAS datasets
 * 2. Select a dataset to load data
 * 3. Choose chart type (bar, line, pie, etc.)
 * 4. Configure axes and grouping
 * 5. See live preview
 * 6. Save to Grafana dashboard
 */
export const plugin = new AppPlugin<{}>().setRootPage(ChartStudio);
