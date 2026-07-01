/**
 * NextJS starter template for visor init --template nextjs.
 *
 * Provides the inputs the init command needs to scaffold a runnable
 * Borealis-native Next.js App Router project: pinned create-next-app
 * version, starter .visor.yaml, and the RootLayout source that wires
 * FOWT prevention and globals.css before first paint.
 */

import { parse as parseYaml } from "yaml"

/**
 * The three brand-lock color-scheme values a theme can declare (BO-55).
 * `color-scheme` is authoritative for which modes a theme supports and is
 * what the scaffolded root layout keys the applied mode off of.
 */
export type ColorScheme = "dark-only" | "light-only" | "adaptive"

/**
 * Pinned version of create-next-app to shell out to.
 *
 * Pinning prevents upstream scaffolder churn from silently changing the
 * shape of generated apps. Bumping this is a deliberate, trackable change —
 * not a surprise on someone's first npx call. Update by changing this
 * constant in a dedicated PR with a smoke-test of the new scaffold output.
 */
export const NEXTJS_PINNED_VERSION = "15.1.6";

/**
 * Flags passed to create-next-app. Forces npm (matches the playbook's
 * package-manager preference), TypeScript, App Router, no Tailwind (Visor
 * tokens replace it), no eslint default (consumers add their own), and the
 * `@/*` import alias that the docs assume.
 */
export const CREATE_NEXT_APP_FLAGS = [
  "--ts",
  "--app",
  "--no-tailwind",
  "--no-eslint",
  "--no-src-dir",
  "--import-alias",
  "@/*",
  "--use-npm",
] as const;

export const NEXTJS_STARTER_YAML = `\
name: my-app
version: 1
# color-scheme controls the mode the scaffold applies at the root <html>:
#   adaptive   — follow the OS via prefers-color-scheme (default)
#   dark-only  — always dark (adds className="dark" + color-scheme: dark)
#   light-only — always light
color-scheme: adaptive
colors:
  primary: "#2563EB"
`;

/**
 * Read the raw `color-scheme` field from a .visor.yaml string.
 *
 * Mirrors theme-sync's `extractDefaultMode()` parsing style: parse the YAML and
 * pull one raw field without running the full theme pipeline. Returns
 * `undefined` when the field is absent or not one of the three valid values —
 * the layout generator then falls back to adaptive (prefers-color-scheme)
 * behavior.
 */
export function extractColorScheme(yamlContent: string): ColorScheme | undefined {
  const parsed = parseYaml(yamlContent) as Record<string, unknown>;
  const v = parsed?.["color-scheme"];
  if (v === "dark-only" || v === "light-only" || v === "adaptive") return v;
  return undefined;
}

/**
 * Generates the RootLayout source for a freshly-scaffolded Visor app.
 *
 * Wires three things create-next-app's default layout doesn't:
 * - Imports ./globals.css (Visor adapter output, replaces Tailwind).
 * - Injects FOWT prevention inline in <head> so it executes before
 *   stylesheets paint and before React hydrates.
 * - Sets a placeholder html.lang and metadata that consumers customize.
 *
 * The theme's declared `color-scheme` (BO-55/56) drives the applied root mode:
 * - `adaptive` / unset → default FOWT + prefers-color-scheme (unchanged).
 * - `dark-only`  → `<html className="dark">` + inline `color-scheme: dark`
 *   + forced FOWT `defaultTheme: "dark"`, so a dark-only brand renders dark
 *   even on a light-preference browser (generalizes animal-booking PR #11).
 * - `light-only` → the inverse.
 *
 * `suppressHydrationWarning` is set for the forced-mode branches because the
 * pre-paint FOWT script mutates the class list, which can diverge from the SSR
 * markup (W-047).
 *
 * Mirrors the inline-script pattern documented in adapters.mdx.
 */
export function generateNextjsLayout(colorScheme?: ColorScheme): string {
  const forcedMode =
    colorScheme === "dark-only"
      ? "dark"
      : colorScheme === "light-only"
        ? "light"
        : undefined;

  if (forcedMode === undefined) {
    // adaptive / unset — unchanged: default FOWT falls back to prefers-color-scheme.
    return `import "./globals.css";
import { FOWT_SCRIPT } from "@loworbitstudio/visor-theme-engine/fowt";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Visor App",
  description: "Built with Visor — Low Orbit Studio's design system.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script>{FOWT_SCRIPT}</script>
      </head>
      <body>{children}</body>
    </html>
  );
}
`;
  }

  // dark-only / light-only — force the declared mode at the root before first
  // paint. The theme's own CSS also pins `color-scheme`; setting it inline on
  // <html> renders UA chrome (scrollbars, form controls) in the right mode
  // immediately, and the forced FOWT default guarantees the class matches.
  return `import "./globals.css";
import { generateFowtScript } from "@loworbitstudio/visor-theme-engine/fowt";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Visor App",
  description: "Built with Visor — Low Orbit Studio's design system.",
};

// Theme declares \`color-scheme: ${colorScheme}\` — force ${forcedMode} at the root.
const FOWT_SCRIPT = generateFowtScript({ defaultTheme: "${forcedMode}" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="${forcedMode}"
      style={{ colorScheme: "${forcedMode}" }}
      suppressHydrationWarning
    >
      <head>
        <script>{FOWT_SCRIPT}</script>
      </head>
      <body>{children}</body>
    </html>
  );
}
`;
}
