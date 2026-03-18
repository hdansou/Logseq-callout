/**
 * Static base styles for the callout plugin.
 * Dynamic per-block styles are generated in index.ts.
 */
export function generateAllStyles(): string {
  return `
/* logseq-callout: base static styles */

/* Ensure block-main-container respects position:relative for badge positioning */
.ls-block > .block-main-container {
  position: relative;
}
`
}
