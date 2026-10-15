import { describe, expect, it } from 'vitest'
import { DEFAULT_CALLOUTS, TABLER_ICON_CODES } from './callouts'
import { generateDynamicCSS } from './css'
import { planIconOps } from './icons'
import { DISPLAY_MODES, type PluginSettings, usesNativeIcon } from './settings'

/**
 * Every callout × every settings permutation. Catches a renderer that
 * silently drops a tag, a flag that stops having an effect, or a glyph
 * that does not resolve.
 */
const UUID = '0199c6a0-0000-7000-8000-0000000000aa'
const CHILD_RULE = '.block-children-container'
const BADGE_MODES = new Set(['inline', 'container'])

const permutations: PluginSettings[] = []
for (const displayMode of DISPLAY_MODES)
  for (const cascadeToChildren of [true, false])
    for (const showLabel of [true, false])
      for (const showIcon of [true, false]) permutations.push({ displayMode, cascadeToChildren, showLabel, showIcon })

const label = (s: PluginSettings) =>
  `${s.displayMode} cascade=${s.cascadeToChildren} label=${s.showLabel} icon=${s.showIcon}`

describe.each(permutations.map((s) => [label(s), s] as const))('%s', (_name, settings) => {
  it.each(Object.keys(DEFAULT_CALLOUTS))('#%s renders a complete rule set', (tag) => {
    const def = DEFAULT_CALLOUTS[tag]
    const css = generateDynamicCSS(new Map([[UUID, tag]]), settings)

    expect(css).toContain(`[blockid="${UUID}"] > .block-main-container`)
    expect(css).not.toMatch(/undefined|NaN|null/)
    expect((css.match(/{/g) ?? []).length).toBe((css.match(/}/g) ?? []).length)
    expect(css.includes(CHILD_RULE)).toBe(settings.cascadeToChildren)

    if (BADGE_MODES.has(settings.displayMode)) {
      const glyph = `\\${TABLER_ICON_CODES[def.icon]}`
      expect(css.includes(glyph)).toBe(settings.showIcon)
      expect(css.includes(def.label)).toBe(settings.showLabel)
      expect(css.includes('content:')).toBe(settings.showIcon || settings.showLabel)
    } else {
      // Native-icon modes carry no text badge; the glyph/label flags are inert.
      expect(css).not.toContain(def.label)
    }
  })

  it('plans the native icon for every callout exactly when the mode needs it', () => {
    const next = new Map(Object.keys(DEFAULT_CALLOUTS).map((tag, i) => [`${UUID.slice(0, -2)}${String(i).padStart(2, '0')}`, tag]))
    const plan = planIconOps({ prev: new Map(), next, currentIcon: () => undefined, nativeIcon: usesNativeIcon(settings.displayMode) })
    const expectedSets = usesNativeIcon(settings.displayMode) ? next.size : 0
    expect(plan.set).toHaveLength(expectedSets)
    expect(new Set(plan.set.map((s) => s.iconId)).size).toBe(expectedSets ? new Set(Object.values(DEFAULT_CALLOUTS).map((d) => d.iconId)).size : 0)
  })
})
