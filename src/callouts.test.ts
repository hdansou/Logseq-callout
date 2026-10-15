import { describe, expect, it } from 'vitest'
import {
  COLOR_GROUPS,
  DEFAULT_CALLOUTS,
  TABLER_ICON_CODES,
  getCallout,
  getIconCode,
} from './callouts'

describe('DEFAULT_CALLOUTS', () => {
  it('defines 28 tags', () => {
    expect(Object.keys(DEFAULT_CALLOUTS)).toHaveLength(28)
  })

  it('uses lower-case tag names only', () => {
    for (const tag of Object.keys(DEFAULT_CALLOUTS)) expect(tag).toBe(tag.toLowerCase())
  })

  it('maps every icon to a tabler glyph code and a PascalCase iconId', () => {
    for (const [tag, def] of Object.entries(DEFAULT_CALLOUTS)) {
      expect(TABLER_ICON_CODES[def.icon], `${tag}: ${def.icon}`).toMatch(/^[0-9a-f]{3,5}$/)
      expect(def.iconId, tag).toMatch(/^[A-Z][A-Za-z]+$/)
      expect(def.label.length, tag).toBeGreaterThan(0)
    }
  })

  it('references only defined color groups, and uses every group', () => {
    const used = new Set(Object.values(DEFAULT_CALLOUTS).map((d) => d.colorGroup))
    expect([...used].sort()).toEqual(Object.keys(COLOR_GROUPS).sort())
  })
})

describe('getCallout', () => {
  it('is case-insensitive', () => {
    expect(getCallout('Warning')).toBe(DEFAULT_CALLOUTS.warning)
    expect(getCallout('TLDR')).toBe(DEFAULT_CALLOUTS.tldr)
  })

  it('returns undefined for unknown tags', () => {
    expect(getCallout('query')).toBeUndefined()
  })
})

describe('getIconCode', () => {
  it('returns the code for a known icon', () => {
    expect(getIconCode('bulb')).toBe('ea3c')
  })

  it('fails loud on an unknown icon instead of silently substituting', () => {
    expect(() => getIconCode('nope')).toThrow(/nope/)
  })
})
