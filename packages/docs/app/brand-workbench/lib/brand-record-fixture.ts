// The complete Visor Brand Record (VI-563).
//
// The typed, in-app projection of docs/brand/visor-brand-record.yaml — the dogfood Brand Record the
// Export stage serializes (→ .visor.yaml `brand-strategy:` block) and renders (→ live brand book +
// agent manifest). Kept in content parity with that YAML, the canonical narrative
// (docs/brand/visor-brand-strategy.md), and the engine projection VISOR_BRAND_STRATEGY.
//
// This is the COMPLETE record (every section present) — Export requires completeness (R-EXPORT-READY /
// contracts `zExportRequest`). Live derivation that fills the record incrementally is VI-561/VI-562;
// here the preview renders the finished dogfood record, the way the other stage views render fixtures.

import type { BrandRecord } from "../../../../../spec/types"

export const VISOR_BRAND_RECORD: BrandRecord = {
  // ── Strategy: the generative core. Everything below derives from these. ──
  positioning: {
    onliness:
      "The only design system that compiles a complete brand — visual and verbal — from one portable file, for humans and agents alike.",
    category: "design system",
    differentiation:
      "brand strategy, visual and verbal, as derivable machine-readable data",
  },
  essence: ["coherent", "open", "yours"],
  personality: [
    { trait: "precise", not: "fussy" },
    { trait: "candid", not: "cold" },
    { trait: "generous", not: "indulgent" },
    { trait: "warm", not: "saccharine" },
  ],
  archetype: { primary: "sage", secondary: "creator", tertiary: "everyman" },
  pillars: [
    {
      id: "coherence",
      statement: "Every layer derives from the one above it.",
      governs: { tokens: ["--primary", "--surface-card", "--text-primary"], components: ["*"] },
      proof: [
        "Switch theme or mode and the entire surface re-resolves — nothing is pinned to a hard-coded value.",
        "Every component reads tokens, never literals: --primary flows to semantic, then adaptive, then the rendered pixel.",
        "Change one .visor.yaml file and the whole system follows — the file is the single source the cascade derives from.",
      ],
    },
    {
      id: "openness",
      statement: "The whole system is open — readable by humans and agents, and free to take.",
      governs: { surfaces: ["manifest", "cli", "component-metadata"] },
      proof: [
        "An agent can discover, select, and compose a component from structured data alone — the manifest, when_to_use metadata, and an agent-first CLI.",
        "The source is open and free to take; the same file an engineer reads is the one an agent queries.",
        "Even brand strategy ships as readable data — this record — not a locked PDF.",
      ],
    },
    {
      id: "ownership",
      statement: "Copy-and-own. You hold the source; there's no lock-in, ever.",
      governs: { components: ["*"] },
      proof: [
        "npx visor add button copies real source into your project — yours to edit, with nothing to eject from.",
        "Tokens still update via npm update, so you keep design consistency without surrendering control.",
        "Copy-and-own is the starting state, not an escape hatch — there's no wrapper to fight.",
      ],
    },
  ],
  // ── Verbal: voice is FIXED; tone FLEXES (the mode-aware half). ──
  voice: {
    traits: [
      {
        name: "plainspoken",
        do: "Say it in one clause. Lead with the answer.",
        dont: "Bury the point under qualifiers and throat-clearing.",
        example:
          "Copy-and-own is just that — the source is yours. Edit anything; there's no wrapper to fight.",
      },
      {
        name: "candid",
        do: "Name the tradeoff and the cost before the reader hits it.",
        dont: "Oversell, hide the sharp edges, or hedge to sound safe.",
        example:
          "Heads up — this theme fails WCAG AA on small text. Bump the contrast a notch, or keep the warning if that's intentional.",
      },
      {
        name: "generous",
        do: "Give the why. Show the worked example. Assume the reader will go further than you did.",
        dont: "Gatekeep, wave at best practices, or make them read the source to understand.",
        example:
          "Fallbacks use Gray, not Slate — so an un-themed component lands on a neutral that fits your palette instead of clashing. Small thing, but it's what keeps a theme feeling whole.",
      },
      {
        name: "warm",
        do: "Greet the reader like a peer you're glad to help. A little delight is welcome.",
        dont: "Go cold and transactional — or paper over it with forced cheer.",
        example: "Welcome — let's get your first theme on the screen. It takes about a minute.",
      },
    ],
  },
  tone: {
    error: {
      feeling: "warm, accountable, already holding the fix",
      example:
        "That didn't save — looks like the theme name's taken. Pick another and we'll keep everything else just as you left it.",
    },
    success: {
      feeling: "a real, small celebration — a little confetti is fine",
      example: "Saved! Your theme's live across every component — go take a look.",
    },
    empty: {
      feeling: "inviting, a friendly nudge to start",
      example:
        "Nothing here yet — let's change that. Start from a blank file, or clone one and make it yours.",
    },
    loading: {
      feeling: "unhurried and friendly, honest about the wait",
      example: "Compiling your tokens — just a moment…",
    },
    "validation-warning": {
      feeling: "a friend flagging a smell, never a scold",
      example:
        "Quick one — your primary and accent are nearly twins. Themes can read a little flat this close, so nudge one if it's not on purpose.",
    },
  },
  lexicon: [
    { use: "theme", avoid: "skin" },
    { use: "copy-and-own", avoid: "fork" },
    { use: "compose", avoid: "drag-and-drop" },
    { use: "token", avoid: "variable" },
    { use: "adapter", avoid: "plugin" },
    { use: "transform", avoid: "restyle" },
    { use: "portable", avoid: "exportable" },
  ],
  // ── Phase 2 wave-1 (VI-541): messaging house, taglines/boilerplate, color-usage. ──
  messaging: { roof: "Design intent as data — all the way up to brand." },
  taglines: ["Your entire brand system, created and encoded in one file."],
  boilerplate: {
    short:
      "Visor is an open design system that compiles a complete brand — visual and verbal — from one portable file, legible to humans and agents alike. Components are yours to copy and own; shared tokens keep every layer coherent.",
    long:
      "Visor is Low Orbit Studio's open design system, built on one idea: design intent should live as data — typed, portable, and machine-readable — from a single color token all the way up to a brand's voice. Components are copy-and-own, so `npx visor add` drops real source into your project for you to edit, while shared tokens keep design consistent across every app through `npm update`. A theme is a complete design system carried in one `.visor.yaml` file; change the file and the whole surface re-resolves, light to dark, one brand to another. And because that same file reads cleanly to people and agents alike, Visor is as legible to the engineer editing it as to the agent composing against it — coherent, open, and yours.",
  },
  colorUsage: {
    pairings: [
      {
        use: "--primary",
        with: "--surface-card / --surface-base",
        rule: "Primary is the one emphatic action per view — reserve it for the single most important action and let everything else recede to surfaces and text tokens.",
      },
      {
        use: "--accent",
        with: "--primary",
        rule: "Accent is a supporting highlight, never a second primary. Keep accent and primary visibly distinct — Visor flags them when they're near-twins, because a theme reads flat when they sit too close.",
      },
      {
        use: "--text-primary / --text-secondary",
        with: "--surface-card / --surface-base",
        rule: "Text always uses the semantic text tokens against a surface token, never raw hex, so contrast tracks the active theme instead of being pinned.",
      },
      {
        use: "--destructive",
        with: "--surface-card",
        rule: "Destructive is reserved for irreversible or error states; it is never a decorative or emphasis color.",
      },
      {
        use: "fallback neutral (Gray)",
        with: "any un-themed surface",
        rule: "Fallbacks use Gray, not Slate, so an un-themed component lands on a neutral that fits the palette instead of clashing.",
      },
    ],
  },
  accessibility: {
    standard: "WCAG 2.1 AA",
    contrast: [
      { context: "Body text and other normal-size text", ratio: "4.5:1" },
      { context: "Large text (≥ 24px, or ≥ 18.66px bold)", ratio: "3:1" },
      { context: "Non-text UI — icons, focus rings, control boundaries", ratio: "3:1" },
    ],
    intent:
      "Every stock Visor theme is meant to clear WCAG 2.1 AA against these targets. The theme validator surfaces pairings that fall short as a candid, non-blocking warning — 'this theme fails AA on small text' — so the author can bump the contrast or keep the warning if it's intentional.",
  },
  core: ["positioning", "essence", "pillars"],
  visibility: "public",
}
