"use client"

import * as React from "react"
import { PencilSimple } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./inline-edit.module.css"

type InlineEditElement = "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export interface InlineEditProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "defaultValue" | "children"> {
  /** The committed text. An empty string means "no override": `defaultValue` shows instead. */
  value: string
  /** Shown, muted, while `value` is empty. Committing an empty string brings it back. */
  defaultValue?: string
  /**
   * Called with the trimmed text on Enter, blur or Tab, only when it differs from `value`.
   * Return a promise to save asynchronously: the field stays open and busy until it settles.
   * If it rejects, or resolves to `{ error: string }`, the message shows under the field,
   * the typed text stays, and Enter retries.
   */
  onCommit: (value: string) => void | Promise<unknown>
  /** The field's name, e.g. "Section title". Names the input, and the pencil as "Edit {label}". */
  label: string
  /** Accessible name of the pencil. Defaults to `Edit {label}`. */
  editLabel?: string
  /** The element to render. Typography inherits from it, so a title keeps its heading's size. */
  as?: InlineEditElement
  /**
   * Draw the pencil after the text. Default `true`. With `false` the text is the
   * control: a button named "Edit {label}, {value}" that opens the field on click,
   * Enter or Space, and takes focus back after Enter or Escape.
   */
  pencil?: boolean
  /** Open in the editing state on mount, without moving focus. */
  defaultEditing?: boolean
}

const InlineEdit = React.forwardRef<HTMLElement, InlineEditProps>(
  (
    {
      value,
      defaultValue = "",
      onCommit,
      label,
      editLabel,
      as: Comp = "span",
      defaultEditing = false,
      pencil = true,
      className,
      ...props
    },
    ref
  ) => {
    const [editing, setEditing] = React.useState(defaultEditing)
    const [draft, setDraft] = React.useState(defaultEditing ? value : "")
    const inputRef = React.useRef<HTMLInputElement>(null)
    // The one focusable trigger at rest: the pencil, or the text without it.
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    // Set once Enter or Escape has closed the editor, so the blur that follows
    // the input unmounting does not commit a second time.
    const settled = React.useRef(false)
    // Where focus goes after the next render: into the input when editing
    // starts, back to the trigger after Enter or Escape.
    const pendingFocus = React.useRef<"input" | "trigger" | null>(null)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string>()
    const errorId = React.useId()

    React.useEffect(() => {
      if (pendingFocus.current === "input" && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      } else if (pendingFocus.current === "trigger") {
        triggerRef.current?.focus()
      }
      pendingFocus.current = null
    }, [editing])

    const start = () => {
      settled.current = false
      setError(undefined)
      pendingFocus.current = "input"
      setDraft(value)
      setEditing(true)
    }

    const finish = (commit: boolean, returnFocus: boolean) => {
      if (settled.current) return
      settled.current = true
      const next = draft.trim()
      // After a failed save, Enter retries even if the parent already took the value.
      const result = commit && (next !== value || error !== undefined) ? onCommit(next) : undefined
      if (!(result instanceof Promise)) {
        if (returnFocus) pendingFocus.current = "trigger"
        setError(undefined)
        setEditing(false)
        return
      }
      setSaving(true)
      setError(undefined)
      result.then(saveError, (reason) => messageOf(reason) ?? "Could not save.").then((message) => {
        setSaving(false)
        if (message) {
          settled.current = false
          setError(message)
          return
        }
        // Enter keeps focus in the input while saving; hand it back to the trigger.
        // A blur or Tab has already moved it on, so leave it there.
        if (document.activeElement === inputRef.current) pendingFocus.current = "trigger"
        setEditing(false)
      })
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) return
      if (event.key === "Enter") {
        event.preventDefault()
        finish(true, true)
      } else if (event.key === "Escape") {
        event.preventDefault()
        finish(false, true)
      }
    }

    const isDefault = value === ""
    const shown = isDefault ? defaultValue : value

    return (
      <Comp
        ref={ref as React.Ref<never>}
        data-slot="inline-edit"
        data-state={editing ? "editing" : "rest"}
        aria-busy={saving || undefined}
        className={cn(styles.root, className)}
        {...props}
      >
        {editing ? (
          <>
            {/* The field is sized by a hidden copy of the draft (CSS ::after), so
                the input is as wide as the text it replaces, not its container. */}
            <span data-slot="inline-edit-field" className={styles.field} data-value={draft || defaultValue}>
              <input
                ref={inputRef}
                type="text"
                // size={1} drops the input's own ~20-character width, so only the
                // hidden copy of the draft sizes the field.
                size={1}
                data-slot="inline-edit-input"
                className={styles.input}
                aria-label={label}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                readOnly={saving}
                value={draft}
                placeholder={defaultValue}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => finish(true, false)}
              />
            </span>
            {error && (
              // A span, not FieldError's div: the root may be a span, p or heading.
              <span id={errorId} role="alert" data-slot="inline-edit-error" className={styles.error}>
                {error}
              </span>
            )}
          </>
        ) : (
          <>
            {pencil ? (
              <span
                data-slot="inline-edit-text"
                data-default={isDefault || undefined}
                className={cn(styles.text, isDefault && styles.textDefault)}
                onClick={start}
              >
                {shown}
              </span>
            ) : (
              <button
                ref={triggerRef}
                type="button"
                data-slot="inline-edit-text"
                data-default={isDefault || undefined}
                data-control=""
                className={cn(styles.text, styles.textControl, isDefault && styles.textDefault)}
                aria-label={`${editLabel ?? `Edit ${label}`}, ${shown}`}
                onClick={start}
              >
                {shown}
              </button>
            )}
            {pencil && (
              <button
                ref={triggerRef}
                type="button"
                data-slot="inline-edit-pencil"
                className={styles.pencil}
                aria-label={editLabel ?? `Edit ${label}`}
                onClick={start}
              >
                <PencilSimple aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </Comp>
    )
  }
)
InlineEdit.displayName = "InlineEdit"

/** The message of a save that resolved to `{ error: string }`, else undefined. */
function saveError(result: unknown): string | undefined {
  if (result && typeof result === "object" && "error" in result) return messageOf(result.error)
  return undefined
}

function messageOf(reason: unknown): string | undefined {
  if (reason instanceof Error) return reason.message || undefined
  return typeof reason === "string" && reason ? reason : undefined
}

export { InlineEdit }
