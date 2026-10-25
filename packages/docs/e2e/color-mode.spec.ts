/**
 * Color-mode resolution + built-site routing, on the production build (VI-722).
 *
 * Run: `npm run docs:build && npm run test:prod -w packages/docs`
 *
 * VI-721 shipped two bugs no gate could see: light mode rendered dark for
 * dark-OS visitors (the `prefers-color-scheme` branch of every theme's CSS),
 * and a homepage link that 404'd. The VR suite runs the dev server with
 * Playwright's default light scheme against a page that forces the mode, so it
 * never drives the real path: OS scheme x stored choice x INIT_SCRIPT x theme CSS.
 *
 * Asserts computed values (no snapshots): body background luminance matches the
 * expected mode, and `#nd-page p` text meets WCAG AA against its background.
 */
import { test, expect } from "@playwright/test";
import { STOCK_GROUPS } from "../lib/theme-config";

type Mode = "light" | "dark";

const cells: { os: Mode; stored: Mode | null }[] = [
  { os: "dark", stored: "light" },
  { os: "light", stored: "dark" },
  { os: "dark", stored: null },
  { os: "light", stored: null },
];

// Always-dark stock themes: their light mode uses near-black surfaces (see
// public/themes/*.visor.yaml). STOCK_GROUPS carries no `defaultMode` for them.
const ALWAYS_DARK = new Set(["blackout", "borderless"]);

const themes = STOCK_GROUPS.flatMap((g) => g.themes);

for (const theme of themes) {
  for (const { os, stored } of cells) {
    const cell = `theme=${theme.value} OS=${os} stored=${stored ?? "none"}`;
    test(`color mode: ${cell}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: os });
      await ctx.addInitScript(
        ([t, m]) => {
          localStorage.setItem("visor-theme", t as string);
          if (m) {
            localStorage.setItem("visor-color-mode", m);
            localStorage.setItem("theme", m);
          }
        },
        [theme.value, stored],
      );
      const page = await ctx.newPage();
      await page.goto("/docs", { waitUntil: "networkidle" });

      const r = await page.evaluate(() => {
        // Canvas normalises any computed color syntax (oklab, color-mix) to sRGB.
        const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
        const rgba = (c: string) => {
          px.clearRect(0, 0, 1, 1);
          px.fillStyle = "#000";
          px.fillStyle = c;
          px.fillRect(0, 0, 1, 1);
          return Array.from(px.getImageData(0, 0, 1, 1).data);
        };
        const lum = ([r, g, b]: number[]) => {
          const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const bgOf = (el: Element | null) => {
          for (; el; el = el.parentElement) {
            const c = rgba(getComputedStyle(el).backgroundColor);
            if (c[3] > 0) return c;
          }
          return [255, 255, 255, 255];
        };
        const p = document.querySelector("#nd-page p")!;
        const bg = bgOf(p);
        const fg = rgba(getComputedStyle(p).color);
        const [a, b] = [lum(bg), lum(fg)].sort((x, y) => y - x);
        return {
          htmlClass: document.documentElement.className,
          bgLum: lum(bgOf(document.body)),
          contrast: (a + 0.05) / (b + 0.05),
        };
      });
      await ctx.close();

      const expected: Mode = theme.defaultMode ?? (ALWAYS_DARK.has(theme.value) ? "dark" : null) ?? stored ?? os;
      const actual: Mode = r.bgLum < 0.18 ? "dark" : "light";
      const info = `[${cell}] html.class="${r.htmlClass}" bgLuminance=${r.bgLum.toFixed(3)} contrast=${r.contrast.toFixed(2)}`;
      expect(actual, `expected ${expected} background, got ${actual} ${info}`).toBe(expected);
      expect(r.contrast, `text/background contrast below 4.5 ${info}`).toBeGreaterThanOrEqual(4.5);
    });
  }
}

test.describe("built-site routing", () => {
  test("homepage /docs links return 200", async ({ request }) => {
    const home = await (await request.get("/")).text();
    const hrefs = [...new Set([...home.matchAll(/href="(\/docs[^"#?]*)/g)].map((m) => m[1]))];
    expect(hrefs.length, "no /docs links found on the homepage").toBeGreaterThan(0);
    const bad: string[] = [];
    for (const h of hrefs) {
      const res = await request.get(h);
      if (res.status() !== 200) bad.push(`${h} -> ${res.status()}`);
    }
    expect(bad, `homepage links not 200: ${bad.join(", ")}`).toEqual([]);
  });

  test("/docs/components/button redirects (308) to its grouped page", async ({ request }) => {
    const res = await request.get("/docs/components/button", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(/^\/docs\/components\/[^/]+\/button$/);
  });

  test("sampled sitemap URLs return 200", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const paths = [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
    expect(paths.length).toBeGreaterThan(50);
    // Every 10th page plus the first page of every top-level section.
    const sections = new Set<string>();
    const sample = paths.filter((p, i) => {
      const section = p.split("/").slice(0, 3).join("/");
      const first = !sections.has(section);
      sections.add(section);
      return first || i % 10 === 0;
    });
    const bad: string[] = [];
    for (const p of sample) {
      const res = await request.get(p);
      if (res.status() !== 200) bad.push(`${p} -> ${res.status()}`);
    }
    expect(bad, `sitemap URLs not 200: ${bad.join(", ")}`).toEqual([]);
  });
});
