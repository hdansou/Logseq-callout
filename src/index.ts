import '@logseq/libs'
import { DEFAULT_CALLOUTS } from './callouts'
import { generateDynamicCSS } from './css'
import { changeTouchesPage, collectCallouts, createTagResolver, indexTree, type TreeBlock } from './detect'
import { planIconOps, readBlockIcon } from './icons'
import { readSettings, SETTINGS_SCHEMA, usesNativeIcon } from './settings'

const LOG = '[callout]'
const STYLE_KEY = 'callout-dynamic'

/** uuid → callout tag applied by the last completed scan. */
let decorated: ReadonlyMap<string, string> = new Map()
/** Entity id of the page the last scan covered (for DB-change filtering). */
let scannedPageId: number | undefined
/** Monotonic scan id; a scan whose id is stale when it finishes is discarded. */
let generation = 0
let scanTimer: ReturnType<typeof setTimeout> | undefined
const offHooks: Array<() => void> = []

const resolveTag = createTagResolver((id) => logseq.Editor.getTag(id))

async function currentPage(): Promise<{ id: number; uuid: string } | null> {
  // getCurrentPage is null on the journals view; today's journal is the best fallback.
  // (Past journals are not resolvable through either API.)
  const page = (await logseq.Editor.getCurrentPage()) ?? (await logseq.Editor.getTodayPage())
  return page ? { id: page.id, uuid: page.uuid } : null
}

async function applyIconPlan(next: ReadonlyMap<string, string>, tree: TreeBlock[], nativeIcon: boolean): Promise<void> {
  const index = indexTree(tree)
  const plan = planIconOps({
    prev: decorated,
    next,
    currentIcon: (uuid) => readBlockIcon(index.get(uuid)),
    nativeIcon,
  })
  for (const { uuid, iconId } of plan.set) {
    await logseq.Editor.setBlockIcon(uuid, 'tabler-icon', iconId)
  }
  for (const uuid of plan.remove) {
    await logseq.Editor.removeBlockIcon(uuid)
  }
}

/**
 * Scan the current page, inject CSS for every callout block, and reconcile
 * native icons. Only the newest scan is allowed to publish its result.
 */
async function scanAndDecorate(): Promise<void> {
  const myGeneration = ++generation
  try {
    const page = await currentPage()
    if (!page) return
    const tree = ((await logseq.Editor.getPageBlocksTree(page.uuid)) ?? []) as unknown as TreeBlock[]
    const next = await collectCallouts(tree, resolveTag)
    if (myGeneration !== generation) return

    const settings = readSettings(logseq.settings)
    if (next.size > 0 || decorated.size > 0) {
      logseq.provideStyle({ key: STYLE_KEY, style: generateDynamicCSS(next, settings) })
    }
    await applyIconPlan(next, tree, usesNativeIcon(settings.displayMode))

    decorated = next
    scannedPageId = page.id
  } catch (err) {
    console.error(`${LOG} scan failed:`, err)
  }
}

function debouncedScan(delay: number): void {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(scanAndDecorate, delay)
}

async function attachCalloutTag(blockUuid: string, tagName: string): Promise<void> {
  const existing = await logseq.Editor.getTagsByName(tagName)
  const tagPage = existing?.[0] ?? (await logseq.Editor.createTag(tagName))
  if (!tagPage) throw new Error(`could not resolve or create tag "${tagName}"`)
  await logseq.Editor.addBlockTag(blockUuid, tagPage.uuid)
}

async function main(): Promise<void> {
  logseq.useSettingsSchema(SETTINGS_SCHEMA)

  // Initial scan after the page settles.
  debouncedScan(800)

  offHooks.push(
    logseq.App.onRouteChanged(() => debouncedScan(500)),
    logseq.DB.onChanged((e) => {
      if (e.blocks?.length && changeTouchesPage(e.blocks, scannedPageId, decorated)) debouncedScan(300)
    }),
    logseq.onSettingsChanged(() => debouncedScan(100)),
  )

  // Slash commands attach a proper DB tag; the next scan styles the block.
  for (const [tag, def] of Object.entries(DEFAULT_CALLOUTS)) {
    logseq.Editor.registerSlashCommand(`Callout: ${def.label}`, async () => {
      const block = await logseq.Editor.getCurrentBlock()
      if (!block) return
      try {
        await attachCalloutTag(block.uuid, tag)
      } catch (err) {
        console.error(`${LOG} slash command failed:`, err)
      }
    })
  }

  logseq.beforeunload(async () => {
    clearTimeout(scanTimer)
    for (const off of offHooks.splice(0)) off()
    decorated = new Map()
  })
}

logseq.ready(main).catch((err) => console.error(`${LOG} failed to start:`, err))
