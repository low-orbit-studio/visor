"use client"

import * as React from "react"
import { ImageBroken } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./image.module.css"

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Preset aspect ratio */
  aspectRatio?: "square" | "video" | "portrait" | "auto"
  /** Content shown when image fails to load */
  fallback?: React.ReactNode
  /** Object-fit behavior */
  objectFit?: "cover" | "contain" | "fill" | "none"
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      className,
      aspectRatio = "auto",
      fallback,
      objectFit = "cover",
      loading = "lazy",
      src,
      alt,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)

    return (
      <div
        data-slot="image"
        className={cn(
          styles.root,
          aspectRatio === "square" && styles.square,
          aspectRatio === "video" && styles.video,
          aspectRatio === "portrait" && styles.portrait,
          className
        )}
      >
        {isLoading && !hasError && (
          <div data-slot="image-skeleton" className={styles.skeleton} />
        )}
        {hasError ? (
          <div data-slot="image-fallback" className={styles.fallback}>
            {fallback || <ImageBroken size={32} />}
          </div>
        ) : (
          <img
            ref={ref}
            data-slot="image-element"
            data-fit={objectFit}
            data-loaded={!isLoading}
            className={styles.img}
            src={src}
            alt={alt}
            loading={loading}
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            {...props}
          />
        )}
      </div>
    )
  }
)
Image.displayName = "Image"

export { Image }
