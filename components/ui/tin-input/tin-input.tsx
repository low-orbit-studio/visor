"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { Input } from "../input/input"
import { Button } from "../button/button"
import { FieldDescription, FieldError } from "../field/field"
import styles from "./tin-input.module.css"

export type TinKind = "ssn" | "ein"

export interface TinInputProps
  extends Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    | "id"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-required"
  > {
  /** Display grouping: SSN `###-##-####` or EIN `##-#######`. Both are 9 digits. */
  kind: TinKind
  /**
   * Called with the 9 digits once the entry is complete, and with `null` while
   * it is incomplete or cleared. The only place the digits ever leave the
   * component.
   */
  onValueChange: (digits: string | null) => void
  /** Last four digits of a TIN already on file. Renders the on-file echo with a Replace button. */
  lastFour?: string
  /** Called when Replace swaps the on-file echo for an empty field. */
  onReplace?: () => void
  disabled?: boolean
  /** Error message, rendered through the Visor field convention and bound by `aria-describedby`. */
  error?: string
  /** Size of the field and the Replace button. `lg` meets 44px touch targets. */
  size?: "sm" | "md" | "lg"
  className?: string
}

const TIN_LENGTH = 9
const MASK = "•"
const GROUPS: Record<TinKind, readonly number[]> = { ssn: [3, 2, 4], ein: [2, 7] }
const PASTE_TOO_LONG = "A taxpayer ID has 9 digits. That paste has more."

/** Lays characters out in the kind's grouping, adding a dash only once the next group starts. */
function group(kind: TinKind, chars: string): string {
  let out = ""
  let start = 0
  for (const size of GROUPS[kind]) {
    if (start >= chars.length) break
    out += (start > 0 ? "-" : "") + chars.slice(start, start + size)
    start += size
  }
  return out
}

/** Maps a caret offset in the masked value to an index into the digits. */
function digitIndex(display: string, offset: number): number {
  return display.slice(0, offset).replace(/-/g, "").length
}

/**
 * A write-only, masked 9-digit TIN field. The input's value is only ever the
 * mask: every edit is intercepted before it reaches the DOM and applied to
 * digits held in memory, so the digits are never in `input.value` or in any
 * attribute. On blur a complete entry shows only the grouping mask and the
 * last four, and the digits are dropped; focusing it again clears it.
 */
