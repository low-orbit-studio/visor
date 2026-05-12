# Changelog

## 0.10.0

### Minor Changes

- 3ca0731: VI-356 feat: derive Typography Font Families specimen weight rows from the active theme's manifest instead of a hardcoded `[400, 500, 600, 700]` / `[400, 500, 700]` grid.

  The docs-site `PRIVATE_THEMES` manifest now carries each theme's actual loaded weights per typography slot (extracted at build time from `.visor.yaml` by a new `extract-typography-slots.mjs` helper). `DesignSystemSpecimen` accepts an optional `themeManifest` prop and a `fontFamilies` prop derived from it; an internal `useActiveThemeSlug` hook listens for `visor-theme-change` body-class transitions and re-renders rows when the active theme switches. Themes without `typography` declared in their manifest entry fall back to the legacy hardcoded defaults — no breaking changes for existing consumers.

  Affects: any consumer of `blocks/design-system-specimen` that wants per-theme weight rows. Stock themes (e.g., `neutral`) keep the legacy defaults. Themes that load `[300, 400, 500, 700, 800]` (e.g., Blacklight) now render five rows per family; themes that load only two weights render two.

- 167860f: VI-358 fix: route Satoshi (and Monaspace Neon for Space) through the visor-fonts CDN for stock themes that were shipping `--font-*` overrides without matching `@font-face` blocks. Adds a build-time `validateFontCoverage` validator that catches future drift.

  Stock themes Blackout, Borderless, and Space declared `--font-*: Satoshi` (and Space also `--font-mono: Monaspace Neon`) with no matching `@font-face` because neither font is in the Google Fonts catalog, so the resolver fell through to `source: local` which emits a commented-out placeholder instead of a real `@font-face`. On any machine without Satoshi installed locally — i.e. every visitor to visor.design who isn't the operator — the browser silently fell back to system-ui.

  The `.visor.yaml` files now carry `source: visor-fonts` + `org: low-orbit-studio` annotations on the affected slots, so the engine emits real `@font-face` URLs pointing at `fonts.visor.design`. The schema and resolver were extended so `typography.mono` accepts the same `weight | weights | source | org` fields as the other slots; previously only `family` was allowed, which forced custom mono fonts into the same broken fall-through path.

  New `validateFontCoverage(css)` in `@loworbitstudio/visor-theme-engine` scans emitted CSS and errors when any `--font-*` declaration names a custom family with no matching `@font-face` (or Google Fonts `@import`). Wired into `visor theme sync` and `generate-private-themes.mjs` so any new theme that drifts back into the broken state fails the build immediately.

  Operator follow-up (out of this changeset):

  - Upload Satoshi (Regular/Bold) and Monaspace Neon (Regular) to R2 under `low-orbit-studio/{satoshi,monaspace-neon}/` via `npm run fonts:add`. Until then the new `@font-face` URLs return 404 and browsers still fall back — but the structural fix is correct and the validator passes.
  - Satoshi license check for public CDN distribution.

### Patch Changes

