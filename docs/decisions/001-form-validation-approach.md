# ADR-001: Form Validation Approach

**Status:** Accepted
**Date:** 2026-03-24
**Ticket:** [VI-44](https://linear.app/low-orbit-studio/issue/VI-44/form-validation-research-spike)

## Context

Visor needs a Form wrapper component that integrates with the existing Field, Input, and Label components. This ADR evaluates form validation approaches and recommends the best fit for Visor's copy-and-own registry model, Next.js App Router compatibility, and theme-agnostic architecture.

## Candidates

### 1. Conform + Zod

- **What:** Type-safe form validation library built on web fundamentals. Progressively enhances HTML forms with native Server Actions support for Next.js and Remix.
- **Packages:** `@conform-to/react` (~5 KB gzipped), `@conform-to/zod` (~2 KB gzipped)
- **npm weekly downloads:** ~85K (`@conform-to/zod`)
- **GitHub stars:** ~4K
- **Latest version:** 1.17.1 (March 2026)
- **Maintenance:** Active, single maintainer (Edmund Hung), consistent releases

### 2. React Hook Form + Zod

- **What:** Performance-focused form library using uncontrolled components and React hooks. Industry standard, used by shadcn/ui.
- **Packages:** `react-hook-form` (~9 KB gzipped), `@hookform/resolvers` (~1 KB gzipped)
- **npm weekly downloads:** ~15.8M
- **GitHub stars:** ~42K+
- **Latest version:** 7.72.0 (March 2026)
- **Maintenance:** Active, strong community, well-funded

### 3. TanStack Form

- **What:** Headless, type-safe form state management from the TanStack ecosystem. Controlled inputs only.
- **Packages:** `@tanstack/react-form` (~10 KB gzipped)
- **npm weekly downloads:** ~150K
- **GitHub stars:** ~4K+
- **Latest version:** 1.x (2026)
- **Maintenance:** Active, backed by TanStack ecosystem

### 4. Formik

- **What:** Legacy form library, one of the original React form solutions.
- **Packages:** `formik` (~13 KB gzipped)
- **npm weekly downloads:** ~3.1M
- **GitHub stars:** ~34K
- **Latest version:** 2.4.9 (late 2025)
- **Maintenance:** Minimal — slow release cadence, no major architectural updates for App Router

### 5. Native HTML Validation (no library)

- **What:** Use built-in HTML `required`, `pattern`, `min`, `max` attributes plus `useActionState` from React 19.
- **Packages:** None
- **Bundle size:** 0 KB
- **Maintenance:** N/A (web platform)

## Comparison Matrix

| Criteria | Conform + Zod | RHF + Zod | TanStack Form | Formik | Native HTML |
|---|---|---|---|---|---|
| **Server component compat** | Excellent — designed for Server Actions | Moderate — client-only, needs `"use client"` boundary | Moderate — client-only | Poor — client-only, no Server Action story | Excellent — works without JS |
| **Progressive enhancement** | Excellent — works without JS, enhances with JS | Poor — requires JS for validation | Poor — requires JS | Poor — requires JS | Excellent — native browser behavior |
| **Bundle size** | ~7 KB (react + zod adapter) | ~10 KB (RHF + resolver) | ~10 KB | ~13 KB | 0 KB |
| **TypeScript integration** | Excellent — Zod schema infers types end-to-end | Excellent — Zod schema infers types end-to-end | Excellent — strict type inference built-in | Good — generic types, but less inference | Poor — no type-safe error handling |
| **Accessibility** | Excellent — auto-generates `aria-describedby`, `aria-invalid`, focus management | Good — manual wiring needed for ARIA attributes | Good — manual wiring | Good — manual wiring | Moderate — browser-native error bubbles, limited customization |
| **Composability with Field/Input/Label** | Excellent — works with any HTML form markup, no wrapper components required | Good — needs `Controller` for custom components, or `register` with ref forwarding | Good — controlled inputs only, needs adapter | Moderate — `Field` component name collision | Excellent — no library interference |
| **Learning curve** | Moderate — newer patterns, server action concepts | Low — widely known, extensive docs/tutorials | Moderate — newer, less community content | Low — well-known but dated patterns | Very low — web fundamentals |
| **Community momentum** | Growing — aligned with React 19 / Server Actions direction | Dominant — industry standard, massive ecosystem | Growing — TanStack brand, but form lib is newer | Declining — losing ground to RHF | Stable — web platform |

## Decision

**Recommended approach: Conform + Zod**

### Rationale

1. **Server-first aligns with Visor's architecture.** Visor targets Next.js App Router consumers. Conform is designed from the ground up for Server Actions and `useActionState`, which is the direction React and Next.js are heading. RHF requires a `"use client"` boundary for all form logic, which works against the server-first architecture.

2. **Progressive enhancement is a first-class feature.** Conform forms work without JavaScript — validation runs server-side, errors are returned via the action response, and the page works before hydration. This aligns with Visor's principle of building on web fundamentals (CSS custom properties, semantic HTML, progressive enhancement).

3. **Best composability with existing components.** Conform works with any valid HTML form markup. It does not impose wrapper components or require `Controller` patterns. Visor's existing Field, FieldLabel, FieldDescription, and FieldError components can be used directly — Conform just provides the data to wire them together via `getFieldsetProps()` and field metadata.

4. **Accessibility out of the box.** Conform auto-generates `id`, `aria-describedby`, and `aria-invalid` attributes based on field metadata. This reduces the surface area for accessibility bugs in consumer code and aligns with Visor's commitment to accessible-by-default components.

5. **Smaller combined bundle.** At ~7 KB for the Conform packages vs ~10 KB for RHF + resolver, Conform is lighter. Both are dwarfed by Zod itself (~14 KB gzipped), which is shared regardless of form library choice.

6. **Acceptable trade-offs.** Conform has a smaller community (~85K weekly downloads vs ~15.8M for RHF), which means fewer Stack Overflow answers and blog posts. However, the documentation is solid, the API surface is small, and the library is actively maintained with consistent releases. For a design system that ships source code (copy-and-own), the smaller community is less of a concern since consumers can read and modify the form components directly.

### Why not React Hook Form?

RHF is the safe, conventional choice and would also work well. The main reasons to prefer Conform:

- RHF's `Controller` pattern adds boilerplate when wrapping custom components like Visor's Input and Select
- RHF is client-only — every form needs a `"use client"` directive
- RHF's `register` requires ref forwarding, which can be fragile with component composition
- The React ecosystem is moving toward Server Actions; Conform is built for that future

If Visor's consumers predominantly use client-side forms without server actions, RHF would be a strong alternative. The Form wrapper should be designed to make swapping libraries feasible.

### Why not TanStack Form?

TanStack Form is promising but younger than both Conform and RHF. It uses controlled inputs exclusively (more re-renders), has less community content, and doesn't have the same progressive enhancement story as Conform. Worth revisiting in future phases.

### Why not Formik?

Formik has a `Field` component that would name-collide with Visor's existing `Field` component. More importantly, it has no Server Action support, a larger bundle, and declining community momentum. Not recommended for new projects.

### Why not native-only?

Native HTML validation provides zero-JS progressive enhancement but offers very limited error customization, no cross-field validation, and no type-safe error handling. Conform builds on native validation while adding the programmatic control a design system needs.

## API Sketch

### Form Component

```tsx
// components/ui/form/form.tsx
"use client"

import * as React from "react"
import {
  useForm,
  getFormProps,
  getFieldsetProps,
  type FormMetadata,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { z } from "zod"
import styles from "./form.module.css"

/* ─── Types ────────────────────────────────────────────────────────── */

export interface FormProps<Schema extends z.ZodType>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> {
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
}

/* ─── Form ─────────────────────────────────────────────────────────── */

function Form<Schema extends z.ZodType>({
  schema,
  action,
  children,
  defaultValue,
  shouldValidate = "onBlur",
  className,
  ...props
}: FormProps<Schema>) {
  const [lastResult, formAction] = React.useActionState(action, null)

  const [form, fields] = useForm({
    lastResult,
    defaultValue,
    shouldValidate,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
  })

  return (
    <form
      {...getFormProps(form)}
      action={formAction}
      className={className}
      noValidate
      {...props}
    >
      {children({ form, fields })}
    </form>
  )
}

export { Form }
```

### FormField Component (optional convenience wrapper)

```tsx
// components/ui/form/form-field.tsx
import * as React from "react"
import type { FieldMetadata } from "@conform-to/react"
import { getInputProps } from "@conform-to/react"
import { Field, FieldLabel, FieldDescription, FieldError } from "../field/field"
import { Input } from "../input/input"

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
      <FieldError errors={field.errors?.map((msg) => ({ message: msg }))} />
    </Field>
  )
}

export { FormField }
```

### Usage Example — Server Action Pattern

```tsx
// app/contact/page.tsx
import { z } from "zod"
import { Form } from "@/components/ui/form/form"
import { FormField } from "@/components/ui/form/form-field"
import { Button } from "@/components/ui/button/button"
import { contactAction } from "./actions"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export default function ContactPage() {
  return (
    <Form schema={contactSchema} action={contactAction}>
      {({ fields }) => (
        <>
          <FormField field={fields.name} label="Name" placeholder="Your name" />
          <FormField field={fields.email} label="Email" type="email" placeholder="you@example.com" />
          <FormField field={fields.message} label="Message" placeholder="Your message..." />
          <Button type="submit">Send</Button>
        </>
      )}
    </Form>
  )
}
```

```tsx
// app/contact/actions.ts
"use server"

import { parseWithZod } from "@conform-to/zod"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export async function contactAction(prevState: unknown, formData: FormData) {
  const submission = parseWithZod(formData, { schema: contactSchema })

  if (submission.status !== "success") {
    return submission.reply()
  }

  // Process the validated data
  const { name, email, message } = submission.value
  // ... send email, save to DB, etc.

  return submission.reply({ resetForm: true })
}
```

### Usage Example — Direct Field Composition (no FormField wrapper)

For consumers who want full control over markup:

```tsx
<Form schema={mySchema} action={myAction}>
  {({ fields }) => (
    <Field>
      <FieldLabel htmlFor={fields.email.id}>Email</FieldLabel>
      <FieldDescription id={fields.email.descriptionId}>
        We will never share your email.
      </FieldDescription>
      <Input
        {...getInputProps(fields.email, { type: "email" })}
        aria-describedby={fields.email.descriptionId}
      />
      <FieldError errors={fields.email.errors?.map((msg) => ({ message: msg }))} />
    </Field>
  )}
</Form>
```

## Integration Pattern with Existing Field Component

The key insight is that Conform and Visor's Field components are complementary, not competing:

| Concern | Provided by |
|---|---|
| Form state, validation, submission lifecycle | Conform (`useForm`, `parseWithZod`) |
| Layout, spacing, orientation | Visor `Field` component |
| Label rendering and styling | Visor `FieldLabel` component |
| Help text rendering and styling | Visor `FieldDescription` component |
| Error display and styling | Visor `FieldError` component |
| Input rendering and styling | Visor `Input`, `Select`, `Textarea`, etc. |
| ARIA attribute generation | Conform (`getInputProps`, field metadata) |

### Wiring Pattern

Conform's `getInputProps()` generates the `id`, `name`, `aria-invalid`, and `aria-describedby` attributes. Visor's Field subcomponents handle the visual presentation. The connection points are:

1. **`field.id`** — passed to `FieldLabel`'s `htmlFor` prop
2. **`getInputProps(field, { type })`** — spread onto Visor's `Input` component
3. **`field.errors`** — mapped to `FieldError`'s `errors` prop format
4. **`field.descriptionId`** — used for `aria-describedby` on description text

### No Breaking Changes Required

The existing Field, FieldLabel, FieldDescription, and FieldError components need **zero modifications** to work with Conform. The Form wrapper is additive — it's a new component that orchestrates the existing primitives.

### Registry Dependencies

The Form component would declare registry dependencies on:
- `field` (for Field, FieldLabel, FieldDescription, FieldError)
- `input` (for default FormField usage)
- `button` (peer — consumers will need it for submit)

External npm dependencies:
- `@conform-to/react`
- `@conform-to/zod`
- `zod` (likely already installed by consumers)

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Conform has smaller community than RHF | API is small and stable; Visor ships source code so consumers can modify |
| Single maintainer (Edmund Hung) | Library is well-designed with clear scope; could be forked if abandoned |
| Consumers unfamiliar with Conform | Visor docs will include recipes and examples; FormField convenience wrapper reduces learning curve |
| Server Actions not used by all consumers | Form wrapper also works with client-side `onSubmit` via Conform's client validation mode |

## References

- [Conform documentation](https://conform.guide/)
- [React Hook Form documentation](https://react-hook-form.com/)
- [TanStack Form documentation](https://tanstack.com/form/latest)
- [shadcn/ui Form component (RHF-based)](https://ui.shadcn.com/docs/components/form)
- [Next.js Forms guide](https://nextjs.org/docs/app/guides/forms)
