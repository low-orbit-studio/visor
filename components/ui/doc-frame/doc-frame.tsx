"use client"

import * as React from "react"
import { CompassIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { DocNav, type DocEntry } from "../doc-nav/doc-nav"
import styles from "./doc-frame.module.css"

/**
 * PL-2185 · VI-609 — the themed doc-page shell that wraps <DocNav>.
 *
 * DocFrame owns the page: theme tokens, a sticky header (a flexible brand/logo
 * slot, an OVERVIEW home pill, and a right-aligned meta slot), the <DocNav>
 * slot, and the content wrapper (the doc as children). It reads the single
 * `manifest`, derives the active product, and passes the slice + active-state
 * down to DocNav. Everything is themed by Visor tokens, so the shell adopts the
 * active project theme without modification.
 *
 * Replaces the vanilla-JS doc shell (nav.js + docs.css). `children` accepts any
 * content — a Next route's MDX, or a static doc's HTML body injected server-side
 * by a downstream catch-all route — so one React frame serves both tracks.
 */

// ─── manifest types ───────────────────────────────────────────────────────────

/**
 * A product entry in the PL-2177 roster. `id` matches the values in each
 * `DocEntry.scope[]` and the DocNav group id; `label` is the visible name
 * (defaults to a title-cased id).
 */
export interface DocProductEntry {
  /** Product id — matches `DocEntry.scope[]` values and the DocNav group id. */
  id: string
  /** Visible product name. Defaults to a title-cased `id`. */
  label?: string
}

/**
 * The parsed docs manifest — the single input DocFrame derives everything from.
 * Additive over PL-2177: `docs` is required; `products`, `brand`, and
 * `dispositions` are optional. Absence of `products` (or a single product) =
 * single-product mode: DocNav degrades to one grouped row, no accordion.
 */
export interface DocsManifest {
  /** Every documentation entry across the shared set and all products. */
  docs: DocEntry[]
  /**
   * PL-2177 product roster. Absent or length ≤ 1 → single-product mode.
   * When omitted, products are inferred from the distinct `scope` values in
   * `docs`.
   */
  products?: DocProductEntry[]
  /**
   * Text wordmark shown when no `logo` prop is passed and the active theme
   * ships no `brand.logo` SVG (the final fallback in the logo resolution order).
   */
  brand?: string
  /** PL-2170 disposition map — referenced, owned there. Opaque pass-through. */
  dispositions?: Record<string, unknown>
}

/** The OVERVIEW / home pill in the header — a link back to the docs hub. */
export interface DocFrameHome {
  /** Destination for the home pill. */
  href: string
  /** Visible label — rendered mono, UPPERCASE (e.g. `"Overview"`). */
  label: string
}

// ─── props ─────────────────────────────────────────────────────────────────────

export interface DocFrameProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** The parsed manifest — the single input everything derives from. */
  manifest: DocsManifest
  /**
   * The brand slot. Any node — an `<img>` of an SVG, an inline `<svg>`, or a
   * full component (an animated mark, a Visor `<Brand>`). Resolution order:
   * explicit `logo` → the active theme's `brand.logo` SVG (mode-aware via
   * `--brand-logo`, upgraded only once it loads) → the manifest `brand` text.
   */
  logo?: React.ReactNode
  /**
   * The OVERVIEW / home pill rendered after the brand — a bordered mono chip
   * with a leading compass glyph. Omit to hide it.
   */
  home?: DocFrameHome
  /**
   * A right-aligned breadcrumb / status slot in the header (mono, UPPERCASE,
   * `--text-tertiary`) — e.g. `ARTIST · BUILD-READY`. Any node.
   */
  meta?: React.ReactNode
  /**
   * Which product group is expanded (the accordion). Defaults to the route's
   * product, else the first product in the roster. Absent roster →
   * single-product mode.
   */
  activeProduct?: string
  /**
   * The active route, for active-state resolution. Next consumers pass
   * `usePathname()`; a static page passes `location.pathname`. Defaults to
   * `window.location.pathname` in the browser (framework-agnostic — no hard
   * next/navigation dependency), or `"/"` during SSR.
   */
  currentPath?: string
  /**
   * A Visor theme class name applied to the shell root, scoping all doc-shell
   * CSS variables. Defaults to the app's ambient theme (inherited from an
   * ancestor). e.g. `theme="strata-theme"`.
   */
  theme?: string
  /**
   * Per-group nav accent overrides, keyed by DocNav group id or role, driving
   * its `--doc-nav-group-accent` hook. Merged over the sensible default palette
   * (`pro → --warning`, the amber Pro dot); DocNav already defaults
   * shared → --info, other products → --accent, appendix → --text-tertiary.
   * Values are CSS colors or `var(--token)` references.
   */
  groupAccents?: Record<string, string>
  /**
   * Force the borderless treatment — null the pinned Shared group's frame
   * (`--doc-nav-pin-border: transparent`) and settle its fill onto the card
   * surface, for borderless themes (Animal / ENTR) that carry structure from
   * surface contrast, not borders. Auto-detected from `theme` for the known
   * borderless set; pass explicitly when the theme is applied by an ancestor.
   */
  borderless?: boolean
  /** The doc content, rendered in the content wrapper below the nav. */
  children: React.ReactNode
}

