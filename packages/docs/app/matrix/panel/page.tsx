"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { ALL_THEMES } from "@/lib/theme-config";
import { PRIVATE_THEMES } from "@/lib/private-themes";
import { findSection, DEFAULT_SECTION_ID } from "@/components/playgrounds/sections";
import styles from "./panel.module.css";

// Slugs the panel will scope: stock + custom (ALL_THEMES) plus any installed
// private themes. Private CSS is pulled in by the route layout.
const VALID_THEMES = new Set<string>([
  ...ALL_THEMES,
  ...PRIVATE_THEMES.map((t) => t.slug),
]);

// Matches every `*-theme` class (incl. private-only slugs) so swapping themes
// doesn't leave a stale class behind.
const THEME_CLASS_PATTERN = /(^|\s)[\w-]+-theme(?=\s|$)/g;

/**
 * Post the rendered content height to the parent matrix page so it can size
 * this row's iframe to its content (the matrix renders rows at natural height,
 * mirroring the BL-227 prototype). Same-origin, so we target our own origin.
 */
function postHeight() {
  if (typeof window === "undefined" || window.parent === window) return;
  const height = Math.ceil(document.documentElement.scrollHeight);
  window.parent.postMessage(
    { type: "matrix:row-height", height },
    window.location.origin,
  );
}

function PanelContent() {
  const params = useSearchParams();
  const rawTheme = params.get("theme") ?? "blackout";
  const rawMode = params.get("mode");
  const rawSection = params.get("section");

  const theme = VALID_THEMES.has(rawTheme) ? rawTheme : "blackout";
  const mode = rawMode === "light" ? "light" : "dark";
  const section = findSection(rawSection ?? DEFAULT_SECTION_ID);
  const SectionComponent = section.Component;

  // Apply theme + mode to the document. Mode is controlled by an EXPLICIT class,
  // NEVER browser prefers-color-scheme (BL-227 audit): for light we add `.light`
  // to the theme-scope element to defeat the adapter's
  // `@media (prefers-color-scheme: dark) { .{theme}:not(.light) }` rule, and keep
  // `<html>` free of `.dark` so the `html:not(.dark)` light rules apply.
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    body.className = body.className.replace(THEME_CLASS_PATTERN, "").trim();
    body.classList.add(`${theme}-theme`);
    // The theme scope sets `min-height: 100vh` (layered); override inline so the
    // body sizes to content and the parent can measure a real row height.
    body.style.minHeight = "0";

    if (mode === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
      html.style.colorScheme = "dark";
      body.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
      html.style.colorScheme = "light";
      body.classList.add("light");
    }

    document.dispatchEvent(new CustomEvent("visor-theme-change"));
  }, [theme, mode]);

  // Report content height to the parent: on mount, on content resize, and once
  // webfonts settle (custom theme fonts shift metrics).
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    postHeight();
    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.body);
    if (rootRef.current) ro.observe(rootRef.current);
    document.fonts?.ready.then(postHeight).catch(() => {});
    return () => ro.disconnect();
  }, [theme, mode, section.id]);

  return (
    <div ref={rootRef} className={styles.panel}>
      <SectionComponent />
    </div>
  );
}

export default function MatrixPanelPage() {
  return (
    <Suspense>
      <PanelContent />
    </Suspense>
  );
}
