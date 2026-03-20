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
  /** PascalCase icon ID for logseq.Editor.setBlockIcon() */
  iconId: string
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
  'pencil':           'eb04',
  'alert-octagon':    'ecc6',
  'code':             'ea77',
  'search':           'eb1c',
  'math':             'ed5e',
  'pin':              'ea44',
  'file-export':      'ede9',
  'terminal':         'ebb2',
  'align-center':     'ea07',
  'message':          'ebb4',
}

export function getIconCode(iconName: string): string {
  return TABLER_ICON_CODES[iconName] ?? 'ea5e'
}

/**
 * Default callout definitions — starter pack.
 */
export const DEFAULT_CALLOUTS: Record<string, CalloutDef> = {
  quote:     { icon: 'quote',            iconId: 'Blockquote',       label: 'Quote',     colorGroup: 'purple' },
  cite:      { icon: 'blockquote',       iconId: 'Blockquote',       label: 'Cite',      colorGroup: 'purple' },

  warning:   { icon: 'alert-triangle',   iconId: 'AlertTriangle',    label: 'Warning',   colorGroup: 'yellow' },
  caution:   { icon: 'alert-triangle',   iconId: 'AlertTriangle',    label: 'Caution',   colorGroup: 'yellow' },
  attention: { icon: 'bell-ringing',     iconId: 'BellRinging',      label: 'Attention', colorGroup: 'yellow' },

  question:  { icon: 'help-circle',      iconId: 'HelpCircle',       label: 'Question',  colorGroup: 'blue' },
  help:      { icon: 'lifebuoy',         iconId: 'Lifebuoy',         label: 'Help',      colorGroup: 'blue' },
  faq:       { icon: 'message-question', iconId: 'MessageQuestion',  label: 'FAQ',       colorGroup: 'blue' },

  success:   { icon: 'circle-check',     iconId: 'CircleCheck',      label: 'Success',   colorGroup: 'green' },
  check:     { icon: 'check',            iconId: 'Check',            label: 'Check',     colorGroup: 'green' },
  done:      { icon: 'checklist',        iconId: 'Checklist',        label: 'Done',      colorGroup: 'green' },

  abstract:  { icon: 'file-text',        iconId: 'FileText',         label: 'Abstract',  colorGroup: 'teal' },
  summary:   { icon: 'list',             iconId: 'List',             label: 'Summary',   colorGroup: 'teal' },
  tldr:      { icon: 'bolt',             iconId: 'Bolt',             label: 'TLDR',      colorGroup: 'teal' },

  important: { icon: 'urgent',           iconId: 'Urgent',           label: 'Important', colorGroup: 'red' },
  danger:    { icon: 'alert-octagon',    iconId: 'AlertOctagon',     label: 'Danger',    colorGroup: 'red' },

  tip:       { icon: 'bulb',             iconId: 'Bulb',             label: 'Tip',       colorGroup: 'orange' },

  note:      { icon: 'pencil',           iconId: 'Pencil',           label: 'Note',      colorGroup: 'blue' },
  example:   { icon: 'code',             iconId: 'Code',             label: 'Example',   colorGroup: 'purple' },

  src:       { icon: 'code',             iconId: 'Code',             label: 'Src',       colorGroup: 'teal' },
  query:     { icon: 'search',           iconId: 'Search',           label: 'Query',     colorGroup: 'blue' },
  latex:     { icon: 'math',             iconId: 'Math',             label: 'LaTeX',     colorGroup: 'purple' },
  pinned:    { icon: 'pin',              iconId: 'Pin',              label: 'Pinned',    colorGroup: 'orange' },
  export:    { icon: 'file-export',      iconId: 'FileExport',       label: 'Export',    colorGroup: 'teal' },
  verse:     { icon: 'blockquote',       iconId: 'Blockquote',       label: 'Verse',     colorGroup: 'purple' },
  ascii:     { icon: 'terminal',         iconId: 'Terminal',         label: 'Ascii',     colorGroup: 'teal' },
  center:    { icon: 'align-center',     iconId: 'AlignCenter',      label: 'Center',    colorGroup: 'blue' },
  comment:   { icon: 'message',          iconId: 'Message',          label: 'Comment',   colorGroup: 'blue' },
}

/** Hex colors for setBlockIcon, keyed by color group */
export const ICON_COLORS: Record<ColorGroup, string> = {
  purple: '#7c3aed',
  yellow: '#ca8a04',
  blue:   '#2563eb',
  green:  '#16a34a',
  teal:   '#0d9488',
  red:    '#dc2626',
  orange: '#ea580c',
}

export function getCallout(tagName: string): CalloutDef | undefined {
  return DEFAULT_CALLOUTS[tagName.toLowerCase()]
}

export function getColorTokens(def: CalloutDef): ColorTokens {
  return COLOR_GROUPS[def.colorGroup]
}
