"use client"

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { DeckProvider } from "../deck-context/deck-context"
import { DotNav } from "../dot-nav/dot-nav"
import { useSlideEngine } from "../../../hooks/use-slide-engine"
import { useIntersectionAnimation } from "../../../hooks/use-intersection-animation"
import { useKeyboardNav } from "../../../hooks/use-keyboard-nav"
import { useWheelNav } from "../../../hooks/use-wheel-nav"
import { cn } from "../../../lib/utils"
import styles from "./deck-layout.module.css"

export interface DeckLayoutProps {
  children: ReactNode
  /** Slide titles for dot-nav tooltips */
  slideTitles?: string[]
  /** Optional render prop for custom controls (e.g., export menu) */
  controls?: (props: {
    containerRef: React.RefObject<HTMLDivElement | null>
    currentIndex: number
    variant: "light" | "dark"
  }) => ReactNode
  className?: string
}

export function DeckLayout({
  children,
  slideTitles,
  controls,
  className,
}: DeckLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLElement[]>([])
  const currentIndexRef = useRef(0)
  const totalSectionsRef = useRef(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light")

  const updateCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = index
    setCurrentIndex(index)
    const el = sectionsRef.current[index]
    const dotNav = el?.dataset.dotNav
    const theme = (dotNav ?? el?.dataset.theme) === "dark" ? "dark" : "light"
    setCurrentTheme(theme)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const elements = Array.from(
      container.querySelectorAll('[data-slot="slide"], [data-slot="deck-footer"]')
    ) as HTMLElement[]
    sectionsRef.current = elements
    totalSectionsRef.current = elements.length
    setSlideCount(
      elements.filter((el) => el.getAttribute("data-slot") === "slide").length
    )
    const first = elements[0]
    setCurrentTheme(
      (first?.dataset.dotNav ?? first?.dataset.theme) === "dark" ? "dark" : "light"
    )
  }, [])

  const { goTo, navigateTo } = useSlideEngine({
    sectionsRef,
    currentIndexRef,
    setCurrentIndex: updateCurrentIndex,
  })

  useIntersectionAnimation({
    sectionsRef,
    currentIndexRef,
    setCurrentIndex: updateCurrentIndex,
  })

  useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
  useWheelNav({ goTo, currentIndexRef })

  const deckValue = useMemo(() => ({ goTo, navigateTo }), [goTo, navigateTo])

  return (
    <DeckProvider value={deckValue}>
      <DotNav
        slideCount={slideCount}
        currentIndex={currentIndex}
        onDotClick={goTo}
        variant={currentTheme}
        titles={slideTitles}
      />
      {controls?.({ containerRef, currentIndex, variant: currentTheme })}
      <div
        ref={containerRef}
        data-slot="deck-layout"
        className={cn(styles.container, className)}
      >
        {children}
      </div>
    </DeckProvider>
  )
}
