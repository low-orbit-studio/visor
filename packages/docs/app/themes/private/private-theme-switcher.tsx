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
import { STOCK_GROUPS, applyTheme, THEME_STORAGE_KEY, type ThemeGroup } from "@/lib/theme-config";
import type { PrivateThemeEntry } from "@/lib/private-themes";

export interface SwitcherEntry {
  slug: string;
  label: string;
  group: string;
}

export function buildSwitcherEntries(
  stockGroups: ThemeGroup[],
  themes: PrivateThemeEntry[],
): SwitcherEntry[] {
  const stockEntries = stockGroups.flatMap((g) =>
    g.themes.map((t) => ({ slug: t.value, label: t.label, group: g.label })),
  );
  return [...stockEntries, ...themes];
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
    // Only re-run when the candidate set or fallback changes.
  }, [merged, fallback]);

  function handleChange(value: string) {
    setActive(value);
    applyTheme(value);
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
