"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { ALL_THEMES } from "@/lib/theme-config";
import { ComparatorSpecimen } from "@/components/comparator-specimen";

function PanelContent() {
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") ?? "space";
  const mode = searchParams.get("mode") ?? "dark";

  const validTheme = ALL_THEMES.includes(theme) ? theme : "space";
  const validMode = mode === "light" || mode === "dark" ? mode : "dark";

  useEffect(() => {
    const body = document.body;
    for (const t of ALL_THEMES) {
      body.classList.remove(`${t}-theme`);
    }
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
