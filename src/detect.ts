import { getCallout } from './callouts'

/** The subset of a `getPageBlocksTree()` block this module reads. */
export interface TreeBlock {
  uuid: string
  tags?: unknown
  refs?: unknown
  children?: TreeBlock[]
  [key: string]: unknown
}

/** Resolve a tag entity id to its lower-case name, or null when unknown. */
export type ResolveTag = (id: number) => Promise<string | null>

interface TagEntityLike {
  originalName?: string
  name?: string
}

interface TagRefLike extends TagEntityLike {
  id?: unknown
}

/**
 * Wrap `Editor.getTag` in a per-session cache. Tag entity ids are stable, so
 * one round-trip per distinct tag is enough; misses (and SDK errors) are
 * cached too.
 */
export function createTagResolver(getTag: (id: number) => Promise<TagEntityLike | null | undefined>): ResolveTag {
  const cache = new Map<number, string | null>()
  return async (id) => {
    const hit = cache.get(id)
    if (hit !== undefined) return hit
    let name: string | null = null
    try {
      const tag = await getTag(id)
      name = (tag?.originalName ?? tag?.name ?? '').toLowerCase() || null
    } catch {
      name = null
    }
    cache.set(id, name)
    return name
  }
}

/**
 * First callout tag in a `block.tags` / `block.refs` list. Handles both the
 * DB-graph shape (`{ id }`, resolved through `resolve`) and the legacy shape
 * (`{ originalName, name }`), in list order.
 */
async function matchCalloutInTagList(list: unknown, resolve: ResolveTag): Promise<string | null> {
  if (!Array.isArray(list)) return null
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const t = item as TagRefLike

    const direct = (t.originalName ?? t.name ?? '').toLowerCase()
    if (direct && getCallout(direct)) return direct

    if (typeof t.id === 'number') {
      const name = await resolve(t.id)
      if (name && getCallout(name)) return name
    }
  }
  return null
}

/** Callout tag name for a block, or null. Proper tags win over inline refs. */
export async function findCalloutTag(block: TreeBlock, resolve: ResolveTag): Promise<string | null> {
  return (await matchCalloutInTagList(block.tags, resolve)) ?? (await matchCalloutInTagList(block.refs, resolve))
}

/** Walk a block tree depth-first and map uuid → callout tag for every tagged block. */
export async function collectCallouts(tree: TreeBlock[] | undefined, resolve: ResolveTag): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  async function walk(blocks: TreeBlock[]): Promise<void> {
    for (const block of blocks) {
      const tag = await findCalloutTag(block, resolve)
      if (tag) found.set(block.uuid, tag)
      if (block.children?.length) await walk(block.children)
    }
  }
  if (tree) await walk(tree)
  return found
}

/** uuid → block for every block in the tree. */
export function indexTree(tree: TreeBlock[] | undefined): Map<string, TreeBlock> {
  const index = new Map<string, TreeBlock>()
  function walk(blocks: TreeBlock[]): void {
    for (const block of blocks) {
      index.set(block.uuid, block)
      if (block.children?.length) walk(block.children)
    }
  }
  if (tree) walk(tree)
  return index
}

/** The subset of a `DB.onChanged` block this module reads. */
export interface ChangedBlock {
  id?: number
  uuid: string
  page?: { id?: number }
}

/**
 * Whether a DB change can affect what is on screen: a block on the scanned
 * page, a block we decorated, or the page entity itself. Blocks without a
 * `page` are page/tag entities; a new tag page elsewhere is not our business.
 * Before the first scan every change counts.
 */
export function changeTouchesPage(
  blocks: ChangedBlock[],
  scannedPageId: number | undefined,
  decorated: ReadonlyMap<string, string>,
): boolean {
  if (scannedPageId === undefined) return true
  return blocks.some((b) => b.page?.id === scannedPageId || b.id === scannedPageId || decorated.has(b.uuid))
}
