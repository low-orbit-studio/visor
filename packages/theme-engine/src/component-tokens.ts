/**
 * Component-scoped theme-bindable token contract (VI-625).
 *
 * Visor themes have always been able to repaint the Tier-1 semantic surface
 * (`--surface-*`, `--text-*`, `--border-*`, `--interactive-*`). That is enough
 * to make an admin UI *functional*, but not enough to make it *look like one
 * thing*: nothing stopped a page inventing its own table-header treatment, its
 * own chip tracking, its own filter-bar padding. The AN-366 Fidelity-Mirror
 * retro measured the result — 247 element categories across 13 families whose
 * inconsistency traced to the substrate, not to any one component.
 *
 * This module is the answer: a **contract**, not new components. For every
 * family in the admin kit it names the component-scoped custom properties a
 * theme may bind, and — critically — the Tier-1 expression each one falls back
 * to when the theme is silent.
 *
 * ## The two invariants
 *
 * 1. **Unbound renders identically.** Every token is consumed by its component
 *    as `var(--<token>, <fallback>)` where `<fallback>` is byte-for-byte the
 *    expression that shipped before the token existed. A theme that binds
 *    nothing is pixel-identical to a theme from before this contract.
 * 2. **Bound changes everything at once.** A theme that binds a token retunes
 *    every consuming surface in one place, instead of each page re-deriving the
 *    look in local CSS.
 *
 * Both are enforced by tests, not prose — see
 * `components/ui/__tests__/component-token-contract.test.ts`.
 *
 * ## Authoring
 *
 * ```yaml
 * # my-theme.visor.yaml
 * components:
 *   table:
 *     head-height: "2.5rem"
 *     head-text-transform: uppercase
 *     head-letter-spacing: "0.06em"
 *     head-bg:
 *       light: "#f7f7f8"
 *       dark: "#141418"
 *   chip:
 *     md-font-size: "11px"
 *     letter-spacing: "0.04em"
 * ```
 *
 * A bare string binds both modes; `{ light, dark }` binds them independently.
 *
 * ## Prior art
 *
 * VI-620 / VI-621 did exactly this for the dialog substrate
 * (`--dialog-form-panel-border`, `--field-control-bg`, `--input-*`) and the
 * field language stayed consistent across all twelve modals. This extends the
 * same move to the page-level families. D3 additionally promotes the Playbook's
 * admin-ui Tier-2 treatment layer
 * (`design-prototypes/admin-ui/audits/admin-ui-theme-portability.md`) from prose
 * in an audit doc to a first-class bindable contract.
 *
 * NOTE: this module is intentionally dependency-free (pure data + types) so it
 * can be imported from the engine, from repo-root component tests, and from
 * docs tooling without pulling in the pipeline.
 */

/** A single consuming declaration of a component-scoped token. */
export interface ComponentTokenConsumer {
  /** Repo-relative path of the CSS module that reads the token. */
  file: string;
  /**
   * The exact fallback expression the component uses, i.e. the `X` in
   * `var(--token, X)`. `null` means the token is read bare (`var(--token)`)
   * because a default is supplied elsewhere — visor-core's `visor-semantic`
   * layer for the `--sidebar-*` palette roles.
   */
  fallback: string | null;
}

/** One theme-bindable, component-scoped custom property. */
export interface ComponentTokenSpec {
  /** Key under `components.<family>` in `.visor.yaml`. */
  key: string;
  /** The CSS property (or properties) the token drives — documentation only. */
  property: string;
  /** What binding this token achieves, in one line. */
  description: string;
  /**
   * Every place a Visor component reads this token. An empty array marks an
   * **emit-only role**: the engine can emit it so a generated theme carries it,
   * but the consumer is a pattern shell (the admin-ui prototype layer), not a
   * Visor component.
   */
  consumers: ComponentTokenConsumer[];
  /** Recommended value for an emit-only role, for the docs table. */
  recommended?: string;
}

/** A family of component-scoped tokens a theme can bind as a unit. */
export interface ComponentTokenFamily {
  /** Key under `components:` in `.visor.yaml`. */
  family: string;
  /**
   * Custom-property prefix. The emitted name is `--<prefix>-<key>`.
   * Every family declares one — there are no verbatim-key families.
   */
  prefix: string;
  /** One-line summary for the docs page. */
  description: string;
  tokens: ComponentTokenSpec[];
}

/** Emitted custom-property name (without the leading `--`) for a family key. */
export function componentTokenName(family: ComponentTokenFamily, key: string): string {
  return `${family.prefix}-${key}`;
}

const TABLE = "components/ui/table/table.module.css";
const DATA_TABLE = "components/ui/data-table/data-table.module.css";
const CHIP = "components/ui/chip/chip.module.css";
const BADGE = "components/ui/badge/badge.module.css";
const STATUS_BADGE = "components/ui/status-badge/status-badge.module.css";
const FILTER_BAR = "components/ui/filter-bar/filter-bar.module.css";
const PAGE_HEADER = "components/ui/page-header/page-header.module.css";
const EMPTY_STATE = "components/ui/empty-state/empty-state.module.css";
const BANNER = "components/ui/banner/banner.module.css";
const SIDEBAR = "components/ui/sidebar/sidebar.module.css";
const TABS = "components/ui/tabs/tabs.module.css";
const SKELETON = "components/ui/skeleton/skeleton.module.css";
const SPINNER = "components/ui/spinner/spinner.module.css";
const CHECKBOX = "components/ui/checkbox/checkbox.module.css";

/** Shorthand for the common single-consumer case. */
function at(file: string, fallback: string | null): ComponentTokenConsumer[] {
  return [{ file, fallback }];
}

// ─────────────────────────────────────────────────────────────────────────────
// D2 priority order — table · chip/status badge · filter bar · page header ·
// empty state · banner · sidebar/nav item · tabs · skeleton · spinner — then
// the D3 Tier-2 admin-ui treatment layer.
// ─────────────────────────────────────────────────────────────────────────────

