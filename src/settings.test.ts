import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  DISPLAY_MODES,
  SETTINGS_SCHEMA,
  readSettings,
  usesNativeIcon,
} from './settings'

describe('readSettings', () => {
  it('returns defaults for missing or non-object input', () => {
    expect(readSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(readSettings('inline')).toEqual(DEFAULT_SETTINGS)
  })

  it('accepts every valid display mode', () => {
    for (const mode of DISPLAY_MODES) {
      expect(readSettings({ displayMode: mode }).displayMode).toBe(mode)
    }
  })

  it('falls back to the default mode for unknown or wrongly typed values', () => {
    expect(readSettings({ displayMode: 'bogus' }).displayMode).toBe('inline')
    expect(readSettings({ displayMode: 3 }).displayMode).toBe('inline')
  })

  it('keeps explicit booleans and rejects anything else', () => {
    const s = readSettings({ cascadeToChildren: false, showLabel: 'no', showIcon: 0 })
    expect(s.cascadeToChildren).toBe(false)
    expect(s.showLabel).toBe(true)
    expect(s.showIcon).toBe(true)
  })

  it('ignores unknown keys', () => {
    expect(readSettings({ disabled: true, displayMode: 'icon' })).toEqual({
      ...DEFAULT_SETTINGS,
      displayMode: 'icon',
    })
  })
})

describe('SETTINGS_SCHEMA', () => {
  it('declares one entry per setting with defaults matching DEFAULT_SETTINGS', () => {
    const keys = SETTINGS_SCHEMA.map((d) => d.key).sort()
    expect(keys).toEqual(Object.keys(DEFAULT_SETTINGS).sort())
    for (const desc of SETTINGS_SCHEMA) {
      expect(desc.default).toBe(DEFAULT_SETTINGS[desc.key as keyof typeof DEFAULT_SETTINGS])
    }
  })

  it('offers exactly the supported display modes', () => {
    const mode = SETTINGS_SCHEMA.find((d) => d.key === 'displayMode')
    expect(mode?.enumChoices).toEqual([...DISPLAY_MODES])
  })
})

describe('usesNativeIcon', () => {
  it('is true only for the modes that set the block icon', () => {
    expect(usesNativeIcon('icon')).toBe(true)
    expect(usesNativeIcon('admonition')).toBe(true)
    expect(usesNativeIcon('inline')).toBe(false)
    expect(usesNativeIcon('container')).toBe(false)
  })
})
