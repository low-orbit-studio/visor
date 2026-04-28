/**
 * NextJS starter template for visor init --template nextjs.
 *
 * Provides the inputs the init command needs to scaffold a runnable
 * Borealis-native Next.js App Router project: pinned create-next-app
 * version, starter .visor.yaml, and the RootLayout source that wires
 * FOWT prevention and globals.css before first paint.
 */

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
colors:
  primary: "#2563EB"
`;

/**
 * Generates the RootLayout source for a freshly-scaffolded Visor app.
 *
 * Wires three things create-next-app's default layout doesn't:
 * - Imports ./globals.css (Visor adapter output, replaces Tailwind).
 * - Injects FOWT prevention inline in <head> so it executes before
 *   stylesheets paint and before React hydrates.
 * - Sets a placeholder html.lang and metadata that consumers customize.
 *
 * Mirrors the inline-script pattern documented in adapters.mdx.
 */
export function generateNextjsLayout(): string {
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