const tableFamily: ComponentTokenFamily = {
  family: "table",
  prefix: "table",
  description:
    "Table head, row and cell treatment. The retro measured the same header cell rendered four ways across one admin app; binding this family pins it once.",
  tokens: [
    { key: "font-size", property: "font-size", description: "Base table type size.", consumers: at(TABLE, "var(--font-size-sm, 0.875rem)") },
    { key: "text-color", property: "color", description: "Base table text colour.", consumers: at(TABLE, "var(--text-primary, #111827)") },
    { key: "head-height", property: "height", description: "Header row height.", consumers: at(TABLE, "3rem") },
    { key: "head-padding-x", property: "padding-left / padding-right", description: "Header cell horizontal padding.", consumers: at(TABLE, "var(--spacing-3, 0.75rem)") },
    { key: "head-font-family", property: "font-family", description: "Header cell family — set a mono/condensed face for a chrome-style header.", consumers: at(TABLE, "inherit") },
    { key: "head-font-size", property: "font-size", description: "Header cell type size.", consumers: at(TABLE, "inherit") },
    { key: "head-font-weight", property: "font-weight", description: "Header cell weight.", consumers: at(TABLE, "var(--font-weight-medium, 500)") },
    { key: "head-letter-spacing", property: "letter-spacing", description: "Header cell tracking.", consumers: at(TABLE, "inherit") },
    { key: "head-text-transform", property: "text-transform", description: "Header cell casing — `uppercase` for the editorial admin header.", consumers: at(TABLE, "inherit") },
    { key: "head-color", property: "color", description: "Header cell text colour.", consumers: at(TABLE, "var(--text-primary, #111827)") },
    { key: "head-bg", property: "background-color", description: "Header cell fill. Sits above the shared `--dt-header-bg` surface role.", consumers: at(TABLE, "var(--dt-header-bg, transparent)") },
    { key: "row-border", property: "border-bottom", description: "Row separator (width, style and colour).", consumers: at(TABLE, "1px solid var(--border-default, #e5e7eb)") },
    { key: "row-hover-bg", property: "background-color", description: "Row hover fill.", consumers: at(TABLE, "var(--surface-muted, #f3f4f6)") },
    { key: "row-selected-bg", property: "background-color", description: "Selected-row fill.", consumers: at(TABLE, "var(--surface-muted, #f3f4f6)") },
    { key: "cell-padding", property: "padding", description: "Body cell padding.", consumers: at(TABLE, "var(--spacing-3, 0.75rem)") },
    { key: "cell-font-size", property: "font-size", description: "Body cell type size.", consumers: at(TABLE, "inherit") },
    { key: "cell-color", property: "color", description: "Body cell text colour.", consumers: at(TABLE, "var(--text-primary, #111827)") },
    { key: "cell-bg", property: "background-color", description: "Body cell fill. Sits above the shared `--dt-row-bg` surface role.", consumers: at(TABLE, "var(--dt-row-bg, transparent)") },
    { key: "cell-border-top", property: "border-top", description: "Cell hairline.", consumers: at(TABLE, "1px solid var(--hairline, transparent)") },
    { key: "footer-bg", property: "background-color", description: "Footer row fill.", consumers: at(TABLE, "var(--surface-muted, #f3f4f6)") },
    { key: "caption-color", property: "color", description: "Caption text colour.", consumers: at(TABLE, "var(--text-secondary, #6b7280)") },
  ],
};

const dataTableFamily: ComponentTokenFamily = {
  family: "data-table",
  prefix: "dt",
  description:
    "The admin-ui Tier-2 data-table surface stack (D3). Shared between the Table primitive and the DataTable shell so a list page and its table read as one surface.",
  tokens: [
    {
      key: "header-bg",
      property: "background-color",
      description: "Header-row surface tier.",
      consumers: [
        { file: TABLE, fallback: "transparent" },
        { file: DATA_TABLE, fallback: "var(--surface-card)" },
      ],
    },
    {
      key: "row-bg",
      property: "background-color",
      description: "Data-row surface tier — a hair above the page so rows track any palette.",
      consumers: [
        { file: TABLE, fallback: "transparent" },
        { file: DATA_TABLE, fallback: "color-mix(in srgb, var(--surface-page) 75%, var(--surface-card) 25%)" },
      ],
    },
    {
      key: "container-radius",
      property: "border-radius",
      description: "Table container rounding — `0` lets the consumer shell own the corners.",
      consumers: [
        { file: TABLE, fallback: "var(--radius-lg, 0.5rem)" },
        { file: DATA_TABLE, fallback: "0" },
      ],
    },
    {
      key: "container-shadow",
      property: "box-shadow",
      description: "Table container elevation.",
      consumers: [
        { file: TABLE, fallback: "var(--shadow-sm)" },
        { file: DATA_TABLE, fallback: "none" },
      ],
    },
    { key: "row-py", property: "padding-top / padding-bottom", description: "Row vertical rhythm (the density axis).", consumers: at(DATA_TABLE, "var(--spacing-3, 0.75rem)") },
    { key: "cell-px", property: "padding-left / padding-right", description: "Cell horizontal inset.", consumers: at(DATA_TABLE, "var(--spacing-5, 1.25rem)") },
    { key: "header-font-size", property: "font-size", description: "Sort-header type size.", consumers: at(DATA_TABLE, "11px") },
  ],
};

