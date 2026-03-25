"use client"

import { createContext, useContext } from "react"

export interface DeckContextValue {
  goTo: (index: number) => void
  navigateTo: (id: string) => void
}

const DeckContext = createContext<DeckContextValue | null>(null)

export const DeckProvider = DeckContext.Provider

export function useDeck(): DeckContextValue {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error("useDeck must be used within <DeckLayout />")
  return ctx
}
