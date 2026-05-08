import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./bento-grid.module.css"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResponsiveValue<T> {
  base: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}

export type BentoSpan = "full" | "half" | number

export type BentoAspect = "21/9" | "2/1" | "4/3" | "1/1" | (string & {})

export type BentoFit = "cover" | "contain"

// ---------------------------------------------------------------------------
// BentoGrid
// ---------------------------------------------------------------------------

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns. Accepts a plain number or a responsive breakpoint map.
   * Defaults to 2 columns.
   */
  cols?: number | ResponsiveValue<number>
  /**
   * Gap between tiles as a spacing token suffix (e.g. "md" → `--spacing-md`).
   * Defaults to "4" which resolves to `--spacing-4`.
   */
  gap?: string
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, cols = 2, gap = "4", style, ...props }, ref) => {
    const colCount = typeof cols === "number" ? cols : cols.base
    const smCols = typeof cols === "object" ? cols.sm : undefined
    const mdCols = typeof cols === "object" ? cols.md : undefined
    const lgCols = typeof cols === "object" ? cols.lg : undefined
    const xlCols = typeof cols === "object" ? cols.xl : undefined

    const cssVars: React.CSSProperties & Record<string, string | number> = {
      "--bento-cols": colCount,
      "--bento-gap": `var(--spacing-${gap}, 1rem)`,
      ...(smCols !== undefined ? { "--bento-cols-sm": smCols } : {}),
      ...(mdCols !== undefined ? { "--bento-cols-md": mdCols } : {}),
      ...(lgCols !== undefined ? { "--bento-cols-lg": lgCols } : {}),
      ...(xlCols !== undefined ? { "--bento-cols-xl": xlCols } : {}),
      ...style,
    }

    return (
      <div
        ref={ref}
        data-slot="bento-grid"
        className={cn(styles.bentoGrid, className)}
        style={cssVars}
        {...props}
      />
    )
  }
)
BentoGrid.displayName = "BentoGrid"

// ---------------------------------------------------------------------------
// BentoTile
// ---------------------------------------------------------------------------

export interface BentoTileProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Column span: "full" (1/-1), "half" (1 col), or a numeric span count.
   * Defaults to "half".
   */
  span?: BentoSpan
  /**
   * Aspect ratio for the tile (e.g. "21/9", "2/1", "4/3", "1/1").
   * Maps directly to CSS `aspect-ratio`.
   */
  aspect?: BentoAspect
  /**
   * Media fit mode. "cover" fills the tile; "contain" fits media inside
   * a surface-card background plate.
   * Defaults to "cover".
   */
  fit?: BentoFit
  /**
   * When provided, renders the tile root as an `<a>` element.
   */
  href?: string
  /**
   * Link target (e.g. "_blank"). Only relevant when `href` is set.
   */
  target?: string
  /**
   * Link rel attribute. Only relevant when `href` is set.
   */
  rel?: string
}

const BentoTile = React.forwardRef<HTMLElement, BentoTileProps>(
  (
    {
      className,
      span = "half",
      aspect,
      fit = "cover",
      href,
      target,
      rel,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const spanStyle: React.CSSProperties & Record<string, string | number> = {
      ...(aspect ? { "--bento-tile-aspect": aspect.replace("/", " / ") } : {}),
      ...style,
    }

    const spanClass = cn(
      styles.bentoTile,
      span === "full" && styles.bentoTileFull,
      span === "half" && styles.bentoTileHalf,
      typeof span === "number" && styles.bentoTileNumeric,
      fit === "contain" && styles.bentoTileContain,
      className
    )

    const spanDataAttr =
      typeof span === "number" ? { "--bento-tile-span": span } : {}

    const combinedStyle = { ...spanStyle, ...spanDataAttr }

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          data-slot="bento-tile"
          data-span={span}
          data-fit={fit}
          href={href}
          target={target}
          rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
          className={spanClass}
          style={combinedStyle}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      )
    }

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        data-slot="bento-tile"
        data-span={span}
        data-fit={fit}
        className={spanClass}
        style={combinedStyle}
        {...props}
      >
        {children}
      </article>
    )
  }
)
BentoTile.displayName = "BentoTile"

// ---------------------------------------------------------------------------
// BentoTileMedia
// ---------------------------------------------------------------------------

export interface BentoTileMediaProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  loading?: "lazy" | "eager"
}

const BentoTileMedia = React.forwardRef<HTMLImageElement, BentoTileMediaProps>(
  ({ className, loading = "lazy", alt, ...props }, ref) => {
    return (
      <img
        ref={ref}
        data-slot="bento-tile-media"
        className={cn(styles.bentoTileMedia, className)}
        loading={loading}
        alt={alt}
        {...props}
      />
    )
  }
)
BentoTileMedia.displayName = "BentoTileMedia"

// ---------------------------------------------------------------------------
// BentoTileBody
// ---------------------------------------------------------------------------

export interface BentoTileBodyProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const BentoTileBody = React.forwardRef<HTMLDivElement, BentoTileBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="bento-tile-body"
        className={cn(styles.bentoTileBody, className)}
        {...props}
      />
    )
  }
)
BentoTileBody.displayName = "BentoTileBody"

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { BentoGrid, BentoTile, BentoTileMedia, BentoTileBody }
