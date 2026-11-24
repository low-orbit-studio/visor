import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-804: Card's glass variant and editable tile, in each of the five looks, at 390 and
// 1440 wide. Every look is the frame the Card docs page draws (/looks/panel). CI runs it
// on neutral; a review sets CARD_LOOKS_THEME=honcho-backstage CARD_LOOKS_TODAY_THEME=honcho
// (the private themes are installed locally only).
const THEME = process.env.CARD_LOOKS_THEME ?? "neutral";
const TODAY_THEME = process.env.CARD_LOOKS_TODAY_THEME ?? THEME;
const PHOTO = process.env.CARD_LOOKS_PHOTO ?? "";
const PAGE = "/docs/components/data-display/card";
const LOOKS = [
  { id: "today", photo: false },
  { id: "dark", photo: false },
  { id: "dark-photo", photo: true },
  { id: "light", photo: false },
  { id: "light-photo", photo: true },
] as const;

// V13's 18 review shots: each look at rest (5 x 2 widths), the docs grid per docs mode and width (4),
// and the editable tile hovered and mid-flash in both Photo looks at 1440 (4). Photo-look shots never
// enter the repo (spec/style-rules.md), so the default is the gitignored Playwright output folder.
const SHOTS = process.env.CARD_LOOKS_SHOTS ?? join(__dirname, "../test-results/card-looks");
// Hide the dev server's overlay badge (absent from the production build CI runs).
const CLEAN = { style: "nextjs-portal { display: none !important; }" };

const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf-8");

function panelUrl(look: string) {
  const query = new URLSearchParams({
    theme: look === "today" ? TODAY_THEME : THEME,
    look,
    mode: "light",
    specimen: "card",
  });
  if (PHOTO) query.set("photo", PHOTO);
  return `/looks/panel?${query}`;
}

async function openLook(page: Page, look: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(panelUrl(look));
  await page.waitForSelector('[data-slot="card-specimen"]');
  // The panel sets its theme class after hydration; wait for it before reading styles.
  await expect(page.locator("body")).toHaveClass(new RegExp(`${look === "today" ? TODAY_THEME : THEME}-theme`));
}

