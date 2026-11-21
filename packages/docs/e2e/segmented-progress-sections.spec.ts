import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

// VI-809: SegmentedProgress sections — weighted, tappable, labels that fade in —
// on the docs page, and the sections bar in all five looks at 390 and 1440 wide
// with the docs site in light and dark. The ink comes from the theme in every look.
const PAGE = "/docs/components/data-display/segmented-progress";
// The five looks are Backstage's (honcho-backstage, with Today on honcho); needs visor-themes-private.
const THEME = process.env.VI809_THEME ?? "honcho-backstage";
const TODAY_THEME = process.env.VI809_TODAY_THEME ?? "honcho";
const SHOTS = process.env.VI809_SHOTS;
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

const style = (el: Locator, prop: string) =>
  el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

// A probe that cannot inherit: its parent is a sentinel colour, so an unset variable reads as the
// sentinel and fails the check instead of passing on whatever ink the label happens to have.
const SENTINEL = "rgb(1, 2, 3)";
const PROGRESS_GLASS_INK = "var(--segmented-progress-glass-ink, var(--glass-on-ink))";
const resolveInk = (el: Locator, value: string) =>
  el.evaluate(
    (n, [v, sentinel]) => {
      const wrap = document.createElement("span");
      wrap.style.color = sentinel;
      const probe = document.createElement("span");
      probe.style.color = v;
      wrap.appendChild(probe);
      n.parentElement!.appendChild(wrap);
      const c = getComputedStyle(probe).color;
      wrap.remove();
      return c;
    },
    [value, SENTINEL] as const,
  );

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript(
    ([m, t]) => {
      localStorage.setItem("visor-theme", t);
      localStorage.setItem("visor-color-mode", m);
      localStorage.setItem("theme", m);
    },
    [mode, THEME],
  );
  await page.goto(PAGE);
}

function demo(page: Page) {
  const root = page.locator('[data-demo="segmented-progress-sections"]').first();
  return {
    root,
    steps: root.locator('[data-slot="segmented-progress-step"]'),
    next: root.getByRole("button", { name: "Next" }),
  };
}

test("Sections: weights 2, 1, 3, 2, 1 split the bar after the gaps", async ({ page }) => {
  await openDocs(page, "light");
  const { steps } = demo(page);
  await expect(steps).toHaveCount(5);
  const weights = await steps.evaluateAll((els) =>
    els.map((e) => getComputedStyle(e).getPropertyValue("--segmented-progress-weight").trim()),
  );
  expect(weights).toEqual(["2", "1", "3", "2", "1"]);
  const widths = await steps.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  const unit = widths[1]!;
  for (const [i, w] of [2, 1, 3, 2, 1].entries()) expect(Math.abs(widths[i]! - w * unit)).toBeLessThanOrEqual(1);
});

test("Sections: a pending label fades in when its step fills, a done label shows from the first frame", async ({ page }) => {
  await openDocs(page, "light");
  const { steps, next } = demo(page);
  const label = (i: number) => steps.nth(i).locator('[data-slot="segmented-progress-label"]');
  // On mount: About You is done, Tickets is current, Travel is pending.
  expect(await style(label(0), "opacity")).toBe("1");
  expect(await style(label(2), "opacity")).toBe("0");
  // Next until Tickets is done and Travel fills.
  await expect(async () => {
    await next.click();
    await expect(steps.nth(2)).toHaveAttribute("data-state", "current", { timeout: 500 });
  }).toPass();
  expect(await style(label(2), "transition-duration")).not.toMatch(/^0s/);
  await expect.poll(() => style(label(2), "opacity")).toBe("1");
  // Tickets is done now, and a button back to it.
  await expect(steps.nth(1)).toHaveAttribute("data-state", "done");
  await expect(page.getByRole("button", { name: "Go to Tickets" })).toBeVisible();
});

