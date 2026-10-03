"use client"

import * as React from "react"
import { Minus, Plus } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./number-input.module.css"

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value" | "defaultValue" | "prefix"
  > {
  value?: number
  defaultValue?: number
  onChange?: (value: number | undefined) => void
  min?: number
  max?: number
  step?: number
  /**
   * Fixed text before the value, inside the same well (a currency symbol).
   * Same treatment as `Input`'s `prefix`: secondary ink, never part of the
   * value, clicking it focuses the field, and it is wired to the input with
   * `aria-describedby`. Replaces the native `prefix` HTML attribute, which is
   * not forwarded.
   */
  prefix?: React.ReactNode
  /** Fixed text after the value, inside the same well (a unit: `h`, `m`). See `prefix`. */
  suffix?: React.ReactNode
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      defaultValue,
      onChange,
      min,
      max,
      step = 1,
      disabled,
      prefix,
      suffix,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )
    const affixId = React.useId()
    const hasPrefix = prefix !== undefined && prefix !== null && prefix !== false
    const hasSuffix = suffix !== undefined && suffix !== null && suffix !== false
    const prefixId = `${affixId}-prefix`
    const suffixId = `${affixId}-suffix`
    const describedBy =
      [props["aria-describedby"], hasPrefix && prefixId, hasSuffix && suffixId]
        .filter(Boolean)
        .join(" ") || undefined
    // A press on an affix would blur the input; hand it back instead.
    const focusInput = (e: React.MouseEvent) => {
      if (!hasPrefix && !hasSuffix) return
      const target = e.target as HTMLElement
      if (target === inputRef.current || target.closest("button")) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    const [internalValue, setInternalValue] = React.useState<string>(
      defaultValue !== undefined ? String(defaultValue) : ""
    )
    const isControlled = value !== undefined
    const displayValue = isControlled ? String(value) : internalValue

    const updateValue = (newValue: number | undefined) => {
      if (!isControlled) {
        setInternalValue(newValue !== undefined ? String(newValue) : "")
      }
      onChange?.(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === "" || raw === "-") {
        if (!isControlled) setInternalValue(raw)
        if (raw === "") onChange?.(undefined)
        return
      }
      const parsed = Number(raw)
      if (!Number.isNaN(parsed)) {
        if (!isControlled) setInternalValue(raw)
        onChange?.(parsed)
      }
    }

    const handleBlur = () => {
      const parsed = Number(displayValue)
      if (displayValue === "" || Number.isNaN(parsed)) {
        updateValue(undefined)
        return
      }
      const clamped = clamp(parsed, min, max)
      updateValue(clamped)
    }

    const increment = () => {
      const current = Number(displayValue) || 0
      const next = clamp(current + step, min, max)
      updateValue(next)
    }

    const decrement = () => {
      const current = Number(displayValue) || 0
      const next = clamp(current - step, min, max)
      updateValue(next)
    }

    return (
      <div
        data-slot="number-input"
        className={cn(styles.wrapper, disabled && styles.wrapperDisabled, className)}
        onMouseDown={focusInput}
      >
        <button
          type="button"
          className={styles.button}
          onClick={decrement}
          disabled={disabled}
          aria-label="Decrease value"
          tabIndex={-1}
        >
          <Minus className={styles.buttonIcon} aria-hidden="true" />
        </button>
        {hasPrefix ? (
          <span id={prefixId} className={cn(styles.affix, styles.affixPrefix)} data-slot="number-input-prefix">
            {prefix}
          </span>
        ) : null}
        <input
          ref={setRefs}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={
            displayValue !== "" ? Number(displayValue) : undefined
          }
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            styles.input,
            hasPrefix && !hasSuffix && styles.inputAfterPrefix,
            hasSuffix && !hasPrefix && styles.inputBeforeSuffix
          )}
          {...props}
          aria-describedby={describedBy}
        />
        {hasSuffix ? (
          <span id={suffixId} className={cn(styles.affix, styles.affixSuffix)} data-slot="number-input-suffix">
            {suffix}
          </span>
        ) : null}
        <button
          type="button"
          className={styles.button}
          onClick={increment}
          disabled={disabled}
          aria-label="Increase value"
          tabIndex={-1}
        >
          <Plus className={styles.buttonIcon} aria-hidden="true" />
        </button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
