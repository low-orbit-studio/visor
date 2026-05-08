#!/usr/bin/env node
/**
 * check-export-drift.mjs
 *
 * Pre-publish CI gate — catches workspace export-surface drift before npm publish.
 *
 * For each workspace package that is about to publish:
 *   1. Walk every sibling workspace package that depends on it.
 *   2. Parse the downstream's TS source to extract named imports (including subpath).
 *   3. Resolve the upstream's ^X.Y.Z semver range against the npm registry.
 *   4. Download that tarball and parse its dist/**\/*.d.ts to enumerate exports.
 *   5. Fail if any imported symbol is missing from the upstream tarball's export surface.
 *
 * Usage:
 *   node scripts/check-export-drift.mjs
 *
 * Reference: docs/wisdom/W020-publish-coordination-drift.md
 */

import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createWriteStream } from "node:fs";
import { join, extname, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import https from "node:https";
import os from "node:os";
import { createHash } from "node:crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
const CACHE_DIR = join(os.tmpdir(), "visor-drift-cache");

// Only check these scope packages for drift (add more as needed)
const VISOR_SCOPE = "@loworbitstudio/";

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Read and parse a JSON file, returning null on error.
 */
function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Walk a directory recursively, yielding all file paths matching the filter.
 */
function* walkFiles(dir, filter) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walkFiles(full, filter);
    } else if (!filter || filter(full)) {
      yield full;
    }
  }
}

// ─── Import Parsing ───────────────────────────────────────────────────────────

/**
 * Parse named imports from a TypeScript source file for a given module specifier prefix.
 * Returns a Map<specifier, Set<namedSymbol>>.
 *
 * Handles:
 *   import { Foo, Bar } from "@loworbitstudio/pkg"
 *   import { Foo } from "@loworbitstudio/pkg/subpath"
 *   import type { Foo } from "@loworbitstudio/pkg/subpath"
 *
 * Uses @babel/parser so it handles TSX, decorators, etc.
 */
function parseImportsFromFile(filePath, scopePrefix) {
  const require = createRequire(import.meta.url);
  let babelParser;
  try {
    babelParser = require("@babel/parser");
  } catch {
    // Fallback to regex-based parsing if @babel/parser not available
    return parseImportsRegex(readFileSync(filePath, "utf8"), scopePrefix);
  }

  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch {
    return new Map();
  }

  let ast;
  try {
    ast = babelParser.parse(source, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
  } catch {
    // If parsing fails, fall back to regex
    return parseImportsRegex(source, scopePrefix);
  }

  const result = new Map(); // specifier → Set<symbol>

  for (const node of ast.program.body) {
    if (node.type !== "ImportDeclaration") continue;
    const specifier = node.source.value;
    if (!specifier.startsWith(scopePrefix)) continue;

    // Collect named imports (skip default and namespace)
    const names = node.specifiers
      .filter(
        (s) =>
          s.type === "ImportSpecifier" &&
          s.imported &&
          (s.imported.type === "Identifier" || s.imported.type === "StringLiteral"),
      )
      .map((s) =>
        s.imported.type === "Identifier" ? s.imported.name : s.imported.value,
      );

    if (names.length === 0) continue;

    if (!result.has(specifier)) result.set(specifier, new Set());
    for (const name of names) result.get(specifier).add(name);
  }

  return result;
}

/**
 * Regex-based fallback import parser (less precise but dependency-free).
 */
function parseImportsRegex(source, scopePrefix) {
  const result = new Map();
  // Match: import [type] { ... } from "specifier"
  const importRe =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'](@loworbitstudio\/[^"']+)["']/g;
  let m;
  while ((m = importRe.exec(source)) !== null) {
    const [, names, specifier] = m;
    if (!specifier.startsWith(scopePrefix)) continue;
    const symbols = names
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    if (!result.has(specifier)) result.set(specifier, new Set());
    for (const sym of symbols) result.get(specifier).add(sym);
  }
  return result;
}

// ─── Export Parsing from .d.ts ────────────────────────────────────────────────

