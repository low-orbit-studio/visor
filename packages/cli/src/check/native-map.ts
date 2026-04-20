export interface NativeMapping {
  visorName: string
  displayName: string
  notes?: string
}

// Maps lowercase HTML tag names → Visor equivalent.
// Derived from `extends: HTML*Element` fields in components/ui/*/*.visor.yaml.
export const NATIVE_TO_VISOR: Record<string, NativeMapping> = {
  button: { visorName: "button", displayName: "Button" },
  textarea: { visorName: "textarea", displayName: "Textarea" },
  form: { visorName: "form", displayName: "Form" },
  label: { visorName: "label", displayName: "Label" },
  fieldset: { visorName: "fieldset", displayName: "Fieldset" },
  select: { visorName: "select", displayName: "Select" },
  table: { visorName: "table", displayName: "Table", notes: "use DataTable for full interactive features" },
  img: { visorName: "image", displayName: "Image" },
  dialog: { visorName: "dialog", displayName: "Dialog" },
  details: { visorName: "accordion", displayName: "Accordion", notes: "or Collapsible for a single section" },
  summary: { visorName: "accordion", displayName: "Accordion", notes: "wrap as Accordion trigger" },
}

// <input> requires special handling for the `type` attribute.
// Map type attribute value → Visor component.
export const INPUT_TYPE_MAP: Record<string, NativeMapping> = {
  number: { visorName: "number-input", displayName: "NumberInput" },
  password: { visorName: "password-input", displayName: "PasswordInput" },
  search: { visorName: "search-input", displayName: "SearchInput" },
  tel: { visorName: "phone-input", displayName: "PhoneInput" },
  phone: { visorName: "phone-input", displayName: "PhoneInput" },
  // All other input types (text, email, url, date, etc.) map to the base Input.
  _default: { visorName: "input", displayName: "Input" },
}
