# Changelog

All notable changes to **logseq-callout** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/).

## [Unreleased]

### Changed
- Upgrade `@logseq/libs` from `^0.2.12` to `^0.3.2`.
- Tag detection now reads `block.title` (with `block.content` fallback) —
  `BlockEntity.content` is deprecated in the 0.3.x SDK.
- Slash-command handler reads `block.title` instead of `block.content`.

### Removed
- Defensive `Record<string, unknown>` cast around
  `logseq.Editor.setBlockIcon` — the 0.3.x SDK exposes a typed signature,
  so the workaround is obsolete.

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
