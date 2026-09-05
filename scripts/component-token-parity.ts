/**
 * VI-625 — the D4 proof, in a real browser.
 *
 * D4 says both halves must be shown, not asserted in prose:
 *
 *   (a) a theme binding NOTHING renders exactly as it did before the contract;
 *   (b) a theme binding EVERYTHING visibly changes every consuming surface.
 *
 * A string check on the CSS cannot prove either — `var(--x, inherit)` versus a
 * missing declaration, or a hook lifted off `.root` into its use site, are
 * textually different and computationally identical. So this script renders the
 * real component CSS in Chromium and compares `getComputedStyle`:
 *
 *   BEFORE  = every touched .module.css as it exists at the base ref
 *   UNBOUND = the same modules on this branch, no `components:` block
 *   BOUND   = the same modules plus the CSS the theme engine emits for the
 *             fully-bound fixture theme
 *
 * BEFORE vs UNBOUND must be identical on every probed property of every probed
 * element, in light and dark. UNBOUND vs BOUND must differ, for every family.
 *
 * It also writes the two-theme side-by-side the operator signs off on.
 *
 * Usage:
 *   npx tsx scripts/component-token-parity.ts [--base origin/main] [--out docs/audits/VI-625]
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import {
  COMPONENT_TOKEN_FAMILIES,
  resolveComponentBindings,
} from "../packages/theme-engine/src/component-tokens.js";
import { generateThemeData, parseConfig } from "../packages/theme-engine/src/pipeline.js";
import { resolveConfig } from "../packages/theme-engine/src/resolve.js";
import { nextjsAdapter } from "../packages/theme-engine/src/adapters/nextjs.js";

// ── args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function arg(flag: string, fallback: string): string {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const BASE_REF = arg("--base", "origin/main");
const OUT_DIR = arg("--out", "docs/audits/VI-625");

// ── the modules under test ───────────────────────────────────────────────────

/** Every CSS module the contract touches, in a stable order. */
const MODULES = [
  ...new Set(
    COMPONENT_TOKEN_FAMILIES.flatMap((f) =>
      f.tokens.flatMap((t) => t.consumers.map((c) => c.file)),
    ),
  ),
].sort();

/** Read a file at a git ref. Returns null when the path is new on this branch. */
function atRef(ref: string, path: string): string | null {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], { encoding: "utf-8" });
  } catch {
    return null;
  }
}

/**
 * Namespace a module's class selectors so every family can share one page.
 * `.base` in chip and `.base` in banner would otherwise collide. Class names
 * come from the module's `.d.ts` sidecar, which the repo maintains alongside
 * every `components/**` module.
 */
