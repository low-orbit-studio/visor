# Changelog

## 1.21.0

### Minor Changes

- b93f106: VI-621: Sync AN-237 dialog-substrate polish into the canonical VI-620 blocks so the app-owned copies don't drift.

  - `dialog-form` — the `.panel` hairline is now a token seam (`--dialog-form-panel-border`, defaulting to the hairline) that a theme can null out, plus a `border="default | none"` prop on `DialogFormContent` for a per-instance borderless panel. `DialogFormContent` also gains a `width="sm | md | lg"` axis (~24rem / 30rem default / ~40rem) backed by `--dialog-form-width-sm|md|lg`, replacing the hardcoded `max-width: 30rem`.
  - `dialog-field` — `DialogFieldControl` gains a `size="sm | md"` axis that drives the well padding only (label typography unchanged), mirroring the input atom's `--input-padding-sm|md` seams. Default stays `md` (backward-compatible with the fixed-medium VI-620 well); the compact Animal modal-form well opts into `sm` per field.

  All defaults preserve the current VI-620 rendering, so existing call sites are unchanged.

## 1.20.0

### Minor Changes

- 380155e: VI-620: Animal dialog substrate. Adds two mid-tier blocks — `dialog-form` (compact admin modal shell composing the Dialog atom: backdrop + centered panel + header + dlg-btn footer, with a title size axis) and `dialog-field` (`dlg-field`: flex-column field — a sentence-case label over a borderless, medium-size control on a theme-derived surface that stays legible against the card in every theme, with leading-icon / trailing-caret slots) — plus a `dlg` compact Button size (dialog-footer button whose primary/ghost/danger faces reuse the variant axis) and a `mono` StatusBadge prop (monospace-token label). All token-driven; the active theme swaps every surface, hairline, radius, and scale.

## 1.19.0

### Minor Changes

- 06446b9: VI-616: ship a `visor-base` layer — token-to-page binding + element reset

  visor-core now owns the element-level baseline instead of leaving each consumer and each component to rediscover it.

  **New `visor-base` cascade layer.** Added as the FIRST (lowest-priority) entry in both mirrored `LAYER_ORDER` declarations, so a consumer's own unlayered `body {}` and every component `.module.css` beat it unconditionally, while author-origin styles still outrank the UA stylesheet.

  **New opt-in export `@loworbitstudio/visor-core/reset`** (`dist/reset.css`) — the _propagation_ half. `input, textarea, select, button, optgroup { font: inherit }`, global `box-sizing: border-box`, zeroed UA margin on form controls, button chrome normalisation, `img/svg/video` block sizing, and `appearance: none` for `input[type=search|number]`. It is a separate export: `.`, `./css`, `./tokens` and `./primitives` emit no element rules, so consumers relying on Tailwind preflight are byte-unchanged.

  **NextJS adapter now emits the _origination_ half** — a `@layer visor-base` block binding `font-family: var(--font-body)`, `color`, `background` and `font-size` to `body` (mirroring what the docs adapter has always done), plus the `@import "@loworbitstudio/visor-core/reset";` line for new scaffolds. Previously `--font-sans` was defined and bound to nothing, so `font: inherit` on a control faithfully propagated whatever the consumer hand-wrote. Opt out with `includeBaseLayer: false`.

  **New `missing-visor-base-layer` warning in `visor check design`** — fires when an app renders Visor form controls but imports neither the reset nor Tailwind preflight, and also when the _installed_ visor-core predates the `/reset` export (a file-existence test for `dist/reset.css`, not a version comparison). Honours `.visorrc.json` `disabledRules`.

  **Component sweep.** Removed 24 redundant `font-family: inherit` / `font: inherit` declarations across components and blocks, and reconciled the drifted variants: hardcoded `system-ui` fallbacks behind body-font tokens now fall back to `inherit`, and color-picker's hardcoded mono stack now routes through `var(--font-mono)`. The ~20 button-rendering components that were never patched need no patch. A new `element-defaults-owned-by-base` validator rule keeps it that way, deriving its native-control target set from the CLI's native map rather than a hardcoded path list.

### Patch Changes

- Updated dependencies [06446b9]
  - @loworbitstudio/visor-theme-engine@0.18.0

## 1.18.1

### Patch Changes

- 95d1a1d: BO-67: add a `design_ref` field to component `.visor.yaml` and a default-on, Visor-scoped render-vs-design self-check in the Component Build Workflow.

  `design_ref` points at the operator-approved design a component must match. Its presence is the intrinsic trigger (W-111) for a mandatory build-time step: render the built component via `visor render` across ≥2 themes × both modes, diff each capture against the design, enumerate radius/spacing/color/alignment deltas, and fix before the PR. A new `visor-yaml-design-ref` validate rule confirms a present `design_ref` resolves. The `doc-nav` component carries a `design_ref`; `docs/audits/BO-67/` proves the check retroactively surfaces the gray-pill / radius / type / alignment deltas that had to be hand-caught across VI-611.

- 59f4f09: VI-610: add the `FidelityMirror` component — the design-left / built-right comparison surface.

  `FidelityMirror` is the Fidelity Mirror DISPLAY: the side-by-side viewer that renders inside `DocFrame`'s content, distinct from the screenshot-diff GATE (PL-2139), which VERIFIES rather than DISPLAYS. It renders the pure-HTML design (left) against the Visor-TSX render (right) in recessed capture wells, with a verdict diff indicator, numbered delta callouts, a classed delta legend (radius | color | spacing | type | align), and a drag-to-reveal `overlay` mode alongside the default `split`. Real compare semantics are HTML-design-left / Visor-TSX-right — the scope-dot hues carry source identity (`--info` design, `--accent` built), never a recolored side. `platform` (`web` | `native` | `flutter` | `external`) drives the built-side renderer and header chip: web live-route iframe, native/flutter device-bezel screenshot, or external artifact. The compare goes full-bleed on widescreen (`bleed`, default on) so each pane is ~50vw with the center gutter equal to the outer padding; under 768px the panes stack design-over-built (never a sideways scroll strip). The card/cluster radius and the recessed well fill are component-OWNED fixed tokens (`--fm-radius`, `--fm-well`), not the theme `--radius-*` scale or a bare `--surface-*` token — the drift class this component exists to surface. Carries a `design_ref` (`docs/audits/vi-610/index.html`) and ships via the registry as `npx visor add fidelity-mirror`.

- c42d0a4: VI-613: DocFrame text-fallback wordmark now renders in the theme's display face.

  When a theme ships no `--brand-logo` (or the brand asset fails to load) and DocFrame falls back to the `manifest.brand` text wordmark, the wordmark now uses `var(--font-display, var(--font-family-heading, inherit))` instead of the ambient `--font-sans`. A text wordmark now carries the theme's brand character — e.g. Animal's condensed "Sequel 100 Black 95" instead of the body "Ratio" — matching the display-font convention already used by `stat-card`, `page-header`, and `section-intro`, and degrading gracefully (heading face → ambient sans) on themes that ship no `--font-display`. Brand-logo resolution from the private visor themes (the mode-aware `--brand-logo` SVG path) is unchanged and verified end-to-end in `docs/audits/VI-613/`.

## 1.18.0

### Minor Changes

- e366c24: Add the `visor render` command — a serverless, single-component render-fidelity harness (BO-66). It renders one real `components/ui/<name>` to a PNG using the **real emitted tokens** (`packages/tokens/dist/tokens.css`), the **real per-theme CSS** (`packages/docs/app/<slug>-theme.css`, composed in correct `@layer` + per-mode ancestor scoping so a themed surface resolves its _mapped_ value, not the raw primitive — e.g. Space dark `--surface-card` `#0e0e18`, not the base `#111827`), and the **real component** esbuild-bundled with a representative fixture and its default variant classes. A Playwright screenshot captures the result (`--state hover|focus|active` drives one interactive state), and a computed-style probe asserts the themed surface differs from the base primitive and that dark ≠ light — catching the exact drift class (medium-gray pill, ballooned group radius) that previously had to be caught by hand. `playwright` and `esbuild` are lazy/optional dependencies: they are not bundled into the CLI (no install-size hit for consumers who never render) and the command prints a clear install prompt if either is absent. Run: `visor render doc-nav --theme space --mode dark`.
- 4999f28: Add the `doc-nav` component — a manifest-driven, grouped/collapsible, multi-product-aware documentation navigation that replaces the vanilla-JS doc nav (nav.js) (VI-608). `DocNav` turns a pre-filtered manifest slice (`DocEntry[]`) into peer, collapsible groups: a pinned **Shared** set that stays open, **accordion** product groups (opening one collapses the sibling via the parent-controlled `activeProduct` + `onProductToggle`), and an **Appendix** bucket for slot-less, group-less docs (`order >= 10`, no `group`/`scope`) — a lone ad-hoc doc renders inline, two or more collapse. Empty groups auto-hide; the active pill and its group's auto-expand resolve from `currentPath` (with `aria-current="page"`), matching both clean routes and static `.html` hrefs; external entries badge and open in a new tab. The group row wraps (`flex-wrap`) and is never an `overflow-x` scroll strip — the run-off-the-edge defect it exists to kill. Omitting `activeProduct` degrades to one grouped row with no accordion (the single-product drop-in path). Composes from existing Visor primitives and is themed entirely by Visor tokens, so it adopts the active project theme without modification. Install with `npx visor add doc-nav`.
- 5e46f0a: Add the `doc-frame` component — the themed doc-page shell that wraps `doc-nav` and replaces the vanilla-JS doc shell (nav.js + docs.css) on the React/route track (VI-609). `DocFrame` owns the page: theme tokens, a **sticky header** with a flexible **brand/logo slot**, the **DocNav slot**, and a **content wrapper** (the doc as children). It reads a single `manifest` (`docs[]`, optional `products[]`, optional `brand` text, optional `dispositions`), resolves the product roster (explicit or inferred from doc `scope` values), seeds the open accordion product from `currentPath` (or the `activeProduct` prop), and passes the docs slice + active-state down to `DocNav`. The **sticky header** carries the brand slot, an `OVERVIEW` **home pill** (`home`) with a leading compass glyph, and a **right-aligned meta slot** (`meta`, e.g. `ARTIST · BUILD-READY`). The **logo slot** resolves in order — an explicit `logo` node (an `<img>` of an SVG, an inline `<svg>`, or any component) → the active theme's mode-aware `brand.logo` SVG (via the `--brand-logo` custom property, **hardened** so a failed logo load keeps the visible wordmark instead of an empty slot) → the manifest `brand` text (a leading **glyph chip** in the theme's `--primary` color + the name). `DocFrame` drives `DocNav`'s group color-coding via its `--doc-nav-group-accent` hook — the **Pro** group reads amber (`--warning`) by default (Shared → `--info`, products → `--accent`, Appendix muted), overridable per group with `groupAccents` — and nulls the pinned Shared frame on borderless themes (Animal / ENTR) via the `--doc-nav-pin-border` hook (`borderless`, auto-detected from `theme`). The sticky header stays on scroll (no ancestor clips it), the shell is a centered max-width column, and everything is themed by Visor tokens, so it re-themes with the project without modification. `currentPath` defaults to `window.location.pathname` in the browser (framework-agnostic — no hard next/navigation dependency); Next consumers pass `usePathname()` for SSR-correct active-state. Absent a product roster it degrades to a single grouped row (no accordion). Install with `npx visor add doc-frame` (pulls in `doc-nav`).

### Patch Changes

- 12e22e3: Polish `doc-nav` to match the approved PL-2185 doc-shell design (VI-611). Pills now render **mono · UPPERCASE · letter-spaced** with a mono order number; the active pill, caret, hub dot, and pinned frame route through a new `--doc-nav-accent` indirection token (defaulting to the theme's vivid `--accent` rather than `--primary`, so the active state pops on muted-primary themes like Strata instead of reading dull). Scope dots are color-coded per group role (Shared → `--info`, product → `--accent`, Appendix → `--text-tertiary`) with a soft glow; group corners soften to `--radius-xl` (12px); group labels go mono with wider tracking; Shared-group pills carry the group tint at rest; the pinned frame routes through overridable `--doc-nav-pin-border` / `--doc-nav-pin-bg` tokens so borderless themes can null it; carets use Phosphor `weight="fill"`; the count badge shrinks to a tiny mono chip; and the hub dot now marks the lead entry of the pinned Shared set (not only `order === 0`). Pure surface finish — no API change beyond the additive, opt-in override tokens (`--doc-nav-accent`, `--doc-nav-group-accent`, `--doc-nav-pin-border`, `--doc-nav-pin-bg`).
- 31d9718: DocNav: fix light-mode readability (VI-612). Resting-pill recess dialed to 20% toward neutral-950 so light-mode pills read as a clean recess instead of a heavy gray, and the active pill is now contrast-safe — a legible `--text-primary` label on a distinct `--surface-selected` fill with an accent ring blended into a hairline, rather than raw `--accent` (which rendered white-on-white on white/near-white-accent themes like Blacklight in light mode). All pill states now clear WCAG AA (≥4.5:1) across themes and both modes.
- aff50e5: DocFrame: stop hardcoding private theme slugs (VI-614). The `borderless` treatment no longer auto-detects from a baked-in `["animal-theme", "entr-theme"]` set — which leaked private theme identity into the public bundle (caught by the private-theme leak guard) and violated theme-agnosticism. Borderless now comes only from the explicit `borderless` prop or a theme nulling `--doc-nav-pin-border` in its own CSS.

## 1.17.0

### Minor Changes

- 1caa899: Add a `month-calendar` block — a theme-portable month event-grid (scheduler) (VI-604). Renders a 6×7 day-cell grid under a localized weekday header with prev/next month navigation and a view-mode segmented control (Month / Week / Day). Each day cell stacks event chips carrying a status-dot slot (`success` / `warning` / `danger` / `info`) and an optional series tint (`1`–`5`) keyed to the theme's `--chart-1…5` ramp for color-coding a recurring series or resource lane. Days outside the displayed month are dimmed, with optional `today` and selected-day highlighting. Fully controlled and SSR-safe (never reads the system clock), and fully token-driven — every color, spacing, stroke, radius, shadow, opacity, and motion value binds to a Visor token so the grid adopts the active theme without modification. Closes the AN-124 gap where no blessed month event-grid existed (only date-picker-style `calendar` / `date-picker` / `date-range-picker` selectors). Install with `npx visor add --block month-calendar`.
- 3df9963: VI-605: split block registry deps into hard vs. suggested slot-fill deps.

  Registry items gain an optional `suggestedDependencies` field for slot-fill
  components a block can compose with but does not import to render itself. The
  `admin-shell` block now declares only `utils` as a hard `registryDependency`,
  with `breadcrumb`, `dropdown-menu`, and `sidebar` moved to `suggestedDependencies`.

  `visor add <block> --block` now installs only hard deps by default, so a
  slot-only compose no longer pulls unused component files or their npm trees
  (e.g. Radix `@radix-ui/react-dropdown-menu`). A new `--with-suggested` flag opts
  into installing the suggested slot-fill components. When suggested deps are
  skipped, they are surfaced in the CLI output (and under a `suggested` key in
  `--json` output). The block's `.visor.yaml` `components_used` list is unchanged
  and continues to document the slots for humans and agents.

- 2748852: Add the `admin-detail` block — a full-page, read-oriented detail RECORD for the admin-shell main column (VI-606). It is the natural sibling to `admin-detail-drawer` (a right-side drawer) and `admin-list-page`: an identity header (media + title + composed `StatusBadge` + actions), N key-value sections built on the blessed `KeyValueList`, an optional sensitive/reveal panel gated behind a `Switch` (for tax IDs, banking, W-9 data), and optional sub-list slots for ledgers or history — all separated by `Separator` hairlines and fully token-driven. Resolves the Animal §04 Artist Detail gap where `npx visor check has admin-detail` returned NOT FOUND. Install with `npx visor add --block admin-detail`; the registry pulls in `key-value-list`, `status-badge`, `switch`, and `separator`.

### Patch Changes

- a966908: Re-group `status-badge`'s `scheduled` status from the neutral (grey) color group to the info (blue) group (VI-607). `scheduled` is semantically an upcoming/committed state, not a muted draft, so it now renders with the info tone — `info` in subtle tone and `filled-info` in filled tone — deliberately distinct from `draft`, which stays neutral grey. This makes a faithful compose of designs that paint a scheduled item blue (e.g. Animal §04 Artist Detail's invoice ledger) render correctly without hacking an info-group status key. Fully token-driven — the info tone reuses the existing `--surface-info-default` / info Badge variants; no new tokens.

