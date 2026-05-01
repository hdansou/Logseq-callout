# Changelog

All notable changes to **logseq-callout** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/).

## [Unreleased]

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
