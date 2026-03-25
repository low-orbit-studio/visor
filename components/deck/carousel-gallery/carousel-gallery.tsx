"use client"

import { useState } from "react"
import { Lightbox, LightboxTrigger, LightboxContent } from "../../ui/lightbox/lightbox"
import { cn } from "../../../lib/utils"
import styles from "./carousel-gallery.module.css"

export interface GallerySlide {
  src: string
  alt: string
  caption?: string
}

export interface CarouselGalleryProps {
  /** Array of images to display in the gallery */
  slides: GallerySlide[]
  className?: string
}

export function CarouselGallery({ slides, className }: CarouselGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const lightboxImages = slides.map((s) => ({
    src: s.src,
    alt: s.alt,
  }))

  return (
    <>
      <div
        data-slot="carousel-gallery"
        className={cn(styles.grid, className)}
        style={{ gridTemplateColumns: `repeat(${slides.length}, 1fr)` }}
      >
        {slides.map((slide, i) => (
          <div key={slide.src} className={styles.item}>
            <button
              type="button"
              className={styles.card}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image: ${slide.alt}`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className={styles.image}
                loading="lazy"
                decoding="async"
              />
            </button>
            {slide.caption && (
              <div className={styles.caption}>{slide.caption}</div>
            )}
          </div>
        ))}
      </div>
      <Lightbox
        images={lightboxImages}
        initialIndex={activeIndex ?? 0}
        open={activeIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIndex(null)
        }}
      >
        <LightboxTrigger asChild>
          <button type="button" hidden aria-hidden="true" tabIndex={-1} />
        </LightboxTrigger>
        <LightboxContent />
      </Lightbox>
    </>
  )
}
