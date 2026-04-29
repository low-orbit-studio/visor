"use client"

import * as React from "react"
import styles from "./source-inspector.module.css"
import {
  classifyFile,
  DEFAULT_CLASSIFIERS,
  type Classifiers,
  type SourceLabel,
} from "./classify"

export type { Classifiers, SourceLabel } from "./classify"
export { classifyFile, DEFAULT_CLASSIFIERS } from "./classify"

export type Mode = "off" | "highlight-visor" | "highlight-non-visor"

const MODE_CYCLE: Record<Mode, Mode> = {
  off: "highlight-visor",
  "highlight-visor": "highlight-non-visor",
  "highlight-non-visor": "off",
}

interface SourceInspectorContextValue {
  mode: Mode
  setMode: (mode: Mode) => void
  cycleMode: () => void
}

export const SourceInspectorContext =
  React.createContext<SourceInspectorContextValue | null>(null)

export interface SourceInspectorProviderProps {
  defaultMode?: Mode
  mode?: Mode
  onModeChange?: (mode: Mode) => void
  children?: React.ReactNode
}

export function SourceInspectorProvider({
  defaultMode = "off",
  mode: controlledMode,
  onModeChange,
  children,
}: SourceInspectorProviderProps) {
  const [internalMode, setInternalMode] = React.useState<Mode>(defaultMode)
  const isControlled = controlledMode !== undefined
  const mode = isControlled ? controlledMode : internalMode

  const setMode = React.useCallback(
    (next: Mode) => {
      if (!isControlled) setInternalMode(next)
      onModeChange?.(next)
    },
    [isControlled, onModeChange],
  )

  const cycleMode = React.useCallback(() => {
    setMode(MODE_CYCLE[mode])
  }, [mode, setMode])

  const value = React.useMemo(
    () => ({ mode, setMode, cycleMode }),
    [mode, setMode, cycleMode],
  )

  return (
    <SourceInspectorContext.Provider value={value}>
      {children}
    </SourceInspectorContext.Provider>
  )
}

export function useSourceInspector(): SourceInspectorContextValue {
  const ctx = React.useContext(SourceInspectorContext)
  if (!ctx) {
    throw new Error(
      "useSourceInspector must be used within <SourceInspectorProvider> or <SourceInspector>",
    )
  }
  return ctx
}

export function useOptionalSourceInspector(): SourceInspectorContextValue | null {
  return React.useContext(SourceInspectorContext)
}

export interface SourceInspectorProps extends SourceInspectorProviderProps {
  classifiers?: Classifiers
  hotkey?: string | null
  debounceMs?: number
}

const DATA_ATTR = "data-source"

interface FiberLike {
  child?: FiberLike | null
  sibling?: FiberLike | null
  stateNode?: unknown
  _debugSource?: { fileName?: string } | null
  return?: FiberLike | null
}

function getFiberFromNode(node: Element): FiberLike | null {
  for (const key of Object.keys(node)) {
    if (key.startsWith("__reactFiber$")) {
      return (node as unknown as Record<string, FiberLike>)[key] ?? null
    }
  }
  return null
}

function findOwningFileName(fiber: FiberLike | null): string | undefined {
  let current: FiberLike | null | undefined = fiber
  while (current) {
    const fileName = current._debugSource?.fileName
    if (fileName) return fileName
    current = current.return
  }
  return undefined
}

function stampNode(el: Element, classifiers: Classifiers) {
  const fiber = getFiberFromNode(el)
  const fileName = findOwningFileName(fiber)
  const label: SourceLabel = classifyFile(fileName, classifiers)
  if (el.getAttribute(DATA_ATTR) !== label) {
    el.setAttribute(DATA_ATTR, label)
  }
}

function stampSubtree(root: Element, classifiers: Classifiers) {
  stampNode(root, classifiers)
  const all = root.querySelectorAll("*")
  for (let i = 0; i < all.length; i++) {
    stampNode(all[i], classifiers)
  }
}

function clearStamps(root: Element) {
  root.removeAttribute(DATA_ATTR)
  const all = root.querySelectorAll(`[${DATA_ATTR}]`)
  for (let i = 0; i < all.length; i++) {
    all[i].removeAttribute(DATA_ATTR)
  }
}

