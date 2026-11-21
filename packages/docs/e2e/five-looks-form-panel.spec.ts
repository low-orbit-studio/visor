import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-829: in the photo looks, every form control sits on a glass form panel, never straight on
// the photo; the photo is a real one (a private theme's photos/{dark,light}.*) wherever the private
// themes are installed; stacked tiles keep a real gap; and the plain looks draw no panel at all.
// The stock theme CI has; LOOKS_THEME=honcho-backstage draws the kit's looks locally.
const THEME = process.env.LOOKS_THEME ?? "neutral";
// Every specimen with form controls or tiles (the spinner has neither). Add new ones here.
const SPECIMENS = ["theme", "button", "number-input", "alert", "glass", "key-value-list", "card"];
const PHOTO_LOOKS = [
  { id: "dark-photo", mode: "dark" },
  { id: "light-photo", mode: "light" },
] as const;
const MIN_TILE_GAP = 12;

/** What a photo look draws: its controls off a panel, its backdrop and the gaps between stacked tiles. */
const probe = (frame: Frame) =>
  frame.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-slot="look-panel"]')!;
    // A panel draws its glass on an aria-hidden layer among its children (the glass recipe).
    const isPanel = (el: Element) =>
      [...el.children].some(
        (k) => k.getAttribute("aria-hidden") === "true" && getComputedStyle(k).backdropFilter.includes("blur("),
      );
    const controls = root.querySelectorAll(
      'input, button, textarea, select, [data-slot="alert"], [role="switch"], [role="radio"], [role="checkbox"]',
    );
    const bare: string[] = [];
    for (const control of controls) {
      let el: Element | null = control;
      while (el && el !== root && !isPanel(el)) el = el.parentElement;
      if (!el || el === root) bare.push(control.outerHTML.slice(0, 120));
    }
    // Tiles: glass panels, plus the surfaces that carry their own glass (alerts, the Facts panel).
    const tiles = [...root.querySelectorAll("*")].filter(
      (el) => isPanel(el) || el.matches('[data-slot="alert"], [data-demo="facts"]'),
    );
    const gaps: { gap: number; a: string; b: string }[] = [];
    for (const a of tiles) {
      for (const b of tiles) {
        if (a === b || a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const sideBySide = rb.left >= ra.right || ra.left >= rb.right;
        if (sideBySide || rb.top < ra.top) continue;
        gaps.push({ gap: rb.top - ra.bottom, a: a.className.toString(), b: b.className.toString() });
      }
    }
    // A panel the look's frame cuts off: its bottom or right edge past the viewport.
    const clipped = tiles
      .map((t) => t.getBoundingClientRect())
      .filter((r) => r.bottom > window.innerHeight + 0.5 || r.right > window.innerWidth + 0.5).length;
    return { controls: controls.length, bare, gaps, clipped, backdrop: getComputedStyle(root).backgroundImage };
  });

async function privateThemesInstalled(page: Page) {
  return (await page.request.get("/themes/private")).status() === 200;
}

function expectOnPanels(look: (typeof PHOTO_LOOKS)[number], result: Awaited<ReturnType<typeof probe>>, real: boolean) {
  expect(result.controls).toBeGreaterThan(0);
  expect(result.bare).toEqual([]);
  for (const g of result.gaps) expect(g.gap, `${g.a} → ${g.b}`).toBeGreaterThanOrEqual(MIN_TILE_GAP);
  expect(result.clipped, "panels cut off by the frame").toBe(0);
  if (real) {
    // A real photo for the tone, never the gradient stand-in.
    expect(result.backdrop).toContain(`/photos/${look.mode}.`);
    expect(result.backdrop).not.toContain("data:image/svg");
  }
}

for (const width of [1440, 390]) {
  test(`Form panel: every specimen's controls sit on glass in the photo looks at ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const real = await privateThemesInstalled(page);
    for (const specimen of SPECIMENS) {
      for (const look of PHOTO_LOOKS) {
        await page.goto(`/looks/panel?theme=${THEME}&look=${look.id}&specimen=${specimen}`);
        await expect(page.locator(`body.${THEME}-theme`)).toHaveCount(1);
        await expect(page.locator('[data-slot="look-panel"]')).toHaveAttribute("data-glass", "on");
        expectOnPanels(look, await probe(page.mainFrame()), real);
      }
    }
  });
}

test("Form panel: the plain looks draw no panel, so they are unchanged", async ({ page }) => {
  for (const specimen of ["theme", "button", "number-input"]) {
    for (const look of ["today", "dark", "light"]) {
      await page.goto(`/looks/panel?theme=${THEME}&look=${look}&specimen=${specimen}`);
      await expect(page.locator(`body.${THEME}-theme`)).toHaveCount(1);
      const panel = page.locator('[data-slot="look-form-panel"]');
      await expect(panel).toHaveCSS("padding-top", "0px");
      await expect(panel).toHaveCSS("position", "static");
      await expect(panel.locator('[data-slot="glass-layer"]')).toHaveCSS("display", "none");
    }
  }
});

// The grids the operator reviews: Honcho's five looks, and two components' In Five Looks grids.
const GRIDS = [
  { path: "/themes/private", theme: "honcho-backstage", private: true },
  { path: "/docs/components/form/number-input", theme: THEME, private: false },
  { path: "/docs/components/general/button", theme: THEME, private: false },
];

for (const grid of GRIDS) for (const width of [1440, 390]) {
  test(`Form panel: ${grid.path} photo looks put their controls on glass at ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const real = await privateThemesInstalled(page);
    test.skip(grid.private && !real, "the private themes are not installed");
    await page.addInitScript((theme) => localStorage.setItem("visor-theme", theme), THEME);
    await page.goto(grid.path);
    for (const look of PHOTO_LOOKS) {
      const iframe = page.locator(`[data-slot="five-looks"] [data-look="${look.id}"] iframe`);
      await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${grid.theme}`), { timeout: 20_000 });
      await expect(async () => {
        const frame = (await (await iframe.elementHandle())!.contentFrame())!;
        expect(frame.url()).toContain(`theme=${grid.theme}`);
        await frame.waitForSelector(`body.${grid.theme}-theme [data-slot="look-panel"][data-glass="on"]`);
        expectOnPanels(look, await probe(frame), real);
      }).toPass({ timeout: 20_000 });
    }
  });
}
