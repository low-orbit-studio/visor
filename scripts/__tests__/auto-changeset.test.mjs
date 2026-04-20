import { describe, it, expect } from 'vitest';
import { generateChangeset } from '../auto-changeset.mjs';

function make(message) {
  return { message };
}

const base = { prNumber: '42', prTitle: 'My feature', existingChangesetFiles: [] };

describe('generateChangeset — bump detection', () => {
  it('feat: → minor', () => {
    const r = generateChangeset({ ...base, commits: [make('feat: add button')] });
    expect(r).not.toBeNull();
    expect(r.bump).toBe('minor');
    expect(r.filename).toMatch(/^\.changeset\/pr-42-[0-9a-f]{4}\.md$/);
    expect(r.content).toContain('"@loworbitstudio/visor-core": minor');
    expect(r.content).toContain('My feature');
  });

  it('fix: → patch', () => {
    const r = generateChangeset({ ...base, commits: [make('fix: correct color')] });
    expect(r?.bump).toBe('patch');
  });

  it('feat!: → major', () => {
    const r = generateChangeset({ ...base, commits: [make('feat!: redesign token API')] });
    expect(r?.bump).toBe('major');
  });

  it('fix!: → major', () => {
    const r = generateChangeset({ ...base, commits: [make('fix!: rename tokens')] });
    expect(r?.bump).toBe('major');
  });

  it('BREAKING CHANGE in commit body → major', () => {
    const msg = 'fix: change token names\n\nBREAKING CHANGE: --old-token removed';
    const r = generateChangeset({ ...base, commits: [make(msg)] });
    expect(r?.bump).toBe('major');
  });

  it('chore: only → no changeset', () => {
    expect(generateChangeset({ ...base, commits: [make('chore: update deps')] })).toBeNull();
  });

  it('docs: only → no changeset', () => {
    expect(generateChangeset({ ...base, commits: [make('docs: update README')] })).toBeNull();
  });

  it('refactor: only → no changeset', () => {
    expect(generateChangeset({ ...base, commits: [make('refactor: extract helper')] })).toBeNull();
  });

  it('ci: only → no changeset', () => {
    expect(generateChangeset({ ...base, commits: [make('ci: add workflow')] })).toBeNull();
  });
});

describe('generateChangeset — Linear prefix tolerance', () => {
  it('VI-184 feat: → minor', () => {
    const r = generateChangeset({ ...base, commits: [make('VI-184 feat: something')] });
    expect(r?.bump).toBe('minor');
  });

  it('BO-2 fix: → patch', () => {
    const r = generateChangeset({ ...base, commits: [make('BO-2 fix: small bug')] });
    expect(r?.bump).toBe('patch');
  });

  it('VI-99 feat!: → major', () => {
    const r = generateChangeset({ ...base, commits: [make('VI-99 feat!: breaking change')] });
    expect(r?.bump).toBe('major');
  });
});

describe('generateChangeset — mixed commit types', () => {
  it('feat + fix → minor wins', () => {
    const r = generateChangeset({
      ...base,
      commits: [make('fix: small fix'), make('feat: new thing')],
    });
    expect(r?.bump).toBe('minor');
  });

  it('feat! + feat → major wins', () => {
    const r = generateChangeset({
      ...base,
      commits: [make('feat: ordinary'), make('feat!: breaking')],
    });
    expect(r?.bump).toBe('major');
  });

  it('docs + chore + fix → patch (lowest non-none)', () => {
    const r = generateChangeset({
      ...base,
      commits: [make('docs: readme'), make('chore: deps'), make('fix: typo')],
    });
    expect(r?.bump).toBe('patch');
  });
});

describe('generateChangeset — existing changeset skip', () => {
  it('skips when PR already has a .changeset/*.md file', () => {
    const r = generateChangeset({
      ...base,
      commits: [make('feat: something')],
      existingChangesetFiles: [{ filename: '.changeset/abc123.md' }],
    });
    expect(r).toBeNull();
  });

  it('does NOT skip for .changeset/README.md alone', () => {
    const r = generateChangeset({
      ...base,
      commits: [make('feat: something')],
      existingChangesetFiles: [{ filename: '.changeset/README.md' }],
    });
    expect(r).not.toBeNull();
    expect(r?.bump).toBe('minor');
  });

  it('does NOT skip for .changeset/config.json', () => {
    const r = generateChangeset({
      ...base,
      commits: [make('fix: something')],
      existingChangesetFiles: [{ filename: '.changeset/config.json' }],
    });
    expect(r).not.toBeNull();
    expect(r?.bump).toBe('patch');
  });
});
