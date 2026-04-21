# Flutter adapter examples

End-to-end sample of the Visor Flutter token pipeline:

1. **`solespark.visor.yaml`** — A SoleSpark-style `.visor.yaml` theme.
2. **`solespark-ui/`** — Generated Dart package (committed so readers can inspect the output without running the CLI). Regenerate with:

    ```bash
    node packages/cli/dist/index.js theme apply \
      examples/flutter/solespark.visor.yaml \
      --adapter flutter \
      --output examples/flutter/solespark-ui
    ```

## Generated layout

```
solespark-ui/
├── pubspec.yaml
├── pubspec_overrides.yaml          # path dep on packages/visor-flutter
└── lib/
    ├── ui.dart                     # barrel (re-exports visor_core)
    └── src/
        ├── colors/visor_colors.dart   # sealed VisorColors wrapper + light/dark data
        └── theme/visor_theme.dart     # sealed VisorAppTheme wrapper
```

`VisorColors` (generated wrapper) exposes `.light` / `.dark` static getters
returning `VisorColorsData` instances — the [ThemeExtension] type from
`visor_core`.

## Testing the generated package

`solespark-ui/pubspec_overrides.yaml` points `visor_core` at the in-repo
`packages/visor-flutter/` via a path dependency, so the example runs
against the current source without needing to publish to pub.dev.

```bash
cd examples/flutter/solespark-ui
flutter pub get
flutter analyze    # must pass with zero issues
flutter test       # runs generated_theme_test.dart
```

The test suite (`test/generated_theme_test.dart`) is the canonical
runtime smoke test for the generator — if the contract between the
theme-engine adapter and `visor_core` breaks, this test catches it.
