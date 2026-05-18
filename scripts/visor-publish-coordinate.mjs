#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ARTIFACTS,
  assertVisorWorktree,
  resolveArtifactPath,
  compareVersions,
} from './visor-publish-status.mjs';

// themes-private still publishes via a patch bump on every merge (per the
// publish-automation audit). Inlined here after VI-419 removed Visor's
// auto-version.mjs — bumpPatch had no other home.
export function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

export const VISOR_REPO = 'low-orbit-studio/visor';
export const THEMES_REPO = 'low-orbit-studio/visor-themes-private';

export function parsePRReference(input) {
  if (input == null || input === '') {
    throw new Error('Empty PR reference');
  }
  const trimmed = String(input).trim();
  const numeric = /^\d+$/;
  if (numeric.test(trimmed)) return Number(trimmed);
  const urlMatch = trimmed.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
  if (urlMatch) return Number(urlMatch[1]);
  const hashMatch = trimmed.match(/#(\d+)$/);
  if (hashMatch) return Number(hashMatch[1]);
  throw new Error(
    `Could not parse PR reference: "${input}". Use a numeric PR number or a full GitHub URL.`
  );
}

export function validatePRStates({ visorPR, themesPR }) {
  const errors = [];
  const check = (label, pr) => {
    if (!pr) {
      errors.push(`${label}: PR data missing`);
      return;
    }
    if (!pr.merged) {
      errors.push(`${label}: PR #${pr.number} is not merged (state: ${pr.state})`);
    }
    // CI must be explicitly "success" or "no-checks". A null/undefined value
    // indicates we couldn't read the check-runs API and must not silently pass
    // — bypassing the gate is exactly the failure mode this validation exists
    // to prevent.
    if (pr.ciConclusion === undefined || pr.ciConclusion === null) {
      errors.push(`${label}: PR #${pr.number} CI conclusion could not be determined`);
    } else if (pr.ciConclusion !== 'success' && pr.ciConclusion !== 'no-checks') {
      errors.push(`${label}: PR #${pr.number} CI conclusion is "${pr.ciConclusion}" (expected "success")`);
    }
  };
  check('Visor', visorPR);
  check('Themes', themesPR);
  return { ok: errors.length === 0, errors };
}

export function computeBumpPreview({
  visorPRFiles,
  themesPRFiles,
  changesetReleases,
  readJson,
}) {
  const visor = computeVisorSidePreview({ visorPRFiles, changesetReleases, readJson });
  const themes = computeThemesSidePreview({ themesPRFiles, readJson });
  return { visor, themes };
}

// Visor's release pipeline is changesets-only (VI-419 deleted auto-version).
// No changesets → no Visor-side bump in a coordinated release. The PR author
// is expected to add a changeset via `npx changeset add`; the changeset-gate
// workflow blocks merge of shipping-package PRs that don't.
function computeVisorSidePreview({ visorPRFiles: _visorPRFiles, changesetReleases, readJson: _readJson }) {
  const releases = (changesetReleases || []).filter(
    r => r.type !== 'none' && r.newVersion !== r.oldVersion
  );
  if (releases.length > 0) {
    return {
      source: 'changeset',
      packages: releases.map(r => ({
        name: r.name,
        from: r.oldVersion,
        to: r.newVersion,
        type: r.type,
      })),
      detail: `${releases.length} changeset${releases.length === 1 ? '' : 's'} pending`,
    };
  }
  return {
    source: 'changeset',
    packages: [],
    detail: 'no pending changesets — add one via `npx changeset add`',
  };
}

const THEMES_SURFACE = ['themes/', 'bin/', 'index.js'];

function themesShouldBump(prFiles) {
  const touched = prFiles.some(f =>
    THEMES_SURFACE.some(p => (p.endsWith('/') ? f.filename.startsWith(p) : f.filename === p))
  );
  const authorBumped = prFiles.some(f => f.filename === 'package.json');
  return touched && !authorBumped;
}

function computeThemesSidePreview({ themesPRFiles, readJson }) {
  if (!themesShouldBump(themesPRFiles)) {
    return {
      source: 'auto-patch',
      packages: [],
      detail:
        themesPRFiles.some(f => f.filename === 'package.json')
          ? 'author already bumped package.json — no auto-bump'
          : 'no published surface touched',
    };
  }

  const themesArtifact = ARTIFACTS.find(a => a.name === '@low-orbit-studio/visor-themes-private');
  const pkgPath = resolveArtifactPath(themesArtifact, process.cwd(), process.env);
  let from;
  try {
    from = readJson(pkgPath).version;
  } catch {
    return {
      source: 'auto-patch',
      packages: [],
      detail: `themes-private repo not found at ${pkgPath} — set ${themesArtifact.envVar} or clone to ${themesArtifact.defaultDir}`,
    };
  }
  return {
    source: 'auto-patch',
    packages: [
      {
        name: '@low-orbit-studio/visor-themes-private',
        from,
        to: bumpPatch(from),
        type: 'patch',
      },
    ],
    detail: 'auto-version patch bump',
  };
}

export function formatPreview(preview) {
  const lines = ['Coordinated release preview', '─'.repeat(60)];

  lines.push('');
  lines.push('Visor:');
  if (preview.visor.packages.length === 0) {
    lines.push(`  (no bump — ${preview.visor.detail})`);
  } else {
    for (const p of preview.visor.packages) {
      lines.push(`  ${p.name}: ${p.from} → ${p.to} (${p.type})`);
    }
    lines.push(`  source: ${preview.visor.source} — ${preview.visor.detail}`);
  }

  lines.push('');
  lines.push('Themes-private:');
  if (preview.themes.packages.length === 0) {
    lines.push(`  (no bump — ${preview.themes.detail})`);
  } else {
    for (const p of preview.themes.packages) {
      lines.push(`  ${p.name}: ${p.from} → ${p.to} (${p.type})`);
    }
    lines.push(`  source: ${preview.themes.source} — ${preview.themes.detail}`);
  }

  return lines.join('\n');
}

export function fetchPRJson(repo, pr, runCommand) {
  const result = runCommand('gh', [
    'api',
    `repos/${repo}/pulls/${pr}`,
    '--jq',
    '{number, state, merged, merged_at, merge_commit_sha: .merge_commit_sha, head_sha: .head.sha}',
  ]);
  if (result.status !== 0) {
    throw new Error(
      `gh api failed for ${repo}#${pr}: ${result.stderr?.toString().trim() || 'unknown error'}`
    );
  }
  const data = JSON.parse(result.stdout);
  return {
    number: data.number,
    state: data.state,
    merged: data.merged,
    mergedAt: data.merged_at,
    mergeSha: data.merge_commit_sha,
    headSha: data.head_sha,
  };
}

export function fetchPRCIConclusion(repo, sha, runCommand) {
  if (!sha) return null;
  const result = runCommand('gh', [
    'api',
    `repos/${repo}/commits/${sha}/check-runs`,
    '--jq',
    '[.check_runs[] | .conclusion] | unique',
  ]);
  if (result.status !== 0) return null;
  let conclusions;
  try {
    conclusions = JSON.parse(result.stdout);
  } catch {
    return null;
  }
  if (!Array.isArray(conclusions)) return null;
  // Empty array = the API responded successfully but the commit has no
  // check-runs configured. Distinguish from null (couldn't read the API)
  // so validatePRStates can opt to allow no-checks repos through.
  if (conclusions.length === 0) return 'no-checks';
  const failures = conclusions.filter(c => c && c !== 'success' && c !== 'skipped' && c !== 'neutral');
  return failures.length === 0 ? 'success' : failures[0];
}

export function fetchPRFiles(repo, pr, runCommand) {
  const result = runCommand('gh', [
    'api',
    `repos/${repo}/pulls/${pr}/files`,
    '--paginate',
  ]);
  if (result.status !== 0) {
    throw new Error(
      `gh api failed fetching files for ${repo}#${pr}: ${result.stderr?.toString().trim() || 'unknown error'}`
    );
  }
  const data = JSON.parse(result.stdout);
  return data.map(f => ({ filename: f.filename }));
}

export function loadChangesetReleases(cwd, runCommand) {
  // Use a per-invocation temp dir so two operators running coordinate at
  // the same time can't clobber each other's status output. Cleaned up
  // before return regardless of outcome.
  const dir = mkdtempSync(path.join(tmpdir(), 'visor-publish-'));
  const outPath = path.join(dir, 'changeset-status.json');
  try {
    const result = runCommand('npx', ['changeset', 'status', `--output=${outPath}`], { cwd });
    if (result.status !== 0 || !existsSync(outPath)) return [];
    try {
      return JSON.parse(readFileSync(outPath, 'utf8')).releases || [];
    } catch {
      return [];
    }
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup; tmp will be reaped by the OS regardless
    }
  }
}

