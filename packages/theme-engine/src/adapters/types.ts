/**
 * Adapter types for the Visor theme engine.
 *
 * Adapters transform the theme engine's intermediate output into
 * consumer-specific CSS for different frameworks and contexts.
 */

import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  SemanticTokens,
} from "../types.js";

/** Input provided to all adapters — the theme engine's intermediate data. */
export interface AdapterInput {
  primitives: GeneratedPrimitives;
  tokens: SemanticTokens;
  config: ResolvedThemeConfig;
}

/** Base options shared by all adapters. */
export interface AdapterOptions {
  /** Include FOWT prevention script usage comment (default: true for NextJS) */
  includeFowt?: boolean;
}

/** Options specific to the NextJS adapter. */
export interface NextJSAdapterOptions extends AdapterOptions {
  /** Include Google Fonts @import statements (default: true) */
  includeFontImports?: boolean;
}

/** Options specific to the Deck adapter. */
export interface DeckAdapterOptions extends AdapterOptions {
  /** Override the scope class name (default: .deck--{kebab-theme-name}) */
  scopeClass?: string;
}

/** Options specific to the Docs adapter. */
export interface DocsAdapterOptions extends AdapterOptions {
  /** Include font imports at the top (default: true) */
  includeFontImports?: boolean;
}

/** Options specific to the Flutter adapter. */
export interface FlutterAdapterOptions {
  /** Package name for the generated Dart package (default: "ui") */
  packageName?: string;
  /**
   * Skip full package scaffolding; emit only token files for slot-in to an
   * existing `packages/ui/` (default: false).
   */
  tokensOnly?: boolean;
  /** Emit only light-brightness theme getters (default: emit both). */
  lightOnly?: boolean;
  /** Emit only dark-brightness theme getters (default: emit both). */
  darkOnly?: boolean;
  /** Name for the generated theme class (default: "VisorAppTheme"). */
  themeClassName?: string;
  /** visor_core pub.dev version constraint (default: "^0.1.0"). */
  visorCoreVersion?: string;
}

/**
 * File-map output produced by adapters that emit a directory tree
 * (e.g. the Flutter adapter emits an entire Dart package).
 *
 * Keys are paths relative to the caller-supplied output directory;
 * values are file contents. Callers walk the map, mkdir each parent,
 * and write each file.
 */
export interface AdapterFileMap {
  files: Record<string, string>;
}

/** Narrow a union [string | AdapterFileMap] to the file-map case. */
export function isAdapterFileMap(
  output: string | AdapterFileMap,
): output is AdapterFileMap {
  return typeof output !== "string";
}

/** Supported adapter names. */
export type AdapterName =
  | "nextjs"
  | "fumadocs"
  | "deck"
  | "docs"
  | "flutter";
