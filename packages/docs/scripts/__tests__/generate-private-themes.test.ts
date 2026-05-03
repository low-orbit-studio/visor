import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from "fs";
import { tmpdir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GENERATOR_PATH = resolve(__dirname, "../generate-private-themes.mjs");
const CSS_PATH = resolve(__dirname, "../../app/private-themes.generated.css");
const TS_PATH = resolve(__dirname, "../../lib/private-themes.generated.ts");

function runGenerator() {
  return spawnSync("node", [GENERATOR_PATH], { encoding: "utf-8", env: { ...process.env } });
}

describe("generate-private-themes.mjs", () => {
  describe("package absent (public-build path)", () => {
    it("exits 0 and writes empty stubs when @low-orbit-studio/visor-themes-private is not installed", () => {
      const result = runGenerator();
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
      const css = readFileSync(CSS_PATH, "utf-8");
      const ts = readFileSync(TS_PATH, "utf-8");
      const knownPrivateSlugs = [
        "animal", "blacklight", "blacklight-underground", "entr",
        "kaiah", "reference-app", "solespark", "veronica",
      ];
      for (const slug of knownPrivateSlugs) {
        expect(css).not.toContain(`${slug}-theme`);
        expect(ts).not.toContain(`"slug": "${slug}"`);
        expect(ts).not.toContain(`slug: "${slug}"`);
      }
    });

    it("is idempotent — running twice produces identical output", () => {
      runGenerator();
      const cssBefore = readFileSync(CSS_PATH, "utf-8");
      const tsBefore = readFileSync(TS_PATH, "utf-8");
      runGenerator();
      const cssAfter = readFileSync(CSS_PATH, "utf-8");
      const tsAfter = readFileSync(TS_PATH, "utf-8");
      expect(cssAfter).toBe(cssBefore);
      expect(tsAfter).toBe(tsBefore);
    });
  });

  describe("public bundle leak guard (build artifact)", () => {
    const NEXT_DIR = resolve(__dirname, "../../.next");
    const KNOWN_PRIVATE_SLUGS = [
      "animal", "blacklight", "blacklight-underground", "entr",
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
