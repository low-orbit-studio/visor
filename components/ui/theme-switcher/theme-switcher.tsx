"use client"

import * as React from "react"
import styles from "./theme-switcher.module.css"

export interface ThemeOption {
  id: string
  label: string
  bodyClass: string
}

export type ColorMode = "dark" | "light"

export interface ThemeSwitcherProps {
  themes?: ThemeOption[]
  defaultThemeId?: string
  defaultMode?: ColorMode
  themeStorageKey?: string
  modeStorageKey?: string
  extras?: React.ReactNode
  className?: string
}

const DEFAULT_THEME_KEY = "visor-theme"
const DEFAULT_MODE_KEY = "visor-color-mode"

function applyTheme(themeId: string | null, themes: ThemeOption[], storageKey: string) {
  const body = document.body
  for (const t of themes) {
    if (t.bodyClass) body.classList.remove(t.bodyClass)
  }
  const theme = themes.find((t) => t.id === themeId)
  if (theme?.bodyClass) body.classList.add(theme.bodyClass)
  try {
    if (themeId) localStorage.setItem(storageKey, themeId)
  } catch {
    // localStorage unavailable; class application still succeeds
  }
}

function applyMode(mode: ColorMode, storageKey: string) {
  const html = document.documentElement
  html.classList.remove("dark", "light")
  html.classList.add(mode)
  html.style.colorScheme = mode
  try {
    localStorage.setItem(storageKey, mode)
  } catch {
    // localStorage unavailable; class application still succeeds
  }
}

export function ThemeSwitcher({
  themes = [],
  defaultThemeId,
  defaultMode = "dark",
  themeStorageKey = DEFAULT_THEME_KEY,
  modeStorageKey = DEFAULT_MODE_KEY,
  extras,
  className,
}: ThemeSwitcherProps) {
  const initialThemeId = defaultThemeId ?? themes[0]?.id ?? null
  const [themeId, setThemeId] = React.useState<string | null>(initialThemeId)
  const [mode, setMode] = React.useState<ColorMode>(defaultMode)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(themeStorageKey)
      const storedMode = localStorage.getItem(modeStorageKey) as ColorMode | null
      const validTheme =
        storedTheme && themes.some((t) => t.id === storedTheme)
          ? storedTheme
          : initialThemeId
      const validMode: ColorMode = storedMode === "light" || storedMode === "dark" ? storedMode : defaultMode
      setThemeId(validTheme)
      setMode(validMode)
    } catch {
      // localStorage unavailable; fall back to defaults
    }
    setMounted(true)
    // initialThemeId, defaultMode, themes, themeStorageKey, modeStorageKey are
    // configuration; we read them once on mount and intentionally do not
    // re-sync if the host re-renders with different values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) return null

  const wrapperClass = className ? `${styles.root} ${className}` : styles.root

  return (
    <div className={wrapperClass} role="group" aria-label="Theme and mode switcher">
      {themes.length > 0 ? (
        <>
          <span className={styles.label}>Theme</span>
          <div className={styles.segment} role="radiogroup" aria-label="Theme">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={themeId === theme.id}
                data-active={themeId === theme.id}
                onClick={() => {
                  setThemeId(theme.id)
                  applyTheme(theme.id, themes, themeStorageKey)
                }}
                className={styles.option}
              >
                {theme.label}
              </button>
            ))}
          </div>
          <span className={styles.divider} aria-hidden="true" />
        </>
      ) : null}
      <span className={styles.label}>Mode</span>
      <div className={styles.segment} role="radiogroup" aria-label="Mode">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "dark"}
          data-active={mode === "dark"}
          onClick={() => {
            setMode("dark")
            applyMode("dark", modeStorageKey)
          }}
          className={styles.option}
        >
          Dark
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "light"}
          data-active={mode === "light"}
          onClick={() => {
            setMode("light")
            applyMode("light", modeStorageKey)
          }}
          className={styles.option}
        >
          Light
        </button>
      </div>
      {extras}
    </div>
  )
}
