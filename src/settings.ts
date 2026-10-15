/// <reference types="@logseq/libs" />
import type { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

export const DISPLAY_MODES = ['icon', 'inline', 'container', 'admonition'] as const
export type DisplayMode = (typeof DISPLAY_MODES)[number]

export interface PluginSettings {
  displayMode: DisplayMode
  cascadeToChildren: boolean
  showLabel: boolean
  showIcon: boolean
}

export const DEFAULT_SETTINGS: PluginSettings = {
  displayMode: 'inline',
  cascadeToChildren: true,
  showLabel: true,
  showIcon: true,
}

export const SETTINGS_SCHEMA: SettingSchemaDesc[] = [
  {
    key: 'displayMode',
    type: 'enum',
    enumChoices: [...DISPLAY_MODES],
    enumPicker: 'select',
    default: DEFAULT_SETTINGS.displayMode,
    title: 'Display Mode',
    description:
      'How callout tags are displayed: "icon" sets the node icon only, "inline" adds a colored background band, "container" wraps in a bordered box with a badge, "admonition" renders an Asciidoctor-style tinted block with a left accent line.',
  },
  {
    key: 'cascadeToChildren',
    type: 'boolean',
    default: DEFAULT_SETTINGS.cascadeToChildren,
    title: 'Cascade to Children',
    description: 'Apply callout styling to child blocks of tagged blocks.',
  },
  {
    key: 'showLabel',
    type: 'boolean',
    default: DEFAULT_SETTINGS.showLabel,
    title: 'Show Label',
    description: 'Show the callout type label (e.g., "Warning") next to the icon.',
  },
  {
    key: 'showIcon',
    type: 'boolean',
    default: DEFAULT_SETTINGS.showIcon,
    title: 'Show Icon',
    description: 'Show the tabler icon on the callout block.',
  },
]

function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === 'string' && (DISPLAY_MODES as readonly string[]).includes(value)
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Coerce whatever `logseq.settings` holds into a complete, valid settings
 * object. A stale settings file (removed enum member, missing key) must
 * never crash the scan.
 */
export function readSettings(raw: unknown): PluginSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    displayMode: isDisplayMode(r.displayMode) ? r.displayMode : DEFAULT_SETTINGS.displayMode,
    cascadeToChildren: bool(r.cascadeToChildren, DEFAULT_SETTINGS.cascadeToChildren),
    showLabel: bool(r.showLabel, DEFAULT_SETTINGS.showLabel),
    showIcon: bool(r.showIcon, DEFAULT_SETTINGS.showIcon),
  }
}

/** Modes that set the native block icon via `Editor.setBlockIcon`. */
export function usesNativeIcon(mode: DisplayMode): boolean {
  return mode === 'icon' || mode === 'admonition'
}