const TinInput = React.forwardRef<HTMLInputElement, TinInputProps>(
  (
    {
      kind,
      onValueChange,
      lastFour,
      onReplace,
      disabled,
      error,
      size,
      className,
      id,
      "aria-describedby": ariaDescribedBy,
      ...aria
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const digitsRef = React.useRef("")
    // `caret` is a digit index. A fresh object per edit re-renders even when
    // the digit count is unchanged, so the caret is always put back.
    const [entry, setEntry] = React.useState({ count: 0, caret: 0 })
    const [committedLastFour, setCommittedLastFour] = React.useState<string | null>(null)
    const [pasteError, setPasteError] = React.useState<string | null>(null)
    const [replacing, setReplacing] = React.useState(false)
    // Until hydration nothing intercepts keystrokes, so the server-rendered
    // field refuses input rather than showing the digits typed into it.
    const [hydrated, setHydrated] = React.useState(false)
    React.useEffect(() => setHydrated(true), [])
    // `undefined` until the first emission, so the first keystroke reports `null`.
    const lastEmittedNull = React.useRef<boolean | undefined>(undefined)

    const baseId = React.useId()
    const hintId = `${baseId}-hint`
    const errorId = `${baseId}-error`
    const echoId = `${baseId}-echo`

    const onFileLastFour = lastFour?.replace(/\D/g, "").slice(-4)
    const onFile = Boolean(onFileLastFour) && !replacing
    const errorText = pasteError ?? error

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )

    const emit = (digits: string | null) => {
      if (digits === null && lastEmittedNull.current === true) return
      lastEmittedNull.current = digits === null
      onValueChange(digits)
    }

    const apply = (digits: string, caret: number) => {
      digitsRef.current = digits
      setPasteError(null)
      setEntry({ count: digits.length, caret })
      emit(digits.length === TIN_LENGTH ? digits : null)
    }

    /** Inserts the digits of `text` over the digit range `[from, to)`. */
    const insert = (text: string, from: number, to: number, isPaste: boolean) => {
      const typed = text.replace(/\D/g, "")
      if (!typed) return
      const current = digitsRef.current
      const next = current.slice(0, from) + typed + current.slice(to)
      if (next.length > TIN_LENGTH) {
        // Typing past nine is ignored; a paste that would overflow is refused
        // whole rather than truncated into a different number.
        if (isPaste) setPasteError(PASTE_TOO_LONG)
        return
      }
      apply(next, from + typed.length)
    }

    const selection = (input: HTMLInputElement) => {
      const display = input.value
      return {
        from: digitIndex(display, input.selectionStart ?? display.length),
        to: digitIndex(display, input.selectionEnd ?? display.length),
      }
    }

    const handleBeforeInput = (event: InputEvent) => {
      event.preventDefault()
      const input = event.currentTarget as HTMLInputElement
      let { from, to } = selection(input)
      const type = event.inputType
      if (type.startsWith("insert")) {
        const text = event.data ?? event.dataTransfer?.getData("text") ?? ""
        insert(text, from, to, type !== "insertText")
        return
      }
      if (!type.startsWith("delete")) return
      if (from === to) {
        // Digits have no words or lines, so those deletions take everything
        // on that side of the caret.
        if (type === "deleteContentBackward") from = Math.max(0, from - 1)
        else if (type === "deleteContentForward") to = Math.min(digitsRef.current.length, to + 1)
        else if (type.endsWith("Backward")) from = 0
        else if (type.endsWith("Forward")) to = digitsRef.current.length
      }
      if (from === to) return
      const current = digitsRef.current
      apply(current.slice(0, from) + current.slice(to), from)
    }
    const beforeInputRef = React.useRef(handleBeforeInput)
    beforeInputRef.current = handleBeforeInput

    // React's `onBeforeInput` is a synthetic event without `inputType`, and it
    // does not see deletions, so the native event is attached directly.
    React.useEffect(() => {
      const input = inputRef.current
      if (!input || onFile) return
      const listener = (event: Event) => beforeInputRef.current(event as InputEvent)
      input.addEventListener("beforeinput", listener)
      return () => input.removeEventListener("beforeinput", listener)
    }, [onFile])

    React.useLayoutEffect(() => {
      const input = inputRef.current
      if (!input || input !== document.activeElement) return
      const offset = group(kind, MASK.repeat(entry.caret)).length
      input.setSelectionRange(offset, offset)
    }, [entry, kind])

    React.useEffect(() => {
      if (replacing) inputRef.current?.focus()
    }, [replacing])

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const { from, to } = selection(event.currentTarget)
      insert(event.clipboardData.getData("text"), from, to, true)
    }

    // Reached only by input the beforeinput listener could not cancel (IME
    // composition). The mask holds no digits while editing, so any digit in
    // the value was just typed; keep them, and React restores the mask.
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      const kept = value.split(MASK).length - 1
      const next = digitsRef.current.slice(0, kept) + value.replace(/\D/g, "")
      if (next.length <= TIN_LENGTH && next !== digitsRef.current) apply(next, next.length)
    }

    const handleBlur = () => {
      if (digitsRef.current.length !== TIN_LENGTH) return
      setCommittedLastFour(digitsRef.current.slice(-4))
      digitsRef.current = ""
    }

    const handleFocus = () => {
      if (committedLastFour === null) return
      setCommittedLastFour(null)
      setEntry({ count: 0, caret: 0 })
      emit(null)
    }

    const handleReplace = () => {
      setReplacing(true)
      onReplace?.()
    }

    const describedBy = (...ids: Array<string | false | undefined>) =>
      [ariaDescribedBy, ...ids].filter(Boolean).join(" ") || undefined

    const errorNode = errorText ? <FieldError id={errorId}>{errorText}</FieldError> : null

    if (onFile) {
      return (
        <div data-slot="tin-input" className={cn(styles.root, className)}>
          <div className={styles.onFile}>
            <Input
              ref={setRefs}
              id={id}
              size={size}
              className={styles.onFileValue}
              value={`On file · ending ${onFileLastFour}`}
              readOnly
              disabled={disabled}
              passwordManagers="ignore"
              autoComplete="off"
              aria-invalid={errorText ? true : undefined}
              aria-describedby={describedBy(errorText && errorId)}
              {...aria}
            />
            <Button
              type="button"
              variant="outline"
              size={size}
              disabled={disabled}
              onClick={handleReplace}
            >
              Replace
            </Button>
          </div>
          {errorNode}
        </div>
      )
    }

    const value =
      committedLastFour !== null
        ? group(kind, MASK.repeat(TIN_LENGTH - 4) + committedLastFour)
        : group(kind, MASK.repeat(entry.count))

    return (
      <div data-slot="tin-input" className={cn(styles.root, className)}>
        <FieldDescription id={hintId}>9 digits</FieldDescription>
        <Input
          ref={setRefs}
          id={id}
          size={size}
          className={styles.input}
          type="text"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onFocus={handleFocus}
          readOnly={!hydrated}
          disabled={disabled}
          passwordManagers="ignore"
          // No `pattern`: the value is always the mask, so `[0-9]*` would hold
          // the field :invalid and block a native form submit. `inputMode`
          // already raises the numeric keypad on every current mobile browser.
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="next"
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy(
            hintId,
            committedLastFour !== null && echoId,
            errorText && errorId
          )}
          {...aria}
        />
        {committedLastFour !== null && (
          <span id={echoId} className={styles.srOnly}>
            ending in {committedLastFour}
          </span>
        )}
        {errorNode}
      </div>
    )
  }
)
TinInput.displayName = "TinInput"

export { TinInput }
