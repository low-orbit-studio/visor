#!/usr/bin/env bash
# Build the Visor Widgetbook preview app as a static web bundle.
#
# Output: packages/widgetbook/build/web/ — ready for any static host. The
# CI deploy workflow (.github/workflows/deploy-widgetbook.yml) publishes
# this directory to Vercel.
#
# FLUTTER env var overrides the Flutter binary (defaults to the FVM-pinned
# version at ~/fvm/versions/3.35.5/bin/flutter).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLUTTER="${FLUTTER:-$HOME/fvm/versions/3.35.5/bin/flutter}"

# Fall back to flutter on PATH if the pinned FVM version isn't installed.
# CI does this — GH Actions installs Flutter via subosito/flutter-action to
# the default PATH rather than FVM.
if [ ! -x "$FLUTTER" ]; then
  if command -v flutter >/dev/null 2>&1; then
    FLUTTER="$(command -v flutter)"
  else
    echo "Error: Flutter not found at $FLUTTER or on PATH." >&2
    echo "Install FVM 3.35.5 (fvm install 3.35.5) or add flutter to PATH." >&2
    exit 1
  fi
fi

echo "Using Flutter: $FLUTTER"

# Sync widget source files into packages/widgetbook/lib/widgets/ so they're
# reachable via package: imports.
"$ROOT/scripts/sync-widgetbook-widgets.sh"

cd "$ROOT/packages/widgetbook"

"$FLUTTER" pub get
"$FLUTTER" pub run build_runner build --delete-conflicting-outputs
"$FLUTTER" build web --release

echo "Built: $ROOT/packages/widgetbook/build/web/"
