import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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
    expect(getIconCode('bulb')).toBe('ea51')
  })

  it('fails loud on an unknown icon instead of silently substituting', () => {
    expect(() => getIconCode('nope')).toThrow(/nope/)
  })
})

describe('TABLER_ICON_CODES vs the Tabler webfont Logseq bundles', () => {
  // Logseq ships Tabler Icons 2.47.0 (resources/css/tabler-icons.min.css in the
  // monorepo). Codepoints are reassigned between Tabler releases, so the
  // devDependency is pinned to that exact version and this test fails on drift.
  const css = readFileSync(
    fileURLToPath(new URL('../node_modules/@tabler/icons-webfont/tabler-icons.css', import.meta.url)),
    'utf8',
  )
  const fontCodes = new Map<string, string>()
  for (const m of css.matchAll(/\.ti-([a-z0-9-]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)"/g)) {
    fontCodes.set(m[1], m[2])
  }

  it('parsed the webfont stylesheet', () => {
    expect(fontCodes.size).toBeGreaterThan(4000)
  })

  it('matches the font codepoint for every icon we render', () => {
    const mismatches = Object.entries(TABLER_ICON_CODES)
      .filter(([name, code]) => fontCodes.get(name) !== code)
      .map(([name, code]) => `${name}: ours ${code}, font ${fontCodes.get(name) ?? 'missing'}`)
    expect(mismatches).toEqual([])
  })
})
