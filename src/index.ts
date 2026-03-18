import '@logseq/libs'
import type { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'
import { DEFAULT_CALLOUTS, getCallout, COLOR_GROUPS, getIconCode } from './callouts'

type DisplayMode = 'icon' | 'inline' | 'container'

interface PluginSettings {
  displayMode: DisplayMode
  cascadeToChildren: boolean
  showLabel: boolean
  showIcon: boolean
}

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

/**
 * Generate per-block dynamic CSS including background, icon, and badge.
 * Targets blocks by [blockid="uuid"] attribute selector.
 */
function generateDynamicCSS(): string {
  const settings = logseq.settings as unknown as PluginSettings
  const mode = settings.displayMode
  const rules: string[] = []

  for (const [uuid, tagName] of decoratedBlocks) {
    const callout = getCallout(tagName)
    if (!callout) continue
    const t = COLOR_GROUPS[callout.colorGroup]
    const sel = `.ls-block[blockid="${uuid}"]`
    const iconContent = `"\\${getIconCode(callout.icon)}"`

    if (mode === 'inline') {
      // === Inline mode: colored band + icon in control area ===
      rules.push(`
${sel} > .block-main-container {
  background: ${t.bg};
  border-radius: var(--ls-border-radius-low, 4px);
  padding: 4px 8px;
  margin: 2px 0;
}`)

      // Icon + label badge in the block control area
      if (settings.showIcon || settings.showLabel) {
        const iconPart = settings.showIcon ? `\\${getIconCode(callout.icon)}` : ''
        const labelPart = settings.showLabel ? ` ${callout.label}` : ''
        const afterContent = `"${iconPart}${labelPart}"`

        rules.push(`
${sel} > .block-main-container > .block-control-wrap::after {
  content: ${afterContent};
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

      // Cascade children
      if (settings.cascadeToChildren) {
        rules.push(`
${sel} > .block-children-container {
  background: ${t.bg};
  border-radius: 0 0 var(--ls-border-radius-low, 4px) var(--ls-border-radius-low, 4px);
  padding: 2px 4px 4px 4px;
}`)
      }

    } else if (mode === 'container') {
      // === Container mode: bordered box with floating badge ===
      const cascade = settings.cascadeToChildren
      const r = 'var(--ls-border-radius-medium, 8px)'

      // Base container — full rounded corners by default
      rules.push(`
${sel} > .block-main-container {
  background: ${t.bg};
  border: 1px solid ${t.border};
  border-radius: ${r};
  padding: 16px 12px 8px 12px;
  margin: 8px 0;
  position: relative;
}`)

      // When cascade is on AND children exist, remove bottom corners + border
      // to merge seamlessly with the children container
      if (cascade) {
        rules.push(`
${sel}:has(> .block-children-container) > .block-main-container {
  border-radius: ${r} ${r} 0 0;
  border-bottom: none;
  margin-bottom: 0;
}`)
      }

      // Floating badge with icon + label
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

      // Cascade children — extend background to align with parent's left edge
      // using a ::before pseudo-element so content indentation is unchanged.
      if (cascade) {
        rules.push(`
${sel} > .block-children-container {
  position: relative;
  padding-bottom: 8px;
  margin-bottom: 8px;
}
/* Paint background extending to parent's left edge without changing layout */
${sel} > .block-children-container::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -24px;
  right: -13px;
  bottom: -1px;
  background: ${t.bg};
  border: 1px solid ${t.border};
  border-top: none;
  border-radius: 0 0 ${r} ${r};
  z-index: -1;
  pointer-events: none;
}`)
      }
    }
  }

  return rules.join('\n')
}

/**
 * Scan the current page for blocks with callout tags.
 */
async function scanAndDecorate(): Promise<void> {
  const oldSize = decoratedBlocks.size
  decoratedBlocks.clear()

  try {
    let page = await logseq.Editor.getCurrentPage()

    if (!page) {
      // Journal pages: getCurrentPage returns null. Use date format to find page.
      const info = await logseq.App.getUserConfigs()
      const journalName = formatJournalDate(new Date(), info.preferredDateFormat)
      if (journalName) {
        page = await logseq.Editor.getPage(journalName)
      }
    }

    if (!page) return

    const blocks = await logseq.Editor.getPageBlocksTree(page.name as string ?? page.uuid)
    if (!blocks) return

    await scanBlockTree(blocks)
  } catch (err) {
    console.warn('[callout] scan error:', err)
  }

  if (decoratedBlocks.size > 0 || oldSize > 0) {
    logseq.provideStyle(`/* callout-dynamic */ ${generateDynamicCSS()}`)
    if (decoratedBlocks.size > 0) {
      console.log(`[callout] Styled ${decoratedBlocks.size} blocks`)
    }
  }
}

async function scanBlockTree(
  blocks: Array<{ uuid: string; children?: unknown[]; content?: string }>,
): Promise<void> {
  for (const block of blocks) {
    const tagName = await findCalloutTag(block.uuid)
    if (tagName) {
      decoratedBlocks.set(block.uuid, tagName)
    }
    if (block.children && Array.isArray(block.children) && block.children.length > 0) {
      await scanBlockTree(
        block.children as Array<{ uuid: string; children?: unknown[]; content?: string }>,
      )
    }
  }
}

async function findCalloutTag(uuid: string): Promise<string | null> {
  try {
    const block = await logseq.Editor.getBlock(uuid)
    if (!block) return null

    const blockAny = block as Record<string, unknown>

    // Check block/tags (DB graph proper tags)
    const tags = blockAny.tags as Array<{ originalName?: string; name?: string }> | undefined
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        const name = (tag.originalName ?? tag.name ?? '').toLowerCase()
        if (DEFAULT_CALLOUTS[name]) return name
      }
    }

    // Check block/refs (includes inline #refs)
    const refs = blockAny.refs as Array<{ originalName?: string; name?: string }> | undefined
    if (refs && Array.isArray(refs)) {
      for (const ref of refs) {
        const name = (ref.originalName ?? ref.name ?? '').toLowerCase()
        if (DEFAULT_CALLOUTS[name]) return name
      }
    }

    // Fallback: scan content for #tag patterns
    const content = (block.content ?? '').toLowerCase()
    for (const tagName of Object.keys(DEFAULT_CALLOUTS)) {
      if (content.includes(`#${tagName}`)) return tagName
    }

    return null
  } catch {
    return null
  }
}

function formatJournalDate(date: Date, _format: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st'
    : (day === 2 || day === 22) ? 'nd'
    : (day === 3 || day === 23) ? 'rd'
    : 'th'
  return `${month} ${day}${suffix}, ${year}`
}

let scanTimer: ReturnType<typeof setTimeout> | undefined
function debouncedScan(delay = 300): void {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(scanAndDecorate, delay)
}

async function main(): Promise<void> {
  console.log('[callout] Plugin loaded')

  logseq.useSettingsSchema(SETTINGS_SCHEMA)

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
      const content = block.content ?? ''
      const tagStr = `#${tag}`
      if (!content.includes(tagStr)) {
        await logseq.Editor.updateBlock(block.uuid, `${content} ${tagStr}`)
      }
    })
  }

  logseq.beforeunload(async () => {
    clearTimeout(scanTimer)
    decoratedBlocks.clear()
  })
}

logseq.ready(main).catch(console.error)
