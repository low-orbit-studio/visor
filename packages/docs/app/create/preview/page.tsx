"use client";

import { useEffect, useCallback, useRef } from "react";
import { lookupGoogleFont } from "@loworbitstudio/visor-theme-engine";
import { ComparatorSpecimen } from "@/components/comparator-specimen";

/** Extract custom font family names from a CSS bundle and load Google Fonts. */
function loadFontsFromCss(css: string) {
  const seen = new Set<string>();
  const pattern = /--font-(?:heading|display|body|sans|mono):\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(css)) !== null) {
    const family = m[1].trim().replace(/^["']|["']$/g, "").split(",")[0].trim();
    if (!family || seen.has(family)) continue;
    seen.add(family);
    if (!lookupGoogleFont(family)) continue;
    const encoded = family.replace(/ /g, "+");
    const url = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }
}

export default function PreviewPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // Strip the global docs-site theme class so the creator's CSS bundle is the
  // sole source of token values.  The root layout injects e.g. "blacklight-brand-theme"
  // from localStorage — that would override the creator's :root declarations.
  useEffect(() => {
    const themeClasses = [...document.body.classList].filter((c) =>
      c.endsWith("-theme")
    );
    for (const cls of themeClasses) {
      document.body.classList.remove(cls);
    }
  }, []);

  /** When the preview scrolls, report scroll percent to the parent frame */
  const handleScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    const el = rootRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    const percent = el.scrollTop / max;
    window.parent.postMessage({ type: "scroll-report", percent }, "*");
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!event.data || typeof event.data !== "object") return;

    if (event.data.type === "theme-css") {
      let styleEl = document.getElementById(
        "creator-theme"
      ) as HTMLStyleElement | null;

      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "creator-theme";
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = event.data.css;

      // Signal live CSS-reading components (e.g. useLiveFontName) to re-read
      document.documentElement.dataset.creatorRevision = String(Date.now());

      // Load any Google Fonts referenced in the new CSS bundle
      loadFontsFromCss(event.data.css as string);
    }

    if (event.data.type === "dark-mode") {
      if (event.data.enabled) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    if (event.data.type === "load-font" && typeof event.data.url === "string") {
      const url = event.data.url;
      // Avoid duplicate link elements for the same URL
      const existing = document.querySelector(`link[href="${CSS.escape(url)}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    }

    /** Sync scroll from the controls column */
    if (event.data.type === "set-scroll") {
      const el = rootRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      isSyncingRef.current = true;
      el.scrollTop = (event.data.percent as number) * max;
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div ref={rootRef} onScroll={handleScroll} style={{ overflow: "auto", height: "100%" }}>
      <ComparatorSpecimen />
    </div>
  );
}