## 1.16.1

### Patch Changes

- d1e5120: Clean the admin-block registry substrate under the React 19 compiler `react-hooks/*` lint rules so consumers on a stock `eslint-config-next` config no longer get a red lint gate from vendored copy-and-own source (VI-602). `sidebar` now derives `isMobile` from a `matchMedia` subscription via `useSyncExternalStore` instead of a `setState`-in-effect (`react-hooks/set-state-in-effect` error, SSR-safe, behavior-preserving). `data-table`'s unavoidable TanStack `useReactTable()` interaction (`react-hooks/incompatible-library`) is now suppressed with a narrow, documented inline disable at the single call site rather than a dir-wide exemption. `bulk-action-bar`'s mount-only auto-focus disable directive was repositioned so it still suppresses `react-hooks/exhaustive-deps` under the newer rule (which reports on the deps-array line). Consuming apps can drop the `components/ui/**` + `blocks/**` ESLint exemption.

## 1.16.0

### Minor Changes

- 1597887: Extend `blessed-manifest.json` with an optional `theme_apply_target` field and teach `visor spawn` (and `visor theme apply --target-path`) to dispatch on it (VI-601). Blessed reference builds can now declare _where_ the nextjs-adapter CSS is written when a theme is applied instead of Visor assuming a single shape. Two initial kinds: `globals-css` (default; optional `path` override) writes to a single file, and `themes-css-dir` (required `path`) writes to `<path>/<theme-id>.css` — matching organization-management's per-theme swap-point where `layout.tsx` inlines one CSS file per registered theme. Manifests without the field behave exactly as before (`app/globals.css`). Unknown kinds and malformed inputs fail the Zod validation with a docs pointer. Standalone `visor theme apply` gains a `--target-path <build-root>` option (nextjs adapter only) that reads the build's manifest and dispatches through the same primitive; `--target-path` ignores `--output`. See `docs/blessed-builds.md` for the schema, kinds, and examples.

## 1.15.0

### Minor Changes

- 29a44a2: Add a play-aware entry point to `visor init` — `visor init --for {play-type}` (VI-596). On top of the existing Visor scaffold, it bootstraps the Playbook orchestration structure needed to start a play: writes `.lo/{play-subdir}/{name}/state.json` at `phase: 0` with metadata (D5), allocates a dev port via `/lo-ports` with a deterministic heuristic fallback + warning when the command is unavailable (D4), and prints the play's next-phase checklist from `~/.claude/skills/lo-play/{play-type}/entry-checklist.md` — falling back to a `/lo-play {play-type}` pointer when the file is missing (D6).

  `--for` is additive to `--template nextjs`, not a replacement (D1). The initial known-plays set is `pattern-build`, `new-web-app`, and `feature-addition`; the table is a static, Playbook-owned-by-convention list (emitted to `dist/init-plays.json`), and an unknown `--for` value errors with the known-plays list (D2). New optional flags: `--play-name`, `--theme`, `--from`. Re-running with the same `--play-name` is an idempotent no-op that reports the existing state (D7).

- 9fce0bd: Add `visor spawn` — one-command fork of a Playbook blessed reference build with atomic theme re-skinning. `visor spawn --from blessed:{shape}:{pattern} --theme {id} --output {path}` discovers a blessed build (a directory shipping a Zod-validated `blessed-manifest.json`), copies its tree into a new independent project (excluding `node_modules`, `.next`, `.git`, and other transient dirs), and applies the theme via the nextjs adapter. Theme application is atomic: on failure the output dir is deleted so you get a clean fork or nothing. Flags: `--install` (opt-in `npm install`), `--validate` (opt-in theme validation with rollback), `--blessed-dir` / `VISOR_BLESSED_DIR` (blessed-build root override), and `--list-blessed` (discover all builds). Replaces the manual `cp -R` + `npm install` + `visor theme apply` dance. See `docs/blessed-builds.md` for the manifest contract.

## 1.14.0

### Minor Changes

- 8b4d658: Add a deterministic `visor check theme-mode <path>` gate (BO-58). It reads a theme's declared `color-scheme` (`dark-only | light-only | adaptive`) and asserts the app-root background (`--surface-page`) luminance matches the declared mode — `dark-only` must render dark, `light-only` must render light, `adaptive` is skipped. Emits machine-readable JSON (`{ pass, mode, computed_bg, luminance, ... }`, surfacing the offending computed color on failure) for pipeline wiring, plus a human-readable mode. Reuses the theme engine's own resolution and its `getLuminance()` (now re-exported from the engine index) rather than reinventing luminance math or booting a browser. Catches the failure class where a dark-only brand ships a light app root — invisible to structural oracle/freeze gates.

### Patch Changes

- 0dd8490: `visor init --template nextjs` now applies the theme's declared `color-scheme` (BO-55/56) at the generated root layout. `generateNextjsLayout()` reads the starter `.visor.yaml` via a new `extractColorScheme()` reader (mirroring `theme-sync`'s `extractDefaultMode()` parsing style) and emits: `dark-only` → `<html className="dark" suppressHydrationWarning>` + inline `color-scheme: dark` + forced FOWT `generateFowtScript({ defaultTheme: "dark" })`; `light-only` → the inverse; `adaptive`/unset → the historical prefers-color-scheme layout, byte-for-byte unchanged. The starter yaml documents the `color-scheme` field so the mechanism is discoverable. This generalizes the animal-booking PR #11 fix into the scaffold so a dark-only brand can no longer scaffold a light-rendering root.
- 080e1ef: Fix stale `PageHeader` `leading`-prop docstring: it claimed the leading slot top-aligns (VI-539), but the CSS centers it — the VI-539 top-align was superseded by the VI-545 admin-editorial reconcile. Comment-only; no behavior or API change.
- f1c5152: Fix `HeroGlow` reduced-motion rest opacity: under `prefers-reduced-motion: reduce` the glow now rests at full opacity (`1`) instead of `0.75` (VI-581). The original `bl-hero-glow` (BL-326) set no base opacity and only killed the animation, so its computed rest was `1`; the registry port had "normalized" to the keyframe's `0.75` rest value, dimming reduced-motion users ~25%. A pixel-faithful adoption no longer needs a consumer override.
- Updated dependencies [7284be5]
- Updated dependencies [36fe7ee]
- Updated dependencies [23a060c]
- Updated dependencies [8b4d658]
  - @loworbitstudio/visor-theme-engine@0.17.1

## 1.13.0

### Minor Changes

- b9b0061: feat(avatar): AvatarStack ring-surface role hook + editorial overflow density

  Absorbs the two consumer-side AvatarStack treatments that PL-1638 placed in the org build's overlay into canonical Visor, finishing the VI-545 doctrine (component-level editorial treatment lives on the density axis; consumers never style a component's `data-slot` internals):

  - **`--avatar-stack-ring` role hook** — the disc ring now reads `var(--avatar-stack-ring, var(--surface-default, #ffffff))`. The default is byte-identical for existing consumers; a stack on a different surface tier sets one custom property on a wrapper (e.g. `--avatar-stack-ring: var(--surface-card)`) instead of reaching into `data-slot` internals.
  - **Editorial overflow type** — under `data-density="editorial"` the `+N` overflow disc font drops to 11px so the count never clips in the smaller editorial disc, removing the need for the consumer's `--font-size-sm` hack. Default density is unchanged.

## 1.12.0

### Minor Changes

- b6a20a2: Add CoherenceCheck component: `CheckGroup` (uppercase group header) + `CheckRow` (pass/warn/fail state icon circle, title, description with inline `code` token support, right-aligned ghost Fix action). Covers the Brand Workbench Prove stage coherence audit UI.
- 28a9ef3: Add `EditableBlock` component — canvas brand block with inline edit and AI affordance. Board tile with uppercase label header (+ done check), value body, hover-revealed edit icon, editing state (focus ring, inline input + save button, AI action slot). Covers Brand Workbench Canvas stage blocks.
- f433b5a: feat(skeleton): add content-shape-aware variants — SkeletonList, SkeletonTable, SkeletonDetail

  Extends the Skeleton primitive with three compound loading-placeholder components that mirror real content shapes, eliminating layout reflow on data resolve. Per the VI-584 Borealis state-pattern spec:

  - `SkeletonList` — list rows with avatar circle, two text lines, and a badge pill
  - `SkeletonTable` — N×M grid of cell-width placeholders for data tables
  - `SkeletonDetail` — large avatar block plus heading and body text lines for detail/profile panels

  All three carry `role="status"` and `aria-label` for screen-reader accessibility. Internal shape helpers (line heights, avatar sizes, width utilities, layout classes) added to the CSS module. Shimmer animation and token references unchanged.

- 3765372: feat: add OfflineBanner component (VI-585)

  Adds the `OfflineBanner` component and `useNetworkStatus` hook — the Borealis "global state" pattern for network connectivity loss.

  **Component.** Full-width sticky banner that pins below the navigation bar using `position: sticky` — does not overlay or block content beneath it. Renders three states: `offline` (dark surface, Wifi-off icon, Retry button), `reconnecting` (spinner replacing icon, Retry hidden), and `restored` (success-tint, check icon, auto-dismisses after 1.5s). Returns `null` when `networkState` is `"online"`.

  **Hook.** `useNetworkStatus()` listens to `window`'s `online`/`offline` events and drives the state machine. Accepts an optional `onRetry: () => Promise<boolean>` callback for a real connectivity probe (e.g., a `HEAD /api/health` request). Falls back to `navigator.onLine` when omitted.

  **Animation.** CSS keyframe entrance (`200ms ease-out`, slide from top) with `opacity: 1` as resting state — SSR-safe, no JS mount gate.

  **Accessibility.** `role="status"`, `aria-live="polite"`, dynamic `aria-label` per state, `aria-hidden` decorative icons, focus-visible Retry button with descriptive `aria-label`.

  **Tokens.** All values reference Visor semantic tokens: `--surface-overlay` (dark bg), `--text-inverse` (inverse text), `--accent` (icon + Retry), `--surface-success-subtle` / `--border-success` (restored state), `--motion-duration-normal`, `--motion-easing-enter`, `--stroke-width-thin`, `--spacing-*`, `--radius-*`, `--focus-ring-width`.

- e32dbe8: feat: add SessionTimeout component — non-dismissible full-screen overlay for auth session expiry (VI-586)
- deabbfd: feat: add FormError component — form-level submission error banner

  Adds the FormError pattern: a left-border destructive banner that appears inside a form card when submission is blocked by field validation errors. Ships with FormErrorTitle and FormErrorDescription sub-components.

  Pairs with the existing Field, FieldError, and Input[aria-invalid] primitives to deliver the complete form validation / error pattern (VI-587):

  - FormError / FormErrorTitle / FormErrorDescription — form-level submit-error banner
  - Field-level errors via FieldError + aria-invalid (existing)
  - Focus management: focus first errored field on submit
  - Full a11y: role="alert", aria-invalid, aria-describedby linkage

  Docs: interactive full-pattern demo showing field-level + submit-error banner composition.

- bc9e340: feat(empty-state): add intent variants for Borealis global state spec §5

  Extends `EmptyState` with three semantic `intent` values — `first-use`,
  `zero-results`, and `no-access` — that communicate the cause of the empty
  state and style the icon slot accordingly.

  - `first-use`: no items exist yet; accent-tinted circular icon chip; encourage
    a creation CTA.
  - `zero-results`: filter or search returned nothing; accent-tinted chip; offer
    a clear-filter secondary action.
  - `no-access`: permission or feature gate; neutral chip with lock icon; no CTA
    (terminal state).

  Also adds `iconWrap` boolean prop. Setting `intent` auto-activates `iconWrap`,
  wrapping the icon in a 72 × 72 circular chip. `iconWrap` can be used
  independently of `intent` to get the chip treatment without semantic coloring.

- 8b47b13: feat: add ConflictBanner component and useOptimisticMutation hook — inline concurrent-edit conflict detection with Keep my version / Load latest resolution and atomic rollback (VI-590)
- c1dd678: feat: add SlowNetworkBar component and useSlowRequest hook (VI-591)

  Adds the `SlowNetworkBar` component and `useSlowRequest` hook — the Borealis slow-network loading-accuracy pattern.

  **Component.** A 4px indeterminate progress bar that renders immediately below the navigation bar. Appears only after a configurable threshold (default 3 000 ms) so fast requests never trigger it. Three states: `hidden` (opacity 0, pointer-events none), `visible` (indeterminate sweep animation, fades in over 300 ms), `resolving` (sweep completes to full width then fades out over 800 ms).

  **Hook.** `useSlowRequest(threshold?)` manages the timer automatically. Call `trigger()` when a request starts, `resolve()` in a `finally` block when it completes. If the request finishes before the threshold the bar never appears — no phantom successes, accurate pending indication on 3G.

  **Composition rules.** Never alongside Skeleton in the same loading zone (choose one). On error, call `reset()` and let the error pattern take over. Non-blocking — users can navigate away while the bar is visible.

  **Animation.** CSS keyframe indeterminate sweep (`1.8s ease-in-out`, looping) with `opacity: 0` as the resting/hidden state — SSR-safe, no JS mount visibility gate. `prefers-reduced-motion`: sweep pauses, bar renders as a static full-width strip.

  **Accessibility.** `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={100}`, dynamic `aria-busy` (true when visible or resolving), configurable `aria-label`.

  **Tokens.** All values reference Visor semantic tokens: `--primary` / `--accent` (fill gradient), `--motion-duration-300` / `--motion-easing-ease-out` (entrance), `--motion-easing-ease-in` (exit), `--motion-easing-ease-in-out` (sweep), `--opacity-40` (reduced-motion static indicator).

### Patch Changes

