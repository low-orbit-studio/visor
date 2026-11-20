import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-795: the glass page shows its specimen in all five looks, at 390 and 1440 wide,
// with the docs site in light and dark. Only the Photo looks turn glass on, and the
// plain looks render no backdrop-filter anywhere.
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const handle = await page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`).elementHandle();
  const frame = await handle!.contentFrame();
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="glass-specimen"]`);
  return frame!;
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Glass: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((m) => {
        localStorage.setItem("visor-theme", "neutral");
        localStorage.setItem("visor-color-mode", m);
        localStorage.setItem("theme", m);
      }, docsMode);
      await page.goto("/docs/themes/glass");

      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        const frame = await lookFrame(page, look.id);
        const panel = frame.locator('[data-slot="look-panel"]');
        await expect(panel).toHaveAttribute("data-mode", look.mode ?? docsMode);
        await expect(frame.locator("html")).toHaveClass(new RegExp(`\\b${look.mode ?? docsMode}\\b`));
        if (look.photo) {
          await expect(panel).toHaveAttribute("data-glass", "on");
          const blur = await frame
            .locator('[data-slot="glass-layer"]')
            .evaluate((el) => getComputedStyle(el).backdropFilter);
          expect(blur).toContain("blur(");
        } else {
          await expect(panel).not.toHaveAttribute("data-glass", /.*/);
          const offenders = await frame.evaluate(() => {
            const out: string[] = [];
            for (const el of document.querySelectorAll("*")) {
              for (const pseudo of [null, "::before", "::after"]) {
                if (getComputedStyle(el, pseudo).backdropFilter !== "none") out.push(el.tagName + (pseudo ?? ""));
              }
            }
            return out;
          });
          expect(offenders).toEqual([]);
        }
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
