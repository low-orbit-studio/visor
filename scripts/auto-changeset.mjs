import { readFileSync, writeFileSync } from 'node:fs';
import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BUMP_RANKS = { major: 3, minor: 2, patch: 1, none: 0 };

// Matches conventional commits, tolerating an optional Linear prefix (VI-184 feat: …)
const COMMIT_RE = /^(?:[A-Z]+-\d+\s+)?(?<type>\w+)(?<breaking>!)?(?:\([^)]*\))?:/;

function parseBump(commitMessage) {
  const [subject, ...bodyLines] = commitMessage.split('\n');
  if (bodyLines.join('\n').includes('BREAKING CHANGE:')) return 'major';

  const m = subject.match(COMMIT_RE);
  if (!m) return 'none';
  if (m.groups.breaking === '!') return 'major';
  if (m.groups.type === 'feat') return 'minor';
  if (m.groups.type === 'fix') return 'patch';
  return 'none';
}

function highestBump(commits) {
  let best = 'none';
  for (const { message } of commits) {
    const bump = parseBump(message);
    if (BUMP_RANKS[bump] > BUMP_RANKS[best]) {
      best = bump;
      if (best === 'major') break;
    }
  }
  return best;
}

function hasExistingChangeset(prFiles) {
  return prFiles.some(
    f =>
      f.filename.startsWith('.changeset/') &&
      f.filename.endsWith('.md') &&
      f.filename !== '.changeset/README.md',
  );
}

export function generateChangeset({ commits, prNumber, prTitle, existingChangesetFiles = [] }) {
  if (hasExistingChangeset(existingChangesetFiles)) return null;

  const bump = highestBump(commits);
  if (bump === 'none') return null;

  const slug = randomBytes(2).toString('hex');
  const filename = `.changeset/pr-${prNumber}-${slug}.md`;
  const content = `---\n"@loworbitstudio/visor-core": ${bump}\n---\n\n${prTitle}\n`;

  return { bump, filename, content };
}

// CLI — called by auto-changeset.yml
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , commitsFile, filesFile] = process.argv;

  const rawCommits = JSON.parse(readFileSync(commitsFile, 'utf8'));
  const commits = rawCommits.map(c => ({ message: c.commit.message }));

  const prFiles = filesFile ? JSON.parse(readFileSync(filesFile, 'utf8')) : [];

  const { PR_NUMBER, PR_TITLE } = process.env;
  if (!PR_NUMBER || !PR_TITLE) {
    console.error('Missing PR_NUMBER or PR_TITLE env vars');
    process.exit(1);
  }

  const result = generateChangeset({ commits, prNumber: PR_NUMBER, prTitle: PR_TITLE, existingChangesetFiles: prFiles });

  if (result) {
    writeFileSync(result.filename, result.content);
    console.error(`Created ${result.filename} (${result.bump})`);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `created=true\n`);
    }
  }
}
