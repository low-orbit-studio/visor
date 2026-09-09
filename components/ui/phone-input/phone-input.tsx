"use client"

import * as React from "react"
import IntlTelInput from "@intl-tel-input/react"
import type { IntlTelInputRef } from "@intl-tel-input/react"
import type { CountrySelectorMode, Iso2, ValidationError } from "intl-tel-input"
import "intl-tel-input/styles"
import { cn } from "../../../lib/utils"

// Password managers mangle tel fields. Typed through `input` props because the
// library's `inputProps` surface does not model arbitrary data attributes.
const PASSWORD_MANAGER_OPT_OUT = {
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-bwignore": true,
  "data-form-type": "other",
} as React.ComponentPropsWithoutRef<"input">

export interface PhoneInputPortal {
  /** Element the country selector is portaled into. */
  container: HTMLElement
  /**
   * Theme-scoping class applied to the portaled country selector. Required —
   * a selector portaled out of the tree escapes the consumer's theme class,
   * so the scope has to travel with it.
   */
  scopeClassName: string
}

export interface PhoneInputProps {
  /** HTML id attribute */
  id?: string
  /** HTML name attribute */
  name?: string
  /** Phone number in E.164 (e.g. "+14155551234"). Displayed formatted for the detected country. */
  value?: string | null
  /** Placeholder text */
  placeholder?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether the field is read-only. Pair with `countrySelectorMode="OFF"` to also close off the country dropdown. */
  readOnly?: boolean
  /** Country selector behaviour. `"OFF"` renders the selected country as a non-interactive element. */
  countrySelectorMode?: CountrySelectorMode
  /** ISO 3166-1 alpha-2 country selected on mount. */
  initialCountry?: Iso2
  /** Size variant — matches Input component sizes */
  size?: "sm" | "md" | "lg"
  /** Additional CSS classes applied to the wrapper */
  className?: string
  /**
   * Portal the country selector out of the input's DOM position. All-or-nothing:
   * the scoping class is not separable from the container, so the selector can
   * never escape its theme. Omit for the default inline selector.
   */
  portal?: PhoneInputPortal
  /**
   * Called with the E.164 number and its validity. `e164` is `null` for anything
   * that is not a complete, valid number — a partial is never emitted.
   */
  onChange?: (e164: string | null, isValid: boolean) => void
  /** Called on blur with the validation error for a non-empty, invalid number (otherwise `null`). */
  onBlur?: (error: ValidationError | null) => void
}

const PhoneInput = React.forwardRef<IntlTelInputRef, PhoneInputProps>(
  (
    {
      id,
      name,
      value,
      placeholder,
      required = false,
      disabled = false,
      readOnly = false,
      countrySelectorMode,
      initialCountry = "us",
      size = "md",
      className,
      portal,
      onChange,
      onBlur,
    },
    ref
  ) => {
    const itiRef = React.useRef<IntlTelInputRef>(null)
    // `undefined` until the first emission — an initial `{ null, false }` would be
    // indistinguishable from the first partial the user types and would swallow it.
    const lastEmitted = React.useRef<
      { e164: string | null; isValid: boolean } | undefined
    >(undefined)

    React.useImperativeHandle(ref, () => ({
      getInstance: () => itiRef.current?.getInstance() ?? null,
      getInput: () => itiRef.current?.getInput() ?? null,
    }))

    // The library's own `onChangeNumber` emits `getNumber()` verbatim, which for a
    // partial is a `+<dial code>` prefix glued to the formatted national string
    // (typing "21337" yields "+1213-37"). Derive the value at emit time instead so
    // a malformed number can never reach the consumer.
    const emit = React.useCallback(() => {
      const iti = itiRef.current?.getInstance()
      const isValid = iti?.isValidNumber() ?? false
      const e164 = isValid ? iti!.getNumber() : null
      const last = lastEmitted.current
      if (last && last.e164 === e164 && last.isValid === isValid) return
      lastEmitted.current = { e164, isValid }
      onChange?.(e164, isValid)
    }, [onChange])

    const handleBlur = React.useCallback(() => {
      const iti = itiRef.current?.getInstance()
      const input = itiRef.current?.getInput()
      // The error callback never fires while a number is still partial, so read the
      // error directly — a visibly-present partial that saves as nothing is silent
      // data loss. Gate on validity: getValidationError() reports "IS_POSSIBLE" for
      // a number that is fine, which is not an error.
      const error =
        iti && input?.value && !iti.isValidNumber()
          ? (iti.getValidationError() ?? null)
          : null
      onBlur?.(error)
    }, [onBlur])

    return (
      <div data-slot="phone-input" data-size={size} className={cn(className)}>
        <IntlTelInput
          ref={itiRef}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChangeNumber={emit}
          onChangeCountry={emit}
          onChangeValidity={emit}
          initialCountry={initialCountry}
          initialCountryLookup={null}
          countrySelectorMode={countrySelectorMode}
          separateDialCode
          formatAsYouType
          strictMode
          countrySearch
          loadUtils={() => import("intl-tel-input/utils")}
          dropdownParent={portal?.container ?? null}
          classNames={
            portal
              ? { countrySelectorContainer: portal.scopeClassName }
              : undefined
          }
          inputProps={{
            id,
            name,
            placeholder,
            required,
            autoComplete: "tel",
            onBlur: handleBlur,
            ...PASSWORD_MANAGER_OPT_OUT,
          }}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
