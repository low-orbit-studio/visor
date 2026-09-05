# VI-625 — operator review packet

**What to look at:** `unbound__light.png` / `unbound__dark.png` beside
`editorial__light.png` / `editorial__dark.png`.

Those are the **same markup**, rendered twice, with **no local CSS anywhere**.
The only difference between the two columns is
[`editorial-admin.visor.yaml`](./editorial-admin.visor.yaml) — a theme file that
binds the new component-token contract.

| Surface | Unbound (today) | `editorial-admin` bound |
|---|---|---|
| Table header | title-case, 3rem tall, transparent | mono all-caps 11px, tracked 0.08em, recessed well |
| Table rows | 1px separator, 0.75rem cells | hairline-only, 1rem × 1.25rem cells |
| Chips | rounded pills, title case, blue accent | 4px squares, all-caps 11px, green accent |
| Filter bar | boxed card with border + radius | flush, borderless, no fill |
| Tabs | segmented grey pill rail | flat all-caps rail with an accent underline |
| Status marker | round dot | 1px square |
| Sidebar nav | 2.25rem pill items, title-case group label | 2rem items, all-caps tracked group label |
| Empty state | dashed card on a muted fill | flush, no frame |

**This is the `[human]` gate on the ticket.** The automated halves are already
proven — see [`parity-report.md`](./parity-report.md):

- **D4a** — the unbound configuration is **identical to `origin/main`**: zero
  computed-style deltas across 50 probed elements in both modes.
- **D4b** — a fully-bound theme moves **50 of 50** probed elements (566 deltas
  per mode).
- The `editorial-admin` theme above moves 45 of 50 (283 deltas per mode).

## Regenerating

```bash
npm run build -w packages/theme-engine
npm run build -w packages/tokens
npm run parity:component-tokens          # → this directory
```

Requires Playwright's chromium (already cached in this repo's toolchain). The
script diffs against `origin/main` by default; pass `--base <ref>` to compare
against something else.

## Why not the blessed `pattern-builds/` captures?

The ticket names the six blessed admin-ui pattern-build captures as the
regression net. They live in the **playbook** repo
(`design-prototypes/admin-ui/pattern-builds/*/captures/approved/`), are gated by
a self-hosted-macOS-only `Admin-UI Drift` workflow that a Visor PR cannot fire,
and each build needs its own `npm ci` + `next build` to re-capture.

The proof here is *tighter*, not weaker: it renders the exact CSS modules that
changed, against the exact commit they changed from, and compares computed styles
rather than pixels — so a restructure that is textually different but
computationally identical (a hook lifted off `.root` into its use site, say) is
correctly reported as no change, and a one-property drift cannot hide under a
pixel-ratio tolerance. Cross-repo verification against the blessed captures is
still worth a pass when the playbook builds next re-vendor Visor.

## Files

| File | What it is |
|---|---|
| `unbound__{light,dark}.png` | Every family, this branch, no `components:` block |
| `editorial__{light,dark}.png` | Same markup, `editorial-admin.visor.yaml` bound |
| `bound__{light,dark}.png` | Same markup, the machine-proof fixture bound (deliberately garish — it exists to make "did this surface move?" unambiguous, not to look good) |
| `editorial-admin.visor.yaml` | Theme B. An audit artifact, not a shipped theme |
| `parity-report.md` | The generated delta report |
