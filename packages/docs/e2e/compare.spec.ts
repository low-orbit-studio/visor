import { test, expect } from "@playwright/test";

test.describe("Theme Comparator", () => {
  test("/compare page renders without errors", async ({ page }) => {
    await page.goto("/compare");
    await page.waitForLoadState("networkidle");

    // Page title should be visible
    await expect(page.locator("h1")).toContainText("Theme Comparator");

    // All 4 iframes should be present
    const iframes = page.locator("iframe");
    await expect(iframes).toHaveCount(4);
  });

  test("changing theme dropdowns updates iframe src", async ({ page }) => {
    await page.goto("/compare");
    await page.waitForLoadState("networkidle");

    // Get initial iframe srcs
    const firstIframe = page.locator("iframe").first();
    const initialSrc = await firstIframe.getAttribute("src");
    expect(initialSrc).toContain("theme=space");

    // Change top-left theme to blackout via the first select
    const firstTrigger = page.locator('[role="combobox"]').first();
    await firstTrigger.click();
    await page.locator('[role="option"]').filter({ hasText: "Blackout" }).click();

    // Verify iframe src updated
    const updatedSrc = await firstIframe.getAttribute("src");
    expect(updatedSrc).toContain("theme=blackout");
  });

  test("URL params round-trip correctly", async ({ page }) => {
    // Navigate with specific params
    await page.goto(
      "/compare?tl=kaiah&tlMode=dark&tr=blackout&trMode=light&bl=neutral&blMode=dark&br=space&brMode=light"
    );
    await page.waitForLoadState("networkidle");

    const iframes = page.locator("iframe");

    // Check each iframe has the correct theme/mode
    await expect(iframes.nth(0)).toHaveAttribute(
      "src",
      "/compare/panel?theme=kaiah&mode=dark"
    );
    await expect(iframes.nth(1)).toHaveAttribute(
      "src",
      "/compare/panel?theme=blackout&mode=light"
    );
    await expect(iframes.nth(2)).toHaveAttribute(
      "src",
      "/compare/panel?theme=neutral&mode=dark"
    );
    await expect(iframes.nth(3)).toHaveAttribute(
      "src",
      "/compare/panel?theme=space&mode=light"
    );
  });

  test("panel route renders specimen with correct theme class on body", async ({
    page,
  }) => {
    await page.goto("/compare/panel?theme=kaiah&mode=dark");
    await page.waitForLoadState("networkidle");

    // Wait for the client-side effect to apply the theme class
    await page.waitForFunction(
      () => document.body.classList.contains("kaiah-theme"),
      { timeout: 10000 }
    );

    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain("kaiah-theme");

    // Check html has dark class
    const htmlClass = await page.evaluate(
      () => document.documentElement.className
    );
    expect(htmlClass).toContain("dark");

    // Specimen content should be visible
    await expect(page.locator("#specimen-colors")).toBeVisible();
  });
});
