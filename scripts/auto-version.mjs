import { readFileSync, writeFileSync } from 'node:fs';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Published packages that can receive automatic patch bumps.
// Add new packages here as they are introduced.
export const PACKAGES = [
  { dir: 'packages/tokens', name: '@loworbitstudio/visor-core' },
  { dir: 'packages/cli', name: '@loworbitstudio/visor' },
  { dir: 'packages/theme-engine', name: '@loworbitstudio/visor-theme-engine' },
];

export function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

// Skip packages whose package.json was modified by the PR — the author
// already handled versioning (minor, major, or dep update). Auto-bumping
// on top of a manual version change would produce an unintended extra increment.
export function detectChangedPackages(prFiles) {
  return PACKAGES.filter(pkg => {
    const hasChanges = prFiles.some(f => f.filename.startsWith(pkg.dir + '/'));
    const alreadyVersioned = prFiles.some(f => f.filename === `${pkg.dir}/package.json`);
    return hasChanges && !alreadyVersioned;
  });
}

// Pure: accepts a readJson injector so it's unit-testable without touching disk.
export function computeBumps({ prFiles, readJson }) {
  const changed = detectChangedPackages(prFiles);
  return changed.map(pkg => {
    const { version } = readJson(`${pkg.dir}/package.json`);
    return { ...pkg, oldVersion: version, newVersion: bumpPatch(version) };
  });
}

// Updates the workspace version entries in package-lock.json without running
// npm install — surgical edit avoids network calls and is fast in CI.
export function applyBumpsToLockFile(lockFile, bumps) {
  for (const { dir, newVersion } of bumps) {
    if (lockFile.packages?.[dir]) {
      lockFile.packages[dir].version = newVersion;
    }
  }
  return lockFile;
}

// CLI — called by auto-version.yml after a PR merges.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , filesFile] = process.argv;

  const prFiles = filesFile ? JSON.parse(readFileSync(filesFile, 'utf8')) : [];
  const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

  const bumps = computeBumps({ prFiles, readJson });
  if (!bumps.length) process.exit(0);

  for (const { dir, name, oldVersion, newVersion } of bumps) {
    const pkgPath = `${dir}/package.json`;
    const pkgJson = readJson(pkgPath);
    pkgJson.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.error(`Bumped ${name}: ${oldVersion} → ${newVersion}`);
  }

  const lockPath = 'package-lock.json';
  const lockFile = applyBumpsToLockFile(readJson(lockPath), bumps);
  writeFileSync(lockPath, JSON.stringify(lockFile, null, 2) + '\n');
  console.error('Updated package-lock.json');

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `bumped=true\n`);
  }
}
