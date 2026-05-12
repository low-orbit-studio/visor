# W020 — Workspace symlinks mask publish-coordination drift

**Tags:** monorepo, npm, publish, changesets, semver, workspaces
**Source:** Visor 0.5.0 publish — CLI shipped with `import { flutterAdapter }` from `@loworbitstudio/visor-theme-engine/adapters` while depending on `^0.4.0`. The published `theme-engine@0.4.0` tarball did not export `flutterAdapter` — the export had been added to local source after 0.4.0 was published. A Borealis session installing the CLI hit `SyntaxError: ... does not provide an export named 'flutterAdapter'` on every command, including `visor --help`. Second publish-coordination snag in the same session.

## What

In a JS monorepo, workspace symlinks resolve internal deps to *local source* during dev — but external consumers installing from npm get the *last published tarball*. When a downstream workspace package adds an `import { newSymbol }` from an upstream workspace package, dev passes (local source has the symbol) and tests pass (workspace resolution) — but the published downstream is broken on consumer install if the upstream tarball doesn't yet export `newSymbol`.

A `^X.Y.Z` semver constraint does **not** protect you. The constraint resolves against npm metadata (versions in the registry), not against what your local source happens to contain at the moment of publish. The export surface of `theme-engine@0.4.0` was frozen at the moment of its publish; subsequent local additions to `src/adapters/index.ts` had no effect on what consumers received.

Tools that hide this:
- **npm/pnpm/yarn workspaces** — symlink resolution at dev time.
- **`changesets`** — bumps versions per-changeset, but does not check that downstream imports resolve against the upstream version their dep range will resolve to on install.
- **`tsup`/`esbuild`** — happily bundle imports that exist in workspace source; do not reach across to npm.

Symptom on consumer side: the *entire* downstream package fails to load — not a runtime branch, the ESM evaluator throws on the import statement before any code runs. So `visor --help` breaks the same way `visor init` breaks. Total opacity from the consumer's perspective.

## How (the fix path)

**When this happens** — i.e., a downstream is already published with a stale upstream constraint — the minimum-viable fix is to **patch-bump the upstream and republish**, satisfying the existing `^X.Y.Z` range. No downstream republish needed.

```bash
# In the upstream package, add a changeset
cat > .changeset/<slug>.md <<'EOF'
---
"@loworbitstudio/<upstream>": patch
---

Republish with <missing-export> in the export surface (was added to local
source after the prior publish).
EOF

# Land via PR -> changesets opens "Version Packages" -> merge -> CI publishes.
```

The patch is preferable to a coupled minor-bump on both packages: minimal blast radius, no consumer-side dep update, and the changelog tells the truth about *why* the version exists (a republish, not a feature).

## How (the prevention)

Add a pre-publish CI gate on the monorepo. For each package about to publish:

1. Walk every workspace package that depends on it via `^X.Y.Z`.
2. Resolve the `^X.Y.Z` constraint against npm to find the version a fresh consumer would actually install.
3. Statically analyse the downstream's imports from that upstream (every `from "@loworbitstudio/<upstream>"` and subpath like `/adapters`).
4. Compare against the named exports of the resolved upstream tarball (download + parse `dist/**/*.d.ts` or run `npm view <pkg>@<resolved-version>` and inspect).
5. **Fail the publish** if any imported symbol is missing. Surface both options in the error: "republish `<upstream>` with the missing export, or tighten the downstream constraint to a version that includes it."

The check should run on `main` before `changeset publish` — i.e., as a step in `.github/workflows/release.yml` between `Build packages` and `Create Release Pull Request or Publish`. CI-enforced, not opt-in.

## When this applies

- Any time a workspace package gains an export that another workspace package starts importing (especially via subpath exports like `/adapters`, `/fowt`, `/schema`).
- Any cross-package change where the downstream's `^X.Y.Z` range does not already include the new upstream version.
- Whenever you see a `Version Packages` PR that bumps only the downstream — pause and verify the upstream actually exposes everything the downstream uses.

## Prevention: gate is active

The pre-publish export-surface drift gate described above is now implemented and active in CI.

**Script:** `scripts/check-export-drift.mjs` — static analysis of workspace imports vs. resolved upstream tarball exports.

**Where it runs:** `.github/workflows/release.yml`, as the "Check export-surface drift" step between "Build packages" and "Create Release Pull Request or Publish". The gate only runs on `main` (publish path) — not in `ci.yml` for PRs, where workspace symlinks mask the issue anyway.

**What it does:** For each workspace package that depends on a sibling `@loworbitstudio/*` package, it parses all TS source imports, resolves the upstream's `^X.Y.Z` range against the npm registry, downloads that tarball, and compares the imported symbols against the tarball's named export surface. Subpath imports (`/adapters`, `/fowt`, `/schema`) are correctly resolved via the upstream `package.json` exports field.

**Ticket:** [VI-337](https://linear.app/low-orbit-studio/issue/VI-337/)

## Workflow gate: publish path only

The drift check belongs on the **publish** path — the moment we're about to push a CLI tarball that pins an upstream tarball. It must **not** block the **PR-refresh** path, where Changesets just consumes pending `.changeset/*.md` files into the Version Packages PR. The refresh action doesn't touch npm, so there's nothing to gate; gating it deadlocks the Version Packages PR every time any feature PR adds an import of a symbol that isn't in the published upstream tarball yet.

The discriminator is whether pending changesets exist on `main`:

- **Pending changesets present** → refresh path → drift check **skipped**, Changesets runs, Version Packages PR updates.
- **No pending changesets** → publish path (the Version Packages PR just merged) → drift check **runs**, then Changesets publishes (or hits the warn-skip resolution-fails branch).

Implemented in `.github/workflows/release.yml` as a `Detect pending changesets` step (`id: changesets`, outputs `pending`) followed by `if: steps.changesets.outputs.pending == '0'` on `Check export-surface drift`.

**Ticket:** [VI-361](https://linear.app/low-orbit-studio/issue/VI-361/)

## References

- [PR #308](https://github.com/low-orbit-studio/visor/pull/308) — the patch-bump fix.
- `packages/theme-engine/src/adapters/index.ts` — the file whose export surface drifted.
- `.github/workflows/release.yml` — where the prevention gate lives.
- `scripts/check-export-drift.mjs` — the gate implementation.
- `scripts/__tests__/check-export-drift.test.mjs` — unit tests.
