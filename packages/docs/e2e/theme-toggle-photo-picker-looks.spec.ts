import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

// VI-816: ThemeToggle and PhotoPicker in the five looks, from the theme alone. The toggle is
// solid (no blur, theme surface and ink) in Today, Dark and Light, and takes the glass layer's
// control fill, ink and blur in the two Photo looks. The chosen thumbnail wears the theme's key
// colour. The honcho-backstage half skips where the private themes are not installed (CI).
const LOOKS: { id: string; photo: boolean; mode?: "light" | "dark" }[] = [
  { id: "today", photo: false },
  { id: "dark", photo: false, mode: "dark" },
  { id: "dark-photo", photo: true, mode: "dark" },
  { id: "light", photo: false, mode: "light" },
  { id: "light-photo", photo: true, mode: "light" },
];

const PAGES = {
  toggle: { path: "/docs/components/general/theme-toggle", specimen: "theme-toggle-specimen" },
  picker: { path: "/docs/components/form/photo-picker", specimen: "photo-picker-panel" },
} as const;

// Real Campout photos for local review (seeded with review_station.py photo-fixtures, never
// committed): a night photo behind Dark + Photo, a day one behind Light + Photo, and thumbnails.
// Without them the frames fall back to the stand-ins and every check still holds.
const P = "/vi-816-photos";
const PHOTOS = `?photo-dark=${P}/night.webp&photo-light=${P}/day.webp&thumbs=${[1, 2, 3, 4, 5, 6].map((i) => `${P}/photo-${i}.webp`).join(",")}`;

async function openDocs(page: Page, path: string, mode: "light" | "dark") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(path + PHOTOS);
}

async function lookFrame(grid: Locator, id: string, theme: string, specimen: string): Promise<Frame> {
  const iframe = grid.locator(`[data-look="${id}"] iframe`);
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${theme}\\b`), { timeout: 20_000 });
  const frame = (await (await iframe.elementHandle())!.contentFrame())!;
  await expect.poll(() => frame.url()).toContain(`theme=${theme}`);
  await frame.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="${specimen}"]`);
  await expect(frame.locator("body")).toHaveClass(new RegExp(`\\b${theme}-theme\\b`));
  await frame.evaluate(() => document.fonts.ready.then(() => true));
  return frame;
}

interface Read {
  filter: string;
  bg: string;
  ink: string;
  surface: string;
  text: string;
  controlFill: string;
  controlInk: string;
  controlBlur: string;
  chosenShadow: string;
  key: string;
  greys: string[];
}

/** The toggle's or the chosen thumbnail's computed look, and the theme values it should equal. */
function readLook(frame: Frame): Promise<Read> {
  return frame.evaluate(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d")!;
    const px = (c: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data.join(",");
    };
    const host = document.querySelector('[data-slot="look-panel"]') as HTMLElement;
    const probe = (value: string) => {
      const d = document.createElement("div");
      d.style.color = value;
      host.appendChild(d);
      const out = getComputedStyle(d).color;
      d.remove();
      return out;
    };
    const toggle = document.querySelector('[data-slot="theme-toggle"]') as HTMLElement | null;
    const chosen = document.querySelector('[data-slot="photo-picker"] [aria-pressed="true"]') as HTMLElement | null;
    const cs = toggle ? getComputedStyle(toggle) : null;
    // Visor's default greys must not show through in a themed look (BO-86 scan).
    const GREYS = ["31,41,55", "55,65,81", "75,85,99", "17,24,39", "249,250,251", "243,244,246", "229,231,235", "209,213,219"];
    const greys: string[] = [];
    for (const el of [toggle, chosen].filter(Boolean) as HTMLElement[]) {
      const s = getComputedStyle(el);
      for (const v of [s.backgroundColor, s.color]) if (GREYS.some((g) => v.startsWith(`rgb(${g.replaceAll(",", ", ")})`))) greys.push(v);
    }
    return {
      filter: cs?.backdropFilter ?? "",
      bg: cs ? px(cs.backgroundColor) : "",
      ink: cs ? px(cs.color) : "",
      surface: px(probe("var(--surface-subtle)")),
      text: px(probe("var(--text-primary)")),
      controlFill: px(probe("var(--glass-on-control-fill)")),
      controlInk: px(probe("var(--glass-on-control-ink)")),
      controlBlur: (() => {
        const d = document.createElement("div");
        d.style.backdropFilter = "var(--glass-on-control-blur, none)";
        host.appendChild(d);
        const out = getComputedStyle(d).backdropFilter;
        d.remove();
        return out;
      })(),
      chosenShadow: chosen ? getComputedStyle(chosen).boxShadow : "",
      key: probe("var(--interactive-primary-bg)"),
      greys,
    };
  });
}

