# Tasks

## Current: Audit Findings

Status: planning
Started: 2026-04-07

### Tasks

- [ ] **1. Fix `formatJournalDate` ignoring format parameter** — `src/index.ts:345`
      The `_format` argument is unused; the function hardcodes `MMM do, yyyy`.
      Users with non-default date formats will get incorrect journal page lookups.
      Either parse the format string or document this as intentional.
      Test: Journal pages resolve correctly with non-default date formats

- [ ] **2. Remove or wire up dead `styles.ts`** — `src/styles.ts`
      `generateAllStyles()` is defined but never called. The base static style
      (`position: relative` on `.block-main-container`) is never injected.
      Either import and use it in `main()` via `logseq.provideStyle()`, or
      delete the file if it's unnecessary.
      Test: No dead code; `npm run typecheck` passes

### Progress Log

<!-- Append entries as tasks complete -->

### Review

<!-- Added at completion: summary, lessons, what to improve -->
