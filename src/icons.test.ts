import { describe, expect, it } from 'vitest'
import { ICON_PROPERTY_KEY, planIconOps, readBlockIcon } from './icons'

const A = 'a', B = 'b', C = 'c'
const icons = (m: Record<string, string | undefined>) => (uuid: string) => (m[uuid] ? { id: m[uuid] } : undefined)

describe('planIconOps (native-icon modes)', () => {
  it('sets icons for newly decorated blocks', () => {
    const plan = planIconOps({ prev: new Map(), next: new Map([[A, 'warning']]), currentIcon: icons({}), nativeIcon: true })
    expect(plan).toEqual({ set: [{ uuid: A, iconId: 'AlertTriangle' }], remove: [] })
  })

  it('is a no-op when the block already carries the right icon (breaks the DB.onChanged loop)', () => {
    const plan = planIconOps({
      prev: new Map([[A, 'warning']]),
      next: new Map([[A, 'warning']]),
      currentIcon: icons({ [A]: 'AlertTriangle' }),
      nativeIcon: true,
    })
    expect(plan).toEqual({ set: [], remove: [] })
  })

  it('re-sets the icon when the callout tag changed', () => {
    const plan = planIconOps({
      prev: new Map([[A, 'warning']]),
      next: new Map([[A, 'tip']]),
      currentIcon: icons({ [A]: 'AlertTriangle' }),
      nativeIcon: true,
    })
    expect(plan.set).toEqual([{ uuid: A, iconId: 'Bulb' }])
  })

  it('removes our icon from a block whose callout tag was removed', () => {
    const plan = planIconOps({
      prev: new Map([[A, 'warning'], [B, 'tip']]),
      next: new Map([[B, 'tip']]),
      currentIcon: icons({ [A]: 'AlertTriangle', [B]: 'Bulb' }),
      nativeIcon: true,
    })
    expect(plan).toEqual({ set: [], remove: [A] })
  })

  it('leaves a user-chosen icon alone when the tag is removed', () => {
    const plan = planIconOps({
      prev: new Map([[A, 'warning']]),
      next: new Map(),
      currentIcon: icons({ [A]: 'Star' }),
      nativeIcon: true,
    })
    expect(plan.remove).toEqual([])
  })

  it('does nothing for a previously decorated block that already lost its icon', () => {
    const plan = planIconOps({ prev: new Map([[A, 'warning']]), next: new Map(), currentIcon: icons({}), nativeIcon: true })
    expect(plan).toEqual({ set: [], remove: [] })
  })
})

describe('planIconOps (CSS-only modes)', () => {
  it('never sets icons', () => {
    const plan = planIconOps({ prev: new Map(), next: new Map([[A, 'warning']]), currentIcon: icons({}), nativeIcon: false })
    expect(plan.set).toEqual([])
  })

  it('removes the icons we set before switching away from a native-icon mode', () => {
    const plan = planIconOps({
      prev: new Map([[A, 'warning'], [B, 'tip'], [C, 'done']]),
      next: new Map([[A, 'warning'], [B, 'tip'], [C, 'done']]),
      currentIcon: icons({ [A]: 'AlertTriangle', [B]: 'Custom', [C]: undefined }),
      nativeIcon: false,
    })
    expect(plan).toEqual({ set: [], remove: [A] })
  })
})

describe('readBlockIcon', () => {
  it('reads the icon property the SDK exposes on a block', () => {
    expect(readBlockIcon({ uuid: 'x', [ICON_PROPERTY_KEY]: { type: 'tablerIcon', id: 'Bulb' } })).toEqual({ type: 'tablerIcon', id: 'Bulb' })
  })

  it('returns undefined for blocks without an icon or with a malformed value', () => {
    expect(readBlockIcon({ uuid: 'x' })).toBeUndefined()
    expect(readBlockIcon(undefined)).toBeUndefined()
    expect(readBlockIcon({ uuid: 'x', [ICON_PROPERTY_KEY]: 'Bulb' })).toBeUndefined()
  })
})
