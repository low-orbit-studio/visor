"use client"

import * as React from "react"
import { Minus, Plus } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./number-input.module.css"

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value" | "defaultValue"
  > {
  value?: number
  defaultValue?: number
  onChange?: (value: number | undefined) => void
  min?: number
  max?: number
  step?: number
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
      ...props
    },
    ref
  ) => {
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
        <input
          ref={ref}
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
          className={styles.input}
          {...props}
        />
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
