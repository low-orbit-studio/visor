# Visor Widgetbook

Flutter web preview app for the Visor design system's widgets
(`VisorButton`, `VisorStatCard`, `VisorEmptyState`, `VisorSectionHeader`).

Production URL: https://widgetbook.visor.design (post-deploy)

## Local development

From the repo root:

```bash
npm run widgetbook:dev      # chrome hot-reload
npm run widgetbook:build    # produces packages/widgetbook/build/web/
npm run widgetbook:sync     # copies components/flutter/ widgets into lib/widgets/
```

The `FLUTTER` env var overrides the Flutter binary (defaults to the FVM-pinned
`~/fvm/versions/3.35.5/bin/flutter`). Falls back to `flutter` on PATH when the
FVM version isn't installed (CI case).

## How this works

- **Source widgets** live at `components/flutter/visor_*/visor_*.dart` so
  they're discoverable by the visor registry. Those files live at package
  root (not under `lib/`) because they're copy-and-own source for consumer
  projects, not a published library.
- **`scripts/sync-widgetbook-widgets.sh`** copies each widget into
  `packages/widgetbook/lib/widgets/visor_*/visor_*.dart`, making them
  importable via `package:visor_widgetbook/widgets/...`. The copy directory
  is gitignored; the source of truth is `components/flutter/`.
- **`lib/use_cases/visor_*.dart`** defines `@UseCase` builders per widget
  variant. `widgetbook_generator` codegens `lib/main.directories.g.dart`
  from these annotations via `build_runner`.
- **`lib/theme/widgetbook_theme.dart`** reuses the Visor-generated SoleSpark
  example (`examples/flutter/solespark-ui/`) as a demo theme source. When
  Widgetbook grows a theme-switcher addon, this file will load multiple
  `.visor.yaml` token sets at runtime.

## Adding a new widget

1. Add the widget source to `components/flutter/visor_<name>/visor_<name>.dart`
   + `visor_<name>.visor.yaml` + `visor_<name>_test.dart` (see
   `components/flutter/visor_button/` for reference).
2. Run `npm run widgetbook:sync`.
3. Create `packages/widgetbook/lib/use_cases/visor_<name>.dart` with at
   least one `@UseCase` annotation per public enum variant.
4. Run `npm run widgetbook:dev` to preview; `npm run validate` enforces
   use-case coverage as a pre-commit rule.

## Deployment

Vercel via GitHub Actions — see `.github/workflows/deploy-widgetbook.yml`.
The workflow installs Flutter via `subosito/flutter-action@v2`, runs
`scripts/build-widgetbook.sh`, then `vercel deploy --prebuilt`.

Required GitHub secrets:
- `VERCEL_TOKEN` — account-scoped token
- `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — captured via `vercel link`

`vercel.json` sets `Content-Security-Policy: frame-ancestors` to allow
embedding from `visor.design` (used by M4.B docs platform tabs).

## Widgetbook URL format

Deep links use slash-separated paths, not Storybook-style double-dashes:

```
https://widgetbook.visor.design/?path=components/visor-button/primary
```

(Not `?path=/story/visor-button--primary` — that's Storybook syntax.)

## Gotchas

- **Codegen output is gitignored** (`lib/main.directories.g.dart`). Run
  `dart run build_runner build --delete-conflicting-outputs` before
  `flutter run`.
- **`widgetbook` and `widgetbook_generator` versions must match** on major
  + minor. Bump in lockstep in `pubspec.yaml`.
- **The `main.directories.g.dart` filename** follows the `@App()`-annotated
  file — here `main.dart` produces `main.directories.g.dart`, not
  `widgetbook.directories.g.dart`.
