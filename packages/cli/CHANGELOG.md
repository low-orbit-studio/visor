# Changelog

## 0.6.0

### Minor Changes

- 32fe0d8: Add three new registry components and a new `registry:devtool` type.

  - `theme-switcher` (registry:ui, category: general) — promoted from the admin-v7-r1 reference into a Visor registry primitive. Configurable `themes` prop, optional `extras: React.ReactNode` slot for hosting devtools chrome (e.g., `SourceInspectorToggle`), persists to `visor-theme` and `visor-color-mode` localStorage keys. Install via `npx visor add theme-switcher`.
  - `source-inspector` (registry:devtool, category: devtools) — Borealis pre-flight x-ray overlay. Walks the React Fiber tree, classifies each rendered DOM node by source file via host-supplied predicates, stamps `data-source` attributes, and tints regions to surface Visor coverage and gaps. No-op in production builds. Install via `npx visor add source-inspector`.
  - `source-inspector-toggle` (registry:devtool, category: devtools) — Phosphor `Scan` icon button that cycles the SourceInspector overlay through off → highlight-visor → highlight-non-visor → off. Mounts a default provider lazily; `Ctrl+Shift+X` hotkey by default. Install via `npx visor add source-inspector-toggle`.
  - New `registry:devtool` registry type added to `registry/schema.ts` and `packages/cli/src/registry/types.ts` so consumers can filter dev-only components.

## 0.5.0

### Minor Changes

- e08e93b: Add DateRangePicker component. Two-month popover range picker built on Calendar + Radix Popover. Install via `npx visor add date-range-picker`.

## [Unreleased]

## [0.3.0] - Initial release

### Added

- Initial release of the Visor CLI for managing design system components and themes.

## 0.2.0 — AI Consumability & Theme Sync

### CLI Commands

- **`visor info <component> --json`** — Machine-readable component metadata for AI agents (VI-153)
- **`visor pattern list` / `visor pattern info`** — Discover and inspect usage patterns (VI-154)
- **`visor suggest --for <context>`** — AI-friendly component suggestions by use case (VI-156)
- **`visor doctor --json`** — JSON output mode for programmatic health checks (VI-158)
- **`visor tokens list --json`** — Token inventory with machine-readable output; tokens section added to `visor-manifest.json` (VI-159)
- **`visor diff --all --json`** — Full registry diff with structured output; generates `CHANGELOG.json` (VI-161)
- **`visor theme sync`** — Pull the latest version of an installed theme from the registry (VI-148)

### Infrastructure

- **Custom theme overlay pattern** — Consumers can layer theme overrides without forking the base theme (VI-168)
- **Stale global CLI warning** — `visor doctor` now detects when the globally installed CLI is behind the project version (VI-170)
- **Exit codes & circular dep warnings** — Hardened CLI safety: non-zero exits on failure, circular dependency detection in component graphs (VI-152)
- **Hook params/returns in manifest** — `visor-manifest.json` now includes hook parameter and return type metadata (VI-152)

## 0.1.0 — Initial Release

### CLI Commands

- **`visor add <component>`** — Registry-based component installation (copy-and-own)
- **`visor init`** — Auto-initialize a project with Visor configuration
- **`visor list`** — List available components in the registry
- **`visor doctor`** — Health check for Visor installation and configuration
- **`visor info <component>`** — Component metadata and usage guidance
- **`visor theme sync`** — Sync installed themes to latest registry version

### Infrastructure

- **`visor-manifest.json`** — Registry manifest with component metadata, hooks, and patterns for AI agent discovery
- **Turbopack guidance** — Auto-detects Turbopack projects and surfaces compatibility notes