/** A token resolved to a computed colour where the editable card sits. */
const colour = (page: Page | Frame, token: string) =>
  page.evaluate((t) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${t})`;
    document.querySelector('[data-demo="card-editable"]')!.parentElement!.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, token);

async function layers(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-demo="card-glass"]')!;
    const g = getComputedStyle(card.querySelector('[data-slot="card-glass"]')!);
    const e = getComputedStyle(card.querySelector('[data-slot="card-edge"]')!);
    const c = getComputedStyle(card);
    const probe = document.createElement("span");
    card.append(probe);
    probe.style.color = "var(--surface-card)";
    const surface = getComputedStyle(probe).color;
    probe.style.color = "var(--border-default)";
    const border = getComputedStyle(probe).color;
    probe.style.color = "var(--glass-on-lift, transparent)";
    const lift = getComputedStyle(probe).color;
    probe.style.borderRadius = "var(--radius-xl)";
    const radius = getComputedStyle(probe).borderTopLeftRadius;
    probe.remove();
    return {
      surface, border, lift, radius,
      glassBg: g.backgroundColor, glassImage: g.backgroundImage, glassFilter: g.backdropFilter,
      edgeColor: e.borderTopColor, blend: e.mixBlendMode,
      cardRadius: c.borderTopLeftRadius,
      corner: c.getPropertyValue("corner-shape"),
      themeCorner: getComputedStyle(document.body).getPropertyValue("--corner-shape").trim() || "round",
    };
  });
}

for (const width of [1440, 390]) {
  for (const look of LOOKS) {
    test(`Card glass and editable: ${look.id} at ${width}`, async ({ page }) => {
      await openLook(page, look.id, width);
      await page.screenshot({ path: `${SHOTS}/${look.id}__${width}.png`, fullPage: true, animations: "disabled", ...CLEAN });
      const r = await layers(page);
      const reviewShot = look.photo && width === 1440;

      if (look.photo) {
        // Glass on over the photo: blur, soft-light edge, the lift laid over the fill.
        expect(r.glassFilter).toContain("blur(");
        expect(r.blend).toBe("soft-light");
        expect(r.glassImage).toContain(`linear-gradient(${r.lift}`);
      } else {
        // Glass off: solid surface and a plain border, and nothing on the page blurs.
        expect(r.glassBg).toBe(r.surface);
        expect(r.edgeColor).toBe(r.border);
        expect(r.blend).toBe("normal");
        const blurred = await page.evaluate(() =>
          [...document.querySelectorAll('[data-slot="card-specimen"] *')]
            .filter((el) => getComputedStyle(el).backdropFilter !== "none")
            .map((el) => el.getAttribute("data-slot") ?? el.tagName),
        );
        expect(blurred).toEqual([]);
      }

      // The corner comes from the theme. corner-shape is Chromium-only.
      expect(r.cardRadius).toBe(r.radius);
      if (r.corner) expect(r.corner).toBe(r.themeCorner);

      if (look.photo) {
        // The blurred field inside the card blurs the photo: nothing between them is a backdrop root.
        const blockers = await page.evaluate(() => {
          const field = document.querySelector('[data-demo="card-glass"] input')!.parentElement!;
          const out: string[] = [];
          if (getComputedStyle(field).backdropFilter === "none") out.push("the field has no blur");
          for (let el = field.parentElement; el && el.getAttribute("data-slot") !== "look-panel"; el = el.parentElement) {
            const s = getComputedStyle(el);
            const name = el.getAttribute("data-slot") ?? el.tagName;
            if (s.backdropFilter !== "none") out.push(`${name} backdrop-filter`);
            if (s.filter !== "none") out.push(`${name} filter`);
            if (s.maskImage !== "none") out.push(`${name} mask`);
            if (s.transform !== "none") out.push(`${name} transform`);
            if (Number(s.opacity) < 1) out.push(`${name} opacity`);
            if (s.mixBlendMode !== "normal") out.push(`${name} blend`);
            if (s.isolation === "isolate") out.push(`${name} isolation`);
          }
          return out;
        });
        expect(blockers).toEqual([]);
      }

      const card = page.locator('[data-demo="card-editable"]');
      const pen = card.locator('[data-slot="card-pen"]');
      const key = await colour(page, "--interactive-primary-bg");
      const keyInk = await colour(page, "--interactive-primary-text");

      // Hover lift: the pen fills with the key colour, the shadow deepens, the card stays put.
      const rest = await card.evaluate((n) => getComputedStyle(n).boxShadow);
      await card.hover();
      await expect.poll(() => pen.evaluate((n) => getComputedStyle(n).backgroundColor)).toBe(key);
      await expect.poll(() => pen.evaluate((n) => getComputedStyle(n).color)).toBe(keyInk);
      await expect.poll(() => card.evaluate((n) => getComputedStyle(n).boxShadow)).not.toBe(rest);
      expect(await card.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
      if (reviewShot) await page.screenshot({ path: `${SHOTS}/${look.id}__${width}__hover.png`, ...CLEAN });

      // Keyboard: Tab reaches the card, its outline is the key colour, Enter and Space each save.
      const saves = page.locator('[data-slot="card-saves"]');
      await page.mouse.move(0, 0);
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      for (let i = 0; i < 6 && !(await card.evaluate((n) => n === document.activeElement)); i++) {
        await page.keyboard.press("Tab");
      }
      await expect(card).toBeFocused();
      expect(await card.evaluate((n) => getComputedStyle(n).outlineColor)).toBe(key);
      await expect(saves).toHaveText("Saved 0 times");
      await page.keyboard.press("Enter");
      await expect(saves).toHaveText("Saved 1 time");
      await page.keyboard.press("Space");
      await expect(saves).toHaveText("Saved 2 times");

      // Save flash: one 1.6s animation on the card, starting in the key colour. Settle the
      // hover and focus transitions first, so only the flash is running.
      const save = page.getByRole("button", { name: "Save", exact: true });
      await save.hover();
      await page.waitForTimeout(450);
      await save.click();
      const flash = await card.evaluate((n) =>
        n.getAnimations().map((a) => ({
          duration: a.effect!.getTiming().duration,
          first: String(((a.effect as KeyframeEffect).getKeyframes()[0] as { boxShadow?: string }).boxShadow ?? ""),
        })),
      );
      expect(flash).toHaveLength(1);
      expect(flash[0]!.duration).toBe(1600);
      expect(flash[0]!.first).toContain(key);
      if (reviewShot) await page.screenshot({ path: `${SHOTS}/${look.id}__${width}__flash.png`, ...CLEAN });

      // The press scales the card while held.
      await card.hover();
      await page.mouse.down();
      await expect.poll(() => card.evaluate((n) => getComputedStyle(n).transform)).not.toBe("none");
      await page.mouse.up();

      // Phone width: nothing scrolls sideways.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      // Accessibility: axe finds nothing in the look.
      await page.mouse.move(0, 0);
      await page.addScriptTag({ content: AXE });
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (c: Element, o: object) => Promise<{ violations: { id: string }[] }> } }).axe;
        const res = await axe.run(document.body, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] });
        return res.violations.map((v) => v.id);
      });
      expect(violations).toEqual([]);
    });
  }
}

test("Card glass and editable: reduced motion drops the press and the transition time", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLook(page, "dark-photo", 1440);
  const card = page.locator('[data-demo="card-editable"]');
  const pen = card.locator('[data-slot="card-pen"]');
  await card.hover();
  await page.mouse.down();
  expect(await card.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
  await page.mouse.up();
  // Card asks for 0s; visor-core's reduced-motion base rule pins every transition to
  // 0.01ms with a layered !important. Both are instant.
  for (const el of [card, pen]) {
    const durations = (await el.evaluate((n) => getComputedStyle(n).transitionDuration)).split(",");
    for (const d of durations) expect(["0s", "1e-05s"]).toContain(d.trim());
  }
});

for (const width of [1440, 390]) {
  for (const mode of ["light", "dark"] as const) {
    test(`Card docs page: five looks at ${width} with the docs in ${mode}`, async ({ page }) => {
      await page.addInitScript(
        ([m, t]) => {
          localStorage.setItem("visor-theme", t);
          localStorage.setItem("visor-color-mode", m);
          localStorage.setItem("theme", m);
        },
        [mode, THEME],
      );
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PAGE);
      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(["Today", "Dark", "Dark + Photo", "Light", "Light + Photo"]);
      await expect(grid.locator("iframe").first()).toHaveAttribute("src", /specimen=card/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      // The grid re-points its frames once the docs theme and mode are read; let that land first.
      await page.waitForLoadState("networkidle");
      // Shoot each frame settled, with the viewport grown to hold the whole grid: frames outside it
      // never paint, and an element shot scrolls the sticky docs header over the grid.
      for (const look of LOOKS) {
        const frame = grid.locator(`[data-look="${look.id}"] iframe`).contentFrame();
        const lookMode = look.id === "today" ? mode : look.id.split("-")[0];
        await expect(frame.locator("html")).toHaveClass(new RegExp(`\\b${lookMode}\\b`));
        await frame.locator('[data-slot="card-specimen"]').waitFor();
        await frame.locator("head").evaluate((head, css) => head.append(Object.assign(document.createElement("style"), { textContent: css })), CLEAN.style);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const clip = (await grid.boundingBox())!;
      await page.setViewportSize({ width, height: Math.ceil(clip.y + clip.height) });
      await page.screenshot({ path: `${SHOTS}/docs-${mode}__${width}.png`, clip, animations: "disabled", ...CLEAN });
    });
  }
}
