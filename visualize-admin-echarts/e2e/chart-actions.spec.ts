import { promises } from "fs";

import { PNG } from "pngjs";

import { setup } from "./common";

const { test, expect } = setup();

test("it should be possible to duplicate a chart", async ({
  page,
  actions,
  selectors,
}) => {
  await actions.chart.createFrom({
    iri: "https://energy.ld.admin.ch/sfoe/bfe_ogd84_einmalverguetung_fuer_photovoltaikanlagen/10",
    dataSource: "Prod",
  });
  await selectors.chart.loaded();
  const chartMoreButton = await selectors.chart.moreButton();
  await chartMoreButton.click();
  await (await selectors.mui.popover().findByText("Duplicate")).click();
  const chartTabs = await selectors.chart.tabs();
  expect(await chartTabs.count()).toBe(2);
  const layoutOptionsButton = page.locator(
    "button:has-text('Proceed to layout options')"
  );
  await layoutOptionsButton.click();
  await selectors.chart.loaded();
  const chartMoreButtonLayout = await selectors.chart.moreButton();
  await chartMoreButtonLayout.click();
  await (await selectors.mui.popover().findByText("Duplicate")).click();
  const chartTabsLayout = await selectors.chart.tabs();
  expect(await chartTabsLayout.count()).toBe(3);
});

test("it should be possible to make a screenshot of a chart", async ({
  page,
  actions,
  selectors,
}) => {
  await actions.chart.createFrom({
    iri: "https://agriculture.ld.admin.ch/foag/cube/MilkDairyProducts/Consumption_Price_Month",
    dataSource: "Prod",
  });
  await selectors.chart.loaded();
  await actions.editor.changeRegularChartType("Bars");

  // Wait for chart to fully render after type change
  await selectors.chart.loaded();
  await page.waitForLoadState("networkidle");

  const chartMoreButton = await selectors.chart.moreButton();
  await chartMoreButton.click();

  // Wait for popover to be visible
  const popover = selectors.mui.popover();
  await expect(popover.locator).toBeVisible();

  // Set up download promise before clicking
  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  const exportButton = await popover.findByText("Export PNG");
  await exportButton.click();

  // Wait for download to complete
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  const fileBuffer = await promises.readFile(filePath!);
  expect(fileBuffer.length).toBeGreaterThan(0);

  const png = PNG.sync.read(fileBuffer);
  const { width, height } = png;
  expect(width).toBeGreaterThan(0);
  // Make sure the whole chart was captured in the screenshot, not only the
  // visible part. Reduced threshold for stability.
  expect(height).toBeGreaterThan(1000);
});
