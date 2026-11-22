import { readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test, expect, type Frame, type Page, type TestInfo } from "@playwright/test";
import { scanConcentric, type ConcentricPair } from "../../tokens/src/test-utils/concentric-scan";

// VI-838: every rounded box drawn inside another rounded box on a component
// page must be concentric (inner = outer - gap, the same inset on both axes).
// The audit behind the allowlist is docs/audits/concentric-corners.md.

/** Pairs that are not concentric on purpose: `<page> <outer > inner>` → the reason. */
const ALLOWLIST: Record<string, string> = {
  "/docs/components/navigation/doc-nav div[data-slot=doc-nav-group] > a[data-slot=doc-nav-pill]":
    "Pill links in a ~12px cluster (BO-67 design). Deriving gives 3px pills; deriving the cluster gives the ballooned radius BO-67 removed.",
  "/docs/components/navigation/doc-frame div[data-slot=doc-nav-group] > a[data-slot=doc-nav-pill]":
    "The same doc-nav pills, inside DocFrame.",
  "/docs/components/data-display/fidelity-mirror div > span":
    "The specimen mirrors the doc-nav pills above, so it carries their allowlisted shape.",
  "/docs/components/data-display/layer-chart button[data-slot=layer-chart-block] > span.layer-chart.text":
    "A backing chip that hugs the label over the pattern; its size follows the text, not the block.",
};

// The allowlist cannot quietly absorb failures: growing it past this means raising the cap in review.
const ALLOWLIST_CAP = 6;

const CONTENT = join(__dirname, "../content/docs/components");
const PAGES = (function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith(".mdx") ? [join(dir, d.name)] : [],
  );
})(CONTENT)
  .map((f) => "/docs/components/" + relative(CONTENT, f).replace(/\.mdx$/, "").replace(/(^|\/)index$/, ""))
  .sort();

const CONCURRENCY = 6;

type Found = ConcentricPair & { page: string };
const allowed = (p: Found) => `${p.page} ${p.key}` in ALLOWLIST;

/** Wait for finite animations and transitions, so boxes are measured at rest. */
const settle = (frame: Frame) =>
  frame.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => null)),
    ).then(() => true),
  );

// Overlays are closed on load: open the first one on each page and scan what it portals in.
const TRIGGER = '.preview-render [aria-haspopup]:not([disabled]), .preview-render [aria-controls][aria-expanded="false"]:not([disabled])';
const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]';
const OVERLAY = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]';

/** Scan one frame under `root`; attach a shot of each failing pair. */
async function scanFrame(frame: Frame, path: string, root: string | undefined, info: TestInfo): Promise<Found[]> {
  await settle(frame).catch(() => null);
  const pairs = await frame.evaluate(scanConcentric, { root, mark: true }).catch(() => [] as ConcentricPair[]);
  const found = pairs.map((p) => ({ ...p, page: path }));
  if (found.some((p) => !p.ok && !allowed(p))) {
    const outers = frame.locator("[data-concentric-outer]");
    for (let i = 0; i < Math.min(await outers.count(), 3); i++) {
      const shot = await outers.nth(i).screenshot().catch(() => null);
      if (shot) await info.attach(`${path.replace(/\//g, "_")}-${i}.png`, { body: shot, contentType: "image/png" });
    }
  }
  return found;
}

/** Scan the page's examples, every iframe on it (the look frames) and its first overlay, opened. */
async function scanPage(page: Page, path: string, info: TestInfo): Promise<Found[]> {
  await page.goto(path, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const out: Found[] = [];
  for (const frame of page.frames()) {
    out.push(...(await scanFrame(frame, path, frame === page.mainFrame() ? ".preview-render" : undefined, info)));
  }
  const trigger = page.locator(TRIGGER).first();
  if ((await trigger.count()) && (await trigger.click({ timeout: 2_000 }).then(() => true, () => false))) {
    await page.locator(OVERLAY).first().waitFor({ timeout: 1_000 }).catch(() => null);
    // Items only paint when highlighted: hover the first one, which sits in the menu's corner.
    await page.locator(ITEM).first().hover({ timeout: 1_000 }).catch(() => null);
    out.push(...(await scanFrame(page.mainFrame(), path, OVERLAY, info)));
    await page.keyboard.press("Escape");
  }
  return out;
}

test("the scan fails a 12px card around an 8px child inset 8px", async ({ page }) => {
  const html = (inner: number) => `
    <div style="padding:8px;border-radius:12px;background:#eee;width:200px">
      <div style="height:40px;border-radius:${inner}px;background:#333"></div>
    </div>`;
  await page.setContent(html(8));
  const bad = await page.evaluate(scanConcentric, {});
  expect(bad.filter((p) => !p.ok).map((p) => [p.corner, p.innerRadius, p.expected])).toEqual([
    ["top-left", 8, 4],
    ["top-right", 8, 4],
    ["bottom-right", 8, 4],
    ["bottom-left", 8, 4],
  ]);
  await page.setContent(html(4));
  const good = await page.evaluate(scanConcentric, {});
  expect(good).toHaveLength(4);
  expect(good.every((p) => p.ok)).toBe(true);
});

test("component pages have no unlisted non-concentric corners", async ({ browser }, info) => {
  test.setTimeout(300_000);
  expect(Object.keys(ALLOWLIST).length).toBeLessThanOrEqual(ALLOWLIST_CAP);

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const queue = [...PAGES];
  const found: Found[] = [];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      const page = await context.newPage();
      for (let path = queue.shift(); path; path = queue.shift()) found.push(...(await scanPage(page, path, info)));
      await page.close();
    }),
  );
  await context.close();

  if (process.env.CONCENTRIC_AUDIT) writeFileSync(process.env.CONCENTRIC_AUDIT, JSON.stringify(found, null, 2));

  // Every allowlist entry must still match a pair, so a fixed pair leaves the list.
  const stale = Object.keys(ALLOWLIST).filter((k) => !found.some((p) => !p.ok && `${p.page} ${p.key}` === k));
  expect(stale, "Allowlist entries that no longer match a pair").toEqual([]);

  const report = [
    ...new Set(
      found
        .filter((p) => !p.ok && !allowed(p))
        .map(
          (p) =>
            `${p.page}  ${p.key}  ${p.corner}: outer ${p.outerRadius}px, inset ${p.gapX}x${p.gapY}px, inner ${p.innerRadius}px, expected ${p.expected}px` +
            (p.outerShape !== p.innerShape ? ` (corner-shape ${p.outerShape} vs ${p.innerShape})` : ""),
        ),
    ),
  ];
  expect(report, "Nested corners that are not concentric: derive inner = outer - inset, or allowlist with a reason").toEqual([]);
});
