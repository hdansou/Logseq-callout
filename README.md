# Callout Manager

Tag-driven callout styling for Logseq blocks — icons, labels, and colored backgrounds with nested visual hierarchy.

> **DB graphs only** (`supportsDBOnly: true`)

## Usage

Add a callout tag as an inline ref in any block (e.g. `#warning`, `#tip`, `#question`). The plugin detects the tag and applies visual styling automatically.

### Supported Tags

| Tag | Icon | Color |
|-----|------|-------|
| `#quote`, `#cite` | quote, blockquote | purple |
| `#warning`, `#caution`, `#attention` | alert-triangle, bell-ringing | yellow |
| `#question`, `#help`, `#faq` | help-circle, lifebuoy, message-question | blue |
| `#success`, `#check`, `#done` | circle-check, check, checklist | green |
| `#abstract`, `#summary`, `#tldr` | file-text, list, bolt | teal |
| `#important` | urgent | red |
| `#tip` | bulb | orange |

### Display Modes

- **Inline** (default) — colored background band with icon + label badge
- **Container** — bordered box with floating badge, seamless child nesting
- **Icon** — sets the node icon only

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Display Mode | inline | How callout tags are displayed |
| Cascade to Children | true | Apply styling to child blocks |
| Show Label | true | Show callout type label (e.g. "Warning") |
| Show Icon | true | Show tabler icon on the block |

Slash commands are also registered for each callout type (e.g. `/Callout: Warning`).

## Development

```bash
npm install       # Install dependencies
npm run build     # Production build → dist/
npm run watch     # Rebuild on file changes
npm run serve     # Dev server at http://localhost:8080
npm run typecheck # TypeScript type check
```

Load in Logseq: Settings → Advanced → Developer mode → Plugins → "Load plugin from web url" → `http://localhost:8080`

## License

MIT
