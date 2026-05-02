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
import type { PrivateThemeEntry } from "@/lib/private-themes";

const ALL_THEME_CLASS_PATTERN = /(^|\s)[\w-]+-theme(?=\s|$)/g;

export function PrivateThemeSwitcher({ themes }: { themes: PrivateThemeEntry[] }) {
  const initial = themes[0]?.slug ?? "";
  const [active, setActive] = useState<string>(initial);

  useEffect(() => {
    if (!initial) return;
    applyPrivateTheme(initial);
  }, [initial]);

  function handleChange(value: string) {
    setActive(value);
    applyPrivateTheme(value);
  }

  const groups = groupThemes(themes);

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

function applyPrivateTheme(slug: string) {
  if (typeof document === "undefined") return;
  const body = document.body;
  body.className = body.className.replace(ALL_THEME_CLASS_PATTERN, "").trim();
  body.classList.add(`${slug}-theme`);
}

function groupThemes(themes: PrivateThemeEntry[]) {
  const map = new Map<string, PrivateThemeEntry[]>();
  for (const t of themes) {
    if (!map.has(t.group)) map.set(t.group, []);
    map.get(t.group)!.push(t);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, list]) => ({
      label,
      themes: list.slice().sort((a, b) => a.label.localeCompare(b.label)),
    }));
}
