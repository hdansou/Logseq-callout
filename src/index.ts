import '@logseq/libs'
import type { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'
import type { CalloutDef, ColorTokens } from './callouts'
import { DEFAULT_CALLOUTS, getCallout, COLOR_GROUPS, getIconCode } from './callouts'
import { generateAllStyles } from './styles'

type DisplayMode = 'icon' | 'inline' | 'container'

interface PluginSettings {
  displayMode: DisplayMode
  cascadeToChildren: boolean
  showLabel: boolean
  showIcon: boolean
}

interface RenderCtx {
  sel: string
  t: ColorTokens
  callout: CalloutDef
  settings: PluginSettings
}

type Renderer = (ctx: RenderCtx) => string[]

const SETTINGS_SCHEMA: SettingSchemaDesc[] = [
  {
    key: 'displayMode',
    type: 'enum',
    enumChoices: ['icon', 'inline', 'container'],
    enumPicker: 'select',
    default: 'inline',
    title: 'Display Mode',
    description:
      'How callout tags are displayed: "icon" sets the node icon only, "inline" adds a colored background band, "container" wraps in a bordered box with a badge.',
  },
  {
    key: 'cascadeToChildren',
    type: 'boolean',
    default: true,
    title: 'Cascade to Children',
    description: 'Apply callout styling to child blocks of tagged blocks.',
  },
  {
    key: 'showLabel',
    type: 'boolean',
    default: true,
    title: 'Show Label',
    description: 'Show the callout type label (e.g., "Warning") next to the icon.',
  },
  {
    key: 'showIcon',
    type: 'boolean',
    default: true,
    title: 'Show Icon',
    description: 'Show the tabler icon on the callout block.',
  },
]

/** Track decorated block UUIDs and their callout tag */
const decoratedBlocks = new Map<string, string>()

// === Per-mode CSS renderers ===

function renderIconMode({ sel, t, settings }: RenderCtx): string[] {
  // GitHub-style colored left border. Cascade extends the same border to
  // children; the node icon itself is set imperatively via setBlockIcon.
  const rules: string[] = [`
${sel} > .block-main-container {
  border-left: 3px solid ${t.border};
  padding-left: 8px;
}`]

  if (settings.cascadeToChildren) {
    rules.push(`
${sel} > .block-children-container {
  border-left: 3px solid ${t.border};
  margin-left: 0;
  padding-left: 29px;
}`)
  }
  return rules
}

function renderInlineMode({ sel, t, callout, settings }: RenderCtx): string[] {
  const r = 'var(--ls-border-radius-low, 4px)'
  const rules: string[] = [`
${sel} > .block-main-container {
  background: ${t.bg};
  border-radius: ${r};
  padding: 4px 4px 4px 0;
  margin: 2px 0;
}`]

  // When children exist, flatten bottom corners and remove bottom margin.
  if (settings.cascadeToChildren) {
    rules.push(`
${sel}:has(> .block-children-container) > .block-main-container {
  border-radius: ${r} ${r} 0 0;
  margin-bottom: 0;
}`)
  }

  // Badge in the block control area.
  if (settings.showIcon || settings.showLabel) {
    const iconPart = settings.showIcon ? `\\${getIconCode(callout.icon)}` : ''
    const labelPart = settings.showLabel ? ` ${callout.label}` : ''
    rules.push(`
${sel} > .block-main-container > .block-control-wrap::after {
  content: "${iconPart}${labelPart}";
  font-family: "tabler-icons", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${t.text};
  background: ${t.badge};
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 4px;
  line-height: 1.4;
  white-space: nowrap;
}
html.dark ${sel} > .block-main-container > .block-control-wrap::after {
  color: ${t.textDark};
}`)
  }

  // Cascade children — pull left to align with parent, round bottom corners.
  if (settings.cascadeToChildren) {
    rules.push(`
${sel} > .block-children-container {
  background: ${t.bg};
  border-radius: 0 0 ${r} ${r};
  margin-left: 0;
  padding: 2px 4px 4px 29px;
}`)
  }
  return rules
}

function renderContainerMode({ sel, t, callout, settings }: RenderCtx): string[] {
  const cascade = settings.cascadeToChildren
  const r = 'var(--ls-border-radius-medium, 8px)'
  const rules: string[] = [`
${sel} > .block-main-container {
  background: ${t.bg};
  border: 1px solid ${t.border};
  border-radius: ${r};
  padding: 16px 12px 8px 12px;
  margin: 8px 0;
  position: relative;
}`]

  // When cascade is on AND children exist, remove bottom corners + border so
  // the children container can complete the box seamlessly.
  if (cascade) {
    rules.push(`
${sel}:has(> .block-children-container) > .block-main-container {
  border-radius: ${r} ${r} 0 0;
  border-bottom: none;
  margin-bottom: 0;
}`)
  }

  // Floating badge with icon + label.
  const badgeIcon = settings.showIcon ? `\\${getIconCode(callout.icon)}  ` : ''
  const badgeLabel = settings.showLabel ? callout.label : ''
  const badgeContent = badgeIcon + badgeLabel
  if (badgeContent) {
    rules.push(`
${sel} > .block-main-container::before {
  content: "${badgeContent}";
  font-family: "tabler-icons", -apple-system, BlinkMacSystemFont, sans-serif;
  position: absolute;
  top: -10px;
  left: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 4px;
  line-height: 1.5;
  background: ${t.badge};
  color: ${t.text};
  z-index: 1;
}
html.dark ${sel} > .block-main-container::before {
  color: ${t.textDark};
}`)
  }

  // Cascade children — wrap in matching border that merges with parent.
  if (cascade) {
    rules.push(`
${sel} > .block-children-container {
  background: ${t.bg};
  border: 1px solid ${t.border};
  border-top: none;
  border-radius: 0 0 ${r} ${r};
  margin-left: 0;
  padding: 4px 12px 8px 29px;
}`)
  }
  return rules
}

const RENDERERS: Record<DisplayMode, Renderer> = {
  icon: renderIconMode,
  inline: renderInlineMode,
  container: renderContainerMode,
}

/**
 * Generate per-block dynamic CSS for the active display mode.
 * Targets blocks by [blockid="uuid"] attribute selector.
 */
function generateDynamicCSS(): string {
  const settings = logseq.settings as unknown as PluginSettings
  const render = RENDERERS[settings.displayMode]
  const rules: string[] = []

  for (const [uuid, tagName] of decoratedBlocks) {
    const callout = getCallout(tagName)
    if (!callout) continue
    rules.push(...render({
      sel: `.ls-block[blockid="${uuid}"]`,
      t: COLOR_GROUPS[callout.colorGroup],
      callout,
      settings,
    }))
  }
  return rules.join('\n')
}

/**
 * Set a block's node icon to the callout's tabler icon.
 */
async function setBlockCalloutIcon(uuid: string, tagName: string): Promise<void> {
  const callout = getCallout(tagName)
  if (!callout) return
  try {
    await logseq.Editor.setBlockIcon(uuid, 'tabler-icon', callout.iconId)
  } catch (err) {
    console.warn('[callout] setBlockIcon error:', err)
  }
}

/**
 * Scan the current page for blocks with callout tags.
 */
async function scanAndDecorate(): Promise<void> {
  const oldSize = decoratedBlocks.size
  decoratedBlocks.clear()

  try {
    // getCurrentPage returns null on journal pages — fall back to getTodayPage.
    // (Past-journal pages remain unsupported; neither API resolves them.)
    const page = (await logseq.Editor.getCurrentPage()) ?? (await logseq.Editor.getTodayPage())
    if (!page) return

    const blocks = await logseq.Editor.getPageBlocksTree(page.name as string ?? page.uuid)
    if (!blocks) return

    await scanBlockTree(blocks)
  } catch (err) {
    console.warn('[callout] scan error:', err)
  }

  const settings = logseq.settings as unknown as PluginSettings
  const mode = settings.displayMode

  // In icon mode, set node icons on all callout blocks
  if (mode === 'icon') {
    for (const [uuid, tagName] of decoratedBlocks) {
      await setBlockCalloutIcon(uuid, tagName)
    }
    if (decoratedBlocks.size > 0) {
      console.log(`[callout] Set icons on ${decoratedBlocks.size} blocks`)
    }
  }

  // Inject CSS for all modes (icon mode has left border, inline/container have full styling)
  if (decoratedBlocks.size > 0 || oldSize > 0) {
    logseq.provideStyle({ key: 'callout-dynamic', style: generateDynamicCSS() })
    if (decoratedBlocks.size > 0) {
      console.log(`[callout] Styled ${decoratedBlocks.size} blocks`)
    }
  }
}

async function scanBlockTree(
  blocks: Array<{ uuid: string; children?: unknown[]; title?: string; content?: string }>,
): Promise<void> {
  for (const block of blocks) {
    const tagName = await findCalloutTag(block.uuid)
    if (tagName) {
      decoratedBlocks.set(block.uuid, tagName)
    }
    if (block.children && Array.isArray(block.children) && block.children.length > 0) {
      await scanBlockTree(
        block.children as Array<{ uuid: string; children?: unknown[]; title?: string; content?: string }>,
      )
    }
  }
}

interface BlockTagLike { originalName?: string; name?: string }

/** Return the first callout tag name found in a block.tags / block.refs list. */
function matchCalloutInTagList(list: unknown): string | null {
  if (!Array.isArray(list)) return null
  for (const tag of list as BlockTagLike[]) {
    const name = (tag.originalName ?? tag.name ?? '').toLowerCase()
    if (DEFAULT_CALLOUTS[name]) return name
  }
  return null
}

async function findCalloutTag(uuid: string): Promise<string | null> {
  try {
    const block = await logseq.Editor.getBlock(uuid)
    if (!block) return null

    // DB graph proper tags first, then inline #refs.
    const fromTags = matchCalloutInTagList((block as { tags?: unknown }).tags)
    if (fromTags) return fromTags

    const fromRefs = matchCalloutInTagList((block as { refs?: unknown }).refs)
    if (fromRefs) return fromRefs

    // Fallback: scan block text. BlockEntity.content is deprecated in
    // @logseq/libs 0.3.x — prefer title.
    const text = ((block.title as string | undefined) ?? block.content ?? '').toLowerCase()
    for (const tagName of Object.keys(DEFAULT_CALLOUTS)) {
      if (text.includes(`#${tagName}`)) return tagName
    }

    return null
  } catch {
    return null
  }
}

let scanTimer: ReturnType<typeof setTimeout> | undefined
function debouncedScan(delay = 300): void {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(scanAndDecorate, delay)
}

async function main(): Promise<void> {
  console.log('[callout] Plugin loaded')

  logseq.useSettingsSchema(SETTINGS_SCHEMA)

  // Inject static base styles (position: relative for container mode badges)
  logseq.provideStyle({ key: 'callout-base', style: generateAllStyles() })

  // Initial scan after page settles
  setTimeout(scanAndDecorate, 800)

  logseq.App.onRouteChanged(() => debouncedScan(500))
  logseq.DB.onChanged((e) => {
    if (e.blocks && e.blocks.length > 0) debouncedScan(300)
  })
  logseq.onSettingsChanged(() => debouncedScan(100))

  // Slash commands
  for (const [tag, def] of Object.entries(DEFAULT_CALLOUTS)) {
    logseq.Editor.registerSlashCommand(`Callout: ${def.label}`, async () => {
      const block = await logseq.Editor.getCurrentBlock()
      if (!block) return
      const text = (block.title as string | undefined) ?? block.content ?? ''
      const tagStr = `#${tag}`
      if (!text.includes(tagStr)) {
        await logseq.Editor.updateBlock(block.uuid, `${text} ${tagStr}`)
      }
      // Always set the node icon when using slash command
      await setBlockCalloutIcon(block.uuid, tag)
    })
  }

  logseq.beforeunload(async () => {
    clearTimeout(scanTimer)
    decoratedBlocks.clear()
  })
}

logseq.ready(main).catch(console.error)
