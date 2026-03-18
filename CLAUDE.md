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
   - **Icon only**: Sets native node icon via `upsertBlockProperty`
   - **Inline**: Yellow/colored band + icon + label badge via `::after` pseudo-elements
   - **Container**: Bordered box with floating badge via `::before` pseudo-elements

### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Plugin entry: settings, scan logic, dynamic CSS generation, slash commands |
| `src/callouts.ts` | 16 callout definitions (tag → icon + label + color), Radix color tokens, tabler icon codes |
| `src/styles.ts` | Minimal static base styles |
| `prototypes/` | HTML mockups showing all three display modes |

### Callout Starter Pack (16 tags)

| Tag | Icon | Color |
|-----|------|-------|
| quote, cite | quote, blockquote | purple |
| warning, caution, attention | alert-triangle, bell-ringing | yellow |
| question, help, faq | help-circle, lifebuoy, message-question | blue |
| success, check, done | circle-check, check, checklist | green |
| abstract, summary, tldr | file-text, list, bolt | teal |
| important | urgent | red |
| tip | bulb | orange |

### Design System

Colors use Logseq's Radix tokens (`--rx-{color}-{step}-alpha`). Both light and dark themes are supported via `html.dark` CSS overrides.

Icons use the tabler-icons webfont already loaded by Logseq, referenced by unicode codepoints in CSS `content` property.

## Known Issues

- `getCurrentPage()` returns null on journal pages — worked around via `formatJournalDate()` fallback using `getUserConfigs().preferredDateFormat`
- Cross-origin: plugin iframe at `:8080` cannot access `parent.document` directly — all DOM targeting uses `provideStyle()` CSS injection instead
- Each `provideStyle()` call adds a new `<style>` element (no key-based replacement) — acceptable for now but could accumulate

## Conventions

- Conventional commits: `fix:`, `feat:`, `chore:`
- Semver versioning
