import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

// VI-815: AnimatedTitle draws a title word by word in CSS. The docs page shows the three
// entrances (rise, blur, weight), a held title, and the title in all five looks.
const PAGE = "/docs/components/typography/animated-title";

const KIT = {
  rise: { name: "animatedTitleRise", duration: 1050, stagger: 55 },
  blur: { name: "animatedTitleBlur", duration: 1100, stagger: 60 },
  weight: { name: "animatedTitleWeight", duration: 1300, stagger: 50 },
} as const;

const LOOKS: { id: string; label: string; photo: boolean; mode?: "light" | "dark" }[] = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

// Real Campout photos for the Photo looks (a night one behind Dark + Photo, a day one behind
// Light + Photo). Local review fixtures seeded with review_station.py photo-fixtures, never
// committed; without them the frame shows the stand-in and the checks still hold.
const PHOTOS = "?photo-dark=/vi-815-photos/photo-1.webp&photo-light=/vi-815-photos/photo-2.webp";

async function openDocs(page: Page, mode: "light" | "dark" = "light", query = "") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(PAGE + query);
}

const demo = (page: Page, id: string) => page.locator(`[data-demo="${id}"]`).first();

/** Every word's settled style, read off the page. */
const settled = (title: Locator) =>
  title.locator('[data-slot="animated-title-word"]').evaluateAll((words) =>
    words.map((w) => {
      const cs = getComputedStyle(w);
      return { animations: w.getAnimations().length, opacity: cs.opacity, transform: cs.transform, filter: cs.filter, weight: cs.fontWeight };
    }),
  );

for (const [animation, kit] of Object.entries(KIT)) {
  test(`AnimatedTitle ${animation}: each word runs the kit's keyframes, delayed i × stagger, on the enter curve`, async ({ page }) => {
    await openDocs(page);
    const box = demo(page, `animated-title-${animation}`);
    await expect(box.locator('[data-slot="animated-title"]')).toBeVisible();

    // Replay and read in the same task, before the words can finish (a click before hydration does nothing).
    await expect(async () => {
      const read = await box.evaluate(async (el) => {
        const title = () => el.querySelector('[data-slot="animated-title"]')!;
        const before = title();
        [...el.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Replay")!.click();
        for (let i = 0; i < 50 && title() === before; i++) await Promise.resolve();
        const probe = document.createElement("div");
        probe.style.transitionTimingFunction = "var(--motion-easing-enter)";
        el.appendChild(probe);
        const enter = getComputedStyle(probe).transitionTimingFunction;
        probe.remove();
        return {
          remounted: title() !== before,
          enter,
          words: [...title().querySelectorAll('[data-slot="animated-title-word"]')].map((w) =>
            w.getAnimations().map((a) => ({
              name: (a as CSSAnimation).animationName.replace(/^.*__/, ""),
              duration: a.effect!.getTiming().duration,
              delay: a.effect!.getTiming().delay,
              fill: a.effect!.getTiming().fill,
              easing: (a.effect as KeyframeEffect).getKeyframes()[0]!.easing,
            })),
          ),
        };
      });
      expect(read.remounted).toBe(true);
      expect(read.words.length).toBeGreaterThan(1);
      read.words.forEach((anims, i) => {
        expect(anims).toEqual([
          { name: kit.name, duration: kit.duration, delay: i * kit.stagger, fill: "backwards", easing: read.enter },
        ]);
      });
    }).toPass({ timeout: 15_000 });

    // Once every word finishes nothing keeps animating, and the words rest at their settled style.
    const title = box.locator('[data-slot="animated-title"]');
    await expect.poll(async () => (await settled(title)).every((w) => w.animations === 0), { timeout: 5_000 }).toBe(true);
    for (const word of await settled(title)) {
      expect(word).toMatchObject({ opacity: "1", transform: "none", filter: "none" });
      if (animation === "weight") expect(word.weight).toBe("520");
    }
  });
}

test("AnimatedTitle: the docs theme's enter curve is the token the title reads", async ({ page }) => {
  await openDocs(page);
  const enter = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--motion-easing-enter").trim());
  expect(enter.length).toBeGreaterThan(0);
});

test("AnimatedTitle: screen readers hear the title once", async ({ page }) => {
  await openDocs(page);
  const box = demo(page, "animated-title-blur");
  await expect(box).toMatchAriaSnapshot(`
    - heading "Tell us about your weekend" [level=2]
    - button "Replay"
  `);
  // The heading's name is the title once: the animated words are aria-hidden, not read again.
  await expect(box.getByRole("heading")).toHaveCount(1);
  await expect(box.getByRole("heading")).toHaveAccessibleName("Tell us about your weekend");
});

test("AnimatedTitle: under reduced motion the title shows settled, with no animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocs(page);
  const titles = page.locator('[data-demo] [data-slot="animated-title"]:not([data-play="false"])');
  await expect(titles.first()).toBeVisible();
  expect(await titles.count()).toBeGreaterThanOrEqual(3);
  for (const title of await titles.all()) {
    for (const word of await settled(title)) {
      expect(word).toMatchObject({ animations: 0, opacity: "1", transform: "none", filter: "none" });
    }
  }
});

