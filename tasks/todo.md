# Tasks

## Current: Upgrade @logseq/libs 0.2.12 → 0.3.2

Status: in-progress
Started: 2026-04-18

Reference analysis: reviewed `/Users/dzu/Projects/src/github.com/logseq/libs`
(monorepo copy at 0.3.1; 0.3.2 differs only by patch).

### Findings (what changes between 0.2.12 and 0.3.2)

- Internal refactor (`#12395`), DB/OG split (`#12276`), dependency upgrades.
- Public API surface used by this plugin is **compatible**. No hard breaks.
- `BlockEntity.content` is marked `@deprecated — use :title instead!`.
  We read `block.content` in two places.
- `setBlockIcon` is now formally typed `(BlockIdentity, 'tabler-icon' | 'emoji', string) => Promise<void>`.
  Our defensive `Record<string, unknown>` cast is no longer needed.
- `onSettingsChanged` callback contract clarified: `(next, prev)` full
  snapshots. We ignore args — no impact.

### Verification plan (run before + after — TDD-style red/green)

Since the plugin has no unit test framework (per CLAUDE.md: "Test: Manual"),
the verification plan is our test. Before changes, capture baseline; after,
re-run and compare.

1. `npm run typecheck` — must pass before and after.
2. Load plugin in Logseq at http://localhost:3001.
3. Open `test-data.md` sample blocks and verify:
   - `#warning`, `#tip`, `#important`, `#success`, `#quote` render correctly
     in all three display modes (icon / inline / container).
   - Slash command `/Callout: Warning` adds the tag to the current block and
     sets the node icon.
   - Cascade to children preserves indentation (margin-left: 0,
     padding-left: 29px override).
   - Journal pages resolve correctly (known brittle path — test-data.md
     link from today's journal).
   - No console errors during plugin load/unload.

### Tasks

- [x] **1. Bump SDK version** — `package.json`: `@logseq/libs` → `^0.3.2`.
      `npm install` completed; `node_modules/@logseq/libs/package.json`
      shows 0.3.2.

- [x] **2. Migrate `block.content` reads to `block.title`** —
      `findCalloutTag` and slash-command handler now read
      `(block.title ?? block.content ?? '')`. `scanBlockTree` parameter
      type extended with `title?: string`.

- [x] **3. Remove defensive cast around `setBlockIcon`** —
      Replaced with direct typed call
      `logseq.Editor.setBlockIcon(uuid, 'tabler-icon', callout.iconId)`.

- [x] **4a. Typecheck + build** — `npm run typecheck` clean;
      `npm run build` produced `dist/` without errors.

- [x] **4b. Manual verify at localhost:3001** — Verified on 2026-04-29
      after the DB-graph tag-detection regression fix. Container mode now
      shows backgrounds, borders, and floating badges as expected.

### Deferred (carried from previous audit / opportunities found)

- [x] **Fix `formatJournalDate` ignoring format parameter** —
      Replaced the date-format workaround with `logseq.Editor.getTodayPage()`.
      `formatJournalDate` deleted entirely.

- [x] **Replace slash-command text mutation with `Editor.addBlockTag()`** —
      Slash command now resolves the tag page via `getTagsByName` (or
      creates it via `createTag`) and attaches it through `addBlockTag`.
      Block content is no longer mutated. CHANGELOG updated.

- [x] **Fix DB-graph tag detection regression (2026-04-29)** —
      `getBlock()` returns `block.tags` / `block.refs` entries as
      `{ id: number }` references in DB graphs. The detection code only
      knew the `{ originalName, name }` shape and silently produced no
      CSS for inline/container modes. Resolved each id via
      `Editor.getTag(id)` with a per-session cache. REQUIREMENTS F-TD-1a
      and CHANGELOG `### Fixed` document the fix; lesson saved to
      `tasks/lessons.md` and as a cross-project memory.

### Completed (previous audit)

- [x] **Wire up `styles.ts`** — imported `generateAllStyles()` in `main()`,
      injected via keyed `provideStyle`.
- [x] **Fix `provideStyle()` accumulation** — `src/index.ts:285`. Keyed
      style replacement.

### Progress Log

- 2026-04-08: Fixed style accumulation and wired up base styles
- 2026-04-18: Drafted SDK 0.3.2 upgrade plan
- 2026-04-18: Bumped @logseq/libs to 0.3.2, migrated `block.content` →
  `block.title` fallback, removed `setBlockIcon` defensive cast. Typecheck
  and build both clean. Awaiting manual verification at localhost:3001.
- 2026-04-27/28: Production-readiness pass — A+C+E cleanup, dependency
  CVE patches (vite + 3 overrides), pnpm migration, B1+B2 renderer
  refactor, A3 (`getTodayPage`) + B3 (`addBlockTag`) deferred items.
- 2026-04-29: Caught a DB-graph regression — inline/container styling
  silently dropped because `getBlock()` returns tag refs as `{id}` only.
  Diagnosed via temporary console logs (now removed); fixed with a
  cached `getTag(id)` resolver; manual verification at localhost:3001
  confirms container mode now renders correctly.

### Review

**Summary (2026-04-18).** Upgraded `@logseq/libs` from 0.2.12 to 0.3.2.
Three code changes, one dep bump:

- `package.json`: `@logseq/libs ^0.3.2` (npm-installed, verified).
- `src/index.ts` `findCalloutTag` + slash-command handler: read
  `block.title` (with `block.content` fallback) — `BlockEntity.content`
  is deprecated in 0.3.x.
- `src/index.ts` `setBlockCalloutIcon`: dropped
  `Record<string, unknown>` cast; direct typed call against the newly
  exposed 0.3.x signature.

Docs updated: `REQUIREMENTS.md` F-TD-1 + SDK note; new `CHANGELOG.md`.

Gates passed: `npm run typecheck` clean, `npm run build` clean. Awaiting
manual verification at localhost:3001 (task 4b).

**Lessons.** (1) The 0.3.x refactor is largely internal — the public API
the plugin uses survived intact; the real migration work is field renames
(`content` → `title`) and removing workarounds the new types obsolete.
(2) Reading the SDK source in `/Users/dzu/Projects/src/github.com/logseq/libs`
was faster than hunting a published changelog — the monorepo carries the
authoritative type definitions.
