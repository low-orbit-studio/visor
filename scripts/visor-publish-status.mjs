#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ARTIFACTS = [
  {
    name: '@loworbitstudio/visor-core',
    repo: 'visor',
    source: 'local',
    relPath: 'packages/tokens/package.json',
    registry: 'npm',
  },
  {
    name: '@loworbitstudio/visor',
    repo: 'visor',
    source: 'local',
    relPath: 'packages/cli/package.json',
    registry: 'npm',
  },
  {
    name: '@loworbitstudio/visor-theme-engine',
    repo: 'visor',
    source: 'local',
    relPath: 'packages/theme-engine/package.json',
    registry: 'npm',
  },
  {
    name: '@low-orbit-studio/visor-themes-private',
    repo: 'visor-themes-private',
    source: 'external',
    envVar: 'VISOR_THEMES_PRIVATE_PATH',
    defaultDir: path.join(homedir(), 'Code/low-orbit/visor-themes-private'),
    relPath: 'package.json',
    registry: 'github-packages',
    // The `.npmrc` authenticates this scope with `_authToken=${GITHUB_PACKAGES_TOKEN}`,
    // a Bitwarden-backed secret injected by Varlock (see .env.schema). When that env
    // var is absent (script run outside `varlock run`), npm returns 401 — a local
    // setup issue, not publish drift. We surface that distinctly; see buildStatusReport.
    tokenEnvVar: 'GITHUB_PACKAGES_TOKEN',
  },
];

// Strict 3-part numeric semver (no prerelease/build tags). Changesets emits
// only major.minor.patch — a prerelease tag here means either a manual
// publish slipped through or upstream changed convention, both of which
// warrant a loud failure rather than silent NaN comparison.
export function compareVersions(a, b) {
  const parse = v => {
    const parts = String(v).split('.');
    if (parts.length !== 3) {
      throw new Error(`Unsupported version "${v}" — expected major.minor.patch.`);
    }
    return parts.map(p => {
      const n = Number(p);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`Unsupported version "${v}" — non-numeric component "${p}".`);
      }
      return n;
    });
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

export function detectDrift(published, onMain) {
  if (!published || !onMain) return 'error';
  let cmp;
  try {
    cmp = compareVersions(onMain, published);
  } catch {
    // Unsupported version shape on either side — surface as error rather than
    // crashing the whole status report.
    return 'error';
  }
  if (cmp === 0) return 'no';
  if (cmp > 0) return 'ahead';
  return 'behind';
}

export function formatStatusTable(rows) {
  const headers = ['Artifact', 'Published', 'On main', 'Drift'];
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length))
  );
  const pad = (s, w) => String(s ?? '').padEnd(w);
  const line = cells => cells.map((c, i) => pad(c, widths[i])).join('   ').trimEnd();
  return [line(headers), ...rows.map(line)].join('\n');
}

export function assertVisorWorktree(cwd, readJson) {
  const tokensPath = path.join(cwd, 'packages/tokens/package.json');
  let pkg;
  try {
    pkg = readJson(tokensPath);
  } catch {
    throw new Error(
      `Not a Visor checkout: ${cwd}\n` +
        `Expected packages/tokens/package.json. Invoke /lo-visor-publish from the Visor repo (e.g., ~/Code/visor/).`
    );
  }
  if (pkg.name !== '@loworbitstudio/visor-core') {
    throw new Error(
      `Found packages/tokens/package.json but name is "${pkg.name}", not @loworbitstudio/visor-core. ` +
        `Confirm cwd is the Visor repo root.`
    );
  }
}

export function resolveArtifactPath(artifact, cwd, env = process.env) {
  if (artifact.source === 'local') {
    return path.join(cwd, artifact.relPath);
  }
  const overrideDir = env[artifact.envVar];
  const baseDir = overrideDir || artifact.defaultDir;
  return path.join(baseDir, artifact.relPath);
}

// Returns { version, authError }. authError is true when npm rejected the request
// with a 401/Unauthorized — the signature of a missing or expired registry
// credential rather than a genuine missing package or network failure.
function fetchPublishedVersion(name, registry, runCommand) {
  const args = ['view', name, 'version'];
  if (registry === 'github-packages') {
    args.push('--registry=https://npm.pkg.github.com/');
  }
  const result = runCommand('npm', args);
  if (result.status !== 0) {
    const stderr = (result.stderr || '').toString();
    const reason = stderr.trim().split('\n')[0] || 'unknown error';
    const authError = /E401|Unauthorized/i.test(stderr);
    // Surface a brief reason on stderr so the operator can distinguish auth
    // failure / network / missing package without re-running by hand.
    process.stderr.write(`warn: could not read published version of ${name}: ${reason}\n`);
    return { version: null, authError };
  }
  return { version: result.stdout.trim() || null, authError: false };
}

