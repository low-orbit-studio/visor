# Docs site end-to-end tests

This directory holds the Playwright suites that exercise the docs site as a
black box. Two suites today:

| Spec | What it covers |
|------|----------------|
| `themes.spec.ts` | Per-theme visual regression on the design-system specimen. One snapshot per `(theme, mode)` pair, sourced dynamically from `lib/theme-config.ts` (stock) + `lib/private-themes.generated.ts` (private). |
| `compare.spec.ts` | Functional smoke tests for the `/compare` theme comparator — iframe wiring, URL round-trip, body-class application. No snapshots. |

## Running locally

```bash
# Run the whole suite against the local dev server.
npm run test:vr -w packages/docs

# Interactive UI mode — useful while iterating on a single spec.
npm run test:vr:ui -w packages/docs

# Update baselines after an intentional visual change.
npm run test:vr:update -w packages/docs
```

The Playwright config auto-starts `next dev` on port 4050 when no server is
already running, so you do not need a separate terminal. First run also
requires browser binaries — install them once with:

```bash
npx playwright install --with-deps chromium
```

## How per-theme VR works

`themes.spec.ts` builds its theme list at test-load time:

1. **Stock themes** come from `STOCK_GROUPS` in `lib/theme-config.ts`. A
   stock theme that declares `defaultMode` is snapshot only in that mode
   (dark-only themes like Blackout if/when that ships). The default is to
   snapshot both light and dark.
2. **Private themes** come from `PRIVATE_THEMES` in
   `lib/private-themes.generated.ts`. That file is regenerated on every
   `predev` and `prebuild` by `scripts/generate-private-themes.mjs`. When
   `@low-orbit-studio/visor-themes-private` is not installed (open-source
   self-hosters, no token) the list is empty — no private snapshots run.

Each test navigates to
`/compare/panel?theme=<slug>&mode=<mode>`, waits for the body to pick up the
`<slug>-theme` class, waits for `document.fonts.ready`, and takes a
full-page screenshot. Baselines live in
`e2e/__snapshots__/themes.spec.ts/<slug>-<mode>.png`.

The panel route is the right surface for VR because:

- It renders the full `ComparatorSpecimen` with no docs chrome around it.
- Its layout imports both the global stock theme stylesheets _and_ the
  generated `private-themes.generated.css`, so private themes render
  identically to how they look in `/themes/private`.
- The theme/mode are URL-driven, so each test owns its state with no
  cross-test leakage.

## Updating baselines

Visual changes are inevitable — every legitimate design system change updates
some pixels. The workflow:

1. Make the change (token tweak, theme update, component restyle).
2. Run `npm run test:vr -w packages/docs` and confirm the diffs in the
   generated `playwright-report/` are the ones you intended.
3. Run `npm run test:vr:update -w packages/docs` to regenerate baselines.
4. Commit the updated PNGs in the same PR as the change.

If the diff includes pixels you did **not** intend to change, that is the
regression this suite exists to catch — fix it before regenerating the
baseline.

## CI

The suite runs in `.github/workflows/ci.yml` under the `visual-regression`
job on every PR that touches `packages/docs/**` or `components/**`. A
failing snapshot fails the job, which blocks merge. On failure the run
uploads `playwright-report/` and `test-results/` as workflow artifacts so
reviewers can pull down the diff PNGs without re-running locally.

## Cross-platform font rasterization

macOS and Linux rasterize fonts slightly differently — the same TTF can
produce sub-pixel differences in glyph hinting between local dev (macOS) and
CI (Linux). `playwright.config.ts` sets a 1.5% `maxDiffPixelRatio` default,
which is wide enough to absorb that variance without masking real
regressions like a font family swap or weight change.

If a specific theme legitimately needs a different tolerance, pass it
inline:

```ts
await expect(page).toHaveScreenshot("foo.png", {
  fullPage: true,
  maxDiffPixelRatio: 0.03,
});
```

When the variance proves too tight in practice we can switch to running
Playwright inside the official Linux Docker image locally
(`mcr.microsoft.com/playwright:vX-jammy`) so local and CI baselines match
byte-for-byte. Not necessary today.