- 22533fe: feat(success-feedback): add SuccessFeedback pattern — useSuccessToast() hook + SuccessLiveRegion a11y component (VI-589)

  App-wide success/transition feedback pattern built on the Toast primitive. Provides `useSuccessToast()` for imperative success toasts with Borealis-spec defaults (4s auto-dismiss, duration clamped to 3–8s, optional undo/view action, deduplication via id) and `SuccessLiveRegion` — a visually-hidden `role=status aria-live=polite` node for screen-reader announcements.

  Also updates toast.module.css success variant to use the inverse-surface dark treatment (per Borealis state spec), giving success toasts a high-contrast dark bg that reads as affirmative vs. the neutral default.

## 1.11.1

### Patch Changes

- 06f1192: Add `prominent` variant to `Stepper` component

  The new `variant="prominent"` prop (on `Stepper`) enables a richer visual treatment for vertical derivation spines and primary-navigation surfaces: active rows get a `--interactive-primary-soft` tint, the active bullet renders a concentric halo plus a filled pulse dot (replacing the step number), and complete-to-next rails render in a primary-line tint via `color-mix`. All values are fully token-driven and theme-agnostic. Default variant behaviour is unchanged.

- e62bb12: feat: add filled-primary variant to Chip

  Adds a `filled-primary` variant to `Chip`, `ChoiceChip`, and `FilterChip` — saturated primary background, `--primary-text` foreground, `--shadow-sm` depth, 700 weight, slight negative letter-spacing. Matches the Brand Workbench Elicit essence-chip treatment and mirrors Badge's `filled-*` family pattern. All three sizes (sm, md, lg) supported. Default and outlined variants unchanged.

- bd4e64c: docs: call Visor's `patterns/` "composition recipes" in prose (BO-50 follow-up)

  Aligns Visor's prose with the canonical Borealis vocabulary: the `patterns/*.visor-pattern.yaml` directory holds **composition recipes** — a Components-axis / AI-consumability artifact powering `visor suggest` — distinct from a Playbook design-language **pattern**. Updated `CLAUDE.md`, `CONSUMER_CLAUDE.md`, `docs/ai-consumability.md`, and `README.md`, with a cross-link to the Playbook `GLOSSARY.md` §3 disambiguation. Vocabulary only — no directory, extension, CLI command, or manifest-key rename.

- e2e28bb: fix: Checkbox hover no longer masks the checked fill (editorial density + base)

  A checked checkbox left under the pointer rendered with the _unchecked_ hover background until the pointer moved away — the checked fill appeared late. Both `@media (hover: hover)` rules (base and `data-density="editorial"`) out-specified the `[data-state="checked"]` rule and forced their hover `background-color`. The fix excludes `[data-state="checked"]` and `[data-state="indeterminate"]` from both hover selectors, so hover affordance only applies to the unchecked box and the checked fill shows immediately on click. At-rest checked / unchecked / hover-unchecked / focus / invalid rendering is unchanged.

## 1.11.0

### Minor Changes

- 34ca468: feat(error-placard): absorb ErrorPlacard from blessed admin builds into canonical Visor

  Adds `ErrorPlacard` as a registry component (`npx visor add error-placard`). An inline failed-load placard with a destructive-tinted circular icon chip, title, body, and optional right-aligned recovery actions. Theme-agnostic — all values from design tokens. Disambiguated from Alert (passive semantic callout) and Banner (full-width page bar).

- b93c9ca: feat: add ToastCard + ToastCardStack components

  Absorbs ToastCard and ToastCardStack from the blessed admin-ui pattern builds into canonical Visor as `components/ui/toast-card/`. A static, server-renderable notification card for editorial display of toast anatomy in state galleries and design documentation — distinct from the imperative Toast (Sonner) component.

  Variants: success | error | info | warning. Per-variant default Phosphor glyphs overridable via `icon` prop. ToastCardStack provides a fixed top-right stacking container with CSS-var-driven offset and gap.

- 250729e: **AvatarStack**: extend `avatars` prop to accept `AvatarStackItem` objects alongside the existing `string | undefined` entries. Add optional `overflowCount` prop for explicit `+N` override. Zero-regression for existing string-array consumers.

## 1.10.0

### Minor Changes

- 3f9511f: Add `CardLift` visual component — CSS-only hover lift + live-keyed halo interaction (VI-569).

  Port of `.bl-card-lift` from blacklight-website (BL-326). `CardLift` is a thin wrapper `<div>` that applies a `translateY(-4px)` lift, depth shadow, and a `color-mix()` halo on hover. The halo is keyed to `--lift-color` (default: `var(--accent, #6366f1)`) — consumers can pass any CSS color or `var()` reference and the halo tracks live rewrites at paint time without a React re-render.

  - `prefers-reduced-motion: reduce` removes all transitions and the transform
  - Registered in the visual-elements category; install via `npx visor add card-lift`

- cf08e76: Add `BrowserFrame` visual component to the registry (VI-570).

  Ports Blacklight's `EpkFrame` into Visor as a browser-chrome mockup frame: traffic-light dots, a URL pill with optional real link, and an arbitrary content slot. Elevation is deliberately excluded — compose with `.lit` / `.lit-soft` / `.lit-strong` from `visor-core/utilities`. Focus ring color is driven by `--browser-frame-focus-color` so themed consumers can bind a keyed accent without forking.

  Install via `npx visor add browser-frame`.

## 1.9.0

### Minor Changes

- a13929f: Add `SegmentedProgress` primitive (VI-551) — discrete per-step progress meter.

  New data-display primitive installable via `npx visor add segmented-progress`.
  Renders N equal pill segments in a row, each independently expressing `done`,
  `current`, or `pending` state. Designed for multi-step onboarding, wizard flows,
  and survey/elicitation UIs where individual step completion matters.

  - `role="progressbar"` with `aria-valuemin/max/now` and a required `aria-label`
  - `done` segments: solid `var(--primary)` fill
  - `current` segment (optional): `linear-gradient` from primary (55%) to `var(--surface-muted)` (45%) — matches the brand-workbench prototype treatment
  - `pending` segments: `var(--surface-muted)` fill
  - Two sizes: `sm` (6px, prototype height) and `md` (8px)
  - CVA size variants, CSS Modules, all colors via design tokens
  - `prefers-reduced-motion` support

- e5f6436: Add `GrainOverlay` visual component — a fixed, full-viewport film-grain noise layer (VI-564). Ports Blacklight's `.bl-grain` depth-system primitive (BL-326). Decorative only: `aria-hidden`, `pointer-events: none`, monochrome SVG `fractalNoise` texture tiled at 160×160px. Props: `opacity` (default 0.035) and `zIndex` (default 30).
- 92cbf64: Add `AmbientGlow` component (VI-566) — a decorative drifting radial-glow primitive ported from Blacklight's `.bl-ambient` depth system.

  - **`AmbientGlow`** — fixed/absolute decorative layer (`aria-hidden`, `pointer-events: none`) whose color flows entirely through the `--glow-color` CSS custom property, resolved at paint time so live rAF rewrites on ancestor elements repaint without React re-renders.
  - **`keyed` variant** — color-mix derived from `--glow-color` for runtime-keyed accents.
  - **`gold` variant** — static warm `rgba(255, 190, 38, 0.07)` glow.
  - Honors `prefers-reduced-motion` (drift animation disabled).

- 5d38a93: Add `HeroGlow` decorative primitive (VI-567) — a breathing radial glow band for hero media, color-driven by a live `--glow-color` CSS custom property.

  - **Component** `components/visual/hero-glow/hero-glow.tsx` — `position: absolute` element with `aria-hidden="true"` and `pointer-events: none`; glowColor prop sets `--glow-color` inline; external rAF-rate CSS var updates work without React re-renders
  - **CSS Module** `hero-glow.module.css` — direct port of `.bl-hero-glow` (blacklight-website BL-326); `radial-gradient(70% 60% at 50% 55%, color-mix(in srgb, var(--glow-color) 16%, transparent), transparent 72%)`; 7s ease-in-out breathe animation (opacity 0.75↔1, scale 1↔1.03); `prefers-reduced-motion` disables animation
  - **Registry** — registered in `registry/registry-visual.ts` as `hero-glow` in the `visual-elements` category
  - **Docs** — specimen page at `/docs/components/visual-elements/hero-glow` with live preview, API reference, and rAF usage example

- ae800f6: Add `SectionIntro` marketing component (VI-571) — eyebrow + display heading + optional lede pattern that opens a marketing section.

  - **Component** — `SectionIntro` with `eyebrow`, `heading`, `lede`, `align` (`left` | `center`), `headingAs`, and `as` props. Registered in the Visor registry.
  - **Eyebrow color** — driven through `--section-intro-eyebrow-color` so consumers can bind the eyebrow to any live-rewritten CSS var (e.g. a keyed `--color-acid` brand accent).
  - **CSS Module** — `section-intro.module.css` using tokenized spacing, font, and color vars; pure CSS attribute-selector alignment variants.
  - **Docs** — specimen page added to the General category at `/docs/components/general/section-intro`.

### Patch Changes

- 6c121f9: Add `locked` status to the Stepper component (VI-550).

  - `StepperItem` and `StepperTrigger` accept `status="locked"` as an explicit per-item override — never auto-derived from `activeStep`.
  - Locked triggers render a Phosphor `Lock` icon, set `aria-disabled="true"`, are removed from the tab order (`tabIndex={-1}`), and suppress `onClick` handlers.
  - Title text is rendered in the secondary/muted color when the parent item is locked.
  - New `.trigger--locked` CSS class added to `stepper.module.css` using `--border-muted`, `--text-tertiary`, and `--opacity-60` tokens.

## 1.8.0

### Minor Changes

- bedea76: Add `ChallengeCard` component (VI-554) — a first-class adversarial challenge message with a human gate affordance.

  - **`ChallengeCard`** — root container with `role="alert"` and warning-soft background / warning-line border.
  - **`ChallengeCardHeader`** — uppercase warning-toned title with a default `Flag` icon (overridable or suppressible).
  - **`ChallengeCardBody`** — prose body text.
  - **`ChallengeCardActions`** — flex row for action buttons and gate indicator.
  - **`ChallengeCardAction`** — real `<button>` with `variant="primary"` (filled warning-toned with dark text) or `variant="ghost"` (transparent + border). Includes focus rings via `var(--focus-ring-*)` tokens.
  - **`ChallengeCardGate`** — lock icon + "You hold the gate" label (overridable), pushed right via `margin-left: auto`.

  Distinct from `Alert` (passive notices) — ChallengeCard is for adversarial AI prompts that require an explicit human decision before proceeding.

- 99b43a3: Add `Composer` — AI-chat composer compound component (VI-555).

  A rounded card container holding an auto-growing multi-line text field and a tools row with icon buttons, an arbitrary status-chip slot, and a circular primary send button.

  - **Compound API**: `Composer` (root, manages field value + submit), `ComposerField` (auto-growing textarea; Enter submits, Shift+Enter inserts newline), `ComposerToolbar` (flex tools row), `ComposerToolButton` (32px circular bordered icon button), `ComposerSpacer` (flex spacer), `ComposerSend` (34px circular primary send button, auto-disabled when field is empty).
  - Supports both **controlled** (`value` / `onValueChange`) and **uncontrolled** modes; uncontrolled clears the field after submit.
  - `disabled` on the root propagates to all interactive children.
  - All values reference design tokens — no hard-coded colors, shadows, or spacing.
  - Focus rings via `var(--focus-ring-width)` / `var(--focus-ring-offset)`.
  - Respects `prefers-reduced-motion`.
  - Installed via `npx visor add composer`.

- 38fdb14: Add StructuredPrompt compound component (VI-553) — inline mad-lib fill-in-the-blank card for structured elicitation flows. Compound: StructuredPrompt / StructuredPromptHeader (icon + uppercase eyebrow) / StructuredPromptBody (tall-line-height prose) / StructuredPromptSlot (filled or empty inline chip; renders as button when onClick provided, span otherwise) / StructuredPromptHint (footer tertiary hint text).
- 440ff79: Add `SpecimenCard` — a labeled frame that pairs a context token + "feel" descriptor with arbitrary live component children, proving how a brand voice/tone renders on real components.

  Covers two Brand Workbench patterns: the tone-by-context grid card (context label + italic feel descriptor above a live specimen) and the Speaking block (multiple specimens stacked with an optional `SpecimenCardFooter` voice-key attribution line). One component, two uses — no ad-hoc frame HTML needed in workbench surfaces.

- 6357c9b: Add `Vignette` visual primitive — fixed, full-viewport radial vignette layer (VI-565).

  - **Component** — `components/visual/vignette/vignette.tsx` + `vignette.module.css`. Zero-JS, CSS-only. `position: fixed; inset: 0; pointer-events: none; aria-hidden`. Pixel-identical to Blacklight `.bl-vignette` (BL-326) at defaults.
  - **Configurable** — All gradient parameters exposed as CSS custom properties (`--vignette-size-x`, `--vignette-size-y`, `--vignette-position`, `--vignette-transparent-stop`, `--vignette-color`, `--vignette-color-stop`). `zIndex` prop (default `20`).
  - **Registry** — Registered in `registry-visual.ts`; available via `npx visor add vignette`.
  - **Docs** — New docs page at `/docs/components/visual-elements/vignette`.

## 1.7.0

### Minor Changes

