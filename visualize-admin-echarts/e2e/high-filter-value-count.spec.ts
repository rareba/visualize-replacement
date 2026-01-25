import { setup } from "./common";

const { test, expect } = setup();

/**
 * Test for maps with large dimension value counts.
 * Uses extended timeouts for CI where network and rendering may be slower.
 * Re-enabled on CI with stability improvements.
 */
test(
  "should be able to load a map with a dimension with a large number of values",
  async ({ page, selectors, actions }) => {
    // Extended timeout for large data loading
    test.setTimeout(process.env.CI ? 600_000 : 300_000); // 10 min on CI, 5 min locally

    await actions.chart.createFrom({
      iri: "https://environment.ld.admin.ch/foen/fab_hierarchy_test13_switzerland_canton_municipality/3",
      dataSource: "Int",
    });

    // Wait for edition drawer with extended timeout
    await selectors.edition.drawerLoaded();

    // Change to map type
    await actions.editor.changeRegularChartType("Map");

    // Wait for chart to be loaded with extended timeout for large datasets
    await selectors.chart.loaded();

    // Wait for network to settle - important for large data transfers
    await page.waitForLoadState("networkidle", { timeout: 120_000 });

    // Verify map container is visible
    const mapContainer = page.locator('[data-chart-type="map"]');
    await expect(mapContainer).toBeVisible({ timeout: 30_000 });

    // Verify no error states
    const errorMessage = page.locator('[data-testid="chart-error"]');
    await expect(errorMessage).not.toBeVisible();
  }
);
