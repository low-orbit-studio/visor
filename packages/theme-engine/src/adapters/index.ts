/**
 * Visor Theme Engine — Adapters
 *
 * Framework-specific transforms for theme engine output.
 * Import as: @loworbitstudio/visor-theme-engine/adapters
 */

export { nextjsAdapter } from "./nextjs.js";
export { fumadocsAdapter } from "./fumadocs.js";
export { deckAdapter } from "./deck.js";
export { docsAdapter } from "./docs.js";
export { LAYER_ORDER, wrapInLayer } from "./layers.js";
export { FUMADOCS_BRIDGE_MAP } from "./fumadocs-map.js";

export type {
  AdapterInput,
  AdapterOptions,
  AdapterName,
  NextJSAdapterOptions,
  DeckAdapterOptions,
  DocsAdapterOptions,
} from "./types.js";

export type { FumadocsBridgeEntry } from "./fumadocs-map.js";
