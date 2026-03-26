"use client"

import type { ReactNode } from "react"
import { DeckLayout } from "../deck-layout/deck-layout"
import { DeckFooter } from "../deck-footer/deck-footer"
import { TOCSlide } from "../toc-slide/toc-slide"
import {
  FullscreenOverlay,
  FullscreenOverlayTrigger,
  FullscreenOverlayContent,
} from "../../ui/fullscreen-overlay/fullscreen-overlay"
import { getSections, getFooterColumns } from "../../../lib/deck-registry"
import { cn } from "../../../lib/utils"
import styles from "./deck-renderer.module.css"

import type { DeckRegistry } from "../../../lib/deck-registry"

export type { DeckRegistry, SlideEntry, DeckSection } from "../../../lib/deck-registry"

export interface DeckRendererProps {
  /** Declarative slide registry configuration */
  registry: DeckRegistry
  /** Show an auto-generated table of contents slide after the first slide */
  showTOC?: boolean
  /** Optional background image for the TOC slide */
  tocImage?: string
  /** Show a footer with navigation columns derived from registry sections */
  showFooter?: boolean
  /** Optional brand name for the footer (default: "Low Orbit Studio") */
  brandName?: string
  /** Enable fullscreen mode with a trigger button */
  fullscreen?: boolean
  /** Label for the fullscreen trigger button */
  fullscreenLabel?: string
  /** Additional CSS class for the root element */
  className?: string
}

export function DeckRenderer({
  registry,
  showTOC = false,
  tocImage,
  showFooter = true,
  brandName,
  fullscreen = false,
  fullscreenLabel = "Fullscreen",
  className,
}: DeckRendererProps) {
  const columns = getFooterColumns(registry)

  const tocSections = showTOC
    ? getSections(registry).map((g) => ({
        section: g.section,
        items: g.slides.map((s) => ({ id: s.id, title: s.title })),
      }))
    : []

  const slides: ReactNode[] = []
  registry.slides.forEach((entry, i) => {
    const SlideComponent = entry.component
    slides.push(<SlideComponent key={entry.id} />)
    if (showTOC && i === 0) {
      slides.push(
        <TOCSlide key="s-toc" sections={tocSections} backgroundImage={tocImage} />
      )
    }
  })

  const slideTitles = registry.slides.map((s) => s.title)
  if (showTOC) slideTitles.splice(1, 0, "Table of Contents")

  const deckContent = (
    <div data-slot="deck-renderer" className={cn(styles.root, className)}>
      <DeckLayout slideTitles={slideTitles}>
        {slides}
        {showFooter && (
          <DeckFooter
            description={registry.description}
            columns={columns.length > 0 ? columns : undefined}
            brandName={brandName}
          />
        )}
      </DeckLayout>
    </div>
  )

  if (!fullscreen) {
    return deckContent
  }

  return (
    <FullscreenOverlay>
      <FullscreenOverlayTrigger asChild>
        <button type="button" className={styles.fullscreenTrigger}>
          {fullscreenLabel}
        </button>
      </FullscreenOverlayTrigger>
      <FullscreenOverlayContent>{deckContent}</FullscreenOverlayContent>
    </FullscreenOverlay>
  )
}
