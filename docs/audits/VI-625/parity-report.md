# VI-625 — component-token parity proof

Base ref: `origin/main` · modules: 14 · probes rendered in Chromium at 2x.

`unbound__{mode}.png` and `bound__{mode}.png` are the two-theme side-by-side:
identical markup, no local CSS, one theme binding nothing and one binding the
whole contract.

## D4a — unbound is identical to origin/main (light)

No computed-style delta on any probe.

## D4b — the fully-bound theme moves every surface (light)

566 computed-style deltas across 50 of 50 probed elements.

## Operator side-by-side — editorial-admin theme (light)

`unbound__light.png` vs `editorial__light.png`: 283 computed-style deltas across 45 of 50 probed elements, from `editorial-admin.visor.yaml` alone — same markup, no local CSS.

## D4a — unbound is identical to origin/main (dark)

No computed-style delta on any probe.

## D4b — the fully-bound theme moves every surface (dark)

566 computed-style deltas across 50 of 50 probed elements.

## Operator side-by-side — editorial-admin theme (dark)

`unbound__dark.png` vs `editorial__dark.png`: 283 computed-style deltas across 45 of 50 probed elements, from `editorial-admin.visor.yaml` alone — same markup, no local CSS.
