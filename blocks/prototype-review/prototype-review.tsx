"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import styles from "./prototype-review.module.css"

// Types

export type PrototypeReviewMode = "light" | "dark"

export interface PrototypeReviewTheme {
  /** Stable identifier (also used as the body/html class). */
  id: string
  /** Human-readable label. */
  label: string
  /** Class applied to documentElement while this theme is active. */
  themeClass: string
}

export interface PrototypeReviewTreatment {
  /** Stable identifier, e.g. "t1". */
  id: string
  /** Short label, e.g. "T1". */
  label: string
  /** Long descriptive title. */
  title: string
  /** Long-form summary shown on the stage. */
  summary?: string
  /** Optional descriptive copy shown on the landing card. */
  description?: string
  /** Optional meta line shown on the landing card (e.g. "Owns cases 2 + 3"). */
  metaLabel?: string
  /** iframe src. Brand / theme / mode are appended via URL param. */
  src: string
  /** Optional inline tag pills shown above the iframe grid. */
  tags?: string[]
}

export interface PrototypeReviewViewport {
  /** Stable identifier (e.g. "mobile"). */
  id: string
  /** Short label (e.g. "Mobile" or "375"). */
  label: string
  /** Width in pixels for the iframe and frame container. */
  width: number
  /** Height in pixels for the iframe. */
  height: number
  /** Display string for the dimensions chip, e.g. "375 x 720". */
  display?: string
}

export interface PrototypeReviewBrandSwatch {
  /** Stable identifier. */
  id: string
  /** Hex string, format #RRGGBB. */
  hex: string
  /** Label / tooltip. */
  label: string
}

export interface PrototypeReviewBrandConfig {
  /** Default hex if no URL param overrides it. */
  default: string
  /** Visible swatches. Default ships 6. */
  swatches?: PrototypeReviewBrandSwatch[]
  /** Show the hex input next to the swatches. Default true. */
  hexInput?: boolean
  /** Show the reset button. Default true. */
  reset?: boolean
  /** Disable the brand picker entirely. */
  disabled?: boolean
}

export interface PrototypeReviewLandingCtxCard {
  heading: string
  body: React.ReactNode
}

export interface PrototypeReviewLanding {
  /** Eyebrow text above the title. */
  eyebrow?: string
  /** Title for the landing page. */
  title: React.ReactNode
  /** Lede paragraph. */
  lede?: React.ReactNode
  /** Optional context cards beneath the treatment grid. */
  contextCards?: PrototypeReviewLandingCtxCard[]
}

export interface PrototypeReviewFooter {
  /** Left-side text. */
  left?: React.ReactNode
  /** Right-side text. */
  right?: React.ReactNode
}

export interface PrototypeReviewStatusPill {
  label: string
  /** Highlight with brand color. */
  brand?: boolean
}

export interface PrototypeReviewState {
  treatmentId: string | null
  themeId: string
  mode: PrototypeReviewMode
  viewportId: string
  brand: string
}

export interface PrototypeReviewHookResult extends PrototypeReviewState {
  setTreatment: (id: string | null) => void
  setTheme: (id: string) => void
  setMode: (mode: PrototypeReviewMode) => void
  setViewport: (id: string) => void
  setBrand: (hex: string) => void
  resetBrand: () => void
}

export interface PrototypeReviewProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Linear ticket id (e.g. "BL-193"). */
  ticketId: string
  /** Review label shown next to the ticket (e.g. "Design Review"). */
  reviewLabel?: string
  /** Sub-label / context line. */
  subLabel?: string
  /** Status pills shown top-right of the header. */
  statusPills?: PrototypeReviewStatusPill[]
  /** Treatments shown in the tab strip. */
  treatments: PrototypeReviewTreatment[]
  /** Landing-page content. */
  landing: PrototypeReviewLanding
  /** Viewport configurations. The first becomes the "all" preset. */
  viewports?: {
    items?: PrototypeReviewViewport[]
    /** Default selected viewport id. Default "all". */
    defaultId?: string
    /** Show the "All" mode that renders every viewport in a row. Default true. */
    allEnabled?: boolean
  }
  /** Brand picker configuration. */
  brand?: PrototypeReviewBrandConfig
  /** Theme definitions exposed in the theme switcher. */
  themes?: PrototypeReviewTheme[]
  /** Default theme id. Falls back to the first theme. */
  defaultThemeId?: string
  /** Default mode. Default "dark". */
  defaultMode?: PrototypeReviewMode
  /** Default treatment id. If unset, the landing is shown. */
  defaultTreatmentId?: string | null
  /** Footer slot config. */
  footer?: PrototypeReviewFooter
  /** Imperative hook for advanced consumers. */
  onStateChange?: (state: PrototypeReviewState) => void
}

