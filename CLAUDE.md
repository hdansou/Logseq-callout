# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Agent Operating Principles

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Review lessons at session start for this project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Run `npm run typecheck` after changes; test in Logseq at localhost:3001
- Ask yourself: "Would a staff engineer approve this?"

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Skip this for simple, obvious fixes — don't over-engineer

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Point at logs, errors, failing tests — then resolve them

## Workflow

1. **Requirements first** — Update docs with what we're about to build
2. **Tasks** — Create task list in `tasks/todo.md`, commit docs + tasks
3. **Code** — Implement, verify with `npm run typecheck`
4. **Test** — Load plugin in Logseq, verify behavior manually
5. **Deploy** — Build and release

## Task Management

1. Write plan to `tasks/todo.md` with checkable items
2. Check in before starting implementation
3. Mark items complete as you go
4. Capture lessons in `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No AI Slop**: Every line should look like a staff engineer wrote it on a good day.
- **DRY**: Don't repeat yourself. Extract on the third occurrence.
- **Fail Loud**: Errors surface immediately. Never swallow exceptions silently.

## Project Overview

**logseq-callout** is a Logseq plugin that provides tag-driven callout styling for blocks — icons, labels, and colored backgrounds with nested visual hierarchy. Users add `#warning`, `#tip`, `#important`, etc. as inline refs in block content; the plugin detects these and applies visual callout styling.

**Graph compatibility:** `web: true`, `supportsDB: true`, `supportsDBOnly: true` — DB graphs only.

## Stack

- **Language:** TypeScript (ES2020 target)
- **Build:** Vite + terser minification
- **SDK:** @logseq/libs ^0.3.2
- **Test:** Manual — load plugin in Logseq web app at localhost:3001
- **Deploy:** `npm run build` → dist/

## Commands

```bash
npm install       # Install dependencies
npm run build     # Production build → dist/ (terser minification, no sourcemaps)
npm run watch     # Rebuild dist/ on file changes (no HTTP server)
npm run dev       # Vite dev server at http://localhost:8080 (HMR + plugin auto-reload)
npm run typecheck # TypeScript type check only
```

## Testing

The Logseq web app runs at **http://localhost:3001**. If it's not running, start it with:

```bash
cd /Users/dzu/Projects/src/github.com/logseq && yarn watch
```

Loading the plugin requires two processes:

1. **Build watcher** — `npm run watch`
2. **Dev server** — `npm run dev`

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
| `src/styles.ts` | Static base styles injected once on plugin load (e.g. `position: relative` for container badges) |
| `vite.config.ts` | Vite build config: ES2020 target, terser minification, dev server on port 8080 |
| `vite-logseq-safe-plugin.ts` | Custom Vite plugin: HMR integration, auto-reload via `LSPluginCore`, writes dev `index.html` to dist/ |
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
- `provideStyle()` uses keyed replacement (`callout-base` and `callout-dynamic`) to avoid accumulating stale `<style>` elements
- Icon mode's `setBlockIcon()` persists icons as block properties — they remain after plugin unload (by design)
- `formatJournalDate()` ignores the `_format` parameter and hardcodes `MMM do, yyyy` — will fail for users with non-default date formats

## Conventions

- Conventional commits: `fix:`, `feat:`, `chore:`
- Semver versioning
