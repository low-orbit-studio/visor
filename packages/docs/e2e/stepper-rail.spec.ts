import { mkdirSync } from "node:fs";
import path from "node:path";
import { test, expect, type Frame, type Locator, type Page, type TestInfo } from "@playwright/test";

// VI-810: Stepper's rail variant on its docs page, in all five looks, at 390 and
// 1440 wide, with the docs site in light and dark. A plain look draws theme ink
// on a solid card with no glass and no shadow; a Photo look puts the rail on a
// glass form panel and draws the glass ink with its shadow.
const PAGE = "/docs/components/navigation/stepper";
const THEME = process.env.VISOR_LOOK_THEME ?? "neutral";
// Real Campout photos for the Photo looks, a night one behind Dark + Photo and a day one behind
// Light + Photo. Local review fixtures (seeded with review_station.py photo-fixtures), never
// committed; without them the frame shows no photo and the checks still hold.
const PHOTOS = "?photo-dark=/vi-810-photos/night/photo-1.webp&photo-light=/vi-810-photos/day/photo-1.webp";
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];
const STATES = ["complete", "active", "upcoming", "locked"] as const;

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript(
    ({ m, theme }) => {
      localStorage.setItem("visor-theme", theme);
      localStorage.setItem("visor-color-mode", m);
      localStorage.setItem("theme", m);
    },
    { m: mode, theme: THEME },
  );
  await page.goto(PAGE + PHOTOS);
}

/** The look's frame once it shows the rail on `theme`, with fonts and the photo loaded. */
async function lookFrame(grid: Locator, id: string, theme: string): Promise<Frame> {
  const iframe = grid.locator(`[data-look="${id}"] iframe`);
  // The docs-picked frames first render on the default theme, then reload on the docs theme
  // after hydration. Read only the final document.
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${theme}\\b`), { timeout: 20_000 });
  const frame = (await (await iframe.elementHandle())!.contentFrame())!;
  await expect.poll(() => frame.url()).toContain(`theme=${theme}`);
  await frame.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-variant="rail"][data-slot="stepper"]`);
  await expect(frame.locator("body")).toHaveClass(new RegExp(`\\b${theme}-theme\\b`));
  // The dev server's badge draws inside each frame too; keep it out of the hand-back frames.
  await frame.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await frame.evaluate(async () => {
    await document.fonts.ready;
    const src = new URLSearchParams(location.search).get("photo");
    if (!src) return;
    const img = new Image();
    img.src = src;
    await img.decode().catch(() => {});
  });
  return frame;
}

/** Computed styles of the rail and its panel, read in the frame's document. */
function readRail(frame: Frame) {
  return frame.evaluate((states) => {
    const rail = document.querySelector('[data-slot="look-panel"] [data-slot="stepper"][data-variant="rail"]')!;
    const panel = document.querySelector('[data-slot="stepper-rail-panel"]')!;
    const panelGlass = panel.querySelector(":scope > span[aria-hidden]")!;
    const resolve = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      rail.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    const trigger = (s: string) => rail.querySelector(`[data-slot="stepper-trigger"][data-status="${s}"]`)!;
    const mark = (s: string) => trigger(s).querySelector('[aria-hidden="true"]')!;
    const all = [rail, ...rail.querySelectorAll("*")];
    return {
      color: Object.fromEntries(states.map((s) => [s, getComputedStyle(trigger(s)).color])),
      shadow: Object.fromEntries(states.map((s) => [s, getComputedStyle(trigger(s)).textShadow])),
      markWidth: Object.fromEntries(states.map((s) => [s, mark(s).getBoundingClientRect().width])),
      blurred: all.filter((el) => getComputedStyle(el).backdropFilter !== "none").length,
      shadowed: all.filter((el) => getComputedStyle(el).textShadow !== "none").length,
      textPrimary: resolve("var(--text-primary)"),
      glassInk: resolve("var(--glass-on-ink)"),
      panelInk: getComputedStyle(panel).color,
      panelGlass: getComputedStyle(panelGlass).display,
      panelBlur: getComputedStyle(panelGlass).backdropFilter,
    };
  }, STATES);
}

