/**
 * Font-weight resolution (VI-639).
 *
 * The named weight ramp used to be three literals and one role leak:
 *
 * ```
 * --font-weight-normal:   <body.weight>
 * --font-weight-medium:   500                 // literal
 * --font-weight-semibold: <heading.weight>    // a different concept entirely
 * --font-weight-bold:     700                 // literal
 * ```
 *
 * `semibold` is not a heading. Pinning it there collapsed it onto `medium` on
 * every theme whose heading weight is 500 (the Blacklight family), onto
 * `normal` where it is 400 (knowmentum), and inverted the ramp where it is
 * above `bold` (strata emitted `semibold: 800` over `bold: 700`). Meanwhile the
 * literals ignored the `weights` array a theme actually loaded, so a theme
 * declaring `[200, 400, 600, 900]` got tokens pointing at faces it never
 * fetched — which the browser then silently substituted.
 *
 * Resolution here follows the CSS font-matching algorithm's weight-selection
 * order (CSS Fonts 4 §5.2) rather than naive nearest-numeric. The browser is
 * already performing exactly this substitution at render time, so an emitted
 * token becomes the weight that was *already rendering* — which is what makes
 * this change visually neutral everywhere except where the token was wrong.
 */

/** Canonical targets for the named ramp above `normal`. */
export const WEIGHT_RAMP_TARGETS = {
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** The typography slots that can declare a family, weight and weights array. */
const SLOTS = ["heading", "display", "body", "mono"] as const;

type WeightedSlot = { weight?: number; weights?: number[] } | undefined;
type SlottedTypography = Partial<Record<(typeof SLOTS)[number], WeightedSlot>>;

/**
 * The weights a theme actually loads: each slot's explicit `weights` array, or
 * its single `weight` when it declares none — mirroring how the font pipeline
 * resolves the set it fetches.
 */
export function loadedWeights(typography: SlottedTypography): number[] {
  const set = new Set<number>();
  for (const slot of SLOTS) {
    const cfg = typography[slot];
    if (!cfg) continue;
    if (cfg.weights?.length) {
      for (const w of cfg.weights) set.add(w);
    } else if (typeof cfg.weight === "number") {
      set.add(cfg.weight);
    }
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Whether any slot declares an explicit `weights` array.
 *
 * Resolution is gated on this. A theme that declares one has told us what it
 * loads, so we can hold every emitted token to that set. A theme that hasn't
 * keeps the historical emission untouched — snapping against a set inferred
 * from three `weight` fields would move tokens on a claim the theme never made
 * (and says nothing at all about a system font stack, which has whatever the OS
 * has). `validateFontWeights` warns about those instead.
 */
export function declaresWeights(typography: SlottedTypography): boolean {
  return SLOTS.some((slot) => Boolean(typography[slot]?.weights?.length));
}

/**
 * Pick the weight a browser would actually use for `desired`, given the faces
 * the theme loaded — CSS Fonts 4 §5.2 weight-matching order:
 *
 * - exact match wins;
 * - desired 400–500: heavier faces up to 500 ascending, then lighter descending,
 *   then heavier than 500 ascending;
 * - desired below 400: lighter descending, then heavier ascending;
 * - desired above 500: heavier ascending, then lighter descending.
 *
 * Returns `desired` unchanged when the theme loads nothing (nothing to match
 * against, and the system font has its own ideas).
 */
export function matchLoadedWeight(desired: number, loaded: readonly number[]): number {
  if (loaded.length === 0) return desired;
  if (loaded.includes(desired)) return desired;

  const ascending = [...loaded].sort((a, b) => a - b);
  const lighter = ascending.filter((w) => w < desired).reverse();
  const heavier = ascending.filter((w) => w > desired);

  if (desired >= 400 && desired <= 500) {
    const upToFive = heavier.filter((w) => w <= 500);
    const aboveFive = heavier.filter((w) => w > 500);
    return upToFive[0] ?? lighter[0] ?? aboveFive[0];
  }
  if (desired < 400) {
    return lighter[0] ?? heavier[0];
  }
  return heavier[0] ?? lighter[0];
}

/** The four named ramp steps a theme emits, resolved against what it loaded. */
export interface ResolvedWeightRamp {
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

/**
 * Resolve the named ramp.
 *
 * `normal` tracks the theme's body weight rather than a hard 400 — it is the
 * ramp's zero point, and Blacklight's `body.weight: 300` is a deliberate
 * choice, not a rounding error. It is still coerced to a loaded face (strata
 * declares `body.weight: 450` and loads `[400, 700, 900]`).
 *
 * `medium / semibold / bold` resolve the canonical 500 / 600 / 700 targets.
 * Names can still share a value on a family that cannot separate them — two
 * loaded faces cannot back four distinct names — but the result is now the
 * truth about what renders rather than a number nothing will honour.
 */
export function resolveWeightRamp(typography: SlottedTypography & { body?: WeightedSlot }): ResolvedWeightRamp {
  const bodyWeight = typography.body?.weight ?? 400;
  if (!declaresWeights(typography)) {
    return {
      normal: bodyWeight,
      medium: WEIGHT_RAMP_TARGETS.medium,
      semibold: WEIGHT_RAMP_TARGETS.semibold,
      bold: WEIGHT_RAMP_TARGETS.bold,
    };
  }
  const loaded = loadedWeights(typography);
  return {
    normal: matchLoadedWeight(bodyWeight, loaded),
    medium: matchLoadedWeight(WEIGHT_RAMP_TARGETS.medium, loaded),
    semibold: matchLoadedWeight(WEIGHT_RAMP_TARGETS.semibold, loaded),
    bold: matchLoadedWeight(WEIGHT_RAMP_TARGETS.bold, loaded),
  };
}

/**
 * Resolve a role weight (`--weight-heading`, `--weight-body`,
 * `--weight-display`) to a loaded face. Roles carry theme intent — what this
 * theme's headings weigh — and are the channel components should read when they
 * mean "the heading weight" rather than "a step above medium".
 */
export function resolveRoleWeight(
  declared: number,
  typography: SlottedTypography,
): number {
  if (!declaresWeights(typography)) return declared;
  return matchLoadedWeight(declared, loadedWeights(typography));
}

/**
 * Emit the shared weight declarations: the named ramp, the role tokens, and the
 * discrete ladder.
 *
 * The ladder (`--font-weight-300` … `--font-weight-800`, one per loaded face)
 * is what makes the `weights` array authoritative instead of decorative. Before
 * it, a theme could load five faces and reach four of them by name at best —
 * Blacklight's 800 was unreachable from CSS, so BL-987 had to write a literal.
 * It follows the `--text-N` / `--space-N` discrete-alias precedent from VI-451.
 */
export function generateFontWeightDecls(typography: {
  heading: { weight: number; weights?: number[] };
  display: { weight: number; weights?: number[] };
  body: { weight: number; weights?: number[] };
  mono: { weight?: number; weights?: number[] };
}): string[] {
  const ramp = resolveWeightRamp(typography);
  const decls = [
    `--font-weight-normal: ${ramp.normal};`,
    `--font-weight-medium: ${ramp.medium};`,
    `--font-weight-semibold: ${ramp.semibold};`,
    `--font-weight-bold: ${ramp.bold};`,
    // Role primitives. These are why `semibold` was pinned in the first place:
    // packages/tokens defined `--weight-heading: var(--font-weight-semibold)`
    // and the engine emitted no per-theme value, so hijacking `semibold` was
    // the only channel a theme's heading weight had. Each role has its own
    // primitive now, and the semantic `--weight-*` roles resolve through them.
    //
    // Emitted as `--font-weight-*` primitives rather than the bare `--weight-*`
    // names on purpose: the semantic names are defined in @layer visor-semantic,
    // which wins over visor-primitives, so a theme writing them directly would
    // be overridden by the tokens package on a `:root`-scoped consumer.
    `--font-weight-heading: ${resolveRoleWeight(typography.heading.weight, typography)};`,
    `--font-weight-body: ${resolveRoleWeight(typography.body.weight, typography)};`,
    `--font-weight-display: ${resolveRoleWeight(typography.display.weight, typography)};`,
    // Retained: `--weight-display` has no competing definition in the tokens
    // package and predates this change, so consumers already reference it.
    `--weight-display: ${resolveRoleWeight(typography.display.weight, typography)};`,
  ];
  // Gated on an explicit `weights` array: that array is the theme's statement
  // of what it loads. Inferring a ladder from three `weight` fields would
  // publish a set the theme never declared, and says nothing useful about a
  // system font stack, which carries whatever the OS ships.
  if (declaresWeights(typography)) {
    for (const weight of loadedWeights(typography)) {
      decls.push(`--font-weight-${weight}: ${weight};`);
    }
  }
  return decls;
}
