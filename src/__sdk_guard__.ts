/// <reference types="@logseq/libs" />

// Compile-time guard: `logseq.Commands` exists only in @logseq/libs ≥ 0.3.4,
// the floor declared in package.json (`logseq.minSDKVersion`). If this file
// fails typecheck, the installed SDK is older than the floor.
export type SdkGuard = typeof logseq.Commands
