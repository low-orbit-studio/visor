import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Regression test for VI-374: pre-push hook silently skipped in subagent
// worktrees. The fix sets core.hooksPath to '.husky' (relative, no '_/'
// wrapper) so the path resolves per-worktree to a tracked hook script.
//
// This test reproduces the failure mode in an isolated temp repo:
//   1. Parent repo with .husky/pre-push (tracked) + core.hooksPath = .husky
//   2. Add a worktree (no extra setup, mirroring `git worktree add`)
//   3. Push from the worktree and assert the hook fired

const HOOK_TOKEN = '[lo-changeset]';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function writeHook(repo) {
  const hookPath = join(repo, '.husky', 'pre-push');
  mkdirSync(join(repo, '.husky'), { recursive: true });
  writeFileSync(hookPath, `#!/usr/bin/env sh\necho '${HOOK_TOKEN} hook fired'\nexit 0\n`);
  chmodSync(hookPath, 0o755);
}

describe('husky core.hooksPath propagation to worktrees (VI-374)', () => {
  let sandbox;
  let parent;
  let bareRemote;
  let worktree;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'vi-374-'));
    parent = join(sandbox, 'parent');
    bareRemote = join(sandbox, 'remote.git');
    worktree = join(sandbox, 'worktree');

    // Bare remote so `git push --dry-run` has a target.
    mkdirSync(bareRemote);
    git(bareRemote, 'init', '--bare', '--initial-branch=main');

    // Parent repo: tracked hook + initial commit.
    mkdirSync(parent);
    git(parent, 'init', '--initial-branch=main');
    git(parent, 'config', 'user.email', 'test@local');
    git(parent, 'config', 'user.name', 'test');
    writeHook(parent);
    git(parent, 'add', '.husky/pre-push');
    git(parent, 'commit', '-m', 'initial');
    git(parent, 'remote', 'add', 'origin', bareRemote);
    git(parent, 'push', 'origin', 'main');
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it('parent repo: setting core.hooksPath to .husky makes the tracked hook fire', () => {
    git(parent, 'config', 'core.hooksPath', '.husky');
    expect(git(parent, 'config', 'core.hooksPath').trim()).toBe('.husky');

    writeFileSync(join(parent, 'file.txt'), 'change');
    git(parent, 'add', 'file.txt');
    git(parent, 'commit', '-m', 'parent change');

    let combined;
    try {
      combined = execFileSync('git', ['push', '--dry-run', 'origin', 'main'], {
        cwd: parent,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      combined = (err.stdout || '') + (err.stderr || '');
    }
    expect(combined).toContain(HOOK_TOKEN);
  });

  it('subagent worktree inherits .husky hooksPath and fires the tracked hook', () => {
    // Apply the fix in the shared .git/config (what package.json `prepare` does).
    git(parent, 'config', 'core.hooksPath', '.husky');

    // Mirror `git worktree add` — no extra setup, no `_/` directory copy.
    git(parent, 'worktree', 'add', '-b', 'wt-branch', worktree);

    // Worktree inherits the shared config.
    expect(git(worktree, 'config', 'core.hooksPath').trim()).toBe('.husky');

    // Make a change in the worktree and push.
    writeFileSync(join(worktree, 'wt-file.txt'), 'worktree change');
    git(worktree, 'add', 'wt-file.txt');
    git(worktree, 'config', 'user.email', 'test@local');
    git(worktree, 'config', 'user.name', 'test');
    git(worktree, 'commit', '-m', 'worktree change');

    let combined;
    try {
      combined = execFileSync('git', ['push', '--dry-run', 'origin', 'wt-branch'], {
        cwd: worktree,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      combined = (err.stdout || '') + (err.stderr || '');
    }
    expect(combined).toContain(HOOK_TOKEN);
  });

  it('regression: with the pre-VI-374 hooksPath of .husky/_, the worktree push is silent', () => {
    // Reproduce the broken state to lock in the failure mode the fix addresses.
    mkdirSync(join(parent, '.husky', '_'), { recursive: true });
    const wrappedHook = join(parent, '.husky', '_', 'pre-push');
    writeFileSync(wrappedHook, `#!/usr/bin/env sh\necho '${HOOK_TOKEN} via wrapper'\nexit 0\n`);
    chmodSync(wrappedHook, 0o755);
    git(parent, 'config', 'core.hooksPath', '.husky/_');

    // Worktree starts with no `.husky/_` because the wrapper is gitignored
    // and only `npm install` creates it. `git worktree add` doesn't run install.
    git(parent, 'worktree', 'add', '-b', 'broken-wt', worktree);

    expect(git(worktree, 'config', 'core.hooksPath').trim()).toBe('.husky/_');

    writeFileSync(join(worktree, 'wt-file.txt'), 'worktree change');
    git(worktree, 'add', 'wt-file.txt');
    git(worktree, 'config', 'user.email', 'test@local');
    git(worktree, 'config', 'user.name', 'test');
    git(worktree, 'commit', '-m', 'worktree change');

    let combined;
    try {
      combined = execFileSync('git', ['push', '--dry-run', 'origin', 'broken-wt'], {
        cwd: worktree,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      combined = (err.stdout || '') + (err.stderr || '');
    }
    // No token => git silently skipped the missing hook. This is the bug.
    expect(combined).not.toContain(HOOK_TOKEN);
  });
});