const chipFamily: ComponentTokenFamily = {
  family: "chip",
  prefix: "chip",
  description:
    "Chip / filter-pill treatment. The retro found the same mono status chip at 8.5 / 9 / 9.5 / 10 / 11px with tracking .03–.14em across nine implementations; this family is the single dial.",
  tokens: [
    { key: "radius", property: "border-radius", description: "Chip corner rounding.", consumers: at(CHIP, "var(--radius-full, 9999px)") },
    { key: "border", property: "border", description: "Chip outline.", consumers: at(CHIP, "var(--stroke-width-thin, 1px) solid var(--border-default, #e5e7eb)") },
    { key: "bg", property: "background-color", description: "Resting chip fill.", consumers: at(CHIP, "var(--surface-card, #ffffff)") },
    { key: "text-color", property: "color", description: "Chip label colour.", consumers: at(CHIP, "var(--text-primary, #111827)") },
    { key: "font-family", property: "font-family", description: "Chip label family — bind a mono face for token/ID chips.", consumers: at(CHIP, "var(--font-body, inherit)") },
    { key: "font-weight", property: "font-weight", description: "Chip label weight.", consumers: at(CHIP, "var(--font-weight-medium, 500)") },
    { key: "letter-spacing", property: "letter-spacing", description: "Chip label tracking.", consumers: at(CHIP, "inherit") },
    { key: "text-transform", property: "text-transform", description: "Chip label casing.", consumers: at(CHIP, "inherit") },
    { key: "sm-height", property: "height", description: "Small chip height.", consumers: at(CHIP, "1.5rem") },
    { key: "sm-padding-x", property: "padding", description: "Small chip horizontal padding.", consumers: at(CHIP, "var(--spacing-2, 0.5rem)") },
    { key: "sm-font-size", property: "font-size", description: "Small chip type size.", consumers: at(CHIP, "var(--font-size-xs, 0.75rem)") },
    { key: "md-height", property: "height", description: "Default chip height.", consumers: at(CHIP, "2rem") },
    { key: "md-padding-x", property: "padding", description: "Default chip horizontal padding.", consumers: at(CHIP, "var(--spacing-3, 0.75rem)") },
    { key: "md-font-size", property: "font-size", description: "Default chip type size.", consumers: at(CHIP, "var(--font-size-sm, 0.875rem)") },
    { key: "lg-height", property: "height", description: "Large chip height.", consumers: at(CHIP, "2.5rem") },
    { key: "lg-padding-x", property: "padding", description: "Large chip horizontal padding.", consumers: at(CHIP, "var(--spacing-4, 1rem)") },
    { key: "lg-font-size", property: "font-size", description: "Large chip type size.", consumers: at(CHIP, "var(--font-size-base, 1rem)") },
    { key: "selected-bg", property: "background-color", description: "Selected chip fill.", consumers: at(CHIP, "var(--surface-accent-subtle, #eff6ff)") },
    { key: "selected-border-color", property: "border-color", description: "Selected chip outline colour.", consumers: at(CHIP, "var(--surface-accent-default, #3b82f6)") },
    { key: "selected-text-color", property: "color", description: "Selected chip label colour.", consumers: at(CHIP, "var(--text-link, #2563eb)") },
  ],
};

const badgeFamily: ComponentTokenFamily = {
  family: "badge",
  prefix: "badge",
  description:
    "Badge treatment — the D3 Tier-2 `--badge-text-transform` / `-letter-spacing` / `-font-size` / `-font-weight` set, promoted from the admin-ui audit to a bindable contract.",
  tokens: [
    { key: "radius", property: "border-radius", description: "Badge corner rounding.", consumers: at(BADGE, "var(--radius-full, 9999px)") },
    { key: "border", property: "border", description: "Badge outline.", consumers: at(BADGE, "1px solid transparent") },
    { key: "font-family", property: "font-family", description: "Badge label family.", consumers: at(BADGE, "inherit") },
    { key: "font-weight", property: "font-weight", description: "Badge label weight (Tier-2: 600).", consumers: at(BADGE, "var(--font-weight-medium, 500)") },
    { key: "text-transform", property: "text-transform", description: "Badge casing (Tier-2: uppercase).", consumers: at(BADGE, "none") },
    { key: "letter-spacing", property: "letter-spacing", description: "Badge tracking (Tier-2: 0.04em).", consumers: at(BADGE, "normal") },
    {
      key: "font-size",
      property: "font-size",
      description: "Default badge type size (Tier-2: 11px). Drives both the standard and editorial-density steps.",
      consumers: [
        { file: BADGE, fallback: "var(--font-size-xs, 0.75rem)" },
        { file: BADGE, fallback: "11px" },
      ],
    },
    { key: "md-padding", property: "padding", description: "Default badge padding.", consumers: at(BADGE, "calc(var(--spacing-1, 0.25rem) / 2) var(--spacing-2, 0.5rem)") },
    { key: "md-gap", property: "gap", description: "Default badge icon gap.", consumers: at(BADGE, "var(--spacing-1, 0.25rem)") },
  ],
};

const statusBadgeFamily: ComponentTokenFamily = {
  family: "status-badge",
  prefix: "status-badge",
  description: "Status-badge indicator dot and the mono readout label. Chrome is inherited from the Badge family.",
  tokens: [
    { key: "dot-size", property: "width / height", description: "Indicator dot diameter.", consumers: at(STATUS_BADGE, "0.5rem") },
    { key: "dot-radius", property: "border-radius", description: "Indicator dot rounding — square it for a Linear-style status marker.", consumers: at(STATUS_BADGE, "var(--radius-full, 9999px)") },
    { key: "mono-font-family", property: "font-family", description: "Mono-label family.", consumers: at(STATUS_BADGE, 'var(--font-mono, "SF Mono", "Fira Code", "Fira Mono", monospace)') },
    { key: "mono-font-size", property: "font-size", description: "Mono-label type size.", consumers: at(STATUS_BADGE, "var(--text-11, 0.6875rem)") },
    { key: "mono-letter-spacing", property: "letter-spacing", description: "Mono-label tracking.", consumers: at(STATUS_BADGE, "0.02em") },
  ],
};

