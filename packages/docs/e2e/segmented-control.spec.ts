import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

const PAGE = "/docs/components/form/segmented-control";

// VI-777: arrow keys move focus between segments in a real browser (the jsdom
// test in components/ui/segmented-control/__tests__ passes the same keys).
test("SegmentedControl: arrows move focus along the group and Space selects", async ({ page }) => {
  await page.goto(PAGE);
  const group = page.getByRole("radiogroup", { name: "Payment status" }).first();
  const unpaid = group.getByRole("radio", { name: "Unpaid", exact: true });
  const paid = group.getByRole("radio", { name: "Paid", exact: true });
  const any = group.getByRole("radio", { name: "Any", exact: true });

  await unpaid.focus();
  await page.keyboard.press("ArrowRight");
  await expect(paid).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(any).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(paid).toBeFocused();

  await page.keyboard.press("Space");
  await expect(paid).toHaveAttribute("aria-checked", "true");
});

// VI-803: the well follows the glass layer. Glass off draws no blur anywhere; in the
// Photo looks the well blurs with the glass layer's control blur. On honcho-backstage
// (a private theme, so that part skips on a public build) the colours come from the
// theme alone: well = field fill, pill = 20% ink, labels at ink 100 and ink 64.
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
const PHOTOS = "?photo-dark=/vi-803-photos/photo-1.webp&photo-light=/vi-803-photos/photo-2.webp";

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
  // The docs-picked frames first render on the default theme, then reload on the docs theme.
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${theme}\\b`), { timeout: 20_000 });
  const frame = (await (await iframe.elementHandle())!.contentFrame())!;
  await expect.poll(() => frame.url()).toContain(`theme=${theme}`);
  await frame.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="segmented-control-specimen"]`);
  await expect(frame.locator("body")).toHaveClass(new RegExp(`\\b${theme}-theme\\b`));
  await frame.evaluate(() => document.fonts.ready.then(() => true));
  return frame;
}

interface Well {
  filter: string;
  glassBlur: string;
  bg: string;
  pill: string;
  on: string;
  off: string;
  fieldFill: string;
  ink20: string;
  ink100: string;
  ink64: string;
  edge: string;
  panelBlur: string;
  blurred: number;
}

/** The Draw / Type switch's computed well, pill and labels, and the theme values they should equal. */
function readWell(frame: Frame): Promise<Well> {
  return frame.evaluate(async () => {
    const root = document.querySelector('[data-slot="segmented-control"]') as HTMLElement;
    const pill = root.querySelector(':scope > [aria-hidden="true"]') as HTMLElement;
    for (let i = 0; i < 100 && pill.style.opacity !== "1"; i++) await new Promise((r) => setTimeout(r, 20));
    // Colours compare as 8-bit pixels, so color-mix() and rgba() of the same colour match.
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d")!;
    const px = (c: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data.join(",");
    };
    const probe = (prop: "backgroundColor" | "color" | "backdropFilter", value: string) => {
      const d = document.createElement("div");
      d.style[prop] = value;
      root.parentElement!.appendChild(d);
      const out = getComputedStyle(d)[prop];
      d.remove();
      return out;
    };
    const cs = getComputedStyle(root);
    return {
      filter: cs.backdropFilter,
      glassBlur: probe("backdropFilter", "var(--glass-on-control-blur, none)"),
      bg: px(cs.backgroundColor),
      pill: px(getComputedStyle(pill).backgroundColor),
      on: px(getComputedStyle(root.querySelector('[data-state="on"]')!).color),
      off: px(getComputedStyle(root.querySelector('[data-state="off"]')!).color),
      fieldFill: px(probe("backgroundColor", "var(--input-bg)")),
      ink20: px(probe("backgroundColor", "color-mix(in srgb, var(--ink-100) 20%, transparent)")),
      ink100: px(probe("color", "var(--ink-100)")),
      ink64: px(probe("color", "var(--ink-64)")),
      edge: cs.outlineStyle,
      panelBlur: getComputedStyle(
        document.querySelector('[data-slot="segmented-control-form-panel"] > [data-slot="glass-layer"]')!,
      ).backdropFilter,
      blurred: [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).backdropFilter !== "none").length,
    };
  });
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`SegmentedControl glass: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      const grid = page.locator('[data-slot="five-looks"]').first();
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        await expect(async () => {
          const frame = await lookFrame(grid, look.id, "neutral");
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const w = await readWell(frame);
          if (look.photo) {
            expect(w.glassBlur).toContain("blur(");
            expect(w.filter).toBe(w.glassBlur);
          } else {
            // Glass off: nothing on the page blurs, with no theme binding (stock neutral).
            expect(w.filter).toBe("none");
            expect(w.blurred).toBe(0);
          }
        }).toPass({ timeout: 30_000 });
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`SegmentedControl on honcho-backstage: five looks at ${width} with the docs in ${docsMode}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode, PHOTOS);
      const section = page.locator('[data-slot="honcho-backstage-looks"]');
      test.skip((await section.count()) === 0, "honcho-backstage is a private theme; not installed in this build");
      const grid = section.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        const theme = look.id === "today" ? "honcho" : "honcho-backstage";
        await expect(async () => {
          const frame = await lookFrame(grid, look.id, theme);
          const w = await readWell(frame);
          if (look.photo) {
            expect(w.filter).toBe(w.glassBlur);
            expect(w.filter).toContain("blur(24px)");
            // The switches sit on a glass form panel, never straight on the photo.
            expect(w.panelBlur).toContain("blur(");
          } else {
            expect(w.filter).toBe("none");
            expect(w.blurred).toBe(0);
          }
          if (theme === "honcho-backstage") {
            expect(w.bg, "well = field fill").toBe(w.fieldFill);
            expect(w.pill, "pill = 20% ink").toBe(w.ink20);
            expect(w.on, "active label = ink 100").toBe(w.ink100);
            expect(w.off, "inactive label = ink 64").toBe(w.ink64);
          } else {
            // Today (VI-803 v9): the Backstage switch inverted on honcho's light page, never the key colour.
            expect(w.bg, "well = ink").toBe("11,11,12,255");
            expect(w.pill, "pill = 20% white").toBe("255,255,255,51");
            expect(w.on, "active label = white").toBe("255,255,255,255");
            expect(w.off, "inactive label = 66% white").toBe("255,255,255,168");
          }
          // No edge on the well in any look, as the kit's switch draws none.
          expect(w.edge, "well edge").toBe("none");
        }).toPass({ timeout: 30_000 });
      }

      // The VI-777 keyboard walk, on the Dark + Photo instance.
      const frame = await lookFrame(grid, "dark-photo", "honcho-backstage");
      const group = frame.getByRole("radiogroup", { name: "Signature mode" });
      const draw = group.getByRole("radio", { name: "Draw", exact: true });
      const type = group.getByRole("radio", { name: "Type", exact: true });
      await draw.focus();
      await page.keyboard.press("ArrowRight");
      await expect(type).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(draw).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(type).toBeFocused();
      await page.keyboard.press("Space");
      await expect(type).toHaveAttribute("aria-checked", "true");
      await expect(draw).toHaveAttribute("aria-checked", "false");
      // Put Draw back on, so the screenshot shows the resting look.
      await draw.click();
      await expect(draw).toHaveAttribute("aria-checked", "true");
      await page.mouse.move(0, 0);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      await section.scrollIntoViewIfNeeded();
      const shot = testInfo.outputPath(`honcho-backstage-${width}-${docsMode}.png`);
      await section.screenshot({ path: shot });
      await testInfo.attach(`honcho-backstage-${width}-${docsMode}`, { path: shot, contentType: "image/png" });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
