import { describe, expect, it, vi } from 'vitest'
import { changeTouchesPage, collectCallouts, createTagResolver, findCalloutTag, indexTree, type ChangedBlock, type TreeBlock } from './detect'

const names: Record<number, string> = { 1: 'warning', 2: 'Tip', 3: 'project', 4: 'Done' }
const resolve = async (id: number): Promise<string | null> => names[id]?.toLowerCase() ?? null

const block = (uuid: string, extra: Partial<TreeBlock> = {}): TreeBlock => ({ uuid, ...extra })

describe('findCalloutTag', () => {
  it('resolves DB-graph {id} tag refs through the resolver', async () => {
    expect(await findCalloutTag(block('a', { tags: [{ id: 1 }] }), resolve)).toBe('warning')
  })

  it('accepts the legacy {originalName}/{name} shapes directly, case-insensitively', async () => {
    expect(await findCalloutTag(block('a', { tags: [{ originalName: 'Tip' }] }), resolve)).toBe('tip')
    expect(await findCalloutTag(block('a', { tags: [{ name: 'DANGER' }] }), resolve)).toBe('danger')
  })

  it('prefers block.tags over block.refs', async () => {
    const b = block('a', { tags: [{ id: 2 }], refs: [{ id: 1 }] })
    expect(await findCalloutTag(b, resolve)).toBe('tip')
  })

  it('falls back to block.refs when tags hold no callout', async () => {
    const b = block('a', { tags: [{ id: 3 }], refs: [{ id: 1 }] })
    expect(await findCalloutTag(b, resolve)).toBe('warning')
  })

  it('returns the first matching tag in list order', async () => {
    const b = block('a', { tags: [{ id: 3 }, { id: 4 }, { id: 1 }] })
    expect(await findCalloutTag(b, resolve)).toBe('done')
  })

  it('returns null when nothing matches, including malformed entries', async () => {
    expect(await findCalloutTag(block('a'), resolve)).toBeNull()
    expect(await findCalloutTag(block('a', { tags: 'warning' }), resolve)).toBeNull()
    expect(await findCalloutTag(block('a', { tags: [null, 7, { id: 'x' }, { id: 3 }] }), resolve)).toBeNull()
  })

  it('does not scan block text for #tag literals (DB graphs carry tags structurally)', async () => {
    expect(await findCalloutTag(block('a', { title: 'careful #warning' }), resolve)).toBeNull()
  })
})

describe('collectCallouts', () => {
  const tree: TreeBlock[] = [
    block('a', { tags: [{ id: 1 }], children: [block('a1'), block('a2', { refs: [{ id: 2 }], children: [block('a2x', { tags: [{ id: 4 }] })] })] }),
    block('b', { tags: [{ id: 3 }] }),
    block('c', { children: [] }),
  ]

  it('walks the whole tree and maps uuid → callout tag', async () => {
    const found = await collectCallouts(tree, resolve)
    expect([...found.entries()]).toEqual([
      ['a', 'warning'],
      ['a2', 'tip'],
      ['a2x', 'done'],
    ])
  })

  it('returns an empty map for an empty or undefined tree', async () => {
    expect((await collectCallouts([], resolve)).size).toBe(0)
    expect((await collectCallouts(undefined, resolve)).size).toBe(0)
  })
})

describe('indexTree', () => {
  it('maps every uuid in the tree to its block', () => {
    const idx = indexTree([block('a', { children: [block('a1', { children: [block('a1x')] })] }), block('b')])
    expect([...idx.keys()].sort()).toEqual(['a', 'a1', 'a1x', 'b'])
    expect(idx.get('a1x')?.uuid).toBe('a1x')
  })
})

describe('createTagResolver', () => {
  it('resolves through getTag once per id and caches the result (including misses)', async () => {
    const getTag = vi.fn(async (id: number) => (id === 1 ? { originalName: 'Warning', name: 'warning' } : null))
    const r = createTagResolver(getTag)
    expect(await r(1)).toBe('warning')
    expect(await r(1)).toBe('warning')
    expect(await r(9)).toBeNull()
    expect(await r(9)).toBeNull()
    expect(getTag).toHaveBeenCalledTimes(2)
  })

  it('prefers originalName, falls back to name, and treats SDK errors as a miss', async () => {
    const r = createTagResolver(async (id: number) => {
      if (id === 1) return { name: 'tip' }
      throw new Error('boom')
    })
    expect(await r(1)).toBe('tip')
    expect(await r(2)).toBeNull()
  })
})

describe('changeTouchesPage', () => {
  const onPage = (id: number, pageId: number, uuid = `u${id}`): ChangedBlock => ({ id, uuid, page: { id: pageId } })
  const pageEntity = (id: number): ChangedBlock => ({ id, uuid: `p${id}` })
  const decorated = new Map([['u7', 'warning']])

  it('is true for a block on the scanned page', () => {
    expect(changeTouchesPage([onPage(1, 194)], 194, decorated)).toBe(true)
  })

  it('is false for blocks on other pages', () => {
    expect(changeTouchesPage([onPage(1, 193), onPage(2, 50)], 194, decorated)).toBe(false)
  })

  it('is true when a decorated block changed, wherever the payload says it lives', () => {
    expect(changeTouchesPage([onPage(7, 193, 'u7')], 194, decorated)).toBe(true)
  })

  it('treats a block without a page as a page entity: only the scanned page itself matters', () => {
    expect(changeTouchesPage([pageEntity(194)], 194, decorated)).toBe(true)
    expect(changeTouchesPage([pageEntity(195)], 194, decorated)).toBe(false)
  })

  it('is false for an empty change and true before any scan has run', () => {
    expect(changeTouchesPage([], 194, decorated)).toBe(false)
    expect(changeTouchesPage([onPage(1, 50)], undefined, decorated)).toBe(true)
  })
})
