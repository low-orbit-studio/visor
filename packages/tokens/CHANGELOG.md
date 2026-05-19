# @loworbitstudio/visor-core

## 0.8.1

### Patch Changes

- 5a57598: VI-421 fix: Borderless/light covers all surface/interactive/border tokens — closes loop on VI-420's first-run signal.

  `themes/borderless.visor.yaml`'s `overrides.light` block previously covered 10 tokens; the theme engine emitted 25 additional surface/interactive/border tokens with bright defaults (`#ffffff`, `#f5f5f5`, etc.), so any surface bound to `surface-subtle`, `surface-interactive-*`, `surface-selected`, `surface-accent-subtle`, status `-subtle`, `surface-elev-*`, `interactive-secondary-*`, `interactive-ghost-*`, or `border-disabled` rendered with bright backgrounds — and Borderless's near-white text became invisible. Exactly the leak class VI-420's new `INCOMPLETE_OVERRIDE` check flagged on first run, and the same shape as VI-417 (Blackout).

  Borderless/light now renders as a near-identical sibling of Borderless/dark, honoring the always-dark contract. All `*-border` tokens and `border-disabled` stay `transparent` to honor the "borderless" theme contract. Solid-hex values preserve Borderless's flat palette (Blackout uses rgba whites for glass; Borderless does not). Status `-default` colors stay vivid in both modes. No primitive changes; no API surface change; Borderless/dark untouched; other themes unaffected.

## 0.8.0

### Minor Changes

- fd2741c: VI-380 feat: add `right-rail-list` block — compact vertical list tuned for admin dashboard side rails.

  Each row pairs an optional `leading` slot (short label, avatar, badge, status dot), a `primary` label (typically a link), and an optional `trailing` meta value (count, value, or tone-tinted status word). Trailing carries a `data-tone` attribute and accepts `default | mint | muted | warn | danger | info` — extends r3's two-tone palette so the block pairs cleanly with the StatusDot tones landing alongside it.

  Supports `compact` density for tighter rails and an `as` prop (`ul | ol | div`) for the root element. Theme-portable: every color, size, and spacing value binds to a Visor semantic token, so the block adopts the active theme without modification. Net-new block; zero impact on existing components. Registered as `category: data-display` so `npx visor add right-rail-list` works.

- ce98322: VI-382 feat: add `StatusDot` primitive — a 6×6px tone-tinted indicator dot.

  Ships a new `components/ui/status-dot/` primitive with five tones (`mint`, `warn`, `muted`, `danger`, `info`) that resolve from Visor's saturated semantic surface tokens (`--surface-success-default`, `--surface-warning-default`, `--text-tertiary`, `--surface-error-default`, `--surface-info-default`). Reuses the same fill tokens as `StatusBadge`'s leading indicator so the two read as one coherent system across admin surfaces.

  The dot is decorative by default (`aria-hidden="true"`) — semantic status is expected to live in the adjacent label. Supplying `aria-label` flips it into a labeled image (`role="img"`) for standalone usage where no adjacent text carries the meaning.

  Composes inside `Badge`, `ActivityFeed` leading slots, and table status cells. The 6px size and circular radius are intentional and fixed — for larger callouts, use `StatusBadge` instead.

