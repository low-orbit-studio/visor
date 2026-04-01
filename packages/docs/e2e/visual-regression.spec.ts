import { test, expect, Page } from "@playwright/test";

const THEMES = [
  "blackout",
  "neutral",
  "space",
  "blacklight-brand",
  "kaiah",
  "reference-app",
] as const;

const MODES = ["light", "dark"] as const;

const PAGES = [
  { name: "home", path: "/" },
  { name: "docs", path: "/docs" },
  { name: "specimen", path: "/docs/blocks/design-system-specimen" },
  { name: "components", path: "/docs/components" },
] as const;

const ALL_THEME_CLASSES = THEMES.map((t) => `${t}-theme`);

async function applyTheme(page: Page, theme: string, mode: string) {
  await page.evaluate(
    ({ theme, mode, allClasses }) => {
      // Set localStorage
      localStorage.setItem("visor-theme", theme);

      // Remove all theme classes, add the target one
      for (const cls of allClasses) {
        document.body.classList.remove(cls);
      }
      document.body.classList.add(`${theme}-theme`);

      // Toggle dark mode on html element
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Dispatch theme change event
      document.dispatchEvent(new CustomEvent("visor-theme-change"));
    },
    { theme, mode, allClasses: ALL_THEME_CLASSES }
  );

  // Wait for styles to settle
  await page.waitForLoadState("networkidle");
}

for (const pageEntry of PAGES) {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      test(`${pageEntry.name} — ${theme} ${mode}`, async ({ page }) => {
        // Navigate to the page
        await page.goto(pageEntry.path);
        await page.waitForLoadState("networkidle");

        // Apply theme and mode
        await applyTheme(page, theme, mode);

        // Capture and compare screenshot
        await expect(page).toHaveScreenshot(
          `${pageEntry.name}-${theme}-${mode}.png`,
          {
            fullPage: true,
            // Allow minor anti-aliasing differences across runs
            maxDiffPixelRatio: 0.01,
          }
        );
      });
    }
  }
}
