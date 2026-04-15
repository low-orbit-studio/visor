/**
 * discoverability-score
 *
 * Computes a repeatable AI discoverability score (0–100) across the 10-question
 * framework established in docs/ai-consumability.md.
 *
 * Emits one RuleResult per dimension (Q1–Q10) plus a summary result.
 * All checks are deterministic filesystem/file-content checks — no AI calls.
 * Missing artifacts score 0 for that dimension; they never crash.
 *
 * warnOnly: true until DISCOVERABILITY_MIN_SCORE is set and warnOnly flipped to
 * gate CI (Decision D1).
 */

import { readFile, access } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { discoverabilityVariantDrift } from './discoverability-variant-drift.js';
import { visorYamlComplete } from './visor-yaml-complete.js';
import { MIN_WHEN_TO_USE, MIN_WHEN_NOT_TO_USE } from './discoverability-selection-quality.js';
import type { Rule, RuleResult } from './types.js';

/** Minimum total score to pass. Flip warnOnly to false when setting this above 0. */
export const DISCOVERABILITY_MIN_SCORE = 0;

// ── helpers ───────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function grade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

interface DimResult {
  q: number;
  name: string;
  score: number;
  detail: string;
}

// ── Q1: Selection quality ─────────────────────────────────────────────────────

async function q1Selection(): Promise<DimResult> {
  let total = 0;
  let passing = 0;

  try {
    for await (const yamlPath of glob('components/ui/**/*.visor.yaml')) {
      let doc: Record<string, unknown>;
      try {
        const content = await readFile(yamlPath, 'utf-8');
        doc = parseYaml(content) as Record<string, unknown>;
      } catch {
        continue;
      }
      total++;
      const whenToUse = doc.when_to_use;
      const whenNotToUse = doc.when_not_to_use;
      const hasEnoughWtu = Array.isArray(whenToUse) && whenToUse.length >= MIN_WHEN_TO_USE;
      const hasEnoughWntu = Array.isArray(whenNotToUse) && whenNotToUse.length >= MIN_WHEN_NOT_TO_USE;
      if (hasEnoughWtu && hasEnoughWntu) passing++;
    }
  } catch {
    return { q: 1, name: 'Selection', score: 0, detail: 'glob failed' };
  }

  if (total === 0) return { q: 1, name: 'Selection', score: 0, detail: 'no components found' };
  const pct = passing / total;
  return {
    q: 1,
    name: 'Selection',
    score: clamp(pct * 10, 0, 10),
    detail: `${passing}/${total} components have ≥${MIN_WHEN_TO_USE} when_to_use + ≥${MIN_WHEN_NOT_TO_USE} when_not_to_use`,
  };
}

// ── Q2: Composition patterns ──────────────────────────────────────────────────

async function q2Composition(): Promise<DimResult> {
  let count = 0;

  try {
    for await (const _ of glob('patterns/*.visor-pattern.yaml')) {
      count++;
    }
  } catch {
    return { q: 2, name: 'Composition', score: 0, detail: 'glob failed' };
  }

  // Scale: 0 patterns → 0 pts, 7 → 5 pts, 15 → 10 pts; interpolate linearly
  const score = count <= 0 ? 0 : count >= 15 ? 10 : count <= 7 ? (count / 7) * 5 : 5 + ((count - 7) / 8) * 5;
  return {
    q: 2,
    name: 'Composition',
    score: clamp(score, 0, 10),
    detail: `${count} pattern${count === 1 ? '' : 's'} found (0=0pt, 7=5pt, 15=10pt scale)`,
  };
}

// ── Q3: API reference quality ─────────────────────────────────────────────────

async function q3ApiReference(): Promise<DimResult> {
  // Reuse existing rules — don't re-implement
  try {
    const [driftResults, completenessResults] = await Promise.all([
      discoverabilityVariantDrift.run(),
      visorYamlComplete.run(),
    ]);

    // Count unique files that had any failure
    const driftFailFiles = new Set(
      driftResults.filter((r) => !r.pass && r.file).map((r) => r.file!),
    );
    const completenessFailFiles = new Set(
      completenessResults.filter((r) => !r.pass && r.file).map((r) => r.file!),
    );

    // Count total component YAML files
    let total = 0;
    for await (const _ of glob('components/ui/**/*.visor.yaml')) {
      total++;
    }

    if (total === 0) return { q: 3, name: 'API Reference', score: 0, detail: 'no components found' };

    const failFiles = new Set([...driftFailFiles, ...completenessFailFiles]);
    const passing = total - failFiles.size;
    const pct = passing / total;

    return {
      q: 3,
      name: 'API Reference',
      score: clamp(pct * 10, 0, 10),
      detail: `${passing}/${total} components without variant drift or YAML completeness failures`,
    };
  } catch {
    return { q: 3, name: 'API Reference', score: 0, detail: 'rule execution failed' };
  }
}