/**
 * Parse named exports from a .d.ts file.
 * Handles:
 *   export { Foo, Bar };
 *   export type { Foo };
 *   export declare function foo(...
 *   export declare const foo
 *   export declare class Foo
 *   export declare type Foo
 *   export declare enum Foo
 *   export declare interface Foo
 */
function parseExportsFromDts(source) {
  const exports = new Set();

  // export { Foo, Bar as Baz }  (and export type { ... })
  // Also handles per-name type modifiers: export { type CSSFile, ColorRole }
  const reExportBlock =
    /^export\s+(?:type\s+)?\{([^}]+)\}/gm;
  let m;
  while ((m = reExportBlock.exec(source)) !== null) {
    for (const part of m[1].split(",")) {
      // Strip per-name `type ` prefix (e.g. `type CSSFile` → `CSSFile`)
      const rawName = part.trim().split(/\s+as\s+/)[0].trim();
      const name = rawName.replace(/^type\s+/, "").trim();
      if (name) exports.add(name);
    }
  }

  // export declare function/const/let/var/class/type/enum/interface/abstract class Foo
  const reDecl =
    /^export\s+(?:declare\s+)?(?:abstract\s+)?(?:function|const|let|var|class|type|enum|interface)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
  while ((m = reDecl.exec(source)) !== null) {
    exports.add(m[1]);
  }

  return exports;
}

// ─── NPM Registry Resolution ──────────────────────────────────────────────────

/**
 * Resolve a semver range against the npm registry.
 * Returns the highest matching version string, or null.
 */