// Defaults & helpers

const DEFAULT_VIEWPORTS: PrototypeReviewViewport[] = [
  { id: "mobile", label: "375", width: 375, height: 720, display: "375 x 720" },
  { id: "tablet", label: "768", width: 768, height: 900, display: "768 x 900" },
  {
    id: "desktop",
    label: "1280",
    width: 1280,
    height: 1100,
    display: "1280 x 1100",
  },
]

const DEFAULT_BRAND_SWATCHES: PrototypeReviewBrandSwatch[] = [
  { id: "gold", hex: "#FFBE26", label: "Gold" },
  { id: "orange", hex: "#FF5A1F", label: "Hazard Orange" },
  { id: "red", hex: "#E60000", label: "Brutalist Red" },
  { id: "lime", hex: "#1AFF8F", label: "Lab Lime" },
  { id: "violet", hex: "#B388FF", label: "Ultraviolet" },
  { id: "blue", hex: "#3B82F6", label: "Cyan Wire" },
]

const HEX_RE = /^#([0-9A-Fa-f]{6})$/

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value)
}

function readUrlParam(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return new URL(window.location.href).searchParams.get(key)
  } catch {
    return null
  }
}

function appendIframeParams(
  src: string,
  params: { brand: string; themeClass: string; mode: PrototypeReviewMode }
): string {
  const sep = src.includes("?") ? "&" : "?"
  const qs = [
    "brand=" + encodeURIComponent(params.brand),
    "theme=" + encodeURIComponent(params.themeClass),
    "mode=" + encodeURIComponent(params.mode),
  ].join("&")
  return src + sep + qs
}

// State hook (also exported for advanced consumers)

export interface UsePrototypeReviewOptions {
  treatments: PrototypeReviewTreatment[]
  themes: PrototypeReviewTheme[]
  defaultThemeId?: string
  defaultMode?: PrototypeReviewMode
  defaultTreatmentId?: string | null
  defaultViewportId?: string
  defaultBrand: string
}

export function usePrototypeReview(
  options: UsePrototypeReviewOptions
): PrototypeReviewHookResult {
  const {
    themes,
    defaultThemeId,
    defaultMode = "dark",
    defaultTreatmentId = null,
    defaultViewportId = "all",
    defaultBrand,
  } = options

  const initialThemeId = React.useMemo(() => {
    const fromParam = readUrlParam("theme")
    if (fromParam) {
      const found = themes.find(
        (t) => t.id === fromParam || t.themeClass === fromParam
      )
      if (found) return found.id
    }
    if (defaultThemeId) return defaultThemeId
    return themes[0]?.id ?? "default"
  }, [themes, defaultThemeId])

  const initialMode = React.useMemo<PrototypeReviewMode>(() => {
    const fromParam = readUrlParam("mode")
    if (fromParam === "light" || fromParam === "dark") return fromParam
    return defaultMode
  }, [defaultMode])

  const initialBrand = React.useMemo(() => {
    const fromParam = readUrlParam("brand")
    if (fromParam && isValidHex(fromParam)) return fromParam.toUpperCase()
    return isValidHex(defaultBrand) ? defaultBrand.toUpperCase() : "#FFBE26"
  }, [defaultBrand])

  const [treatmentId, setTreatmentId] = React.useState<string | null>(
    defaultTreatmentId
  )
  const [themeId, setThemeIdState] = React.useState(initialThemeId)
  const [mode, setModeState] = React.useState<PrototypeReviewMode>(initialMode)
  const [viewportId, setViewportIdState] = React.useState(defaultViewportId)
  const [brand, setBrandState] = React.useState(initialBrand)

  const setBrand = React.useCallback((hex: string) => {
    const normalized = hex.startsWith("#") ? hex : "#" + hex
    if (isValidHex(normalized)) {
      setBrandState(normalized.toUpperCase())
    }
  }, [])

  const resetBrand = React.useCallback(() => {
    setBrandState(
      isValidHex(defaultBrand) ? defaultBrand.toUpperCase() : "#FFBE26"
    )
  }, [defaultBrand])

  return {
    treatmentId,
    themeId,
    mode,
    viewportId,
    brand,
    setTreatment: setTreatmentId,
    setTheme: setThemeIdState,
    setMode: setModeState,
    setViewport: setViewportIdState,
    setBrand,
    resetBrand,
  }
}

