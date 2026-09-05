---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Theme-bindable component tokens for the admin-UI families (VI-625).

A Visor theme could already repaint the Tier-1 semantic surface, which is enough
to make an admin UI *functional* — but not enough to make it look like one thing.
Nothing stopped a page inventing its own table-header treatment, chip tracking or
filter-bar padding, and a fidelity retro on a shipped admin app measured the
result: the page title rendered five ways, the table header cell four ways, the
same status chip at five sizes across nine implementations.

Themes can now bind a `components:` block in `.visor.yaml`, keyed by family then
token:

```yaml
components:
  table:
    head-font-family: '"IBM Plex Mono", ui-monospace, monospace'
    head-text-transform: uppercase
    head-letter-spacing: "0.08em"
    head-bg:
      light: "#eceef1"
      dark: "#16161b"
  chip:
    radius: "4px"
    md-font-size: "11px"
```

Fifteen families ship: `table`, `data-table`, `chip`, `badge`, `status-badge`,
`filter-bar`, `page-header`, `empty-state`, `banner`, `sidebar`, `tabs`,
`skeleton`, `spinner`, `checkbox` and `admin-ui` — 206 tokens in all, including
the admin-ui pattern's Tier-2 treatment layer (badge casing/tracking, checkbox
sizing, the data-table surface stack, the marquee font role), which was previously
prose in a design audit.

**This is purely additive.** Every token is read as
`var(--token, <the Tier-1 expression that shipped before it>)`, and the engine
emits nothing at all for a theme with no `components:` block — so an existing
theme is unchanged. That is proven, not asserted: `npm run parity:component-tokens`
renders every touched CSS module in Chromium against the previous commit and
reports zero computed-style deltas across 50 probed elements in both modes, then
shows a fully-bound theme moving all 50.

Also fixes two hooks that were documented as themeable but never were:
`--page-header-title-size` / `-title-family` and `--spinner-track-color` /
`-edge-color` were *declared* on the component's own element, which outranks any
cascade layer a theme emits into. They now read the same expression as an inline
fallback — value-preserving, and genuinely bindable.
