#!/usr/bin/env node
/**
 * changeset-paths.mjs
 *
 * Loader for changeset-paths.json — the single source of truth for the
 * changeset gate. Three consumers read it through this module:
 *
 *   - scripts/generate-changeset.mjs    (local pre-push hook: does this diff need a changeset?)
 *   - scripts/check-changeset-packages.mjs (CI: does the changeset name the right package?)
 *   - .github/workflows/changeset-gate.yml (CI: reads the keys directly with jq)
 *
 * The file was a flat array of patterns until VI-647. It is now a
 * path→package map, because "a changeset exists" and "a changeset names a
 * real package" were both true of the VI-638 incident — the changeset named
 * `@loworbitstudio/visor` while the diff changed `packages/theme-engine`.
 * Only an ownership edge can catch that, and this is the file that has one.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, '..');
export const SHIPPING_PATHS_FILE = join(REPO_ROOT, 'changeset-paths.json');

/**
 * Parse and validate the raw contents of changeset-paths.json.
 *
 * Throws on any structural problem rather than degrading — a silently empty
 * map would bypass the gate entirely, which is the VI-317 regression class.
 *
 * @param {string} raw - file contents
 * @param {string} [source] - path used in error messages
 * @returns {Record<string, string | null>} pattern → owning package (null = unowned)
 */
export function parseShippingMap(raw, source = SHIPPING_PATHS_FILE) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[changeset-paths] ${source} is not valid JSON: ${err.message}`);
  }

  const map = parsed.shippingPaths;
  if (map === null || typeof map !== 'object' || Array.isArray(map)) {
    throw new Error(
      `[changeset-paths] ${source} must define "shippingPaths" as an object mapping ` +
      `each shipping path to its owning npm package (or null when no package publishes it). ` +
      `The flat-array form was replaced in VI-647.`,
    );
  }

  const entries = Object.entries(map);
  if (entries.length === 0) {
    throw new Error(`[changeset-paths] ${source} contains no "shippingPaths" entries.`);
  }

  for (const [pattern, owner] of entries) {
    if (!pattern.endsWith('/**')) {
      throw new Error(
        `[changeset-paths] pattern ${JSON.stringify(pattern)} must end in "/**". ` +
        `If you need a non-recursive pattern, replace the prefix matching in ownerFor() ` +
        `with a real glob matcher.`,
      );
    }
    if (owner !== null && (typeof owner !== 'string' || owner.length === 0)) {
      throw new Error(
        `[changeset-paths] owner for ${JSON.stringify(pattern)} must be an npm package name ` +
        `or null, got ${JSON.stringify(owner)}.`,
      );
    }
  }

  return map;
}

/** Read and validate changeset-paths.json from disk. */
export function loadShippingMap(file = SHIPPING_PATHS_FILE) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(
      `[changeset-paths] could not read ${file}: ${err.message}. ` +
      `This file is the single source of truth for the changeset gate — it must exist at repo root.`,
    );
  }
  return parseShippingMap(raw, file);
}

/** Strip the trailing '**' from a pattern, keeping the trailing '/'. */
const toPrefix = (pattern) => pattern.slice(0, -2);

/**
 * The npm package that publishes `file`, or undefined when `file` is not on a
 * shipping path at all. Returns null for a shipping path with no npm owner.
 *
 * Longest prefix wins, so a nested entry can override a broader one without
 * depending on key order.
 *
 * @param {string} file - repo-relative path
 * @param {Record<string, string | null>} map
 * @returns {string | null | undefined}
 */
export function ownerFor(file, map) {
  let bestPrefix = null;
  let bestOwner;
  for (const [pattern, owner] of Object.entries(map)) {
    const prefix = toPrefix(pattern);
    if (!file.startsWith(prefix)) continue;
    if (bestPrefix === null || prefix.length > bestPrefix.length) {
      bestPrefix = prefix;
      bestOwner = owner;
    }
  }
  return bestPrefix === null ? undefined : bestOwner;
}

/**
 * Group changed files by the package that owns them.
 *
 * @param {string[]} changedFiles
 * @param {Record<string, string | null>} map
 * @returns {Map<string, string[]>} package name → the files proving it was touched.
 *   Files on unowned or non-shipping paths are omitted; they have no package to assert.
 */
export function ownersForChangedFiles(changedFiles, map) {
  const owners = new Map();
  for (const file of changedFiles) {
    const owner = ownerFor(file, map);
    if (typeof owner !== 'string') continue;
    if (!owners.has(owner)) owners.set(owner, []);
    owners.get(owner).push(file);
  }
  return owners;
}