const filterBarFamily: ComponentTokenFamily = {
  family: "filter-bar",
  prefix: "filter-bar",
  description:
    'The operator\'s named case: "the filter bar above the table in many admin pages was pretty different from one to the next; that should be streamlined."',
  tokens: [
    { key: "bg", property: "background-color", description: "Filter-bar fill.", consumers: at(FILTER_BAR, "var(--surface-card, #ffffff)") },
    { key: "border", property: "border", description: "Filter-bar frame.", consumers: at(FILTER_BAR, "1px solid var(--border-default, #e5e7eb)") },
    { key: "radius", property: "border-radius", description: "Filter-bar corner rounding.", consumers: at(FILTER_BAR, "var(--radius-lg, 0.75rem)") },
    { key: "padding", property: "padding", description: "Filter-bar inset.", consumers: at(FILTER_BAR, "var(--spacing-3, 0.75rem) var(--spacing-4, 1rem)") },
    { key: "gap", property: "gap", description: "Vertical rhythm between the control row and the chip row.", consumers: at(FILTER_BAR, "var(--spacing-3, 0.75rem)") },
    { key: "text-color", property: "color", description: "Filter-bar text colour.", consumers: at(FILTER_BAR, "var(--text-primary, #111827)") },
    { key: "dense-padding", property: "padding", description: "Dense-variant inset.", consumers: at(FILTER_BAR, "var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem)") },
    { key: "dense-gap", property: "gap", description: "Dense-variant rhythm.", consumers: at(FILTER_BAR, "var(--spacing-2, 0.5rem)") },
    { key: "control-radius", property: "border-radius", description: "Rounding of the search input and filter triggers inside the bar.", consumers: at(FILTER_BAR, "var(--radius-md, 0.25rem)") },
    { key: "results-font-size", property: "font-size", description: "Results-count type size.", consumers: at(FILTER_BAR, "var(--font-size-sm, 0.875rem)") },
    { key: "results-color", property: "color", description: "Results-count colour.", consumers: at(FILTER_BAR, "var(--text-secondary, #6b7280)") },
  ],
};

const pageHeaderFamily: ComponentTokenFamily = {
  family: "page-header",
  prefix: "page-header",
  description: "Page-header lockup. The retro found the page title rendered five ways across one app.",
  tokens: [
    { key: "gap", property: "gap", description: "Header stack rhythm.", consumers: at(PAGE_HEADER, "var(--spacing-4, 1rem)") },
    { key: "text-color", property: "color", description: "Header text colour.", consumers: at(PAGE_HEADER, "var(--text-primary, #111827)") },
    { key: "leading-gap", property: "gap", description: "Gap between the leading media slot and the text stack.", consumers: at(PAGE_HEADER, "var(--spacing-3, 0.75rem)") },
    { key: "eyebrow-font-size", property: "font-size", description: "Eyebrow type size.", consumers: at(PAGE_HEADER, "var(--font-size-xs, 0.75rem)") },
    { key: "eyebrow-font-weight", property: "font-weight", description: "Eyebrow weight.", consumers: at(PAGE_HEADER, "var(--font-weight-semibold, 600)") },
    { key: "eyebrow-letter-spacing", property: "letter-spacing", description: "Eyebrow tracking.", consumers: at(PAGE_HEADER, "var(--letter-spacing-wide, 0.05em)") },
    { key: "eyebrow-text-transform", property: "text-transform", description: "Eyebrow casing.", consumers: at(PAGE_HEADER, "uppercase") },
    { key: "eyebrow-color", property: "color", description: "Eyebrow colour.", consumers: at(PAGE_HEADER, "var(--text-tertiary, #6b7280)") },
    {
      key: "title-family",
      property: "font-family",
      description: 'Marquee title family (`titleFamily="display"`). Falls through to the admin-ui marquee role before the theme display font.',
      consumers: at(PAGE_HEADER, "var(--admin-ui-marquee-family, var(--font-display, var(--font-family-heading, inherit)))"),
    },
    { key: "title-size", property: "font-size", description: "Marquee title size (`titleSize=\"marquee\"`).", consumers: at(PAGE_HEADER, "3.5rem") },
    { key: "title-leading", property: "line-height", description: "Title leading.", consumers: [{ file: PAGE_HEADER, fallback: "var(--line-height-tight, 1.2)" }, { file: PAGE_HEADER, fallback: "1" }] },
    { key: "title-font-size", property: "font-size", description: "Standard title size.", consumers: at(PAGE_HEADER, "var(--font-size-2xl, 1.5rem)") },
    { key: "title-font-weight", property: "font-weight", description: "Title weight.", consumers: at(PAGE_HEADER, "var(--font-weight-semibold, 600)") },
    { key: "title-letter-spacing", property: "letter-spacing", description: "Title tracking.", consumers: at(PAGE_HEADER, "var(--letter-spacing-tight, -0.01em)") },
    { key: "title-color", property: "color", description: "Title colour.", consumers: at(PAGE_HEADER, "var(--text-primary, #111827)") },
    { key: "description-font-size", property: "font-size", description: "Description type size.", consumers: at(PAGE_HEADER, "var(--font-size-sm, 0.875rem)") },
    { key: "description-color", property: "color", description: "Description colour.", consumers: at(PAGE_HEADER, "var(--text-secondary, #6b7280)") },
    { key: "actions-gap", property: "gap", description: "Gap between header action buttons.", consumers: at(PAGE_HEADER, "var(--spacing-2, 0.5rem)") },
  ],
};

