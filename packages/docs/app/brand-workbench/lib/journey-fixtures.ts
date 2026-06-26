// Static journey content for the Brand Workbench stage views (VI-560).
//
// Source of truth: docs/design/brand-workbench/journey.html (the locked A→Z journey) +
// docs/brand/visor-brand-record.yaml (the dogfood Brand Record). VI-560 makes the seven stages
// navigable; the content is a faithful STATIC snapshot per stage — no AI (VI-562), no live re-resolve
// (VI-561), no real emission (VI-563). Node ids are frozen `SpineStepId`s.

import type { SpineStepId, SectionViewId } from "../../../../../spec/state-machine"

/** One spine node's display metadata (status comes live from `deriveStepStatuses`). */
export interface SpineNodeMeta {
  id: Exclude<SpineStepId, "canvas">
  title: string
  sublabel: string
}

/** A labelled spine group (journey.html eyebrows). `canvas` is the mode card, not a chain node. */
export interface SpineGroupMeta {
  label: string
  nodes: SpineNodeMeta[]
}

/** The ordered spine chain, grouped exactly as journey.html (Setup → … → Prove & Export). */
export const SPINE_LAYOUT: SpineGroupMeta[] = [
  { label: "Setup", nodes: [{ id: "start", title: "Start", sublabel: "name · public" }] },
  {
    label: "Strategy",
    nodes: [
      { id: "positioning", title: "Positioning", sublabel: "the onliness" },
      { id: "essence", title: "Essence", sublabel: "2–3 words" },
      { id: "personality", title: "Personality", sublabel: "brand-as-person" },
      { id: "pillars", title: "Pillars", sublabel: "token-linked" },
    ],
  },
  {
    label: "Verbal",
    nodes: [
      { id: "voice", title: "Voice", sublabel: "fixed traits" },
      { id: "tone", title: "Tone", sublabel: "flexed by context" },
    ],
  },
  { label: "Visual", nodes: [{ id: "visual", title: "Visual", sublabel: "color · type · marks" }] },
  {
    label: "Prove & Export",
    nodes: [
      { id: "prove", title: "Prove", sublabel: "coherence checks" },
      { id: "export", title: "Export", sublabel: ".visor.yaml + manifest" },
    ],
  },
]

/** Encouraging copy per stage (journey.html `CFG.enc`), shown in the spine progress card. */
export const STAGE_ENCOURAGEMENT: Record<SectionViewId, string> = {
  start: "Welcome — let's compile your brand. About 15 min to a complete first draft.",
  strategy: "Nice start — the hard part, your only, is locked. About 8 min to a complete draft.",
  verbal: "Over halfway. Voice is set; now make it flex.",
  visual: "Strategy and voice done — now the look falls out of them.",
  prove: "Almost there — let's make sure it all holds together.",
  export: "Done — a complete, coherent, agent-readable brand system.",
  canvas: "Complete draft. Edit any block, any order — nothing's locked.",
}

// ─── START stage (journey.html L357–383) ────────────────────────────────────

export const START_CONTENT = {
  eyebrow: "Your AI brand strategist",
  heading: "Let's compile your brand.",
  sub: "I'll interview you, draft every layer, and push back when it's not sharp enough — and you'll watch the whole system assemble itself, live on real components. No brand-strategy degree required.",
  seed: {
    title: "Seed from what you have",
    tag: "fastest",
    body: "Point me at a site, a deck, or a pile of notes. I'll read it and propose a first-draft positioning you can sharpen — so you never start from a blank page.",
    url: "visor.design",
    drop: "or drop a deck / brand notes / screenshots here",
  },
  blank: {
    title: "Start from scratch",
    body: "A blank slate. We'll build it together, one decision at a time, down the derivation chain.",
    name: "Visor",
  },
  begin: "Begin the interview",
  note: "BYOK · local-first · your strategy never leaves this machine",
} as const

// ─── VERBAL / tone-by-context (journey.html L421–452) ────────────────────────

export const VERBAL_VOICE_KEY = "plainspoken · candid · generous · warm"

/** The five tone specimens, each on a real component state. `tone` keys are the frozen ToneContext. */
export const TONE_SPECIMENS = [
  {
    tone: "error",
    feel: "warm, accountable",
    kind: "alert-error",
    body: "That didn't save — the theme name's taken. Pick another and we'll keep everything just as you left it.",
  },
  {
    tone: "success",
    feel: "a small, real celebration",
    kind: "toast",
    body: "Saved! Your theme's live across every component — go take a look.",
  },
  {
    tone: "empty",
    feel: "inviting, a friendly nudge",
    kind: "empty",
    body: "Nothing here yet — let's change that. Start from a blank file, or clone one and make it yours.",
  },
  {
    tone: "loading",
    feel: "unhurried, honest about the wait",
    kind: "loading",
    body: "Compiling your tokens…",
  },
  {
    tone: "validation-warning",
    feel: "a friend flagging a smell",
    kind: "alert-warn",
    body: "Quick one — your primary and accent are nearly twins. Themes read flat this close; nudge one if it's not on purpose.",
  },
] as const

// ─── VISUAL stage (journey.html L455–496) ────────────────────────────────────

