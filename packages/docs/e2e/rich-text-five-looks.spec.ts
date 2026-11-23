import { test, expect, type Frame, type Locator, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// VI-813: RichText in all five looks at 390 and 1440 wide, with the docs site in light and dark.
// Text and link ink inherit from the card; the link underline is the theme's
// `rich-text.link-underline`; RichText itself never blurs.
const PAGE = "/docs/components/typography/rich-text";
// The five looks are Backstage's (honcho-backstage, with Today on honcho); needs visor-themes-private.
const THEME = process.env.VI813_THEME ?? "honcho-backstage";
const TODAY_THEME = process.env.VI813_TODAY_THEME ?? "honcho";
// Same-origin photo paths for the photo looks (a night photo and a day photo), e.g. `/photos/dark.webp`.
const PHOTO_DARK = process.env.VI813_PHOTO_DARK;
const PHOTO_LIGHT = process.env.VI813_PHOTO_LIGHT;
// Review shots (5 looks x 2 widths, docs in light) go to VI813_SHOTS, through the capture script
// at VI813_CLEAN_CAPTURE when given (it stamps the base commit and parks the pointer).
const SHOTS = process.env.VI813_SHOTS;
const CLEAN_CAPTURE = process.env.VI813_CLEAN_CAPTURE;
// A public build such as CI has no private themes, so the looks checks skip there, as VI-809's do.
const GENERATED = join(__dirname, "../lib/private-themes.generated.ts");
const THEME_INSTALLED = existsSync(GENERATED) && readFileSync(GENERATED, "utf-8").includes(`slug: "${THEME}"`);
const NOT_INSTALLED = `${THEME} is a private theme; not installed in this build`;
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];
// Visor's stock gray steps (#1f2937 #374151 #4b5563 #111827 #f9fafb #f3f4f6 #e5e7eb #d1d5db).
const DEFAULT_GREYS = [
  "rgb(31, 41, 55)", "rgb(55, 65, 81)", "rgb(75, 85, 99)", "rgb(17, 24, 39)",
  "rgb(249, 250, 251)", "rgb(243, 244, 246)", "rgb(229, 231, 235)", "rgb(209, 213, 219)",
];
const UNDERLINE ="var(--rich-text-link-underline, color-mix(in srgb, currentColor 40%, transparent))";

const style = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

// The theme's underline, resolved by a probe placed beside the link (so currentColor is the same ink).
const themeUnderline = (link: Locator) =>
  link.evaluate((n, value) => {
    const probe = document.createElement("span");
    probe.style.textDecorationColor = value;
    n.parentElement!.appendChild(probe);
    const c = getComputedStyle(probe).textDecorationColor;
    probe.remove();
    return c;
  }, UNDERLINE);

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript(
    ([m, t]) => {
      localStorage.setItem("visor-theme", t);
      localStorage.setItem("visor-color-mode", m);
      localStorage.setItem("theme", m);
    },
    [mode, THEME],
  );
  const query = new URLSearchParams();
  if (PHOTO_DARK) query.set("photo-dark", PHOTO_DARK);
  if (PHOTO_LIGHT) query.set("photo-light", PHOTO_LIGHT);
  await page.goto(query.size ? `${PAGE}?${query}` : PAGE);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme after hydration.
  const theme = id === "today" ? TODAY_THEME : THEME;
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=(${THEME}|${theme})(&|$)`), { timeout: 20_000 });
  if (!new RegExp(`theme=${theme}(&|$)`).test((await iframe.getAttribute("src"))!)) {
    // Honcho's Today is its own theme (`honcho`); point that one frame at it.
    await iframe.evaluate((f: HTMLIFrameElement, t) => {
      const url = new URL(f.src, location.href);
      url.searchParams.set("theme", t);
      f.src = url.pathname + url.search;
    }, theme);
  }
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain(`theme=${theme}`);
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-demo="rich-text"] a`);
  return frame!;
}

test("Markup preview: a link inherits the paragraph's ink and carries the theme underline", async ({ page }) => {
  await openDocs(page, "light");
  const link = page.locator("article a[rel='noreferrer'][target='_blank']").first();
  await expect(link).toBeVisible();
  expect(await style(link, "color")).toBe(await link.evaluate((n) => getComputedStyle(n.parentElement!).color));
  expect(await style(link, "text-decoration-line")).toBe("underline");
  expect(await style(link, "text-decoration-color")).toBe(await themeUnderline(link));
});

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`RichText: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      test.skip(!THEME_INSTALLED, NOT_INSTALLED);
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);
      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      for (const look of LOOKS) {
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          const panel = frame.locator('[data-slot="look-panel"]');
          await expect(panel).toHaveAttribute("data-mode", look.mode ?? docsMode);
          const body = frame.locator('[data-demo="rich-text"]');
          const links = body.locator("a");
          await expect(links).toHaveCount(2);
          for (const link of await links.all()) {
            // Link text is the surrounding ink; the underline is the theme's value for this look.
            expect(await style(link, "color")).toBe(await link.evaluate((n) => getComputedStyle(n.parentElement!).color));
            const underline = await style(link, "text-decoration-color");
            expect(underline).toBe(await themeUnderline(link));
            expect(underline).not.toBe(await style(link, "color"));
          }
          await expect(body.locator('[role="list"] [role="listitem"]')).toHaveCount(2);
          // RichText draws no glass of its own, in any look.
          const blurs = await body.evaluate((root) =>
            [root, ...root.querySelectorAll("*")].map((n) => getComputedStyle(n).backdropFilter).filter((b) => b !== "none"),
          );
          expect(blurs).toEqual([]);
          // No Visor default grey shows through in a Honcho look: the theme binds every surface and ink.
          const greys = await panel.evaluate((root, list) => {
            const hits: string[] = [];
            for (const n of [root, ...root.querySelectorAll("*")]) {
              const cs = getComputedStyle(n);
              for (const p of ["color", "background-color", "border-top-color", "text-decoration-color"] as const) {
                const v = cs.getPropertyValue(p);
                if (list.includes(v) && !(p === "border-top-color" && cs.borderTopStyle === "none")) hits.push(`${n.tagName}.${p}=${v}`);
              }
            }
            return hits;
          }, DEFAULT_GREYS);
          expect(greys).toEqual([]);
          if (look.photo && (look.mode === "dark" ? PHOTO_DARK : PHOTO_LIGHT)) {
            const bg = await style(panel, "background-image");
            expect(bg).toContain(look.mode === "dark" ? PHOTO_DARK : PHOTO_LIGHT);
          }
          if (SHOTS && docsMode === "light") {
            // Each frame is its own Next page: hide its dev badge too.
            await frame.addStyleTag({ content: "nextjs-portal{display:none!important}" });
            await frame.evaluate(() => document.fonts.ready);
            const target = page.locator(`[data-slot="five-looks"] [data-look="${look.id}"]`);
            const path = `${SHOTS}/rich-text__${look.id}__${width}.png`;
            if (CLEAN_CAPTURE) await (await import(CLEAN_CAPTURE)).cleanShot(page, { path, target });
            else await target.screenshot({ path, animations: "disabled" });
          }
        }).toPass({ timeout: 30_000 });
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
