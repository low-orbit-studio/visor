# Blessed Builds

A **blessed build** is a Playbook reference application that has passed the three-gates review and is approved to be forked as the starting point for a new project. `visor spawn` turns consuming one into a single command.

Before `visor spawn`, adopting a blessed build meant a manual dance: `cp -R` the tree, delete `node_modules`/`.next`, `npm install`, then `visor theme apply` to re-skin it. Visor now owns that contract end-to-end.

## What makes a directory a blessed build

A blessed build is any directory that ships a `blessed-manifest.json` at its root. The manifest's presence is what marks the directory as forkable, and its `shape` + `pattern` fields are how `visor spawn` addresses it — the physical directory path does not matter (shape-agnostic).

### `blessed-manifest.json`

```json
{
  "shape": "admin-ui",
  "pattern": "organization-management",
  "base_theme": "entr",
  "requires_visor": ">=1.14.0",
  "captures_baseline": "captures/approved/",
  "three_gates_status": "passing"
}
```

| Field | Meaning |
|-------|---------|
| `shape` | Build shape, e.g. `admin-ui`. The `{shape}` in `blessed:{shape}:{pattern}`. |
| `pattern` | Pattern within the shape, e.g. `organization-management`. The `{pattern}`. |
| `base_theme` | The theme the build was authored and captured against. |
| `requires_visor` | Minimum Visor version the build is known to work with (semver range). |
| `captures_baseline` | Path (relative to the build root) to the approved capture baseline. |
| `three_gates_status` | Three-gates disposition when the build was blessed. |
| `theme_apply_target` | *Optional (VI-601).* Where the nextjs-adapter CSS is written when a theme is applied. See [Theme apply target](#theme-apply-target) below. |

The manifest is validated with [Zod](https://zod.dev) before any fork happens. The schema is **strict** — every required field must be present and unknown fields are rejected, so drift (a renamed or stray field) fails loudly instead of being silently ignored. If the file is missing entirely you get:

```
this directory is not a blessed build (missing blessed-manifest.json); see docs/blessed-builds.md
```

## Spawning a blessed build

```bash
visor spawn \
  --from blessed:admin-ui:organization-management \
  --theme entr \
  --output ~/tmp/org-admin \
  --install
```

```
✓ Discovered blessed build: admin-ui/organization-management (requires visor >=1.14.0)
✓ Forked to ~/tmp/org-admin (excluded node_modules, .next, .git)
✓ Theme applied: entr → ~/tmp/org-admin
✓ Installed dependencies

Next: cd ~/tmp/org-admin && npm run dev
```

### What spawn does

1. **Discover** — resolves `blessed:{shape}:{pattern}` by walking the blessed-dir and matching manifests.
2. **Fork** (D3) — copies the build tree into `--output`, excluding `node_modules`, `.next`, `.git`, `dist`, `.turbo`, `.cache`, `coverage`, and other transient artefacts. The fork is an independent project with no upstream tracking.
3. **Re-skin, atomically** (D4) — applies `--theme` to the fork's `app/globals.css` (or `src/app/globals.css`) using the same nextjs adapter as `visor theme apply --adapter nextjs`. If theme application fails, the entire spawn fails and the output directory is deleted — you get a clean fork or nothing.
4. **Install** (D5, opt-in) — `--install` runs `npm install` in the fork. Omitted by default.
5. **Validate** (D7, opt-in) — `--validate` runs the theme validator on the applied theme; validation errors roll the spawn back.

### The blessed-build root (D2)

`visor spawn` looks for blessed builds under, in order of precedence:

1. `--blessed-dir <path>`
2. `VISOR_BLESSED_DIR` environment variable
3. Default: `~/Code/low-orbit/low-orbit-playbook/design-prototypes/`

### Theme resolution

`--theme` accepts a theme id or a direct path to a `.visor.yaml`, resolved the same way as `visor sandbox init`:

1. `--theme-file <path>` if set
2. the value as a direct path
3. `${VISOR_THEMES_PRIVATE_PATH}/themes/<id>/theme.visor.yaml` if the env var is set
4. `themes/<id>.visor.yaml`, then `custom-themes/<id>.visor.yaml`

### Listing blessed builds

```bash
visor spawn --list-blessed
visor spawn --list-blessed --json
```

Walks the blessed-dir and prints every discoverable build with its base theme, required Visor version, and gates status.

## Theme apply target

Blessed builds are inherently heterogeneous — that is the whole point of the model. Some ship a monolithic `app/globals.css`; others (like `organization-management`) inline a per-theme CSS file per swap-point and select one at runtime. `theme_apply_target` lets a build declare *where* the nextjs-adapter output goes so `visor spawn` and `visor theme apply --target-path` write to the right place.

The field is optional. Manifests without it behave exactly as before VI-601: the adapter output is written to `app/globals.css` (or `src/app/globals.css` when only that variant exists).

Two kinds are supported:

### `globals-css`

Write the adapter output to a single file. `path` is optional and build-root-relative; when omitted, the pre-VI-601 default applies.

```json
{
  "theme_apply_target": {
    "kind": "globals-css",
    "path": "app/styles/root.css"
  }
}
```

### `themes-css-dir`

Write the adapter output to `<path>/<theme-id>.css`, where the theme id is the theme's `name` (from its `.visor.yaml`). Use this when the build ships one CSS file per registered theme and the runtime picks one at paint time. `path` is required.

```json
{
  "theme_apply_target": {
    "kind": "themes-css-dir",
    "path": "app/styles/themes/"
  }
}
```

Given `visor spawn --from blessed:admin-ui:organization-management --theme entr`, this writes the adapter CSS to `<output>/app/styles/themes/entr.css` and leaves `app/globals.css` untouched.

### Errors

Unknown kinds, malformed inputs, and required fields (e.g. `themes-css-dir` without `path`) fail the manifest validation before the fork begins. Errors point back at this section of the docs — silent fallback would mask misconfigured manifests.

### Standalone `visor theme apply`

The same dispatch is available outside `spawn` via `--target-path`:

```bash
visor theme apply ./themes/entr/theme.visor.yaml \
  --adapter nextjs \
  --target-path ~/some/blessed-build-root
```

`--target-path` requires `--adapter nextjs` (the dispatch contract is defined against the nextjs adapter's single-file output). The theme id used to name emitted files is derived from the theme's `name`.

## Authoring a blessed build

To make a reference build spawnable, add a `blessed-manifest.json` at its root with all six required fields above. Optionally add `theme_apply_target` if the build uses a swap-point other than `app/globals.css`. Run `visor spawn --list-blessed --blessed-dir <your-dir>` to confirm it is discovered.
