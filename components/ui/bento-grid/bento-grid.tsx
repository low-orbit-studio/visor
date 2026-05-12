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

export type BentoLayout = "stacked" | "overlay"

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
  /**
   * When true, tiles fade + rise from 24px on viewport entry. Children are
   * staggered by their DOM order — left-to-right on a row, row-by-row down
   * the grid. Respects `prefers-reduced-motion`. Defaults to false.
   */
  reveal?: boolean
  /**
   * Per-tile reveal delay in milliseconds. Each tile's actual delay is
   * `revealStepMs × index`. Defaults to 110ms.
   */
  revealStepMs?: number
  /**
   * IntersectionObserver threshold for the entrance trigger. Defaults to 0.2.
   */
  revealThreshold?: number
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  (
    {
      className,
      cols = 2,
      gap = "4",
      style,
      reveal = false,
      revealStepMs = 110,
      revealThreshold = 0.2,
      children,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = React.useRef<HTMLDivElement | null>(null)
    const [inView, setInView] = React.useState(false)

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef]
    )

    React.useEffect(() => {
      if (!reveal) return
      const element = innerRef.current
      if (!element || typeof IntersectionObserver === "undefined") return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        },
        { threshold: revealThreshold }
      )
      observer.observe(element)
      return () => observer.disconnect()
    }, [reveal, revealThreshold])

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
      ...(reveal ? { "--bento-reveal-step": `${revealStepMs}ms` } : {}),
      ...style,
    }

    // When reveal is on, walk children and inject a per-tile --reveal-index so
    // the cascade stagger reads in DOM order.
    const decoratedChildren = reveal
      ? React.Children.map(children, (child, idx) => {
          if (!React.isValidElement(child)) return child
          const childProps = child.props as React.HTMLAttributes<HTMLElement>
          return React.cloneElement(child, {
            style: {
              ...(childProps.style ?? {}),
              "--reveal-index": idx,
            },
          } as Partial<React.HTMLAttributes<HTMLElement>>)
        })
      : children

    return (
      <div
        ref={setRef}
        data-slot="bento-grid"
        data-reveal={reveal ? "true" : undefined}
        data-revealed={reveal && inView ? "true" : undefined}
        className={cn(styles.bentoGrid, className)}
        style={cssVars}
        {...props}
      >
        {decoratedChildren}
      </div>
    )
  }
)
BentoGrid.displayName = "BentoGrid"

// ---------------------------------------------------------------------------
// BentoTile
// ---------------------------------------------------------------------------

export interface BentoTileProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Visual layout of the tile.
   * - "stacked" (default): media renders on top with its own aspect ratio,
   *   body is a sibling block below in document flow. Tile height = media + body.
   * - "overlay": the tile carries the aspect ratio, media fills it absolutely,
   *   body floats over the lower portion.
   * @default "stacked"
   */
  layout?: BentoLayout
  /**
   * Column span: "full" (1/-1), "half" (1 col), or a numeric span count.
   * Defaults to "half".
   */
  span?: BentoSpan
  /**
   * Aspect ratio for the tile (e.g. "21/9", "2/1", "4/3", "1/1").
   * Applied to the media in "stacked" mode, and to the tile root in "overlay" mode.
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
      layout = "stacked",
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
      layout === "stacked" ? styles.bentoTileStacked : styles.bentoTileOverlay,
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
          data-layout={layout}
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
        data-layout={layout}
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

export type BentoTileBodyProps = React.HTMLAttributes<HTMLDivElement>

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
// BentoTileMeta — eyebrow row (e.g. "WEB · LOW ORBIT · 2026")
// ---------------------------------------------------------------------------

export interface BentoTileMetaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Shorthand: provide an array of strings, each rendered as a span with a
   * `·` separator between siblings. When omitted, children are used as-is.
   */
  items?: React.ReactNode[]
}

const BentoTileMeta = React.forwardRef<HTMLDivElement, BentoTileMetaProps>(
  ({ className, items, children, ...props }, ref) => {
    const content = items
      ? items.map((item, idx) => <span key={idx}>{item}</span>)
      : children
    return (
      <div
        ref={ref}
        data-slot="bento-tile-meta"
        className={cn(styles.bentoTileMeta, className)}
        {...props}
      >
        {content}
      </div>
    )
  }
)
BentoTileMeta.displayName = "BentoTileMeta"

