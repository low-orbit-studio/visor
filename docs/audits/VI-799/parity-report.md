# VI-625 — component-token parity proof

> **VI-799 round 2, expected and ruled:** the only D4a deltas are the soft neutral note's icon (24px to 32px), its box height and its text column (8px narrower). The operator's v7 review asked for the info alert to take the same icon size and text column as every other tone; that is this change. Every edged Alert probe and every other soft tone matches `origin/main` in light and dark. The script exits 1 on any delta and has no allow path, so this report is committed un-gated (Builder Default D4).

Base ref: `origin/main` · modules: 57 · probes rendered in Chromium at 2x.

`unbound__{mode}.png` and `bound__{mode}.png` are the two-theme side-by-side:
identical markup, no local CSS, one theme binding nothing and one binding the
whole contract.

## D4a — unbound is identical to origin/main (light)

- alert-soft-note · height: 24px → 32px
- alert-soft-note-icon · width: 24px → 32px
- alert-soft-note-icon · height: 24px → 32px
- alert-soft-note-description · width: 924px → 916px

## D4b — the fully-bound theme moves every surface (light)

934 computed-style deltas across 91 of 94 probed elements.

## Operator side-by-side — editorial-admin theme (light)

`unbound__light.png` vs `editorial__light.png`: 264 computed-style deltas across 45 of 94 probed elements, from `editorial-admin.visor.yaml` alone — same markup, no local CSS.

## D4a — unbound is identical to origin/main (dark)

- alert-soft-note · height: 24px → 32px
- alert-soft-note-icon · width: 24px → 32px
- alert-soft-note-icon · height: 24px → 32px
- alert-soft-note-description · width: 924px → 916px

## D4b — the fully-bound theme moves every surface (dark)

934 computed-style deltas across 91 of 94 probed elements.

## Operator side-by-side — editorial-admin theme (dark)

`unbound__dark.png` vs `editorial__dark.png`: 264 computed-style deltas across 45 of 94 probed elements, from `editorial-admin.visor.yaml` alone — same markup, no local CSS.