test("Sections: under reduced motion a label switches with no transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocs(page, "light");
  const { steps } = demo(page);
  const duration = await style(steps.nth(2).locator('[data-slot="segmented-progress-label"]'), "transition-duration");
  // visor-core pins every duration to 0.01ms under reduce; the label adds none of its own.
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.00001);
});

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme after hydration.
  const theme = id === "today" ? TODAY_THEME : THEME;
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=(${THEME}|${theme})(&|$)`), { timeout: 20_000 });
  if (!new RegExp(`theme=${theme}(&|$)`).test((await iframe.getAttribute("src"))!)) {
    // Today can be its own theme (Honcho's is `honcho`); point that one frame at it.
    await iframe.evaluate((f: HTMLIFrameElement, t) => {
      const url = new URL(f.src, location.href);
      url.searchParams.set("theme", t);
      f.src = url.pathname + url.search;
    }, theme);
  }
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain(`theme=${theme}`);
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="segmented-progress-step"]`);
  return frame!;
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Sections: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          const panel = frame.locator('[data-slot="look-panel"]');
          await expect(panel).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const done = frame.locator('[data-slot="segmented-progress-step"][data-state="done"] [data-slot="segmented-progress-label"]').first();
          const track = frame.locator('[data-slot="segmented-progress-segment"]').first();
          const ink = await style(done, "color");
          // Over a photo the label is the progress glass ink (unbound, the glass layer's); on a
          // plain look it is the theme's text ink. White in Light + Photo waits on BO-84 binding it.
          const themeInk = await resolveInk(done, look.photo ? PROGRESS_GLASS_INK : "var(--text-secondary)");
          expect(themeInk).not.toBe(SENTINEL);
          expect(ink).toBe(themeInk);
          const blur = await style(track, "backdrop-filter");
          if (look.photo) expect(blur).not.toBe("none");
          else expect(blur).toBe("none");
          if (SHOTS) {
            await frame.evaluate(() => document.fonts.ready);
            await page
              .locator(`[data-slot="five-looks"] [data-look="${look.id}"]`)
              .screenshot({ path: `${SHOTS}/${look.id}__${width}__docs-${docsMode}.png`, animations: "disabled" });
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

// V6 (white Light + Photo labels) stays open until BO-84 binds components.segmented-progress.glass-ink
// to #ffffff in honcho-backstage's light tone. This proves the token reaches the labels and only them.
test("Light + Photo: binding --segmented-progress-glass-ink turns the labels white and leaves Alert's ink alone", async ({ page }) => {
  const panel = (specimen: string) => `/looks/panel?theme=${THEME}&look=light-photo&mode=light&specimen=${specimen}`;
  const bind = () =>
    page.evaluate(() =>
      document.querySelector<HTMLElement>('[data-slot="look-panel"]')!.style.setProperty("--segmented-progress-glass-ink", "#ffffff"),
    );

  // Reduced motion, so a colour transition can't be caught mid-way.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const open = async (specimen: string) => {
    await page.goto(panel(specimen));
    await expect(page.locator("body")).toHaveClass(new RegExp(`(^|\\s)${THEME}-theme(\\s|$)`));
  };

  await open("segmented-progress");
  const labels = page.locator('[data-slot="segmented-progress-step"]:not([data-state="failed"]) [data-slot="segmented-progress-label"]');
  await expect(labels.first()).toBeVisible();
  const before = await resolveInk(labels.first(), PROGRESS_GLASS_INK);
  expect(before).not.toBe(SENTINEL);
  expect(await labels.evaluateAll((els) => els.map((e) => getComputedStyle(e).color))).toEqual(
    Array(await labels.count()).fill(before),
  );
  await bind();
  // visor-core keeps a 0.01ms transition under reduce, so the new colour lands a frame later.
  await expect
    .poll(() => labels.evaluateAll((els) => els.map((e) => getComputedStyle(e).color)))
    .toEqual(Array(await labels.count()).fill("rgb(255, 255, 255)"));

  await open("alert");
  const alertText = page.locator('[data-slot="alert-title"], [data-slot="alert-description"]');
  await expect(alertText.first()).toBeVisible();
  const read = () => alertText.evaluateAll((els) => els.map((e) => getComputedStyle(e).color));
  const alertBefore = await read();
  expect(alertBefore.length).toBeGreaterThan(0);
  await bind();
  // Give a colour change two frames to land before reading it back unchanged.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(await read()).toEqual(alertBefore);
});
