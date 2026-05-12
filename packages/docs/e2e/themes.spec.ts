/**
 * Per-theme visual regression suite (VI-357).
 *
 * Goal: catch font/weight/color drifts before they ship. Every regression of
 * the past few months (Blacklight `--font-heading` mapping, cross-theme
 * `@font-face` collisions, hardcoded weight rows, the visor-themes-private
 * pinned-version staleness) showed up first on the docs specimen — but only
 * because a human happened to be looking. This suite makes the docs specimen
 * the actual gate.
 *
 * The theme list is built dynamically at test-load time:
 *   - stock themes come from `lib/theme-config.ts` (STOCK_GROUPS)
 *   - private themes come from `lib/private-themes.generated.ts`
 *     (empty stub when @low-orbit-studio/visor-themes-private is absent)
 *
 * Each theme produces two snapshots — light and dark mode — captured against
 * `/compare/panel?theme=<slug>&mode=<mode>`. The panel route renders the full
 * design-system specimen with theme classes applied and no docs chrome.
 *
 * Update baselines: `npm run test:vr:update -w packages/docs`
 * See: packages/docs/e2e/README.md
 */
import { test, expect, type Page } from "@playwright/test";
import { STOCK_GROUPS } from "../lib/theme-config";
import { PRIVATE_THEMES } from "../lib/private-themes";

type ThemeMode = "light" | "dark";

interface ThemeTarget {
  slug: string;
  label: string;
  group: string;
  modes: ThemeMode[];
}

function buildThemeTargets(): ThemeTarget[] {
  const targets: ThemeTarget[] = [];

  for (const group of STOCK_GROUPS) {
    for (const theme of group.themes) {
      // Honour `defaultMode` when a stock theme declares it (dark-only themes
      // like Blackout, light-only themes like Borderless if/when they appear).
      // Otherwise cover both modes.
      const modes: ThemeMode[] = theme.defaultMode
        ? [theme.defaultMode]
        : ["light", "dark"];
      targets.push({
        slug: theme.value,
        label: theme.label,
        group: group.label,
        modes,
      });
    }
  }

  for (const theme of PRIVATE_THEMES) {
    // The private manifest carries no mode metadata today — assume both.
    targets.push({
      slug: theme.slug,
      label: theme.label,
      group: theme.group,
      modes: ["light", "dark"],
    });
  }

  return targets;
}

async function waitForFonts(page: Page) {
  // Web fonts load asynchronously; without this wait Chromium may rasterize
  // the snapshot before the theme's heading/body fonts swap in, producing a
  // noisy diff on every run. `document.fonts.ready` resolves when all
  // currently-pending font loads finish.
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

const targets = buildThemeTargets();

test.describe("per-theme visual regression", () => {
  // Fail loud if discovery breaks — better than a green CI with zero coverage.
  test("discovers at least the five stock themes", () => {
    const slugs = targets.map((t) => t.slug);
    expect(slugs).toEqual(expect.arrayContaining([
      "blackout",
      "borderless",
      "modern-minimal",
      "neutral",
      "space",
    ]));
  });

  for (const target of targets) {
    test.describe(`${target.group} / ${target.label}`, () => {
      for (const mode of target.modes) {
        test(`${target.slug} ${mode}`, async ({ page }) => {
          await page.goto(`/compare/panel?theme=${target.slug}&mode=${mode}`);
          await page.waitForLoadState("networkidle");

          // The panel page applies the theme class in a useEffect — wait for
          // that to flush before taking the screenshot so we don't snapshot a
          // half-themed flash.
          await page.waitForFunction(
            (slug) => document.body.classList.contains(`${slug}-theme`),
            target.slug,
            { timeout: 10_000 },
          );

          await waitForFonts(page);

          await expect(page).toHaveScreenshot(
            `${target.slug}-${mode}.png`,
            { fullPage: true },
          );
        });
      }
    });
  }
});
