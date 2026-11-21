import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

// VI-801: Chip, StatusDot, Text (eyebrow) and the OfflineBanner pill replace the
// itinerary's own labels. Each of the four docs pages shows them in all five looks,
// at 390 and 1440 wide. Only the pill turns to glass, and only over a photo.
const PAGES = [
  "/docs/components/form/chip",
  "/docs/components/data-display/status-dot",
  "/docs/components/typography/text",
  "/docs/components/feedback/offline-banner",
];
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false },
  { id: "dark-photo", label: "Dark + Photo", photo: true },
  { id: "light", label: "Light", photo: false },
  { id: "light-photo", label: "Light + Photo", photo: true },
];

async function openDocs(page: Page, path: string) {
  await page.addInitScript(() => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", "light");
    localStorage.setItem("theme", "light");
  });
  await page.goto(path);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme after hydration.
  await expect(iframe).toHaveAttribute("src", /theme=neutral/, { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain("theme=neutral");
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="itinerary-labels-specimen"]`);
  return frame!;
}

const backdrops = (frame: Frame, selector: string) =>
  frame.locator(selector).evaluateAll((els) => els.map((el) => getComputedStyle(el).backdropFilter));

for (const width of [1440, 390]) {
  for (const path of PAGES) {
    test(`Itinerary labels: five looks at ${width} on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, path);
      await expect(page.locator('[data-slot="five-looks"] figcaption')).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          for (const slot of ["chip", "status-dot", "text"]) {
            const values = await backdrops(frame, `[data-slot="look-panel"] [data-slot="${slot}"]`);
            expect(values.length, `${slot} in ${look.id}`).toBeGreaterThan(0);
            expect(values.every((v) => v === "none"), `${slot} blurs in ${look.id}`).toBe(true);
          }
          const pills = frame.locator('[data-slot="offline-banner"][data-variant="pill"]');
          const pillBlur = await backdrops(frame, '[data-slot="offline-banner"][data-variant="pill"]');
          expect(pillBlur.length).toBe(2);
          for (const v of pillBlur) {
            if (look.photo) expect(v).not.toBe("none");
            else expect(v).toBe("none");
          }
          // The pill's text is never clipped.
          const clipped = await pills.evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length);
          expect(clipped).toBe(0);
          await expect(pills.first()).toHaveText("Offline · saved 9PM");
        }).toPass({ timeout: 30_000 });
      }

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  }
}

/** Clone `el` into a fresh wrapper carrying `vars`, and read computed styles off the clone. */
async function readInWrapper(el: Locator, vars: string, inline = "") {
  return el.evaluate(
    (node, [wrapperStyle, cloneStyle]) => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("style", wrapperStyle);
      const clone = node.cloneNode(true) as HTMLElement;
      if (cloneStyle) clone.setAttribute("style", cloneStyle);
      wrapper.appendChild(clone);
      node.parentElement!.appendChild(wrapper);
      const cs = getComputedStyle(clone);
      const out = {
        backgroundColor: cs.backgroundColor,
        width: cs.width,
        fontWeight: cs.fontWeight,
        textTransform: cs.textTransform,
      };
      wrapper.remove();
      return out;
    },
    [vars, inline] as const,
  );
}

/** The computed colour a `var()` expression resolves to beside `el`. */
const resolveColor = (el: Locator, expr: string) =>
  el.evaluate((node, e) => {
    const probe = document.createElement("span");
    probe.style.color = e;
    node.parentElement!.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, expr);

test("Chip: the default variant reads --chip-bg", async ({ page }) => {
  await openDocs(page, PAGES[0]);
  const chip = page.locator('[data-slot="chip"][data-variant="default"]').first();
  const read = await readInWrapper(chip, "--chip-bg: rgb(1 2 3)");
  expect(read.backgroundColor).toBe("rgb(1, 2, 3)");
});

test("StatusDot: size and colour hooks, and the shipped dot unset", async ({ page }) => {
  await openDocs(page, PAGES[1]);
  const dot = page.locator('[data-slot="status-dot"][data-tone="muted"]').first();
  const bound = await readInWrapper(dot, "--status-dot-size: 9px", "--status-dot-color: rgb(4, 5, 6)");
  expect(bound.width).toBe("9px");
  expect(bound.backgroundColor).toBe("rgb(4, 5, 6)");
  const plain = await readInWrapper(dot, "");
  expect(plain.width).toBe("6px");
  expect(plain.backgroundColor).toBe(await resolveColor(dot, "var(--text-tertiary)"));
});

test("Text eyebrow: uppercase, and its weight hook binds", async ({ page }) => {
  await openDocs(page, PAGES[2]);
  const eyebrow = page.locator('[data-slot="text"]', { hasText: "Your Shifts" }).first();
  expect(await eyebrow.evaluate((n) => getComputedStyle(n).textTransform)).toBe("uppercase");
  const bound = await readInWrapper(eyebrow, "--text-eyebrow-font-weight: 680");
  expect(bound.fontWeight).toBe("680");
});
