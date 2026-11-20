import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-811: the PhotoBackdrop page shows it in all five looks, at 390 and 1440 wide, with
// the docs site in light and dark. It renders nothing in Today, Dark and Light, and in
// the Photo looks it draws the photo and its container turns glass on.
const PAGE = "/docs/components/data-display/photo-backdrop";
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false },
  { id: "dark-photo", label: "Dark + Photo", photo: true },
  { id: "light", label: "Light", photo: false },
  { id: "light-photo", label: "Light + Photo", photo: true },
];

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const handle = await page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`).elementHandle();
  const frame = await handle!.contentFrame();
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="photo-backdrop-specimen"]`);
  return frame!;
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`PhotoBackdrop: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((m) => {
        localStorage.setItem("visor-theme", "neutral");
        localStorage.setItem("visor-color-mode", m);
        localStorage.setItem("theme", m);
      }, docsMode);
      await page.goto(PAGE);

      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        const frame = await lookFrame(page, look.id);
        const backdrop = frame.locator('[data-slot="photo-backdrop"]');
        if (look.photo) {
          await expect(backdrop).toHaveCount(1);
          await expect(backdrop.locator('[data-slot="photo-backdrop-layer"][data-ready]')).toHaveCount(1);
          const blur = await frame
            .locator('[data-slot="glass-layer"]')
            .evaluate((el) => getComputedStyle(el).backdropFilter);
          expect(blur).toContain("blur(");
        } else {
          await expect(backdrop).toHaveCount(0);
          await expect(frame.locator('[data-slot="glass-layer"]')).toBeHidden();
        }
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test("PhotoBackdrop: Next Photo crossfades to the other photo and drops the old layer", async ({ page }) => {
  await page.goto(PAGE);
  const frame = await lookFrame(page, "dark-photo");
  await page.locator('[data-slot="five-looks"] [data-look="dark-photo"] iframe').scrollIntoViewIfNeeded();
  const layers = frame.locator('[data-slot="photo-backdrop-layer"]');
  await expect(layers.locator("img")).toHaveAttribute("src", /./);
  const first = await layers.locator("img").getAttribute("src");
  await frame.getByRole("button", { name: "Next Photo" }).click();
  await expect(layers).toHaveCount(1, { timeout: 10_000 });
  await expect(layers.locator("img")).not.toHaveAttribute("src", first!);
});
