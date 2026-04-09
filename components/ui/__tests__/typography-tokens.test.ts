/**
 * VI-135: Typography Token Coverage Test
 *
 * Verifies that component CSS modules use var(--font-weight-*) tokens
 * rather than bare numeric font-weight values.
 *
 * Title components (card, alert, toast, banner, sheet, dialog) must use
 * --font-weight-semibold. All other tokenized weights must use the
 * appropriate var(--font-weight-*) token.
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

// Regex for bare numeric font-weight (not inside a var() expression)
const BARE_FONT_WEIGHT = /font-weight:\s*\d+\s*;/

// Components whose title/heading element must use --font-weight-semibold
const SEMIBOLD_TITLE_COMPONENTS = [
  'card',
  'alert',
  'toast',
  'banner',
  'sheet',
  'dialog',
]

// All components that should have no bare numeric font-weight values
const ALL_TOKENIZED_COMPONENTS = [
  'accordion',
  'alert',
  'avatar',
  'badge',
  'banner',
  'breadcrumb',
  'button',
  'calendar',
  'card',
  'chart',
  'collapsible',
  'combobox',
  'command',
  'dialog',
  'field',
  'fieldset',
  'file-upload',
  'label',
  'menubar',
  'navbar',
  'otp-input',
  'pagination',
  'sheet',
  'sidebar',
  'slider-control',
  'table',
  'tabs',
  'toast',
  'toggle-group',
]

describe('Typography token coverage — VI-135', () => {
  describe('No bare numeric font-weight values', () => {
    ALL_TOKENIZED_COMPONENTS.forEach((component) => {
      it(`${component} has no bare font-weight: <number>`, () => {
        const css = readCSS(component)
        expect(
          BARE_FONT_WEIGHT.test(css),
          `${component}.module.css contains a bare numeric font-weight. Use var(--font-weight-medium, 500) or var(--font-weight-semibold, 600) instead.`
        ).toBe(false)
      })
    })
  })

  describe('Title elements use --font-weight-semibold', () => {
    SEMIBOLD_TITLE_COMPONENTS.forEach((component) => {
      it(`${component} title uses var(--font-weight-semibold, 600)`, () => {
        const css = readCSS(component)
        expect(
          css,
          `${component}.module.css title element should use var(--font-weight-semibold, 600)`
        ).toContain('var(--font-weight-semibold, 600)')
      })
    })
  })
})
