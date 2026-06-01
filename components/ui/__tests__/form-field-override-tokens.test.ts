/**
 * VI-494: Form-Field Override Token Fallbacks
 *
 * Verifies that every form-field component's field-container rule exposes
 * per-component override tokens (`--{cmp}-bg` / `--{cmp}-border`) as the
 * outer fallback, preserving the full semantic fallback chain for themes
 * that set none of these tokens.
 *
 * Pattern: var(--{cmp}-border, var(--border-default, <hex>))
 *          var(--{cmp}-bg, var(--surface-interactive-default, <hex>))
 *
 * Separator / chip / strength-segment uses of --border-default are
 * explicitly out of scope and must NOT be wrapped.
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

// Components that should have both --{cmp}-bg and --{cmp}-border override tokens
const BOTH_TOKENS: Array<{ component: string; bgToken: string; borderToken: string }> = [
  { component: 'input',        bgToken: '--input-bg',         borderToken: '--input-border' },
  { component: 'textarea',     bgToken: '--textarea-bg',      borderToken: '--textarea-border' },
  { component: 'select',       bgToken: '--select-bg',        borderToken: '--select-border' },
  { component: 'number-input', bgToken: '--number-input-bg',  borderToken: '--number-input-border' },
  { component: 'otp-input',    bgToken: '--otp-bg',           borderToken: '--otp-border' },
  { component: 'combobox',     bgToken: '--combobox-bg',      borderToken: '--combobox-border' },
  { component: 'tag-input',    bgToken: '--tag-input-bg',     borderToken: '--tag-input-border' },
]

describe('Form-field override tokens — VI-494', () => {
  describe('Components with both --{cmp}-bg and --{cmp}-border', () => {
    BOTH_TOKENS.forEach(({ component, bgToken, borderToken }) => {
      it(`${component} field-container has ${bgToken} outer fallback`, () => {
        const css = readCSS(component)
        expect(css, `${component} is missing ${bgToken} override token`).toContain(bgToken)
      })

      it(`${component} field-container has ${borderToken} outer fallback`, () => {
        const css = readCSS(component)
        expect(css, `${component} is missing ${borderToken} override token`).toContain(borderToken)
      })

      it(`${component} ${bgToken} wraps --surface-interactive-default as inner fallback`, () => {
        const css = readCSS(component)
        expect(
          css,
          `${component} ${bgToken} must fall back to --surface-interactive-default`
        ).toMatch(new RegExp(`var\\(${bgToken},\\s*var\\(--surface-interactive-default`))
      })

      it(`${component} ${borderToken} wraps --border-default as inner fallback`, () => {
        const css = readCSS(component)
        expect(
          css,
          `${component} ${borderToken} must fall back to --border-default`
        ).toMatch(new RegExp(`var\\(${borderToken},\\s*var\\(--border-default`))
      })
    })
  })

  describe('switch — track fill only (--switch-track-bg)', () => {
    it('switch .root background-color has --switch-track-bg outer fallback', () => {
      const css = readCSS('switch')
      expect(css, 'switch is missing --switch-track-bg override token').toContain('--switch-track-bg')
    })

    it('switch --switch-track-bg wraps --border-default as inner fallback', () => {
      const css = readCSS('switch')
      expect(css).toMatch(/var\(--switch-track-bg,\s*var\(--border-default/)
    })
  })

  describe('radio-group — border only (--radio-border)', () => {
    it('radio-group .item border has --radio-border outer fallback', () => {
      const css = readCSS('radio-group')
      expect(css, 'radio-group is missing --radio-border override token').toContain('--radio-border')
    })

    it('radio-group --radio-border wraps --border-default as inner fallback', () => {
      const css = readCSS('radio-group')
      expect(css).toMatch(/var\(--radio-border,\s*var\(--border-default/)
    })
  })

  describe('Out-of-scope lines are NOT wrapped (separator / chip preserve bare --border-default)', () => {
    it('select separator (line ~154) still uses bare --border-default', () => {
      const css = readCSS('select')
      // Separator rule: background-color: var(--border-default, ...)
      expect(css).toContain('background-color: var(--border-default, #e5e7eb)')
    })

    it('combobox separator (line ~173) still uses bare --border-default', () => {
      const css = readCSS('combobox')
      expect(css).toContain('background-color: var(--border-default, #e5e7eb)')
    })

    it('tag-input chip (line ~43) still uses bare --border-default', () => {
      const css = readCSS('tag-input')
      // Tag chip: border: 1px solid var(--border-default, ...)
      expect(css).toMatch(/\.tag\s*\{[^}]*border:\s*1px solid var\(--border-default/)
    })
  })
})
