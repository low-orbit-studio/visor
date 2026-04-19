# Changelog

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
