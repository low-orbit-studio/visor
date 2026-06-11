#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
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

export function buildStatusReport({ cwd, env, readJson, runCommand }) {
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

  return { rows, driftFound, errorFound, authMissing };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cwd = process.cwd();
  const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
  const runCommand = (cmd, args) =>
    spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  let report;
  try {
    report = buildStatusReport({ cwd, env: process.env, readJson, runCommand });
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  console.log(formatStatusTable(report.rows));
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
  console.log('All artifacts in sync. No publish needed.');
  process.exit(0);
}
