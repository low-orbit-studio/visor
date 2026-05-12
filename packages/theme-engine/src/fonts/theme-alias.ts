/**
 * Per-theme font-family aliasing — substrate fix for VI-354.
 *
 * `@font-face` declarations are global to the document, so co-loaded themes
 * that share a font family with differing per-theme properties (e.g.
 * `size-adjust`) silently overwrite each other. Aliasing each theme's
 * `@font-face` family as `{family} [{slug}]` scopes the declaration to
 * that theme only; the theme's `--font-*` vars then list the alias first
 * with the bare family as a fallback for graceful degradation.
 *
 * Lives in `fonts/` (not `adapters/`) because every adapter that emits
 * visor-fonts `@font-face` blocks needs the same aliasing rules. Sharing
 * the helpers prevents drift between adapters.
 */

/**
 * Map of `bare family name → aliased family name` for every family the
 * theme emits as a per-theme `@font-face`. The alias applies to every
 * `--font-*` whose family matches an entry, regardless of which slot the
 * var represents (the bug repro in VI-354 hinges on this for --font-mono,
 * which can resolve to the same family as heading/body but doesn't carry
 * the visor-fonts source through `resolveConfig`).
 */
export type AliasedFamilies = ReadonlyMap<string, string>;

/** An empty alias map — used as the default when no aliasing is needed. */
export const EMPTY_ALIASES: AliasedFamilies = new Map();

/**
 * Build a per-theme aliased font-family name. The brackets are literal in
 * CSS strings (no escaping needed); the slug ensures uniqueness across
 * co-loaded themes.
 */
export function aliasFamily(family: string, themeSlug: string): string {
  return `${family} [${themeSlug}]`;
}

/**
 * Build the `--font-*` value: aliased name first (when the bare family
 * was emitted with an alias), then the bare family as fallback.
 *
 * Note: the bare family fallback is a graceful-degradation hint, not a
 * guarantee that the font will load — there is no `@font-face`
 * declaration for the bare family anymore. Consumer code should always
 * use `var(--font-*)` tokens rather than hardcoding the bare family.
 */
export function fontStack(bare: string, aliases: AliasedFamilies): string {
  const aliased = aliases.get(bare);
  if (!aliased) return bare;
  return `"${aliased}", "${bare}"`;
}
