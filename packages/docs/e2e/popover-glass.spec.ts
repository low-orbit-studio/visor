import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";

// VI-808: a stay-mounted Popover (`forceMount`) renders in place, fades in and out,
// is hidden from the keyboard and screen readers while closed, keeps focus on its
// trigger, and turns to glass only in the Photo looks.
const PAGE = "/docs/components/overlay/popover";
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

async function openDocs(page: Page, mode: "light" | "dark" = "light") {
  await page.addInitScript((m) => {
    localStorage.setItem("visor-theme", "neutral");
    localStorage.setItem("visor-color-mode", m);
    localStorage.setItem("theme", m);
  }, mode);
  await page.goto(PAGE);
}

function demo(page: Page) {
  const root = page.locator('[data-demo="popover-stay-mounted"]').first();
  return {
    root,
    trigger: root.getByRole("button", { name: "Your account" }),
    panel: root.locator('[data-slot="popover-content"]'),
    help: root.getByRole("button", { name: "Help" }),
  };
}

const style = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);
/** Alpha of a computed colour (`rgba(…, a)` or `color(… / a)`); 1 when opaque. */
const alpha = (c: string) => Number((c.match(/(?:,|\/)\s*([\d.]+)\)$/) ?? [])[1] ?? 1);

/** Open with Enter from the trigger, retrying until hydration has wired the trigger. */
async function openWithEnter(page: Page) {
  const { trigger, panel } = demo(page);
  await expect(async () => {
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toHaveAttribute("data-state", "open", { timeout: 500 });
  }).toPass();
}

test("Popover stay mounted: page load does not steal focus", async ({ page }) => {
  await openDocs(page);
  const { panel } = demo(page);
  await expect(panel).toHaveAttribute("data-state", "closed");
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
});

test("Popover stay mounted: hidden while closed, fades open, keyboard walk", async ({ page }) => {
  await openDocs(page);
  const { root, trigger, panel, help } = demo(page);

  // Closed: mounted, transparent, out of the accessibility tree and the tab order.
  await expect(panel).toHaveAttribute("data-state", "closed");
  await expect(panel).toHaveAttribute("inert", "");
  expect(await style(panel, "opacity")).toBe("0");
  // Polled: the docs hold transitions off for a moment while the theme settles on load.
  await expect.poll(() => style(panel, "transition-property")).toContain("opacity");
  await expect.poll(() => root.ariaSnapshot()).not.toContain("dialog");
  await trigger.focus();
  await page.keyboard.press("Tab");
  await expect(help).toBeFocused();

  // Enter opens; focus stays on the trigger; the panel fades to 1 and joins the tree.
  await openWithEnter(page);
  await expect(trigger).toBeFocused();
  await expect.poll(() => style(panel, "opacity")).toBe("1");
  expect(await root.ariaSnapshot()).toContain('dialog "Your account"');

  // Tab reaches the first item; Escape closes and focus returns to the trigger.
  await page.keyboard.press("Tab");
  await expect(root.getByRole("button", { name: "Change Email" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveAttribute("data-state", "closed");
  await expect(trigger).toBeFocused();
  await expect.poll(() => style(panel, "opacity")).toBe("0");
  await expect.poll(() => root.ariaSnapshot()).not.toContain("dialog");

  // An outside click closes it.
  await openWithEnter(page);
  await page.locator("h1").first().click();
  await expect(panel).toHaveAttribute("data-state", "closed");
});

test("Popover stay mounted: under reduced motion it does not rise", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocs(page);
  const { panel } = demo(page);
  await expect(panel).toHaveAttribute("data-state", "closed");
  expect(await style(panel, "translate")).toBe("none");
  await openWithEnter(page);
  await expect.poll(() => style(panel, "opacity")).toBe("1");
  expect(await style(panel, "translate")).toBe("none");
});

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme
  // after hydration. Read only the final document.
  await expect(iframe).toHaveAttribute("src", /theme=neutral/, { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain("theme=neutral");
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-slot="popover-content"][data-state="open"]`);
  return frame!;
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`Popover glass: five looks at ${width} with the docs in ${docsMode}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);

      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const panel = frame.locator('[data-slot="popover-content"]');
          await expect.poll(() => style(panel, "opacity")).toBe("1");
          // Chromium has no -webkit-backdrop-filter; playwright.webkit.config.ts (local only) reads it in WebKit.
          const props = browserName === "webkit" ? ["backdrop-filter", "-webkit-backdrop-filter"] : ["backdrop-filter"];
          const filters = await Promise.all(props.map((p) => style(panel, p)));
          if (look.photo) {
            for (const f of filters) expect(f).toContain("blur(");
          } else {
            expect(filters).toEqual(props.map(() => "none"));
          }
          // Menu rows are a see-through tint, never a solid slab, and stacked rows never touch.
          const rows = [panel.getByRole("button", { name: "Change Email" }), panel.getByRole("button", { name: "Sign Out" })];
          for (const row of rows) expect(alpha(await style(row, "background-color"))).toBeLessThan(1);
          const [a, b] = await Promise.all(rows.map((r) => r.boundingBox()));
          expect(b!.y - (a!.y + a!.height)).toBeGreaterThanOrEqual(8);
          // One line per look for the PR body's local WebKit result.
          if (browserName === "webkit") console.log(`pass ${docsMode} docs, ${look.label}: ${props.map((p, i) => `${p}=${filters[i]}`).join(", ")}`);
        }).toPass({ timeout: 20_000 });
      }

      // Ten frames: each look at 390 and 1440 (captured once, in Chromium, with the docs in light).
      if (docsMode === "light" && browserName === "chromium") {
        for (const look of LOOKS) {
          // The Next dev badge never reaches a capture.
          await (await lookFrame(page, look.id)).addStyleTag({ content: "nextjs-portal{display:none!important}" });
          await grid.locator(`[data-look="${look.id}"]`).screenshot({
            path: test.info().snapshotPath(`${look.id}-${width}.png`),
            animations: "disabled",
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