/**
 * Default staleness threshold, in days, for the oldest pending changeset.
 *
 * Pending changesets are normal mid-development, so a bare count must never fail
 * the check — a permanently-red gate is an ignored gate (VI-633 D2). What is not
 * normal is a changeset sitting unreleased for weeks, which is the signature of a
 * broken publish path. 14 days is deliberately conservative: the 2026-07/09
 * outage ran 44 days, so this would have fired at day 15 with ~4 weeks to spare.
 */
export const DEFAULT_STALE_DAYS = 14;

/** Resolve the staleness threshold: explicit arg > env override > default. */
export function resolveStaleDays(env = process.env, override = undefined) {
  const raw = override ?? env.VISOR_PUBLISH_STALE_DAYS;
  if (raw === undefined || raw === null || String(raw).trim() === '') return DEFAULT_STALE_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(
      `Invalid stale-days threshold: ${raw}. Expected a non-negative number ` +
        `(VISOR_PUBLISH_STALE_DAYS or --stale-days).`
    );
  }
  return n;
}

/**
 * Pending changesets on main — the drift signal the version columns cannot see.
 *
 * A package version only moves when the Version Packages PR merges, so for the
 * entire window between a feature landing and a release, published === on-main
 * and every Drift cell reads `no`. Queued changesets are what is actually
 * unreleased (VI-633 D1).
 */
export function readPendingChangesets(cwd, readDir) {
  let entries;
  try {
    entries = readDir(path.join(cwd, '.changeset'));
  } catch {
    return [];
  }
  return entries.filter(f => f.endsWith('.md') && f.toLowerCase() !== 'readme.md').sort();
}

/**
 * Age in whole days of the oldest pending changeset, by git commit date.
 *
 * Deliberately git-derived, not filesystem mtime: a fresh clone or worktree
 * rewrites mtime to checkout time, which would report every changeset as new and
 * silently disarm the staleness gate in exactly the CI context it matters most.
 * Returns null when no changesets are pending or no date could be resolved.
 */
export function oldestChangesetAgeDays(cwd, files, runCommand, now = new Date()) {
  let oldest = null;
  for (const file of files) {
    const rel = path.posix.join('.changeset', file);
    const result = runCommand('git', ['-C', cwd, 'log', '-1', '--format=%cI', '--', rel]);
    if (result.status !== 0) continue;
    const iso = (result.stdout || '').toString().trim();
    if (!iso) continue;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) continue;
    if (oldest === null || t < oldest) oldest = t;
  }
  if (oldest === null) return null;
  return Math.floor((now.getTime() - oldest) / 86_400_000);
}

/**
 * Days since `version` of `name` was published, read from the registry's `time`
 * map.
 *
 * Sourced from the registry rather than CI run status on purpose (VI-633 D3):
 * during the outage the Release workflow went green three times in a row while
 * publishing nothing, because with pending changesets it takes the PR-refresh
 * path and never reaches the publish step. Green CI was not evidence of a
 * working publish path; a registry timestamp is.
 */
export function fetchPublishAgeDays(name, version, registry, runCommand, now = new Date()) {
  if (!version) return null;
  const args = ['view', name, 'time', '--json'];
  if (registry === 'github-packages') {
    args.push('--registry=https://npm.pkg.github.com/');
  }
  const result = runCommand('npm', args);
  if (result.status !== 0) return null;
  let times;
  try {
    times = JSON.parse((result.stdout || '').toString());
  } catch {
    return null;
  }
  const iso = times?.[version];
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86_400_000);
}

