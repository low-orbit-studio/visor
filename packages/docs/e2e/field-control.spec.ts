import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-805: Field's control box in all five looks, at 390 and 1440 wide, with the
// docs site in light and dark. Glass only in the Photo looks; the error line in the
// theme's error colour on plain looks and the glass layer's on-photo ink over a photo;
// the control inside each box is bare; keyboard focus draws a 2px ring on the box.
const PAGE = "/docs/components/form/field";
const LOOKS = [
  { id: "today", photo: false },
  { id: "dark", photo: false, mode: "dark" },
  { id: "dark-photo", photo: true, mode: "dark" },
  { id: "light", photo: false, mode: "light" },
  { id: "light-photo", photo: true, mode: "light" },
];
const STOPS = ["look-name", "look-arrival", "look-notes", "look-email"];

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(PAGE);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme after hydration.
  await expect(iframe).toHaveAttribute("src", /theme=neutral/, { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain("theme=neutral");
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="field-specimen"]`);
  return frame!;
}

/** WCAG contrast of two computed `rgb()` colours. */
function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = c.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Field control box: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      await expect(page.locator('[data-slot="five-looks"] figcaption')).toHaveText([
        "Today", "Dark", "Dark + Photo", "Light", "Light + Photo",
      ]);

      for (const look of LOOKS) {
        // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
          await frame.addStyleTag({ content: "*,::before,::after{transition:none!important}" });
          const r = await frame.evaluate(() => {
            const probe = document.createElement("span");
            document.body.append(probe);
            const color = (v: string) => { probe.style.color = ""; probe.style.color = v; return getComputedStyle(probe).color; };
            const err = document.querySelector('[data-slot="field-error"]')!;
            const out = {
              themeError: color("var(--text-error)"),
              ink: color("var(--glass-on-ink)"),
              error: getComputedStyle(err).color,
              icon: getComputedStyle(err.querySelector("svg")!).color,
              filters: [...document.querySelectorAll('[data-slot="field-control"]')].map((b) => getComputedStyle(b).backdropFilter),
              blurred: [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).backdropFilter !== "none").length,
              bare: [...document.querySelectorAll('[data-slot="field-control"]')].map((b) => {
                const w = b.querySelector("input, textarea, [data-slot=select-trigger]")!;
                const cs = getComputedStyle(w);
                return cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.outlineStyle === "none" && cs.boxShadow === "none"
                  && Math.abs(w.getBoundingClientRect().height - b.getBoundingClientRect().height) < 0.5;
              }),
            };
            probe.remove();
            return out;
          });
          expect(r.bare).toEqual([true, true, true, true]);
          if (look.photo) {
            for (const f of r.filters) expect(f).toContain("blur(");
            expect([r.error, r.icon]).toEqual([r.ink, r.ink]);
          } else {
            expect(r.blurred).toBe(0);
            expect([r.error, r.icon]).toEqual([r.themeError, r.themeError]);
          }

          // Keyboard walk: Tab through the Input, the Select trigger, the Textarea and the invalid Input.
          await frame.locator("body").click({ position: { x: 2, y: 2 } });
          for (const id of STOPS) {
            await page.keyboard.press("Tab");
            await expect.poll(() => frame.evaluate(() => document.activeElement?.id)).toBe(id);
            const ring = await frame.locator(`#${id}`).evaluate((el) => {
              const box = el.closest('[data-slot="field-control"]')!;
              const m = getComputedStyle(box).boxShadow.match(/^(rgba?\([^)]*\)) 0px 0px 0px ([\d.]+)px inset$/);
              const panel = document.querySelector('[data-slot="look-panel"]')!;
              return m && { color: m[1], width: Number(m[2]), fill: getComputedStyle(box).backgroundColor, page: getComputedStyle(panel).backgroundColor };
            });
            expect(ring, `${look.id} ${id}`).not.toBeNull();
            expect(ring!.width, `${look.id} ${id}`).toBeGreaterThanOrEqual(2);
            // On a plain look the fill and the page are solid, so the computed colours are the pixels.
            if (!look.photo && !ring!.fill.startsWith("rgba")) {
              expect(contrast(ring!.color, ring!.fill), `${look.id} ${id} vs fill`).toBeGreaterThanOrEqual(3);
              expect(contrast(ring!.color, ring!.page), `${look.id} ${id} vs page`).toBeGreaterThanOrEqual(3);
            }
          }
        }).toPass({ timeout: 30_000 });
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