async function checkLooks(grid: Locator, which: keyof typeof PAGES, themeFor: (id: string) => string, docsMode: "light" | "dark") {
  for (const look of LOOKS) {
    await expect(async () => {
      const frame = await lookFrame(grid, look.id, themeFor(look.id), PAGES[which].specimen);
      await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
      const r = await readLook(frame);
      if (which === "toggle") {
        if (look.photo) {
          expect(r.controlBlur).toContain("blur(");
          expect(r.filter).toBe(r.controlBlur);
          expect(r.bg, "glass control fill").toBe(r.controlFill);
          expect(r.ink, "glass control ink").toBe(r.controlInk);
        } else {
          expect(r.filter).toBe("none");
          expect(r.bg, "theme surface").toBe(r.surface);
          expect(r.ink, "theme ink").toBe(r.text);
        }
      } else {
        expect(r.chosenShadow, "chosen ring = key colour").toContain(r.key);
      }
      if (themeFor(look.id) !== "neutral") expect(r.greys, "no Visor default grey").toEqual([]);
    }).toPass({ timeout: 30_000 });
  }
}

for (const which of ["toggle", "picker"] as const) {
  for (const width of [1440, 390]) {
    for (const docsMode of ["light", "dark"] as const) {
      test(`${which}: five looks on neutral at ${width}, docs in ${docsMode}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await openDocs(page, PAGES[which].path, docsMode);
        const grid = page.locator('[data-slot="five-looks"]').first();
        await expect(grid.locator("figcaption")).toHaveCount(5);
        await checkLooks(grid, which, () => "neutral", docsMode);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });

      test(`${which}: five looks on honcho-backstage at ${width}, docs in ${docsMode}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await openDocs(page, PAGES[which].path, docsMode);
        const section = page.locator('[data-slot="honcho-backstage-looks"]');
        test.skip((await section.count()) === 0, "honcho-backstage is a private theme; not installed in this build");
        const grid = section.locator('[data-slot="five-looks"]');
        await checkLooks(grid, which, (id) => (id === "today" ? "honcho" : "honcho-backstage"), docsMode);
        await page.mouse.move(0, 0);
        await section.scrollIntoViewIfNeeded();
        const shot = testInfo.outputPath(`${which}-honcho-backstage-${width}-${docsMode}.png`);
        await section.screenshot({ path: shot });
        await testInfo.attach(`${which}-${width}-${docsMode}`, { path: shot, contentType: "image/png" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
}

// The keyboard walk and reduced motion, in every look on the stock theme.
test("keyboard: Enter flips the toggle, the focus ring shows, and reduced motion keeps the icons still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocs(page, PAGES.toggle.path, "light");
  const grid = page.locator('[data-slot="five-looks"]').first();
  for (const look of LOOKS) {
    await expect(async () => {
      const frame = await lookFrame(grid, look.id, "neutral", PAGES.toggle.specimen);
      const button = frame.locator('[data-slot="theme-toggle"]');
      const start = (await button.getAttribute("data-tone"))!;
      const other = start === "dark" ? "light" : "dark";
      await frame.locator("body").focus();
      await button.focus();
      await expect(button).toBeFocused({ timeout: 1_000 });
      expect(await button.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("data-tone", other, { timeout: 1_000 });
      const rotate = await button.evaluate((el) => [...el.querySelectorAll("svg")].map((s) => getComputedStyle(s).rotate));
      expect(rotate).toEqual(["none", "none"]);
      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("data-tone", start);
    }).toPass({ timeout: 20_000 });
  }
});

test("keyboard: Space on a thumbnail chooses it, and reduced motion runs no wave", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocs(page, PAGES.picker.path, "light");
  const grid = page.locator('[data-slot="five-looks"]').first();
  for (const look of LOOKS) {
    await expect(async () => {
      const frame = await lookFrame(grid, look.id, "neutral", PAGES.picker.specimen);
      const thumbs = frame.locator('[data-slot="photo-picker"] button');
      const old = frame.locator('[data-slot="photo-picker"] [aria-pressed="true"]');
      const oldIndex = await old.evaluate((el) => [...el.parentElement!.children].indexOf(el));
      const target = thumbs.nth(oldIndex === 0 ? 1 : 0);
      await target.focus();
      await expect(target).toBeFocused({ timeout: 1_000 });
      await page.keyboard.press("Space");
      await expect(target).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
      await expect(thumbs.nth(oldIndex)).toHaveAttribute("aria-pressed", "false");
      const running = await frame.evaluate(() =>
        [...document.querySelectorAll('[data-slot="photo-picker"] button')].some((b) => getComputedStyle(b).animationName !== "none"),
      );
      expect(running).toBe(false);
    }).toPass({ timeout: 20_000 });
  }
});
