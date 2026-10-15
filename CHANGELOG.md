# Changelog

All notable changes to **logseq-callout** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/).

## [Unreleased]

## [1.1.0] — 2026-10-15

### Fixed
- **Badge glyphs for 13 callouts were wrong or blank** (`#tip` showed a grid,
  `#cite` nothing, `#question` an exclamation mark, …). The codepoint table
  was written against a different Tabler release than the 2.47.0 webfont
  Logseq bundles. Codes now match, and a unit test compares the table with
  the pinned `@tabler/icons-webfont` so drift fails CI.
- Inline badges rendered "⚠WARNING" with no gap: a CSS hex escape consumes
  the following space. Badge text is built by one helper for both inline
  and container modes, with no stray leading/trailing spaces in icon-only
  or label-only badges.
- Icons left behind by an earlier session are cleaned up on the first scan
  in inline/container mode, not only after the next change.
- **Icon/admonition modes no longer loop.** Every scan re-wrote the block icon,
  each write bumped the block's `updated-at`, which re-fired `DB.onChanged`,
  which scheduled another scan — forever. Icons are now set only when the
  block's current icon differs (`planIconOps`).
- Overlapping scans could clear and repopulate the decorated set mid-flight,
  so styling flickered or dropped blocks. Scans are serialised by a
  generation counter; a stale result is discarded.
- A DB change on *another* page (sync, second window), including the
  creation of a new tag page, no longer triggers a rescan of the current page.
- A stale or invalid `displayMode` in the settings file crashed the scan
  (`RENDERERS[undefined]`). Settings are now coerced with defaults.
- Removed the `#tag` substring scan of block text, which matched `#tips`,
  `#tipping` and URL fragments. DB graphs carry tags structurally.
- `test-data.md` still referenced the renamed `#query` tag.

### Changed
- **Stale icons are cleaned up.** When a callout tag is removed, or the
  display mode switches to `inline`/`container`, the plugin removes the
  icon it set — but only if the block still carries exactly that icon; a
  user-chosen icon is never touched.
- Slash commands no longer write an icon directly; the scan triggered by the
  new tag applies it when the active mode uses native icons.
- Detection reads the block tree returned by `getPageBlocksTree` directly
  instead of one `getBlock` round-trip per block.
- Removed the global `position: relative` rule that applied to every block
  on the page; container mode sets it on its own blocks only.
- Hook subscriptions (`onRouteChanged`, `DB.onChanged`, `onSettingsChanged`)
  are unsubscribed on unload.
- Per-scan console logging removed.

### Security
- Content-Security-Policy meta tag in `index.html` (no remote scripts).
- Dev server CORS restricted to `http://localhost:3001` / `http://127.0.0.1:3001`.
- Block uuids are validated before being interpolated into CSS selectors.
- `pnpm audit` is clean: `vite` 7.3.7; overrides for `dompurify` ^3.4.17
  (GHSA chain through `@logseq/libs`), `lodash-es` ^4.18.1, `postcss`
  ^8.5.30, `nanoid` ^3.3.20, `esbuild` ^0.28.2, `source-map-js` ^1.2.2.

### Internal
- `@logseq/libs` ^0.3.4 (`minSDKVersion` 0.3.4) with a compile-time SDK
  floor guard (`src/__sdk_guard__.ts`).
- `src/index.ts` split into a thin SDK adapter plus pure, unit-tested
  modules: `settings.ts`, `css.ts`, `detect.ts`, `icons.ts`. Vitest with
  80% coverage thresholds runs in CI and before release, including a matrix
  over all 28 callouts × 32 settings permutations.
- `pnpm e2e` (`scripts/e2e/callouts-matrix.sh`) drives the real Logseq web
  app through every settings permutation and asserts each callout block's
  computed styles: badge text, native icon, cascade margins and backgrounds.
  `pnpm e2e:desktop` runs the same matrix in a second instance of the
  installed desktop app without touching the user's settings or graphs.
- Manifest flags (`web`, `effect`, `supportsDB`, `supportsDBOnly`) moved
  inside the `logseq` object. Node 24 (`engines`, `.nvmrc`, CI).
- Dead exports removed (`ICON_COLORS`, `getColorTokens`, `styles.ts`);
  `getIconCode` throws on an unknown icon instead of substituting a glyph.

## [1.0.0] — 2026-05-01

First marketplace-ready release. Commits to a stable plugin contract:
the four display modes (`icon`, `inline`, `container`, `admonition`),
the 28 callout tag names, and the four user-visible settings
(`displayMode`, `cascadeToChildren`, `showLabel`, `showIcon`) are now
considered part of the public API. Future breaking changes require a
2.0.0.

### Added
- **Admonition display mode** — minimal Asciidoctor-style rendering with a
  vertical accent bar between the bullet column and the content, paired
  with the native block icon (set via `Editor.setBlockIcon()`). No
  background tint, no font-size shift. Cascade extends the bar through
  nested child blocks. Selectable via the existing Display Mode setting.
- LICENSE file (MIT). Marketplace metadata in `package.json` (homepage,
  bugs, repository, keywords, engines). GitHub Actions workflows for CI
  and tag-triggered release packaging.

### Fixed
- Detect DB-graph tags returned as `{ id: <number> }` references by
  resolving the id through `Editor.getTag(id)`. Previously the detection
  only handled the `{ originalName, name }` shape, so on DB graphs no
  callouts matched and inline/container modes silently produced no
  styling (icons still appeared because `setBlockIcon` had persisted them
  to the block as a property).

### Changed
- Upgrade `@logseq/libs` from `^0.2.12` to `^0.3.2`.
- Tag detection now reads `block.title` (with `block.content` fallback) —
  `BlockEntity.content` is deprecated in the 0.3.x SDK.
- Slash-command handler reads `block.title` instead of `block.content`.
- **Slash commands now attach a proper DB tag** via `Editor.addBlockTag`
  (creating the tag page through `createTag` when needed) instead of
  appending `#tag` to the block's text. The block's content is no longer
  mutated; the tag binding is what drives styling.
- Journal-page fallback uses `Editor.getTodayPage()` instead of a hand-rolled
  date-format workaround. Past-journal pages remain unsupported.
- Renamed `#query` → `#search` (label "Search", same blue color, same
  `search` glyph). The old `#query` tag is no longer recognised.
- Renamed `#quote` → `#snippet` (label "Snippet", same purple color, same
  `quote` glyph). The old `#quote` tag is no longer recognised.

### Removed
- Defensive `Record<string, unknown>` cast around
  `logseq.Editor.setBlockIcon` — the 0.3.x SDK exposes a typed signature,
  so the workaround is obsolete.
- `formatJournalDate` helper (obsoleted by `Editor.getTodayPage`).

## [0.1.0] — 2026-04-08

### Added
- Tag-driven callout styling with three display modes: icon, inline, container.
- 28 predefined callout tags across 7 color groups (purple, yellow, blue,
  green, teal, red, orange).
- Cascade-to-children styling with indentation alignment overrides.
- Slash commands for every callout type (e.g. `/Callout: Warning`).
- Keyed `provideStyle` injection (`callout-base`, `callout-dynamic`) to
  prevent stale style accumulation.
- Icon mode left-border (GitHub-style) with `setBlockIcon` for the native
  node icon.
