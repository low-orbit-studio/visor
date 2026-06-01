import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "child_process";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from "fs";
import { tmpdir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GENERATOR_PATH = resolve(__dirname, "../generate-private-themes.mjs");
const CSS_PATH = resolve(__dirname, "../../app/private-themes.generated.css");
const TS_PATH = resolve(__dirname, "../../lib/private-themes.generated.ts");

// A minimal, self-contained private theme fixture. Inlined (not copied from the
// developer's ~/Code/low-orbit/visor-themes-private checkout) so the test is
// hermetic and runs in CI regardless of worktree depth. VI-474.
const FIXTURE_THEME_YAML = `name: testbrand
version: 1
group: Test
colors:
  primary: "#6366F1"
  accent: "#F472B6"
  neutral: "#6B7280"
  background: "#F9FAFB"
  surface: "#FFFFFF"
typography:
  heading:
    family: Inter
    weights: [400, 700]
  body:
    family: Inter
    weights: [400]
`;
const FIXTURE_META_JSON = JSON.stringify({ name: "testbrand", group: "Test", private: true });

/**
 * Run the generator with an isolated VISOR_THEMES_PRIVATE_PATH so the FS-scan
 * fallback (the VI-474 fix) resolves a known fixture rather than the ambient
 * sibling/parent-glob checkout. Mirrors how `visor theme sync` resolves the
 * same env var.
 */
function runGenerator(privatePath?: string) {
  const env = { ...process.env };
  if (privatePath === undefined) {
    delete env.VISOR_THEMES_PRIVATE_PATH;
  } else {
    env.VISOR_THEMES_PRIVATE_PATH = privatePath;
  }
  return spawnSync("node", [GENERATOR_PATH], { encoding: "utf-8", env });
}

describe("generate-private-themes.mjs", () => {
  describe("local checkout resolves (Low Orbit dev/CI path — VI-474)", () => {
    let fixtureRoot: string;

    beforeAll(() => {
      // Materialize a temp `themes/{slug}/` layout matching the
      // visor-themes-private package shape (theme.visor.yaml + meta.json).
      fixtureRoot = mkdtempSync(join(tmpdir(), "vi474-private-themes-"));
      const themeDir = join(fixtureRoot, "themes", "testbrand");
      mkdirSync(themeDir, { recursive: true });
      writeFileSync(join(themeDir, "theme.visor.yaml"), FIXTURE_THEME_YAML, "utf-8");
      writeFileSync(join(themeDir, "meta.json"), FIXTURE_META_JSON, "utf-8");
    });

    afterAll(() => {
      rmSync(fixtureRoot, { recursive: true, force: true });
    });

    it("exits 0 and emits no empty-stubs warning when a local source resolves", () => {
      const result = runGenerator(fixtureRoot);
      expect(result.status).toBe(0);
      expect(result.stdout).not.toContain("empty stubs written");
      expect(result.stdout).toContain("generated 1 theme(s)");
      expect(result.stdout).toContain("using local private themes at");
    });

    it("writes a non-empty manifest and CSS for the resolved theme", () => {
      runGenerator(fixtureRoot);

      const ts = readFileSync(TS_PATH, "utf-8");
      expect(ts).toContain('import type { PrivateThemeEntry }');
      expect(ts).not.toContain("PRIVATE_THEMES: PrivateThemeEntry[] = []");
      // Manifest entry carries slug, the resolved label, and the meta.json group.
      expect(ts).toContain('slug: "testbrand"');
      expect(ts).toContain('group: "Test"');

      const css = readFileSync(CSS_PATH, "utf-8");
      expect(css.length).toBeGreaterThan(EMPTY_CSS_MAX_BYTES);
      expect(css).toContain("testbrand-theme");
    });

    it("is idempotent — running twice produces identical output", () => {
      runGenerator(fixtureRoot);
      const cssBefore = readFileSync(CSS_PATH, "utf-8");
      const tsBefore = readFileSync(TS_PATH, "utf-8");
      runGenerator(fixtureRoot);
      const cssAfter = readFileSync(CSS_PATH, "utf-8");
      const tsAfter = readFileSync(TS_PATH, "utf-8");
      expect(cssAfter).toBe(cssBefore);
      expect(tsAfter).toBe(tsBefore);
    });
  });

  describe("no source available (public self-hoster path)", () => {
    let emptyRoot: string;

    beforeAll(() => {
      // An env override pointing at an empty `themes/` dir forces the
      // zero-themes branch deterministically, without touching the ambient
      // sibling/parent-glob checkout.
      emptyRoot = mkdtempSync(join(tmpdir(), "vi474-empty-themes-"));
      mkdirSync(join(emptyRoot, "themes"), { recursive: true });
    });

    afterAll(() => {
      rmSync(emptyRoot, { recursive: true, force: true });
    });

    it("exits 0 and writes empty stubs when the resolved source has zero themes", () => {
      const result = runGenerator(emptyRoot);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("empty stubs written");

      expect(existsSync(CSS_PATH)).toBe(true);
      expect(existsSync(TS_PATH)).toBe(true);

      const ts = readFileSync(TS_PATH, "utf-8");
      expect(ts).toContain("PRIVATE_THEMES: PrivateThemeEntry[] = []");
      expect(ts).toContain('import type { PrivateThemeEntry }');

      const css = readFileSync(CSS_PATH, "utf-8");
      expect(css).not.toMatch(/@import/);
      expect(css).not.toMatch(/-theme\s*\{/);
    });

    it("emits no private-theme classes for any known private slug", () => {
      runGenerator(emptyRoot);
      const css = readFileSync(CSS_PATH, "utf-8");
      const ts = readFileSync(TS_PATH, "utf-8");
      const knownPrivateSlugs = [
        "animal", "blacklight", "blacklight-pro", "entr",
        "kaiah", "reference-app", "solespark", "veronica",
      ];
      for (const slug of knownPrivateSlugs) {
        expect(css).not.toContain(`${slug}-theme`);
        expect(ts).not.toContain(`"slug": "${slug}"`);
        expect(ts).not.toContain(`slug: "${slug}"`);
      }
    });
  });

  describe("brand assets (VI-489)", () => {
    let fixtureRoot: string;
    // A branded theme (logo/brandmark/wordmark, no monochrome — mirrors BO-47)
    // plus a plain theme, so we can assert brand is emitted only when a `brand/`
    // dir ships and that a brandless theme omits the field.
    const BRANDED = "vi489brandfix";
    const PLAIN = "vi489plainfix";
    const publicThemesDir = resolve(__dirname, "../../public/themes");
    const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>`;

    const BRANDED_YAML = `name: ${BRANDED}
version: 1
group: Test
colors:
  primary: "#6366F1"
  accent: "#F472B6"
  neutral: "#6B7280"
  background: "#F9FAFB"
  surface: "#FFFFFF"
brand:
  org: low-orbit-studio
  source: local
  logo:
    formats: [svg]
    light: /themes/${BRANDED}/brand/${BRANDED}-logo-light.svg
    dark: /themes/${BRANDED}/brand/${BRANDED}-logo-dark.svg
  brandmark:
    formats: [svg]
    light: /themes/${BRANDED}/brand/${BRANDED}-brandmark-light.svg
    dark: /themes/${BRANDED}/brand/${BRANDED}-brandmark-dark.svg
  wordmark:
    formats: [svg]
    light: /themes/${BRANDED}/brand/${BRANDED}-wordmark-light.svg
    dark: /themes/${BRANDED}/brand/${BRANDED}-wordmark-dark.svg
`;
    const PLAIN_YAML = `name: ${PLAIN}
version: 1
group: Test
colors:
  primary: "#10B981"
  accent: "#F59E0B"
  neutral: "#6B7280"
  background: "#F9FAFB"
  surface: "#FFFFFF"
`;

    beforeAll(() => {
      fixtureRoot = mkdtempSync(join(tmpdir(), "vi489-brand-"));
      const brandedDir = join(fixtureRoot, "themes", BRANDED);
      const brandAssetsDir = join(brandedDir, "brand");
      mkdirSync(brandAssetsDir, { recursive: true });
      writeFileSync(join(brandedDir, "theme.visor.yaml"), BRANDED_YAML, "utf-8");
      writeFileSync(join(brandedDir, "meta.json"), JSON.stringify({ name: BRANDED, group: "Test", private: true }), "utf-8");
      for (const variant of ["logo", "brandmark", "wordmark"]) {
        for (const mode of ["light", "dark"]) {
          writeFileSync(join(brandAssetsDir, `${BRANDED}-${variant}-${mode}.svg`), SVG, "utf-8");
        }
      }
      const plainDir = join(fixtureRoot, "themes", PLAIN);
      mkdirSync(plainDir, { recursive: true });
      writeFileSync(join(plainDir, "theme.visor.yaml"), PLAIN_YAML, "utf-8");
      writeFileSync(join(plainDir, "meta.json"), JSON.stringify({ name: PLAIN, group: "Test", private: true }), "utf-8");
    });

    afterAll(() => {
      rmSync(fixtureRoot, { recursive: true, force: true });
      // Build artifacts the generator copies into the (gitignored) public dir.
      rmSync(join(publicThemesDir, BRANDED), { recursive: true, force: true });
      rmSync(join(publicThemesDir, PLAIN), { recursive: true, force: true });
    });

    it("emits a brand entry only for the theme that ships a brand/ dir", () => {
      const result = runGenerator(fixtureRoot);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("generated 2 theme(s)");

      const ts = readFileSync(TS_PATH, "utf-8");
      const brandedLine = ts.split("\n").find((l) => l.includes(`slug: "${BRANDED}"`)) ?? "";
      const plainLine = ts.split("\n").find((l) => l.includes(`slug: "${PLAIN}"`)) ?? "";

      // Branded theme carries its declared marks…
      expect(brandedLine).toContain("brand: {");
      expect(brandedLine).toContain(`/themes/${BRANDED}/brand/${BRANDED}-logo-light.svg`);
      // …and the undeclared monochrome slot falls back to the Visor default (D2).
      expect(brandedLine).toContain("/themes/visor/brand/visor-monochrome.svg");
      // Plain theme is present but carries no brand field.
      expect(plainLine).not.toBe("");
      expect(plainLine).not.toContain("brand:");
    });

    it("copies the branded theme's SVGs into public/themes/{slug}/brand/", () => {
      runGenerator(fixtureRoot);
      for (const variant of ["logo", "brandmark", "wordmark"]) {
        for (const mode of ["light", "dark"]) {
          expect(
            existsSync(join(publicThemesDir, BRANDED, "brand", `${BRANDED}-${variant}-${mode}.svg`)),
          ).toBe(true);
        }
      }
      // The plain theme gets no public brand dir.
      expect(existsSync(join(publicThemesDir, PLAIN))).toBe(false);
    });
  });

  describe("public bundle leak guard (build artifact)", () => {
    const NEXT_DIR = resolve(__dirname, "../../.next");
    const KNOWN_PRIVATE_SLUGS = [
      "animal", "blacklight", "blacklight-pro", "entr",
      "kaiah", "reference-app", "solespark", "veronica",
    ];

    it.skipIf(!existsSync(NEXT_DIR))(
      "build output contains no private-theme CSS classes when package is absent",
      () => {
        const grep = spawnSync(
          "grep",
          ["-rho", "--include=*.js", "--include=*.css", "--include=*.html",
            ...KNOWN_PRIVATE_SLUGS.flatMap((s) => ["-e", `${s}-theme`]),
            NEXT_DIR],
          { encoding: "utf-8" }
        );
        // grep exits 1 when no matches found — that's the success signal here
        expect(grep.status === 1 || (grep.status === 0 && grep.stdout.trim() === "")).toBe(true);
      },
      30_000
    );
  });
});

// The empty-stub CSS header is ~140 bytes; a generated theme block is multiple
// KB. Any output above this floor proves real theme CSS was emitted.
const EMPTY_CSS_MAX_BYTES = 500;
