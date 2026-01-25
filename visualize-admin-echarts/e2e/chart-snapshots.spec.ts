import { configs as intConfigs } from "../app/test/__fixtures/config/int/configs";

import { setup, sleep } from "./common";
import { harReplayGraphqlEndpointQueryParam } from "./har-utils";

const { test, expect } = setup();

// Right now the CI app server runs connected to int.lindas.admin.ch
const configs = intConfigs.map((x) => ({ env: "int", ...x }));

const viewports = {
  "ipad-mini, portrait": {
    width: 768,
    height: 1024,
  },
  "iphone-8, portrait": {
    width: 375,
    height: 667,
  },
};

for (let [viewportName, viewportSize] of Object.entries(viewports)) {
  for (let { slug, env } of configs) {
    test(`Chart Snapshots ${slug} ${env} ${viewportName}`, async ({
      page,
      selectors,
      replayFromHAR,
    }) => {
      await replayFromHAR();
      await page.setViewportSize(viewportSize);
      await page.goto(
        `/en/__test/${env}/${slug}?dataSource=Int&${harReplayGraphqlEndpointQueryParam}`
      );
      await selectors.chart.loaded();

      await sleep(2_000);

      // Validate chart rendering - check for ECharts canvas, SVG, or table elements
      const chartCanvas = page.locator("canvas");
      const chartSvg = page.locator('svg[class*="echarts"], svg.recharts-surface, svg.chart');
      const chartTable = page.locator('table[role="grid"], table.chart-table');
      const chartContainer = page.locator('[data-testid="chart-panel-middle"]');

      // At least one chart element type should be present and visible
      const canvasCount = await chartCanvas.count();
      const svgCount = await chartSvg.count();
      const tableCount = await chartTable.count();
      const containerCount = await chartContainer.count();

      // Verify chart container exists
      expect(containerCount + canvasCount + svgCount + tableCount).toBeGreaterThan(0);

      // If canvas exists, verify it has non-zero dimensions
      if (canvasCount > 0) {
        const canvasBox = await chartCanvas.first().boundingBox();
        expect(canvasBox).toBeTruthy();
        if (canvasBox) {
          expect(canvasBox.width).toBeGreaterThan(0);
          expect(canvasBox.height).toBeGreaterThan(0);
        }
      }

      // Take visual regression screenshot
      await expect(page).toHaveScreenshot(`${slug}-${viewportName}.png`, {
        maxDiffPixelRatio: 0.05,
      });
    });
  }
}
