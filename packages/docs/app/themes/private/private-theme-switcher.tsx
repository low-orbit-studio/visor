"use client";

import { useEffect, useState } from "react";
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
import { THEME_GROUPS } from "@/lib/theme-config";
import type { PrivateThemeEntry } from "@/lib/private-themes";

const ALL_THEME_CLASS_PATTERN = /(^|\s)[\w-]+-theme(?=\s|$)/g;

interface SwitcherEntry {
  slug: string;
  label: string;
  group: string;
}

export function PrivateThemeSwitcher({ themes }: { themes: PrivateThemeEntry[] }) {
  const stockEntries: SwitcherEntry[] = THEME_GROUPS.flatMap((g) =>
    g.themes.map((t) => ({ slug: t.value, label: t.label, group: g.label })),
  );
  const merged: SwitcherEntry[] = [...stockEntries, ...themes];

  const initial = themes[0]?.slug ?? stockEntries[0]?.slug ?? "";
  const [active, setActive] = useState<string>(initial);

  useEffect(() => {
    if (!initial) return;
    applyTheme(initial);
  }, [initial]);

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

function applyTheme(slug: string) {
  if (typeof document === "undefined") return;
  const body = document.body;
  body.className = body.className.replace(ALL_THEME_CLASS_PATTERN, "").trim();
  body.classList.add(`${slug}-theme`);
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
