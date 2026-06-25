"use client"

import * as React from "react"
import { PencilSimple, Check, Sparkle } from "@phosphor-icons/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./editable-block.module.css"

/* ─── CVA ────────────────────────────────────────────────────────────────── */

const editableBlockVariants = cva(styles.root, {
  variants: {
    state: {
      default: styles.stateDefault,
      editing: styles.stateEditing,
      done: styles.stateDone,
    },
  },
  defaultVariants: {
    state: "default",
  },
})

/* ─── Props ───────────────────────────────────────────────────────────────── */

export interface EditableBlockProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSave"> {
  /** Block label — rendered uppercase above the value. */
  label: string
  /** The current value to display. */
  value: string
  /** Whether the block is in a "done" / confirmed state (shows a check in the header). */
  done?: boolean
  /**
   * Called when the user saves an edited value.
   * Receives the new string. Parent is responsible for updating `value`.
   */
  onSave?: (value: string) => void
  /**
   * Label for the AI action button shown in editing state.
   * Pass `null` or omit to suppress the AI action.
   * @default "Ask AI to pressure-test"
   */
  aiActionLabel?: string | null
  /** Called when the AI action button is clicked. */
  onAiAction?: () => void
  /**
   * Initial edit mode. Useful for controlled callers that open the block pre-edited.
   * @default false
   */
  defaultEditing?: boolean
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const EditableBlock = React.forwardRef<HTMLDivElement, EditableBlockProps>(
  (
    {
      className,
      label,
      value,
      done = false,
      onSave,
      aiActionLabel = "Ask AI to pressure-test",
      onAiAction,
      defaultEditing = false,
      ...props
    },
    ref
  ) => {
    const [editing, setEditing] = React.useState(defaultEditing)
    const [draft, setDraft] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Sync draft when value prop changes externally (e.g. after save)
    React.useEffect(() => {
      if (!editing) setDraft(value)
    }, [value, editing])

    // Focus input on edit open
    React.useEffect(() => {
      if (editing) {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }, [editing])

    const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      setDraft(value)
      setEditing(true)
    }

    const handleSave = () => {
      setEditing(false)
      onSave?.(draft.trim() || value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSave()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setEditing(false)
        setDraft(value)
      }
    }

    const currentState = editing ? "editing" : done ? "done" : "default"

    return (
      <div
        ref={ref}
        data-slot="editable-block"
        data-state={currentState}
        className={cn(editableBlockVariants({ state: currentState }), className)}
        onClick={!editing ? handleEditClick : undefined}
        {...props}
      >
        {/* Header row: label + done check */}
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          {done && !editing && (
            <span className={styles.doneCheck} aria-label="Done">
              <Check weight="bold" />
            </span>
          )}
        </div>

        {/* Value body */}
        {!editing && (
          <div className={styles.value}>{value}</div>
        )}

        {/* Hover-revealed edit icon (view state only) */}
        {!editing && (
          <button
            type="button"
            className={styles.editIcon}
            aria-label={`Edit ${label}`}
            tabIndex={0}
            onClick={handleEditClick}
          >
            <PencilSimple />
          </button>
        )}

        {/* Editing state: inline input + save button */}
        {editing && (
          <>
            <div className={styles.editRow} data-slot="editable-block-edit-row">
              <input
                ref={inputRef}
                type="text"
                className={styles.editInput}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label={`Edit ${label}`}
              />
              <button
                type="button"
                className={styles.saveButton}
                aria-label="Save"
                onClick={handleSave}
              >
                <Check weight="bold" />
              </button>
            </div>

            {/* AI action slot */}
            {aiActionLabel != null && (
              <button
                type="button"
                className={styles.aiAction}
                data-slot="editable-block-ai-action"
                onClick={onAiAction}
              >
                <Sparkle />
                {aiActionLabel}
              </button>
            )}
          </>
        )}
      </div>
    )
  }
)
EditableBlock.displayName = "EditableBlock"

/* ─── Exports ─────────────────────────────────────────────────────────────── */

export { EditableBlock, editableBlockVariants }
export type { VariantProps as EditableBlockVariantProps }
