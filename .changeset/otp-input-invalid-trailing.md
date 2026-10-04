---
"@loworbitstudio/visor": minor
---

OTPInput takes `invalid` (VI-670): every cell gets `aria-invalid` and the invalid edge, and the digits are kept so the code can be fixed. A new `errorMessage` prop is shown under the cells in the error text colour and is the `role="alert"` live region (4.1.3), so the error is not colour alone (1.4.1). A new `trailing` prop renders beside the cells for a working indicator (Spinner) or a resend action. The first cell now carries `autocomplete="one-time-code"` and accepts a whole autofilled code (WCAG 3.3.8). The resting edge moves from a `border` to the shared `--control-edge-*` tokens, so `--control-edge-width: 0` turns it off while focus and invalid survive. New render fixtures: `otp-input` `default` / `invalid` / `trailing`.