// ── Q4: Bootstrap ─────────────────────────────────────────────────────────────

async function q4Bootstrap(): Promise<DimResult> {
  const checks = [
    { label: 'CONSUMER_CLAUDE.md exists', path: 'CONSUMER_CLAUDE.md', contentCheck: null },
    { label: 'visor init command source exists', path: 'packages/cli/src/commands/init.ts', contentCheck: null },
  ];

  let points = 0;

  for (const check of checks) {
    try {
      if (!(await fileExists(check.path))) continue;
      if (check.contentCheck) {
        const content = await readFile(check.path, 'utf-8');
        if (!content.includes(check.contentCheck)) continue;
      }
      points++;
    } catch {
      // missing = 0 for that sub-check
    }
  }

  // Quick-start heading check
  let hasQuickStart = false;
  try {
    const content = await readFile('CONSUMER_CLAUDE.md', 'utf-8');
    hasQuickStart = /^#{1,3}\s+Quick\s+Start/im.test(content);
    if (hasQuickStart) points++;
  } catch {
    // score 0 for this sub-check
  }

  const score = clamp((points / 3) * 10, 0, 10);
  const parts = [];
  if (await fileExists('CONSUMER_CLAUDE.md')) parts.push('CONSUMER_CLAUDE.md');
  if (await fileExists('packages/cli/src/commands/init.ts')) parts.push('visor init');
  if (hasQuickStart) parts.push('Quick Start heading');

  return {
    q: 4,
    name: 'Bootstrap',
    score,
    detail: parts.length ? parts.join(', ') : 'missing bootstrap artifacts',
  };
}

// ── Q5: Theming ───────────────────────────────────────────────────────────────

async function q5Theming(): Promise<DimResult> {
  let points = 0;
  const found: string[] = [];

  // Token tier files
  const tierFiles = ['packages/tokens/src/tokens/primitives.ts', 'packages/tokens/src/tokens/semantic.ts', 'packages/tokens/src/tokens/adaptive.ts'];
  const tierPresent = (await Promise.all(tierFiles.map(fileExists))).every(Boolean);
  if (tierPresent) { points++; found.push('token tiers (prim/sem/adap)'); }

  // interchange-format.md
  if (await fileExists('docs/interchange-format.md')) { points++; found.push('interchange-format.md'); }

  // ≥3 theme-* CLI commands
  let themeCommandCount = 0;
  try {
    for await (const _ of glob('packages/cli/src/commands/theme-*.ts')) {
      themeCommandCount++;
    }
  } catch { /* glob failure = 0 */ }
  if (themeCommandCount >= 3) { points++; found.push(`${themeCommandCount} theme CLI commands`); }

  return {
    q: 5,
    name: 'Theming',
    score: clamp((points / 3) * 10, 0, 10),
    detail: found.length ? found.join(', ') : 'missing theming artifacts',
  };
}

// ── Q6: Token discovery ───────────────────────────────────────────────────────