- 2149a78: VI-384 feat: `DataTable` row tone, clickable rows, and selected-row styling.

  Three additive extensions to the existing `DataTable` primitive — group rows + sticky group headers already shipped, so this ticket focuses on per-row affordances:

  1. **Selected-row CSS rule.** Wires the latent `data-state="selected"` attribute (already emitted by TanStack via `row.getIsSelected()` but unstyled) to `var(--surface-selected)`. Closes a latent bug where toggling the selection checkbox left the row visually unchanged.

  2. **`rowTone` prop.** New `(row) => "live" | "warn" | "scheduled" | "sold" | "draft" | "danger" | "info" | undefined` callback. Returns a tone key per data row; the table stamps `data-tone="<tone>"` on the `<tr>` and the CSS layer maps each tone to a Visor surface token (`--surface-success-subtle`, `--surface-warning-subtle`, `--surface-error-subtle`, `--surface-info-subtle`). `scheduled` and `draft` render on the default surface — no tint — to keep visual signal focused on actionable rows. Tone vocabulary mirrors `StatusBadge` / `StatusDot` so a row tagged `live` reads as one signal with a `live` badge inside it.

  3. **`onRowClick` prop.** Opt-in clickable-row affordance. When supplied, data rows become keyboard-activatable: `role="button"`, `tabIndex={0}`, click + Enter/Space dispatch the handler, and `data-clickable="true"` drives a hover and focus-visible affordance. The injected selection-checkbox cell stops propagation so toggling the checkbox does not also trigger the row click. When `enableRowSelection` is also on, the row keeps its semantic `tr` role (and drops `role="button"`) to satisfy WCAG nested-interactive — click and keyboard handlers still fire.

  No breaking changes. All new props are optional and inert by default. The newly-styled `data-state="selected"` rows will visually change for existing consumers using `enableRowSelection`, but the attribute was always emitted — the fix simply adds the style that was missing.

- 3c80397: VI-385 feat: add `quick-actions` primitive — vertical list of action rows pairing a left-aligned label with a right-aligned `Kbd` shortcut.

  Ports the r3 admin dashboard's "Quick" panel composition into a first-class Visor primitive. Sized for dashboard side-rail digests and command-palette previews. Display-only by default: rows render as plain `<li>` with semantic `<kbd>` chrome. Supplying `onActivate` flips rows into `role="button"` with `tabIndex={0}` and click + Enter/Space activation — mirroring the opt-in interactive pattern used elsewhere in Visor.

  Composes the existing `Kbd` primitive at `size="sm"` for each row. No new tokens — relies on `--surface-card`, `--text-secondary`, and standard spacing/font-size tokens. Registered as `category: navigation` so `npx visor add quick-actions` works.

- d79c98d: VI-387 feat: `admin-dashboard` `layout="split"` mode with `mainCol` + `sideCol` slots.

  Adds an additive 2-column body layout to the `admin-dashboard` block. The existing single-column flow (PageHeader → stat grid → optional `secondaryRegion` → activity feed) is preserved as `layout="single"` and remains the default — every current consumer renders byte-for-byte unchanged.

  When `layout="split"` is set, the block renders a 2-column body grid below the KPI strip: `mainCol` (left, primary content) and `sideCol` (right rail). The caller composes both columns — the default activity feed and `secondaryRegion` are not rendered in split mode (a dev-only `console.warn` fires if either is supplied alongside `layout="split"`).

  Two tunable CSS custom properties on the block root let themes retune the layout without touching block internals:

  - `--admin-dashboard-side-col-width` (default `320px`) — right-rail width
  - `--admin-dashboard-stack-bp` (default `960px`) — container-query breakpoint at which `sideCol` stacks below `mainCol`

  The body element exposes `data-layout="split"` for downstream styling hooks; columns expose `data-slot="admin-dashboard-main-col"` / `data-slot="admin-dashboard-side-col"`. No breaking changes — `mainCol` and `sideCol` are optional and only consulted when `layout="split"`.

- 3795ac6: VI-389 feat: `admin-list-page` adds `customFilterBar` and `footerStatus` slots.

  Two optional, additive slot props for the `admin-list-page` block:

  1. **`customFilterBar?: ReactNode`** — replaces the default `<FilterBar>` entirely. When supplied, the block renders the supplied node inside the header region (wrapped in `data-slot="admin-list-page-custom-filter-bar"`) and ignores the FilterBar-specific props (`searchValue`, `onSearchChange`, `searchPlaceholder`, `filters`, `activeFilters`, `onClearFilters`, `resultsCount`). Mixing the custom bar with any of those props logs a dev-mode `console.warn`. `hideFilterBar` still wins over both default and custom bars. Unblocks editorial-density compositions (removable chip clusters, "Add filter" pills, trailing icon buttons) that the rigid FilterBar shape cannot express.

  2. **`footerStatus?: ReactNode`** — always-on info row rendered below the table, inside the table section, wrapped in `data-slot="admin-list-page-footer-status"`. Independent of `BulkActionBar` (selection-gated, sticky/inline) — the two can coexist; `footerStatus` renders below `BulkActionBar` so the always-on info anchors the bottom of the table chrome. Typical content is a selection count, total, and Kbd hint cluster.

  No breaking changes. Both new props default to `undefined`; render output is byte-for-byte identical for any consumer not using them.

