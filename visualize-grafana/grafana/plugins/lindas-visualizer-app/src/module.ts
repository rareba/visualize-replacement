import { AppPlugin } from '@grafana/data';
import { ExplorerSceneWrapper } from './scenes/ExplorerScene';

/**
 * LINDAS Data Browser Plugin
 *
 * A Grafana App Plugin for discovering and visualizing Swiss Linked Data (LINDAS).
 *
 * Philosophy:
 * - This plugin does NOT embed its own visualization
 * - It helps users discover cubes and build SPARQL queries
 * - Users then use Grafana's native tools (Explore, Dashboards) to visualize
 * - The entire Grafana instance is locked to LINDAS-only access
 *
 * User Flow:
 * 1. Search/browse LINDAS data cubes
 * 2. Select dimensions and measures
 * 3. Generate SPARQL query
 * 4. Open in Explore OR Create Dashboard
 * 5. Use Grafana's panel editor to customize visualization
 */
export const plugin = new AppPlugin<{}>().setRootPage(ExplorerSceneWrapper);
