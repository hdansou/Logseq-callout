# Callout Manager — Requirements Document

## 1. Overview

**Callout Manager** is a Logseq plugin that provides tag-driven visual callout styling for blocks. Users tag blocks with inline refs (e.g. `#warning`, `#tip`, `#question`) and the plugin automatically applies colored backgrounds, icons, labels, and borders — similar to Obsidian-style callout/admonition blocks.

**Target environment:** Logseq DB graphs only (`supportsDBOnly: true`).

**SDK:** `@logseq/libs ^0.3.2`. `BlockEntity.content` is deprecated upstream
in favor of `BlockEntity.title`; the plugin reads `block.title` with
`block.content` as a compatibility fallback.

---

## 2. Functional Requirements

### 2.1 Tag Detection

| ID | Requirement |
|----|-------------|
| F-TD-1 | The plugin shall detect callout tags on blocks via three mechanisms, checked in order: (1) `block.tags` array (DB graph proper tags), (2) `block.refs` array (inline `#refs`), (3) text scan of `block.title` (falling back to the deprecated `block.content`) for `#tagname` patterns. |
| F-TD-1a | In DB graphs the SDK returns `block.tags` / `block.refs` entries as bare `{ id: number }` references with no name attached. The plugin shall resolve each id via `Editor.getTag(id)` to recover the tag's `originalName` / `name`, and cache the resolution per session (entity ids are stable). The legacy `{ originalName, name }` shape from file-based graphs shall continue to be accepted directly. |
| F-TD-2 | Tag matching shall be case-insensitive. |
| F-TD-3 | Only the first matching callout tag on a block shall be used for styling. |
| F-TD-4 | The plugin shall support 28 predefined callout tags across 7 color groups (see Section 4). |

### 2.2 Page Scanning

| ID | Requirement |
|----|-------------|
| F-PS-1 | On page load, the plugin shall scan all blocks on the current page by traversing the full block tree via `getPageBlocksTree()`. |
| F-PS-2 | On journal pages where `getCurrentPage()` returns null, the plugin shall fall back to `Editor.getTodayPage()` to resolve today's journal. Past-journal pages remain unsupported (neither API resolves them). |
| F-PS-3 | The plugin shall re-scan on route changes (page navigation) with a 500ms debounce. |
| F-PS-4 | The plugin shall re-scan on DB changes (block edits) with a 300ms debounce. |
| F-PS-5 | The plugin shall re-scan on settings changes with a 100ms debounce. |
| F-PS-6 | The initial scan shall execute 800ms after plugin load to allow the page to settle. |

### 2.3 Display Modes

The plugin supports three display modes, configurable via settings:

#### 2.3.1 Inline Mode (default)

| ID | Requirement |
|----|-------------|
| F-IN-1 | The tagged block's `.block-main-container` shall receive a colored background using the callout's color group. |
| F-IN-2 | A badge containing the icon and/or label shall be rendered as a `::after` pseudo-element on `.block-control-wrap`. |
| F-IN-3 | The badge shall use the tabler-icons webfont for the icon character, styled as uppercase with 11px font size. |
| F-IN-4 | When "Cascade to Children" is enabled, child blocks shall receive the same background color with `margin-left: 0` (flush with parent) and `border-radius: 0 0 r r` (bottom corners only). The parent's bottom corners shall be flattened via `:has()` selector. |

#### 2.3.2 Container Mode

