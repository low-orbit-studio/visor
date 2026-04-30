"use client"

import * as React from "react"
import styles from "./source-inspector.module.css"
import {
  classifyByVisorName,
  classifyFile,
  DEFAULT_CLASSIFIERS,
  type Classifiers,
  type SourceLabel,
} from "./classify"

export type { Classifiers, SourceLabel } from "./classify"
export { classifyByVisorName, classifyFile, DEFAULT_CLASSIFIERS } from "./classify"

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
  type?: unknown
  _debugSource?: { fileName?: string } | null
  _debugOwner?: FiberLike | null
  _debugStack?: unknown
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

// React 19's JSX dev runtime hangs an Error on `_debugOwner._debugStack`.
// Older runtimes set `_debugSource.fileName` directly on the fiber. Some
// builds expose the stack as a plain string. Normalize all of those.
function readStackString(stack: unknown): string | undefined {
  if (!stack) return undefined
  if (typeof stack === "string") return stack
  if (stack instanceof Error) return stack.stack ?? undefined
  if (typeof stack === "object" && "stack" in stack) {
    const s = (stack as { stack?: unknown }).stack
    if (typeof s === "string") return s
  }
  return undefined
}

// Frames whose URL or function name match these are the JSX dev runtime
// itself, React's reconciler bottom frame, or the server-component runtime.
// They appear above the user JSX call in `_debugStack` traces and must be
// skipped to reach the meaningful source frame.
const REACT_INTERNAL_FRAME_PATTERN =
  /(react-stack-bottom-frame|react-server-dom|react-jsx-dev-runtime|react-jsx-runtime|\bjsxDEV\b|\bjsxs?\b)/

/**
 * Parse a captured Error stack and return the URL of the first frame that
 * looks like user code. Returns undefined if every frame is a React-internal
 * frame, the stack is empty, or no URL is parseable.
 *
 * Exported for unit testing — not part of the SourceInspector public API.
 */
export function extractFirstUserUrl(stack: string): string | undefined {
  const lines = stack.split("\n")
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line.startsWith("at ")) continue

    let fnName = ""
    let location = ""

    const parenMatch = line.match(/^at\s+(.+?)\s+\((.+)\)\s*$/)
    if (parenMatch) {
      fnName = parenMatch[1]
      location = parenMatch[2]
    } else {
      const bareMatch = line.match(/^at\s+(.+)$/)
      if (!bareMatch) continue
      location = bareMatch[1]
    }

    if (!location) continue
    const url = location.replace(/:\d+:\d+$/, "")
    if (!url) continue
    if (REACT_INTERNAL_FRAME_PATTERN.test(fnName)) continue
    if (REACT_INTERNAL_FRAME_PATTERN.test(url)) continue

    return url
  }
  return undefined
}

function findOwningSource(fiber: FiberLike | null): string | undefined {
  let current: FiberLike | null | undefined = fiber
  while (current) {
    const legacyFileName = current._debugSource?.fileName
    if (legacyFileName) return legacyFileName

    const owner: FiberLike | null | undefined = current._debugOwner
    if (owner) {
      const stackString = readStackString(owner._debugStack)
      if (stackString) {
        const url = extractFirstUserUrl(stackString)
        if (url) return url
      }
      current = owner
      continue
    }

    current = current.return
  }
  return undefined
}

// Walk the owner chain to find the nearest React component name. `displayName`
// wins over `name` when both are present (matches React DevTools). Returns
// undefined when we hit a host element with no component owner.
function readOwnerName(owner: FiberLike): string | undefined {
  const type = owner.type as
    | { displayName?: unknown; name?: unknown }
    | null
    | undefined
  if (!type) return undefined
  const display = type.displayName
  if (typeof display === "string" && display) return display
  const name = type.name
  if (typeof name === "string" && name) return name
  return undefined
}

/**
 * Exported for unit testing — not part of the SourceInspector public API.
 * Walks the owner chain returning the first non-empty component name.
 */
export function findOwnerName(fiber: FiberLike | null): string | undefined {
  let current: FiberLike | null | undefined = fiber
  while (current) {
    const owner: FiberLike | null | undefined = current._debugOwner
    if (owner) {
      const name = readOwnerName(owner)
      if (name) return name
      current = owner
      continue
    }
    current = current.return
  }
  return undefined
}

function stampNode(
  el: Element,
  classifiers: Classifiers,
  hasCustomVisorClassifier: boolean,
) {
  const fiber = getFiberFromNode(el)

  // Bundler-independent fast path: match the owning React component name
  // against the registry-derived set. Skipped when the host supplied a
  // custom `visor` predicate so consumer overrides win over both built-in
  // signals (the URL fallback already honors custom classifiers).
  if (!hasCustomVisorClassifier) {
    const ownerName = findOwnerName(fiber)
    const nameLabel = classifyByVisorName(ownerName)
    if (nameLabel) {
      if (el.getAttribute(DATA_ATTR) !== nameLabel) {
        el.setAttribute(DATA_ATTR, nameLabel)
      }
      return
    }
  }

  const source = findOwningSource(fiber)
  const label: SourceLabel = classifyFile(source, classifiers)
  if (el.getAttribute(DATA_ATTR) !== label) {
    el.setAttribute(DATA_ATTR, label)
  }
}

function stampSubtree(
  root: Element,
  classifiers: Classifiers,
  hasCustomVisorClassifier: boolean,
) {
  stampNode(root, classifiers, hasCustomVisorClassifier)
  const all = root.querySelectorAll("*")
  for (let i = 0; i < all.length; i++) {
    stampNode(all[i], classifiers, hasCustomVisorClassifier)
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

  // Detect a host-supplied visor predicate so the name-based fast path can
  // step aside. `Classifiers` is a permissive shape — equality against the
  // default sentinel is the only signal that the host did NOT override it.
  const hasCustomVisorClassifier =
    classifiers.visor !== undefined &&
    classifiers.visor !== DEFAULT_CLASSIFIERS.visor

  const classifiersRef = React.useRef(classifiers)
  classifiersRef.current = classifiers
  const hasCustomVisorRef = React.useRef(hasCustomVisorClassifier)
  hasCustomVisorRef.current = hasCustomVisorClassifier

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
        stampSubtree(
          document.body,
          classifiersRef.current,
          hasCustomVisorRef.current,
        )
      }, debounceMs)
    }

    stampSubtree(
      document.body,
      classifiersRef.current,
      hasCustomVisorRef.current,
    )

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
