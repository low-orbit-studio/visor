"use client"

import * as React from "react"
import { ArrowUp } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./composer.module.css"

/* ─── Context ─────────────────────────────────────────────────────────── */

interface ComposerContextValue {
  value: string
  setValue: (v: string) => void
  disabled: boolean
  onSubmit: ((value: string) => void) | undefined
}

const ComposerContext = React.createContext<ComposerContextValue | null>(null)

function useComposer() {
  const ctx = React.useContext(ComposerContext)
  if (!ctx) throw new Error("Composer sub-components must be used inside <Composer>")
  return ctx
}

/* ─── Composer (root) ─────────────────────────────────────────────────── */

export interface ComposerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  /** Controlled value. */
  value?: string
  /** Called when the value changes (controlled mode). */
  onValueChange?: (value: string) => void
  /** Called when the field is submitted (Enter or send button). */
  onSubmit?: (value: string) => void
  /** Disables all interactive children. */
  disabled?: boolean
}

const Composer = React.forwardRef<HTMLDivElement, ComposerProps>(
  (
    {
      className,
      value,
      onValueChange,
      onSubmit,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState("")

    const currentValue = isControlled ? value : internalValue

    const setValue = React.useCallback(
      (v: string) => {
        if (!isControlled) setInternalValue(v)
        onValueChange?.(v)
      },
      [isControlled, onValueChange]
    )

    const handleSubmit = React.useCallback(
      (v: string) => {
        if (!v.trim()) return
        onSubmit?.(v)
        // In uncontrolled mode, clear after submit
        if (!isControlled) setInternalValue("")
        else onValueChange?.("")
      },
      [isControlled, onSubmit, onValueChange]
    )

    return (
      <ComposerContext.Provider
        value={{ value: currentValue, setValue, disabled, onSubmit: handleSubmit }}
      >
        <div
          ref={ref}
          data-slot="composer"
          data-disabled={disabled || undefined}
          className={cn(styles.root, className)}
          {...props}
        >
          {children}
        </div>
      </ComposerContext.Provider>
    )
  }
)
Composer.displayName = "Composer"

/* ─── ComposerField ───────────────────────────────────────────────────── */

export interface ComposerFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  /** Placeholder text. */
  placeholder?: string
  /** Disables the field. Falls back to Composer's disabled state. */
  disabled?: boolean
}

const ComposerField = React.forwardRef<HTMLTextAreaElement, ComposerFieldProps>(
  ({ className, placeholder = "Message…", disabled: fieldDisabled, ...props }, ref) => {
    const { value, setValue, disabled: ctxDisabled, onSubmit } = useComposer()
    const isDisabled = fieldDisabled ?? ctxDisabled

    // Auto-grow via hidden replica (field-sizing not yet universal)
    const replicaRef = React.useRef<HTMLDivElement>(null)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Merge forwarded ref with local ref
    React.useImperativeHandle(ref, () => textareaRef.current!)

    // Sync height: replica carries same text + trailing newline to force the
    // textarea to match its scrollHeight without reading layout.
    React.useLayoutEffect(() => {
      const replica = replicaRef.current
      const textarea = textareaRef.current
      if (!replica || !textarea) return
      replica.textContent = value + "\n"
      textarea.style.height = replica.offsetHeight + "px"
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onSubmit?.(value)
      }
      props.onKeyDown?.(e)
    }

    return (
      <div className={styles.fieldWrap}>
        {/* Hidden replica used only for height measurement */}
        <div
          ref={replicaRef}
          className={cn(styles.fieldReplica, styles.field)}
          aria-hidden="true"
        />
        <textarea
          ref={textareaRef}
          data-slot="composer-field"
          rows={1}
          value={value}
          disabled={isDisabled}
          placeholder={placeholder}
          className={cn(styles.field, className)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    )
  }
)
ComposerField.displayName = "ComposerField"

/* ─── ComposerToolbar ─────────────────────────────────────────────────── */

export type ComposerToolbarProps = React.HTMLAttributes<HTMLDivElement>

const ComposerToolbar = React.forwardRef<HTMLDivElement, ComposerToolbarProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="composer-toolbar"
      className={cn(styles.toolbar, className)}
      {...props}
    >
      {children}
    </div>
  )
)
ComposerToolbar.displayName = "ComposerToolbar"

/* ─── ComposerToolButton ──────────────────────────────────────────────── */

export interface ComposerToolButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Phosphor icon element to render inside the button. */
  icon: React.ReactNode
  /** Accessible label (required). */
  "aria-label": string
}

const ComposerToolButton = React.forwardRef<HTMLButtonElement, ComposerToolButtonProps>(
  ({ className, icon, disabled: btnDisabled, ...props }, ref) => {
    const { disabled: ctxDisabled } = useComposer()
    const isDisabled = btnDisabled ?? ctxDisabled

    return (
      <button
        ref={ref}
        type="button"
        data-slot="composer-tool-button"
        disabled={isDisabled}
        className={cn(styles.toolBtn, className)}
        {...props}
      >
        {icon}
      </button>
    )
  }
)
ComposerToolButton.displayName = "ComposerToolButton"

/* ─── ComposerSpacer ──────────────────────────────────────────────────── */

export type ComposerSpacerProps = React.HTMLAttributes<HTMLDivElement>

const ComposerSpacer = React.forwardRef<HTMLDivElement, ComposerSpacerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="composer-spacer"
      className={cn(styles.spacer, className)}
      {...props}
    />
  )
)
ComposerSpacer.displayName = "ComposerSpacer"

/* ─── ComposerSend ────────────────────────────────────────────────────── */

export interface ComposerSendProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Accessible label. @default "Send" */
  "aria-label"?: string
}

const ComposerSend = React.forwardRef<HTMLButtonElement, ComposerSendProps>(
  (
    {
      className,
      "aria-label": ariaLabel = "Send",
      disabled: btnDisabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { value, onSubmit, disabled: ctxDisabled } = useComposer()
    // Explicitly disabled by prop or context overrides auto-empty check
    const isDisabled =
      btnDisabled !== undefined
        ? btnDisabled
        : ctxDisabled || !value.trim()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented) {
        onSubmit?.(value)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        data-slot="composer-send"
        aria-label={ariaLabel}
        disabled={isDisabled}
        className={cn(styles.send, className)}
        onClick={handleClick}
        {...props}
      >
        <ArrowUp weight="bold" />
      </button>
    )
  }
)
ComposerSend.displayName = "ComposerSend"

/* ─── Exports ─────────────────────────────────────────────────────────── */

export {
  Composer,
  ComposerField,
  ComposerToolbar,
  ComposerToolButton,
  ComposerSpacer,
  ComposerSend,
}