function classNamesFor(modulePath: string): string[] {
  const dts = `${modulePath}.d.ts`;
  if (!existsSync(dts)) return [];
  return [...readFileSync(dts, "utf-8").matchAll(/readonly\s+["']?([A-Za-z0-9_-]+)["']?\s*:/g)].map(
    (m) => m[1],
  );
}

function nsFor(modulePath: string): string {
  return modulePath.split("/").slice(-2, -1)[0];
}

/** Rewrite `.base` → `.chip__base` for every known class in the module. */
function namespaceCss(css: string, modulePath: string): string {
  const ns = nsFor(modulePath);
  const names = classNamesFor(modulePath).sort((a, b) => b.length - a.length);
  let out = css;
  for (const name of names) {
    out = out.replace(new RegExp(`\\.${name}(?![\\w-])`, "g"), `.${ns}__${name}`);
  }
  return out;
}

// ── the fixture page ─────────────────────────────────────────────────────────

/**
 * One markup block per family, using the namespaced class names and the same
 * data attributes the real components set. Every element that carries a
 * contract token is marked `data-probe` so the computed-style pass finds it.
 */
function fixtureMarkup(): string {
  const c = (mod: string, ...names: string[]) => names.map((n) => `${mod}__${n}`).join(" ");
  return `
<main class="page">
  <section class="band" data-family="page-header">
    <div class="${c("page-header", "base", "sizeMd")}" data-probe="page-header-base">
      <div class="${c("page-header", "row")}">
        <div class="${c("page-header", "text")}">
          <span class="${c("page-header", "eyebrow")}" data-probe="page-header-eyebrow">Workspace</span>
          <h1 class="${c("page-header", "title")}" data-probe="page-header-title">Organizations</h1>
          <p class="${c("page-header", "description")}" data-probe="page-header-description">Every org on the plan, with seat counts and billing state.</p>
        </div>
        <div class="${c("page-header", "actions")}" data-probe="page-header-actions">
          <span class="${c("badge", "base", "sizeMd", "variantSecondary")}" data-probe="badge-base">Beta</span>
        </div>
      </div>
    </div>
  </section>

  <section class="band" data-family="banner">
    <div class="${c("banner", "base", "intentWarning", "positionInline")}" data-probe="banner-base">
      <div class="${c("banner", "content")}">
        <div class="${c("banner", "title")}" data-probe="banner-title">Seat limit reached</div>
        <div class="${c("banner", "description")}" data-probe="banner-description">Upgrade to add more members.</div>
      </div>
    </div>
  </section>

  <section class="band" data-family="filter-bar">
    <div class="${c("filter-bar", "base")}" data-probe="filter-bar-base">
      <div class="${c("filter-bar", "row")}">
        <div class="${c("filter-bar", "filters")}">
          <button class="${c("chip", "base", "sizeMd", "interactive", "filterChip")}" data-selected="false" data-probe="chip-base">Status</button>
          <button class="${c("chip", "base", "sizeMd", "interactive", "selected")}" data-selected="true" data-probe="chip-selected">Active</button>
          <span class="${c("chip", "base", "sizeSm")}" data-probe="chip-sm">Small</span>
          <span class="${c("chip", "base", "sizeLg")}" data-probe="chip-lg">Large</span>
        </div>
        <div class="${c("filter-bar", "meta")}">
          <span class="${c("filter-bar", "results")}" data-probe="filter-bar-results">128 results</span>
        </div>
      </div>
    </div>
  </section>

  <section class="band" data-family="tabs">
    <div class="${c("tabs", "root")}">
      <div class="${c("tabs", "list", "listVariantDefault")}" data-probe="tabs-list">
        <button class="${c("tabs", "trigger")}" data-state="active" data-probe="tabs-trigger-active">All</button>
        <button class="${c("tabs", "trigger")}" data-state="inactive" data-probe="tabs-trigger">Archived</button>
      </div>
      <div class="${c("tabs", "list", "listVariantLine")}" data-probe="tabs-list-line">
        <button class="${c("tabs", "trigger")}" data-state="inactive">Members</button>
        <span class="${c("tabs", "indicator")}" data-probe="tabs-indicator" style="left:0;width:60px"></span>
      </div>
    </div>
  </section>

  <section class="band" data-family="table">
    <div class="${c("table", "container")}" data-probe="table-container">
      <table class="${c("table", "table")}" data-probe="table-table">
        <thead class="${c("table", "header")}">
          <tr class="${c("table", "row")}">
            <th class="${c("table", "head")}" data-probe="table-head"><input type="checkbox" class="${c("checkbox", "root")}" data-probe="checkbox-root" /></th>
            <th class="${c("table", "head")}">Organization</th>
            <th class="${c("table", "head")}">Plan</th>
          </tr>
        </thead>
        <tbody class="${c("table", "body")}">
          <tr class="${c("table", "row")}" data-probe="table-row">
            <td class="${c("table", "cell")}" data-probe="table-cell">1</td>
            <td class="${c("table", "cell")}">Northwind</td>
            <td class="${c("table", "cell")}">
              <span class="${c("badge", "base", "sizeMd", "variantSuccess")}"><span class="${c("status-badge", "indicator", "indicatorSuccess")}" data-probe="status-badge-indicator"></span><span class="${c("status-badge", "labelMono")}" data-probe="status-badge-mono">ACTIVE</span></span>
            </td>
          </tr>
          <tr class="${c("table", "row")}" data-state="selected">
            <td class="${c("table", "cell")}">2</td>
            <td class="${c("table", "cell")}">Contoso</td>
            <td class="${c("table", "cell")}">Trial</td>
          </tr>
        </tbody>
        <tfoot class="${c("table", "footer")}" data-probe="table-footer">
          <tr><td class="${c("table", "cell")}" colspan="3">2 organizations</td></tr>
        </tfoot>
      </table>
      <div class="${c("table", "caption")}" data-probe="table-caption">Updated moments ago</div>
    </div>
  </section>

  <section class="band" data-family="skeleton">
    <div class="${c("skeleton", "skeletonList")}">
      <div class="${c("skeleton", "skeletonListRow")}" data-probe="skeleton-row">
        <div class="${c("skeleton", "skeleton", "skeletonAvatar")}" data-probe="skeleton-avatar"></div>
        <div class="${c("skeleton", "skeletonListText")}">
          <div class="${c("skeleton", "skeleton", "skeletonLineHeading", "skeletonW60")}" data-probe="skeleton-line"></div>
          <div class="${c("skeleton", "skeleton", "skeletonLineBody", "skeletonW40")}"></div>
        </div>
        <div class="${c("skeleton", "skeleton", "skeletonBadge")}" data-probe="skeleton-badge"></div>
      </div>
    </div>
    <div class="spinnerRow">
      <span class="${c("spinner", "root", "sizeMd", "toneDefault")}" data-probe="spinner-md"></span>
      <span class="${c("spinner", "root", "sizeSm", "tonePrimary")}" data-probe="spinner-sm"></span>
      <span class="${c("spinner", "root", "sizeXs", "toneDefault")}" data-probe="spinner-xs"></span>
    </div>
  </section>

  <section class="band" data-family="empty-state">
    <div class="${c("empty-state", "base", "sizeMd", "toneDefault")}" data-probe="empty-state-base">
      <div class="${c("empty-state", "iconWrap")}" data-probe="empty-state-icon"></div>
      <h3 class="${c("empty-state", "heading")}" data-probe="empty-state-heading">No organizations yet</h3>
      <p class="${c("empty-state", "description")}" data-probe="empty-state-description">Invite a team to get started.</p>
      <div class="${c("empty-state", "actions")}" data-probe="empty-state-actions"></div>
    </div>
  </section>

  <section class="band" data-family="sidebar">
    <div class="${c("sidebar", "sidebarContent")}" data-probe="sidebar-content" style="height:auto">
      <div class="${c("sidebar", "header")}" data-probe="sidebar-header">Acme</div>
      <div class="${c("sidebar", "contentArea")}" data-probe="sidebar-content-area">
        <div class="${c("sidebar", "group")}">
          <div class="${c("sidebar", "groupLabel")}" data-probe="sidebar-group-label">Platform</div>
          <ul class="${c("sidebar", "menu")}" data-probe="sidebar-menu">
            <li class="${c("sidebar", "menuItem")}"><button class="${c("sidebar", "menuButton", "menuButtonSizeDefault")}" data-active data-probe="sidebar-item-active">Organizations</button></li>
            <li class="${c("sidebar", "menuItem")}"><button class="${c("sidebar", "menuButton", "menuButtonSizeDefault")}" data-probe="sidebar-item">Members</button></li>
          </ul>
        </div>
      </div>
      <div class="${c("sidebar", "footer")}" data-probe="sidebar-footer">Settings</div>
    </div>
  </section>
</main>`;
}

const PAGE_CSS = `
  body { margin: 0; background: var(--surface-page, #fff); color: var(--text-primary, #111827);
         font-family: var(--font-body, system-ui, sans-serif); }
  .page { display: flex; flex-direction: column; gap: 24px; padding: 24px; width: 960px; }
  .band { display: flex; flex-direction: column; gap: 12px; }
  .spinnerRow { display: flex; align-items: center; gap: 16px; padding-top: 12px; }
`;

/** Properties probed on every marked element. The union of the contract's. */
const PROPS = [
  "background-color", "background-image", "color",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-bottom-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-bottom", "row-gap", "column-gap",
  "width", "height", "box-shadow",
  "font-family", "font-size", "font-weight", "letter-spacing", "text-transform", "line-height",
  "animation-duration",
];

interface Probe {
  probe: string;
  styles: Record<string, string>;
}

async function collect(page: Page, css: string, mode: "light" | "dark"): Promise<Probe[]> {
  await page.emulateMedia({ colorScheme: mode });
  await page.setContent(
    `<html class="${mode === "dark" ? "dark" : ""}"><head><style>${css}</style></head>` +
      `<body>${fixtureMarkup()}</body></html>`,
    { waitUntil: "load" },
  );
  return page.evaluate((props) => {
    const out: { probe: string; styles: Record<string, string> }[] = [];
    for (const el of Array.from(document.querySelectorAll("[data-probe]"))) {
      const cs = getComputedStyle(el);
      const styles: Record<string, string> = {};
      for (const p of props) styles[p] = cs.getPropertyValue(p);
      out.push({ probe: (el as HTMLElement).dataset.probe!, styles });
    }
    return out;
  }, PROPS);
}

function diff(a: Probe[], b: Probe[]): string[] {
  const deltas: string[] = [];
  const byProbe = new Map(b.map((p) => [p.probe, p]));
  for (const left of a) {
    const right = byProbe.get(left.probe);
    if (!right) {
      deltas.push(`${left.probe}: missing on the other side`);
      continue;
    }
    for (const prop of PROPS) {
      if (left.styles[prop] !== right.styles[prop]) {
        deltas.push(`${left.probe} · ${prop}: ${left.styles[prop]} → ${right.styles[prop]}`);
      }
    }
  }
  return deltas;
}

// ── stylesheet assembly ──────────────────────────────────────────────────────

function tokensCss(): string {
  const p = "packages/tokens/dist/tokens.css";
  if (!existsSync(p)) {
    throw new Error("packages/tokens/dist/tokens.css missing — run `npm run build -w packages/tokens`");
  }
  return readFileSync(p, "utf-8");
}

function moduleCss(variant: "before" | "after"): string {
  const parts: string[] = [];
  for (const mod of MODULES) {
    const raw = variant === "before" ? atRef(BASE_REF, mod) : readFileSync(mod, "utf-8");
    if (raw === null) continue;
    parts.push(`/* ${variant}: ${mod} */`);
    parts.push(namespaceCss(raw, mod));
  }
  return parts.join("\n\n");
}

function boundThemeCss(fixture: string): string {
  const yaml = readFileSync(fixture, "utf-8");
  const config = parseConfig(yaml);
  const data = generateThemeData(yaml);
  const css = nextjsAdapter({
    config: resolveConfig(config),
    primitives: data.primitives,
    tokens: data.tokens,
  } as Parameters<typeof nextjsAdapter>[0]) as string;
  // Only the component-token bindings — not the fixture's whole palette, which
  // would confound "did the BINDING change this surface?" with "did the palette".
  const resolved = resolveComponentBindings(config.components);
  const light = Object.entries(resolved.light).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  const dark = Object.entries(resolved.dark).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  if (!css.includes("Component tokens (VI-625)")) {
    throw new Error(`engine emitted no component-token block for ${fixture}`);
  }
  return `:root {\n${light}\n}\nhtml.dark {\n${dark}\n}`;
}

// ── main ─────────────────────────────────────────────────────────────────────

function writeOut(relPath: string, content: string | Buffer): string {
  const full = join(OUT_DIR, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content as never);
  return full;
}

async function main() {
  const tokens = tokensCss();
  const before = `${tokens}\n${PAGE_CSS}\n${moduleCss("before")}`;
  const unbound = `${tokens}\n${PAGE_CSS}\n${moduleCss("after")}`;
  const bound = `${unbound}\n${boundThemeCss(
    "packages/theme-engine/src/__tests__/fixtures/fully-bound-components.visor.yaml",
  )}`;
  // Theme B of the operator's side-by-side — a realistic editorial-admin
  // binding rather than the deliberately garish machine-proof fixture.
  const editorial = `${unbound}\n${boundThemeCss(join(OUT_DIR, "editorial-admin.visor.yaml"))}`;

  const browser: Browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const report: string[] = [];
  let failed = false;

  for (const mode of ["light", "dark"] as const) {
    const beforeProbes = await collect(page, before, mode);
    await page.screenshot({ path: join(OUT_DIR, `unbound__${mode}.png`), fullPage: true });

    const unboundProbes = await collect(page, unbound, mode);
    const parity = diff(beforeProbes, unboundProbes);
    report.push(`## D4a — unbound is identical to ${BASE_REF} (${mode})`);
    report.push(parity.length === 0 ? "\nNo computed-style delta on any probe.\n" : "\n" + parity.map((d) => `- ${d}`).join("\n") + "\n");
    if (parity.length > 0) failed = true;

    const boundProbes = await collect(page, bound, mode);
    mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({ path: join(OUT_DIR, `bound__${mode}.png`), fullPage: true });

    const changed = diff(unboundProbes, boundProbes);
    const touchedProbes = new Set(changed.map((d) => d.split(" ·")[0]));
    report.push(`## D4b — the fully-bound theme moves every surface (${mode})`);
    report.push(
      `\n${changed.length} computed-style deltas across ${touchedProbes.size} of ${unboundProbes.length} probed elements.\n`,
    );

    const untouched = unboundProbes.map((p) => p.probe).filter((p) => !touchedProbes.has(p));
    if (untouched.length > 0) {
      report.push(`Unmoved probes: ${untouched.join(", ")}\n`);
      failed = true;
    }

    // The operator artifact: the same markup under a realistic second theme.
    const editorialProbes = await collect(page, editorial, mode);
    await page.screenshot({ path: join(OUT_DIR, `editorial__${mode}.png`), fullPage: true });
    const editorialDeltas = diff(unboundProbes, editorialProbes);
    const editorialTouched = new Set(editorialDeltas.map((d) => d.split(" ·")[0]));
    report.push(`## Operator side-by-side — editorial-admin theme (${mode})`);
    report.push(
      `\n\`unbound__${mode}.png\` vs \`editorial__${mode}.png\`: ${editorialDeltas.length} computed-style ` +
        `deltas across ${editorialTouched.size} of ${unboundProbes.length} probed elements, from ` +
        `\`editorial-admin.visor.yaml\` alone — same markup, no local CSS.\n`,
    );
  }

  await browser.close();

  const md = [
    "# VI-625 — component-token parity proof",
    "",
    `Base ref: \`${BASE_REF}\` · modules: ${MODULES.length} · probes rendered in Chromium at 2x.`,
    "",
    "`unbound__{mode}.png` and `bound__{mode}.png` are the two-theme side-by-side:",
    "identical markup, no local CSS, one theme binding nothing and one binding the",
    "whole contract.",
    "",
    ...report,
  ].join("\n");
  writeOut("parity-report.md", md);

  console.log(md);
  if (failed) {
    console.error("\nPARITY FAILED — see the deltas above.");
    process.exit(1);
  }
  console.log("\nPARITY OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
