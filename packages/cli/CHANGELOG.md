# Changelog

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
