"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { DocNav, type DocEntry } from "../doc-nav/doc-nav"
import styles from "./doc-frame.module.css"

/**
 * PL-2185 · VI-609 — the themed doc-page shell that wraps <DocNav>.
 *
 * DocFrame owns the page: theme tokens, a sticky header with a flexible
 * brand/logo slot, the <DocNav> slot, and the content wrapper (the doc as
 * children). It reads the single `manifest`, derives the active product, and
 * passes the slice + active-state down to DocNav. Everything is themed by Visor
 * tokens, so the shell adopts the active project theme without modification.
 *
 * Replaces the vanilla-JS doc shell (nav.js + docs.css) on the React/route
 * track. The static-HTML track is served by a generated `doc-shell.js` shim
 * (the evolved nav.js) that lives with the golden-ticket docs host — this
 * component is the source of truth its markup is generated from.
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

// ─── props ─────────────────────────────────────────────────────────────────────

export interface DocFrameProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** The parsed manifest — the single input everything derives from. */
  manifest: DocsManifest
  /**
   * The brand slot. Any node — an `<img>` of an SVG, an inline `<svg>`, or a
   * full component (an animated mark, a Visor `<Brand>`). Resolution order:
   * explicit `logo` → the active theme's `brand.logo` SVG (mode-aware via
   * `--brand-logo`) → the manifest `brand` text.
   */
  logo?: React.ReactNode
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
  /** The doc content, rendered in the content wrapper below the nav. */
  children: React.ReactNode
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
 * else the manifest `brand` text wordmark.
 *
 * SSR-safe by construction: the resting state renders the text wordmark
 * (always visible), and a client effect upgrades to the theme logo only when
 * `--brand-logo` resolves — never a flash of invisibility on reload.
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
    setHasThemeLogo(value !== "" && value !== "none")
  }, [])

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
      {brand ? <span className={styles.wordmark}>{brand}</span> : null}
    </span>
  )
}

// ─── DocFrame ────────────────────────────────────────────────────────────────

const DocFrame = React.forwardRef<HTMLDivElement, DocFrameProps>(
  (
    {
      manifest,
      logo,
      activeProduct,
      currentPath,
      theme,
      children,
      className,
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

    return (
      <div
        ref={ref}
        data-slot="doc-frame"
        data-active-product={isMultiProduct ? openProduct : undefined}
        className={cn(styles.frame, theme, className)}
        {...props}
      >
        <header
          data-slot="doc-frame-header"
          className={styles.chrome}
        >
          <div className={styles.headerRow}>
            <div className={styles.brandSlot} data-slot="doc-frame-brand-slot">
              {resolvedLogo}
            </div>
            <div className={styles.spacer} aria-hidden="true" />
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
