# @loworbitstudio/visor

CLI for the [Visor](https://visor.loworbit.studio) design system — add components, hooks, and utilities to your project.

## Installation

```bash
npx visor init
```

## Commands

| Command | Description |
|---------|-------------|
| `visor add <component>` | Copy a component into your project |
| `visor add <component> --target flutter` | Copy Flutter widget(s) + merge `visor_core` into `pubspec.yaml` |
| `visor list` | List all available components |
| `visor info <component>` | Component metadata and usage guidance |
| `visor theme sync` | Sync installed themes to latest |
| `visor tokens list` | Browse available design tokens |
| `visor doctor` | Check your Visor installation health |
| `visor diff` | See what's changed since you last updated |
| `visor suggest --for <context>` | Get component suggestions for a use case |

## Target platforms

`visor add` defaults to the React target. Pass `--target flutter` to install
copy-and-own Flutter widgets that read their tokens from the `visor_core`
pub.dev package:

```bash
cd my_flutter_app
npx visor add button stat-card empty-state section-header --target flutter
```

This writes widget sources under `config.paths.flutterComponents`
(default `lib/visor/components/`), merges `visor_core` into `pubspec.yaml`
preserving your existing deps and comments, and runs `flutter pub get` via
`flutter` on PATH or via FVM (`~/fvm/default` → highest installed version).
When the Flutter CLI can't be found, `add` finishes writing files and warns
so you can run `flutter pub get` yourself.

## Documentation

Full docs at [visor.loworbit.studio](https://visor.loworbit.studio).
