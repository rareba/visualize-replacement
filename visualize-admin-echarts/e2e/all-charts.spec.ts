import {
  BASELINE_SUFFIX,
  SCREENSHOTS_FOLDER,
  TO_COMPARE_SUFFIX,
} from "../scripts/compare-screenshots-utils";

import { setup, sleep } from "./common";

const { test } = setup();

/**
 * Visual Regression Test - All Charts Baseline Screenshot
 *
 * This test takes screenshots of every chart in the PROD database (up to 1000 charts)
 * for visual regression comparison.
 *
 * Usage:
 * 1. Enable with environment variable: E2E_VISUAL_REGRESSION=true
 * 2. Set IS_BASELINE below based on your workflow:
 *    - true: Generate baseline screenshots (checkout baseline branch first)
 *    - false: Generate comparison screenshots (checkout comparison branch)
 *
 * Commands:
 *   # Generate baseline screenshots
 *   E2E_VISUAL_REGRESSION=true IS_BASELINE=true yarn e2e:dev --project=visual-regression --headed
 *
 *   # Generate comparison screenshots
 *   E2E_VISUAL_REGRESSION=true IS_BASELINE=false yarn e2e:dev --project=visual-regression --headed
 *
 *   # Compare screenshots after both runs
 *   yarn compare-screenshots
 */
const IS_BASELINE = process.env.IS_BASELINE !== "false";

// Skip unless E2E_VISUAL_REGRESSION environment variable is set
const runTest = process.env.E2E_VISUAL_REGRESSION === "true" ? test : test.skip;

runTest("all charts", async ({ page }) => {
  await page.goto(`/en/preview`);

  const configs = await fetch(
    "https://visualize.admin.ch/api/config/all?limit=1000"
  ).then(async (res) => {
    const json = await res.json();
    return json.data;
  });

  let i = 0;
  for (const config of configs) {
    if (i > 0) {
      await page.reload();
    }

    console.log(`Rendering chart ${i + 1} / ${configs.length}`);

    try {
      await page.evaluate((config) => {
        window.postMessage(config.data, "*");
      }, config);
      await page.waitForLoadState("networkidle");
    } catch (e) {
      console.error("Failed to load chart", e);
      return;
    } finally {
      i++;
    }

    await sleep(2_000);

    await page.screenshot({
      path: `${SCREENSHOTS_FOLDER}/${config.key}${
        IS_BASELINE ? BASELINE_SUFFIX : TO_COMPARE_SUFFIX
      }.png`,
      fullPage: true,
    });

    const errorDialogCloseButton = await page.$(
      "[data-nextjs-errors-dialog-left-right-close-button='true']"
    );

    if (errorDialogCloseButton) {
      await errorDialogCloseButton.click();
      await sleep(1_000);
      const errorToastCloseButton = await page.$(
        "[data-nextjs-toast-errors-hide-button='true']"
      );

      if (errorToastCloseButton) {
        await errorToastCloseButton.click();
        await sleep(1_000);
      }
    }
  }
});
