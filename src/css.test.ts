import { describe, expect, it } from 'vitest'
import { blockSelector, generateDynamicCSS } from './css'
import { DEFAULT_SETTINGS, type PluginSettings } from './settings'

const A = '0199c6a0-0000-7000-8000-000000000001'
const B = '0199c6a0-0000-7000-8000-000000000002'
const one = new Map([[A, 'warning']])

const withSettings = (patch: Partial<PluginSettings>): PluginSettings => ({ ...DEFAULT_SETTINGS, ...patch })

function braceBalance(css: string): number {
  return (css.match(/{/g) ?? []).length - (css.match(/}/g) ?? []).length
}

describe('blockSelector', () => {
  it('builds an attribute selector for a valid uuid', () => {
    expect(blockSelector(A)).toBe(`.ls-block[blockid="${A}"]`)
  })

  it('rejects anything that is not a uuid (CSS injection guard)', () => {
    expect(blockSelector('"] * { color: red } [x="')).toBeNull()
    expect(blockSelector('')).toBeNull()
    expect(blockSelector('not-a-uuid')).toBeNull()
  })
})

describe('generateDynamicCSS', () => {
  it('returns an empty string when nothing is decorated', () => {
    expect(generateDynamicCSS(new Map(), DEFAULT_SETTINGS)).toBe('')
  })

  it('skips invalid uuids and unknown tags', () => {
    const css = generateDynamicCSS(new Map([['bad uuid', 'warning'], [B, 'query']]), DEFAULT_SETTINGS)
    expect(css).toBe('')
  })

  it('emits one rule set per decorated block', () => {
    const css = generateDynamicCSS(new Map([[A, 'warning'], [B, 'tip']]), DEFAULT_SETTINGS)
    expect(css).toContain(`[blockid="${A}"]`)
    expect(css).toContain(`[blockid="${B}"]`)
    expect(css).toContain('--rx-yellow-04-alpha')
    expect(css).toContain('--rx-orange-04-alpha')
  })

  describe('inline mode', () => {
    it('paints the main container and a badge with icon glyph + label', () => {
      const css = generateDynamicCSS(one, withSettings({ displayMode: 'inline' }))
      expect(css).toContain(`[blockid="${A}"] > .block-main-container {`)
      expect(css).toContain('.block-control-wrap::after')
      expect(css).toContain('content: "\\ea06 Warning"')
      expect(css).toContain('html.dark')
      expect(braceBalance(css)).toBe(0)
    })

    it('drops the badge entirely when icon and label are both off', () => {
      const css = generateDynamicCSS(one, withSettings({ showIcon: false, showLabel: false }))
      expect(css).not.toContain('::after')
    })

    it('renders icon-only and label-only badges', () => {
      expect(generateDynamicCSS(one, withSettings({ showLabel: false }))).toContain('content: "\\ea06"')
      expect(generateDynamicCSS(one, withSettings({ showIcon: false }))).toContain('content: " Warning"')
    })

    it('styles children only when cascade is on', () => {
      expect(generateDynamicCSS(one, withSettings({ cascadeToChildren: true }))).toContain('.block-children-container')
      expect(generateDynamicCSS(one, withSettings({ cascadeToChildren: false }))).not.toContain('.block-children-container')
    })
  })

  describe('container mode', () => {
    it('draws a bordered box with a floating badge', () => {
      const css = generateDynamicCSS(one, withSettings({ displayMode: 'container' }))
      expect(css).toContain('border: 1px solid var(--rx-yellow-06')
      expect(css).toContain('.block-main-container::before')
      expect(css).toContain('position: relative')
      expect(css).toContain('content: "\\ea06  Warning"')
      expect(braceBalance(css)).toBe(0)
    })

    it('omits the badge when icon and label are off', () => {
      const css = generateDynamicCSS(one, withSettings({ displayMode: 'container', showIcon: false, showLabel: false }))
      expect(css).not.toContain('::before')
    })

    it('merges children into the box only when cascade is on', () => {
      const on = generateDynamicCSS(one, withSettings({ displayMode: 'container' }))
      const off = generateDynamicCSS(one, withSettings({ displayMode: 'container', cascadeToChildren: false }))
      expect(on).toContain('border-top: none')
      expect(off).not.toContain('.block-children-container')
    })
  })

  describe('icon mode', () => {
    it('draws only a left border (icon is set natively)', () => {
      const css = generateDynamicCSS(one, withSettings({ displayMode: 'icon' }))
      expect(css).toContain('border-left: 3px solid var(--rx-yellow-06')
      expect(css).not.toContain('content:')
      expect(braceBalance(css)).toBe(0)
    })

    it('extends the border to children only when cascade is on', () => {
      const off = generateDynamicCSS(one, withSettings({ displayMode: 'icon', cascadeToChildren: false }))
      expect(off).not.toContain('.block-children-container')
    })
  })

  describe('admonition mode', () => {
    it('draws an accent bar next to the bullet column', () => {
      const css = generateDynamicCSS(one, withSettings({ displayMode: 'admonition' }))
      expect(css).toContain('.block-control-wrap::before')
      expect(css).toContain('width: 3px')
      expect(css).not.toContain('background: var(--rx-yellow-04-alpha')
      expect(braceBalance(css)).toBe(0)
    })

    it('extends the bar through children only when cascade is on', () => {
      const off = generateDynamicCSS(one, withSettings({ displayMode: 'admonition', cascadeToChildren: false }))
      expect(off).not.toContain('.block-children-container')
    })
  })
})