const emptyStateFamily: ComponentTokenFamily = {
  family: "empty-state",
  prefix: "empty-state",
  description: "Empty-state placard — surface, icon chip and copy scale.",
  tokens: [
    { key: "radius", property: "border-radius", description: "Placard corner rounding.", consumers: at(EMPTY_STATE, "var(--radius-lg, 0.75rem)") },
    { key: "text-color", property: "color", description: "Placard base text colour.", consumers: at(EMPTY_STATE, "var(--text-secondary, #6b7280)") },
    { key: "gap", property: "gap", description: "Placard stack rhythm.", consumers: at(EMPTY_STATE, "var(--spacing-2, 0.5rem)") },
    { key: "padding", property: "padding", description: "Default-size placard inset.", consumers: at(EMPTY_STATE, "var(--spacing-8, 2rem) var(--spacing-5, 1.25rem)") },
    { key: "bg", property: "background-color", description: "Default-tone fill.", consumers: at(EMPTY_STATE, "var(--surface-muted, #f9fafb)") },
    { key: "border", property: "border", description: "Default-tone frame (dashed by default).", consumers: at(EMPTY_STATE, "1px dashed var(--border-default, #e5e7eb)") },
    { key: "icon-size", property: "width / height", description: "Icon-chip diameter.", consumers: at(EMPTY_STATE, "72px") },
    { key: "icon-radius", property: "border-radius", description: "Icon-chip rounding.", consumers: at(EMPTY_STATE, "var(--radius-full, 9999px)") },
    { key: "icon-bg", property: "background-color", description: "Icon-chip fill.", consumers: at(EMPTY_STATE, "var(--surface-subtle, #f5f5f6)") },
    { key: "icon-color", property: "color", description: "Icon-chip glyph colour.", consumers: at(EMPTY_STATE, "var(--text-tertiary, #6b7280)") },
    { key: "heading-font-family", property: "font-family", description: "Heading family.", consumers: at(EMPTY_STATE, "var(--font-family-heading, inherit)") },
    { key: "heading-font-size", property: "font-size", description: "Default-size heading type size.", consumers: at(EMPTY_STATE, "var(--font-size-base, 1rem)") },
    { key: "heading-font-weight", property: "font-weight", description: "Heading weight.", consumers: at(EMPTY_STATE, "var(--font-weight-semibold, 600)") },
    { key: "heading-color", property: "color", description: "Heading colour.", consumers: at(EMPTY_STATE, "var(--text-primary, #111827)") },
    { key: "description-font-size", property: "font-size", description: "Description type size.", consumers: at(EMPTY_STATE, "var(--font-size-sm, 0.875rem)") },
    { key: "description-color", property: "color", description: "Description colour.", consumers: at(EMPTY_STATE, "var(--text-secondary, #6b7280)") },
    { key: "actions-gap", property: "gap", description: "Gap between placard actions.", consumers: at(EMPTY_STATE, "var(--spacing-2, 0.5rem)") },
  ],
};

const bannerFamily: ComponentTokenFamily = {
  family: "banner",
  prefix: "banner",
  description:
    "Full-width notice bar. The retro found six separate banner systems across ~180 instances in one app; binding this family collapses them to one.",
  tokens: [
    { key: "padding", property: "padding", description: "Banner inset.", consumers: at(BANNER, "var(--spacing-3, 0.75rem) var(--spacing-4, 1rem)") },
    { key: "gap", property: "gap", description: "Gap between icon, content and actions.", consumers: at(BANNER, "var(--spacing-3, 0.75rem)") },
    { key: "font-size", property: "font-size", description: "Banner base type size.", consumers: at(BANNER, "var(--font-size-sm, 0.875rem)") },
    { key: "radius", property: "border-radius", description: "Banner corner rounding — `0` keeps the full-bleed bar.", consumers: at(BANNER, "0") },
    { key: "border-width", property: "border-bottom-width", description: "Banner rule weight.", consumers: at(BANNER, "1px") },
    { key: "shadow", property: "box-shadow", description: "Banner elevation.", consumers: at(BANNER, "var(--shadow-sm)") },
    { key: "title-font-weight", property: "font-weight", description: "Banner title weight.", consumers: at(BANNER, "var(--font-weight-semibold, 600)") },
    { key: "description-font-size", property: "font-size", description: "Banner description type size.", consumers: at(BANNER, "var(--font-size-sm, 0.875rem)") },
    { key: "info-bg", property: "background-color", description: "Info-intent fill.", consumers: at(BANNER, "var(--surface-info-subtle, transparent)") },
    { key: "info-text-color", property: "color", description: "Info-intent text colour.", consumers: at(BANNER, "var(--text-info, currentColor)") },
    { key: "info-border-color", property: "border-color", description: "Info-intent rule colour.", consumers: at(BANNER, "var(--border-info, currentColor)") },
    { key: "warning-bg", property: "background-color", description: "Warning-intent fill.", consumers: at(BANNER, "var(--surface-warning-subtle, transparent)") },
    { key: "warning-text-color", property: "color", description: "Warning-intent text colour.", consumers: at(BANNER, "var(--text-warning, currentColor)") },
    { key: "warning-border-color", property: "border-color", description: "Warning-intent rule colour.", consumers: at(BANNER, "var(--border-warning, currentColor)") },
    { key: "error-bg", property: "background-color", description: "Error-intent fill.", consumers: at(BANNER, "var(--surface-error-subtle, transparent)") },
    { key: "error-text-color", property: "color", description: "Error-intent text colour.", consumers: at(BANNER, "var(--text-error, currentColor)") },
    { key: "error-border-color", property: "border-color", description: "Error-intent rule colour.", consumers: at(BANNER, "var(--border-error, currentColor)") },
    { key: "success-bg", property: "background-color", description: "Success-intent fill.", consumers: at(BANNER, "var(--surface-success-subtle, transparent)") },
    { key: "success-text-color", property: "color", description: "Success-intent text colour.", consumers: at(BANNER, "var(--text-success, currentColor)") },
    { key: "success-border-color", property: "border-color", description: "Success-intent rule colour.", consumers: at(BANNER, "var(--border-success, currentColor)") },
  ],
};