/** One hand-back frame per look and width, into `.visor/renders/vi-810/<set>/` (gitignored). */
async function saveFrame(grid: Locator, lookId: string, set: string, width: number, testInfo: TestInfo) {
  const dir = path.resolve(testInfo.config.rootDir, "../../../.visor/renders/vi-810", set);
  mkdirSync(dir, { recursive: true });
  const target = grid.locator(`[data-look="${lookId}"]`);
  await target.scrollIntoViewIfNeeded();
  const file = path.join(dir, `${lookId}-${width}.png`);
  // LO_CLEAN_CAPTURE points at the Playbook's clean-capture.mjs for a stamped review shot.
  const clean = process.env.LO_CLEAN_CAPTURE;
  if (clean) await (await import(clean)).cleanShot(grid.page(), { path: file, target });
  else await target.screenshot({ path: file, animations: "disabled", caret: "hide" });
}

async function checkLooks(page: Page, grid: Locator, set: string, width: number, docsMode: "light" | "dark", themeOf: (id: string) => string, testInfo: TestInfo) {
  await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

  for (const look of LOOKS) {
    const theme = themeOf(look.id);
    // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
    await expect(async () => {
      const frame = await lookFrame(grid, look.id, theme);
      await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
      const rail = await readRail(frame);

      // Nothing in the rail ever blurs; the panel behind it carries the glass, and only over a photo.
      expect(rail.blurred).toBe(0);
      expect(rail.panelGlass).toBe(look.photo ? "block" : "none");
      if (look.photo) {
        expect(rail.panelBlur).toContain("blur(");
        // On the glass panel: the panel's own glass ink, with its shadow under every label.
        expect(rail.color.active).toBe(rail.glassInk);
        expect(rail.color.active).toBe(rail.panelInk);
        for (const s of STATES) expect(rail.shadow[s]).not.toBe("none");
        // Light + Photo's panel is a light glass, so the rail is the theme's dark ink, never white on it
        // (VI-810 conductor ruling rail-light-photo-ink-on-glass-panel, superseding white-on-photo).
        if (look.id === "light-photo") {
          expect(rail.color.active).toBe(rail.textPrimary);
          expect(rail.color.active).not.toBe("rgb(255, 255, 255)");
        }
      } else {
        // Glass off: theme ink, no shadow anywhere.
        expect(rail.shadowed).toBe(0);
        expect(rail.color.active).toBe(rail.textPrimary);
        if ((look.mode ?? docsMode) === "light") expect(rail.color.active).not.toBe("rgb(255, 255, 255)");
      }
      // The four states read differently, and the current mark is the stretched one.
      expect(new Set(Object.values(rail.color)).size).toBe(STATES.length);
      expect(rail.markWidth.active).toBeGreaterThan(rail.markWidth.complete);

      const overflow = await frame.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }).toPass({ timeout: 30_000 });

    // Ten frames per set (five looks × two widths), shot with the docs in light.
    if (docsMode === "light") await saveFrame(grid, look.id, set, width, testInfo);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Stepper rail: five looks at ${width} with the docs in ${docsMode}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      const grid = page.locator('[data-slot="five-looks"]').first();
      await checkLooks(page, grid, THEME, width, docsMode, () => THEME, testInfo);
    });

    test(`Stepper rail on honcho-backstage: five looks at ${width} with the docs in ${docsMode}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      const section = page.locator('[data-slot="honcho-backstage-looks"]');
      test.skip((await section.count()) === 0, "honcho-backstage is a private theme; not installed in this build");
      const grid = section.locator('[data-slot="five-looks"]');
      await checkLooks(page, grid, "honcho-backstage", width, docsMode, (id) => (id === "today" ? "honcho" : "honcho-backstage"), testInfo);
    });
  }
}