export function buildStatusReport({
  cwd,
  env,
  readJson,
  runCommand,
  readDir = undefined,
  now = new Date(),
  staleDays = undefined,
}) {
  assertVisorWorktree(cwd, readJson);

  const rows = [];
  let driftFound = false;
  let errorFound = false;
  let authMissing = false;

  for (const artifact of ARTIFACTS) {
    const localPath = resolveArtifactPath(artifact, cwd, env);
    let onMain = null;
    let onMainErr = null;
    if (existsSync(localPath)) {
      try {
        onMain = readJson(localPath).version;
      } catch (e) {
        onMainErr = `read-error`;
      }
    } else {
      onMainErr = `MISSING`;
    }

    const { version: published, authError } = fetchPublishedVersion(
      artifact.name,
      artifact.registry,
      runCommand
    );
    // A missing/expired registry credential (no token in the shell, or an npm 401)
    // is a local-setup issue, not publish drift — classify it as `auth?` so the row
    // never masquerades as a real drift/error and we can print a fix-it hint.
    const credMissing =
      Boolean(artifact.tokenEnvVar) &&
      !published &&
      (authError || !String(env[artifact.tokenEnvVar] ?? '').trim());

    const onMainCell = onMain ?? onMainErr ?? 'unknown';
    const publishedCell = published ?? (credMissing ? 'auth?' : 'unknown');
    let drift;
    if (onMain && published) {
      drift = detectDrift(published, onMain);
    } else if (credMissing) {
      drift = 'auth?';
    } else {
      drift = 'error';
    }

    if (drift === 'ahead') driftFound = true;
    if (drift === 'error') errorFound = true;
    if (credMissing) authMissing = true;

    rows.push([artifact.name, publishedCell, onMainCell, drift]);
  }

  // --- Queue + publish-path health (VI-633) -------------------------------
  // The rows above compare versions, which are equal for the whole window
  // between a feature landing and a release PR merging. Everything below is
  // what sees into that window.
  const threshold = resolveStaleDays(env, staleDays);
  const pending = readDir ? readPendingChangesets(cwd, readDir) : [];
  const oldestDays = pending.length
    ? oldestChangesetAgeDays(cwd, pending, runCommand, now)
    : null;

  // Anchor the publish-age readout on the CLI — it is the artifact operators
  // consume via `npx @loworbitstudio/visor` and the one whose staleness bit.
  const anchor = ARTIFACTS.find(a => a.name === '@loworbitstudio/visor');
  const anchorRow = rows.find(r => r[0] === anchor?.name);
  const anchorPublished =
    anchorRow && /^\d+\.\d+\.\d+$/.test(String(anchorRow[1])) ? String(anchorRow[1]) : null;
  const publishAgeDays = anchorPublished
    ? fetchPublishAgeDays(anchor.name, anchorPublished, anchor.registry, runCommand, now)
    : null;

  // Queue is stale only when work is actually queued AND it has been sitting
  // past the threshold — a bare count never fails the check (D2).
  const queueStale = pending.length > 0 && oldestDays !== null && oldestDays > threshold;

  return {
    rows,
    driftFound,
    errorFound,
    authMissing,
    queue: {
      pending: pending.length,
      oldestDays,
      staleDays: threshold,
      stale: queueStale,
    },
    lastPublish: {
      name: anchor?.name ?? null,
      version: anchorPublished,
      ageDays: publishAgeDays,
    },
  };
}

/** Render the queue + publish-path lines that sit under the drift table. */
export function formatQueueSummary({ queue, lastPublish }) {
  const lines = [];
  const oldest =
    queue.oldestDays === null ? 'age unknown' : `oldest ${queue.oldestDays}d`;
  lines.push(
    queue.pending === 0
      ? 'Pending changesets: 0'
      : `Pending changesets: ${queue.pending} (${oldest}, threshold ${queue.staleDays}d)`
  );
  if (lastPublish.version && lastPublish.ageDays !== null) {
    lines.push(
      `Last publish:       ${lastPublish.name}@${lastPublish.version}, ${lastPublish.ageDays}d ago`
    );
  } else if (lastPublish.version) {
    lines.push(`Last publish:       ${lastPublish.name}@${lastPublish.version}, age unknown`);
  }
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cwd = process.cwd();
  const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
  const readDir = p => readdirSync(p);
  const runCommand = (cmd, args) =>
    spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  const staleFlag = process.argv.find(a => a.startsWith('--stale-days='));
  const staleDays = staleFlag ? staleFlag.split('=')[1] : undefined;

  let report;
  try {
    report = buildStatusReport({
      cwd,
      env: process.env,
      readJson,
      runCommand,
      readDir,
      staleDays,
    });
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  console.log(formatStatusTable(report.rows));
  console.log('');
  console.log(formatQueueSummary(report));
  console.log('');
  if (report.authMissing) {
    console.log(
      'Could not read the private @low-orbit-studio artifact — GITHUB_PACKAGES_TOKEN is not set in this shell.'
    );
    console.log(
      'That token is Bitwarden-backed (see .env.schema); inject it by running the check under Varlock:'
    );
    console.log('  varlock run -- node scripts/visor-publish-status.mjs');
    console.log('');
  }
  if (report.errorFound) {
    console.log('One or more artifacts could not be checked. See rows above.');
    process.exit(1);
  }
  if (report.driftFound) {
    console.log('Drift detected — main is ahead of the registry for one or more artifacts.');
    process.exit(1);
  }
  if (report.authMissing) {
    // Public artifacts may be in sync, but the private one could not be verified
    // due to a missing local credential — exit non-zero so this isn't read as a
    // clean "all verified" result (and so a CI gate would catch a misconfigured run).
    process.exit(1);
  }
  if (report.queue.stale) {
    console.log(
      `Publish path looks stale: ${report.queue.pending} changeset(s) queued, oldest ` +
        `${report.queue.oldestDays}d old (threshold ${report.queue.staleDays}d).`
    );
    console.log(
      'Versions match, so the table above reads clean — that is the blind spot. Queued'
    );
    console.log(
      'changesets do not move package.json until the Version Packages PR merges, so a'
    );
    console.log('broken publish path stays invisible here. Check the Release workflow.');
    process.exit(1);
  }
  console.log('All artifacts in sync. No publish needed.');
  process.exit(0);
}
