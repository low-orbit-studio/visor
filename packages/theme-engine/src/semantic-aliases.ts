/**
 * visor-core semantic aliases that need re-substituting at a theme scope (VI-648).
 *
 * `packages/tokens` emits its semantic layer as indirections — `--chart-1:
 * var(--color-primary-500)`, `--weight-heading: var(--font-weight-heading)` —
 * declared on `:root`.
 *
 * Custom-property substitution resolves **where the property is declared**. On
 * a `scopePrefix` theme (the VI-368 body-class repaint pattern that every
 * Blacklight theme uses) the engine emits the theme's primitives on the scope
 * selector, e.g. `body.blacklight-pro-theme`. From `:root`, a descendant's
 * value is invisible, so `var(--color-primary-500)` sees only visor-core's
 * untuned default. `body` then *inherits* the already-substituted default, and
 * the alias silently ignores the theme:
 *
 * ```
 * --font-weight-heading : 500   <- correct, emitted by the engine on the scope
 * --weight-heading      : 600   <- visor-core's :root default
 * --chart-1             : #3b82f6   <- stock blue on a monochrome theme
 * --skeleton-from       : #f3f4f6   <- light gray on a dark theme
 * ```
 *
 * The engine independently resolves 66 of visor-core's 114 aliases to concrete
 * values (`--text-*`, `--surface-*`, `--border-*`, `--interactive-*`, `--font-*`)
 * and emits those on the scope already, so they are correct. The 48 below are
 * the ones only visor-core knows how to derive. Re-declaring them on the scope
 * selector makes the substitution happen there, against the theme's own
 * primitives.
 *
 * ## Why this table lives in the engine, not in `packages/tokens`
 *
 * `packages/tokens` is the natural owner — these are its aliases. But
 * `packages/tokens` already depends on this package (its build calls
 * `generateThemeData` + `docsAdapter` to emit `dist/themes/<slug>.css`), so an
 * engine → tokens import would be a build cycle. The table therefore sits on
 * the importable side of that edge.
 *
 * It is not a hand-maintained copy. `packages/tokens` owns the authoring
 * tables in `src/tokens/semantic.ts` and this list is asserted against the
 * *emitted* `tokens.css` by `semantic-alias-coverage` — a stronger check than
 * comparing two constants, because it compares against what actually ships.
 * Adding an alias in `packages/tokens` without adding it here fails that test
 * with the missing names.
 */

/**
 * Alias name → the token it resolves through. Both written without the leading
 * `--`. Order mirrors visor-core's emission order in `tokens.css`, which keeps
 * a diff against that file readable.
 */
export const VISOR_CORE_SEMANTIC_ALIASES: Readonly<Record<string, string>> = {
  // Border — the one entry the engine's own `SemanticTokens.border` set lacks.
  "border-input": "color-neutral-200",

  // Component + layout spacing (4px grid multiples).
  "component-xs": "spacing-1",
  "component-sm": "spacing-2",
  "component-md": "spacing-4",
  "component-lg": "spacing-6",
  "component-xl": "spacing-8",
  "layout-sm": "spacing-4",
  "layout-md": "spacing-8",
  "layout-lg": "spacing-12",
  "layout-xl": "spacing-16",
  "layout-2xl": "spacing-24",
  "layout-section-padding": "spacing-24",
  "layout-section-padding-mobile": "spacing-16",

  // Typography size roles — track the theme's `typography.scale` ramp.
  "size-body": "font-size-base",
  "size-body-sm": "font-size-sm",
  "size-label": "font-size-sm",
  "size-caption": "font-size-xs",
  "size-heading-sm": "font-size-lg",
  "size-heading-md": "font-size-xl",
  "size-heading-lg": "font-size-2xl",
  "size-heading-xl": "font-size-3xl",

  // Typography weight roles — `--weight-heading` is the token VI-648 was filed on.
  "weight-body": "font-weight-body",
  "weight-label": "font-weight-medium",
  "weight-heading": "font-weight-heading",
  "weight-strong": "font-weight-bold",

  // Motion. `--motion-easing-spring` is absent because the engine emits it
  // under its own name, so it is already correct on the scope.
  "motion-duration-fast": "motion-duration-100",
  "motion-duration-normal": "motion-duration-200",
  "motion-duration-slow": "motion-duration-500",
  "motion-easing-default": "motion-easing-ease-in-out",
  "motion-easing-enter": "motion-easing-ease-out",
  "motion-easing-exit": "motion-easing-ease-in",

  // Skeleton shimmer. Resolves through *semantic* surfaces, not primitives —
  // the engine emits those in `visor-adaptive`, a later layer, which does not
  // affect substitution: `var()` reads the computed value on the element.
  "skeleton-from": "surface-muted",
  "skeleton-to": "surface-subtle",

  // Chart series.
  "chart-1": "color-primary-500",
  "chart-2": "color-success-500",
  "chart-3": "color-warning-500",
  "chart-4": "color-info-500",
  "chart-5": "color-error-500",

  // Sidebar chrome.
  "sidebar-bg": "color-neutral-50",
  "sidebar-text": "color-neutral-700",
  "sidebar-primary-bg": "color-primary-600",
  "sidebar-primary-text": "color-white",
  "sidebar-accent-bg": "color-neutral-100",
  "sidebar-accent-text": "color-neutral-900",
  "sidebar-border": "color-neutral-200",
  "sidebar-ring": "color-primary-500",
  "sidebar-text-muted": "color-neutral-500",

  // Field-attached floating panels (VI-497).
  "field-menu-bg": "surface-popover",
};

/**
 * Every custom property declared anywhere in `css`, without the leading `--`.
 *
 * Read off the generated CSS rather than the token data so the filter in
 * `generateSemanticAliasDecls` reflects what this theme *actually* emits —
 * including conditional output such as the `--font-weight-<n>` ladder, which
 * only appears when a theme declares an explicit `weights` array.
 */
export function collectDeclaredProperties(css: string): Set<string> {
  const declared = new Set<string>();
  for (const match of css.matchAll(/(^|[{;\s])--([a-zA-Z0-9-]+)\s*:/g)) {
    declared.add(match[2]);
  }
  return declared;
}

/**
 * The `--alias: var(--referent);` declarations to re-emit on a theme's scope
 * selector, given everything the theme has emitted so far.
 *
 * Filtered on both sides, so the table can never make output worse:
 *
 * - **Skip an alias the theme already declares.** The theme's own value is
 *   authoritative, and re-declaring it in `visor-semantic` would override a
 *   `visor-primitives` declaration of the same name. `--font-body` is the live
 *   case: the engine emits it as a concrete family, and re-aliasing it to
 *   `var(--font-sans)` would win the layer contest and resolve to nothing.
 * - **Skip an alias whose referent the theme does not declare.** There is then
 *   nothing to re-resolve against, and inheriting visor-core's `:root` value is
 *   the correct outcome — re-emitting would replace a working value with an
 *   invalid one.
 *
 * Returns `[]` for a `:root`-scoped theme's caller, which does not need this at
 * all: there, visor-core's aliases and the theme's primitives are declared on
 * the same element, so substitution already sees the theme's values.
 */
export function generateSemanticAliasDecls(declared: ReadonlySet<string>): string[] {
  const decls: string[] = [];
  for (const [alias, referent] of Object.entries(VISOR_CORE_SEMANTIC_ALIASES)) {
    if (declared.has(alias)) continue;
    if (!declared.has(referent)) continue;
    decls.push(`--${alias}: var(--${referent});`);
  }
  return decls;
}
