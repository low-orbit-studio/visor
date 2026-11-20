import { test, expect, type Frame, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

// VI-799: the soft Alert replaces the kit's Notice. In the plain looks it keeps
// its danger tone and no glass; over a photo every tone draws in the glass ink,
// on the glass fill and blur, with a full hairline outline and never a stripe.
const PAGE = "/docs/components/feedback/alert";
const AUDIT = resolve(__dirname, "../../../docs/audits/VI-799");
const LOOKS: { id: string; photo: boolean; mode?: "light" | "dark" }[] = [
  { id: "today", photo: false },
  { id: "dark", photo: false, mode: "dark" },
  { id: "dark-photo", photo: true, mode: "dark" },
  { id: "light", photo: false, mode: "light" },
  { id: "light-photo", photo: true, mode: "light" },
];

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(PAGE);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const handle = await page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`).elementHandle();
  const frame = await handle!.contentFrame();
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
      return {
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
          // A click on the panel's bare padding puts focus in the look's document.
          await frame.locator('[data-slot="look-panel"]').click({ position: { x: 2, y: 2 } });
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

        // Today follows the docs site's mode, so it is captured in light only.
        if (look.id !== "today" || docsMode === "light") {
          mkdirSync(AUDIT, { recursive: true });
          await page
            .locator(`[data-slot="five-looks"] [data-look="${look.id}"]`)
            .screenshot({
              path: `${AUDIT}/${look.id}__${width}.png`,
              animations: "disabled",
              // Hide the Next.js dev badge in every frame, so it never reaches a review.
              style: "nextjs-portal{display:none!important}",
            });
        }
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
