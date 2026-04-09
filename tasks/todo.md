# Tasks

## Current: Audit Findings

Status: in-progress
Started: 2026-04-07

### Tasks

- [ ] **1. Fix `formatJournalDate` ignoring format parameter** — `src/index.ts:345`
      The `_format` argument is unused; the function hardcodes `MMM do, yyyy`.
      Users with non-default date formats will get incorrect journal page lookups.
      Either parse the format string or document this as intentional.
      Test: Journal pages resolve correctly with non-default date formats

- [x] **2. Remove or wire up dead `styles.ts`** — `src/styles.ts`
      Wired up: imported `generateAllStyles()` in `main()`, injected via
      `logseq.provideStyle({ key: 'callout-base', style: generateAllStyles() })`.

- [x] **3. Fix `provideStyle()` accumulation** — `src/index.ts:285`
      Replaced bare `provideStyle(css)` with keyed
      `provideStyle({ key: 'callout-dynamic', style: css })` so each scan
      replaces the previous style tag instead of appending a new one.
      Root cause of inline/container modes not working.

### Progress Log

- 2026-04-08: Fixed style accumulation and wired up base styles (tasks 2 & 3)

### Review

<!-- Added at completion: summary, lessons, what to improve -->
