import type { CalloutDef, ColorTokens } from './callouts'
import { COLOR_GROUPS, getCallout, getIconCode } from './callouts'
import type { DisplayMode, PluginSettings } from './settings'

interface RenderCtx {
  sel: string
  t: ColorTokens
  callout: CalloutDef
  settings: PluginSettings
}

type Renderer = (ctx: RenderCtx) => string[]

const BADGE_FONT = '"tabler-icons", -apple-system, BlinkMacSystemFont, sans-serif'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Attribute selector for a block, or null when the uuid is not a uuid (never interpolate raw SDK data into CSS). */
export function blockSelector(uuid: string): string | null {
  return UUID_RE.test(uuid) ? `.ls-block[blockid="${uuid}"]` : null
}

function renderIconMode({ sel, t, settings }: RenderCtx): string[] {
  // GitHub-style colored left border. Cascade extends the same border to
  // children; the node icon itself is set imperatively via setBlockIcon.
  const rules = [`
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
  const rules = [`
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
  font-family: ${BADGE_FONT};
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
  const rules = [`
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
  font-family: ${BADGE_FONT};
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

function renderAdmonitionMode({ sel, t, settings }: RenderCtx): string[] {
  // Minimal admonition: native block icon (set imperatively, same as icon
  // mode) plus an accent-colored vertical bar between the bullet/icon column
  // and the content. No background. The bar is a positioned ::before pseudo
  // so it can extend past the natural block height (a border-right would be
  // capped at the row height).
  const rules = [`
${sel} > .block-main-container {
  margin: 0.4em 0;
}
${sel} > .block-main-container > .block-control-wrap {
  position: relative;
  padding-right: 0.9em;
  margin-right: 0.6em;
}
${sel} > .block-main-container > .block-control-wrap::before {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 1.95em;
  background: ${t.border};
}`]

  // Cascade — extend the accent bar down through child blocks. The
  // margin-left/padding-left split keeps Logseq's 29px content indent while
  // anchoring the bar near the parent's separator position.
  if (settings.cascadeToChildren) {
    rules.push(`
${sel} > .block-children-container {
  border-left: 3px solid ${t.border};
  margin-left: 18px;
  padding-left: 11px;
}`)
  }
  return rules
}

const RENDERERS: Record<DisplayMode, Renderer> = {
  icon: renderIconMode,
  inline: renderInlineMode,
  container: renderContainerMode,
  admonition: renderAdmonitionMode,
}

/**
 * Per-block CSS for the active display mode. Blocks with an invalid uuid or
 * an unknown tag are skipped.
 */
export function generateDynamicCSS(decorated: ReadonlyMap<string, string>, settings: PluginSettings): string {
  const render = RENDERERS[settings.displayMode]
  const rules: string[] = []

  for (const [uuid, tagName] of decorated) {
    const sel = blockSelector(uuid)
    const callout = getCallout(tagName)
    if (!sel || !callout) continue
    rules.push(...render({ sel, t: COLOR_GROUPS[callout.colorGroup], callout, settings }))
  }
  return rules.join('\n')
}
