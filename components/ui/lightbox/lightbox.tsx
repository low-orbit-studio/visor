"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./lightbox.module.css"

export interface LightboxImage {
  src: string
  alt: string
}

export interface LightboxProps {
  /** Array of images to display */
  images: LightboxImage[]
  /** Initially selected image index */
  initialIndex?: number
  /** Controlled open state */
  open?: boolean
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

interface LightboxContextValue {
  images: LightboxImage[]
  currentIndex: number
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  goToPrevious: () => void
  goToNext: () => void
  /** Side the current photo came from; unset for the photo shown on open */
  direction?: "previous" | "next"
}

const LightboxContext = React.createContext<LightboxContextValue | null>(null)

function useLightbox() {
  const ctx = React.useContext(LightboxContext)
  if (!ctx) throw new Error("useLightbox must be used within <Lightbox />")
  return ctx
}

function Lightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  children,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [direction, setDirection] =
    React.useState<LightboxContextValue["direction"]>()

  // Reset currentIndex when opened
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setDirection(undefined)
    }
  }, [open, initialIndex])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) setDirection(undefined)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const goToPrevious = React.useCallback(() => {
    setDirection("previous")
    setCurrentIndex((prev) =>
      prev <= 0 ? images.length - 1 : prev - 1
    )
  }, [images.length])

  const goToNext = React.useCallback(() => {
    setDirection("next")
    setCurrentIndex((prev) =>
      prev >= images.length - 1 ? 0 : prev + 1
    )
  }, [images.length])

  return (
    <LightboxContext.Provider
      value={{
        images,
        currentIndex,
        setCurrentIndex,
        goToPrevious,
        goToNext,
        direction,
      }}
    >
      <DialogPrimitive.Root
        data-slot="lightbox-root"
        open={open}
        onOpenChange={handleOpenChange}
      >
        {children}
      </DialogPrimitive.Root>
    </LightboxContext.Provider>
  )
}
Lightbox.displayName = "Lightbox"

function LightboxTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="lightbox-trigger" {...props} />
}
LightboxTrigger.displayName = "LightboxTrigger"

function markLoaded(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = ""
}

const LightboxContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "children"> & {
    className?: string
  }
>(({ className, ...props }, ref) => {
  const { images, currentIndex, goToPrevious, goToNext, direction } =
    useLightbox()

  const touchStartX = React.useRef<number>(0)
  const touchEndX = React.useRef<number>(0)

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToPrevious()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        goToNext()
      }
    },
    [goToPrevious, goToNext]
  )

  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      touchStartX.current = touch.clientX
      touchEndX.current = touch.clientX
    },
    []
  )

  const handleTouchMove = React.useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0]
      if (touch) touchEndX.current = touch.clientX
    },
    []
  )

  const handleTouchEnd = React.useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (Math.abs(diff) >= threshold) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }
  }, [goToNext, goToPrevious])

  // Preload adjacent images
  React.useEffect(() => {
    if (images.length <= 1) return

    const preloadIndexes = [
      (currentIndex - 1 + images.length) % images.length,
      (currentIndex + 1) % images.length,
    ]

    preloadIndexes.forEach((idx) => {
      const image = images[idx]
      if (!image) return
      const img = new Image()
      img.src = image.src
    })
  }, [currentIndex, images])

  const currentImage = images[currentIndex]

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={styles.overlay} />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="lightbox"
        className={cn(styles.content, className)}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label={`Image viewer: ${currentImage?.alt ?? ""}`}
        {...props}
      >
        {/* Visually hidden title for accessibility */}
        <DialogPrimitive.Title className={styles.srOnly}>
          Image viewer
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className={styles.srOnly}>
          Viewing image {currentIndex + 1} of {images.length}
        </DialogPrimitive.Description>

        {/* Counter */}
        {images.length > 1 && (
          <span data-slot="lightbox-counter" className={styles.counter}>
            {currentIndex + 1} / {images.length}
          </span>
        )}

        {/* Close button */}
        <DialogPrimitive.Close
          data-slot="lightbox-close"
          className={styles.close}
        >
          <X weight="bold" />
          <span className={styles.srOnly}>Close</span>
        </DialogPrimitive.Close>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              data-slot="lightbox-previous"
              className={cn(styles.navButton, styles.navPrevious)}
              onClick={goToPrevious}
              type="button"
            >
              <CaretLeft weight="bold" />
              <span className={styles.srOnly}>Previous image</span>
            </button>
            <button
              data-slot="lightbox-next"
              className={cn(styles.navButton, styles.navNext)}
              onClick={goToNext}
              type="button"
            >
              <CaretRight weight="bold" />
              <span className={styles.srOnly}>Next image</span>
            </button>
          </>
        )}

        {/* Main image */}
        {currentImage && (
          <div className={styles.imageContainer}>
            <img
              key={currentIndex}
              src={currentImage.src}
              alt={currentImage.alt}
              className={styles.image}
              draggable={false}
              data-direction={direction}
              // The photo eases in once it has loaded (see lightbox.module.css)
              onLoad={markLoaded}
              onError={markLoaded}
            />
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
LightboxContent.displayName = "LightboxContent"

export {
  Lightbox,
  LightboxTrigger,
  LightboxContent,
}
