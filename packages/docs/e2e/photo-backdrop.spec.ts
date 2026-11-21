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

// The panel the review link opens. Click only once the first photo has settled, so the next one
// has been preloaded and is ready the moment it mounts: that case once dropped the new layer, so
// Next Photo did nothing.
for (const look of ["dark-photo", "light-photo"]) {
  test(`PhotoBackdrop: Next Photo crossfades to the other photo in ${look}`, async ({ page }) => {
    await page.goto(`/looks/panel?theme=neutral&look=${look}&specimen=photo-backdrop`);
    const layers = page.locator('[data-slot="photo-backdrop-layer"]');
    await expect(layers).toHaveCount(1);
    await expect(layers).toHaveAttribute("data-ready", "");
    const first = await layers.locator("img").getAttribute("src");
    await expect.poll(() => layers.evaluate((el) => el.getAnimations().length), { timeout: 10_000 }).toBe(0);

    await page.getByRole("button", { name: "Next Photo" }).click();
    await expect(layers).toHaveCount(2);
    const top = layers.nth(1);
    await expect(layers.nth(0).locator("img")).toHaveAttribute("src", first!);
    await expect(top.locator("img")).not.toHaveAttribute("src", first!);
    await expect(top).toHaveAttribute("data-ready", "");
    // Mid-crossfade: the new photo is part-way in over the old one.
    const opacity = await top.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThanOrEqual(0);
    expect(opacity).toBeLessThan(1);
    await expect(top).toHaveCSS("animation-name", /photo-backdrop-fade/);

    // Settled: the old layer goes and the other photo is the only one left.
    await expect(layers).toHaveCount(1, { timeout: 10_000 });
    await expect(layers.locator("img")).not.toHaveAttribute("src", first!);
    await expect(layers).toHaveCSS("opacity", "1");
  });
}