const sidebarFamily: ComponentTokenFamily = {
  family: "sidebar",
  prefix: "sidebar",
  description:
    "Sidebar chrome and nav-item treatment. The palette roles (`bg`, `text`, `border`, `accent-*`) already ship defaults from visor-core's `visor-semantic` layer and are read bare; the structural roles below are new in VI-625.",
  tokens: [
    { key: "bg", property: "background-color", description: "Sidebar rail fill. Defaulted by visor-core.", consumers: at(SIDEBAR, null) },
    { key: "text", property: "color", description: "Sidebar text colour. Defaulted by visor-core.", consumers: at(SIDEBAR, null) },
    { key: "text-muted", property: "color", description: "Sidebar group-label colour. Defaulted by visor-core.", consumers: at(SIDEBAR, null) },
    { key: "border", property: "background-color / box-shadow", description: "Sidebar separator + rail colour. Defaulted by visor-core.", consumers: at(SIDEBAR, null) },
    { key: "accent-bg", property: "background-color", description: "Active / hover nav-item fill. Defaulted by visor-core.", consumers: at(SIDEBAR, null) },
    { key: "accent-text", property: "color", description: "Active / hover nav-item text. Defaulted by visor-core.", consumers: at(SIDEBAR, null) },
    { key: "header-padding", property: "padding", description: "Sidebar header inset.", consumers: at(SIDEBAR, "var(--spacing-2, 0.5rem)") },
    { key: "footer-padding", property: "padding", description: "Sidebar footer inset.", consumers: at(SIDEBAR, "var(--spacing-2, 0.5rem)") },
    { key: "content-padding", property: "padding", description: "Scrollable nav-area inset.", consumers: at(SIDEBAR, "var(--spacing-1, 0.25rem)") },
    { key: "menu-gap", property: "gap", description: "Gap between nav items.", consumers: at(SIDEBAR, "var(--spacing-1, 0.25rem)") },
    { key: "group-label-height", property: "height", description: "Nav group-label height.", consumers: at(SIDEBAR, "2rem") },
    { key: "group-label-font-size", property: "font-size", description: "Nav group-label type size.", consumers: at(SIDEBAR, "var(--font-size-xs, 0.75rem)") },
    { key: "group-label-font-weight", property: "font-weight", description: "Nav group-label weight.", consumers: at(SIDEBAR, "var(--font-weight-medium, 500)") },
    { key: "group-label-letter-spacing", property: "letter-spacing", description: "Nav group-label tracking.", consumers: at(SIDEBAR, "inherit") },
    { key: "group-label-text-transform", property: "text-transform", description: "Nav group-label casing.", consumers: at(SIDEBAR, "inherit") },
    { key: "item-radius", property: "border-radius", description: "Nav-item corner rounding.", consumers: at(SIDEBAR, "var(--radius-md, 0.375rem)") },
    { key: "item-gap", property: "gap", description: "Nav-item icon gap.", consumers: at(SIDEBAR, "var(--spacing-2, 0.5rem)") },
    { key: "item-font-size", property: "font-size", description: "Nav-item type size.", consumers: at(SIDEBAR, "var(--font-size-sm, 0.875rem)") },
    { key: "item-font-weight", property: "font-weight", description: "Nav-item resting weight.", consumers: at(SIDEBAR, "inherit") },
    { key: "item-letter-spacing", property: "letter-spacing", description: "Nav-item tracking.", consumers: at(SIDEBAR, "inherit") },
    { key: "item-text-transform", property: "text-transform", description: "Nav-item casing.", consumers: at(SIDEBAR, "inherit") },
    { key: "item-height", property: "height", description: "Default nav-item height.", consumers: at(SIDEBAR, "2.25rem") },
    { key: "item-padding", property: "padding", description: "Default nav-item inset.", consumers: at(SIDEBAR, "0 var(--spacing-3, 0.75rem)") },
    { key: "item-active-font-weight", property: "font-weight", description: "Active nav-item weight.", consumers: at(SIDEBAR, "var(--font-weight-medium, 500)") },
  ],
};

const tabsFamily: ComponentTokenFamily = {
  family: "tabs",
  prefix: "tabs",
  description: "Tab rail and trigger treatment, for both the segmented (`default`) and underlined (`line`) variants.",
  tokens: [
    { key: "list-radius", property: "border-radius", description: "Tab-rail corner rounding.", consumers: at(TABS, "var(--radius-full, 9999px)") },
    { key: "list-height", property: "height", description: "Tab-rail height.", consumers: at(TABS, "2.25rem") },
    { key: "list-padding", property: "padding", description: "Tab-rail inset.", consumers: at(TABS, "calc(var(--spacing-1, 0.25rem) * 0.75)") },
    { key: "list-color", property: "color", description: "Tab-rail base text colour.", consumers: at(TABS, "var(--text-secondary, #6b7280)") },
    { key: "list-bg", property: "background-color", description: "Segmented-variant rail fill.", consumers: at(TABS, "var(--surface-muted, #f3f4f6)") },
    { key: "line-border-bottom", property: "border-bottom", description: "Underlined-variant rail rule.", consumers: at(TABS, "1px solid var(--hairline, var(--border-default, #e5e7eb))") },
    { key: "trigger-radius", property: "border-radius", description: "Trigger corner rounding.", consumers: at(TABS, "var(--radius-md, 0.375rem)") },
    { key: "trigger-padding", property: "padding", description: "Trigger inset.", consumers: at(TABS, "var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem)") },
    { key: "trigger-font-size", property: "font-size", description: "Trigger type size.", consumers: at(TABS, "var(--font-size-sm, 0.875rem)") },
    { key: "trigger-font-weight", property: "font-weight", description: "Trigger weight.", consumers: at(TABS, "var(--font-weight-medium, 500)") },
    { key: "trigger-letter-spacing", property: "letter-spacing", description: "Trigger tracking.", consumers: at(TABS, "inherit") },
    { key: "trigger-text-transform", property: "text-transform", description: "Trigger casing.", consumers: at(TABS, "inherit") },
    { key: "trigger-color", property: "color", description: "Resting trigger colour.", consumers: at(TABS, "var(--text-secondary, #6b7280)") },
    { key: "trigger-active-bg", property: "background-color", description: "Active trigger fill.", consumers: at(TABS, "var(--surface-page, #ffffff)") },
    { key: "trigger-active-color", property: "color", description: "Active trigger colour.", consumers: at(TABS, "var(--text-primary, #111827)") },
    { key: "trigger-active-shadow", property: "box-shadow", description: "Active trigger elevation.", consumers: at(TABS, "var(--shadow-sm)") },
    { key: "indicator-height", property: "height", description: "Underline indicator thickness.", consumers: at(TABS, "2px") },
    { key: "indicator-color", property: "background-color", description: "Underline indicator colour.", consumers: at(TABS, "var(--text-primary, #111827)") },
  ],
};

