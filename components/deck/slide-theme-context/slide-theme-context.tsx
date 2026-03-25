"use client"

import { createContext, useContext, type ReactNode } from "react"

export type SlideTheme = "light" | "dark"

const SlideThemeContext = createContext<SlideTheme>("light")

export function SlideThemeProvider({
  theme,
  children,
}: {
  theme: SlideTheme
  children: ReactNode
}) {
  return (
    <SlideThemeContext.Provider value={theme}>
      {children}
    </SlideThemeContext.Provider>
  )
}

export function useSlideTheme(): SlideTheme {
  return useContext(SlideThemeContext)
}