// PostMessage protocol

export interface PrototypeThemeMessage {
  type: "prototype-theme"
  themeClass: string
  mode: PrototypeReviewMode
  brand: string
}

function broadcastToIframes(
  container: HTMLElement | null,
  message: PrototypeThemeMessage
): void {
  if (!container || typeof window === "undefined") return
  const iframes = container.querySelectorAll("iframe")
  iframes.forEach((frame) => {
    if (frame.contentWindow) {
      try {
        frame.contentWindow.postMessage(message, "*")
      } catch {
        // Ignore cross-origin frames that refuse messages.
      }
    }
  })
}

// Header (internal)

interface HeaderProps {
  ticketId: string
  reviewLabel?: string
  subLabel?: string
  statusPills?: PrototypeReviewStatusPill[]
  brand: string
}

function Header({
  ticketId,
  reviewLabel,
  subLabel,
  statusPills = [],
  brand,
}: HeaderProps): React.JSX.Element {
  return (
    <header
      className={styles.chrome}
      data-slot="prototype-review-header"
    >
      <div className={styles.chromeRow}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            {ticketId.slice(0, 2)}
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>
              {ticketId}
              {reviewLabel ? " · " + reviewLabel : ""}
            </span>
            {subLabel ? (
              <span className={styles.brandSub}>{subLabel}</span>
            ) : null}
          </div>
        </div>
        <div className={styles.chromeActions}>
          {statusPills.map((pill, i) => (
            <span
              key={pill.label + "-" + i}
              className={cn(styles.pill, pill.brand && styles.pillBrand)}
            >
              {pill.label}
            </span>
          ))}
          <span
            className={cn(styles.pill, styles.pillBrand)}
            data-slot="prototype-review-brand-pill"
          >
            {brand}
          </span>
        </div>
      </div>
    </header>
  )
}

// Controls (internal)

interface ControlsProps {
  treatments: PrototypeReviewTreatment[]
  treatmentId: string | null
  onTreatmentChange: (id: string | null) => void

  themes: PrototypeReviewTheme[]
  themeId: string
  onThemeChange: (id: string) => void

  mode: PrototypeReviewMode
  onModeChange: (mode: PrototypeReviewMode) => void

  viewports: PrototypeReviewViewport[]
  viewportId: string
  allEnabled: boolean
  onViewportChange: (id: string) => void

  brand: string
  brandConfig: Required<
    Pick<PrototypeReviewBrandConfig, "swatches" | "hexInput" | "reset">
  > &
    Pick<PrototypeReviewBrandConfig, "disabled">
  onBrandChange: (hex: string) => void
  onBrandReset: () => void
}

