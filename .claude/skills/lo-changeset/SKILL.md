---
name: lo-changeset
description: Generate an AI-written changeset for the current branch by reading the diff and invoking Claude. Shares the same logic and prompt as the pre-push git hook. Use when you want to manually generate a changeset, run it as part of /lo-land, or test the changeset generation locally.
---

# /lo-changeset — Generate AI-Written Changeset

Generates a `.changeset/<slug>.md` file for the current branch by reading
`git diff main...HEAD` and asking Claude to write the changeset description.

This skill is a thin wrapper around `scripts/generate-changeset.mjs` — the same
script that runs automatically via the `.husky/pre-push` hook. Single source of truth.

## When to invoke

- Manually, before opening a PR that needs a minor or major bump
- As part of `/lo-land` when a changeset hasn't been written yet
- To regenerate a changeset after additional commits

## Usage

```bash
node scripts/generate-changeset.mjs
```

Or trigger from Claude Code:

```
/lo-changeset
```

## Workflow

1. Run the script from the repo root:

```bash
node scripts/generate-changeset.mjs
```

2. The script will:
   - Detect whether any shipping path was touched (the list lives in `changeset-paths.json` at repo root — the same file the CI changeset gate reads)
   - Skip if no shipping paths were touched
   - Skip if an operator-authored changeset already exists (operator override wins)
   - If `claude` is not on PATH, print a warning and exit cleanly
   - Otherwise, invoke `claude -p` with the diff and the system prompt at `scripts/changeset-prompt.md`
   - Write the output to `.changeset/<branch-slug>.md`
   - Stage the new file with `git add`

3. Review the generated `.changeset/<slug>.md` before committing. It will contain:
   - A YAML frontmatter with the bump type for each touched package
   - The marker `# generated-by: lo-changeset` (used to detect auto-generated files)
   - A one-sentence description of the change

4. If the bump type or description is wrong, edit the file manually. Once you remove
   the `# generated-by: lo-changeset` marker, it becomes operator-authored and will
   not be overwritten on subsequent pushes.

## Bypass

To skip changeset generation on push:

```bash
git push --no-verify
```

## Failure handling

If `claude` fails or is not available, the script exits 0 (success) and prints a warning.
The push always proceeds. Run `npm run changeset` manually if you need a minor/major bump.

## Prompt source

`scripts/changeset-prompt.md` — the single source of truth for bump-type rules and
output format. Edit this file to tune the AI's behavior.
