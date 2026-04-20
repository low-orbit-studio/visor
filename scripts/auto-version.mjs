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

export function detectChangedPackages(prFiles) {
  return PACKAGES.filter(pkg =>
    prFiles.some(f => f.filename.startsWith(pkg.dir + '/')),
  );
}

// Pure: accepts a readJson injector so it's unit-testable without touching disk.
export function computeBumps({ prFiles, readJson }) {
  const changed = detectChangedPackages(prFiles);
  return changed.map(pkg => {
    const { version } = readJson(`${pkg.dir}/package.json`);
    return { ...pkg, oldVersion: version, newVersion: bumpPatch(version) };
  });
}

// CLI — called by auto-version.yml after a PR merges.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , filesFile] = process.argv;

  const prFiles = filesFile ? JSON.parse(readFileSync(filesFile, 'utf8')) : [];
  const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

  const bumps = computeBumps({ prFiles, readJson });
  if (!bumps.length) process.exit(0);

  const summary = [];
  for (const { dir, name, oldVersion, newVersion } of bumps) {
    const pkgPath = `${dir}/package.json`;
    const pkgJson = readJson(pkgPath);
    pkgJson.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
    summary.push(`${name}: ${oldVersion} → ${newVersion}`);
    console.error(`Bumped ${name}: ${oldVersion} → ${newVersion}`);
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `bumped=true\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `summary=${summary.join(', ')}\n`);
  }
}
