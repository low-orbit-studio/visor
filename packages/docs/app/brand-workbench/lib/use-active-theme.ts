"use client"

import { useEffect, useState } from "react"

/**
 * Reads the active theme label + color mode from the document, set by the root layout's init
 * script (`<theme>-theme` class on <body>, `dark`/`light` on <html>). The Brand Workbench obeys
 * whatever theme is active — this is a read-only reflection for the theme chip, not a switcher.
 *
 * Returns "" / "light" before mount to keep SSR output stable; the values fill in on the client.
 */
export function useActiveTheme(): { themeLabel: string; mode: "light" | "dark" } {
  const [themeLabel, setThemeLabel] = useState("")
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    const read = () => {
      const themeClass = Array.from(document.body.classList).find((c) => c.endsWith("-theme"))
      setThemeLabel(themeClass ? themeClass.replace(/-theme$/, "") : "")
      setMode(document.documentElement.classList.contains("dark") ? "dark" : "light")
    }
    read()
    // Reflect changes made by the docs theme switcher or our own mode toggle.
    const observer = new MutationObserver(read)
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return { themeLabel, mode }
}

/** Toggle the document color mode (html.dark/light + persisted preference). */
export function toggleColorMode(next: "light" | "dark") {
  const root = document.documentElement
  root.classList.toggle("dark", next === "dark")
  root.classList.toggle("light", next === "light")
  root.style.colorScheme = next
  try {
    localStorage.setItem("visor-color-mode", next)
  } catch {
    // ignore unavailable storage
  }
}
