#!/usr/bin/env bash
# Sync Visor Flutter widget source files into packages/widgetbook/lib/widgets/.
#
# Why: the Widgetbook preview app imports widgets via `package:` URIs, which
# requires the files live under `lib/`. The source-of-truth widgets at
# components/flutter/ live at the package root (not under lib/) because they're
# consumer copy-and-own targets, not importable libraries. This script treats
# Widgetbook like any other consumer: copies the widget files into its lib/
# tree. The copies are gitignored; the source at components/flutter/ is the
# single source of truth.
#
# Run this before any `flutter run` / `flutter build` / `dart run build_runner`
# in packages/widgetbook/. Safe to re-run; overwrites existing copies.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/components/flutter"
DEST="$ROOT/packages/widgetbook/lib/widgets"

mkdir -p "$DEST"

for widget_dir in "$SRC"/visor_*/; do
  widget_name="$(basename "$widget_dir")"
  mkdir -p "$DEST/$widget_name"
  cp "$widget_dir$widget_name.dart" "$DEST/$widget_name/$widget_name.dart"
done

echo "Synced widgets to $DEST"
