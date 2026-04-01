"use client"

import * as React from "react"
// @ts-expect-error intl-tel-input/styles is a valid CSS export but lacks type declaration
import "intl-tel-input/styles"
import { cn } from "../../../lib/utils"

export interface PhoneInputProps {
  /** HTML id attribute */
  id?: string
  /** HTML name attribute */
  name?: string
  /** Initial phone number value (e.g. "+14155551234") */
  value?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Additional CSS classes applied to the wrapper */
  className?: string
  /** Called with (fullInternationalNumber, isValid) on change */
  onChange?: (value: string, isValid: boolean) => void
  /** Called on blur */
  onBlur?: () => void
}

interface ItiInstance {
  getNumber: () => string
  isValidNumber: () => boolean | null
  destroy: () => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      id,
      name,
      value = "",
      placeholder,
      required = false,
      disabled = false,
      className,
      onChange,
      onBlur,
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const itiRef = React.useRef<ItiInstance | null>(null)
    const initializedRef = React.useRef(false)
    const [isMounted, setIsMounted] = React.useState(false)

    // CRITICAL: Store callbacks in refs to prevent re-initialization on parent re-render.
    // Without this, new onChange reference → handleChange recreates → useEffect re-runs
    // → intl-tel-input destroys/recreates → input loses focus.
    // See docs/wisdom/W007-intl-tel-input-focus.md
    const onChangeRef = React.useRef(onChange)
    const onBlurRef = React.useRef(onBlur)

    React.useEffect(() => {
      onChangeRef.current = onChange
    }, [onChange])

    React.useEffect(() => {
      onBlurRef.current = onBlur
    }, [onBlur])

    React.useEffect(() => {
      setIsMounted(true)
    }, [])

    // Merge forwarded ref with internal ref
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node
        }
      },
      [ref]
    )

    // Stable handler — reads from refs, never recreates
    const handleChange = React.useCallback(() => {
      if (!itiRef.current) return

      try {
        const number = itiRef.current.getNumber()
        const isValid = itiRef.current.isValidNumber() ?? false
        onChangeRef.current?.(number, isValid)
      } catch {
        const input = inputRef.current
        if (input) {
          onChangeRef.current?.(input.value, input.value.length > 0)
        }
      }
    }, [])

    React.useEffect(() => {
      if (!isMounted || !inputRef.current || initializedRef.current) return

      let cleanup: (() => void) | undefined

      const initializeIntlTelInput = async () => {
        const intlTelInputModule = await import(
          "intl-tel-input/intlTelInputWithUtils"
        )
        const intlTelInput = intlTelInputModule.default

        const input = inputRef.current
        if (!input) return

        const iti = intlTelInput(input, {
          initialCountry: "auto",
          geoIpLookup: (callback, failure) => {
            fetch("https://ipapi.co/country/", {
              headers: { Accept: "text/plain" },
            })
              .then((res) => res.text())
              .then((country) =>
                callback(country.trim().toLowerCase() as "us")
              )
              .catch(() => failure())
          },
          separateDialCode: true,
          formatAsYouType: true,
          formatOnDisplay: true,
          strictMode: true,
          countrySearch: true,
          dropdownContainer: document.body,
        })

        itiRef.current = iti
        initializedRef.current = true

        input.addEventListener("countrychange", handleChange)
        input.addEventListener("input", handleChange)

        cleanup = () => {
          input.removeEventListener("countrychange", handleChange)
          input.removeEventListener("input", handleChange)
          if (itiRef.current) {
            try {
              itiRef.current.destroy()
            } catch {
              // Ignore errors during cleanup
            }
            itiRef.current = null
          }
          initializedRef.current = false
        }
      }

      initializeIntlTelInput()

      return () => {
        cleanup?.()
      }
    }, [isMounted, handleChange])

    const handleBlur = () => {
      handleChange()
      onBlurRef.current?.()
    }

    // SSR-safe: render basic input during server render
    if (!isMounted) {
      return (
        <div data-slot="phone-input" className={cn(className)}>
          <input
            type="tel"
            id={id}
            name={name}
            defaultValue={value}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete="tel"
          />
        </div>
      )
    }

    return (
      <div data-slot="phone-input" className={cn(className)}>
        <input
          ref={setRefs}
          type="tel"
          id={id}
          name={name}
          defaultValue={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="tel"
          onBlur={handleBlur}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
