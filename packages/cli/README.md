# @loworbitstudio/visor

CLI for the [Visor](https://visor.loworbit.studio) design system — add components, hooks, and utilities to your project.

## Installation

```bash
npx visor init
```

## Commands

| Command | Description |
|---------|-------------|
| `visor add <component>` | Copy a component into your project |
| `visor add <component> --target flutter` | Copy Flutter widget(s) + merge `visor_core` into `pubspec.yaml` |
| `visor list` | List all available components |
| `visor info <component>` | Component metadata and usage guidance |
| `visor theme sync` | Sync installed themes to latest |
| `visor tokens list` | Browse available design tokens |
| `visor doctor` | Check your Visor installation health |
| `visor diff` | See what's changed since you last updated |
| `visor suggest --for <context>` | Get component suggestions for a use case |
| `visor migrate token-substitution [path]` | Apply the §3.1 V7-primitive → Visor-semantic substitution table (dry-run by default; use `--apply` to commit) |
| `visor check design <path>` | Scan frontend code for Borealis design anti-patterns (deterministic, no LLM) |
| `visor sandbox init <name>` | Scaffold a Next.js sandbox for in-vivo primitive iteration from a design-handoff manifest |
| `visor sandbox dev --name <name>` | Boot the sandbox dev server on its allocated port (port 3000 reserved) |
| `visor sandbox approve --name <name>` | Capture Playwright screenshots of every sandbox route as the visual spec (use `--diff` to pixel-diff vs prior approved) |

## Sandbox

The `sandbox` subcommand scaffolds a Next.js app at `.lo/sandbox/<name>/`
populated with real Visor primitives (via `visor add`) plus visible gap stubs
for primitives not yet shipped. Operators iterate visually in a real Next.js
dev server; on approval, captures become the `visual_spec` attached to the
gap primitive's VI ticket.

```bash
# 1. Init from a design-handoff manifest
npx visor sandbox init org-mgmt \
  --handoff ~/Code/playbook/.lo/pattern-builds/organization-management/design-handoff.md \
  --theme entr

# 2. Iterate visually
npx visor sandbox dev --name org-mgmt
# → prints per-route URLs on a port >= 4060 (never 3000)

# 3. Approve captures
npx visor sandbox approve --name org-mgmt           # writes captures/approved/*.png
npx visor sandbox approve --name org-mgmt --diff    # pixel-diff vs prior approved
```

Pass `--theme <slug>` to look up a theme by name in `themes/` or
`custom-themes/`, or `--theme /path/to/theme.visor.yaml` for an arbitrary
location. Pass `--overwrite` to replace an existing sandbox; `--skip-install`
skips `npm install` (useful for test fixtures).

Gap primitives appear as visible dashed-border placeholders containing
`GAP: VI-<NNN>` plus the primitive name. Hand-edit the stub at
`components/stubs/<primitive>.tsx` to sketch the design in place; the operator
edits propagate into the captures and become the visual spec downstream.

## Target platforms

`visor add` defaults to the React target. Pass `--target flutter` to install
copy-and-own Flutter widgets that read their tokens from the `visor_core`
pub.dev package:

```bash
cd my_flutter_app
npx visor add button stat-card empty-state section-header --target flutter
```

This writes widget sources under `config.paths.flutterComponents`
(default `lib/visor/components/`), merges `visor_core` into `pubspec.yaml`
preserving your existing deps and comments, and runs `flutter pub get` via
`flutter` on PATH or via FVM (`~/fvm/default` → highest installed version).
When the Flutter CLI can't be found, `add` finishes writing files and warns
so you can run `flutter pub get` yourself.

## visor check design

Deterministic static analysis for Borealis design anti-patterns. No LLM required. Scans `.tsx`, `.jsx`, `.ts`, `.js`, `.css`, and `.module.css` files.

```bash
# Human-readable terminal output
npx visor check design ./src

# JSON output for programmatic consumers (e.g. /lo-audit-design)
npx visor check design ./src --json

# Errors only (skip warnings)
npx visor check design ./src --errors-only

# Advisory mode — report without failing CI
npx visor check design ./src --no-fail
```

### Output schema (--json)

```json
{
  "success": true,
  "errors": [
    {
      "file": "src/components/Button.tsx",
      "line": 12,
      "rule": "hardcoded-hex",
      "severity": "error",
      "message": "Hardcoded hex color \"#1a2b3c\" bypasses the Borealis token system.",
      "fix": "Replace with the appropriate semantic token: var(--color-surface), var(--color-text-primary), etc."
    }
  ],
  "warnings": [],
  "summary": {
    "errorCount": 1,
    "warningCount": 0,
    "filesScanned": 14
  }
}
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | No violations (or `--no-fail` mode) |
| `1` | One or more error-severity findings |

### Rules

#### Error rules — Borealis non-negotiables

| Rule | What it catches | Fix |
|------|-----------------|-----|
| `tier-1-token-direct-usage` | Direct use of `--primitive-*`, `--raw-*`, `--palette-*` tokens in component code | Replace with the equivalent Tier-2 semantic token |
| `hardcoded-hex` | Raw hex color literals (`#fff`, `#1a2b3c`) in source files | Use `var(--color-surface)`, `var(--color-text-primary)`, etc. |
| `hardcoded-px` | Hardcoded pixel values in spacing/sizing properties (`margin`, `padding`, `width`, `height`, `gap`) | Use `var(--space-1)`, `var(--space-4)`, etc. |
| `missing-dark-mode-block` | CSS files without a dark mode block | Add `@media (prefers-color-scheme: dark) { … }` or `[data-theme="dark"] { … }` |
| `missing-hover-transition` | CSS files with `:hover` but no `transition` property | Add `transition: color 150ms ease, background 150ms ease` to base styles |
| `div-as-input` | `<div onClick>` without `role=` — div masquerading as interactive element | Use `<button>` or add `role="button"` + `tabIndex={0}` |
| `setstate-hover` | `useState` used to track hover state (or `onMouseEnter`/`onMouseLeave` with setState) | Delete the hover state variable; use CSS `:hover` instead |
| `missing-aria-pressed` | Toggle buttons with active/selected/open props but no `aria-pressed` | Add `aria-pressed={isActive}` to the button element |

#### Warn rules — general anti-patterns

| Rule | What it catches | Fix |
|------|-----------------|-----|
| `banned-fonts` | Inter, Roboto, Arial, system-ui font references | Use `var(--font-sans)` or the project's designated font token |
| `purple-gradient-on-white` | Purple gradient patterns — generic SaaS visual cliché | Replace with brand token gradients |
| `pure-black-untinted` | `#000`, `#000000`, `black` keyword — flat pure black | Use `var(--color-text-primary)` or a near-black tinted token |
| `bounce-easing` | Overshoot cubic-bezier values or `bounce` easing keyword | Use `ease`, `ease-out`, or `cubic-bezier(0.4, 0, 0.2, 1)` |
| `sub-44px-touch-target` | Interactive elements with explicit dimensions below 44px | Minimum 44×44px touch target per WCAG 2.5.5 |
| `line-length-over-75ch` | `max-width` over 75ch on text containers | Cap at 65–75ch for optimal reading comfort |
| `gradient-text` | `background-clip: text` / `-webkit-text-fill-color: transparent` gradient text | Use a solid semantic text color token; reserve for hero headings only |
| `excessive-card-nesting` | Card/Panel/Box components nested 3+ levels deep | Flatten layout; use spacing, dividers, or type scale for hierarchy |

### Per-project rule toggles

Create a `.visorrc.json` in the root of the directory being scanned:

```json
{
  "disabledRules": ["gradient-text", "bounce-easing"]
}
```

Rules in `disabledRules` are skipped entirely — useful when a project intentionally deviates from a specific rule.

### CI integration

```yaml
# GitHub Actions example
- name: Design anti-pattern check
  run: npx visor check design ./src --json
```

## Documentation

Full docs at [visor.loworbit.studio](https://visor.loworbit.studio).