- e2431d4: VI-390 + VI-392 feat: `admin-list-page` forwards DataTable `rows` / `rowTone` / `onRowClick` and makes `data` optional.

  Three new optional pass-through props for the `admin-list-page` block plus one signature relaxation:

  1. **`rows?: DataTableRow<TData>[]`** — discriminated-union row list (`{kind:"group"|"data"}`) forwarded as-is to DataTable. Lets the block carry interleaved group headers and data rows (e.g., "Tonight / This week / Later" sections) without dropping to bare data-table. When `rows` is supplied, `data` is ignored; dev-mode `console.warn` fires if both are passed. Also forwards an optional `groupRowRenderer?: (group: DataTableGroupRow) => ReactNode` for custom group cell content.

  2. **`rowTone?: (row: TData) => DataTableRowTone | undefined`** — per-row semantic tone callback (live / warn / scheduled / sold / draft / danger / info) forwarded as-is to DataTable. Tones resolve to Visor surface tokens at the CSS layer for subtle background tinting.

  3. **`onRowClick?: (row: TData) => void`** — per-row click handler forwarded as-is to DataTable. When supplied, every data row becomes a keyboard-activatable target (click + Enter/Space). Typical use: open a detail drawer for the clicked row.

  4. **`data?: TData[]` is now optional** — the prop was previously required even when consumers supplied `rows` or rendered a custom table body. Defaults to `[]` when omitted, which yields DataTable's empty state.

  No breaking changes. All new props default to `undefined`; existing consumers that pass `data` unchanged render byte-for-byte identical output.

- c048baa: VI-391 feat: `status-badge` adds 5 admin-ui event tones — `live`, `warn`, `scheduled`, `sold`, `draft`.

  Extends the `status` prop enum with the admin-v7-r3 event vocabulary so consumers can use `StatusBadge` directly for events tables and content lifecycle UIs without rolling their own local status chips. Each new tone maps to an existing Visor semantic color group — no new tokens are introduced and existing tones are unchanged:

  - `live` → success (active/positive event)
  - `warn` → warning (needs attention)
  - `scheduled` → info (upcoming/planned)
  - `sold` → success (positive completed outcome)
  - `draft` → neutral (unpublished/muted)

  Backwards-compatible. The existing 9 statuses (`healthy`, `degraded`, `down`, `failed`, `running`, `pending`, `queued`, `idle`, `complete`) render identically.

### Patch Changes

- e8398a6: VI-417 fix: Blackout/light covers all surface/interactive/border tokens — fixes events-route white-on-white.

  `themes/blackout.visor.yaml`'s `overrides.light` block previously covered ~16 tokens; the theme engine emitted ~19 additional surface/interactive/border tokens with bright defaults (`#ffffff`, `#f5f5f5`, etc.), so any surface bound to `surface-elev-0/1/2`, `surface-selected`, status `-subtle`, `interactive-secondary-*`, `interactive-ghost-*`, or `border-disabled` rendered with bright backgrounds — and Blackout's near-white text became invisible (events-route white-on-white).

  Blackout/light now renders as a near-identical sibling of Blackout/dark — just barely lighter — across every route, honoring the always-dark contract. Status `-default` colors stay vivid in both modes. No primitive changes; no API surface change; Blackout/dark untouched; other themes unaffected.

## 0.7.0

### Minor Changes

