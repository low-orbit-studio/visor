import type { ComponentType } from "react"

/* ------------------------------------------------------------------ */
/*  Core types — exported for template authors                        */
/* ------------------------------------------------------------------ */

/** A single slide entry in a deck registry. */
export interface SlideEntry {
  /** Unique slide identifier (used as element id, e.g. "s-intro") */
  id: string
  /** Display title shown in dot-nav tooltips and TOC */
  title: string
  /** Section name for TOC grouping. Prefix with "_" to exclude from TOC/footer. */
  section: string
  /** The React component to render for this slide */
  component: ComponentType
}

/** A group of slides sharing the same section name. */
export interface DeckSection {
  section: string
  slides: SlideEntry[]
}

/** Optional extra link for the deck footer. */
export interface FooterExtra {
  label: string
  /** Slide id for internal navigation */
  slide?: string
  /** External URL */
  href?: string
  /** Highlight as accent link */
  accent?: boolean
}

/** Declarative configuration for a slide deck. */
export interface DeckRegistry {
  /** Brand/deck description shown in the footer */
  description: string
  /** Ordered list of slide entries */
  slides: SlideEntry[]
  /** Optional extra links appended to the last footer column */
  footerExtras?: FooterExtra[]
}

/* ------------------------------------------------------------------ */
/*  Utility functions                                                 */
/* ------------------------------------------------------------------ */

/**
 * Group slides by section, excluding sections that start with "_".
 */
export function getSections(registry: DeckRegistry): DeckSection[] {
  const groups: DeckSection[] = []
  for (const slide of registry.slides) {
    if (slide.section.startsWith("_")) continue
    const existing = groups.find((g) => g.section === slide.section)
    if (existing) {
      existing.slides.push(slide)
    } else {
      groups.push({ section: slide.section, slides: [slide] })
    }
  }
  return groups
}

/** Footer column shape matching DeckFooterColumn. */
interface FooterColumn {
  title: string
  links: FooterExtra[]
}

/**
 * Build footer columns from registry sections + optional extras.
 */
export function getFooterColumns(registry: DeckRegistry): FooterColumn[] {
  const sections = getSections(registry)
  const columns: FooterColumn[] = sections.map((group) => ({
    title: group.section,
    links: group.slides.map((slide) => ({
      label: slide.title,
      slide: slide.id,
    })),
  }))

  if (registry.footerExtras?.length && columns.length > 0) {
    const lastCol = columns[columns.length - 1]
    for (const extra of registry.footerExtras) {
      lastCol.links.push(extra)
    }
  }

  return columns
}