- 79e12ed: Density axis + editorial-admin reconcile. Components gain a first-class **density axis** (`compact | default | editorial`): the editorial-admin treatment (sizing, type ramp, tonal fills) is baked into each component's CSS under `:global([data-density="editorial"])`, switched by a single `data-density="editorial"` attribute on any ancestor (typically the app root). The former external token-overlay hook layer is retired. Default rendering is byte-identical for existing consumers; editorial is opt-in. See `docs/density.md` and `docs/admin-editorial-reconcile-plan.md`.

  Density treatment (under `data-density="editorial"`): badge 11px/600 uppercase tracked + tonal color-mix fills; chip (FilterChip) 12px, neutral-elevated selected, circular primary count pill; input sm 33.5px/radius-md, controls on the card tier via `--field-control-bg`; button md 34px / sm 13px, secondary on card, ghost transparent, gated at 0.5 opacity; checkbox 18px/4px on the subtle surface with hairline border; avatar sm 22 / default 28 / lg 40 with per-size fallback initials; field 13/11/13px label/description/error ramp; dialog + inline confirm-card editorial modal metrics (480px / radius-xl / spacing-8 / shadow-lg / 2px overlay blur / 2xl·700 title); dropdown-menu full editorial menu metrics; data-table editorial density (row-py spacing-5, 11px headers, flush container, card header / page-card-mix rows — shared with table and matrix-table via the `--dt-*` roles); bulk-action-bar blessed inline strip; skeleton dim text-tinted gradient; tabs primary underline indicator.

  Reconciled features (opt-in props/variants, density-independent):

  - **select** — `variant="borderless"` trigger (drops border, sits on `--field-control-bg`).
  - **field** — `FieldError` gains an `icon?` prop (leading glyph).
  - **empty-state** — `variant="editorial"` (filled card + circular icon chip).
  - **skeleton** — `shapePill` / `shapeLogo` / `shapeCircle` silhouette classes.
  - **chip** — `FilterChip` gains `trailingIcon?` (orthogonal to `count`/`selectedTreatment`).
  - **button** — opt-in ghost held/open state (`.variantGhost[data-state="open"]` / `[data-active="true"]` / `.isActive`).
  - **badge** — `iconOnly` (circular glyph chip) + `case="sentence"` opt-out (reconciled with the existing `uppercase` prop).
  - **dialog** — `DialogFooter` slot.
  - **data-table** — `loadingSkeletonCell` render-prop (per-column loading silhouettes).
  - **score-indicator** — `variant="solid"` (filled chip) alongside the default `ring`.
  - **confirm-dialog** — `severity` / `iconTreatment` (inline | plated) / `mode` (dialog | inline) editorial API.
  - **matrix-table** — editorial API (`columns`/`rows`/`cells`/`renderIdentity`, Check glyph, `--dt-*` rhythm).
  - **page-header** — `leading` restored as the media/identity slot (vertically centered against the title stack; supersedes VI-539's top-align, which assumed a different slot); the prior line-height control is renamed `titleLeading`. `admin-tabbed-editor` forwards the media slot.
  - **section-nav** — blessed item API (`active` accepted as alias of `isActive`), icon accepts a component or a rendered element; blessed strip treatment (hairline baseline, tertiary resting items, 11px count pill).
  - **tabs** — line-variant parity (content-width triggers, hairline underline) and `font-family: inherit` on triggers; trigger label only wraps in a span when `count` is passed, so consumer icon+label flex gaps apply.

- b61ffa4: Extend the `brand-strategy` block with the Phase 2 wave-1 fields (VI-541), mirroring the Phase 1 schema work in VI-505. All new fields are optional and additive, so existing brand records keep validating unchanged.

  - **Engine `BrandStrategy` type** gains optional `messaging` (message-house roof), `taglines`, `boilerplate` (short/long), `colorUsage` (allowed pairings), and `accessibility` (WCAG 2.1 AA standard + contrast targets), plus optional per-pillar `proof[]` (reasons-to-believe). New exported types: `BrandMessaging`, `BrandBoilerplate`, `BrandColorPairing`, `BrandColorUsage`, `BrandContrastTarget`, `BrandAccessibility`.
  - **Validation** (`validateBrandStrategy`) admits the five new top-level keys and applies deep per-field rules only when a field is present.
  - **Serialization** (`serializeBrandStrategy`) projects the new fields into the agent manifest's `brand_strategy` (all public; a `private` record still drops the whole strategy).
  - **Schema** — both `visor-theme.schema.json` copies (engine + docs) carry the new `$defs` and `brand-strategy` properties, byte-identical (schema-copies-sync).
  - **Manifest** — the CLI's emitted `brand_strategy` now carries the new public fields; `SerializedBrandStrategy` (re-exported in the manifest type) flows them through automatically.

- 7668de1: Add `Spinner` — inline loading spinner primitive.

  A rotating border ring with a subtle track and tone-colored leading edge. Three sizes (`xs` 12px, `sm` 16px, `md` 24px), two tones (`default` uses `--text-tertiary`, `primary` uses `--primary`). Fully token-pure: stroke widths via `--stroke-width-*`, animation via `--motion-duration-1500` + `--motion-easing-linear`, colors via semantic CSS custom properties. Accessible label contract: `label` prop renders `role="status"` with visually-hidden text; without label, `aria-hidden="true"` (decorative). Reduced-motion: pauses rotation.

  Install with `npx visor add spinner`.

### Patch Changes

- Updated dependencies [b61ffa4]
  - @loworbitstudio/visor-theme-engine@0.17.0

## 1.6.0

### Minor Changes

- f41b273: Add `surface-scale-stack` — a multi-tier stacked surface aggregator block that composes ordered `SurfaceRow` specimens into a rounded vertical stack with an optional use-note column.

  Eliminates the per-consumer wrapper CSS required every time a full surface scale (page → screen → panel → panel-2 → panel-3) is documented. The note column renders only when at least one surface item provides a `note`, satisfying the V7-style use-note label pattern without coupling that data to the `SurfaceRow` primitive.

- 42dd1a8: Add `type-scale-stack` — a discrete N-tier type-scale aggregator block that wraps an ordered list of `TypeSpecimen` rows in a rounded, screen-tier, borderless vertical stack. Composes the existing `type-specimen` primitive; the block's only job is the stack chrome.

  Designed for foundation pages documenting discrete multi-tier type scales (e.g. the V7 admin 11-tier scale: 11·13·14·16·20·24·32·40·48·56·72px). Consumers previously wrapped `TypeSpecimen` rows in app-local CSS; this block provides the canonical, token-driven solution. (VI-296)

- 7dc691a: activity-feed: add `compact-3col` variant for `[time][dot][text]` row layout

  Adds `variant="compact-3col"` to `<ActivityFeed>` and surfaces timestamp in a dedicated left column (`grid-template-columns: var(--af-time-col, auto) 16px 1fr`). Default variant is unchanged — strict backwards compatibility.

- 2c85833: Add the `brand-strategy` top-level block to the Visor theme schema (VI-505) — the Brand Record as validated, serializable, theme-aware data: positioning, essence, personality, archetype, pillars, voice, tone, lexicon, core, and visibility. A sibling to the asset-only `brand` block (different lifecycle and consumer), present in both hand-maintained `visor-theme.schema.json` copies.

  Coherence-checked the way token drift is: every pillar `governs` a real token / component / meta-surface, and every `tone` key maps to a real UI state — invalid records fail validation. The block serializes into `visor-manifest.json` under `brand_strategy`, so an agent reads `voice.traits` / `tone.error` like a component's `when_to_use`; brands marked `visibility: private` are omitted from the public manifest. The block, its types, validators, and serializer are self-contained for a future `@loworbitstudio/visor-brand` extraction.

- e484abc: Add `infographic-bar` — a composable Visor block that lays out N `stat-card`s as a single continuous infographic band instead of separate bordered cards butting together.

  The band owns the frame, radius, and elevation while each `stat-card` sheds its own chrome, so a KPI row reads as one continuous surface. Outer corners round and inner corners stay square for any N via overflow-clip (no per-cell radius math). The outer frame follows `--border-default` (borderless themes drop it) and dividers follow `--hairline` — retunable via `--infographic-bar-divider`, including `transparent` for a fully seamless band — so the same band renders correctly across bordered and borderless palettes without per-consumer override CSS. Reuses `stat-card` as the cell (composition, not a fork).

- 1db4cd8: right-rail-list: add `rowSize` prop for dense admin rail text sizing

  Exposes a `rowSize="xs"` prop (default: `"sm"`) so consumers can opt-in to the smaller `--font-size-xs` (~11 px) row text for dense admin side-rails without forking the block. Existing callers are unaffected — `"sm"` remains the default.

- 1c57d42: Add `--admin-list-page-table-header-radius` CSS hook to `admin-list-page` — pipes into the DataTable's `--data-table-sort-bar-radius` so consumers can set square top corners on the sort-bar (borderless flush-header pattern) without forking the block. Defaults to the DataTable's own default, keeping the existing rounded sort-bar unchanged.
- bcf45d1: Complete `density="editorial"` on DataTable with column-header treatment: uppercase, `--font-size-xs` (~11px), `--text-tertiary` color, and `letter-spacing: 0.08em`.

  Previously `density="editorial"` only adjusted row padding (`--dt-row-py`). Column headers still rendered at the default 14px mixed-case `--text-primary` style. Now headers automatically receive the editorial-admin treatment when `density="editorial"` is set, matching the Blessing-Law organization-management design baseline (PL-1626).

  `compact` and `default` densities are unchanged.

- 6b825b8: Add `uppercase` prop to Badge for editorial label rendering (ENTERPRISE, PRO, FREE).

  The prop applies a `.uppercase` CSS module class that sets the new `--badge-text-transform` CSS custom property to `uppercase`. The token hook means a theme can also drive text-transform without the prop — set `--badge-text-transform: uppercase` anywhere in the theme cascade.

  Default behaviour (prop omitted) is unchanged: no `text-transform` is applied and mixed-case labels render as before.

- 164e2be: Add `flat` prop to BulkActionBar for embedded in-card strip rendering (no shadow, no radius, border-top only).

  Pass `flat` when the bar lives inside a table card or panel where the floating rounded-card look is wrong. The existing floating/sticky and inline variants are unchanged — `flat` composes with both.

- c6f6184: Add `selectedTreatment` prop to `FilterChip` for editorial/neutral-elevated selected state.

  The new `selectedTreatment="neutral"` option renders selected chips with a neutral-elevated surface (`--surface-card` bg, `--border-strong` border, `--text-primary` text) instead of the default accent tint. When a count pill is present and the chip is selected, it renders as a solid mint pill (`--surface-success-default`). This prevents accent-token bleed in admin/editorial contexts (e.g. organisation-management filter bands) where the accent tokens are shared across multiple uses.

  Default behaviour (`selectedTreatment="accent"`, or the prop omitted) is unchanged.

- 8f6fb09: Add `SectionNav` / `SectionNavItem` — a link/anchor-based section sub-navigation strip.

  Each item renders a leading Phosphor icon + label + optional trailing count pill, with a static 2px primary underline on the active item (`isActive`) and a count pill that re-tones from neutral to primary-tinted when active. Items navigate via `href`; pass `asChild` with a `next/link` element for client-side routing. Distinct from `Tabs`: no button triggers, no content panels, no animated indicator — built for sub-navigation where each section is its own route (e.g. organization Detail/Roles/Invites). Fully theme-agnostic via CSS custom property tokens.

  Install with `npx visor add section-nav`.

- a09cbee: Add `matrix-table` — a fixed members×roles boolean assignment grid with a sticky-left identity column (hover-tracking background, z-layered above body cells), centered 22px circular boolean cells (filled-success check when active / muted empty when inactive), and multi-line centered column headers (label over count sub-label) that opt out of the editorial uppercase header treatment. No list machinery: no selection column, no sort buttons, no pagination footer. Data-driven `columns` + `rows` API with a `renderIdentity` slot. Theme-agnostic — all values via CSS custom property tokens.
- 345614c: Add `headerSize`, `titleSize`, `titleFamily`, and `leading` pass-through props to `AdminTabbedEditor`, forwarding straight to its internal `PageHeader` so consumers can tune editorial title scale per-recipe instead of forking the block.

  Also adds a `leading` prop and matching `--page-header-title-leading` custom-property hook to `PageHeader` for tuning title line-height. All new props are optional and default-safe: omitting them keeps every existing call site pixel-identical.

- 61a348e: MatrixTable cells now accept `string` values alongside `boolean`.

  Each row can carry an optional `cells` map of per-column `string | boolean` values (`MatrixCellValue`). A `true`/`false` entry renders the existing checkmark/empty indicator; a `string` entry renders as plain text in the standard cell style. A `cells` entry takes precedence over `activeColumns` for that column.

  This makes the standard feature-comparison matrix (rows = features, columns = plans, cells = mixed `true`/`false`/`"50GB"`) work in one composition. Existing boolean-only callers using `activeColumns` are unchanged and render pixel-identical.

- eea947b: Add `gated` / `gatedReason` props to the Button primitive for permission-gated state.

  A gated button is visually dimmed (`var(--opacity-40)`) and cursor not-allowed, but stays hover-able and keyboard-focusable via `aria-disabled` instead of the native `disabled` attribute. When `gatedReason` is provided, hovering the button surfaces an anchored Tooltip (background `var(--surface-elev)`) explaining why the action is unavailable. Click handlers are suppressed internally — no consumer-side guards needed. Works orthogonally across all variants and sizes.

  Requires a `<TooltipProvider>` ancestor when `gatedReason` is set.

- 7202616: Remove the duplicate `wizard-flow` pattern; `onboarding-flow` is now the single canonical multi-step-flow pattern.

  `wizard-flow` and `onboarding-flow` described the same archetype (stepper + progress + field + input + button + alert), which split agent/author selection. Before removing it, `wizard-flow`'s broader `when_to_use` signal — checkout/multi-step sequences, "a single long form would overwhelm the user → break into steps," and "earlier steps gate or inform later steps" — was folded into `onboarding-flow`, and its `description` was broadened so the survivor covers first-run **and** checkout/generic multi-step flows. No selection signal is lost.

  Consumers who already ran `npx visor add wizard-flow` keep their copy (copy-and-own); the pattern is simply no longer offered by the registry.

- 5d026da: Resolve three composition-pattern overlaps so the set has one canonical pattern per archetype (15 → 11 patterns total, following the wizard-flow removal in VI-535).

  - **Layout** — fold `responsive-sidebar-layout`'s mobile `Sheet`-drawer behavior into `dashboard-layout` (now responsive by default), then remove `responsive-sidebar-layout`.
  - **Data table** — merge `crud-table`'s CRUD/record-management framing into the richer `data-table-row-actions` pattern and remove `crud-table`; keep `data-table-with-filters` as the distinct filtering concern, with the two survivors cross-linked.
  - **Empty state** — remove the `empty-state` _pattern_; the shipped `empty-state` _component_ is canonical (card-grid + search-results already demonstrate it in context). The component and its references are unchanged.

  Consumers who already ran `npx visor add` for any removed pattern keep their copy (copy-and-own); these patterns are simply no longer offered by the registry. Pattern `name:` casing standardization is deferred to VI-537.

- 30b3747: Add a durable guardrail against composition-pattern duplication (closes the wizard-flow/overlap class of drift from VI-535/536).

  - Every pattern now carries a `when_not_to_use` disambiguation surface (≥1 item naming its nearest-neighbor pattern), published in `visor-manifest.json` alongside `when_to_use` so agents can tell near-duplicates apart.
  - New `pattern-overlap-detection` validate rule: any two patterns whose `components_used` are highly similar (Jaccard ≥ 0.6) must mutually reference each other in `when_not_to_use`, or the rule flags them. It runs in `npm run validate` and fails `validate:strict` (CI).
  - `discoverability-selection-quality` now requires `when_not_to_use` on patterns (mirroring the existing component check).
  - All pattern `name:` fields standardized to kebab-case to match their file slug (manifest keys are slug-based, so this is metadata consistency only).

### Patch Changes

- bb2f68f: Checkbox indeterminate state now renders a Minus/dash glyph (–) instead of a Check mark.

  When `checked="indeterminate"`, the `MinusIcon` from `@phosphor-icons/react` is rendered inside the Radix `Indicator`. Checked state continues to render `CheckIcon`. Unchecked state renders nothing (Radix hides the Indicator). This fixes partial-selection header checkboxes (e.g. org-list select-all) that incorrectly showed a check mark.

- 93a7fff: Remove private-brand artifacts from the public repo (VI-528). The `theme batch-apply-flutter` generator and CLI help text no longer reference private theme names, and the theme schema's display-label example is genericized. No behavior changes — `packages/visor_themes` now ships only the five stock themes, and the committed Flutter example is generated from the stock Space theme instead of a client theme.
- dbc1075: DataTable: expose `--data-table-sort-bar-radius` custom property hook on the thead sort-bar row (VI-532). Defaults to `var(--radius-lg)` so existing rounded-top-corner behavior is unchanged. Themes can set `--data-table-sort-bar-radius: 0` to get straight corners on the header row — the borderless-admin pattern.
- Updated dependencies [2c85833]
- Updated dependencies [aa8f0b5]
- Updated dependencies [93a7fff]
  - @loworbitstudio/visor-theme-engine@0.16.0

## 1.5.1

### Patch Changes

- b0dd45d: Fix: form controls now inherit the page `font-family`. `button`, `input`, `select`, and the composite inputs (`number-input`, `search-input`, `password-input`, `combobox`, `tag-input`, `otp-input`) declared no `font-family`, so in consumer apps without a global CSS reset they rendered in the browser's default UA font instead of the theme font (`textarea` already carried the fix). Adds `font-family: inherit` on the control element — font-size and font-weight are unchanged. (VI-510)
- Updated dependencies [6ecc8b0]
  - @loworbitstudio/visor-theme-engine@0.15.1

## 1.5.0

### Minor Changes

- b70fe97: Sparkline: add an entrance path-draw animation (`animate`, default true; `duration`, default 1500ms) that draws the line left→right on mount, respecting `prefers-reduced-motion`. `animate={false}` is unchanged from the prior static render. Adds the `--motion-duration-1500` primitive to the motion-duration ladder (consumed by Progress entrance animation, VI-412).
- f3d6872: Progress: the indicator now sweeps from 0% to its value on initial mount over a default 1500ms (new `duration` prop; consumes `var(--motion-duration-1500, 1500ms)`), respecting `prefers-reduced-motion`. Note: the default entrance timing changed from 300ms to 1500ms — pass `duration={300}` to restore the prior timing. `animate={false}` remains static.
- 2abc170: Add `gated` + `gatedReason` props to Button (VI-454). When `gated=true` the
  button renders inert — visually dimmed, cursor not-allowed, click handlers
  suppressed — using `aria-disabled="true"` and `data-gated="true"` instead of
  the native `disabled` attribute, keeping the button keyboard-focusable so the
  anchored tooltip is reachable by keyboard and screen-reader users. When
  `gatedReason` is also provided, the button wraps itself in a Radix `<Tooltip>`
  that surfaces the reason on hover/focus. CSS treatment is scoped to
  `[data-gated="true"]` and is orthogonal to all existing variants and sizes.
  Existing call sites are unaffected — both props default to `undefined`.
  Consumers using `gatedReason` must supply a `<TooltipProvider>` ancestor.
- 4d6c24b: Add `count` and `countTone` props to FilterChip (VI-455). `count?: React.ReactNode`
  renders an inline count pill after the chip label — ideal for quick-filter pivots
  ("All 132 / Active 47 / Suspended 8"). `countTone?: "primary" | "neutral"` (default
  `"neutral"`) controls the pill's surface treatment; `"primary"` uses the accent ramp.
  The pill automatically re-tones when the chip is selected via a
  `[data-selected="true"] .count` CSS rule — no consumer override required. Count is
  rendered inside the `<button>` so screen readers announce it as part of the
  accessible name. Existing FilterChip usages without `count` render identically.
- 5a0b226: Add `neutral` Badge variant using `surface-muted` background + secondary text + transparent border (VI-456). Closes the gap in the tone vocabulary for Pending / Draft / Idle / Queued patterns in admin UIs.

  **StatusBadge subtle-mode shift:** `SUBTLE_VARIANT.neutral` now maps to `"neutral"` instead of `"secondary"`. Consumers using `<StatusBadge status="draft|queued|idle|scheduled" />` will see `surface-muted` surface instead of the secondary surface. This is an intentional improvement — the existing `secondary` fallback was a documented workaround ("No filled-secondary exists — neutral statuses fall back to secondary"). `FILLED_VARIANT.neutral` continues to fall back to `secondary` per VI-456 D6.

- 7173659: Add a `size` prop (`"sm" | "md" | "lg"`) to Badge (VI-457). Sizing is now token-driven per size — `sm` is tighter for dense inline data contexts, `md` (the default) reproduces the original badge sizing byte-for-byte, and `lg` is larger for editorial contexts like page headers and stat-card status pills. The fixed `height: 1.25rem` is dropped in favor of padding + `line-height: 1` (intrinsic height, matching Button), and embedded leading icons scale with the size step (`sm` 0.75rem / `md` 0.875rem / `lg` 1rem). `size` mirrors Button's convention exactly and defaults to `md`, so every existing `<Badge>` call site renders unchanged at the pixel level.
- 9e885cc: Re-home `AvatarStack` as a compound primitive in the `avatar` family (VI-458). It is
  now exported from `components/ui/avatar/avatar.tsx` alongside `Avatar`, `AvatarImage`,
  and `AvatarFallback` (mirroring the `Tabs` / `RadioGroup` compound-export pattern),
  with its CSS module and tests relocated into the avatar family. The VI-424
  `blocks/avatar-stack/` entry is reduced to a one-line re-export and flagged
  `deprecated: true` / `superseded_by: avatar`, so `npx visor add avatar-stack` keeps
  working. Public API and DOM output are unchanged — purely additive consolidation.
- 07e89b9: Add `count` and `countTone` props to `TabsTrigger` (VI-459). Renders an inline count
  pill after the tab label — ideal for admin tab navs showing filtered counts
  ("Members 12 / Pending 3 / Roles 4"). `countTone` accepts `"primary" | "neutral"`
  (default `"neutral"`); active state (`data-state="active"`) re-tones the pill
  automatically via CSS regardless of `countTone`. Works in both `default` and `line`
  `TabsList` variants. Existing triggers without `count` render identically. Prop names,
  tone values, and `data-tone` attribute match the FilterChip count slot (VI-455) exactly
  for a single mental model across Visor.
- 1a2b5ff: ConfirmDialog (VI-460): add tinted severity icon plate + `"destructive"` prop alias.

  **Visual change:** The severity icon is now rendered inside a ~2.5rem tinted circular
  plate (`--surface-{info|warning|error}-subtle` background, `--text-{info|warning|error}`
  icon color) stacked above the dialog title, replacing the previous bare 1.25rem inline
  glyph. This is a visible change for all current ConfirmDialog consumers.

  **API addition:** `ConfirmDialogSeverity` now accepts `"destructive"` as the canonical
  high-severity value, aligning with `<Alert>` and `<Button>`. The existing `"danger"`
  value is still accepted but is JSDoc-deprecated and will be removed in the next major
  version. Internally, `"danger"` normalizes to `"destructive"` — all rendering logic,
  `data-severity`, and button variant flow through a single branch.

- 4ef42b4: Upgrade `<Input>`'s `[aria-invalid="true"]` styling (VI-461). The quiet outset
  border-color swap is replaced with an inset 1.5px destructive border
  (`box-shadow: inset … var(--border-error)`), a tinted background
  (`--surface-error-subtle` with a `color-mix` fallback), and a destructive-tinted
  focus halo on `[aria-invalid="true"]:focus-visible` (the neutral focus halo is
  suppressed when invalid). No prop/API changes; consumers not passing `aria-invalid`
  are unaffected, and `className`-supplied invalid styles still win the cascade.
- 14e519e: Add a `variant` prop (`"default" | "breakout"`) to `DropdownMenuContent` and
  `DropdownMenuSubContent` (VI-462). The `breakout` variant raises z-index to 200 and
  applies a deeper shadow (`var(--shadow-xl)` with a layered fallback) so dropdowns
  escape scroll-clipped stacking contexts (data-table rows, sticky toolbars) without
  consumer-side CSS overrides. `variant="default"` is byte-identical to the previous
  rendering — strictly additive, no breaking changes.
- b8aced1: Add `PopoverSelectionList` + `PopoverSelectionItem` + `PopoverSelectionLabel` compound to Popover (VI-463).

  New exports provide WAI-ARIA listbox semantics, roving-tabindex keyboard navigation (Arrow Up/Down, Home/End, Enter/Space, Esc), and checkbox/radio indicator plates for single- and multi-select filter-control patterns inside a Popover. The `mode="checkbox" | "radio"` prop defaults to `"checkbox"` and propagates via context. Items support `selected`, `onSelect`, `disabled`, `count`, and `leadingIcon` props. All existing Popover exports are unaffected.

- cbe7663: Add a `PopoverFooter` sub-component to Popover (VI-464). `PopoverFooter` is a
  structural slot that renders a right-aligned action row separated from the body
  by a full-width top border (spanned via the negative-margin technique so the
  border reaches the popover edges while the action row stays aligned with body
  content). It follows the `SheetFooter` convention — a plain `<div>` with
  `data-slot="popover-footer"`, layout via CSS module, no opinionated button
  rendering inside the slot. Button-variant convention (primary default + secondary
  ghost/outline) and DOM-order convention (primary action last) are documented in
  the `.visor.yaml` notes. Strictly additive — existing Popover exports and
  `PopoverContent` padding behavior are unchanged.
- facebf9: Add an `AlertActions` sub-component to Alert (VI-465). `AlertActions` exposes a
  right-aligned, gap-aware row for inline action buttons — ideal for inline error
  placards with retry/dismiss controls. It follows the existing compound pattern
  (`AlertTitle`, `AlertDescription`), renders with `data-slot="alert-actions"`, and
  styles its children as a `flex` row (`justify-content: flex-end`, token `gap`) that
  sits below the description within Alert's grid stack. Existing alerts without the
  new slot render identically.
- 8ee35c3: Add optional OAuth support to the `login-form` block (VI-491). New optional props
  — `oauthProviders`, `onOAuthSignIn`, `dividerLabel`, `error`, and `hideCredentials`
  — render caller-supplied provider buttons (`Button variant="outline"`) above the
  credentials form, separated by a labeled `Separator` divider, with errors shown in
  a destructive `Alert`. A per-provider loading state toggles `disabled` + `aria-busy`
  while an async handler is pending. The block stays auth-agnostic: the consumer owns
  the sign-in call. `<LoginForm />` with no new props renders identically, so existing
  callers are unaffected. The block now also depends on the `separator` and `alert`
  primitives.
- 1cef61a: Add CRM / pipeline statuses to `StatusBadge` (VI-492). The status vocabulary
  gains seven first-class stages — `prospect` (info), `pitched` (warning),
  `contracted` / `active` / `completed` (success), `paused` (warning), and
  `archived` (neutral) — so CRM consumers get type-safe `<StatusBadge status={…} />`
  instead of a hand-rolled status map. Each stage binds to an existing semantic
  color group, so no new tokens are introduced.

  Also adds a `filled-neutral` Badge variant — the saturated counterpart to the
  subtle `neutral` variant (VI-456) — a solid `--color-neutral-600` fill with
  white text and indicator dot. `StatusBadge` now renders neutral statuses
  (`queued`, `idle`, `scheduled`, `draft`, `archived`) with `neutral` in subtle
  tone and `filled-neutral` in filled tone, so they read legibly in both tones and
  both modes (previously filled-neutral fell back to an invisible white-on-white
  `secondary` chip in light mode). Also corrects the docs Status→Variant table,
  which listed `scheduled` as `info` instead of its actual `neutral` group.

- fdd660c: Remove the deprecated `blocks/avatar-stack/` re-export shim (VI-501, follow-up to VI-458). `AvatarStack` is now sourced solely from the `avatar` compound in `components/ui/avatar/`. The one-release migration window has elapsed; consumers should `npx visor add avatar` and import `AvatarStack` from the avatar family.
- 74617c6: Add `key-value-list` — a definition-list display primitive for one record's attributes (the "key facts" panel on detail / inspector pages). Renders semantic `<dl>`/`<dt>`/`<dd>` pairs in a responsive grid; each value is an arbitrary `ReactNode` (Badge, AvatarStack, StatHero, ScoreIndicator, or plain text). Supports 1–4 columns, `stacked`/`horizontal` orientation, and `compact`/`default`/`editorial` density.

  Fills the organization-management pattern's Screen-2 facts-row gap that previously fell back to a hand-rolled `<dl className="key-value-list">` local stub.

### Patch Changes

- 80b7b00: Progress: `.indicator` background-color now chains to `var(--accent-primary)` before the charcoal hardcoded fallback (VI-410), so themes that bind only `--accent-primary` (e.g. ENTR mint) get the brand accent on the progress fill without rebinding `--interactive-primary-bg`. Same chained-fallback pattern applied to any other primitive reading `--interactive-primary-bg`.
- 000f698: Sparkline & Progress: SSR-safe entrance animations, fix invisible-by-default sparkline, and eliminate a phantom token.

  - **SSR-safe entrance animations.** Both primitives drove their entrance via `useState` + `useEffect` + `requestAnimationFrame`, which only fires reliably on a fresh client mount. On a full page reload the server rendered the sparkline fully undrawn and the JS reveal lost the hydration race, leaving the line **invisible**; Progress simply didn't animate. The entrance is now a pure CSS `@keyframes` whose resting state is the final, visible state — visible even with zero JS, and identical on reload vs. client navigation. Sparkline now uses no hooks at all. `prefers-reduced-motion` still collapses to instant; `animate={false}` is unchanged.
  - **Sparkline renders by default.** Its default stroke referenced `var(--accent-primary)`, which is emitted by **no theme**, so SVG `stroke` fell back to its initial value `none` (invisible). It now defaults to the brand color `var(--primary, currentColor)` (with a can't-go-invisible `currentColor` fallback).
  - **Phantom-token cleanup.** `--accent-primary` (defined in no theme) was used as a dead middle fallback across ~18 components/blocks (e.g. `var(--interactive-primary-bg, var(--accent-primary, #111827))`). Replaced with the canonical brand `--primary`, so themes that bind only the brand color (e.g. ENTR mint) resolve to it instead of silently falling through to gray — making VI-410's intended accent-only-theme behavior actually work.

- ac248b6: Alert: replace hardcoded light-mode hex fallbacks in variant CSS with transparent / currentColor / chained semantic fallbacks (VI-413, audit follow-up to VI-408) so Alert degrades gracefully when a theme omits semantic surface/text tokens.
- 8acbad7: Banner: replace hardcoded light-mode hex fallbacks in variant CSS with transparent / currentColor / chained semantic fallbacks (VI-414, audit follow-up to VI-408) so Banner degrades gracefully when a theme omits semantic surface/text tokens.
- e0c9bd7: StatusBadge: replace hardcoded light-mode hex fallbacks in variant CSS with transparent / currentColor / chained semantic fallbacks (VI-415, audit follow-up to VI-408) so status tones degrade gracefully when a theme omits semantic surface/text tokens.
- 76a6c03: Field: replace hardcoded light-mode hex fallbacks for text tokens with currentColor (VI-416, audit follow-up to VI-408) so field labels/descriptions/errors degrade gracefully when a theme omits semantic text tokens.
- Updated dependencies [ae20cf5]
- Updated dependencies [0121320]
- Updated dependencies [a356625]
  - @loworbitstudio/visor-theme-engine@0.15.0

## 1.4.0

### Minor Changes

- ec76c47: Form-field override token fallbacks (VI-494). Every form-field component now
  exposes a per-component CSS override token as the outer fallback so themes can
  retune fill and border without editing component CSS: `--{cmp}-bg` /
  `--{cmp}-border` on input, textarea, select, number-input, otp-input, combobox,
  and tag-input; `--switch-track-bg` on the switch track; `--radio-border` on the
  radio-group border. The full semantic fallback chain is preserved — a theme that
  sets none of the new tokens renders byte-for-byte identically to today, so the
  change is backward-compatible. Unblocks BL-227 (Blacklight solid field
  treatment).
- cb9a6dc: Adds a `--strict-dark` flag to `visor theme validate` that promotes `DARK_LIGHT_PARITY` warnings and missing `colors-dark.neutral` entries from non-blocking warnings to blocking errors. This enforces the "always both modes" authoring convention — every theme that sets `colors.neutral` must also set `colors-dark.neutral` to prevent brand-identical dark mid-surfaces across unrelated themes. The flag is opt-in today; flip to default in CI after all convergent themes supply their dark neutral. Documentation added to the theme authoring guide and CLI reference.
- ef8e057: Introduces the `--field-menu-bg` semantic token (default `var(--surface-popover)`) and wires the four field-attached floating panels — Select content, Combobox listbox, DatePicker popover, and DateRangePicker popover — to use it. When `--field-menu-bg` is unset the fallback chain (`var(--surface-popover, var(--surface-card, #ffffff))`) preserves existing rendering identically. Themes that want the open menu to read as a continuation of the field trigger can override `--field-menu-bg` to match `--surface-interactive-default`. Non-field panels (DropdownMenu, ContextMenu, Menubar, Popover, Command) are untouched.

### Patch Changes

- cec4a8d: Four independent correctness fixes from the architecture audit: `visor-theme.schema.json` (both copies) now declares `label` and `default-mode` properties so themes using these fields pass JSON Schema linting; the docs adapter's `prefers-color-scheme: dark` media queries now use the correct triple-negation selector (`:not(.light):not(.theme-light):not([data-theme="light"])`) so the light-mode escape-hatch actually works; the private-theme generator threads `defaultMode` from the YAML `default-mode` field through `PrivateThemeEntry` so the switcher can force a theme's preferred color mode on activation; and `--primary-text` in the intent group is now a single-source alias of `var(--interactive-primary-text)` eliminating the duplicated constant while preserving per-theme overrides.
- Updated dependencies [b256dd9]
- Updated dependencies [cb9a6dc]
- Updated dependencies [cec4a8d]
  - @loworbitstudio/visor-theme-engine@0.14.0

## 1.3.4

### Patch Changes

- 0772700: Select: the trigger height now matches a same-size Input. The trigger was inheriting `line-height: 2.0`, rendering the dropdown ~7px taller than text fields across every theme; it now pins `line-height: 1.5` to track the field height.
- Updated dependencies [4d5de2d]
  - @loworbitstudio/visor-theme-engine@0.13.0

## 1.3.3

### Patch Changes

- Updated dependencies [fe490fd]
- Updated dependencies [c7a06c2]
  - @loworbitstudio/visor-theme-engine@0.12.0

## 1.3.2

### Patch Changes

- Updated dependencies [ae3a711]
  - @loworbitstudio/visor-theme-engine@0.11.0

## 1.3.1

### Patch Changes

- Updated dependencies [0abb273]
  - @loworbitstudio/visor-theme-engine@0.10.0

## 1.3.0

### Minor Changes

- 4923865: VI-437 feat(sandbox): `visor sandbox init` accepts a `--from-html-prototype <path>` flag that imports a Phase 1.5 HTML prototype directory into the generated sandbox.

  The flag copies the prototype tree into the sandbox's `public/prototype/` directory and pairs each numerically-prefixed `screen-N-*.html` source file with the matching screen in the design-handoff manifest, in order. The generated `app/screens/[name]/page.tsx` swaps the operator-edit placeholder for an iframe that loads the paired HTML — so the sandbox boots with the real Phase 1.5 composition as the baseline, not a placeholder. `sandbox.json` records the source directory and the resolved screen-to-html map so downstream tooling can re-pull when the prototype changes.

  Unblocks the retro-fit pattern for pattern builds whose Phase 1.5 cleared before the sandbox CLI shipped (PL-1570, organization-management). Greenfield Phase 1.5 runs without an HTML prototype still hand-build sandbox compositions; the flag is opt-in.

- 17fd70e: VI-438 feat(sandbox): when `--from-html-prototype` is set, `visor sandbox init` now auto-discovers state-coverage screens — any `screen-N-*.html` files beyond the manifest's named-screen count are appended to the sandbox as `state-coverage` screens with predictable slugs derived from the filename suffix.

  Example: a prototype directory with `screen-1-list.html`, `screen-2-detail.html`, `screen-3-menus.html`, `screen-4-feedback.html`, `screen-5-edge-states.html` and a handoff that names two screens produces the two named routes plus `state-coverage-menus`, `state-coverage-feedback`, `state-coverage-edge-states`. Each state-coverage screen iframes its source HTML and is recorded in `sandbox.json` under `fromHtmlPrototype.stateCoverageScreens`, restoring per-state baseline coverage for the Phase 4 state-coverage diff gate. `ScreenEntry` gains an optional `kind: 'named' | 'state-coverage'` field that surfaces in the runtime `sandbox-manifest.ts` module so downstream tooling can filter by category.

- 560a929: VI-439 feat(sandbox): `visor sandbox init` now resolves brand themes from a private themes directory via `VISOR_THEMES_PRIVATE_PATH` env var, and accepts an explicit `--theme-file <path>` override.

  When the operator passes `--theme entr`, the CLI now walks a layered candidate list before falling back to the placeholder `globals.css`: `--theme-file <path>` wins if set, then `theme` interpreted as a direct path on disk, then `${VISOR_THEMES_PRIVATE_PATH}/themes/${theme}/theme.visor.yaml` when the env var is set (the canonical path for brand themes kept in `visor-themes-private`), then the existing `cwd/themes/${theme}.visor.yaml` and `cwd/custom-themes/${theme}.visor.yaml` fallback. If every candidate misses, the warning now lists the exact paths searched and prints the `npx visor theme apply` command the operator should run, instead of a generic "leaving placeholder" message that pointed at the wrong docs. Closes PL-1570 finding #3 — operators no longer have to run a second CLI invocation pointing at a private repo path after `init`.

- 149b6da: VI-441 feat(sandbox): `visor sandbox approve` now writes captures to `captures/pending/` by default and adds an `--approve` flag that promotes pending → approved after operator review.

  The capture flow becomes a three-state review loop — capture into pending (auto-diffed against any existing approved baseline), eyeball pending + diffs, promote with `--approve` once the captures look right. Approved captures are no longer overwritten on every run; the baseline only changes via a deliberate operator action.

  The legacy `--diff` flag becomes a deprecated no-op since the default capture already pixel-diffs against the approved baseline. Pending and diff directories are cleared at the start of each capture run so stale artifacts can't sneak into the review set.

  Fixes the auto-approve foot-gun from PL-1570 where first-run captures landed straight in `captures/approved/` (documentary chrome included) and required manual deletion to re-capture cleanly.

- 79cf443: VI-443 feat(sandbox): `visor sandbox init` now accepts `--strip-chrome` and `--strip-chrome-additional` to remove Phase 1.5 documentary chrome (state callouts, section headers, proto-nav, mint-styled annotation chips) from imported prototype HTML.

  Bare `--strip-chrome` enables stripping with a default selector list shipped by the CLI: `.state-callout`, `.state-section__header`, `.proto-nav`, `[data-documentary-chrome]`, and inline-styled mint chips matching `[style*="mint"]`. Pass `--strip-chrome "<selectors>"` (comma-separated) to REPLACE the defaults with a custom list, or `--strip-chrome-additional "<selectors>"` to MERGE extras with the chosen base. The stripper runs over each `.html` file copied into `public/prototype/` before the sandbox boots, so the resulting screen routes — and any Phase 4 captures — never render those labels. The resolved selector list is recorded in `sandbox.json` under `fromHtmlPrototype.stripChromeSelectors` for traceability. Closes PL-1570 post-mortem finding #7 (operators had been hand-rolling `strip-chrome.mjs` in each sandbox dir).

### Patch Changes

- d4326c6: VI-440 fix(sandbox): generated `next.config.ts` now bakes `turbopack: { root: __dirname }` so Next.js doesn't misdetect the workspace root in multi-lockfile setups.

  When `visor sandbox init` scaffolded `.lo/sandbox/{name}/` inside a parent repo that already had its own `package-lock.json`, Next.js 16.2.6 chose the parent repo as the turbopack root and broke `@/lib/...` module resolution — routes 500'd on first request. The generated config now anchors `turbopack.root` to the sandbox dir via `fileURLToPath(import.meta.url)`, matching the manual workaround from PL-1570 finding #4.

- d0b82fa: VI-442 fix(sandbox): the auto-generated `playwright.capture.mjs` now sets `deviceScaleFactor: 2` so retina captures look crisp on review.

  File size cost is roughly 4x but PNGs stay in the low-megabyte range. Pixel-diff is unaffected (compares per-pixel either way).

- 88f818f: VI-444 fix(sandbox): handoff entries declared "shipped" but missing from the Visor registry are now auto-reclassified as `compose-recipe` (consumer-side compositions of existing primitives) instead of being skipped with a warning.

  `visor sandbox init` now treats a Gate 3 miss on a `shipped` or `gap-inflight` entry as a signal that the handoff is describing a consumer-side composition. The entry's `status` is rewritten to `compose-recipe` and its `viTicket` is cleared before the scaffold runs, so both `sandbox.json` and `lib/sandbox-manifest.ts` surface the correct classification, no stub is generated, and `npx visor add` is not invoked for it. A softer informational warning (`'X' declared shipped in the handoff but absent from the registry — reclassified as compose-recipe`) is emitted in place of the prior skip warning. Mirrors PL-1570 finding #8.

- Updated dependencies [36b4b26]
  - @loworbitstudio/visor-theme-engine@0.9.0

## 1.2.1

### Patch Changes

- b542cb1: VI-436 fix(scripts): `visor-publish-smoke.mjs` now detects a stale local `dist/registry.json` and exits with a clear "rebuild first" message instead of reporting phantom content drift.

  The smoke compares a locally-built `dist/registry.json` to the registry inside the latest published npm tarball. When the local build was stale relative to source, every primitive whose source had changed since the last build registered as "content drift" and recently-added primitives registered as "missing in source" — eroding trust in the publish-gate signal exactly like a false negative would. Adds a freshness check that stats every source file referenced by the current registry plus the `registry/*.ts` definitions and the build-registry script itself; exits code 2 with the offending newer file's path when stale. Wires a new `--skip-staleness-check` flag for CI (which already builds immediately before invoking the smoke) and updates the `smoke:publish` npm script to chain `npm run build:registry -w packages/cli` so the happy path "just works" for operators.

## 1.2.0

### Minor Changes

- dda261b: VI-425 feat: `data-table` `density` prop — `compact` / `default` / `editorial` row padding.

  Adds an optional `density` prop to `data-table` (default `"default"`) that maps to a `data-density` attribute on the root and drives a `--dt-row-py` custom property the cells consume. `compact` = 8px, `default` = 12px (unchanged from previous behaviour — no visual regression for existing consumers), `editorial` = 20px (generous, each row reads as a card). Implementation only overrides cell `padding-top` / `padding-bottom` via a scoped `.root td` rule, leaving the existing `TableCell` shorthand to govern horizontal padding. Themes can override per-density values by targeting `[data-density="…"]` from their own selector. Driven by the `organization-management` pattern build (PL-1490 / PL-1498) where the editorial direction calls for more vertical breathing room than the default density allows.

- ad13ae2: VI-427 feat: layout primitives — `Box`, `Stack`, `Inline`, `Grid`, `Container`.

  Five token-driven layout primitives, each at `components/ui/{name}/`, available via `npx visor add box stack inline grid container`. Token-named props (`SpacingToken`, `SurfaceToken`, `RadiusToken`, `BorderToken`) are enforced by TypeScript so off-system values are compile errors. Responsive `{ base, sm, md, lg, xl }` maps are wired through per-breakpoint CSS variables. Stack defaults to `gap="md"`, Container defaults to `size="lg" padding="md"`. All primitives ref-forward and support `as` prop polymorphism, defaulting to `<div>`. Total bundle weight is 1.8 KB gzipped (target was &lt; 5 KB). 58 unit tests + 16 snapshot/token-coverage tests + 5 SSR tests; docs site has a new `components/layout` group with MDX pages and `PropsTable` API references.

- 612ed7e: VI-429 feat: `score-indicator` Visor primitive — compact circular ring for percentage / ratio metrics.

  Ships a new admin primitive installable via `npx visor add score-indicator` for health-score / uptime / engagement style metrics. Renders an SVG ring (track + indicator) with the value centered inside, an optional `/ N` denominator (trailing or below), and an auto-toned color mapping (`>=85%` success, `60-85%` info, `40-60%` warning, `<40%` destructive) that can be overridden with an explicit `tone`. Destructive and warning tones add a small phosphor icon overlay at the top-right of the ring as a non-color cue. Three sizes (24 / 36 / 56 px ring), `role="img"` with a default `"X out of Y"` aria-label, and theme integration via CSS custom properties so consumers can tune ring + value colors without forking.

  Codifies the inline custom HTML in the organization-management Phase 1.5 prototype as a first-class primitive. Adjacent primitives consulted: `stat-card`, `stat-hero`, `badge`, `progress` — none cover circular / ratio rendering. Replaces the inline HTML in admin dashboards built on Visor.

- ffd1e47: VI-430 feat: `prototype-review` Visor block — drop-in chrome for BL-193-style design-review prototypes.

  Ships a theme-agnostic block that renders the full review SPA: theme switcher, light/dark mode toggle, brand color picker, treatment tabs, viewport switcher, and a multi-viewport iframe grid. Zero hex literals in the CSS module and zero `theme ===` conditionals in the TSX — every surface, border, and focus ring references Visor semantic tokens. Implements a postMessage protocol (`{ type: "prototype-theme", themeClass, mode, brand }`) for cross-iframe theme/mode/brand propagation, with URL params (`?theme=…&mode=…&brand=…`) as the deep-link fallback. Exposes a `usePrototypeReview()` hook for advanced consumers; default consumers pass props. Block API: `ticketId`, `reviewLabel`, `statusPills`, `treatments[]`, `landing{}`, `viewports{}`, `brand{}`, `themes[]`, `footer{}`.

- a8a3525: VI-432 feat: `color-picker` Visor primitive — first-class OKLCH color picker installable via `npx visor add color-picker`.

  Ships a theme-agnostic OKLCH-based color picker that reuses the validated math from `@loworbitstudio/visor-theme-engine`. Two surfaces — `popover` and `inline` — both built on the same engine. Registered under the `form` category with a docs page (4 live previews), a locked design recipe + HiFi mockup under `design-prototypes/color-picker/`, and 33 passing tests including WCAG 2.1 AA axe coverage. The `isOutOfGamut` helper is kept as a stable seam for a future engine release that exposes unclamped linear RGB. Replaces the simple hex picker in the `prototype-review` block at the consumer's option (the simple picker stays as the sensible default; `ColorPicker` is a drop-in upgrade).

- 75c665a: VI-433 feat: `export-menu` Visor admin block — Export button + format-picker popover + scope toggles.

  New admin block installable via `npx visor add export-menu --block` that standardizes the Export affordance across every admin list. Composes a `<Button>` trigger (with `aria-haspopup="dialog"`) into a `<Popover>` containing a header, a format-picker `<RadioGroup>` (CSV / JSON / PDF baseline via `defaultExportFormats()`, or any custom set), an optional scope checkbox section (Include archived, Include suspended, …), and a Cancel/Export footer. Async-aware: when `onExport` returns a `Promise`, the submit button shows a spinner with `aria-busy`, both buttons disable, and the popover stays open until the promise resolves; on rejection, state clears and the popover stays open so the user can retry. Disabled formats render a Radix tooltip with the `disabledReason` on hover/focus. Enter inside the popover (on any non-button element) submits the selected format. Trigger variant is mappable to the Button's default/secondary/ghost via `triggerVariant`.

  Codifies the recurring "Export" pattern surfaced from the organization-management Phase 1.5 prototype audit (PL-1548) — previously every admin list (org list, members, invitations, roles, audit logs, …) reinvented this popover with subtly different formats and scope-toggle naming. Adjacent primitives consulted: `dropdown-menu`, `popover`, `quick-actions`, `command-dialog` — none cover format-picker + scope-toggle composition. Composes existing Visor primitives: `button`, `popover`, `radio-group`, `checkbox`, `label`, `tooltip`.

### Patch Changes

- 46bc6ba: VI-431 fix: `npx visor add` now installs all transitive peer dependencies of the added component.

  Fixes a silent partial-install bug where the CLI reported success after writing component files but skipped peer dependencies referenced by their imports (e.g. `@radix-ui/react-slot` for `button`, `class-variance-authority` for `input` and `textarea`), causing the consumer's next `next build` to fail with `Cannot find module`. Audits every React-target registry item against its source-file imports and adds a self-validating regression test (`auditRegistryDependencies`) that runs against the built `dist/registry.json` so future drift fails CI before reaching consumers. Treats `react` and `react-dom` as assumed peer deps per shadcn convention.

## 1.1.0

### Minor Changes

- cc3b501: VI-423 feat: `visor sandbox` subcommand — scaffolded Next.js app for in-vivo primitive iteration with gap stubs.

  A new `sandbox` subcommand group (`init`, `dev`, `approve`) bridges the gap between standalone-HTML prototypes and the production Visor scaffold in the `/lo-play pattern-build` pipeline. `visor sandbox init <name> --handoff <path> --theme <theme>` reads a Low Orbit design-handoff manifest, scaffolds a Next.js 16 app at `.lo/sandbox/<name>/`, runs `visor add` for every shipped primitive declared in the manifest, and generates visible dashed-border stub components for each declared gap primitive (`components/stubs/<name>.tsx`, each containing a `GAP: VI-<NNN>` marker).

  `visor sandbox dev --name <name>` boots the dev server on an auto-allocated port (port 3000 is reserved per the Low Orbit convention; the allocator probes from port 4060 upward). The scaffolded app exposes one route per primitive (`/primitives/<name>`), one per screen declared in the recipe (`/screens/<name>`), plus an index at `/` linking to all of them.

  `visor sandbox approve --name <name>` shells out to a sandbox-local Playwright install and captures full-page screenshots of every route into `captures/approved/`. `--diff` pixel-diffs the new capture against the approved baseline and writes only changed routes to `captures/diffs/<route>.diff.png`, so operator iterations stay traceable.

  The CLI itself does not bundle Playwright — the sandbox scaffold declares `@playwright/test`, `pixelmatch`, and `pngjs` in its own devDependencies, keeping the published `@loworbitstudio/visor` package light. Unknown primitives in the handoff (declared shipped but missing from the registry) are skipped with a warning rather than aborting the scaffold.

- 0342b87: VI-424 feat: `avatar-stack` block — overlapping avatars with `+N more` overflow indicator.

  A new `data-display` block composes the existing `Avatar`, `AvatarImage`, and `AvatarFallback` primitives into an overlapping cluster — no new primitive, no new tokens, no new ARIA pattern. `npx visor add --block avatar-stack` auto-pulls the `avatar` primitive. Each avatar carries an outward ring (`box-shadow` against `--surface-default`) so the stack reads cleanly against any tone; `Avatar`'s `overflow: hidden` makes outward projection the safe choice. Avatars after the first overlap by `calc(-1 * var(--spacing-2))` with `isolation: isolate` on the root keeping the stacking context contained. The `+N more` indicator is itself an `Avatar` with a `+N` fallback so it inherits size and ring. `total` may exceed `avatars.length` to support server-truncated data — the block computes `overflow = total - visible.length`. `role="img"` plus a `label`-overridable `aria-label` (defaulting to `` `${total} members` ``) announces the cluster as a single image rather than each fallback character.

- 176f6c4: VI-428 feat: `profile-menu` block — sidebar-footer profile menu with composable items and `AdminShell` footer-slot integration.

  A new `admin` block composes the existing `Avatar`, `AvatarImage`, `AvatarFallback`, and `DropdownMenu*` primitives into a Mac-style profile menu — no new primitive, no new tokens. `npx visor add --block profile-menu` auto-pulls the `avatar` and `dropdown-menu` primitives. The trigger renders an avatar + optional status dot, name, optional context line (e.g. `ENTR · Owner`), and an end-aligned `CaretUpDownIcon`; the menu opens upward by default (`side="top"`) so it sits cleanly above a bottom-anchored sidebar footer. Items are a composable `ProfileMenuItem[]` array — `{ type: "item" }` with optional `icon`, `shortcut`, `badge`, and `variant: "default" | "destructive"`; `{ type: "separator" }`; and `{ type: "label" }` — letting consumers splice, replace, or extend without forking. `defaultProfileMenuItems(user, opts)` exports the Low Orbit baseline (Account / Notifications / Appearance / Keyboard shortcuts / Help & docs / separator / destructive Sign out with `⌘⇧Q`), and `opts.notificationCount` populates the badge on the Notifications item. `enableGlobalShortcuts` is opt-in: when true, a window-level `⌘⇧Q` / `Ctrl+⇧+Q` keydown handler calls `onSignOut`. `AdminShell` already exposes `sidebarFooter` — no shell modifications are required; the block drops straight into that slot. Status dots carry per-state `aria-label`s (`"Online"`, `"Away"`, `"Busy"`, `"Offline"`) and the trigger's accessible name combines name + context so the affordance still announces correctly when text is truncated.

### Patch Changes

- 7c35718: VI-422 feat: `theme sync` continues past broken themes and summarizes failures at the end.

  Previously, `visor theme sync` aborted on the first per-theme failure (e.g. a font-coverage error in one private theme), blocking every healthy theme from syncing. Now each theme is processed in isolation: failures are collected, every healthy theme syncs, and a structured summary names the failed themes at the end. Exit code is non-zero iff any theme failed. The D6 contract is preserved — when every theme fails, the sync bails before the write phase so pre-existing CSS is never wiped.

  JSON envelope adds a `failures: Array<{filePath, error}>` field when per-theme failures occur. The legacy `errors: string[]` field is removed; consumers should switch to `failures`. All-healthy runs are unchanged.

- Updated dependencies [8bd7a00]
- Updated dependencies [98d6a9b]
  - @loworbitstudio/visor-theme-engine@0.8.1

## 1.0.0

### Major Changes

- dd096c9: VI-399 BREAKING: `StatCard` `trend` slot defaults to footer position.

  `<StatCard trend={…}>` now renders the trend as a direct child of the card root (after value/delta, before footer), full card width — NOT inside the header. The previous header-position layout, which collapsed thin Progress bars and competed with the label for header space, is opt-in via `trendPosition="header"`.

  **Migration:** consumers wanting the prior layout pass `trendPosition="header"`. Consumers not using `trend` are byte-for-byte unchanged. New `data-trend-position={position}` attribute on the wrapper for CSS targeting; new `--stat-card-trend-padding-top` hook (default `var(--spacing-3)`) for tuning the gap above the trend.

  This is the BIG default change — it visually shifts every existing StatCard consumer that uses the `trend` slot. Pairs with VI-398's hero-scale default change.

- f827fcc: VI-404 BREAKING: `AdminListPage` `footerStatus` now renders as a sibling of the table section, not a child.

  The `footerStatus` slot moves from inside `<section data-slot="admin-list-page-table">` to a top-level child of the block root. This makes the footer float below the table card on the page background — matching the editorial admin baseline.

  **Migration:** consumers targeting `[data-slot="admin-list-page-footer-status"]` directly keep working. Consumers using descendant selectors of the form `[data-slot="admin-list-page-table"] [data-slot="admin-list-page-footer-status"]` will silently stop matching — drop the `admin-list-page-table` ancestor.

  Pairs with VI-405 (CSS hooks for the freshly-extracted footer node).

### Minor Changes

- 154ecb7: VI-303 feat: `PageHeader` exposes `titleSize` and `titleFamily` props for marquee-scale title typography.

  Editorial admin surfaces hero a single page title at a much larger scale than the existing `size: "sm" | "md" | "lg"` axis allows (e.g., 56px display-font "Tonight"). `size` conflated three axes (gap rhythm, title size, description size); adding an `xl` variant would compound the conflation. This ticket follows the VI-288 `StatCard.valueAs` precedent and splits title typography off as its own orthogonal axis.

  **New props (both optional, additive — no breaking changes):**

  - `titleSize?: "default" | "marquee" | string` — Token presets map to `data-title-size` on the title slot. Any other string is forwarded as a raw CSS length on an inline `--page-header-title-size` declaration and rendered via the marquee rule.
  - `titleFamily?: "heading" | "display" | string` — Token presets map to `data-title-family`. `"display"` resolves to `var(--font-display, var(--font-family-heading, inherit))` so themes without a display font degrade to the heading family.

  **New CSS custom properties on `.base` (override hooks for themes):**

  - `--page-header-title-size` — defaults to `3.5rem`. Used by `titleSize="marquee"`.
  - `--page-header-title-family` — defaults to `var(--font-display, var(--font-family-heading, inherit))`. Used by `titleFamily="display"`.

  When both props are omitted no `data-title-*` attributes are added and the rendered markup is byte-for-byte identical to the previous output. The `size` variant rules continue to drive the default sizing cascade.

- 927de52: VI-304 feat: add `ChromeButton` — 28px topbar/chrome button primitive.

  Admin topbars across r3 (dashboard + events), ENTR admin, Mission Control, and Studio CRM all repeat the same compact button + inline `Kbd` hint pattern. Visor's `Button` is sized for body content (40px / 36px / 32px) and lacks the `Kbd` slot, so every admin shell either reaches for `Button size="sm"` (wrong density) or rebuilds the row inline.

  `ChromeButton` makes the chrome-scale pattern first-class:

  - 28px height, compact paddings, theme-portable (binds to Visor tokens — no hardcoded colors)
  - Optional leading icon slot (`data-slot="chrome-button-icon"`)
  - Optional trailing `keys: string[]` slot rendered as `<Kbd keys={keys} size="sm" />` (`data-slot="chrome-button-kbd"`)
  - Two variants: `default` (muted interactive surface) and `primary` (accent surface)
  - All standard `<button>` HTML attributes pass through; `aria-label` supported for icon-only usage

  Net-new primitive — zero risk to existing components. Install via `npx visor add chrome-button`.

- 2854a9b: VI-379 feat: add `Sparkline` primitive — decorative inline SVG mini-trend chart.

  New `components/ui/sparkline/` primitive for the stat-card trend slot and dense data contexts. Renders a single SVG polyline from a numeric series with zero dependencies (no Recharts, no charting library). Default dimensions 96×22, stroke from `var(--accent-primary)` for theme portability. Returns `null` when `values.length < 2`.

  Props: `values: number[]` (required, min 2), `width` (default 96), `height` (default 22), `color` (default `var(--accent-primary)`), `strokeWidth` (default 1.5). Decorative (`aria-hidden="true"`) by default; pass `aria-label` to promote to a labeled image.

  Registered in `registry/registry-ui.ts` so `npx visor add sparkline` resolves. Docs proxy + MDX page added under `data-display`.

- 5776fb8: VI-381 feat: add `SectionHeader` primitive — compact section-divider with uppercase title and optional right-aligned meta.

  New `components/ui/section-header/` primitive that fills the gap between `PageHeader` (page-level hero) and `Heading` (in-content h2/h3). 36px row with `--surface-subtle` background, 11px uppercase title at 0.14em letter-spacing, optional 13px tabular-num meta slot — sized for stacking 3-8 sections inside a page body.

  Props: `title: React.ReactNode` (required), `meta?: React.ReactNode` (optional, right-aligned), `as?: "header" | "div" | "section"` (default `"header"`). Title renders as `<span>` so the primitive intentionally adds no heading semantics — wrap your own heading element in the title slot if you need a real h2/h3. Root carries `data-slot="section-header"`; sub-slots `section-header-title` and `section-header-meta`.

  Registered in `registry/registry-ui.ts` so `npx visor add section-header` resolves. Docs proxy + MDX page added under `navigation`. Tokens used: `--surface-subtle`, `--text-tertiary`, `--font-size-xs`, `--font-size-sm`, `--font-weight-medium`, `--spacing-3`, `--spacing-4` — fully theme-portable.

- cb6e0cc: VI-383 feat: extend `Progress` with `animate` flag and `size="thin"` variant.

  `Progress` now accepts two additive optional props:

  - `animate?: boolean` (default `true`) — when `false`, the indicator drops its CSS transition for instant paint. Use for static admin chrome where the bar mounts at its final value.
  - `size?: "default" | "thin"` (default `"default"`) — `"thin"` renders a 4px-tall capacity bar styled with `--surface-interactive-active`, intended for KPI strips and time-until indicators inside admin chrome.

  Existing consumers render byte-for-byte identically: no `data-*` attributes are emitted when both props are omitted, and the existing 12px animated track remains the default. The thin variant is the same primitive — not a fork — opted into at the call site with `<Progress value={…} size="thin" animate={false} aria-label="…" />`.

- 2e665bf: VI-386 feat: add `CommandDialog` block — drop-in ⌘K palette composing the `command` + `dialog` primitives.

  New `blocks/command-dialog/` block that ports the r3 admin-ui palette visual contract onto Visor tokens. Composes existing primitives (`Command`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty`, `Dialog`, `DialogContent`, `DialogTitle`, `Kbd`) — does not fork any of them — and exposes named slots for the parts every admin shell re-implements by hand: scope chip, group heading with optional count, item meta, item Kbd shortcut, footer hint row, and result count.

  Props: `open` + `onOpenChange` (controlled), `placeholder?`, `scope?` (string → "in {scope}" or full ReactNode), `groups: CommandDialogGroup[]`, `footerHints?: CommandDialogFooterHint[]`, `resultCount?` (derived from groups when omitted), `hideResultCount?`, `enableShortcut?` (default `true`; binds ⌘K / Ctrl+K to toggle open, cleans up on unmount), `className?` (forwarded to `DialogContent`).

  Data slots on every meaningful node: `command-dialog`, `command-dialog-input-row`, `command-dialog-scope-chip`, `command-dialog-scope-label`, `command-dialog-group-heading`, `command-dialog-item-icon`, `command-dialog-item-label`, `command-dialog-item-meta`, `command-dialog-item-kbd`, `command-dialog-footer`, `command-dialog-footer-hints`, `command-dialog-footer-hint`, `command-dialog-result-count`.

  Hit-highlighting is pass-through — callers wrap matched substrings in `<span data-hit>` inside item labels and the block's CSS paints them with the accent token. No auto-highlighting; consumers wire their own search.

  Registered in `registry/registry-blocks.ts` so `npx visor add block command-dialog` resolves. Docs proxy + demo added under `packages/docs/components/blocks/`.

- fff18e1: Add `customFooter` slot to `admin-settings-page` block, letting consumers replace the default footer entirely.
- d02ab62: VI-398 feat: stat-card `hero` variant defaults to 56px (editorial admin density).

  Adds `--stat-card-value-size-hero` (default `var(--font-size-6xl, 3.5rem)`) as a separate hook from `--stat-card-value-size`. `.value[data-value-as="hero"]` reads through the new hook with the previous size as a chained fallback. Default `valueAs="hero"` cards now render at 56px instead of ~30px — matches the editorial admin baseline (admin-v7-r3). Consumers binding either custom property override the new default; non-hero variants are byte-for-byte unchanged.

- 480aded: VI-400 feat: Sparkline gains a `fluid` prop that drops the SVG `width` attribute so the chart fills its container.

  When `fluid={true}`, the rendered `<svg>` omits its `width` attribute (the `viewBox` preserves the aspect ratio), keeps the `height` attribute, and applies a `.svgFluid` class that forces `width: 100%; height: auto; display: block;` via CSS. When `fluid={false}` (default), the component is byte-for-byte unchanged — 96px × 22px SVG. Cleans up the common consumer pattern of forcing `width: 100%` via CSS overrides.

- 74874db: VI-401 feat: `admin-settings-page` exposes `--admin-settings-page-nav-width` so consumers can pin the left-rail width without forking the block CSS.

  `.withLeftNav .body`'s `grid-template-columns` now reads through `var(--admin-settings-page-nav-width, minmax(12rem, 16rem))`. Default preserves the current responsive rail (clamped between `12rem` and `16rem`). Consumers can override per-instance with any valid `<grid-track-size>` value (e.g. `220px`, `15rem`).

- dadfd94: VI-402 feat: `AdminSettingsSection` gains `eyebrow`, `titleSize`, and `titleFamily` props for editorial section headers.

  Sections can now render an uppercase eyebrow label (e.g. "ACCOUNT · PROFILE") above the title, plus tune the title scale (`"default" | "lg" | "xl" | "marquee"`) and font family (`"body" | "marquee"`). Mirrors PageHeader's existing API (VI-303). Sections without the new props are byte-for-byte unchanged.

- 524dc5c: VI-403 feat: `admin-settings-page` sideNav now stretches to fill its grid track via an inner-sticky-stretch pattern.

  Previously `.sideNav` was `position: sticky; align-self: start;` which collapsed the rail to content height — so the rail's surface didn't extend to the bottom of the viewport. The block now wraps the sideNav children in a `data-slot="admin-settings-page-side-nav-sticky"` inner div that carries the sticky positioning, while the outer `.sideNav` becomes a stretching grid track. Net: rail surface visible to the bottom of the body; scroll-anchor sticky behavior preserved.

  Behavior change: consumers that relied on the rail collapsing to content height need to opt back in via CSS overrides. New `data-slot` hook is additive.

- 8ebf584: VI-405 feat: `admin-list-page` exposes CSS hooks for table card boundary + footer styling.

  Five new CSS custom properties make the table card + footer pill independently themable without forking the block CSS:

  - `--admin-list-page-table-bg` (default `transparent`)
  - `--admin-list-page-table-radius` (default `0`)
  - `--admin-list-page-footer-bg` (default `transparent`)
  - `--admin-list-page-footer-radius` (default `0`)
  - `--admin-list-page-footer-padding` (default current `var(--spacing-3, 0.75rem) 0`)
  - `--admin-list-page-footer-border-top` (default current `1px solid var(--border-subtle, …)`)

  All defaults preserve current behavior. Pairs with VI-404 (which moved the footer to a sibling of the table section) — consumers wanting the standalone-pill treatment can now compose these hooks instead of overriding via `:global` selectors.

- c1e5759: VI-407 feat: Checkbox primitive gains a 6-hook token contract for theme-portable styling.

  Borderless themes (those that zero `--border-default`) lost the Checkbox hairline. The primitive now exposes a full state-machine surface that falls back through existing semantic tokens — byte-for-byte unchanged for themes that don't bind any of the new hooks:

  - `--checkbox-border` / `--checkbox-bg` — unchecked
  - `--checkbox-border-hover` / `--checkbox-bg-hover` — hover (unchecked)
  - `--checkbox-border-checked` / `--checkbox-bg-checked` — checked + indeterminate

  A new `.root[data-state="indeterminate"]` rule mirrors `[data-state="checked"]` so the partial-selection state tracks the checked treatment via the same hooks. Themes that need a different look (e.g. ENTR's borderless-but-visible mint chip) can now override on `body.<theme>` with a 6-line token rebind instead of forking the component CSS.

- 16e082b: VI-408 fix: Badge variants degrade gracefully when semantic tokens are unbound.

  Variant CSS used hardcoded light-mode hex fallbacks (e.g. `background-color: var(--surface-info-subtle, #f0f9ff)`). When a theme bound success/warning but not info/secondary/destructive, Badges rendered in bright light-mode against a dark surface.

  This change replaces every hardcoded light-mode fallback with `currentColor` / `transparent` / chained semantic fallbacks (e.g. `var(--surface-X-subtle, transparent)`, `var(--text-X, currentColor)`). When a theme is missing a token, the Badge degrades to a transparent/outline-style appearance rather than a bright chip — a less-broken failure mode that surfaces theme gaps without polluting the UI.

  **Visual regression possible** for any theme that relied on the light-mode fallback being visible. The fix is to bind the missing semantic tokens in your theme (theme-best-practice has always been to bind the full semantic contract; this change just makes the failure mode less catastrophic).

### Patch Changes

- 3b2622c: VI-393 docs: add `admin-shell` editorial-density showcase.

  Adds a new docs page at `/docs/blocks/admin-shell-showcase` that composes
  `AdminShell` in the admin-v7-r3 pattern — `WorkspaceSwitcher` in the `logo`
  slot, a `ChromeButton` cluster in `topbarEnd`, eyebrow-grouped nav, and a
  sidebar footer pairing `Avatar` with a trailing `Kbd` shortcut hint.

  Verification harness — no source changes to `admin-shell`. The showcase
  proves `AdminShell`'s public API already supports the full r3 editorial-density
  composition. The block's `admin-shell.visor.yaml` now carries a `preview_url`
  pointing at the showcase so the registry surfaces it.

- b9112eb: VI-397 fix: chrome-button `primary` variant falls back to `--accent-primary` before the bare hex.

  `.variantPrimary` background, color, and `:hover` background now read through a documented fallback chain:

  - `background-color: var(--interactive-primary-bg, var(--accent-primary, #111827))`
  - `color: var(--interactive-primary-text, var(--text-inverse, #f9fafb))`
  - `:hover background: var(--interactive-primary-bg-hover, color-mix(in srgb, var(--accent-primary, #111827) 85%, white))`

  Themes that bind only `--accent-primary` (not the full `--interactive-primary-*` set) now correctly inherit the brand accent on primary chrome-buttons instead of falling through to a hardcoded `#111827`. Byte-for-byte unchanged for themes that bind `--interactive-primary-bg` explicitly.

- 6b760c2: VI-406 fix: `data-table` group rows are non-hoverable by default.

  Group rows (`data-slot="data-table-group-row"`) are visual separators, not interactive — but the underlying `table` primitive's `tr.row:hover` rule was leaking onto them. This change does two things in coordination:

  - `components/ui/data-table/data-table.module.css` — `.groupRow` explicitly sets `background-color: transparent; cursor: default;` and overrides `:hover` to the same.
  - `components/ui/table/table.module.css` — `tr.row:hover` narrows to `tr.row:not([data-slot="data-table-group-row"]):hover` so the rule no longer applies to group rows.

  Data-row hover is byte-for-byte unchanged. Consumers no longer need `!important` overrides to suppress hover on group rows.

- abd602c: VI-409 fix: StatusBadge `scheduled` tone maps to `neutral` (was `info`).

  `STATUS_COLOR_GROUP["scheduled"]` flipped from `"info"` to `"neutral"` so the default `scheduled` rendering groups visually with `draft` under a muted treatment, matching the editorial admin baseline (admin-v7-r3). Previously rendered as a blue `info` pill, which conflicted with the typical event-status grouping where `live` is the active/colored signal and `scheduled` / `draft` are quieter.

  Consumers passing `tone="info"` explicitly to StatusBadge are unaffected. Only the default mapping for the literal string `"scheduled"` changes.

## 0.10.2

### Patch Changes

- dc9a96d: VI-368: add `--scope-prefix` option to the nextjs theme adapter.

  `visor theme apply --adapter nextjs` now accepts an optional `--scope-prefix <selector>` flag that wraps all generated CSS under the supplied selector instead of `:root`. This enables the body-class repaint pattern that `/lo-prototype-to-visor` Phase 3 prescribes, where multiple themes coexist on a page and swap via a body class (e.g. `body.blacklight-theme`).

  **Behavior when `--scope-prefix 'body.blacklight-theme'` is set:**

  - Primitives + light tokens emit under `body.blacklight-theme { ... }` instead of `:root { ... }`.
  - The manual-toggle dark block scopes to the composed selectors `body.blacklight-theme.dark`, `body.blacklight-theme.theme-dark`, `body.blacklight-theme[data-theme="dark"]` — matching the body-class + `html.dark` dual-toggle pattern used by R2's `body.entr-theme` / `body.blackout-theme`.
  - The `@media (prefers-color-scheme: dark)` block composes the prefix with the existing `:not(.light)` guards: `body.blacklight-theme:not(.light):not(.theme-light):not([data-theme="light"])`.

  **Backward compatible.** When `--scope-prefix` is omitted, output is unchanged (`:root` selectors), so existing setups continue to work without modification.

  New programmatic option `NextJSAdapterOptions.scopePrefix?: string` on `nextjsAdapter()` for callers using the adapter directly. The same prefix is threaded through `generatePrimitivesCss`, `generateLightCss`, and `generateDarkCss` via an optional `options.scopePrefix` parameter on each.

- 23bc1b1: VI-369 fix: `visor --version` now reads from the CLI's own `package.json` instead of a hardcoded string.

  The CLI entrypoint was passing a stale literal (`"0.3.0"`) to commander's `.version()`. Replaced with a runtime read of `packages/cli/package.json` via the existing ESM `fileURLToPath(import.meta.url)` + `readFileSync` pattern used elsewhere in the CLI. Added a regression test that builds the dist binary, execs `--version`, and asserts the output matches the `version` field in `package.json` — so any future drift between hardcoded and published version is caught in CI.

- Updated dependencies [dc9a96d]
- Updated dependencies [9fac26a]
  - @loworbitstudio/visor-theme-engine@0.8.0

## 0.10.1

### Patch Changes

- 70ad01f: VI-367: make mono slot @font-face loading discoverable + non-trapping.

  Closes the trap surfaced post-BO-35 where a downstream theme pinned to `@loworbitstudio/visor-theme-engine@^0.4.x` could only express `typography.mono: { family }` (the only thing 0.4 allowed), yet failed the 0.6.0 `validate-coverage` check because the mono family had no matching `@font-face`. The fix the error message pointed to — adding `source`/`org` to the mono slot — was not expressible on the consumer's pinned engine version.

  **Mono slot inherits source/org from a matching slot.** When `typography.mono.family` matches `typography.heading.family`, `typography.display.family`, or `typography.body.family` (case-insensitive) AND `typography.mono.source` is unset AND the matching slot has `source` set, mono now inherits `source`/`org` from the covering slot. Match precedence: heading → display → body. Themes that explicitly set `typography.mono.source` keep full control — inheritance only kicks in when mono's `source` is absent.

  This mirrors the existing weight-merging behavior in the font pipeline when body/display family matches heading and covers the common "mono uses the same font as body" case (e.g. Blacklight's `PP Model Mono` in both slots) without forcing every theme to repeat `source`/`org` on the mono slot.

  **Coverage error message names the version requirement.** When `validate-coverage` fails on `--font-mono`, the error now explicitly names the engine and CLI version requirement: mono-slot `source`/`org` loading requires `@loworbitstudio/visor-theme-engine ≥ 0.5.0` AND `@loworbitstudio/visor ≥ 0.10.0`. Bumping just the engine is silently insufficient because the visor CLI transitively pins its own engine copy (CLI 0.10 → engine ^0.6.0), so consumers must bump both packages together. Non-mono slots keep the shorter message.

  New export: `formatFontCoverageError(filename, declaredAt, family)` from `@loworbitstudio/visor-theme-engine`. The CLI and the docs `generate-private-themes.mjs` script use it so the version-requirement note surfaces consistently from both call sites.

  **Consumer migration — themes pinned to engine 0.4.x with a custom mono font:**

  1. Bump **both** `@loworbitstudio/visor` to `≥0.10` (CLI with engine ^0.6 pin) and `@loworbitstudio/visor-theme-engine` to `≥0.6` together.
  2. If your mono slot's family already matches another slot (heading/display/body) that has `source`/`org` set, no `.visor.yaml` change is required — the engine will inherit.
  3. Otherwise, add `source` (and `org` for `visor-fonts`) to the mono slot directly:

  ```yaml
  typography:
    mono:
      family: PP Model Mono
      weight: 400
      source: visor-fonts # or google-fonts, fontshare, local
      org: low-orbit-studio # required for visor-fonts only
  ```

  No `.visor.yaml` schema changes; no breaking behavior for themes that already pass `validate-coverage`.

- b815050: VI-370 fix: derive Typography specimen "Heading & Body" card from the heading slot, not the body slot.

  `deriveFontFamiliesFromTypography` in `blocks/design-system-specimen/specimen-data.ts` was reading `manifest.body` first when picking the slot that drives the `--font-heading` row. That precedence predates VI-355, when the docs adapter hard-aliased `--font-heading` to `var(--font-sans)`. VI-355 made the engine resolve `--font-heading` from the heading slot directly, but this derivation was never updated.

  Net effect: the Typography card has been silently labeling the heading row with `body.family` and `body.weights` ever since — even though the actual rendered CSS was correct. Most visible on themes that pair a display-style heading family with a different body family (e.g. Blacklight's heading=PP Model Plastic / body=PP Model Mono showed "PP Model Mono" on the heading card).

  Swap to heading-first (`heading ?? display ?? body`). Mono-row precedence is unchanged. Two test cases in `font-families-derivation.test.tsx` updated to assert the new behavior. Stock themes (no `weights:` in YAML) fall through to defaults unchanged.

- Updated dependencies [70ad01f]
  - @loworbitstudio/visor-theme-engine@0.7.0

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
