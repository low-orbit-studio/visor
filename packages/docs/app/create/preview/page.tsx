"use client";

import { useEffect, useCallback, useRef } from "react";
import { ComparatorSpecimen } from "@/components/comparator-specimen";

export default function PreviewPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

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
