"use client";

import { useEffect, useCallback } from "react";
import { ComparatorSpecimen } from "@/components/comparator-specimen";

export default function PreviewPage() {
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
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      <ComparatorSpecimen />
    </div>
  );
}
