"use client";

import { useEffect, useMemo, useState } from "react";
import { Palette } from "@phosphor-icons/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { STOCK_GROUPS, applyTheme, applyMode, THEME_STORAGE_KEY, COLOR_MODE_STORAGE_KEY, type ThemeGroup } from "@/lib/theme-config";
import type { PrivateThemeEntry } from "@/lib/private-themes";

export interface SwitcherEntry {
  slug: string;
  label: string;
  group: string;
  defaultMode?: "dark" | "light";
}

export function buildSwitcherEntries(
  stockGroups: ThemeGroup[],
  themes: PrivateThemeEntry[],
): SwitcherEntry[] {
  const stockEntries = stockGroups.flatMap((g) =>
    g.themes.map((t) => ({ slug: t.value, label: t.label, group: g.label, defaultMode: t.defaultMode })),
  );
  const privateEntries = themes.map((t) => ({
    slug: t.slug,
    label: t.label,
    group: t.group,
    defaultMode: t.defaultMode,
  }));
  return [...stockEntries, ...privateEntries];
}

export function PrivateThemeSwitcher({ themes }: { themes: PrivateThemeEntry[] }) {
  const merged: SwitcherEntry[] = useMemo(
    () => buildSwitcherEntries(STOCK_GROUPS, themes),
    [themes],
  );

  // Initialize with an SSR-safe fallback. localStorage is read in an effect
  // after mount so server and first-client renders match (no hydration mismatch).
  const fallback = themes[0]?.slug ?? merged[0]?.slug ?? "";
  const [active, setActive] = useState<string>(fallback);

  useEffect(() => {
    let next = fallback;
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && merged.some((e) => e.slug === stored)) next = stored;
    } catch {}
    if (!next) return;
    setActive(next);
    applyTheme(next);
    // applyTheme can't look up defaultMode for private themes (not in THEME_GROUPS).
    // Apply it here when the user has no stored color mode preference.
    const entry = merged.find((e) => e.slug === next);
    if (entry?.defaultMode) {
      let storedMode: string | null = null;
      try { storedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY); } catch {}
      if (!storedMode) applyMode(entry.defaultMode);
    }
    // Only re-run when the candidate set or fallback changes.
  }, [merged, fallback]);

  function handleChange(value: string) {
    setActive(value);
    applyTheme(value);
    // applyTheme can't look up defaultMode for private themes (not in THEME_GROUPS).
    // Apply it here when the user has no stored color mode preference.
    const entry = merged.find((e) => e.slug === value);
    if (entry?.defaultMode) {
      let storedMode: string | null = null;
      try { storedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY); } catch {}
      if (!storedMode) applyMode(entry.defaultMode);
    }
  }

  const groups = groupEntries(merged);

  return (
    <Select value={active} onValueChange={handleChange}>
      <SelectTrigger size="sm">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--spacing-2)" }}>
          <Palette size={16} weight="duotone" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.themes.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function groupEntries(entries: SwitcherEntry[]) {
  const map = new Map<string, SwitcherEntry[]>();
  for (const e of entries) {
    if (!map.has(e.group)) map.set(e.group, []);
    map.get(e.group)!.push(e);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      // "Visor" (stock) first; rest alphabetical.
      if (a === "Visor") return -1;
      if (b === "Visor") return 1;
      return a.localeCompare(b);
    })
    .map(([label, list]) => ({
      label,
      themes: list.slice().sort((a, b) => a.label.localeCompare(b.label)),
    }));
}
