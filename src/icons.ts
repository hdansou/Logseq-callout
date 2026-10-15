import { getCallout } from './callouts'

/** Key under which the SDK exposes `:logseq.property/icon` on a block object. */
export const ICON_PROPERTY_KEY = ':logseq.property/icon'

export interface BlockIcon {
  type?: string
  id?: string
}

export interface IconPlanInput {
  /** uuid → tag decorated by the previous scan. */
  prev: ReadonlyMap<string, string>
  /** uuid → tag decorated by this scan. */
  next: ReadonlyMap<string, string>
  /** The icon a block currently carries, as read from the block tree. */
  currentIcon: (uuid: string) => BlockIcon | undefined
  /** Whether the active display mode sets the native block icon. */
  nativeIcon: boolean
}

export interface IconPlan {
  set: Array<{ uuid: string; iconId: string }>
  remove: string[]
}

export function readBlockIcon(block: Record<string, unknown> | undefined): BlockIcon | undefined {
  const value = block?.[ICON_PROPERTY_KEY]
  return value && typeof value === 'object' ? (value as BlockIcon) : undefined
}

/**
 * Decide which `setBlockIcon` / `removeBlockIcon` calls a scan needs.
 *
 * Every property write bumps the block's `updated-at` and re-enters
 * `DB.onChanged`, so writing an icon the block already has would loop
 * forever. Icons are only set when they differ, and only removed when the
 * block still carries the icon *we* chose for the tag it used to have — a
 * user-chosen icon is never touched.
 */
export function planIconOps({ prev, next, currentIcon, nativeIcon }: IconPlanInput): IconPlan {
  const plan: IconPlan = { set: [], remove: [] }

  if (nativeIcon) {
    for (const [uuid, tag] of next) {
      const iconId = getCallout(tag)?.iconId
      if (iconId && currentIcon(uuid)?.id !== iconId) plan.set.push({ uuid, iconId })
    }
  }

  for (const [uuid, tag] of prev) {
    if (nativeIcon && next.has(uuid)) continue
    const ours = getCallout(tag)?.iconId
    if (ours && currentIcon(uuid)?.id === ours) plan.remove.push(uuid)
  }

  return plan
}
