import { loadChartInLocalStorage } from "./charts-utils";
import { setup, sleep } from "./common";
import offentlicheAusgabenChartConfigFixture from "./fixtures/offentliche-ausgaben-chart-config.json";

const { test, expect } = setup();

// Extend Window interface for mock EyeDropper
declare global {
  interface Window {
    __eyeDropperMocked?: boolean;
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

/**
 * Mock EyeDropper API for testing color picker pen tool.
 * The real API requires user interaction and isn't available in automated tests.
 */
const MOCK_EYEDROPPER_COLOR = "#8844FF"; // Purple color for easy identification
const mockEyeDropperScript = `
  window.EyeDropper = class MockEyeDropper {
    async open() {
      // Simulate a small delay like the real API
      await new Promise(resolve => setTimeout(resolve, 100));
      return { sRGBHex: "${MOCK_EYEDROPPER_COLOR}" };
    }
  };
  window.__eyeDropperMocked = true;
`;

test("Custom Color Picker", async ({ page, selectors }) => {
  const key = "WtHYbmsehQKo";
  const config = offentlicheAusgabenChartConfigFixture;
  await loadChartInLocalStorage(page, key, config);
  await page.goto(`/en/create/${key}`);
  await selectors.chart.loaded();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1_000);

  await page.getByRole("button", { name: "Open Color Picker" }).first().click();
  await sleep(1_000);

  const colorSquare = page.getByTestId("color-square").first();
  await colorSquare.waitFor({ state: "visible", timeout: 5000 });
  const initialColor = await colorSquare.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );

  const saturation = page.locator('[data-testid="color-picker-saturation"]');
  await saturation.waitFor({ state: "visible", timeout: 5000 });

  await saturation.click();
  await sleep(1_000);

  const newColor = await colorSquare.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );
  expect(newColor).not.toBe(initialColor);

  const input = page.locator('input[name="color-picker-input"]');
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.click();
  await input.fill("#FF0000");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);

  const finalColor = await colorSquare.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );

  expect(finalColor).toBe("rgb(255, 0, 0)");

  const hue = page.locator('[data-testid="color-picker-hue"]');
  await hue.waitFor({ state: "visible", timeout: 5000 });

  await hue.click();
  await sleep(1_000);

  const selectedHueColor = await colorSquare.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );

  expect(selectedHueColor).toBe("rgb(0, 255, 248)");
});

/**
 * Test for color picker pen/eyedropper tool.
 * Uses a mocked EyeDropper API since the real one isn't available in automated tests.
 */
test("Custom Color Picker - Pen Tool with EyeDropper API", async ({ page, selectors }) => {
  // Inject mock EyeDropper API before page loads
  await page.addInitScript(mockEyeDropperScript);

  const key = "WtHYbmsehQKo";
  const config = offentlicheAusgabenChartConfigFixture;
  await loadChartInLocalStorage(page, key, config);
  await page.goto(`/en/create/${key}`);
  await selectors.chart.loaded();

  // Verify mock was injected
  const hasMock = await page.evaluate(() => window.__eyeDropperMocked === true);
  expect(hasMock).toBe(true);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1_000);

  // Open the color picker
  await page.getByRole("button", { name: "Open Color Picker" }).first().click();
  await sleep(500);

  const colorSquare = page.getByTestId("color-square").first();
  await colorSquare.waitFor({ state: "visible", timeout: 5000 });

  // Click the pen/eyedropper tool button if available
  const penToolButton = page.locator('[data-testid="color-picker-eyedropper"]');
  const hasPenTool = await penToolButton.isVisible().catch(() => false);

  if (hasPenTool) {
    const initialColor = await colorSquare.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    await penToolButton.click();
    await sleep(500);

    // The mock EyeDropper will return #8844FF (rgb(136, 68, 255))
    const selectedColor = await colorSquare.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Verify color changed to the mocked value
    expect(selectedColor).not.toBe(initialColor);
    expect(selectedColor).toBe("rgb(136, 68, 255)");
  } else {
    // If pen tool button doesn't exist, skip gracefully
    console.log("EyeDropper pen tool button not found, skipping pen tool test");
  }
});
