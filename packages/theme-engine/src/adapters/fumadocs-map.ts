/**
 * Fumadocs Bridge Token Mapping
 *
 * Maps fumadocs --color-fd-* tokens to Visor semantic token references.
 * Used by the fumadocs adapter to auto-generate Section 4 (framework bridge)
 * of theme CSS files.
 */

export interface FumadocsBridgeEntry {
  /** The Visor semantic token name (e.g., "page", "primary") */
  visorToken: string;
  /** Which semantic token category to look up */
  category: "text" | "surface" | "border" | "interactive";
}

/**
 * Static mapping from fumadocs tokens to Visor semantic tokens.
 *
 * Reference: packages/docs/app/neutral-theme.css Section 4
 */
export const FUMADOCS_BRIDGE_MAP: Record<string, FumadocsBridgeEntry> = {
  "fd-background": { visorToken: "page", category: "surface" },
  "fd-foreground": { visorToken: "primary", category: "text" },
  "fd-card": { visorToken: "card", category: "surface" },
  "fd-card-foreground": { visorToken: "primary", category: "text" },
  "fd-border": { visorToken: "default", category: "border" },
  "fd-muted": { visorToken: "muted", category: "surface" },
  "fd-muted-foreground": { visorToken: "secondary", category: "text" },
  "fd-accent": { visorToken: "accent-default", category: "surface" },
  "fd-accent-foreground": {
    visorToken: "primary-text",
    category: "interactive",
  },
  "fd-primary": { visorToken: "accent-default", category: "surface" },
  "fd-primary-foreground": {
    visorToken: "primary-text",
    category: "interactive",
  },
  "fd-secondary": { visorToken: "muted", category: "surface" },
  "fd-secondary-foreground": { visorToken: "primary", category: "text" },
  "fd-popover": { visorToken: "card", category: "surface" },
  "fd-popover-foreground": { visorToken: "primary", category: "text" },
  "fd-ring": { visorToken: "focus", category: "border" },
};
