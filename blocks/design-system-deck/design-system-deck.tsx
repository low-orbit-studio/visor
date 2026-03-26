"use client"

import { DeckRenderer } from "../../components/deck/deck-renderer/deck-renderer"
import { designSystemDeckRegistry } from "./registry"

import type { DeckRendererProps } from "../../components/deck/deck-renderer/deck-renderer"

type DesignSystemDeckProps = Omit<DeckRendererProps, "registry">

export function DesignSystemDeck({
  showTOC = true,
  showFooter = true,
  ...props
}: DesignSystemDeckProps) {
  return (
    <DeckRenderer
      registry={designSystemDeckRegistry}
      showTOC={showTOC}
      showFooter={showFooter}
      {...props}
    />
  )
}