const skeletonFamily: ComponentTokenFamily = {
  family: "skeleton",
  prefix: "skeleton",
  description: "Loading-placeholder shimmer and the content-shape geometry the admin list/table/detail skeletons use.",
  tokens: [
    { key: "from", property: "background (gradient stop)", description: "Shimmer gradient start.", consumers: at(SKELETON, "#f3f4f6") },
    { key: "to", property: "background (gradient stop)", description: "Shimmer gradient peak.", consumers: at(SKELETON, "#e5e7eb") },
    { key: "radius", property: "border-radius", description: "Default placeholder rounding.", consumers: at(SKELETON, "var(--radius-md, 0.375rem)") },
    { key: "duration", property: "animation-duration", description: "Shimmer cycle length.", consumers: at(SKELETON, "1.5s") },
    { key: "logo-width", property: "width", description: "Logo-plate placeholder width.", consumers: at(SKELETON, "104px") },
    { key: "logo-height", property: "height", description: "Logo-plate placeholder height.", consumers: at(SKELETON, "24px") },
    { key: "pill-width", property: "width", description: "Badge-pill placeholder width.", consumers: at(SKELETON, "64px") },
    { key: "pill-height", property: "height", description: "Badge-pill placeholder height.", consumers: at(SKELETON, "18px") },
    { key: "line-h1-height", property: "height", description: "Display-line placeholder height.", consumers: at(SKELETON, "24px") },
    { key: "line-heading-height", property: "height", description: "Heading-line placeholder height.", consumers: at(SKELETON, "18px") },
    { key: "line-body-height", property: "height", description: "Body-line placeholder height.", consumers: at(SKELETON, "14px") },
    { key: "avatar-size", property: "width / height", description: "Avatar placeholder diameter.", consumers: at(SKELETON, "40px") },
    { key: "avatar-lg-size", property: "width / height", description: "Large avatar placeholder diameter.", consumers: at(SKELETON, "64px") },
    { key: "badge-width", property: "width", description: "Row-badge placeholder width.", consumers: at(SKELETON, "72px") },
    { key: "badge-height", property: "height", description: "Row-badge placeholder height.", consumers: at(SKELETON, "22px") },
    { key: "row-gap", property: "gap", description: "Skeleton row gap.", consumers: at(SKELETON, "var(--spacing-3, 0.75rem)") },
    { key: "row-padding", property: "padding", description: "Skeleton row inset.", consumers: at(SKELETON, "var(--spacing-3, 0.75rem) 0") },
    { key: "row-border-bottom", property: "border-bottom", description: "Skeleton row separator.", consumers: at(SKELETON, "1px solid var(--border-default, #e5e7eb)") },
  ],
};

const spinnerFamily: ComponentTokenFamily = {
  family: "spinner",
  prefix: "spinner",
  description: "Inline loading ring — track, leading edge, per-size geometry and cycle length.",
  tokens: [
    { key: "track-color", property: "border-color", description: "Ring track colour.", consumers: at(SPINNER, "var(--border-default, #e5e7eb)") },
    { key: "edge-color", property: "border-top-color", description: "Leading-edge colour (default tone).", consumers: at(SPINNER, "var(--text-tertiary, #6b7280)") },
    { key: "primary-edge-color", property: "border-top-color", description: "Leading-edge colour (primary tone).", consumers: at(SPINNER, "var(--primary, #111827)") },
    { key: "radius", property: "border-radius", description: "Ring rounding.", consumers: at(SPINNER, "var(--radius-full, 9999px)") },
    { key: "duration", property: "animation-duration", description: "Rotation cycle length.", consumers: at(SPINNER, "var(--motion-duration-1500, 1500ms)") },
    { key: "xs-size", property: "width / height", description: "Extra-small ring diameter.", consumers: at(SPINNER, "12px") },
    { key: "xs-border-width", property: "border-width", description: "Extra-small ring stroke.", consumers: at(SPINNER, "var(--stroke-width-thin, 1px)") },
    { key: "sm-size", property: "width / height", description: "Small ring diameter.", consumers: at(SPINNER, "16px") },
    { key: "sm-border-width", property: "border-width", description: "Small ring stroke.", consumers: at(SPINNER, "var(--stroke-width-regular, 1.5px)") },
    { key: "md-size", property: "width / height", description: "Default ring diameter.", consumers: at(SPINNER, "24px") },
    { key: "md-border-width", property: "border-width", description: "Default ring stroke.", consumers: at(SPINNER, "var(--stroke-width-medium, 2px)") },
  ],
};

const checkboxFamily: ComponentTokenFamily = {
  family: "checkbox",
  prefix: "checkbox",
  description:
    "Control sizing — the D3 Tier-2 `--checkbox-size` / `-radius` / `-bg` / `-border` set, promoted from the admin-ui audit to a bindable contract.",
  tokens: [
    { key: "size", property: "width / height", description: "Checkbox box size.", consumers: at(CHECKBOX, "1rem") },
    { key: "radius", property: "border-radius", description: "Checkbox corner rounding — square it for the editorial admin look.", consumers: at(CHECKBOX, "var(--radius-sm, 0.25rem)") },
    { key: "bg", property: "background-color", description: "Unchecked fill.", consumers: at(CHECKBOX, "transparent") },
    { key: "border", property: "border", description: "Unchecked outline.", consumers: at(CHECKBOX, "1px solid var(--border-default, #e5e7eb)") },
    { key: "bg-checked", property: "background-color", description: "Checked fill.", consumers: at(CHECKBOX, "var(--interactive-primary-bg, var(--primary, #111827))") },
    { key: "border-checked", property: "border-color", description: "Checked outline colour.", consumers: at(CHECKBOX, "var(--interactive-primary-bg, var(--primary, #111827))") },
  ],
};

