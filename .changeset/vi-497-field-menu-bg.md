---
"@loworbitstudio/visor-core": minor
"@loworbitstudio/visor": minor
---

Introduces the `--field-menu-bg` semantic token (default `var(--surface-popover)`) and wires the four field-attached floating panels — Select content, Combobox listbox, DatePicker popover, and DateRangePicker popover — to use it. When `--field-menu-bg` is unset the fallback chain (`var(--surface-popover, var(--surface-card, #ffffff))`) preserves existing rendering identically. Themes that want the open menu to read as a continuation of the field trigger can override `--field-menu-bg` to match `--surface-interactive-default`. Non-field panels (DropdownMenu, ContextMenu, Menubar, Popover, Command) are untouched.
