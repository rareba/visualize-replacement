import { loadChartInLocalStorage } from "./charts-utils";
import { setup } from "./common";
import configuratorState from "./fixtures/map-nfi-chart-config.json";

const { test, expect } = setup();

test("Selecting SymbolLayer colors > should be possible to select geo dimension and see a legend", async ({
  page,
  selectors,
  actions,
  within,
}) => {
  // Extended timeout for CI stability
  test.setTimeout(120_000);

  const key = "jky5IEw6poT3";
  await loadChartInLocalStorage(page, key, configuratorState);
  await page.goto(`/en/create/${key}`);
  await selectors.edition.drawerLoaded();

  await selectors.chart.loaded();

  // Wait for color section to be ready
  const colorSection = selectors.edition.controlSectionByTitle("Color");
  const noneLabel = await within(colorSection).getByLabelText("None");
  await expect(noneLabel).toBeVisible({ timeout: 10_000 });
  await noneLabel.click();

  // Wait for dropdown to appear and select option
  await actions.mui.selectOption("Region");

  // Wait for chart to reload with new color settings
  await selectors.chart.loaded();

  // Wait for legend to be fully rendered - this is critical for CI
  await selectors.chart.colorLegend(undefined, { timeout: 30_000 });

  // Add extra wait for legend items to populate
  await page.waitForTimeout(2_000);

  const legendItems = await selectors.chart.colorLegendItems();

  // Wait until we have the expected number of items (retry with polling)
  await expect(async () => {
    const count = await legendItems.count();
    expect(count).toBe(51);
  }).toPass({ timeout: 30_000 });

  const legendTexts = await legendItems.allTextContents();
  expect(legendTexts.length).toBe(51);
  expect(legendTexts[0]).toEqual("Jura + Plateau");
  expect(legendTexts[1]).toEqual("Western Jura");
  expect(legendTexts[legendTexts.length - 1]).toEqual("Jura");
});
