import * as React from "react"
import type { FieldMetadata } from "@conform-to/react"
import { getInputProps } from "@conform-to/react"
import { Field, FieldLabel, FieldDescription, FieldError } from "../field/field"
import { Input } from "../input/input"

/* ─── Types ────────────────────────────────────────────────────────── */

export interface FormFieldProps {
  /** Conform field metadata */
  field: FieldMetadata<string>
  /** Label text */
  label: string
  /** Optional description text */
  description?: string
  /** Input type */
  type?: React.HTMLInputTypeAttribute
  /** Input placeholder */
  placeholder?: string
}

/* ─── FormField ────────────────────────────────────────────────────── */

function FormField({
  field,
  label,
  description,
  type = "text",
  placeholder,
}: FormFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={field.id}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Input
        {...getInputProps(field, { type })}
        placeholder={placeholder}
      />
      <FieldError errors={field.errors} />
    </Field>
  )
}

export { FormField }
