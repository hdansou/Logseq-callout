# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**logseq-callout** is a Logseq plugin that provides tag-driven callout styling for blocks — icons, labels, and colored backgrounds with nested visual hierarchy. Users add `#warning`, `#tip`, `#important`, etc. as inline refs in block content; the plugin detects these and applies visual callout styling.

**Graph compatibility:** `web: true`, `supportsDB: true`, `supportsDBOnly: true` — DB graphs only.

## Commands

```bash
npm install       # Install dependencies
npm run build     # Production build → dist/ (terser minification, no sourcemaps)
npm run watch     # Rebuild dist/ on file changes (no HTTP server)
npm run serve     # Dev HTTP server at http://localhost:8080 (no rebuild)
npm run typecheck # TypeScript type check only
```

## Testing

The Logseq web app runs at **http://localhost:3001**. If it's not running, start it with:

```bash
cd /Users/dzu/Projects/src/github.com/logseq && yarn watch
```

Loading the plugin requires two processes:

1. **Build watcher** — `npm run watch`
2. **Dev HTTP server** — `npm run serve`

Then in Logseq: Settings → Advanced → Enable Developer mode → Plugins → ⋮ → "Load plugin from web url" → `http://localhost:8080`

## Architecture

### How It Works

1. **Tag Detection**: On page load and DB changes, scans all blocks via `logseq.Editor.getPageBlocksTree()` and `getBlock()`. Checks `block.tags`, `block.refs`, and content for callout tag names.

2. **Dynamic CSS Injection**: Generates CSS rules targeting specific blocks by `[blockid="uuid"]` attribute selectors. Uses `logseq.provideStyle()` to inject into the host document (crosses iframe boundary via SDK messaging).

3. **Display Modes**:
   - **Icon**: GitHub-style 3px colored left border + sets native node icon via `setBlockIcon()` (PascalCase `iconId` field)
   - **Inline**: Colored background band + icon + label badge via `::after` pseudo-elements
   - **Container**: Bordered box with floating badge via `::before` pseudo-elements

### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Plugin entry: settings, scan logic, dynamic CSS generation, icon setting, slash commands |
| `src/callouts.ts` | 28 callout definitions (tag → icon + iconId + label + color), Radix color tokens, tabler icon codes, icon colors |
| `src/styles.ts` | Minimal static base styles |
| `prototypes/` | HTML mockups showing all three display modes |
| `test-data.md` | Sample blocks for testing all 28 callouts + cascade tests |

### Callout Tags (28 tags)

| Tag | Icon | Color |
|-----|------|-------|
| quote, cite, verse, example, latex | blockquote, code, math | purple |
| warning, caution, attention | alert-triangle, bell-ringing | yellow |
| question, help, faq, note, query, center, comment | help-circle, lifebuoy, pencil, search, etc. | blue |
| success, check, done | circle-check, check, checklist | green |
| abstract, summary, tldr, src, export, ascii | file-text, list, bolt, code, terminal | teal |
| important, danger | urgent, alert-octagon | red |
| tip, pinned | bulb, pin | orange |

### Design System

Colors use Logseq's Radix tokens (`--rx-{color}-{step}-alpha`). Both light and dark themes are supported via `html.dark` CSS overrides.

Icons use the tabler-icons webfont already loaded by Logseq, referenced by unicode codepoints in CSS `content` property. Each callout also has a PascalCase `iconId` for `setBlockIcon()` API calls.

Cascade to children uses `margin-left: 0` to override Logseq's default `.block-children-container { margin-left: 29px }`, with `padding-left: 29px` to preserve content indentation.

## Known Issues

- `getCurrentPage()` returns null on journal pages — worked around via `formatJournalDate()` fallback using `getUserConfigs().preferredDateFormat`
- Cross-origin: plugin iframe at `:8080` cannot access `parent.document` directly — all DOM targeting uses `provideStyle()` CSS injection instead
- Each `provideStyle()` call adds a new `<style>` element (no key-based replacement) — acceptable for now but could accumulate
- Icon mode's `setBlockIcon()` persists icons as block properties — they remain after plugin unload (by design)

## Conventions

- Conventional commits: `fix:`, `feat:`, `chore:`
- Semver versioning
