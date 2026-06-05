"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, getStoredTheme } from "@/lib/theme-config";

/**
 * Props shared by every Visual Explorer section. The multi-theme surfaces — the
 * dual-pane compare (theme on the pane root) and the all-themes matrix (one
 * iframe per theme) — render several themes at once, so they thread the
 * surface's active `theme` explicitly. Brand-keyed sections resolve their brand
 * *content* from it, keeping each row/pane brand-correct rather than reading the
 * single global `localStorage` theme that every surface shares. Omitted on the
 * single-pane Explorer, where the section falls back to the stored theme (VI-521).
 */
export interface SectionProps {
  theme?: string;
}

/**
 * Resolve the active theme for a brand-keyed section. When `override` is given —
 * a surface that threads its own theme (compare pane, matrix iframe) — it wins
 * outright; otherwise the section follows the global stored theme, re-reading on
 * the Explorer's `visor-theme-change` event. `extraSlugs` widens the accepted
 * stored set to private-gallery slugs (VI-489) for the fallback path. Centralizes
 * the five near-identical per-section hooks (VI-521 D2).
 */
export function useActiveTheme(override?: string, extraSlugs: string[] = []): string {
  const [stored, setStored] = useState<string>(DEFAULT_THEME);
  const slugsKey = extraSlugs.join(",");
  useEffect(() => {
    const allowed = slugsKey ? slugsKey.split(",") : [];
    const read = () => setStored(getStoredTheme(allowed));
    read();
    document.addEventListener("visor-theme-change", read);
    return () => document.removeEventListener("visor-theme-change", read);
  }, [slugsKey]);
  return override ?? stored;
}
