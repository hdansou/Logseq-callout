# Copilot Instructions

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No AI Slop**: Every line should look like a staff engineer wrote it on a good day.
- **DRY**: Don't repeat yourself. Extract on the third occurrence.
- **Fail Loud**: Errors surface immediately. Never swallow exceptions silently.
- **Conventional Commits**: `fix:`, `feat:`, `chore:` prefixes. Semver versioning.

## Project

TypeScript Logseq plugin (DB graphs only). Uses Vite + @logseq/libs SDK.
All DOM styling via CSS injection (`logseq.provideStyle()`), never direct DOM access.
Colors use Logseq's Radix tokens (`--rx-{color}-{step}-alpha`).

## Commands

- `pnpm build` — Production build
- `pnpm typecheck` — Type check only
- `pnpm dev` — Dev server with HMR
- `pnpm watch` — Rebuild on changes
