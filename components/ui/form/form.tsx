"use client"

import * as React from "react"
import {
  useForm,
  getFormProps,
  type FormMetadata,
  type SubmissionResult,
  type DefaultValue,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { z } from "zod"
import { cn } from "../../../lib/utils"
import styles from "./form.module.css"

/* ─── Types ────────────────────────────────────────────────────────── */

export interface FormProps<Schema extends z.ZodType> {
  /** Zod schema for validation */
  schema: Schema
  /** Server action function */
  action: (prevState: unknown, formData: FormData) => Promise<unknown>
  /** Called with form and fields metadata for rendering */
  children: (context: {
    form: FormMetadata<z.infer<Schema>>
    fields: ReturnType<FormMetadata<z.infer<Schema>>["getFieldset"]>
  }) => React.ReactNode
  /** Default values for form fields */
  defaultValue?: Partial<z.infer<Schema>>
  /** When to validate: "onSubmit" | "onBlur" | "onInput" */
  shouldValidate?: "onSubmit" | "onBlur" | "onInput"
  /** Additional CSS class name */
  className?: string
}

/* ─── Form ─────────────────────────────────────────────────────────── */

function Form<Schema extends z.ZodType>({
  schema,
  action,
  children,
  defaultValue,
  shouldValidate = "onBlur",
  className,
}: FormProps<Schema>) {
  const [lastResult, formAction] = React.useActionState(action, null)

  const [form, fields] = useForm<z.infer<Schema>>({
    lastResult: lastResult as SubmissionResult<string[]> | null | undefined,
    defaultValue: defaultValue as DefaultValue<z.infer<Schema>> | undefined,
    shouldValidate,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
  })

  return (
    <form
      {...getFormProps(form)}
      action={formAction}
      className={cn(styles.form, className)}
      noValidate
    >
      {children({ form, fields })}
    </form>
  )
}

export { Form }
