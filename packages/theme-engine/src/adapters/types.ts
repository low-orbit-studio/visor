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

/** Supported adapter names. */
export type AdapterName = "nextjs" | "fumadocs" | "deck" | "docs";
