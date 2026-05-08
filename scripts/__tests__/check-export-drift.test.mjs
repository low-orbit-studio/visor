/**
 * Unit tests for check-export-drift.mjs
 *
 * Covers:
 *  - Import parsing (babel + regex fallback)
 *  - Export surface parsing from .d.ts
 *  - exports field resolution (subpaths, conditions, wildcards)
 *  - Dependency graph construction
 *  - Clean case → no drift detected
 *  - Missing-export case → drift detected
 *  - Subpath imports correctly resolved
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

import {
  parseImportsRegex,
  parseExportsFromDts,
  resolveExportsEntry,
  resolveTypesFromEntry,
  collectExportsFromDts,
  resolveExportSurface,
  buildDepGraph,
} from "../check-export-drift.mjs";

// ─── parseImportsRegex ────────────────────────────────────────────────────────

describe("parseImportsRegex", () => {
  it("parses simple named imports", () => {
    const source = `import { Foo, Bar } from "@loworbitstudio/visor-theme-engine";`;
    const result = parseImportsRegex(source, "@loworbitstudio/");
    expect(result.get("@loworbitstudio/visor-theme-engine")).toContain("Foo");
    expect(result.get("@loworbitstudio/visor-theme-engine")).toContain("Bar");
  });

  it("parses subpath imports", () => {
    const source = `import { flutterAdapter } from "@loworbitstudio/visor-theme-engine/adapters";`;
    const result = parseImportsRegex(source, "@loworbitstudio/");
    expect(result.get("@loworbitstudio/visor-theme-engine/adapters")).toContain("flutterAdapter");
  });

  it("parses type imports", () => {
    const source = `import type { FlutterAdapterOptions } from "@loworbitstudio/visor-theme-engine/adapters";`;
    const result = parseImportsRegex(source, "@loworbitstudio/");
    expect(result.get("@loworbitstudio/visor-theme-engine/adapters")).toContain(
      "FlutterAdapterOptions",
    );
  });

  it("handles aliased imports (takes the original name)", () => {
    const source = `import { Foo as F, Bar } from "@loworbitstudio/visor-theme-engine";`;
    const result = parseImportsRegex(source, "@loworbitstudio/");
    const syms = result.get("@loworbitstudio/visor-theme-engine");
    expect(syms).toContain("Foo");
    expect(syms).toContain("Bar");
  });

  it("returns empty map for non-scoped imports", () => {
    const source = `import { something } from "other-package";`;
    const result = parseImportsRegex(source, "@loworbitstudio/");
    expect(result.size).toBe(0);
  });

  it("collects symbols from multiple imports of same specifier", () => {
    const source = `
import { Foo } from "@loworbitstudio/visor-theme-engine";
import { Bar } from "@loworbitstudio/visor-theme-engine";
    `;
    const result = parseImportsRegex(source, "@loworbitstudio/");
    const syms = result.get("@loworbitstudio/visor-theme-engine");
    expect(syms).toContain("Foo");
    expect(syms).toContain("Bar");
  });

  it("returns empty map for empty source", () => {
    const result = parseImportsRegex("", "@loworbitstudio/");
    expect(result.size).toBe(0);
  });
});

// ─── parseExportsFromDts ──────────────────────────────────────────────────────

describe("parseExportsFromDts", () => {
  it("parses export block { Foo, Bar }", () => {
    const source = `export { Foo, Bar };`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("Foo");
    expect(result).toContain("Bar");
  });

  it("parses export type { ... }", () => {
    const source = `export type { MyType, AnotherType };`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("MyType");
    expect(result).toContain("AnotherType");
  });

  it("parses per-name type modifier: export { type Foo, Bar }", () => {
    // tsup emits: export { type CSSFile, ColorRole, type Confidence }
    const source = `export { type CSSFile, ColorRole, type Confidence };`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("CSSFile");
    expect(result).toContain("ColorRole");
    expect(result).toContain("Confidence");
    expect(result).not.toContain("type CSSFile");
    expect(result).not.toContain("type Confidence");
  });

  it("parses export declare function", () => {
    const source = `export declare function generateTheme(options: any): any;`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("generateTheme");
  });

  it("parses export declare const", () => {
    const source = `export declare const FOWT_SCRIPT: string;`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("FOWT_SCRIPT");
  });

  it("parses export declare class", () => {
    const source = `export declare class ThemeEngine {}`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("ThemeEngine");
  });

  it("parses export declare type", () => {
    const source = `export declare type ThemeConfig = {};`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("ThemeConfig");
  });

  it("parses export declare interface", () => {
    const source = `export declare interface AdapterInput {}`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("AdapterInput");
  });

  it("parses aliased export blocks (takes original name)", () => {
    const source = `export { flutterAdapter as flutter };`;
    const result = parseExportsFromDts(source);
    expect(result).toContain("flutterAdapter");
  });

  it("returns empty set for source with no exports", () => {
    const source = `const foo = 1;`;
    const result = parseExportsFromDts(source);
    expect(result.size).toBe(0);
  });

  it("handles real-world adapters index.d.ts content", () => {
    const source = `
export { nextjsAdapter } from "./nextjs.js";
export { fumadocsAdapter } from "./fumadocs.js";
export { flutterAdapter } from "./flutter.js";
export { LAYER_ORDER, wrapInLayer } from "./layers.js";
export type { AdapterInput, AdapterOptions } from "./types.js";
    `.trim();
    const result = parseExportsFromDts(source);
    expect(result).toContain("nextjsAdapter");
    expect(result).toContain("fumadocsAdapter");
    expect(result).toContain("flutterAdapter");
    expect(result).toContain("LAYER_ORDER");
    expect(result).toContain("wrapInLayer");
    expect(result).toContain("AdapterInput");
    expect(result).toContain("AdapterOptions");
  });
});

// ─── resolveExportsEntry ──────────────────────────────────────────────────────

describe("resolveExportsEntry", () => {
  it("resolves root subpath '.'", () => {
    const exports = {
      ".": { import: "./dist/index.js", types: "./dist/index.d.ts" },
    };
    const result = resolveExportsEntry(exports, ".");
    expect(result).toEqual({ import: "./dist/index.js", types: "./dist/index.d.ts" });
  });

  it("resolves named subpath './adapters'", () => {
    const exports = {
      ".": "./dist/index.js",
      "./adapters": {
        import: "./dist/adapters/index.js",
        types: "./dist/adapters/index.d.ts",
      },
    };
    const result = resolveExportsEntry(exports, "./adapters");
    expect(result).toEqual({
      import: "./dist/adapters/index.js",
      types: "./dist/adapters/index.d.ts",
    });
  });

  it("returns null for unknown subpath", () => {
    const exports = {
      ".": "./dist/index.js",
    };
    expect(resolveExportsEntry(exports, "./unknown")).toBeNull();
  });

  it("resolves wildcard subpath pattern", () => {
    const exports = {
      "./*": "./dist/*.js",
    };
    const result = resolveExportsEntry(exports, "./foo");
    expect(result).toBe("./dist/foo.js");
  });

  it("returns string when exports is just a string (root only)", () => {
    expect(resolveExportsEntry("./dist/index.js", ".")).toBe("./dist/index.js");
    expect(resolveExportsEntry("./dist/index.js", "./adapters")).toBeNull();
  });
});

// ─── resolveTypesFromEntry ────────────────────────────────────────────────────

describe("resolveTypesFromEntry", () => {
  it("returns string entry directly", () => {
    expect(resolveTypesFromEntry("./dist/index.d.ts")).toBe("./dist/index.d.ts");
  });

  it("prefers 'types' condition over 'import'", () => {
    const entry = {
      import: "./dist/index.js",
      types: "./dist/index.d.ts",
    };
    expect(resolveTypesFromEntry(entry)).toBe("./dist/index.d.ts");
  });

  it("falls back to 'import' when no types", () => {
    const entry = {
      import: "./dist/index.js",
    };
    expect(resolveTypesFromEntry(entry)).toBe("./dist/index.js");
  });

  it("falls back to 'default' when no types or import", () => {
    const entry = {
      default: "./dist/index.js",
    };
    expect(resolveTypesFromEntry(entry)).toBe("./dist/index.js");
  });

  it("returns null for unrecognized object", () => {
    const entry = { custom: "./foo.js" };
    expect(resolveTypesFromEntry(entry)).toBeNull();
  });

  it("returns null for null", () => {
    expect(resolveTypesFromEntry(null)).toBeNull();
  });
});

// ─── collectExportsFromDts (with filesystem) ──────────────────────────────────

describe("collectExportsFromDts", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(os.tmpdir(), "visor-drift-test-"));
  });

  it("collects direct exports from a .d.ts file", () => {
    const dtsPath = join(tmpDir, "index.d.ts");
    writeFileSync(dtsPath, `export declare function foo(): void;\nexport declare const bar: string;`);

    const acc = new Set();
    collectExportsFromDts(tmpDir, dtsPath, `export declare function foo(): void;\nexport declare const bar: string;`, acc, new Set());
    expect(acc).toContain("foo");
    expect(acc).toContain("bar");
  });

  it("follows star re-exports to adjacent .d.ts files", () => {
    const subDir = join(tmpDir, "sub");
    mkdirSync(subDir);

    const subDts = join(subDir, "thing.d.ts");
    writeFileSync(subDts, `export declare function thing(): void;`);

    const indexDts = join(tmpDir, "index.d.ts");
    writeFileSync(indexDts, `export * from "./sub/thing.js";`);

    const acc = new Set();
    collectExportsFromDts(
      tmpDir,
      indexDts,
      `export * from "./sub/thing.js";`,
      acc,
      new Set(),
    );
    expect(acc).toContain("thing");
  });

  it("prevents infinite loops in circular re-exports", () => {
    const dtsPath = join(tmpDir, "index.d.ts");
    writeFileSync(dtsPath, `export * from "./index.js";`);

    const acc = new Set();
    // Should not throw or infinite loop
    expect(() =>
      collectExportsFromDts(tmpDir, dtsPath, `export * from "./index.js";`, acc, new Set()),
    ).not.toThrow();
  });
});

// ─── resolveExportSurface (with filesystem) ───────────────────────────────────

describe("resolveExportSurface", () => {
  let pkgDir;

  beforeEach(() => {
    pkgDir = mkdtempSync(join(os.tmpdir(), "visor-drift-pkg-"));
    mkdirSync(join(pkgDir, "dist"), { recursive: true });
    mkdirSync(join(pkgDir, "dist", "adapters"), { recursive: true });
  });

  it("resolves root export surface from package.json exports field", () => {
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@loworbitstudio/visor-theme-engine",
        exports: {
          ".": {
            import: "./dist/index.js",
            types: "./dist/index.d.ts",
          },
        },
      }),
    );
    writeFileSync(
      join(pkgDir, "dist", "index.d.ts"),
      `export declare function generateTheme(): void;\nexport declare function validate(): void;`,
    );

    const surface = resolveExportSurface(
      pkgDir,
      "@loworbitstudio/visor-theme-engine",
      "@loworbitstudio/visor-theme-engine",
    );
    expect(surface).toContain("generateTheme");
    expect(surface).toContain("validate");
  });

  it("resolves subpath export surface (./adapters)", () => {
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@loworbitstudio/visor-theme-engine",
        exports: {
          ".": { types: "./dist/index.d.ts" },
          "./adapters": {
            import: "./dist/adapters/index.js",
            types: "./dist/adapters/index.d.ts",
          },
        },
      }),
    );
    writeFileSync(
      join(pkgDir, "dist", "adapters", "index.d.ts"),
      `export declare function flutterAdapter(): void;\nexport declare function nextjsAdapter(): void;`,
    );

    const surface = resolveExportSurface(
      pkgDir,
      "@loworbitstudio/visor-theme-engine/adapters",
      "@loworbitstudio/visor-theme-engine",
    );
    expect(surface).toContain("flutterAdapter");
    expect(surface).toContain("nextjsAdapter");
  });

  it("returns empty set for unknown subpath (not in exports map)", () => {
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@loworbitstudio/visor-theme-engine",
        exports: {
          ".": { types: "./dist/index.d.ts" },
        },
      }),
    );

    const surface = resolveExportSurface(
      pkgDir,
      "@loworbitstudio/visor-theme-engine/unknown",
      "@loworbitstudio/visor-theme-engine",
    );
    expect(surface.size).toBe(0);
  });

  it("missing export is NOT in surface (drift detection scenario)", () => {
    // Simulates theme-engine@0.4.0 which does NOT export flutterAdapter
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@loworbitstudio/visor-theme-engine",
        exports: {
          ".": { types: "./dist/index.d.ts" },
          "./adapters": {
            types: "./dist/adapters/index.d.ts",
          },
        },
      }),
    );
    // Old adapters/index.d.ts WITHOUT flutterAdapter
    writeFileSync(
      join(pkgDir, "dist", "adapters", "index.d.ts"),
      `export declare function nextjsAdapter(): void;\nexport declare function fumadocsAdapter(): void;`,
    );

    const surface = resolveExportSurface(
      pkgDir,
      "@loworbitstudio/visor-theme-engine/adapters",
      "@loworbitstudio/visor-theme-engine",
    );
    // flutterAdapter was NOT exported in this old version
    expect(surface).not.toContain("flutterAdapter");
    // But nextjsAdapter was
    expect(surface).toContain("nextjsAdapter");
  });
});

// ─── buildDepGraph ────────────────────────────────────────────────────────────

describe("buildDepGraph", () => {
  const makePackages = () => [
    {
      name: "@loworbitstudio/visor-theme-engine",
      dir: "/fake/theme-engine",
      version: "0.4.1",
      pkgJson: { name: "@loworbitstudio/visor-theme-engine", dependencies: {} },
    },
    {
      name: "@loworbitstudio/visor",
      dir: "/fake/cli",
      version: "0.7.0",
      pkgJson: {
        name: "@loworbitstudio/visor",
        dependencies: {
          "@loworbitstudio/visor-theme-engine": "^0.4.0",
        },
      },
    },
    {
      name: "@loworbitstudio/visor-core",
      dir: "/fake/tokens",
      version: "0.6.0",
      pkgJson: {
        name: "@loworbitstudio/visor-core",
        devDependencies: {
          "@loworbitstudio/visor-theme-engine": "^0.4.0",
        },
      },
    },
  ];

  it("builds graph with CLI and tokens as downstreams of theme-engine", () => {
    const graph = buildDepGraph(makePackages());
    expect(graph.has("@loworbitstudio/visor-theme-engine")).toBe(true);
    const downstreams = graph.get("@loworbitstudio/visor-theme-engine");
    const names = downstreams.map((d) => d.downstream.name);
    expect(names).toContain("@loworbitstudio/visor");
    expect(names).toContain("@loworbitstudio/visor-core");
  });

  it("records the version range from downstream package.json", () => {
    const graph = buildDepGraph(makePackages());
    const downstreams = graph.get("@loworbitstudio/visor-theme-engine");
    const cli = downstreams.find((d) => d.downstream.name === "@loworbitstudio/visor");
    expect(cli.versionRange).toBe("^0.4.0");
  });

  it("returns empty graph when no inter-workspace deps", () => {
    const packages = [
      {
        name: "@loworbitstudio/visor-theme-engine",
        dir: "/fake/theme-engine",
        version: "0.4.1",
        pkgJson: { name: "@loworbitstudio/visor-theme-engine", dependencies: {} },
      },
      {
        name: "@loworbitstudio/visor-core",
        dir: "/fake/tokens",
        version: "0.6.0",
        pkgJson: {
          name: "@loworbitstudio/visor-core",
          dependencies: { yaml: "^2.0.0" }, // external dep only
        },
      },
    ];
    const graph = buildDepGraph(packages);
    expect(graph.size).toBe(0);
  });

  it("does not include external packages in the graph", () => {
    const packages = [
      {
        name: "@loworbitstudio/visor",
        dir: "/fake/cli",
        version: "0.7.0",
        pkgJson: {
          name: "@loworbitstudio/visor",
          dependencies: {
            "@babel/parser": "^7.26.0", // external, not a workspace pkg
            commander: "^13.1.0",
          },
        },
      },
    ];
    const graph = buildDepGraph(packages);
    expect(graph.size).toBe(0);
  });
});

// ─── Integration-style: drift detection logic ─────────────────────────────────

describe("drift detection logic (unit)", () => {
  it("no drift: all imported symbols exist in export surface", () => {
    const exportSurface = new Set(["flutterAdapter", "nextjsAdapter", "fumadocsAdapter"]);
    const importedSymbols = new Set(["flutterAdapter", "nextjsAdapter"]);

    const missing = [...importedSymbols].filter((sym) => !exportSurface.has(sym));
    expect(missing).toHaveLength(0);
  });

  it("drift detected: imported symbol NOT in export surface", () => {
    // Simulates the W020 incident: CLI imports flutterAdapter but
    // theme-engine@0.4.0 tarball doesn't export it
    const exportSurface = new Set(["nextjsAdapter", "fumadocsAdapter"]);
    const importedSymbols = new Set(["flutterAdapter", "nextjsAdapter"]);

    const missing = [...importedSymbols].filter((sym) => !exportSurface.has(sym));
    expect(missing).toEqual(["flutterAdapter"]);
  });

  it("type imports also count as drift candidates", () => {
    const exportSurface = new Set(["nextjsAdapter"]);
    const importedSymbols = new Set(["FlutterAdapterOptions"]); // type import

    const missing = [...importedSymbols].filter((sym) => !exportSurface.has(sym));
    expect(missing).toEqual(["FlutterAdapterOptions"]);
  });
});
