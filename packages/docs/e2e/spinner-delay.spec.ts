import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

// VI-797: Spinner's `delay` shows nothing until the wait passes, then fades in.
// The docs page shows the delayed spinner with its words in all five looks, at
// 390 and 1440 wide, with the docs site in light and dark.
const PAGE = "/docs/components/data-display/spinner";
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

const opacity = (el: Locator) => el.evaluate((n) => getComputedStyle(n).opacity);

/** Animations on an element: name (CSS-module hash stripped), play state and delay. */
const animations = (el: Locator) =>
  el.evaluate((n) =>
    n.getAnimations().map((a) => ({
      name: (a as CSSAnimation).animationName.replace(/^.*__/, ""),
      playState: a.playState,
      delay: a.effect?.getTiming().delay,
    })),
  );

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(PAGE);
}

function delayDemo(page: Page) {
  const demo = page.locator('[data-demo="spinner-delay"]').first();
  return {
    ring: demo.locator('[data-slot="spinner"][data-delay]'),
    words: demo.locator('[data-slot="spinner-status"]'),
    replay: demo.getByRole("button", { name: "Replay" }),
  };
}

/** Click Replay until the spinners remount (a click before hydration does nothing). */
async function replay(page: Page) {
  const { ring, replay: button } = delayDemo(page);
  await expect(async () => {
    const before = await ring.elementHandle();
    await button.click();
    expect(await before!.evaluate((n) => n.isConnected)).toBe(false);
  }).toPass();
}

test("Spinner delay: nothing shows until the wait passes, then it fades in", async ({ page }) => {
  await openDocs(page, "light");
  const { ring, words } = delayDemo(page);
  await expect(words).toHaveText("Loading your form");

  await replay(page);
  // Inside the 600ms wait both are fully transparent. Replay again and read in the
  // same task, before a frame can render: separate round trips can take longer than
  // the wait on a busy runner (the five-look frames reload after hydration).
  const read = await page.locator('[data-demo="spinner-delay"]').first().evaluate(async (demo) => {
    const ringOf = () => demo.querySelector('[data-slot="spinner"][data-delay]')!;
    const before = ringOf();
    [...demo.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Replay")!.click();
    // React commits the click's update in a microtask, still ahead of the next frame.
    for (let i = 0; i < 50 && ringOf() === before; i++) await Promise.resolve();
    const statusOf = demo.querySelector('[data-slot="spinner-status"]')!;
    return {
      remounted: ringOf() !== before,
      ring: getComputedStyle(ringOf()).opacity,
      words: getComputedStyle(statusOf).opacity,
    };
  });
  expect(read).toEqual({ remounted: true, ring: "0", words: "0" });
  expect(await animations(words)).toContainEqual(expect.objectContaining({ name: "appear", delay: 600 }));
  expect(await animations(ring)).toContainEqual(expect.objectContaining({ name: "appear", delay: 600 }));

  await expect.poll(() => opacity(ring)).toBe("1");
  await expect.poll(() => opacity(words)).toBe("1");
});

test("Spinner delay: under reduced motion the ring stops turning but still fades in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocs(page, "light");
  const { ring, words } = delayDemo(page);
  await replay(page);

  await expect.poll(() => opacity(ring)).toBe("1");
  await expect.poll(() => opacity(words)).toBe("1");
  const ringAnims = await animations(ring);
  expect(ringAnims).toContainEqual(expect.objectContaining({ name: "spin", playState: "paused" }));
  expect(ringAnims).toContainEqual(expect.objectContaining({ name: "appear", playState: "finished" }));
});

test("Spinner without a delay is visible on first paint", async ({ page }) => {
  await openDocs(page, "light");
  const plain = page.locator('[data-slot="spinner"]:not([data-delay])').first();
  expect(await opacity(plain)).toBe("1");
  expect((await animations(plain)).map((a) => a.name)).toEqual(["spin"]);
});

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme
  // after hydration. Read only the final document.
  await expect(iframe).toHaveAttribute("src", /theme=neutral/, { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain("theme=neutral");
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="spinner-status"]`);
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
    test(`Spinner delay: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);

      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      const ink: Record<string, string> = {};
      for (const look of LOOKS) {
        const frame = await lookFrame(page, look.id);
        const panel = frame.locator('[data-slot="look-panel"]');
        const status = frame.locator('[data-slot="spinner-status"]');
        await expect(panel).toHaveAttribute("data-mode", look.mode ?? docsMode);
        await expect(status).toHaveText("Loading your form");
        await expect.poll(() => opacity(status)).toBe("1");
        ink[look.id] = await status.evaluate((n) => getComputedStyle(n).color);
        // The words read the theme's ink where they sit (--text-secondary by default).
        const themeInk = await status.evaluate((n) => {
          const probe = document.createElement("span");
          probe.style.color = "var(--text-secondary)";
          n.parentElement!.appendChild(probe);
          const c = getComputedStyle(probe).color;
          probe.remove();
          return c;
        });
        expect(ink[look.id]).toBe(themeInk);

        if (!look.photo) {
          const bg = await panel.evaluate((n) => getComputedStyle(n).backgroundColor);
          expect(contrast(ink[look.id], bg)).toBeGreaterThanOrEqual(4.5);
          const glassy = await frame.evaluate(() =>
            [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).backdropFilter !== "none").length,
          );
          expect(glassy).toBe(0);
        }
      }
      // The words invert with the tone.
      expect(ink.dark).not.toBe(ink.light);
      expect(ink["dark-photo"]).not.toBe(ink["light-photo"]);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