export const VISUAL_CONTENT = {
  eyebrow: "Step 8 of 10 · Visual",
  heading: "A look that matches the strategy.",
  lede: "Your essence is coherent · open · yours and you lean Sage + Creator. I've suggested a palette and type that read precise and open — taste stays yours; nudge anything.",
  // Token-driven so the palette re-resolves with the active theme (the workbench thesis), not a
  // pinned brand hex. `value` is the inline background; `code` names the token it traces to.
  swatches: [
    { label: "primary", value: "var(--primary, #04bf81)", code: "--primary" },
    { label: "accent", value: "var(--accent, #04bf81)", code: "--accent" },
    { label: "neutral", value: "var(--text-primary, #111827)", code: "--text-primary" },
  ],
  rampNote: "one intent → 53 derived tokens",
  donts: [
    "Don't recolor the mark — it's monochrome-only off-palette.",
    "Don't pair primary with accent as equals — accent supports.",
    "Don't crowd the mark — keep clearspace ≥ its own height.",
    "Don't ship below AA — the validator will flag it.",
  ],
  typeSpecimen: "Coherent, open, yours.",
  typeNote: "Body copy renders in the same family — plainspoken and clean, generous line-height for long-form docs.",
  typeTag: "Product Sans",
  markNote: "The mark re-tints with the active theme — clearspace & min-size promoted to enforced rules.",
} as const

// ─── PROVE stage (journey.html L499–522) ─────────────────────────────────────

export const PROVE_CONTENT = {
  eyebrow: "Step 9 of 10 · Prove",
  heading: "Does the system hold together?",
  lede: "A static brand asserts; a living one proves itself against the running product — and re-proves the instant either side changes. These checks gate the export, exactly the way token drift fails CI.",
  score: 86,
  summary: "Coherent — with two things to look at",
  summarySub: "9 checks passed · 1 warning · 1 fail. Fix or accept each; nothing here blocks you.",
  counts: { pass: 9, warn: 1, fail: 1 },
  groups: [
    {
      heading: "Derivation — every layer traces upward",
      checks: [
        {
          state: "pass" as const,
          title: "Every pillar governs something real",
          description:
            "coherence → --primary, --surface-card; ownership → all components; openness → manifest + CLI. No dead pillars.",
        },
        {
          state: "pass" as const,
          title: "Voice derives from personality",
          description:
            "plainspoken ← precise; candid ← candid; generous & warm ← Everyman. Each trait is a consequence, not an assertion.",
        },
      ],
    },
    {
      heading: "Voice & copy",
      checks: [
        {
          state: "warn" as const,
          title: "One sampled string drifts from voice",
          description:
            "“Submit” on the export button reads transactional. Voice prefers a plainspoken verb — try “Compile” or “Publish”.",
          fixLabel: "Rewrite to voice",
        },
      ],
    },
    {
      heading: "Accessibility — WCAG 2.1 AA",
      checks: [
        {
          state: "fail" as const,
          title: "One pairing fails on small text",
          description:
            "--text-tertiary on --surface-subtle is 3.9:1 — below 4.5:1 for body text. Bump tertiary one step, or keep it for large text only.",
          fixLabel: "Suggest a fix",
        },
        {
          state: "pass" as const,
          title: "Primary, text, and focus rings clear AA",
          description:
            "Body 7.1:1 · large text 4.8:1 · non-text UI 3.4:1 — all above target on both light and dark.",
        },
      ],
    },
  ],
} as const

// ─── EXPORT stage (journey.html L525–564) ────────────────────────────────────

export const EXPORT_CONTENT = {
  eyebrow: "Step 10 of 10 · Export",
  heading: "Your brand system, compiled.",
  lede: "One portable file an engineer reads and an agent queries — the same way it reads a component's when_to_use. Strategy as data, not a locked PDF.",
  filename: ".visor.yaml",
  yaml: `brand-strategy:
  positioning:
    onliness: The only design system that compiles a
      brand — visual and verbal — from one file.
  essence: [coherent, open, yours]
  archetype: { primary: sage, secondary: creator }
  voice:
    traits:
      - { name: plainspoken, do: "Say it in one clause." }
      - { name: candid, do: "Name the tradeoff." }
  tone:
    error: { feeling: warm, accountable }
    success: { feeling: a small celebration }
  pillars:
    - id: coherence
      governs: { tokens: [--primary, --surface-card] }
  # validated · linked · serialized — not expanded
  visibility: public`,
  outputs: [
    {
      title: "Agent manifest",
      body: "The brand serialized to JSON under brand_strategy — every downstream agent reads your voice & tone and stays on-brand.",
    },
    {
      title: "Live brand book",
      body: "The docs surface — strategy, voice, and tone rendered on real components, re-resolving with theme & mode.",
    },
    {
      title: "Coherence gate",
      body: "Re-runs on every change — a dead pillar or AA fail breaks the build, just like token drift.",
    },
  ],
  visibility: {
    public: { label: "Public", body: "Visor's flagship — ships in the OSS docs." },
    private: { label: "Private", body: "Client brands → brand-systems-private, synced & gitignored." },
  },
  cta: "Export brand system",
} as const

// ─── CANVAS stage (journey.html L567–589) ────────────────────────────────────

export const CANVAS_CONTENT = {
  eyebrow: "Free-edit mode",
  heading: "Your brand, as a canvas.",
  lede: "Guided got you a complete draft. Canvas lets you edit any block, in any order — the AI still drafts and challenges on request, and the right-hand system re-resolves the moment you change anything.",
  banner: "Canvas mode",
  blocks: [
    { label: "Essence", value: "coherent · open · yours" },
    { label: "Positioning", value: "The only design system that compiles a brand — visual and verbal — from one file." },
    { label: "Personality", value: "precise · candid · generous · warm" },
    { label: "Pillars", value: "coherence · openness · ownership → tokens" },
    { label: "Voice", value: "plainspoken · candid · generous · warm" },
    { label: "Tone", value: "error · success · empty · loading · warning" },
    { label: "Lexicon", value: "theme not skin · compose not drag-drop · token not variable" },
    { label: "Color & type", value: "primary #04bf81 · Product Sans · 53 derived tokens" },
    { label: "Marks", value: "logo · wordmark · monochrome — re-tint on theme" },
  ],
} as const
