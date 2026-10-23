import { describe, it, expect } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
// @ts-expect-error -- plain .mjs module shared with next.config.mjs
import { componentRedirects } from "../component-redirects.mjs";

const DOCS_ROOT = resolve(__dirname, "../..");
const CONTENT = join(DOCS_ROOT, "content/docs");
// Static redirects declared by hand in next.config.mjs.
const STATIC_REDIRECTS = ["/docs/theming", "/docs/creating-themes", "/docs/token-rules"];

// Sample sidebars of fictional pages (doc-nav / doc-frame demos); their URLs are fixtures, not links.
const FIXTURE_FILES = [
  "components/navigation/doc-frame.mdx",
  "components/navigation/doc-nav.mdx",
  "ui/doc-frame-demo.tsx",
  "ui/doc-nav-demo.tsx",
];

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const redirectSources = new Set<string>([
  ...STATIC_REDIRECTS,
  ...componentRedirects(join(CONTENT, "components")).map((r: { source: string }) => r.source),
]);

function resolves(url: string): boolean {
  const p = url.replace(/[?#].*$/, "").replace(/\/$/, "");
  if (p === "/docs") return true;
  if (redirectSources.has(p)) return true;
  const rel = p.slice("/docs/".length);
  return existsSync(join(CONTENT, `${rel}.mdx`)) || existsSync(join(CONTENT, rel, "index.mdx"));
}

// Matches /docs/... in markdown links, href/to attributes and string literals.
const LINK_RE = /(?<![\w./-])(\/docs\/[A-Za-z0-9_\-./#?=]*[A-Za-z0-9_\-])/g;

function brokenLinks(files: string[]): string[] {
  const broken: string[] = [];
  for (const f of files) {
    if (FIXTURE_FILES.some((x) => f.endsWith("/" + x))) continue;
    for (const m of readFileSync(f, "utf8").matchAll(LINK_RE)) {
      if (!resolves(m[1])) broken.push(`${f.replace(DOCS_ROOT + "/", "")}: ${m[1]}`);
    }
  }
  return broken;
}

describe("internal /docs links", () => {
  it("every /docs/ link in content, app and components resolves to a page or redirect", () => {
    const files = [
      ...walk(CONTENT, [".mdx"]),
      ...walk(join(DOCS_ROOT, "app"), [".tsx"]),
      ...walk(join(DOCS_ROOT, "components"), [".tsx"]),
    ];
    expect(brokenLinks(files)).toEqual([]);
  });

  it("flags a link to a nonexistent page", () => {
    const dir = mkdtempSync(join(tmpdir(), "vi721-"));
    const f = join(dir, "x.mdx");
    writeFileSync(f, "[nope](/docs/components/does-not-exist) [ok](/docs/components/button)");
    expect(brokenLinks([f])).toEqual([`${f.replace(DOCS_ROOT + "/", "")}: /docs/components/does-not-exist`]);
  });
});

describe("componentRedirects", () => {
  it("maps ungrouped slugs to their grouped page, plus the index", () => {
    const r = componentRedirects(join(CONTENT, "components"));
    expect(r).toContainEqual({
      source: "/docs/components/button",
      destination: "/docs/components/general/button",
      permanent: true,
    });
    expect(r[0]).toMatchObject({ source: "/docs/components", destination: "/docs/components/general/button" });
  });

  it("throws on a duplicate slug across groups", () => {
    const dir = mkdtempSync(join(tmpdir(), "vi721-"));
    for (const g of ["a", "b"]) {
      mkdirSync(join(dir, g));
      writeFileSync(join(dir, g, "dup.mdx"), "");
    }
    expect(() => componentRedirects(dir)).toThrow(/Duplicate component slug "dup"/);
  });
});