function resolveVersionFromNpm(packageName, semverRange) {
  const result = spawnSync(
    "npm",
    ["view", packageName, "versions", "--json"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return null;

  let versions;
  try {
    versions = JSON.parse(result.stdout.trim());
  } catch {
    return null;
  }
  if (!Array.isArray(versions)) versions = [versions];

  // Use node semver to find highest satisfying version
  const satisfies = spawnSync(
    "node",
    [
      "-e",
      `const semver = require('semver'); const versions = ${JSON.stringify(versions)}; const range = ${JSON.stringify(semverRange)}; const m = semver.maxSatisfying(versions, range); process.stdout.write(m || '');`,
    ],
    { encoding: "utf8" },
  );
  return satisfies.stdout.trim() || null;
}

/**
 * Download a tarball from npm and extract it to a temp dir.
 * Returns the path to the extracted package directory.
 */
async function downloadAndExtractTarball(packageName, version) {
  const cacheKey = createHash("md5")
    .update(`${packageName}@${version}`)
    .digest("hex");
  const cacheDir = join(CACHE_DIR, cacheKey);

  if (existsSync(join(cacheDir, "package"))) {
    return join(cacheDir, "package");
  }

  mkdirSync(cacheDir, { recursive: true });

  // Get tarball URL from npm
  const viewResult = spawnSync(
    "npm",
    ["view", `${packageName}@${version}`, "dist.tarball"],
    { encoding: "utf8" },
  );
  if (viewResult.status !== 0) {
    throw new Error(
      `Could not get tarball URL for ${packageName}@${version}: ${viewResult.stderr}`,
    );
  }
  const tarballUrl = viewResult.stdout.trim();
  if (!tarballUrl) {
    throw new Error(`Empty tarball URL for ${packageName}@${version}`);
  }

  // Download tarball
  const tarballPath = join(cacheDir, "pkg.tgz");
  await downloadFile(tarballUrl, tarballPath);

  // Extract tarball using tar CLI (always available on ubuntu CI)
  const extractResult = spawnSync("tar", ["-xzf", tarballPath, "-C", cacheDir], {
    encoding: "utf8",
  });
  if (extractResult.status !== 0) {
    throw new Error(
      `Failed to extract tarball for ${packageName}@${version}: ${extractResult.stderr}`,
    );
  }

  return join(cacheDir, "package");
}

/**
 * Download a file from a URL to a local path.
 */
function downloadFile(url, dest) {
  return new Promise((res, rej) => {
    const file = createWriteStream(dest);
    function get(u) {
      https.get(u, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.destroy();
          return get(response.headers.location);
        }
        if (response.statusCode !== 200) {
          rej(new Error(`HTTP ${response.statusCode} for ${u}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => file.close(res));
        file.on("error", rej);
      }).on("error", rej);
    }
    get(url);
  });
}

// ─── Export Surface Resolution ────────────────────────────────────────────────

/**
 * Given a resolved tarball directory and a specifier (e.g. "@loworbitstudio/visor-theme-engine/adapters"),
 * return the set of named exports exposed.
 *
 * Strategy:
 *  1. Parse package.json exports field to find the .d.ts file for the subpath.
 *  2. Parse that .d.ts file.
 *  3. If exports field is absent, walk dist/**\/*.d.ts and union all exports.
 */
function resolveExportSurface(pkgDir, specifier, packageName) {
  const pkgJson = readJson(join(pkgDir, "package.json"));
  if (!pkgJson) throw new Error(`No package.json in ${pkgDir}`);

  // Determine subpath: normalize to "./subpath" form used in package.json exports field.
  // "@scope/pkg/adapters".slice("@scope/pkg".length) = "/adapters" → need "./adapters"
  const rawSubpath = specifier === packageName ? "." : specifier.slice(packageName.length);
  const subpath =
    rawSubpath === "." ? "." : rawSubpath.startsWith("./") ? rawSubpath : `.${rawSubpath}`;

  const exports = new Set();

  if (pkgJson.exports) {
    const exportEntry = resolveExportsEntry(pkgJson.exports, subpath);
    if (!exportEntry) {
      // Subpath not found in exports map — surface is empty for this subpath
      return exports;
    }

    // exportEntry could be a string (path) or condition object
    const typesPath = resolveTypesFromEntry(exportEntry);
    if (typesPath) {
      const dtsPath = join(pkgDir, typesPath);
      if (existsSync(dtsPath)) {
        const dtsSource = readFileSync(dtsPath, "utf8");
        // Also follow re-exports: `export * from "./something.js"`
        collectExportsFromDts(pkgDir, dtsPath, dtsSource, exports, new Set());
      }
    }
  } else {
    // No exports field: walk all dist/*.d.ts
    for (const f of walkFiles(join(pkgDir, "dist"), (p) => p.endsWith(".d.ts"))) {
      const src = readFileSync(f, "utf8");
      collectExportsFromDts(pkgDir, f, src, exports, new Set());
    }
  }

  return exports;
}

/**
 * Resolve an exports field entry for a given subpath.
 * Handles nested conditions (import, types, default) and subpath patterns.
 */
function resolveExportsEntry(exportsField, subpath) {
  if (typeof exportsField === "string") {
    return subpath === "." ? exportsField : null;
  }

  if (typeof exportsField !== "object" || exportsField === null) return null;

  // Direct subpath key
  if (subpath in exportsField) {
    return exportsField[subpath];
  }

  // Handle wildcard subpath patterns (e.g., "./*": "./dist/*.js")
  for (const [key, val] of Object.entries(exportsField)) {
    if (key.includes("*")) {
      const pattern = new RegExp(
        "^" + key.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "(.+)") + "$",
      );
      const match = subpath.match(pattern);
      if (match) {
        if (typeof val === "string") {
          return val.replace(/\*/g, match[1]);
        }
        return val;
      }
    }
  }

  return null;
}

/**
 * Given an export entry (string or condition object), resolve the types/import path.
 */
function resolveTypesFromEntry(entry) {
  if (typeof entry === "string") return entry;
  if (typeof entry !== "object" || entry === null) return null;

  // Prefer "types" condition, then "import", then "default"
  for (const cond of ["types", "import", "default"]) {
    if (cond in entry) {
      return resolveTypesFromEntry(entry[cond]);
    }
  }
  return null;
}

/**
 * Collect exports from a .d.ts file, following star re-exports recursively.
 */
function collectExportsFromDts(pkgDir, filePath, source, acc, visited) {
  if (visited.has(filePath)) return;
  visited.add(filePath);

  for (const sym of parseExportsFromDts(source)) acc.add(sym);

  // Follow `export * from "./something"`
  const starRe = /^export\s+\*\s+from\s+["']([^"']+)["']/gm;
  let m;
  while ((m = starRe.exec(source)) !== null) {
    let dep = m[1];
    if (dep.startsWith(".")) {
      const base = dirname(filePath);
      dep = dep.replace(/\.js$/, "");
      const candidate = resolve(base, dep + ".d.ts");
      if (existsSync(candidate)) {
        const depSource = readFileSync(candidate, "utf8");
        collectExportsFromDts(pkgDir, candidate, depSource, acc, visited);
      }
    }
  }

  // Also handle `export { x } from "./something"` with re-export sources
  const reExportFrom = /^export\s+(?:type\s+)?\{[^}]+\}\s+from\s+["']([^"']+)["']/gm;
  while ((m = reExportFrom.exec(source)) !== null) {
    let dep = m[1];
    if (dep.startsWith(".")) {
      const base = dirname(filePath);
      dep = dep.replace(/\.js$/, "");
      const candidate = resolve(base, dep + ".d.ts");
      if (existsSync(candidate)) {
        const depSource = readFileSync(candidate, "utf8");
        collectExportsFromDts(pkgDir, candidate, depSource, acc, visited);
      }
    }
  }
}

// ─── Workspace Discovery ──────────────────────────────────────────────────────

/**
 * Discover all workspace packages in PACKAGES_DIR.
 * Returns an array of { name, dir, version, pkgJson } objects.
 */
function discoverWorkspacePackages() {
  if (!existsSync(PACKAGES_DIR)) return [];
  const packages = [];
  for (const entry of readdirSync(PACKAGES_DIR)) {
    const dir = join(PACKAGES_DIR, entry);
    const pkgJsonPath = join(dir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    const pkgJson = readJson(pkgJsonPath);
    if (!pkgJson || !pkgJson.name) continue;
    packages.push({ name: pkgJson.name, dir, version: pkgJson.version, pkgJson });
  }
  return packages;
}

// ─── Dependency Graph ─────────────────────────────────────────────────────────

/**
 * Build the dependency graph: for each upstream package, find all downstream
 * workspace packages that depend on it.
 */
function buildDepGraph(packages) {
  const graph = new Map(); // upstreamName → [{ downstream, versionRange }]
  for (const pkg of packages) {
    const allDeps = {
      ...(pkg.pkgJson.dependencies || {}),
      ...(pkg.pkgJson.devDependencies || {}),
    };
    for (const [depName, depRange] of Object.entries(allDeps)) {
      if (!depName.startsWith(VISOR_SCOPE)) continue;
      // Only care about workspace packages (not external)
      const upstream = packages.find((p) => p.name === depName);
      if (!upstream) continue;
      if (!graph.has(depName)) graph.set(depName, []);
      graph.get(depName).push({ downstream: pkg, versionRange: depRange });
    }
  }
  return graph;
}

/**
 * Collect all imports of sibling packages from a workspace package's TS source.
 * Returns Map<specifier, Set<symbol>>.
 */
function collectDownstreamImports(pkg) {
  const allImports = new Map();
  const srcDir = join(pkg.dir, "src");
  for (const file of walkFiles(srcDir, (p) => {
    const ext = extname(p);
    return ext === ".ts" || ext === ".tsx";
  })) {
    const fileImports = parseImportsFromFile(file, VISOR_SCOPE);
    for (const [specifier, symbols] of fileImports) {
      if (!allImports.has(specifier)) allImports.set(specifier, new Set());
      for (const sym of symbols) allImports.get(specifier).add(sym);
    }
  }
  return allImports;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const packages = discoverWorkspacePackages();
  if (packages.length === 0) {
    console.error("No workspace packages found in", PACKAGES_DIR);
    process.exit(1);
  }

  const depGraph = buildDepGraph(packages);
  if (depGraph.size === 0) {
    console.log("No inter-workspace @loworbitstudio dependencies found. Nothing to check.");
    process.exit(0);
  }

  mkdirSync(CACHE_DIR, { recursive: true });

  let hasDrift = false;
  const errors = [];

  for (const [upstreamName, downstreams] of depGraph) {
    console.log(`\nChecking upstream: ${upstreamName}`);

    for (const { downstream, versionRange } of downstreams) {
      console.log(
        `  Downstream: ${downstream.name} (depends on ${upstreamName}@${versionRange})`,
      );

      // 1. Collect all imports from downstream TS source
      const downstreamImports = collectDownstreamImports(downstream);

      // Filter to only imports of this upstream
      const relevantImports = new Map();
      for (const [specifier, symbols] of downstreamImports) {
        const pkgFromSpecifier =
          specifier.startsWith(upstreamName + "/") || specifier === upstreamName
            ? upstreamName
            : null;
        if (pkgFromSpecifier === upstreamName) {
          relevantImports.set(specifier, symbols);
        }
      }

      if (relevantImports.size === 0) {
        console.log(`    No imports of ${upstreamName} found in ${downstream.name}. Skipping.`);
        continue;
      }

      // 2. Resolve the semver range to an actual published version
      const resolvedVersion = resolveVersionFromNpm(upstreamName, versionRange);
      if (!resolvedVersion) {
        console.warn(
          `    WARNING: Could not resolve ${upstreamName}@${versionRange} from npm registry. Skipping.`,
        );
        continue;
      }
      console.log(`    Resolved ${upstreamName}@${versionRange} → ${resolvedVersion}`);

      // 3. Download and extract the resolved tarball
      let pkgDir;
      try {
        pkgDir = await downloadAndExtractTarball(upstreamName, resolvedVersion);
      } catch (err) {
        console.warn(
          `    WARNING: Could not download tarball for ${upstreamName}@${resolvedVersion}: ${err.message}. Skipping.`,
        );
        continue;
      }

      // 4. Check each specifier's import symbols against the tarball's export surface
      for (const [specifier, symbols] of relevantImports) {
        console.log(`    Checking specifier: ${specifier} (${symbols.size} symbols)`);

        let exportSurface;
        try {
          exportSurface = resolveExportSurface(pkgDir, specifier, upstreamName);
        } catch (err) {
          console.warn(
            `    WARNING: Could not resolve export surface for ${specifier}: ${err.message}. Skipping.`,
          );
          continue;
        }

        // 5. Compare
        for (const sym of symbols) {
          if (!exportSurface.has(sym)) {
            hasDrift = true;
            errors.push({
              upstream: upstreamName,
              resolvedVersion,
              specifier,
              symbol: sym,
              downstream: downstream.name,
              versionRange,
            });
          }
        }
      }
    }
  }

  if (hasDrift) {
    console.error("\n\nEXPORT-SURFACE DRIFT DETECTED\n");
    for (const err of errors) {
      console.error(
        `  ${err.downstream} imports { ${err.symbol} } from "${err.specifier}"`,
      );
      console.error(
        `  but ${err.upstream}@${err.resolvedVersion} (resolved from ${err.versionRange}) does NOT export "${err.symbol}"\n`,
      );
    }
    console.error("Fix options:");
    console.error(
      "  (a) Republish the upstream with the missing export included.",
    );
    console.error(
      "  (b) Tighten the downstream constraint to a version that includes the export.",
    );
    process.exit(1);
  }

  console.log("\nNo export-surface drift detected.");
  process.exit(0);
}

// Only run main() when executed directly (not when imported for unit tests).
// In ESM, import.meta.url is "file:///path/to/script.mjs".
// process.argv[1] is the resolved script path when run with `node script.mjs`.
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  new URL(import.meta.url).pathname === resolve(process.argv[1]);

if (isMain) {
  main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
}

// ─── Exported helpers for unit tests ─────────────────────────────────────────

export {
  parseImportsFromFile,
  parseImportsRegex,
  parseExportsFromDts,
  resolveExportsEntry,
  resolveTypesFromEntry,
  collectExportsFromDts,
  resolveExportSurface,
  collectDownstreamImports,
  buildDepGraph,
  discoverWorkspacePackages,
};