const adminUiFamily: ComponentTokenFamily = {
  family: "admin-ui",
  prefix: "admin-ui",
  description:
    "Structural roles the admin-ui pattern owns. `marquee-family` is the display face for KPI hero figures and marquee page titles — the role the admin-ui portability audit named as the one piece of ENTR brand coupling a new theme must rebind.",
  tokens: [
    {
      key: "marquee-family",
      property: "font-family",
      description: "Marquee / hero-figure display family.",
      consumers: at(PAGE_HEADER, "var(--font-display, var(--font-family-heading, inherit))"),
    },
  ],
};

/**
 * The full contract, in the D2 priority order the retro measured.
 *
 * Adding a family here is the ONLY registration step: the schema validator, the
 * CSS emitter, the docs page test and the fallback-parity test all read this
 * array.
 */
export const COMPONENT_TOKEN_FAMILIES: readonly ComponentTokenFamily[] = [
  tableFamily,
  dataTableFamily,
  chipFamily,
  badgeFamily,
  statusBadgeFamily,
  filterBarFamily,
  pageHeaderFamily,
  emptyStateFamily,
  bannerFamily,
  sidebarFamily,
  tabsFamily,
  skeletonFamily,
  spinnerFamily,
  checkboxFamily,
  adminUiFamily,
];

/** Family lookup by `.visor.yaml` key. */
export const COMPONENT_TOKEN_FAMILY_BY_NAME: ReadonlyMap<string, ComponentTokenFamily> = new Map(
  COMPONENT_TOKEN_FAMILIES.map((f) => [f.family, f]),
);

/** Every emitted custom-property name in the contract, without the `--`. */
export function allComponentTokenNames(): string[] {
  const names: string[] = [];
  for (const family of COMPONENT_TOKEN_FAMILIES) {
    for (const token of family.tokens) {
      names.push(componentTokenName(family, token.key));
    }
  }
  return names;
}

// ─────────────────────────────────────────────────────────────────────────────
// Authoring shape + resolution
// ─────────────────────────────────────────────────────────────────────────────

/** A binding value: one string for both modes, or per-mode values. */
export type ComponentTokenBinding = string | { light?: string; dark?: string };

/** The `components:` block of a `.visor.yaml`. */
export type ComponentTokenBindings = Record<string, Record<string, ComponentTokenBinding>>;

/** Resolved per-mode custom properties, keyed by name without the `--`. */
export interface ResolvedComponentTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * Flatten a `components:` block into per-mode `--<name>: <value>` pairs.
 *
 * Unknown families / keys are skipped — `validateComponentBindings` is the place
 * that reports them, so this stays a pure projection.
 */
export function resolveComponentBindings(
  bindings: ComponentTokenBindings | undefined,
): ResolvedComponentTokens {
  const resolved: ResolvedComponentTokens = { light: {}, dark: {} };
  if (!bindings) return resolved;

  for (const [familyName, familyBindings] of Object.entries(bindings)) {
    const family = COMPONENT_TOKEN_FAMILY_BY_NAME.get(familyName);
    if (!family || !familyBindings || typeof familyBindings !== "object") continue;

    const knownKeys = new Set(family.tokens.map((t) => t.key));
    for (const [key, value] of Object.entries(familyBindings)) {
      if (!knownKeys.has(key)) continue;
      const name = componentTokenName(family, key);
      if (typeof value === "string") {
        resolved.light[name] = value;
        resolved.dark[name] = value;
      } else if (value && typeof value === "object") {
        if (typeof value.light === "string") resolved.light[name] = value.light;
        if (typeof value.dark === "string") resolved.dark[name] = value.dark;
      }
    }
  }

  return resolved;
}

/** True when any component token is bound. */
export function hasComponentBindings(bindings: ComponentTokenBindings | undefined): boolean {
  const resolved = resolveComponentBindings(bindings);
  return Object.keys(resolved.light).length > 0 || Object.keys(resolved.dark).length > 0;
}

/**
 * Validate a `components:` block against the contract.
 *
 * Returns human-readable error strings — unknown family, unknown key, or a value
 * that is neither a string nor a `{ light, dark }` pair. An unknown key is an
 * ERROR rather than a warning on purpose: a typo'd component token is silently
 * inert at runtime (the component keeps resolving its fallback), which is
 * exactly the failure mode this contract exists to end.
 */
export function validateComponentBindings(bindings: unknown): string[] {
  const errors: string[] = [];
  if (bindings === undefined) return errors;
  if (typeof bindings !== "object" || bindings === null || Array.isArray(bindings)) {
    errors.push("'components' must be an object");
    return errors;
  }

  const knownFamilies = COMPONENT_TOKEN_FAMILIES.map((f) => f.family).join(", ");

  for (const [familyName, familyBindings] of Object.entries(bindings as Record<string, unknown>)) {
    const family = COMPONENT_TOKEN_FAMILY_BY_NAME.get(familyName);
    if (!family) {
      errors.push(`Unknown key 'components.${familyName}'. Valid keys: ${knownFamilies}`);
      continue;
    }
    if (typeof familyBindings !== "object" || familyBindings === null || Array.isArray(familyBindings)) {
      errors.push(`'components.${familyName}' must be an object`);
      continue;
    }

    const knownKeys = family.tokens.map((t) => t.key);
    for (const [key, value] of Object.entries(familyBindings as Record<string, unknown>)) {
      if (!knownKeys.includes(key)) {
        errors.push(
          `Unknown key 'components.${familyName}.${key}'. Valid keys: ${knownKeys.join(", ")}`,
        );
        continue;
      }
      if (typeof value === "string") continue;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        for (const [mode, modeValue] of Object.entries(value as Record<string, unknown>)) {
          if (mode !== "light" && mode !== "dark") {
            errors.push(
              `Unknown key 'components.${familyName}.${key}.${mode}'. Valid keys: light, dark`,
            );
          } else if (typeof modeValue !== "string") {
            errors.push(`'components.${familyName}.${key}.${mode}' must be a string`);
          }
        }
        continue;
      }
      errors.push(
        `'components.${familyName}.${key}' must be a string or an object with 'light' / 'dark' keys`,
      );
    }
  }

  return errors;
}
