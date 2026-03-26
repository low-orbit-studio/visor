/**
 * Fumadocs Adapter
 *
 * Generates the Section 4 (framework bridge) CSS that maps Visor
 * semantic tokens to fumadocs --color-fd-* custom properties.
 * Replaces the manually written bridge sections in theme CSS files.
 */

import { header } from "../generate-css.js";
import { wrapInLayer } from "./layers.js";
import { FUMADOCS_BRIDGE_MAP } from "./fumadocs-map.js";
import type { AdapterInput } from "./types.js";

/**
 * Generate fumadocs bridge CSS from theme engine output.
 *
 * Produces .dark and html:not(.dark) blocks with --color-fd-* tokens
 * wrapped in @layer visor-bridge.
 */
export function fumadocsAdapter(input: AdapterInput): string {
  const lines: string[] = [];

  lines.push(header("Visor Theme — Fumadocs Bridge"));

  const darkDecls: string[] = [];
  const lightDecls: string[] = [];

  for (const [fdToken, entry] of Object.entries(FUMADOCS_BRIDGE_MAP)) {
    const tokenMap = input.tokens[entry.category];
    const value = tokenMap?.[entry.visorToken];

    if (!value) {
      darkDecls.push(`  /* --color-${fdToken}: unmapped */`);
      lightDecls.push(`  /* --color-${fdToken}: unmapped */`);
      continue;
    }

    darkDecls.push(`  --color-${fdToken}: ${value.dark};`);
    lightDecls.push(`  --color-${fdToken}: ${value.light};`);
  }

  const bridgeCss = [
    ".dark {",
    ...darkDecls,
    "}",
    "",
    "html:not(.dark) {",
    ...lightDecls,
    "}",
  ].join("\n");

  lines.push(wrapInLayer("visor-bridge", bridgeCss));
  lines.push("");

  return lines.join("\n") + "\n";
}