async function q6TokenDiscovery(): Promise<DimResult> {
  let points = 0;
  const found: string[] = [];
  const MANIFEST_PATH = 'packages/cli/dist/visor-manifest.json';
  const MANIFEST_TYPES_PATH = 'packages/cli/src/generate/manifest-types.ts';

  // visor-manifest.json has a non-empty `tokens` key
  // Falls back to checking manifest-types.ts for ManifestToken export when dist is absent
  const manifestExists = await fileExists(MANIFEST_PATH);
  if (manifestExists) {
    try {
      const content = await readFile(MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(content) as Record<string, unknown>;
      const tokens = manifest.tokens;
      const hasTokens = tokens !== undefined && tokens !== null && (typeof tokens !== 'object' || Object.keys(tokens as object).length > 0);
      if (hasTokens) { points++; found.push('manifest.tokens key present'); }
    } catch {
      // unparseable manifest → score 0 for this sub-check
    }
  } else {
    // Fallback: check manifest-types.ts for ManifestToken type export
    try {
      const src = await readFile(MANIFEST_TYPES_PATH, 'utf-8');
      if (src.includes('ManifestToken')) { points++; found.push('ManifestToken type in manifest-types.ts (dist fallback)'); }
    } catch {
      // source also missing → score 0 for this sub-check
    }
  }

  // visor tokens list --json implementation present
  if (await fileExists('packages/cli/src/commands/tokens.ts')) {
    try {
      const src = await readFile('packages/cli/src/commands/tokens.ts', 'utf-8');
      if (src.includes('json') || src.includes('--json')) { points++; found.push('tokens --json flag'); }
    } catch { /* score 0 */ }
  }

  return {
    q: 6,
    name: 'Token Discovery',
    score: clamp((points / 2) * 10, 0, 10),
    detail: found.length ? found.join(', ') : 'missing: manifest.tokens or tokens --json',
  };
}

// ── Q7: Troubleshooting ───────────────────────────────────────────────────────

const MIN_TROUBLESHOOTING_CHARS = 200;

async function q7Troubleshooting(): Promise<DimResult> {
  let points = 0;
  const found: string[] = [];

  // CONSUMER_CLAUDE.md has a Troubleshooting section ≥ 200 chars
  try {
    const content = await readFile('CONSUMER_CLAUDE.md', 'utf-8');
    // Find the heading, then measure from it to the next same-or-higher-level heading or EOF
    const headingMatch = content.match(/^(#{1,3})\s+Troubleshooting\b/im);
    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const headingIdx = content.indexOf(headingMatch[0]);
      const afterHeading = content.slice(headingIdx + headingMatch[0].length);
      // Only stop at a heading of the same level or higher (fewer #'s)
      const stopPattern = new RegExp(`\n#{1,${headingLevel}}\\s`);
      const nextSiblingMatch = afterHeading.match(stopPattern);
      const sectionBody = nextSiblingMatch
        ? afterHeading.slice(0, nextSiblingMatch.index)
        : afterHeading;
      if (sectionBody.length >= MIN_TROUBLESHOOTING_CHARS) {
        points++;
        found.push(`Troubleshooting section (${sectionBody.length} chars)`);
      }
    }
  } catch { /* score 0 */ }

  // visor doctor command exists
  if (await fileExists('packages/cli/src/commands/doctor.ts')) {
    points++;
    found.push('visor doctor');
  }

  return {
    q: 7,
    name: 'Troubleshooting',
    score: clamp((points / 2) * 10, 0, 10),
    detail: found.length ? found.join(', ') : 'missing: Troubleshooting section or visor doctor',
  };
}

// ── Q8: Versioning ────────────────────────────────────────────────────────────

async function q8Versioning(): Promise<DimResult> {
  let points = 0;
  const found: string[] = [];

  // CHANGELOG.json parses; falls back to CHANGELOG.md with ## [ heading pattern
  const changelogJsonExists = await fileExists('packages/cli/dist/CHANGELOG.json');
  if (changelogJsonExists) {
    try {
      const content = await readFile('packages/cli/dist/CHANGELOG.json', 'utf-8');
      JSON.parse(content);
      points++;
      found.push('CHANGELOG.json');
    } catch { /* unparseable = 0 */ }
  } else {
    // Fallback: check CHANGELOG.md at repo root for version-like headings
    try {
      const content = await readFile('CHANGELOG.md', 'utf-8');
      if (content.includes('## [') || /^## \d+\.\d+/m.test(content)) {
        points++;
        found.push('CHANGELOG.md (dist fallback)');
      }
    } catch { /* missing = 0 */ }
  }

  // manifest.version is a non-empty string; falls back to packages/cli/package.json
  const manifestExists = await fileExists('packages/cli/dist/visor-manifest.json');
  if (manifestExists) {
    try {
      const content = await readFile('packages/cli/dist/visor-manifest.json', 'utf-8');
      const manifest = JSON.parse(content) as Record<string, unknown>;
      if (typeof manifest.version === 'string' && manifest.version.length > 0) {
        points++;
        found.push(`manifest@${manifest.version}`);
      }
    } catch { /* unparseable = 0 */ }
  } else {
    // Fallback: check packages/cli/package.json for a version field
    try {
      const content = await readFile('packages/cli/package.json', 'utf-8');
      const pkg = JSON.parse(content) as Record<string, unknown>;
      if (typeof pkg.version === 'string' && pkg.version.length > 0) {
        points++;
        found.push(`cli-package@${pkg.version} (dist fallback)`);
      }
    } catch { /* missing = 0 */ }
  }

  // visor diff command source exists
  if (await fileExists('packages/cli/src/commands/diff.ts')) {
    points++;
    found.push('visor diff');
  }

  return {
    q: 8,
    name: 'Versioning',
    score: clamp((points / 3) * 10, 0, 10),
    detail: found.length ? found.join(', ') : 'missing: CHANGELOG.json, manifest.version, or visor diff',
  };
}

// ── Q9: Responsive metadata ───────────────────────────────────────────────────

const LAYOUT_CRITICAL = [
  'components/ui/data-table/data-table.visor.yaml',
  'components/ui/navbar/navbar.visor.yaml',
  'components/ui/page-header/page-header.visor.yaml',
  'components/ui/sidebar/sidebar.visor.yaml',
  'components/ui/sheet/sheet.visor.yaml',
];

async function q9Responsive(): Promise<DimResult> {
  let hasResponsive = 0;

  for (const yamlPath of LAYOUT_CRITICAL) {
    try {
      const content = await readFile(yamlPath, 'utf-8');
      const doc = parseYaml(content) as Record<string, unknown>;
      if (doc.responsive !== undefined) hasResponsive++;
    } catch {
      // missing yaml = 0 for that component
    }
  }

  return {
    q: 9,
    name: 'Responsive',
    score: clamp((hasResponsive / LAYOUT_CRITICAL.length) * 10, 0, 10),
    detail: `${hasResponsive}/${LAYOUT_CRITICAL.length} layout-critical components have responsive: field`,
  };
}

// ── Q10: Visual reference ─────────────────────────────────────────────────────

async function q10VisualReference(): Promise<DimResult> {
  let total = 0;
  let hasPreview = 0;

  try {
    for await (const yamlPath of glob('components/ui/**/*.visor.yaml')) {
      let doc: Record<string, unknown>;
      try {
        const content = await readFile(yamlPath, 'utf-8');
        doc = parseYaml(content) as Record<string, unknown>;
      } catch {
        continue;
      }
      total++;
      if (typeof doc.preview_url === 'string' && doc.preview_url.length > 0) hasPreview++;
    }
  } catch {
    return { q: 10, name: 'Visual Reference', score: 0, detail: 'glob failed' };
  }

  if (total === 0) return { q: 10, name: 'Visual Reference', score: 0, detail: 'no components found' };
  return {
    q: 10,
    name: 'Visual Reference',
    score: clamp((hasPreview / total) * 10, 0, 10),
    detail: `${hasPreview}/${total} components have preview_url in .visor.yaml`,
  };
}

// ── Rule export ───────────────────────────────────────────────────────────────

export const discoverabilityScore: Rule = {
  name: 'discoverability-score',
  description: 'Aggregate AI discoverability score (0–100) across the 10-question framework',
  category: 'structure',
  warnOnly: true, // D1: keep true until DISCOVERABILITY_MIN_SCORE > 0 and you're ready to gate CI
  async run(): Promise<RuleResult[]> {
    const dims = await Promise.all([
      q1Selection(),
      q2Composition(),
      q3ApiReference(),
      q4Bootstrap(),
      q5Theming(),
      q6TokenDiscovery(),
      q7Troubleshooting(),
      q8Versioning(),
      q9Responsive(),
      q10VisualReference(),
    ]);

    const total = dims.reduce((acc, d) => acc + d.score, 0);

    const results: RuleResult[] = dims.map((d) => ({
      pass: true,
      score: d.score,
      message: `Q${d.q} ${d.name}: ${d.score.toFixed(1)}/10 — ${d.detail}`,
    }));

    results.push({
      pass: total >= DISCOVERABILITY_MIN_SCORE,
      score: total,
      message: `Discoverability total: ${total.toFixed(1)}/100 (grade ${grade(total)})`,
    });

    return results;
  },
};