function Controls(props: ControlsProps): React.JSX.Element {
  const {
    treatments,
    treatmentId,
    onTreatmentChange,
    themes,
    themeId,
    onThemeChange,
    mode,
    onModeChange,
    viewports,
    viewportId,
    allEnabled,
    onViewportChange,
    brand,
    brandConfig,
    onBrandChange,
    onBrandReset,
  } = props

  const [hexDraft, setHexDraft] = React.useState(brand)

  React.useEffect(() => {
    setHexDraft(brand)
  }, [brand])

  return (
    <section
      className={styles.controls}
      data-slot="prototype-review-controls"
    >
      <div className={styles.controlsRow}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Prototype treatments"
        >
          <button
            type="button"
            role="tab"
            aria-selected={treatmentId === null}
            className={styles.tab}
            onClick={() => onTreatmentChange(null)}
            data-active={treatmentId === null ? "true" : undefined}
          >
            Overview
          </button>
          {treatments.map((t) => {
            const selected = treatmentId === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={styles.tab}
                onClick={() => onTreatmentChange(t.id)}
                data-active={selected ? "true" : undefined}
              >
                <span className={styles.tabId}>{t.label}</span>
                {t.title}
              </button>
            )
          })}
        </div>

        <div className={styles.controlGroup}>
          {themes.length > 1 ? (
            <div className={styles.themeGroup}>
              <span className={styles.controlLabel}>Theme</span>
              <select
                className={styles.themeSelect}
                value={themeId}
                onChange={(e) => onThemeChange(e.target.value)}
                aria-label="Theme"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className={styles.modeGroup} role="group" aria-label="Mode">
            <span className={styles.controlLabel}>Mode</span>
            <div className={styles.toggleButtons}>
              <button
                type="button"
                className={styles.toggleButton}
                aria-pressed={mode === "light"}
                data-active={mode === "light" ? "true" : undefined}
                onClick={() => onModeChange("light")}
              >
                Light
              </button>
              <button
                type="button"
                className={styles.toggleButton}
                aria-pressed={mode === "dark"}
                data-active={mode === "dark" ? "true" : undefined}
                onClick={() => onModeChange("dark")}
              >
                Dark
              </button>
            </div>
          </div>

          <div className={styles.vpGroup} role="group" aria-label="Viewport">
            <span className={styles.controlLabel}>View</span>
            <div className={styles.toggleButtons}>
              {allEnabled ? (
                <button
                  type="button"
                  className={styles.toggleButton}
                  aria-pressed={viewportId === "all"}
                  data-active={viewportId === "all" ? "true" : undefined}
                  onClick={() => onViewportChange("all")}
                >
                  All
                </button>
              ) : null}
              {viewports.map((vp) => {
                const pressed = viewportId === vp.id
                return (
                  <button
                    key={vp.id}
                    type="button"
                    className={styles.toggleButton}
                    aria-pressed={pressed}
                    data-active={pressed ? "true" : undefined}
                    onClick={() => onViewportChange(vp.id)}
                  >
                    {vp.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {!brandConfig.disabled ? (
          <div className={styles.picker} aria-label="Brand color">
            <span className={styles.controlLabel}>Brand</span>
            <div
              className={styles.swatches}
              data-slot="prototype-review-swatches"
            >
              {brandConfig.swatches.map((sw) => {
                const active = sw.hex.toUpperCase() === brand.toUpperCase()
                return (
                  <button
                    key={sw.id}
                    type="button"
                    className={styles.swatch}
                    data-active={active ? "true" : undefined}
                    aria-label={"Brand " + sw.label}
                    aria-pressed={active}
                    title={sw.label}
                    onClick={() => onBrandChange(sw.hex)}
                    style={{ background: sw.hex }}
                  />
                )
              })}
            </div>
            {brandConfig.hexInput ? (
              <input
                type="text"
                className={styles.hexInput}
                value={hexDraft}
                maxLength={7}
                spellCheck={false}
                aria-label="Brand hex value"
                onChange={(e) => {
                  const next = e.target.value
                  setHexDraft(next)
                  const normalized = next.startsWith("#") ? next : "#" + next
                  if (isValidHex(normalized)) {
                    onBrandChange(normalized)
                  }
                }}
              />
            ) : null}
            {brandConfig.reset ? (
              <button
                type="button"
                className={styles.resetButton}
                onClick={onBrandReset}
              >
                Reset
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

// Landing (internal)

interface LandingProps {
  landing: PrototypeReviewLanding
  treatments: PrototypeReviewTreatment[]
  onTreatmentSelect: (id: string) => void
}

function Landing({
  landing,
  treatments,
  onTreatmentSelect,
}: LandingProps): React.JSX.Element {
  return (
    <main
      className={styles.landing}
      data-slot="prototype-review-landing"
    >
      {landing.eyebrow ? (
        <div className={styles.landingEyebrow}>{landing.eyebrow}</div>
      ) : null}
      <h1 className={styles.landingTitle}>{landing.title}</h1>
      {landing.lede ? (
        <p className={styles.landingLede}>{landing.lede}</p>
      ) : null}

      <div className={styles.protoGrid}>
        {treatments.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.protoCard}
            onClick={() => onTreatmentSelect(t.id)}
          >
            <span className={styles.protoCardId}>{t.label}</span>
            <span className={styles.protoCardTitle}>{t.title}</span>
            {t.description ? (
              <span className={styles.protoCardDesc}>{t.description}</span>
            ) : null}
            {t.metaLabel ? (
              <span className={styles.protoCardMeta}>{t.metaLabel}</span>
            ) : null}
          </button>
        ))}
      </div>

      {landing.contextCards && landing.contextCards.length > 0 ? (
        <div className={styles.ctxGrid}>
          {landing.contextCards.map((card, i) => (
            <div key={i} className={styles.ctxCard}>
              <h4>{card.heading}</h4>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  )
}

// Stage (internal)

interface StageProps {
  treatment: PrototypeReviewTreatment
  viewports: PrototypeReviewViewport[]
  viewportId: string
  brand: string
  themeClass: string
  mode: PrototypeReviewMode
  containerRef: React.RefObject<HTMLDivElement | null>
}

function Stage({
  treatment,
  viewports,
  viewportId,
  brand,
  themeClass,
  mode,
  containerRef,
}: StageProps): React.JSX.Element {
  const activeViewports =
    viewportId === "all"
      ? viewports
      : viewports.filter((vp) => vp.id === viewportId)
  const solo = activeViewports.length === 1

  return (
    <section
      className={styles.stage}
      data-slot="prototype-review-stage"
    >
      <div className={styles.stageMeta}>
        <div className={styles.stageTitleBlock}>
          <h2 className={styles.stageTitle}>
            <span>{treatment.label} · </span>
            <em>{treatment.title}</em>
          </h2>
          {treatment.summary ? (
            <p className={styles.stageSummary}>{treatment.summary}</p>
          ) : null}
        </div>
        {treatment.tags && treatment.tags.length > 0 ? (
          <div className={styles.stageTagRow}>
            {treatment.tags.map((tag, i) => (
              <span key={tag + "-" + i} className={styles.pill}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className={cn(styles.viewportGrid, solo && styles.viewportGridSolo)}
        data-slot="prototype-review-viewport-grid"
        data-solo={solo ? "true" : undefined}
      >
        {activeViewports.map((vp) => {
          const src = appendIframeParams(treatment.src, {
            brand,
            themeClass,
            mode,
          })
          return (
            <div
              key={vp.id}
              className={styles.vpFrame}
              data-vp={vp.id}
              style={solo ? { maxWidth: vp.width + "px" } : undefined}
            >
              <div className={styles.vpFrameHead}>
                <span className={styles.vpFrameName}>{vp.label}</span>
                {vp.display ? (
                  <span className={styles.vpFrameDims}>{vp.display}</span>
                ) : null}
              </div>
              <div className={styles.vpIframeWrap}>
                <iframe
                  src={src}
                  width={vp.width}
                  height={vp.height}
                  loading="lazy"
                  title={treatment.label + " " + treatment.title + " — " + vp.label}
                  className={styles.vpIframe}
                  data-viewport={vp.id}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// Footer (internal)

interface FooterPropsInternal {
  footer?: PrototypeReviewFooter
  brand: string
}

function Footer({
  footer,
  brand,
}: FooterPropsInternal): React.JSX.Element | null {
  if (!footer) return null
  return (
    <footer className={styles.foot} data-slot="prototype-review-footer">
      {footer.left ? <span>{footer.left}</span> : <span />}
      <span data-slot="prototype-review-active-brand">Brand · {brand}</span>
      {footer.right ? <span>{footer.right}</span> : <span />}
    </footer>
  )
}

// Block

const FALLBACK_THEME: PrototypeReviewTheme = {
  id: "visor-default",
  label: "Default",
  themeClass: "visor-theme-default",
}

export function PrototypeReview({
  ticketId,
  reviewLabel,
  subLabel,
  statusPills,
  treatments,
  landing,
  viewports: viewportsProp,
  brand: brandProp,
  themes: themesProp,
  defaultThemeId,
  defaultMode = "dark",
  defaultTreatmentId = null,
  footer,
  onStateChange,
  className,
  ...rest
}: PrototypeReviewProps): React.JSX.Element {
  const themes = themesProp && themesProp.length > 0 ? themesProp : [FALLBACK_THEME]
  const viewports =
    viewportsProp?.items && viewportsProp.items.length > 0
      ? viewportsProp.items
      : DEFAULT_VIEWPORTS
  const allEnabled = viewportsProp?.allEnabled !== false
  const defaultViewportId =
    viewportsProp?.defaultId ?? (allEnabled ? "all" : viewports[0]?.id ?? "all")

  const brandConfig: Required<
    Pick<PrototypeReviewBrandConfig, "swatches" | "hexInput" | "reset">
  > &
    Pick<PrototypeReviewBrandConfig, "disabled"> = {
    swatches:
      brandProp?.swatches && brandProp.swatches.length > 0
        ? brandProp.swatches
        : DEFAULT_BRAND_SWATCHES,
    hexInput: brandProp?.hexInput !== false,
    reset: brandProp?.reset !== false,
    disabled: brandProp?.disabled,
  }
  const defaultBrand = brandProp?.default ?? "#FFBE26"

  const state = usePrototypeReview({
    treatments,
    themes,
    defaultThemeId,
    defaultMode,
    defaultTreatmentId,
    defaultViewportId,
    defaultBrand,
  })

  const activeTheme =
    themes.find((t) => t.id === state.themeId) ?? themes[0] ?? FALLBACK_THEME
  const activeTreatment =
    state.treatmentId != null
      ? treatments.find((t) => t.id === state.treatmentId) ?? null
      : null

  const stageContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Apply theme + mode to the host page (document element).
  React.useEffect(() => {
    if (typeof document === "undefined") return
    const html = document.documentElement
    if (!html) return

    const previousMode = html.getAttribute("data-mode")
    html.setAttribute("data-mode", state.mode)

    const themeClass = activeTheme.themeClass
    html.classList.add(themeClass)

    return () => {
      html.classList.remove(themeClass)
      if (previousMode == null) html.removeAttribute("data-mode")
      else html.setAttribute("data-mode", previousMode)
    }
  }, [activeTheme.themeClass, state.mode])

  // Apply brand color CSS variables to the wrapper.
  const brandVars = React.useMemo<React.CSSProperties>(() => {
    const rgb = hexToRgb(state.brand)
    if (!rgb) return {}
    const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
    const onText = luma > 0.55 ? "#000" : "#fff"
    return {
      ["--prototype-review-brand" as string]: state.brand,
      ["--prototype-review-brand-soft" as string]:
        "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0.12)",
      ["--prototype-review-brand-glow" as string]:
        "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0.35)",
      ["--prototype-review-brand-on" as string]: onText,
    } as React.CSSProperties
  }, [state.brand])

  // Notify advanced consumers and broadcast theme to nested iframes.
  React.useEffect(() => {
    onStateChange?.({
      treatmentId: state.treatmentId,
      themeId: state.themeId,
      mode: state.mode,
      viewportId: state.viewportId,
      brand: state.brand,
    })
    broadcastToIframes(stageContainerRef.current, {
      type: "prototype-theme",
      themeClass: activeTheme.themeClass,
      mode: state.mode,
      brand: state.brand,
    })
  }, [
    onStateChange,
    state.treatmentId,
    state.themeId,
    state.mode,
    state.viewportId,
    state.brand,
    activeTheme.themeClass,
  ])

  return (
    <div
      {...rest}
      className={cn(styles.root, className)}
      data-slot="prototype-review"
      data-mode={state.mode}
      data-theme={state.themeId}
      style={{ ...brandVars, ...rest.style }}
    >
      <Header
        ticketId={ticketId}
        reviewLabel={reviewLabel}
        subLabel={subLabel}
        statusPills={statusPills}
        brand={state.brand}
      />
      <Controls
        treatments={treatments}
        treatmentId={state.treatmentId}
        onTreatmentChange={state.setTreatment}
        themes={themes}
        themeId={state.themeId}
        onThemeChange={state.setTheme}
        mode={state.mode}
        onModeChange={state.setMode}
        viewports={viewports}
        viewportId={state.viewportId}
        allEnabled={allEnabled}
        onViewportChange={state.setViewport}
        brand={state.brand}
        brandConfig={brandConfig}
        onBrandChange={state.setBrand}
        onBrandReset={state.resetBrand}
      />
      {activeTreatment ? (
        <Stage
          treatment={activeTreatment}
          viewports={viewports}
          viewportId={state.viewportId}
          brand={state.brand}
          themeClass={activeTheme.themeClass}
          mode={state.mode}
          containerRef={stageContainerRef}
        />
      ) : (
        <Landing
          landing={landing}
          treatments={treatments}
          onTreatmentSelect={state.setTreatment}
        />
      )}
      <Footer footer={footer} brand={state.brand} />
    </div>
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = HEX_RE.exec(hex)
  if (!m) return null
  const v = m[1]
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}