- 177728b: VI-349 — Round-1 retrofit fixes for marketing-grade consumers.

  **Marquee** — Default `.item`/`.separator` line-height bumped from tight to normal so descenders (`g`, `y`, `p`, `q`, `j`) clear the band's overflow boundary at marketing-display sizes. Default `durationSec` bumped from 25 to 40 for a calmer scroll at display scale.

  **StationSpectrum** — Dropped the `.station:last-child` flex-end override that made dot 05 read as misaligned with 01–04. All dots now align flex-start within equal-width columns; the rail's right offset is computed from `--station-count` so the line terminates exactly at the last dot center for any `N` (verified at 3, 5, 7).

  **BentoTile (BREAKING)** — New `layout` prop with default `"stacked"`: media renders on top with its own aspect ratio, body is a sibling block below. `layout="overlay"` retains the previous body-over-media behavior. Consumers depending on the old default must pass `layout="overlay"` explicitly. Exposes `data-layout` for consumer styling hooks.

  **NameRoster** — Exposes 14 `--roster-*` CSS custom properties on `.roster` covering item typography (size, weight, letter-spacing, line-height), colors (default, hover, highlighted), dot (size, color, hover, highlighted, glow), and hover transform. Defaults resolve to the current visual output. The hardcoded `filter: brightness()` hover effect is replaced by `--roster-dot-color-hover`; consumers wanting a brightness shift use `color-mix()` against the token.

### Patch Changes

- 8f444af: Rebalance `SEMANTIC_TEXT_MAP` so the auto-derived text scale clears WCAG AA contrast by default for any reasonable input neutral. `text-secondary` now maps to neutral 700/300 (light/dark) and `text-tertiary` to neutral 600/400 — both fixed-L shades. Previously `text-tertiary` landed on neutral 400 (L 0.65), giving ~3.5:1 contrast on white and forcing every stock theme to override the entire text scale. `text-primary` (900/50) and `text-disabled` (300/600) are unchanged. Stock themes (`neutral`) drop their defensive text overrides; `modern-minimal`, `blackout`, and `space` keep theirs as intentional brand language. Borderless dark text-secondary contrast improves from 2.96:1 to 6.77:1.
- 0e6fce5: Extend `theme-text-contrast` regression rule (`scripts/rules/theme-text-contrast.ts`) to validate text-primary, text-secondary, and text-tertiary against surface-card, surface-muted, and surface-popover in addition to page background — 24 checks per theme (3 tokens × 4 surfaces × 2 modes). Surfaces with alpha (rgba) are alpha-composited over the resolved page background before the WCAG 2.1 ratio is computed; the existing `composite()` helper is reused. Catches the gray-on-gray / light-on-light failure mode that motivated this work (e.g., text-tertiary on surface-muted), which previously passed because only the page-bg pairing was checked. Stock theme YAMLs (`neutral`, `space`, `borderless`) gained narrow `surface-muted` overrides (and, for `borderless`, explicit text/surface overrides for both modes) so palette-derived elevated surfaces still clear AA. text-disabled and text-ghost remain exempt per WCAG 1.4.3.

## 0.6.0

### Minor Changes

- VI-312: Ship every `dist/*.css` file pre-wrapped in matching CSS `@layer` blocks (`visor-primitives`, `visor-semantic`, `visor-adaptive`) with a layer-order declaration prepended. Generated themes from `visor theme apply --adapter nextjs` now win the cascade against visor-core's defaults without consumer intervention. Unlayered consumer overrides written after `@import "@loworbitstudio/visor-core"` continue to win — the documented override pattern is unchanged.

## 0.5.0

### Minor Changes

- 7ec9229: Ship stock themes (blackout, modern-minimal, neutral, space) as npm subpath exports. Consumers can now `import '@loworbitstudio/visor-core/themes/blackout'` and apply the matching `.{slug}-theme` class.

## 0.4.1

### Patch Changes

- 84e3cb5: Document WCAG AA contrast ratios for text tokens and add migration note for consumers with local overrides.

## 0.2.0

### Minor Changes

- Initial release of Visor design tokens — CSS custom properties for primitives, semantic tokens, and light/dark themes.
