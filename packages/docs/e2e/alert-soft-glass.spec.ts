import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-799: the soft Alert replaces the kit's Notice. In the plain looks it keeps
// its danger tone and no glass; over a photo every tone draws in the glass ink,
// on the glass fill and blur, with a full hairline outline and never a stripe.
// The alerts sit on a form panel built from the glass recipe, and over a photo
// every tone's text starts in the same column (the info note included).
// The stock theme CI has; LOOKS_THEME=honcho-backstage and LOOKS_PHOTO=/a-real-photo.webp
// draw the kit's looks over a real photo locally.
const THEME = process.env.LOOKS_THEME ?? "neutral";
const PHOTO = process.env.LOOKS_PHOTO;
const PAGE = `/docs/components/feedback/alert${PHOTO ? `?photo=${encodeURIComponent(PHOTO)}` : ""}`;
const LOOKS: { id: string; photo: boolean; mode?: "light" | "dark" }[] = [
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
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="alert"]`);
  return frame!;
}

/** Each soft Alert in a look: its computed glass properties, its icon colour and the theme's error and primary ink there. */
const probe = (frame: Frame) =>
  frame.locator('[data-slot="look-panel"] [data-slot="alert"]').evaluateAll((alerts) =>
    alerts.map((el) => {
      const cs = getComputedStyle(el);
      const ink = (v: string) => {
        const s = document.createElement("span");
        s.style.color = `var(${v})`;
        el.appendChild(s);
        const c = getComputedStyle(s).color;
        s.remove();
        return c;
      };
      const icon = el.querySelector('[data-slot="alert-icon"]')!.getBoundingClientRect();
      const text = el.querySelector('[data-slot="alert-content"]')!.getBoundingClientRect();
      return {
        iconWidth: icon.width,
        textLeft: Math.round(text.left - el.getBoundingClientRect().left),
        backdrop: cs.backdropFilter,
        shadow: cs.boxShadow,
        borders: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
        icon: getComputedStyle(el.querySelector('[data-slot="alert-icon"]') ?? el.firstElementChild!).color,
        error: ink("--text-error"),
        primary: ink("--text-primary"),
      };
    }),
  );

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Soft Alert: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      await expect(page.locator('[data-slot="five-looks"] figcaption')).toHaveCount(5);

      for (const look of LOOKS) {
        // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const alerts = await probe(frame);
          expect(alerts).toHaveLength(5);
          // Over a photo every tone, the info note included, draws one icon size and starts its
          // text in one column. The plain looks keep the note's smaller 24px icon.
          if (look.photo) {
            expect(new Set(alerts.map((a) => a.iconWidth)).size).toBe(1);
            expect(new Set(alerts.map((a) => a.textLeft)).size).toBe(1);
          } else {
            expect(alerts.at(-1)!.iconWidth).toBe(24);
          }
          // The alerts sit on the glass recipe's form panel: glass over a photo, a solid card elsewhere.
          const panelGlass = await frame
            .locator('[data-slot="alert-form-panel"] > span[aria-hidden]')
            .first()
            .evaluate((n) => getComputedStyle(n).display);
          expect(panelGlass).toBe(look.photo ? "block" : "none");

          if (!look.photo) {
            // Glass off: the danger tone, no blur, no ring.
            const danger = alerts[0]!;
            expect(danger.backdrop).toBe("none");
            expect(danger.shadow).toBe("none");
            expect(danger.icon).toBe(danger.error);
          } else {
            for (const a of alerts) {
              expect(a.backdrop).toContain("blur(");
              expect(a.shadow).toContain("inset");
              expect(new Set(a.borders).size).toBe(1);
              expect(a.icon).toBe(a.primary);
              expect(a.icon).not.toBe(a.error);
            }
          }

          // Keyboard: Tab reaches the help link in the description and its focus ring shows.
          const link = frame.locator('[data-slot="alert"] a[href^="mailto:"]');
          // Focus the look's frame, so the next Tab enters its document. (A click on the panel
          // can land on the docs' sticky chrome instead, depending on the theme and width.)
          await page.locator(`[data-slot="five-looks"] [data-look="${look.id}"] iframe`).focus();
          let focused = false;
          for (let i = 0; i < 6 && !focused; i++) {
            await page.keyboard.press("Tab");
            focused = await link.evaluate((n) => n === document.activeElement);
          }
          expect(focused).toBe(true);
          const ring = await link.evaluate((n) => parseFloat(getComputedStyle(n).outlineWidth));
          expect(ring).toBeGreaterThan(0);
          await link.blur();
        }).toPass({ timeout: 20_000 });
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
