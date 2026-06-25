---
"@loworbitstudio/visor": minor
---

feat: add FormError component — form-level submission error banner

Adds the FormError pattern: a left-border destructive banner that appears inside a form card when submission is blocked by field validation errors. Ships with FormErrorTitle and FormErrorDescription sub-components.

Pairs with the existing Field, FieldError, and Input[aria-invalid] primitives to deliver the complete form validation / error pattern (VI-587):
- FormError / FormErrorTitle / FormErrorDescription — form-level submit-error banner
- Field-level errors via FieldError + aria-invalid (existing)
- Focus management: focus first errored field on submit
- Full a11y: role="alert", aria-invalid, aria-describedby linkage

Docs: interactive full-pattern demo showing field-level + submit-error banner composition.
