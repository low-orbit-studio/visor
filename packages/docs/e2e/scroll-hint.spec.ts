import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

const PAGE = "/docs/components/form/scroll-hint";

// VI-814: ScrollHint in the five looks. Glass off (Today, Dark, Light) draws a solid chip with no
// blur; in the Photo looks the pill is the page colour at 70% with the glass control blur, on a
// glass form panel. On honcho-backstage (a private theme, so that part skips on a public build)
// Today is the honcho theme.
const LOOKS: { id: string; label: string; photo: boolean; mode?: "light" | "dark" }[] = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

// Real Campout photos for the Photo looks, a night one behind Dark + Photo and a day one behind
// Light + Photo. Local review fixtures (seeded with review_station.py photo-fixtures), never
// committed; without them the frame shows no photo and the checks still hold.
const PHOTOS = "?photo-dark=/vi-814-photos/photo-1.webp&photo-light=/vi-814-photos/photo-2.webp";

async function openDocs(page: Page, mode: "light" | "dark", query = "") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(PAGE + query);
}

/** The look's frame once it shows the specimen on `theme`, with fonts loaded. */
async function lookFrame(grid: Locator, id: string, theme: string): Promise<Frame> {
  const iframe = grid.locator(`[data-look="${id}"] iframe`);
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${theme}\\b`), { timeout: 20_000 });
  const frame = (await (await iframe.elementHandle())!.contentFrame())!;
  await expect.poll(() => frame.url()).toContain(`theme=${theme}`);
  await frame.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="scroll-hint"]`, { state: "attached" });
  await expect(frame.locator("body")).toHaveClass(new RegExp(`\\b${theme}-theme\\b`));
  await frame.evaluate(() => document.fonts.ready.then(() => true));
  return frame;
}

interface Pill {
  show: boolean;
  opacity: string;
  filter: string;
  controlBlur: string;
  alpha: number;
  panelBlur: string;
}

function readPill(frame: Frame): Promise<Pill> {
  return frame.evaluate(() => {
    const hint = document.querySelector<HTMLElement>('[data-slot="scroll-hint"]')!;
    const pill = hint.querySelector("button")!;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const x = cv.getContext("2d")!;
    x.fillStyle = getComputedStyle(pill).backgroundColor;
    x.fillRect(0, 0, 1, 1);
    const cs = getComputedStyle(pill);
    const panel = document.querySelector('[data-slot="scroll-hint-form-panel"] [data-slot="glass-layer"]');
    return {
      show: hint.hasAttribute("data-show"),
      opacity: cs.opacity,
      filter: cs.backdropFilter,
      // Read through a probe so the theme's value is normalised the way the pill's is.
      controlBlur: (() => {
        const d = document.createElement("div");
        d.style.backdropFilter = "var(--glass-on-control-blur)";
        hint.appendChild(d);
        const f = getComputedStyle(d).backdropFilter;
        d.remove();
        return f;
      })(),
      alpha: x.getImageData(0, 0, 1, 1).data[3],
      panelBlur: panel ? getComputedStyle(panel).backdropFilter : "none",
    };
  });
}

async function checkLooks(grid: Locator, themeFor: (lookId: string) => string) {
  await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));
  for (const look of LOOKS) {
    await expect(async () => {
      const frame = await lookFrame(grid, look.id, themeFor(look.id));
      const p = await readPill(frame);
      // The box starts at its top with more below: the pill is shown and has risen in.
      expect(p.show).toBe(true);
      expect(p.opacity).toBe("1");
      if (look.photo) {
        expect(p.filter).toContain("blur(");
        expect(p.filter).toBe(p.controlBlur);
        expect(Math.abs(p.alpha - 0.7 * 255)).toBeLessThanOrEqual(1);
        // The form sits on a glass form panel, never straight on the photo.
        expect(p.panelBlur).toContain("blur(");
      } else {
        expect(p.filter).toBe("none");
        expect(p.alpha).toBe(255);
      }
    }).toPass({ timeout: 30_000 });
  }
}

for (const width of [1440, 390]) {
  test(`ScrollHint: five looks at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openDocs(page, "light");
    await checkLooks(page.locator('[data-slot="five-looks"]').first(), () => "neutral");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`ScrollHint on honcho-backstage: five looks at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openDocs(page, "light", PHOTOS);
    const section = page.locator('[data-slot="honcho-backstage-looks"]');
    test.skip((await section.count()) === 0, "honcho-backstage is a private theme; not installed in this build");
    await checkLooks(section.locator('[data-slot="five-looks"]'), (id) => (id === "today" ? "honcho" : "honcho-backstage"));
  });
}

// Show and hide with the scroll, and Keep Going, on the page's own demo.
test("ScrollHint: hides at the end of the box, and Keep Going focuses the next empty field", async ({ page }) => {
  await openDocs(page, "light");
  const demo = page.locator('[data-slot="scroll-hint-demo"]').first();
  const hint = demo.locator('[data-slot="scroll-hint"]');
  await expect(hint).toHaveAttribute("data-show", "");
  await demo.locator('[data-slot="scroll-hint-box"]').evaluate((b) => b.scrollTo({ top: b.scrollHeight }));
  await expect(hint).not.toHaveAttribute("data-show");
  await expect(hint.locator("button")).toHaveCSS("opacity", "0");
  await demo.locator('[data-slot="scroll-hint-box"]').evaluate((b) => b.scrollTo({ top: 0 }));
  await expect(hint).toHaveAttribute("data-show", "");
  // Fill what shows, so the next empty field sits below the fold.
  for (const name of ["Your Name", "Email", "Phone"]) await demo.getByLabel(name).fill("x");
  const button = demo.getByRole("button", { name: "Keep Going" });
  await button.click();
  await expect(demo.getByLabel("Arrival Day")).toBeFocused();
});