function parseHotkey(spec: string): { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean; key: string } | null {
  const parts = spec.toLowerCase().split("+").map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  let ctrl = false
  let shift = false
  let alt = false
  let meta = false
  let key = ""
  for (const part of parts) {
    if (part === "ctrl" || part === "control") ctrl = true
    else if (part === "shift") shift = true
    else if (part === "alt" || part === "option") alt = true
    else if (part === "meta" || part === "cmd" || part === "command") meta = true
    else key = part
  }
  if (!key) return null
  return { ctrl, shift, alt, meta, key }
}

function matchesHotkey(event: KeyboardEvent, parsed: ReturnType<typeof parseHotkey>): boolean {
  if (!parsed) return false
  if (event.ctrlKey !== parsed.ctrl) return false
  if (event.shiftKey !== parsed.shift) return false
  if (event.altKey !== parsed.alt) return false
  if (event.metaKey !== parsed.meta) return false
  return event.key.toLowerCase() === parsed.key
}

function SourceInspectorRunner({
  classifiers = DEFAULT_CLASSIFIERS,
  hotkey = "ctrl+shift+x",
  debounceMs = 100,
}: Pick<SourceInspectorProps, "classifiers" | "hotkey" | "debounceMs">) {
  const ctx = useSourceInspector()
  const { mode, cycleMode } = ctx

  const bodyClass =
    mode === "highlight-visor"
      ? styles.modeHighlightVisor
      : mode === "highlight-non-visor"
        ? styles.modeHighlightNonVisor
        : null

  const classifiersRef = React.useRef(classifiers)
  classifiersRef.current = classifiers

  // Stamp + observe whenever overlay is enabled.
  React.useEffect(() => {
    if (mode === "off") {
      clearStamps(document.body)
      return
    }

    let scheduled: ReturnType<typeof setTimeout> | null = null
    const scheduleStamp = () => {
      if (scheduled !== null) return
      scheduled = setTimeout(() => {
        scheduled = null
        stampSubtree(document.body, classifiersRef.current)
      }, debounceMs)
    }

    stampSubtree(document.body, classifiersRef.current)

    const observer = new MutationObserver(() => {
      scheduleStamp()
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    })

    return () => {
      observer.disconnect()
      if (scheduled !== null) clearTimeout(scheduled)
      clearStamps(document.body)
    }
  }, [mode, debounceMs])

  // Apply body class for the active overlay rules.
  React.useEffect(() => {
    if (!bodyClass) return
    document.body.classList.add(bodyClass)
    return () => {
      document.body.classList.remove(bodyClass)
    }
  }, [bodyClass])

  // Hotkey listener.
  React.useEffect(() => {
    if (!hotkey) return
    const parsed = parseHotkey(hotkey)
    if (!parsed) return
    const handler = (event: KeyboardEvent) => {
      if (matchesHotkey(event, parsed)) {
        event.preventDefault()
        cycleMode()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [hotkey, cycleMode])

  return null
}

function SourceInspectorDevImpl({
  classifiers,
  hotkey = "ctrl+shift+x",
  debounceMs,
  defaultMode,
  mode,
  onModeChange,
  children,
}: SourceInspectorProps) {
  const existing = React.useContext(SourceInspectorContext)
  const runner = (
    <SourceInspectorRunner classifiers={classifiers} hotkey={hotkey} debounceMs={debounceMs} />
  )
  if (existing) {
    return (
      <>
        {runner}
        {children}
      </>
    )
  }
  return (
    <SourceInspectorProvider defaultMode={defaultMode} mode={mode} onModeChange={onModeChange}>
      {runner}
      {children}
    </SourceInspectorProvider>
  )
}

// Active in development and test; no-op in production. Bundlers replace
// process.env.NODE_ENV with a literal during the production build, allowing
// dead-code elimination of the dev impl entirely.
const IS_PRODUCTION = process.env.NODE_ENV === "production"

export function SourceInspector(props: SourceInspectorProps) {
  if (IS_PRODUCTION) {
    return props.children ? <>{props.children}</> : null
  }
  return <SourceInspectorDevImpl {...props} />
}
