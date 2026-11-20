import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-810: Stepper's rail variant on its docs page, in all five looks, at 390 and
// 1440 wide, with the docs site in light and dark. A plain look draws theme ink
// with no glass and no shadow; a Photo look draws the glass ink with its shadow.
const PAGE = "/docs/components/navigation/stepper";
const THEME = process.env.VISOR_LOOK_THEME ?? "neutral";
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
  await page.goto(PAGE);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme
  // after hydration. Read only the final document.
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${THEME}`), { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain(`theme=${THEME}`);
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-variant="rail"][data-slot="stepper"]`);
  return frame!;
}

/** Computed styles of the rail, read in the frame's document. */
function readRail(frame: Frame) {
  return frame.evaluate((states) => {
    const rail = document.querySelector('[data-slot="look-panel"] [data-slot="stepper"][data-variant="rail"]')!;
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
    };
  }, STATES);
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Stepper rail: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);

      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const rail = await readRail(frame);

          // Nothing in the rail ever blurs the photo.
          expect(rail.blurred).toBe(0);
          if (look.photo) {
            // Over a photo: the glass layer's ink, with its shadow under every label.
            expect(rail.color.active).toBe(rail.glassInk);
            for (const s of STATES) expect(rail.shadow[s]).not.toBe("none");
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
        }).toPass({ timeout: 20_000 });
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
