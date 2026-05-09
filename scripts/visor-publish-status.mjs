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
  },
];

// Strict 3-part numeric semver (no prerelease/build tags). Visor's auto-version
// and changesets emit only major.minor.patch — a prerelease tag here means
// either a manual publish slipped through or upstream changed convention, both
// of which warrant a loud failure rather than silent NaN comparison.
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

function fetchPublishedVersion(name, registry, runCommand) {
  const args = ['view', name, 'version'];
  if (registry === 'github-packages') {
    args.push('--registry=https://npm.pkg.github.com/');
  }
  const result = runCommand('npm', args);
  if (result.status !== 0) {
    // Surface a brief reason on stderr so the operator can distinguish auth
    // failure / network / missing package without re-running by hand.
    const reason = (result.stderr || '').toString().trim().split('\n')[0] || 'unknown error';
    process.stderr.write(`warn: could not read published version of ${name}: ${reason}\n`);
    return null;
  }
  return result.stdout.trim() || null;
}

export function buildStatusReport({ cwd, env, readJson, runCommand }) {
  assertVisorWorktree(cwd, readJson);

  const rows = [];
  let driftFound = false;
  let errorFound = false;

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

    const published = fetchPublishedVersion(artifact.name, artifact.registry, runCommand);
    const onMainCell = onMain ?? onMainErr ?? 'unknown';
    const publishedCell = published ?? 'unknown';
    const drift = onMain && published ? detectDrift(published, onMain) : 'error';

    if (drift === 'ahead') driftFound = true;
    if (drift === 'error') errorFound = true;

    rows.push([artifact.name, publishedCell, onMainCell, drift]);
  }

  return { rows, driftFound, errorFound };
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
  if (report.errorFound) {
    console.log('One or more artifacts could not be checked. See rows above.');
    process.exit(1);
  }
  if (report.driftFound) {
    console.log('Drift detected — main is ahead of the registry for one or more artifacts.');
    process.exit(1);
  }
  console.log('All artifacts in sync. No publish needed.');
  process.exit(0);
}