// ---------------------------------------------------------------------------
// BentoTileTitle — large display heading with optional hover arrow
// ---------------------------------------------------------------------------

export interface BentoTileTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. @default "h3" */
  as?: "h2" | "h3" | "h4"
  /**
   * Render a ↗ arrow after the title that nudges on tile hover. Useful when
   * the tile is a link.
   * @default false
   */
  showArrow?: boolean
}

const BentoTileTitle = React.forwardRef<HTMLHeadingElement, BentoTileTitleProps>(
  ({ className, as: Tag = "h3", showArrow = false, children, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        data-slot="bento-tile-title"
        className={cn(styles.bentoTileTitle, className)}
        {...props}
      >
        {children}
        {showArrow ? (
          <span className={styles.bentoTileTitleArrow} aria-hidden="true">
            {"↗"}
          </span>
        ) : null}
      </Tag>
    )
  }
)
BentoTileTitle.displayName = "BentoTileTitle"

// ---------------------------------------------------------------------------
// BentoTileFigure — non-image figure slot (charts, large numbers, custom SVG)
// ---------------------------------------------------------------------------
//
// Drop-in replacement for BentoTileMedia when the tile's hero element is not
// a photographic image — typical use cases: data charts, large statistic
// numbers, illustrated SVGs, or any composed JSX. Inherits the same hover
// scale behavior as BentoTileMedia (suppressed in fit="contain" mode) and the
// same layout-mode positioning (relative in stacked, absolute in overlay).

export type BentoTileFigureProps = React.HTMLAttributes<HTMLDivElement>

const BentoTileFigure = React.forwardRef<HTMLDivElement, BentoTileFigureProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="bento-tile-figure"
        className={cn(styles.bentoTileMedia, styles.bentoTileFigure, className)}
        {...props}
      />
    )
  }
)
BentoTileFigure.displayName = "BentoTileFigure"

// ---------------------------------------------------------------------------
// BentoTileHeadline — large display heading for headline-only tiles
// ---------------------------------------------------------------------------
//
// Use BentoTileHeadline (not BentoTileTitle) when the tile's primary content
// is the headline itself — manifesto pages, big-idea moments, statement
// tiles. Scales from 2rem → 3.5rem and pairs naturally with BentoTileMeta or
// BentoTileDescription as supporting copy.

export interface BentoTileHeadlineProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. @default "h2" */
  as?: "h1" | "h2" | "h3"
}

const BentoTileHeadline = React.forwardRef<
  HTMLHeadingElement,
  BentoTileHeadlineProps
>(({ className, as: Tag = "h2", ...props }, ref) => {
  return (
    <Tag
      ref={ref}
      data-slot="bento-tile-headline"
      className={cn(styles.bentoTileHeadline, className)}
      {...props}
    />
  )
})
BentoTileHeadline.displayName = "BentoTileHeadline"

// ---------------------------------------------------------------------------
// BentoTileDescription — muted body text under the title
// ---------------------------------------------------------------------------
//
// Renders as <div> rather than <p> so MDX-authored children (which MDX
// auto-wraps in <p>) don't create invalid <p>-in-<p> nesting and hydration
// errors. The semantic loss is minor — the body content is still readable
// prose, just hosted in a styled container.

export type BentoTileDescriptionProps =
  React.HTMLAttributes<HTMLDivElement>

const BentoTileDescription = React.forwardRef<
  HTMLDivElement,
  BentoTileDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="bento-tile-description"
      className={cn(styles.bentoTileDescription, className)}
      {...props}
    />
  )
})
BentoTileDescription.displayName = "BentoTileDescription"

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  BentoGrid,
  BentoTile,
  BentoTileMedia,
  BentoTileFigure,
  BentoTileBody,
  BentoTileMeta,
  BentoTileTitle,
  BentoTileHeadline,
  BentoTileDescription,
}
