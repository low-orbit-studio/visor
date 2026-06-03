---
"@loworbitstudio/visor": minor
---

Add a `PopoverFooter` sub-component to Popover (VI-464). `PopoverFooter` is a
structural slot that renders a right-aligned action row separated from the body
by a full-width top border (spanned via the negative-margin technique so the
border reaches the popover edges while the action row stays aligned with body
content). It follows the `SheetFooter` convention — a plain `<div>` with
`data-slot="popover-footer"`, layout via CSS module, no opinionated button
rendering inside the slot. Button-variant convention (primary default + secondary
ghost/outline) and DOM-order convention (primary action last) are documented in
the `.visor.yaml` notes. Strictly additive — existing Popover exports and
`PopoverContent` padding behavior are unchanged.
