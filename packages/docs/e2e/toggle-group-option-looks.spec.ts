import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-806: the docs ToggleGroup page shows option rows with descriptions (and, in the
// single group, the round mark) in all five looks, at 390 and 1440 wide, with the docs
// site in light and dark: 20 shots into .visor/renders/VI-806/. VISOR_LOOKS_THEME picks
// the docs theme (neutral by default, as CI has no private themes).
const PAGE = "/docs/components/form/toggle-group";
const THEME = process.env.VISOR_LOOKS_THEME ?? "neutral";
const OUT = join(__dirname, "..", "..", "..", ".visor", "renders", "VI-806");
const LOOKS = [
  { id: "today", photo: false },
  { id: "dark", photo: false, mode: "dark" },
  { id: "dark-photo", photo: true, mode: "dark" },
  { id: "light", photo: false, mode: "light" },
  { id: "light-photo", photo: true, mode: "light" },
];

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript(
    ([theme, m]) => {
      localStorage.setItem("visor-theme", theme);
      localStorage.setItem("visor-color-mode", m);
      localStorage.setItem("theme", m);
    },
    [THEME, mode],
  );
  await page.goto(PAGE);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme after hydration.
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${THEME}`), { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain(`theme=${THEME}`);
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="toggle-group-description"]`);
  return frame!;
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`ToggleGroup option rows: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      mkdirSync(OUT, { recursive: true });
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      await expect(page.locator('[data-slot="five-looks"] figcaption')).toHaveText([
        "Today",
        "Dark",
        "Dark + Photo",
        "Light",
        "Light + Photo",
      ]);

      for (const look of LOOKS) {
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const single = frame.locator('[data-slot="toggle-group"][data-type="single"]');
          const multiple = frame.locator('[data-slot="toggle-group"][data-type="multiple"]');
          await expect(single.locator('[data-slot="toggle-group-description"]')).toHaveCount(2);
          await expect(single.locator('[data-slot="toggle-group-mark"]')).toHaveCount(2);
          await expect(multiple.locator('[data-slot="toggle-group-description"]')).toHaveCount(2);
          await expect(multiple.locator('[data-slot="toggle-group-mark"]')).toHaveCount(0);

          // The picked mark fills with the theme's key, and the rows blur only over the photo.
          const read = await frame.evaluate(() => {
            const mark = document.querySelector('[data-state="on"] [data-slot="toggle-group-mark"]')!;
            const probe = document.createElement("i");
            probe.style.color = "var(--interactive-primary-bg)";
            mark.appendChild(probe);
            const key = getComputedStyle(probe).color;
            probe.remove();
            const rows = [...document.querySelectorAll('[data-slot="toggle-group-item"]')];
            return {
              mark: getComputedStyle(mark).backgroundColor,
              key,
              blurred: rows.filter((r) => getComputedStyle(r).backdropFilter !== "none").length,
              rows: rows.length,
            };
          });
          expect(read.mark).toBe(read.key);
          expect(read.blurred).toBe(look.photo ? read.rows : 0);
        }).toPass({ timeout: 30_000 });

        const figure = page.locator(`[data-slot="five-looks"] [data-look="${look.id}"]`);
        await figure.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        await figure.screenshot({ path: join(OUT, `${THEME}__${look.id}__docs-${docsMode}__${width}.png`) });
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
