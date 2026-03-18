/**
 * Callout tag definitions — starter pack.
 *
 * Each callout maps a tag name to:
 * - icon: Tabler icon name (without "ti-" prefix)
 * - label: Display label shown in badge/inline
 * - colorGroup: key into COLOR_GROUPS for consistent theming
 */

export interface CalloutDef {
  icon: string
  label: string
  colorGroup: ColorGroup
}

export type ColorGroup =
  | 'purple'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'teal'
  | 'red'
  | 'orange'

/**
 * Color groups mapped to Logseq's Radix color tokens.
 * Each group defines CSS values using the --rx-* scale (01–12).
 */
export interface ColorTokens {
  bg: string
  border: string
  text: string
  textDark: string
  badge: string
}

export const COLOR_GROUPS: Record<ColorGroup, ColorTokens> = {
  purple: {
    bg: 'var(--rx-purple-04-alpha, rgba(192, 132, 252, 0.15))',
    border: 'var(--rx-purple-06, #7c3aed)',
    text: 'var(--rx-purple-11, #6d28d9)',
    textDark: 'var(--rx-purple-09, #a78bfa)',
    badge: 'var(--rx-purple-05-alpha, rgba(192, 132, 252, 0.25))',
  },
  yellow: {
    bg: 'var(--rx-yellow-04-alpha, rgba(250, 204, 21, 0.15))',
    border: 'var(--rx-yellow-06, #ca8a04)',
    text: 'var(--rx-yellow-11, #a16207)',
    textDark: 'var(--rx-yellow-09, #facc15)',
    badge: 'var(--rx-yellow-05-alpha, rgba(250, 204, 21, 0.25))',
  },
  blue: {
    bg: 'var(--rx-blue-04-alpha, rgba(96, 165, 250, 0.15))',
    border: 'var(--rx-blue-06, #2563eb)',
    text: 'var(--rx-blue-11, #1d4ed8)',
    textDark: 'var(--rx-blue-09, #60a5fa)',
    badge: 'var(--rx-blue-05-alpha, rgba(96, 165, 250, 0.25))',
  },
  green: {
    bg: 'var(--rx-green-04-alpha, rgba(74, 222, 128, 0.15))',
    border: 'var(--rx-green-06, #16a34a)',
    text: 'var(--rx-green-11, #15803d)',
    textDark: 'var(--rx-green-09, #4ade80)',
    badge: 'var(--rx-green-05-alpha, rgba(74, 222, 128, 0.25))',
  },
  teal: {
    bg: 'var(--rx-teal-04-alpha, rgba(45, 212, 191, 0.15))',
    border: 'var(--rx-teal-06, #0d9488)',
    text: 'var(--rx-teal-11, #0f766e)',
    textDark: 'var(--rx-teal-09, #2dd4bf)',
    badge: 'var(--rx-teal-05-alpha, rgba(45, 212, 191, 0.25))',
  },
  red: {
    bg: 'var(--rx-red-04-alpha, rgba(248, 113, 113, 0.15))',
    border: 'var(--rx-red-06, #dc2626)',
    text: 'var(--rx-red-11, #b91c1c)',
    textDark: 'var(--rx-red-09, #f87171)',
    badge: 'var(--rx-red-05-alpha, rgba(248, 113, 113, 0.25))',
  },
  orange: {
    bg: 'var(--rx-orange-04-alpha, rgba(251, 146, 60, 0.15))',
    border: 'var(--rx-orange-06, #ea580c)',
    text: 'var(--rx-orange-11, #c2410c)',
    textDark: 'var(--rx-orange-09, #fb923c)',
    badge: 'var(--rx-orange-05-alpha, rgba(251, 146, 60, 0.25))',
  },
}

/**
 * Tabler icon unicode code points (hex, without 0x prefix).
 * Used in CSS content property as \\eXXXX.
 */
export const TABLER_ICON_CODES: Record<string, string> = {
  'quote':            'b10',
  'blockquote':       'e9a0',
  'alert-triangle':   'ea06',
  'bell-ringing':     'ed07',
  'help-circle':      'efb4',
  'lifebuoy':         'ea5a',
  'message-question': 'f4f2',
  'circle-check':     'ea67',
  'check':            'ea5e',
  'checklist':        'edba',
  'file-text':        'eaa6',
  'list':             'eb6b',
  'bolt':             'ea38',
  'urgent':           'f0cd',
  'bulb':             'ea3c',
}

export function getIconCode(iconName: string): string {
  return TABLER_ICON_CODES[iconName] ?? 'ea5e'
}

/**
 * Default callout definitions — starter pack.
 */
export const DEFAULT_CALLOUTS: Record<string, CalloutDef> = {
  quote:     { icon: 'quote',            label: 'Quote',     colorGroup: 'purple' },
  cite:      { icon: 'blockquote',       label: 'Cite',      colorGroup: 'purple' },

  warning:   { icon: 'alert-triangle',   label: 'Warning',   colorGroup: 'yellow' },
  caution:   { icon: 'alert-triangle',   label: 'Caution',   colorGroup: 'yellow' },
  attention: { icon: 'bell-ringing',     label: 'Attention', colorGroup: 'yellow' },

  question:  { icon: 'help-circle',      label: 'Question',  colorGroup: 'blue' },
  help:      { icon: 'lifebuoy',         label: 'Help',      colorGroup: 'blue' },
  faq:       { icon: 'message-question', label: 'FAQ',       colorGroup: 'blue' },

  success:   { icon: 'circle-check',     label: 'Success',   colorGroup: 'green' },
  check:     { icon: 'check',            label: 'Check',     colorGroup: 'green' },
  done:      { icon: 'checklist',        label: 'Done',      colorGroup: 'green' },

  abstract:  { icon: 'file-text',        label: 'Abstract',  colorGroup: 'teal' },
  summary:   { icon: 'list',             label: 'Summary',   colorGroup: 'teal' },
  tldr:      { icon: 'bolt',             label: 'TLDR',      colorGroup: 'teal' },

  important: { icon: 'urgent',           label: 'Important', colorGroup: 'red' },

  tip:       { icon: 'bulb',             label: 'Tip',       colorGroup: 'orange' },
}

export function getCallout(tagName: string): CalloutDef | undefined {
  return DEFAULT_CALLOUTS[tagName.toLowerCase()]
}

export function getColorTokens(def: CalloutDef): ColorTokens {
  return COLOR_GROUPS[def.colorGroup]
}
