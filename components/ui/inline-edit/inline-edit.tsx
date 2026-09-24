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
  /** Called with the trimmed text on Enter, blur or Tab, only when it differs from `value`. */
  onCommit: (value: string) => void
  /** The field's name, e.g. "Section title". Names the input, and the pencil as "Edit {label}". */
  label: string
  /** Accessible name of the pencil. Defaults to `Edit {label}`. */
  editLabel?: string
  /** The element to render. Typography inherits from it, so a title keeps its heading's size. */
  as?: InlineEditElement
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
      className,
      ...props
    },
    ref
  ) => {
    const [editing, setEditing] = React.useState(defaultEditing)
    const [draft, setDraft] = React.useState(defaultEditing ? value : "")
    const inputRef = React.useRef<HTMLInputElement>(null)
    const pencilRef = React.useRef<HTMLButtonElement>(null)
    // Set once Enter or Escape has closed the editor, so the blur that follows
    // the input unmounting does not commit a second time.
    const settled = React.useRef(false)
    // Where focus goes after the next render: into the input when editing
    // starts, back to the pencil after Enter or Escape.
    const pendingFocus = React.useRef<"input" | "pencil" | null>(null)

    React.useEffect(() => {
      if (pendingFocus.current === "input" && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      } else if (pendingFocus.current === "pencil") {
        pencilRef.current?.focus()
      }
      pendingFocus.current = null
    }, [editing])

    const start = () => {
      settled.current = false
      pendingFocus.current = "input"
      setDraft(value)
      setEditing(true)
    }

    const finish = (commit: boolean, returnFocus: boolean) => {
      if (settled.current) return
      settled.current = true
      if (returnFocus) pendingFocus.current = "pencil"
      setEditing(false)
      const next = draft.trim()
      if (commit && next !== value) onCommit(next)
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

    return (
      <Comp
        ref={ref as React.Ref<never>}
        data-slot="inline-edit"
        data-state={editing ? "editing" : "rest"}
        className={cn(styles.root, className)}
        {...props}
      >
        {editing ? (
          // The field is sized by a hidden copy of the draft (CSS ::after), so
          // the input is as wide as the text it replaces, not its container.
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
              value={draft}
              placeholder={defaultValue}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => finish(true, false)}
            />
          </span>
        ) : (
          <>
            <span
              data-slot="inline-edit-text"
              data-default={isDefault || undefined}
              className={cn(styles.text, isDefault && styles.textDefault)}
              onClick={start}
            >
              {isDefault ? defaultValue : value}
            </span>
            <button
              ref={pencilRef}
              type="button"
              data-slot="inline-edit-pencil"
              className={styles.pencil}
              aria-label={editLabel ?? `Edit ${label}`}
              onClick={start}
            >
              <PencilSimple aria-hidden="true" />
            </button>
          </>
        )}
      </Comp>
    )
  }
)
InlineEdit.displayName = "InlineEdit"

export { InlineEdit }