async function promptYesNo(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === 'y' || a === 'yes');
    });
  });
}

// Locate the workflow run triggered by (or after) a given merge.
//
// On themes-private, an auto-version bump commit may push between the PR merge
// and release.yml firing — so release.yml's headSha will NOT equal the PR's
// merge_commit_sha. Falling back to "newest run" is unsafe (could be an
// unrelated push). Strategy:
//   1. Exact SHA match — happens on Visor (which is now changesets-only) and
//      on themes-private when no bump was needed.
//   2. Otherwise pick runs created at or after the merge commit's timestamp,
//      newest first. This excludes any pre-existing runs from earlier merges.
//   3. If still nothing, return null and surface a clear warning. The caller
//      logs the outcome — operator can inspect manually rather than be misled
//      by an unrelated run.
function findRelevantRun(runs, sha, mergedAtIso) {
  const exact = runs.find(r => r.headSha === sha);
  if (exact) return exact;
  if (!mergedAtIso) return null;
  const mergedAtMs = new Date(mergedAtIso).getTime();
  if (Number.isNaN(mergedAtMs)) return null;
  const candidates = runs
    .filter(r => new Date(r.createdAt).getTime() >= mergedAtMs)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return candidates[0] || null;
}

function watchWorkflowRun(repo, sha, workflow, runCommand, log, mergedAtIso) {
  const list = runCommand('gh', [
    'run',
    'list',
    `--repo=${repo}`,
    `--workflow=${workflow}`,
    '--branch=main',
    '--limit=20',
    '--json=databaseId,headSha,status,conclusion,createdAt',
  ]);
  if (list.status !== 0) {
    log(`  warn: could not list ${workflow} runs for ${repo}`);
    return null;
  }
  let runs;
  try {
    runs = JSON.parse(list.stdout);
  } catch {
    return null;
  }
  const match = findRelevantRun(runs, sha, mergedAtIso);
  if (!match) {
    log(
      `  warn: no ${workflow} run found on ${repo} main matching SHA ${sha?.slice(0, 7) || '?'}` +
        ` or created since merge time. Inspect runs manually.`
    );
    return null;
  }
  log(`  ${repo} ${workflow} run #${match.databaseId} status=${match.status} conclusion=${match.conclusion}`);
  if (match.status !== 'completed') {
    const watch = runCommand('gh', ['run', 'watch', `${match.databaseId}`, `--repo=${repo}`, '--exit-status'], { stdio: 'inherit' });
    return watch.status === 0 ? 'success' : 'failure';
  }
  return match.conclusion;
}