// ─── constants ─────────────────────────────────────────────────────────────────

/**
 * Themes that carry no borders by design (structure from surface contrast).
 * The pinned Shared group's derived tint reads as an unwanted frame on these,
 * so DocFrame nulls it. Overridable per-instance via the `borderless` prop.
 */
const BORDERLESS_THEMES = new Set(["animal-theme", "entr-theme"])

/**
 * Default per-group nav accents. DocNav already resolves shared → --info,
 * products → --accent, and appendix → --text-tertiary via its own fallbacks;
 * the only design-intent override the frame supplies is the amber Pro dot.
 */
const DEFAULT_GROUP_ACCENTS: Record<string, string> = {
  pro: "var(--warning, #d97706)",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function titleCase(value: string): string {
  if (value.length === 0) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Strip query + hash so an href compares cleanly against the current path. */
function normalizePath(value: string): string {
  return value.replace(/[?#].*$/, "")
}

/** Extract the URL from a computed `url("…")` custom-property value, if any. */
function cssUrl(value: string): string | null {
  const match = value.match(/url\(\s*["']?([^"')]+)["']?\s*\)/)
  return match ? match[1] : null
}

/**
 * Resolve the product roster: the explicit `manifest.products`, else inferred
 * from the distinct `scope` values across `docs` (first-appearance order).
 */
function resolveProducts(manifest: DocsManifest): DocProductEntry[] {
  if (manifest.products && manifest.products.length > 0) {
    return manifest.products
  }
  const seen = new Map<string, DocProductEntry>()
  for (const doc of manifest.docs) {
    if (!Array.isArray(doc.scope)) continue
    for (const id of doc.scope) {
      if (!seen.has(id)) seen.set(id, { id, label: titleCase(id) })
    }
  }
  return [...seen.values()]
}

/** The product owning the doc at `path` (its first `scope`), if any. */
function productForPath(docs: DocEntry[], path: string): string | undefined {
  const target = normalizePath(path)
  for (const doc of docs) {
    if (normalizePath(doc.href) !== target) continue
    if (Array.isArray(doc.scope) && doc.scope.length > 0) return doc.scope[0]
    return undefined
  }
  return undefined
}

// ─── brand slot ────────────────────────────────────────────────────────────────

/**
 * The default brand slot: the active theme's `brand.logo` SVG when the theme
 * ships one (via the `--brand-logo` custom property, mode-aware light/dark),
 * else the manifest `brand` text wordmark (a leading glyph chip + the name).
 *
 * SSR-safe + hardened by construction: the resting state renders the text
 * wordmark (always visible), and a client effect upgrades to the theme logo
 * only once the image actually loads — a 404 keeps the wordmark, never an empty
 * slot, and there is never a flash of invisibility on reload.
 */
function DocFrameBrand({ brand }: { brand?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [hasThemeLogo, setHasThemeLogo] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof window === "undefined") return
    const value = window
      .getComputedStyle(el)
      .getPropertyValue("--brand-logo")
      .trim()
    const url = value && value !== "none" ? cssUrl(value) : null
    if (!url) {
      setHasThemeLogo(false)
      return
    }
    // Hardening: probe-load the logo and only upgrade once it resolves, so a
    // failed load (a 404 theme-logo URL) leaves the visible wordmark in place.
    let cancelled = false
    const probe = new window.Image()
    probe.onload = () => {
      if (!cancelled) setHasThemeLogo(true)
    }
    probe.onerror = () => {
      if (!cancelled) setHasThemeLogo(false)
    }
    probe.src = url
    return () => {
      cancelled = true
    }
  }, [])

  const glyphChar = brand?.trim().charAt(0).toUpperCase()

  return (
    <span
      ref={ref}
      className={styles.brand}
      data-slot="doc-frame-brand"
      data-theme-logo={hasThemeLogo || undefined}
    >
      <span
        className={styles.themeLogo}
        role="img"
        aria-label={brand ?? "Documentation"}
      />
      {brand ? (
        <span className={styles.wordmark}>
          {glyphChar ? (
            <span className={styles.glyph} aria-hidden="true">
              {glyphChar}
            </span>
          ) : null}
          {brand}
        </span>
      ) : null}
    </span>
  )
}

// ─── DocFrame ────────────────────────────────────────────────────────────────

const DocFrame = React.forwardRef<HTMLDivElement, DocFrameProps>(
  (
    {
      manifest,
      logo,
      home,
      meta,
      activeProduct,
      currentPath,
      theme,
      groupAccents,
      borderless,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const resolvedPath =
      currentPath ??
      (typeof window !== "undefined" ? window.location.pathname : "/")

    const products = React.useMemo(() => resolveProducts(manifest), [manifest])
    const isMultiProduct = products.length > 1

    // Seed the open accordion product: explicit prop → the route's product →
    // the first product in the roster.
    const seededProduct =
      activeProduct ??
      productForPath(manifest.docs, resolvedPath) ??
      products[0]?.id

    const [openProduct, setOpenProduct] = React.useState<string | undefined>(
      seededProduct
    )

    // Keep the open product in sync when a controlling `activeProduct` changes.
    React.useEffect(() => {
      if (activeProduct) setOpenProduct(activeProduct)
    }, [activeProduct])

    const resolvedLogo = logo ?? <DocFrameBrand brand={manifest.brand} />

    // Borderless themes drop the pinned-group frame. Auto-detected from `theme`;
    // `borderless` overrides (e.g. when the theme is applied by an ancestor).
    const isBorderless =
      borderless ?? (theme ? BORDERLESS_THEMES.has(theme) : false)

    // Per-group nav accents → DocNav's `--doc-nav-group-accent` hook. Rendered
    // as a frame-scoped <style> keyed to this instance so it never leaks to a
    // sibling DocFrame. DocNav only *reads* the variable (via a fallback), so
    // any value set here wins with no specificity battle.
    const frameId = React.useId()
    const resolvedAccents: Record<string, string> = {
      ...DEFAULT_GROUP_ACCENTS,
      ...groupAccents,
    }
    const accentCss = Object.entries(resolvedAccents)
      .map(
        ([key, value]) =>
          `[data-doc-frame="${frameId}"] [data-group="${key}"],` +
          `[data-doc-frame="${frameId}"] [data-role="${key}"]` +
          `{--doc-nav-group-accent:${value}}`
      )
      .join("")

    const frameStyle = {
      ...(isBorderless
        ? {
            "--doc-nav-pin-border": "transparent",
            "--doc-nav-pin-bg": "var(--surface-card)",
          }
        : {}),
      ...style,
    } as React.CSSProperties

    return (
      <div
        ref={ref}
        data-slot="doc-frame"
        data-doc-frame={frameId}
        data-active-product={isMultiProduct ? openProduct : undefined}
        data-borderless={isBorderless || undefined}
        className={cn(styles.frame, theme, className)}
        style={frameStyle}
        {...props}
      >
        {accentCss ? <style>{accentCss}</style> : null}
        <header data-slot="doc-frame-header" className={styles.chrome}>
          <div className={styles.headerRow}>
            <div className={styles.brandSlot} data-slot="doc-frame-brand-slot">
              {resolvedLogo}
            </div>
            {home ? (
              <a
                href={home.href}
                className={styles.home}
                data-slot="doc-frame-home"
              >
                <CompassIcon
                  className={styles.homeIcon}
                  weight="regular"
                  aria-hidden="true"
                />
                <span>{home.label}</span>
              </a>
            ) : null}
            <div className={styles.spacer} aria-hidden="true" />
            {meta ? (
              <div className={styles.meta} data-slot="doc-frame-meta">
                {meta}
              </div>
            ) : null}
          </div>
          <div className={styles.navRow} data-slot="doc-frame-nav">
            <DocNav
              docs={manifest.docs}
              currentPath={resolvedPath}
              activeProduct={isMultiProduct ? openProduct : undefined}
              onProductToggle={isMultiProduct ? setOpenProduct : undefined}
            />
          </div>
        </header>

        <div className={styles.content} data-slot="doc-frame-content">
          {children}
        </div>
      </div>
    )
  }
)
DocFrame.displayName = "DocFrame"

export { DocFrame }