test("AnimatedTitle: play={false} holds every word hidden until it plays", async ({ page }) => {
  await openDocs(page);
  const box = demo(page, "animated-title-hold");
  const title = box.locator('[data-slot="animated-title"]');
  await expect(title).toHaveAttribute("data-play", "false");
  await page.waitForTimeout(2_000);
  const held = await title.locator('[data-slot="animated-title-word"]').evaluateAll((words) =>
    words.map((w) => ({ opacity: getComputedStyle(w).opacity, state: w.getAnimations().map((a) => a.playState) })),
  );
  expect(held.length).toBeGreaterThan(1);
  for (const word of held) expect(word).toEqual({ opacity: "0", state: ["paused"] });

  await expect(async () => {
    await box.getByRole("button", { name: "Play" }).click({ timeout: 1_000 });
    await expect(title).not.toHaveAttribute("data-play", "false", { timeout: 1_000 });
  }).toPass();
  await expect.poll(async () => (await settled(title)).every((w) => w.opacity === "1" && w.animations === 0)).toBe(true);
});

// Safari draws each animating word on a layer cut to the word's box, so glyph ink outside the box
// (descenders, accents) disappears mid-animation. Measure the font's real ink and require every
// word box to contain it (ported from honcho-planning tests/e2e/title-ink.spec.ts).
const PROBE = "ÅÉgjpqy(),;";

test("AnimatedTitle: every word box contains its glyph ink", async ({ page }) => {
  await openDocs(page);
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="animated-title-word"]').length > 0);
  for (const id of ["animated-title-rise", "animated-title-blur", "animated-title-weight"]) {
    const title = demo(page, id).locator('[data-slot="animated-title"]');
    await expect.poll(async () => (await settled(title)).every((w) => w.animations === 0), { timeout: 10_000 }).toBe(true);
    const misses = await title.evaluate(async (el, probe) => {
      await document.fonts.ready;
      const ctx = document.createElement("canvas").getContext("2d")!;
      const words = [...el.querySelectorAll<HTMLElement>('[data-slot="animated-title-word"]')];
      words[0]!.textContent = probe;
      return words.flatMap((word) => {
        const cs = getComputedStyle(word);
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const ink = ctx.measureText(word.textContent ?? "");
        const mark = document.createElement("span");
        mark.style.cssText = "display:inline-block;width:0;height:0";
        word.append(mark);
        const baseline = mark.getBoundingClientRect().bottom;
        mark.remove();
        const box = word.getBoundingClientRect();
        const top = baseline - ink.actualBoundingBoxAscent - box.top;
        const bottom = box.bottom - (baseline + ink.actualBoundingBoxDescent);
        return top < 0 || bottom < 0 ? [`"${word.textContent}" ink outside its box by ${Math.min(top, bottom).toFixed(1)}px`] : [];
      });
    }, PROBE);
    expect(misses, id).toEqual([]);
  }
});

async function lookFrame(grid: Locator, id: string, theme: string): Promise<Frame> {
  const iframe = grid.locator(`[data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme after hydration.
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${theme}`), { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain(`theme=${theme}`);
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="animated-title-specimen"]`);
  return frame!;
}

/** Each look draws the three titles in the theme's ink, settled, with glass on only over the photo. */
async function checkLooks(page: Page, grid: Locator, theme: string, todayTheme: string, docsMode: "light" | "dark") {
  await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));
  const ink: Record<string, string> = {};
  for (const look of LOOKS) {
    // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
    await expect(async () => {
      const frame = await lookFrame(grid, look.id, look.id === "today" ? todayTheme : theme);
      const panel = frame.locator('[data-slot="look-panel"]');
      await expect(panel).toHaveAttribute("data-mode", look.mode ?? docsMode);
      if (look.photo) await expect(panel).toHaveAttribute("data-glass", "on");
      else await expect(panel).not.toHaveAttribute("data-glass");
      const titles = frame.locator('[data-slot="animated-title"]');
      await expect(titles).toHaveCount(3);
      await expect
        .poll(() => frame.evaluate(() => document.getAnimations().length), { timeout: 10_000 })
        .toBe(0);
      const read = await titles.evaluateAll((els) =>
        els.map((el) => {
          const probe = document.createElement("span");
          probe.style.color = "var(--text-primary)";
          el.parentElement!.appendChild(probe);
          const themeInk = getComputedStyle(probe).color;
          probe.remove();
          return {
            color: getComputedStyle(el).color,
            themeInk,
            words: [...el.querySelectorAll('[data-slot="animated-title-word"]')].map((w) => getComputedStyle(w).opacity),
          };
        }),
      );
      for (const t of read) {
        expect(t.color).toBe(t.themeInk);
        expect(t.words.every((o) => o === "1")).toBe(true);
      }
      ink[look.id] = read[0]!.color;
      // Glass draws only over the photo: the titles' panel blurs it there, and nothing blurs elsewhere.
      const blurred = await frame.evaluate(
        () => [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).backdropFilter !== "none").length,
      );
      if (look.photo) expect(blurred).toBeGreaterThan(0);
      else expect(blurred).toBe(0);
    }).toPass({ timeout: 30_000 });
  }
  // The ink inverts with the tone.
  expect(ink.dark).not.toBe(ink.light);
  expect(ink["dark-photo"]).not.toBe(ink["light-photo"]);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`AnimatedTitle: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode, PHOTOS);

      await checkLooks(page, page.locator('[data-slot="five-looks"]').first(), "neutral", "neutral", docsMode);

      const honcho = page.locator('[data-slot="honcho-backstage-looks"] [data-slot="five-looks"]');
      if (await honcho.count()) await checkLooks(page, honcho, "honcho-backstage", "honcho", docsMode);

      expect(errors).toEqual([]);
    });
  }
}