| ID | Requirement |
|----|-------------|
| F-CN-1 | The tagged block's `.block-main-container` shall be wrapped in a bordered box with rounded corners and background color. |
| F-CN-2 | A floating badge shall be rendered as a `::before` pseudo-element, positioned absolutely at `top: -10px; left: 12px`, overlapping the top border. |
| F-CN-3 | When "Cascade to Children" is enabled and children exist, the parent container's bottom border and bottom border-radius shall be removed (via `:has()` selector). |
| F-CN-4 | Children shall be visually merged with the parent by directly styling `.block-children-container` with `margin-left: 0` (overriding Logseq's default 29px indent), matching borders on left/right/bottom, and `padding-left: 29px` to preserve content indentation. |

#### 2.3.3 Icon Mode

| ID | Requirement |
|----|-------------|
| F-IC-1 | The tagged block's native node icon shall be set via `logseq.Editor.setBlockIcon(uuid, 'tabler-icon', iconId)` using the callout's PascalCase icon ID. |
| F-IC-2 | A 3px solid left border in the callout's color shall be applied to `.block-main-container` (GitHub-style callout). |
| F-IC-3 | When "Cascade to Children" is enabled, the left border shall extend to `.block-children-container` with `margin-left: 0` to stay flush with the parent. |
| F-IC-4 | Node icons set by this mode persist as block properties even after plugin unload (set-and-forget). |

#### 2.3.4 Admonition Mode

| ID | Requirement |
|----|-------------|
| F-AD-1 | The tagged block's native node icon shall be set via `logseq.Editor.setBlockIcon()` (same mechanism as Icon mode), so the icon renders as Logseq's solid coloured glyph rather than a CSS-only character. |
| F-AD-2 | A vertical accent bar in the callout's color shall be rendered between the bullet/icon column and the content via a positioned `::before` pseudo-element on `.block-control-wrap`. The bar shall be ~1.95em tall (vertically centered) so it extends slightly past the natural single-line block height without dominating multi-line blocks. |
| F-AD-3 | The block's `.block-main-container` shall receive vertical breathing room (`margin: 0.4em 0`) so consecutive admonition blocks do not visually crowd. No background tint, border-radius, padding, or font-size adjustment shall be applied. |
| F-AD-4 | When "Cascade to Children" is enabled, an accent-colored `border-left` shall extend down `.block-children-container` (with `margin-left: 18px` and compensating `padding-left: 11px` to preserve Logseq's 29px content indent) so the bar visually continues through nested children. |
| F-AD-5 | "Show Label" and "Show Icon" settings have no effect in admonition mode — the visual identity is the bar plus the native block icon, both unconditional. |

### 2.4 Settings

| ID | Setting | Type | Default | Requirement |
|----|---------|------|---------|-------------|
| F-ST-1 | Display Mode | enum: `icon`, `inline`, `container`, `admonition` | `inline` | Controls which display mode is active for all callout blocks. |
| F-ST-2 | Cascade to Children | boolean | `true` | When enabled, callout styling extends to child blocks of tagged blocks. |
| F-ST-3 | Show Label | boolean | `true` | When enabled, the callout type label (e.g. "Warning") is shown in the badge. |
| F-ST-4 | Show Icon | boolean | `true` | When enabled, the tabler icon is shown in the badge. |

### 2.5 Slash Commands

| ID | Requirement |
|----|-------------|
| F-SC-1 | The plugin shall register a slash command for each of the 28 callout tags, named `Callout: {Label}` (e.g. `Callout: Warning`). |
| F-SC-2 | Invoking a slash command shall attach the corresponding tag to the current block via `Editor.addBlockTag()`, resolving the tag page through `Editor.getTagsByName()` (creating it via `Editor.createTag()` if it does not yet exist). The block's content shall not be mutated. |
| F-SC-3 | Invoking a slash command shall also set the block's node icon via `setBlockIcon()`, regardless of the active display mode. |

### 2.6 Cleanup

| ID | Requirement |
|----|-------------|
| F-CL-1 | On plugin unload (`beforeunload`), all scan timers shall be cleared and the decorated blocks map shall be emptied. |

---

## 3. Non-Functional Requirements

### 3.1 CSS Injection Strategy

| ID | Requirement |
|----|-------------|
| N-CSS-1 | All visual styling shall be applied via CSS injection using `logseq.provideStyle()`, not direct DOM manipulation. This is required because the plugin runs in a sandboxed iframe that cannot access `parent.document`. |
| N-CSS-2 | Block targeting shall use `[blockid="uuid"]` attribute selectors to scope styles to specific blocks. |
| N-CSS-3 | Dynamic CSS shall be regenerated on every scan cycle, replacing the full style block via keyed `provideStyle({ key })`. |

### 3.2 Theme Support

| ID | Requirement |
|----|-------------|
| N-TH-1 | Colors shall use Logseq's Radix color tokens (`--rx-{color}-{step}-alpha`) for automatic light/dark theme adaptation. |
| N-TH-2 | Text colors in badges shall have separate light and dark values, with dark mode overrides applied via `html.dark` selectors. |

### 3.3 Performance

| ID | Requirement |
|----|-------------|
| N-PF-1 | All scan triggers shall be debounced to prevent excessive re-scans during rapid editing. |
| N-PF-2 | CSS regeneration shall only occur when the decorated blocks set has changed or was previously non-empty. |

### 3.4 Compatibility

| ID | Requirement |
|----|-------------|
| N-CM-1 | The plugin shall target ES2020. |
| N-CM-2 | The plugin shall declare `web: true` for web app compatibility. |
| N-CM-3 | The plugin shall only support DB graphs (`supportsDBOnly: true`). |

---

## 4. Callout Tag Definitions

| Tag | Label | Icon (tabler) | Color Group |
|-----|-------|---------------|-------------|
| `snippet` | Snippet | quote | purple |
| `cite` | Cite | blockquote | purple |
| `warning` | Warning | alert-triangle | yellow |
| `caution` | Caution | alert-triangle | yellow |
| `attention` | Attention | bell-ringing | yellow |
| `question` | Question | help-circle | blue |
| `help` | Help | lifebuoy | blue |
| `faq` | FAQ | message-question | blue |
| `success` | Success | circle-check | green |
| `check` | Check | check | green |
| `done` | Done | checklist | green |
| `abstract` | Abstract | file-text | teal |
| `summary` | Summary | list | teal |
| `tldr` | TLDR | bolt | teal |
| `important` | Important | urgent | red |
| `danger` | Danger | alert-octagon | red |
| `tip` | Tip | bulb | orange |
| `note` | Note | pencil | blue |
| `example` | Example | code | purple |
| `src` | Src | code | teal |
| `search` | Search | search | blue |
| `latex` | LaTeX | math | purple |
| `pinned` | Pinned | pin | orange |
| `export` | Export | file-export | teal |
| `verse` | Verse | blockquote | purple |
| `ascii` | Ascii | terminal | teal |
| `center` | Center | align-center | blue |
| `comment` | Comment | message | blue |

### 4.1 Color Groups

Each color group defines five tokens derived from Logseq's Radix scale:

| Token | Usage |
|-------|-------|
| `bg` | Block/container background (step 04 alpha) |
| `border` | Container border color (step 06) |
| `text` | Badge text color — light mode (step 11) |
| `textDark` | Badge text color — dark mode (step 09) |
| `badge` | Badge background (step 05 alpha) |

Supported color groups: **purple**, **yellow**, **blue**, **green**, **teal**, **red**, **orange**.

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Logseq Host (parent window)                    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  <style> injected via provideStyle()    │    │
│  │  CSS rules target [blockid="uuid"]      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Block DOM                              │    │
│  │  .ls-block[blockid="..."]               │    │
│  │    > .block-main-container              │    │
│  │      > .block-control-wrap (::after)    │    │
│  │    > .block-children-container (::before)│   │
│  └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│  Plugin Iframe (sandboxed)                      │
│                                                 │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  │
│  │ index.ts  │  │ callouts.ts│  │ styles.ts  │  │
│  │ scan loop │  │ 28 tag defs│  │ base CSS   │  │
│  │ CSS gen   │  │ color tokens│ │            │  │
│  │ icon set  │  │ icon codes │  │            │  │
│  │ commands  │  │ icon IDs   │  │            │  │
│  └───────────┘  └────────────┘  └───────────┘  │
│                                                 │
│  SDK messaging ←→ logseq.Editor / App / DB APIs │
└─────────────────────────────────────────────────┘
```

### 5.1 Data Flow

1. **Trigger** — Page load, route change, DB change, or settings change fires a debounced scan.
2. **Scan** — `scanAndDecorate()` resolves the current page, fetches the block tree, and recursively checks each block for callout tags via `findCalloutTag()`.
3. **Map** — Matching blocks are stored in `decoratedBlocks` (Map of uuid → tag name).
4. **Generate** — `generateDynamicCSS()` iterates the map, looks up each tag's callout definition and color tokens, and emits CSS rules based on the active display mode and settings. In icon mode, `setBlockCalloutIcon()` also calls `setBlockIcon()` on each block.
5. **Inject** — The generated CSS string is passed to `logseq.provideStyle()`, which creates a `<style>` element in the host document. All three modes inject CSS (icon mode for left borders, inline/container for full styling).

---

## 6. Known Limitations

| ID | Limitation |
|----|------------|
| L-1 | `getCurrentPage()` returns null on journal pages; `getTodayPage()` is used as a fallback. Past-journal pages (anything other than today's) are not detected — neither API resolves them. |
| L-2 | ~~Resolved~~ — `provideStyle()` now uses keyed replacement (`callout-base`, `callout-dynamic`) to avoid accumulating stale style tags. |
| L-3 | The `:has()` CSS selector (used in inline/container mode cascade) is not supported in Firefox versions before 121. |
| L-4 | Icon mode's `setBlockIcon()` persists the icon as a block property. Disabling the plugin does not remove previously set icons. |
| L-5 | Cascade children alignment uses `margin-left: 0` to override Logseq's default 29px indent. If Logseq changes this value, the alignment may break. |
