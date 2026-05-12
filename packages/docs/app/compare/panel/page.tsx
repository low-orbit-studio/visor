"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { ALL_THEMES } from "@/lib/theme-config";
import { PRIVATE_THEMES } from "@/lib/private-themes";
import { ComparatorSpecimen } from "@/components/comparator-specimen";

// Slugs accepted by the panel route: stock themes + any installed private
// themes. Visual regression tests use this surface to snapshot every theme.
const VALID_PANEL_THEMES = new Set<string>([
  ...ALL_THEMES,
  ...PRIVATE_THEMES.map((t) => t.slug),
]);

// Matches every `*-theme` class, including private-only slugs that aren't in
// ALL_THEMES, so swapping themes doesn't leave a stale class behind.
const THEME_CLASS_PATTERN = /(^|\s)[\w-]+-theme(?=\s|$)/g;

function PanelContent() {
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") ?? "space";
  const mode = searchParams.get("mode") ?? "dark";

  const validTheme = VALID_PANEL_THEMES.has(theme) ? theme : "space";
  const validMode = mode === "light" || mode === "dark" ? mode : "dark";

  useEffect(() => {
    const body = document.body;
    body.className = body.className.replace(THEME_CLASS_PATTERN, "").trim();
    body.classList.add(`${validTheme}-theme`);

    const html = document.documentElement;
    if (validMode === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    document.dispatchEvent(new CustomEvent("visor-theme-change"));
  }, [validTheme, validMode]);

  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      <ComparatorSpecimen />
    </div>
  );
}

export default function PanelPage() {
  return (
    <Suspense>
      <PanelContent />
    </Suspense>
  );
}
