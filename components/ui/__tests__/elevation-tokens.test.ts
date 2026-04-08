/**
 * VI-131: Elevation Token Coverage Test
 *
 * Verifies that surface components use var(--shadow-*) tokens for box-shadow,
 * and that container-level borders have been removed from surface components.
 * Form inputs are excluded — they retain borders per spec.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

const COMPONENTS_DIR = resolve(__dirname, '..')

function readCSS(component: string): string {
  return readFileSync(
    resolve(COMPONENTS_DIR, component, `${component}.module.css`),
    'utf-8'
  )
}

// Surface components that should use shadow tokens, not raw rgba box-shadows
const SURFACE_COMPONENTS = [
  'card',
  'alert',
  'banner',
  'table',
  'navbar',
  'dropdown-menu',
  'context-menu',
  'popover',
  'combobox',
  'select',
  'command',
  'hover-card',
  'dialog',
  'toast',
  'sheet',
]

// Shadow levels each component should use (based on ADR-002 elevation mapping)
const EXPECTED_SHADOW: Record<string, string[]> = {
  card:             ['--shadow-sm'],
  alert:            ['--shadow-sm'],
  banner:           ['--shadow-sm'],
  table:            ['--shadow-sm'],
  navbar:           ['--shadow-md'],
  'dropdown-menu':  ['--shadow-lg'],
  'context-menu':   ['--shadow-lg'],
  popover:          ['--shadow-lg'],
  combobox:         ['--shadow-lg'],
  select:           ['--shadow-lg'],
  command:          ['--shadow-lg'],
  'hover-card':     ['--shadow-lg'],
  dialog:           ['--shadow-xl'],
  toast:            ['--shadow-lg'],
  sheet:            ['--shadow-xl'],
}

describe('Elevation token coverage — VI-131', () => {
  describe('Surface components use var(--shadow-*) tokens', () => {
    SURFACE_COMPONENTS.forEach((component) => {
      it(`${component} box-shadow uses a --shadow-* token`, () => {
        const css = readCSS(component)

        // Find all box-shadow declarations
        const boxShadowMatches = css.match(/box-shadow:\s*[^;]+;/g) ?? []

        // Every box-shadow that isn't "none" or "0 0 0..." spread trick must use var(--shadow-*)
        const suspectShadows = boxShadowMatches.filter((decl) => {
          const value = decl.replace('box-shadow:', '').trim().replace(';', '')
          // Allow: none
          if (value === 'none') return false
          // Allow: var(--shadow-*) tokens
          if (value.startsWith('var(--shadow-')) return false
          // Allow: focus ring color-mix pattern (token-rules.md explicitly permits this)
          // e.g. 0 0 0 var(--focus-ring-width, 2px) color-mix(in srgb, ...)
          if (value.includes('color-mix')) return false
          // Anything else (inline rgba shadows, old spread-border trick) is flagged
          return true
        })

        expect(
          suspectShadows,
          `${component} has inline box-shadow values — use var(--shadow-*) tokens instead`
        ).toHaveLength(0)
      })
    })
  })

  describe('Each surface component uses its expected shadow level', () => {
    Object.entries(EXPECTED_SHADOW).forEach(([component, expectedTokens]) => {
      it(`${component} references ${expectedTokens.join(', ')}`, () => {
        const css = readCSS(component)
        for (const token of expectedTokens) {
          expect(
            css,
            `${component} should reference ${token}`
          ).toContain(token)
        }
      })
    })
  })

  describe('Surface container borders removed', () => {
    // These components had their container-level borders removed
    const BORDER_REMOVED = [
      'card',
      'alert',
      'dropdown-menu',
      'context-menu',
      'popover',
      'hover-card',
      'dialog',
      'toast',
      'command',
    ]

    BORDER_REMOVED.forEach((component) => {
      it(`${component} has no container-level "border: 1px solid var(--border-default)"`, () => {
        const css = readCSS(component)
        // Check the top-level container class doesn't have this border
        // We allow border on non-container elements (close buttons, internal dividers)
        const containerBorder = /border:\s*1px\s+solid\s+var\(--border-default/
        const matches = css.match(
          new RegExp(
            `\\.(?:content|card|base|root)\\s*\\{[^}]*border:\\s*1px\\s+solid\\s+var\\(--border-default`,
            'gs'
          )
        )
        expect(
          matches,
          `${component} container still has border: 1px solid var(--border-default) — should use box-shadow instead`
        ).toBeNull()
      })
    })
  })

  describe('Form input borders preserved', () => {
    // These form components should still have their borders intact
    const FORM_INPUTS = [
      { component: 'combobox', selector: '.input' },
      { component: 'select', selector: '.trigger' },
    ]

    FORM_INPUTS.forEach(({ component, selector }) => {
      it(`${component} ${selector} retains its border`, () => {
        const css = readCSS(component)
        expect(
          css,
          `${component} ${selector} border was removed — form input borders must be preserved per VI-131 spec`
        ).toContain('border: 1px solid var(--border-default')
      })
    })
  })
})
