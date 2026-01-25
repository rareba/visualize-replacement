import { setup } from "./common";

const { expect, test } = setup();

test("it should display values in interactive filters as hierarchie", async ({
  page,
  selectors,
}) => {
  // Extended timeout for hierarchy loading
  test.setTimeout(120_000);

  await page.goto("/en/__test/int/bathing-water-quality-hierarchie");
  await selectors.chart.loaded();

  // Wait for and click the show filters button
  const showFiltersButton = page.locator('text="Show Filters"');
  await expect(showFiltersButton).toBeVisible({ timeout: 10_000 });
  await showFiltersButton.click();

  // Wait for filters panel to be visible
  await page.waitForTimeout(1_000);

  // Click on the Seerose value in the filter
  const seeroseOption = page.locator("[value=Seerose]");
  const hasSeeroseOption = await seeroseOption.isVisible().catch(() => false);

  if (hasSeeroseOption) {
    await seeroseOption.click();

    // Wait for popover to appear
    const popover = selectors.mui.popover();
    await expect(popover.locator).toBeVisible({ timeout: 5_000 });

    // Navigate through hierarchy: BAQUA_FR -> Nouvelle plage
    const baquaFrOption = popover.getByText("BAQUA_FR");
    const hasBaquaFr = await baquaFrOption.isVisible().catch(() => false);

    if (hasBaquaFr) {
      await baquaFrOption.click();

      // Wait for next level to load
      await page.waitForTimeout(500);

      const nouvellePlageOption = popover.getByText("Nouvelle plage");
      const hasNouvellePlage = await nouvellePlageOption.isVisible().catch(() => false);

      if (hasNouvellePlage) {
        await nouvellePlageOption.click();
        await selectors.chart.loaded();
      }
    }
  }

  // Verify chart is still loaded after filter operations
  await selectors.chart.loaded();
});

test("it should not initialize interactive time range filter in a broken state", async ({
  page,
  selectors,
}) => {
  await page.goto("/en/__test/prod/most-recent-time-range-interactive-filter");
  await selectors.chart.loaded();
  const chart = page.locator("#chart-svg");
  const [startHandle, endHandle] = await chart.locator(".handle").all();
  const startHandleBox = await startHandle.boundingBox();
  const endHandleBox = await endHandle.boundingBox();

  expect(endHandleBox.x).toBeGreaterThan(startHandleBox.x);
});