export { findRelevantRun };

async function main(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(a => !a.startsWith('--'));
  if (positional.length !== 2) {
    console.error('Usage: visor-publish-coordinate.mjs <visor-PR> <themes-PR> [--dry-run]');
    process.exit(2);
  }

  const cwd = process.cwd();
  const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
  const runCommand = (cmd, cmdArgs, opts = {}) =>
    spawnSync(cmd, cmdArgs, { encoding: 'utf8', stdio: opts.stdio || ['ignore', 'pipe', 'pipe'], cwd: opts.cwd });

  try {
    assertVisorWorktree(cwd, readJson);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  let visorNum, themesNum;
  try {
    visorNum = parsePRReference(positional[0]);
    themesNum = parsePRReference(positional[1]);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  console.log(`Coordinating release for ${VISOR_REPO}#${visorNum} + ${THEMES_REPO}#${themesNum}${dryRun ? ' (dry-run)' : ''}`);

  let visorPR, themesPR;
  try {
    visorPR = fetchPRJson(VISOR_REPO, visorNum, runCommand);
    themesPR = fetchPRJson(THEMES_REPO, themesNum, runCommand);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  visorPR.ciConclusion = fetchPRCIConclusion(VISOR_REPO, visorPR.mergeSha || visorPR.headSha, runCommand);
  themesPR.ciConclusion = fetchPRCIConclusion(THEMES_REPO, themesPR.mergeSha || themesPR.headSha, runCommand);

  const validation = validatePRStates({ visorPR, themesPR });
  if (!validation.ok) {
    console.error('Validation failed:');
    for (const err of validation.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  let visorPRFiles, themesPRFiles;
  try {
    visorPRFiles = fetchPRFiles(VISOR_REPO, visorNum, runCommand);
    themesPRFiles = fetchPRFiles(THEMES_REPO, themesNum, runCommand);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  const changesetReleases = loadChangesetReleases(cwd, runCommand);

  const preview = computeBumpPreview({
    visorPRFiles,
    themesPRFiles,
    changesetReleases,
    readJson,
  });

  console.log('');
  console.log(formatPreview(preview));
  console.log('');

  if (dryRun) {
    console.log('Dry-run: would prompt for confirmation and watch workflows. Exiting.');
    process.exit(0);
  }

  const confirmed = await promptYesNo('Trigger coordinated release? [y/N] ');
  if (!confirmed) {
    console.log('Aborted by operator.');
    process.exit(0);
  }

  console.log('');
  console.log('Watching workflows…');
  const visorOutcome = watchWorkflowRun(
    VISOR_REPO,
    visorPR.mergeSha,
    'release.yml',
    runCommand,
    console.log,
    visorPR.mergedAt
  );
  const themesOutcome = watchWorkflowRun(
    THEMES_REPO,
    themesPR.mergeSha,
    'publish.yml',
    runCommand,
    console.log,
    themesPR.mergedAt
  );

  console.log('');
  console.log('Final published versions:');
  for (const a of ARTIFACTS) {
    const args = ['view', a.name, 'version'];
    if (a.registry === 'github-packages') args.push('--registry=https://npm.pkg.github.com/');
    const result = runCommand('npm', args);
    const v = result.status === 0 ? result.stdout.trim() : 'unknown';
    console.log(`  ${a.name}: ${v}`);
  }

  if (visorOutcome === 'success' && themesOutcome === 'success') {
    console.log('Coordinated release complete.');
    process.exit(0);
  }
  console.log(`Workflow outcomes: visor=${visorOutcome}, themes=${themesOutcome}. Inspect failed runs.`);
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv).catch(e => {
    console.error(e);
    process.exit(2);
  });
}