- cb3c72e: VI-359 feat: add `fontshare` source type for typography slots, and migrate Blackout, Borderless, and Space (heading + body) to it. Resolves the license blocker on the VI-358 follow-up: Indian Type Foundry's Fontshare EULA (the license shipped with Satoshi) forbids public CDN re-hosting in §02, so the visor-fonts CDN path was not a viable distribution channel for Satoshi. Fontshare's own hosted API is the licensor-controlled channel and is explicitly permitted by the EULA.

  The new `source: fontshare` (no `org:` required) emits `@import url("https://api.fontshare.com/v2/css?f[]=<slug>@<weights>&display=swap")` at the top of the theme's CSS — Fontshare's response ships the real `@font-face` blocks, so the engine doesn't need to fabricate them. The `validateFontCoverage` validator was extended to recognize Fontshare `@import` URLs (alongside Google Fonts `@import`) as legitimate font-face coverage, mapping the lowercase-hyphenated slug back to the title-cased CSS family.

  Behavior is additive: themes still on `source: visor-fonts` (e.g. Space's Monaspace Neon) are unchanged; the new source type is opt-in per slot. Per-theme `@font-face` aliasing (VI-354) is not applied to fontshare sources because all themes sharing a family share Fontshare's hosted `@font-face` blocks — the browser dedupes by URL and the weights union naturally across themes.

  Wisdom captured at `docs/wisdom/W026-satoshi-license-forbids-public-cdn.md` for the license reading and the generalizable rule: read the EULA before adding a font to a CDN namespace under `npm run fonts:add`.

  Operator follow-up:

  - Companion PR in `visor-themes-private` migrates Strata's Satoshi slots from `source: visor-fonts` to `source: fontshare`.
  - Monaspace Neon (OFL-licensed) remains a candidate for the visor-fonts CDN; the upload (and any cross-machine smoke retest) is independent of this change.

- Updated dependencies [74627cc]
- Updated dependencies [821c491]
- Updated dependencies [167860f]
- Updated dependencies [cb3c72e]
  - @loworbitstudio/visor-theme-engine@0.6.0

## 0.9.1

### Patch Changes

- Updated dependencies [e61b904]
  - @loworbitstudio/visor-theme-engine@0.5.0

## 0.9.0

### Minor Changes

- 177728b: VI-349 — Round-1 retrofit fixes for marketing-grade consumers.

  **Marquee** — Default `.item`/`.separator` line-height bumped from tight to normal so descenders (`g`, `y`, `p`, `q`, `j`) clear the band's overflow boundary at marketing-display sizes. Default `durationSec` bumped from 25 to 40 for a calmer scroll at display scale.

  **StationSpectrum** — Dropped the `.station:last-child` flex-end override that made dot 05 read as misaligned with 01–04. All dots now align flex-start within equal-width columns; the rail's right offset is computed from `--station-count` so the line terminates exactly at the last dot center for any `N` (verified at 3, 5, 7).

  **BentoTile (BREAKING)** — New `layout` prop with default `"stacked"`: media renders on top with its own aspect ratio, body is a sibling block below. `layout="overlay"` retains the previous body-over-media behavior. Consumers depending on the old default must pass `layout="overlay"` explicitly. Exposes `data-layout` for consumer styling hooks.

  **NameRoster** — Exposes 14 `--roster-*` CSS custom properties on `.roster` covering item typography (size, weight, letter-spacing, line-height), colors (default, hover, highlighted), dot (size, color, hover, highlighted, glow), and hover transform. Defaults resolve to the current visual output. The hardcoded `filter: brightness()` hover effect is replaced by `--roster-dot-color-hover`; consumers wanting a brightness shift use `color-mix()` against the token.

### Patch Changes

- 0a10689: Add CI changeset gate: PRs that touch shipping-package source now require a `.changeset/*.md` entry or the merge is blocked. Includes `[skip-changeset]` title token and `skip-changeset` label opt-out for legitimate exemptions. Updates CONTRIBUTING.md with changeset workflow docs.
- Updated dependencies [c621d04]
- Updated dependencies [8f444af]
- Updated dependencies [1b5c01a]
  - @loworbitstudio/visor-theme-engine@0.4.2

## 0.8.0

### Minor Changes

- Add `visor check design <path>` — deterministic static analysis for Borealis design anti-patterns. No LLM required. Scans `.tsx`, `.jsx`, `.ts`, `.js`, `.css`, and `.module.css` files for 16 rules across two severity tiers.

  **Error rules (Borealis non-negotiables):**

  - `tier-1-token-direct-usage` — flags direct use of `--primitive-*` / `--raw-*` / `--palette-*` tokens in component code
  - `hardcoded-hex` — catches raw hex color literals that bypass the token system
  - `hardcoded-px` — catches hardcoded pixel values in spacing/sizing properties
  - `missing-dark-mode-block` — CSS files must include a dark mode block (`@media (prefers-color-scheme: dark)` or `[data-theme="dark"]`)
  - `missing-hover-transition` — CSS with `:hover` must include a `transition` property
  - `div-as-input` — catches `<div onClick>` without `role=` (div-as-button anti-pattern)
  - `setstate-hover` — catches `useState` used to track hover state instead of CSS `:hover`
  - `missing-aria-pressed` — toggle buttons with active/selected state must have `aria-pressed`

  **Warn rules (general anti-patterns):**

  - `banned-fonts` — Inter, Roboto, Arial, system-ui are not Borealis fonts
  - `purple-gradient-on-white` — generic SaaS gradient cliché
  - `pure-black-untinted` — `#000` / `black` without tinting
  - `bounce-easing` — overshoot cubic-bezier / bounce keywords in transitions
  - `sub-44px-touch-target` — interactive elements below 44px minimum
  - `line-length-over-75ch` — text containers exceeding 75ch max-width
  - `gradient-text` — `background-clip: text` gradient text patterns
  - `excessive-card-nesting` — Card/Panel components nested 3+ levels deep

  **Output modes:** `--format json` (default for programmatic consumers) and `--format human` (colored, file-grouped terminal report). `--errors-only` filters to error severity. `--no-fail` suppresses exit code 1 for advisory-only use. `--json` is shorthand for `--format json`.

  **Per-project toggles:** add a `.visorrc.json` with `{ "disabledRules": ["gradient-text"] }` to opt specific rules out project-wide.

  **CI usage:** `npx visor check design ./src --json` exits 0 when clean, 1 on any error-severity finding.

## 0.7.0

### Minor Changes

- c4434bc: Add Flutter documentation section to the docs site (getting started, theming, tokens, and per-widget pages for button, stat-card, empty-state, section-header), platform `<Tabs>` on shared component pages with React + Flutter snippets, and a new `visor theme verify --target flutter <flutter-project>` CLI subcommand that runs `dart analyze` on generated Dart output. The verify command exits 0 on success, 1 on Dart analyzer errors, and supports `--json` for programmatic use. M4.B.1 of Phase 10a; unblocks per-widget Flutter MDX docs.
- c4434bc: Add `--surface-elev-0` through `--surface-elev-4` to the adaptive token layer — five distinct depth levels with ordinal naming, light + dark mode mappings via existing neutral-shade primitives. Additive; coexists with role-named surface tokens (`--surface-card`, `--surface-subtle`, etc.). The theme-engine `SEMANTIC_SURFACE_MAP` mirrors the entries so theme authors can override elevation values via YAML.
- c4434bc: Add `borderless` theme — a canonical V7-style dark-anchored theme that overrides `border-default`, `border-muted`, and `border-strong` to `transparent` in both light and dark modes via the existing YAML override system. Shadows are suppressed to `none` and the radius scale is tightened to 4/6/8/12 to match the V7 surface stack. Status borders (`border-focus`, `border-error`, `border-disabled`, `border-success`, `border-warning`, `border-info`) remain untouched. No source-token changes.
- c4434bc: Add `2xs` (11px) primitive font size and opt-in typography utility classes. `primitiveFontSizes` now generates `--font-size-2xs: 0.6875rem` in all CSS outputs. A new `generateUtilitiesCSS()` step writes `dist/utilities.css` with `.eyebrow` and `.label-tiny` utility classes, exposed via `@loworbitstudio/visor-core/utilities` in the package exports map. Consumers opt in with `import "@loworbitstudio/visor-core/utilities"`.
- c4434bc: Add native support for interspersed group-header rows in `DataTable`. Callers pass a flat mixed array via the new optional `rows` prop — `{ kind: "group" }` items interspersed with data items — and `DataTable` renders group rows full-width (`colSpan={colCount}`) in the table body, skipping them in sort, selection, and pagination logic. New `DataTableGroupRow`, `DataTableDataRow<TData>`, and `DataTableRow<TData>` discriminated-union types; new optional `groupRowRenderer` slot for custom rendering. Default group-head styling uses Visor semantic tokens with sticky positioning. Purely additive — existing `data`-only consumers reach the unchanged code path.
- c4434bc: Add `workspace-switcher` block — a sidebar-header button + Radix `DropdownMenu` listing available workspaces, designed as a drop-in for `AdminShell`'s `logo` slot in multi-tenant admin apps. Trigger renders the current workspace (avatar + name + plan + caret) in `full` mode or avatar + caret only in `compact` mode; current workspace is checkmarked in the dropdown, `onSelect(id)` fires on selection, and `imageUrl` falls back to `initials` via `AvatarImage`. Theme-portable (semantic tokens only) with full keyboard navigation. Install via `npx visor add workspace-switcher`.
- c4434bc: Add `valueAs="default" | "hero" | "compact"` and `valueClassName` props to `StatCard` for configurable value typography. Hero renders display-font, 3.5rem fallback, weight-400, tabular-nums, line-height-1; compact renders at 2xl. `data-value-as` is set on the value element when the prop is provided. New `--stat-card-value-font` and `--stat-card-value-size` CSS custom properties on `.base` provide override hooks. `AdminDashboardStat` is extended with a `valueAs` passthrough. Existing consumers are unaffected (no prop → no `data-value-as`, no behavioral change).
- c4434bc: Add `sectionGroups` prop to `admin-settings-page` — render settings sections under categorical eyebrow labels (e.g., Account, Workspace, Venue) instead of a flat list. Each group supports a meta badge and a muted flag for de-emphasized sections. Existing `sections` prop usage is unchanged. Install via `npx visor add admin-settings-page`.
- c4434bc: Forward `contentClassName` and `contentProps` from `CommandDialog` to the wrapped `DialogContent`, so consumers can customize the dialog content element without forking the composition. `contentProps` omits `className` and `children` to prevent conflicts with the existing API.
- c4434bc: Add `--tabs-indicator-color` CSS custom property to the `Tabs` line variant indicator, with fallback to `var(--text-primary)`. Eliminates the per-instance `:global` `box-shadow` workaround consumers were using for branded indicator colors.
- c4434bc: Add `hideHeader` and `customHeader` props to `admin-detail-drawer` so consumers can replace the default `SheetHeader` without CSS hacks. `hideHeader` skips the default header render but mounts a visually-hidden `SheetTitle` for Radix a11y. `customHeader` slots arbitrary content in place of the default header (the block renders a visually-hidden `SheetTitle` wrapping `title`). `customHeader` wins over `hideHeader` when both are set; default behavior is preserved when neither prop is set.
- c4434bc: Add `passwordManagers="ignore" | "allow"` prop to `Input` and `Textarea`. Default is `"ignore"` — emits `data-1p-ignore`, `data-bwignore`, `data-lpignore`, and `data-form-type="other"` so 1Password / Bitwarden / LastPass don't render autofill icons on non-auth Visor forms. Login, signup, and credential fields opt back in with `passwordManagers="allow"`. Browsers ignore `autocomplete="off"` on individual inputs, so the four per-manager `data-*` attributes are the only reliable suppression mechanism.
- c4434bc: Add `<Form passwordManagers="ignore" | "allow">` context that propagates to all descendant `Input` and `Textarea` fields, so authors can flip the default once at the form level instead of repeating the prop on every credential field. Field-level `passwordManagers` still wins over the context value (explicit beats inherited), so honeypots and single-field overrides keep working. The context lives in `lib/password-managers-context.tsx` (registry:lib) and `Input`/`Textarea` import the resolver from `lib/`, so they keep installing without `Form` as a dependency. Resolver precedence: explicit field prop → context → `"ignore"` default.

### Patch Changes

- c4434bc: Fix `FieldDescription` typography hierarchy — change `font-size` from `--font-size-sm` (14px) to `--font-size-xs` (12px) so description text renders visibly smaller than label text. Adds regression tests locking the CSS classes applied to `FieldLabel` (sm) and `FieldDescription` (xs).
- c4434bc: Fix `DataTable` group-head row background in dark mode. VI-284 introduced `background: var(--surface-alt, #f3f4f6)` but `--surface-alt` is not defined anywhere in the Visor design system, so the fallback `#f3f4f6` was always used — rendering as a bright light-gray stripe in dark themes. Swap `.groupLabel` (and the demo preview) to `--surface-subtle`, which is defined across all shipped themes (Neutral, Blackout, Modern Minimal, Space) with appropriate light/dark values.
- 2617c9f: Fix `SourceInspectorToggle` standalone auto-mount so it actually applies the overlay. Previously the lazy mount only included `SourceInspectorProvider` (context + state) but not `SourceInspectorRunner` (DOM stamping, MutationObserver, body class), so clicking the toggle cycled the icon dot but never produced a visible overlay. The lazy mount now uses `<SourceInspector>`, which already detects an existing context and only mounts a provider/runner when needed — so nested usage is unchanged and standalone usage works as the JSDoc promised.
- c4434bc: Fix `SourceInspector` classifier on React 19 / Next 16. Previously the classifier read `fiber._debugSource.fileName`, a property React 19 removed — so every rendered element fell through to the `"dom"` label and no overlay tints applied even when the runner was mounted. The classifier now walks to `fiber._debugOwner` and parses the JSX call-site URL out of `_debugStack` (an `Error` whose stack trace points to user source). Skips React-internal frames (`react-stack-bottom-frame`, `react-server-dom`, `react-jsx-dev-runtime`, `jsxDEV`/`jsxs?`) so the first user frame surfaces. Also normalizes `_debugStack` shape — handles `string`, `Error`, and plain objects with a `stack` property.
- c4434bc: Fix `SourceInspector` misclassifying Visor renders as `"third-party"` on Turbopack (Next 16 default). Turbopack's bundled chunk URLs hash away the package path — Visor components come from `node_modules_<hash>._.js` instead of `node_modules/@loworbitstudio/visor/...`, so the default `visor` predicate's `path.includes("@loworbitstudio/visor")` never matched. The classifier now consults `_debugOwner.type.name`/`displayName` against a precomputed Set of known Visor component names (generated from the registry at build time, shipped as `visor-component-names.generated.ts`) before falling back to URL-based classification. Names are bundler-independent; URL matching still works for webpack and other bundlers that preserve package paths in chunk URLs. No public API changes — `Classifiers` shape is unchanged and custom classifiers continue to take precedence.
- c4434bc: Ship `@loworbitstudio/visor-core` CSS pre-wrapped in `@layer` blocks so generated themes (e.g., from `visor theme apply --adapter nextjs`) win the cascade against visor-core's defaults without consumer intervention. Per the CSS Cascade Layers spec, unlayered styles always beat layered styles — visor-core previously emitted unlayered `:root { ... }` rules, which silently won over generated themes wrapped in named layers. Every shipped `dist/*.css` now declares the layer order `@layer visor-primitives, visor-semantic, visor-adaptive, visor-bridge;` and wraps content in the matching tier; consumer overrides written outside any layer continue to win, as documented.
- c4434bc: Improve `SourceInspector` classifier coverage on Next 16 / Turbopack. `extractFirstUserUrl` now skips unnamed `at https://…` frames whose URL points at a known runtime chunk (visor `jsxDEV` shim, `react-dom`, `react-server-dom`, `/_next/dist/`, `/node_modules`), so user-source frames surface even when wrapped in anonymous runtime calls. A new `inheritStamps` pass walks the DOM ancestry of every `data-source="dom"` element and inherits the nearest stamped `visor` or `local` ancestor, so server-component leaves and elements without `_debugOwner` classify under their owning shell instead of falling through to `dom`.

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
