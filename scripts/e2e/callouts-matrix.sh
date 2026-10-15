#!/usr/bin/env bash
# Live acceptance matrix: every callout × every settings permutation against
# the Logseq web app. Prerequisites: Logseq at :3001 (`pnpm watch` in the
# logseq repo), the plugin dev server at :8080 (`pnpm dev`), playwright-cli.
#
#   pnpm e2e            # run the matrix
#   KEEP=1 pnpm e2e     # leave the browser tab open afterwards
set -euo pipefail
cd "$(dirname "$0")/../.."

LOGSEQ_URL=${LOGSEQ_URL:-http://localhost:3001}
PLUGIN_URL=${PLUGIN_URL:-http://localhost:8080}
# playwright-cli may live in another nvm toolchain's bin dir than the project's Node.
PW=$(command -v playwright-cli || ls -1 "$HOME"/.nvm/versions/node/*/bin/playwright-cli 2>/dev/null | tail -1 || true)
[[ -x "${PW:-}" ]] || { echo "playwright-cli not found (npm i -g @playwright/cli)"; exit 2; }
playwright-cli() { "$PW" "$@"; }

PLUGIN_ID=$(node -e 'console.log(require("./package.json").logseq.id)')
PLUGIN_VERSION=$(node -e 'console.log(require("./package.json").version)')

curl -sf -o /dev/null --max-time 3 "$LOGSEQ_URL" || { echo "Logseq is not running at $LOGSEQ_URL"; exit 2; }
curl -sf --max-time 3 "$PLUGIN_URL/package.json" | grep -q "\"$PLUGIN_ID\"" || { echo "Plugin dev server is not serving $PLUGIN_ID at $PLUGIN_URL"; exit 2; }

# Expectation table straight from the source of truth (Node 24 strips the types).
EXPECT=$(node --no-warnings -e '
  import("./src/callouts.ts").then(m => {
    const out = {}
    for (const [tag, d] of Object.entries(m.DEFAULT_CALLOUTS)) out[tag] = { label: d.label, code: m.TABLER_ICON_CODES[d.icon], iconId: d.iconId }
    console.log(JSON.stringify(out))
  })')

ev() { playwright-cli eval "$1" 2>&1 | grep -E '^"|^\{|Error' || true; }
payload() { sed -e "s|__EXPECT__|$EXPECT|" -e "s|__PLUGIN_ID__|$PLUGIN_ID|" "$1"; }
result() { # poll window.<name> until the payload has stored its result; print the JSON
  local name=$1 tries=${2:-120}
  for ((i = 0; i < tries; i++)); do
    local r
    r=$(playwright-cli eval "JSON.stringify(window.$name)" 2>&1 | grep -E '^"' || true)
    if [[ -n "$r" && "$r" != '"null"' ]]; then node -e 'console.log(JSON.parse(process.argv[1]))' "$r"; return 0; fi
    sleep 5
  done
  echo '{"fatal":"timeout waiting for '"$name"'"}'
}

echo "→ opening $LOGSEQ_URL"
playwright-cli open "$LOGSEQ_URL" >/dev/null 2>&1 || playwright-cli open "$LOGSEQ_URL" >/dev/null 2>&1 || { echo "could not open the browser"; exit 2; }
sleep 6

echo "→ registering $PLUGIN_ID from $PLUGIN_URL (idempotent)"
ev "void (LSPluginCore._registeredPlugins.has(\"$PLUGIN_ID\") || LSPluginCore.register({ key: \"$PLUGIN_ID\", id: \"$PLUGIN_ID\", url: \"$PLUGIN_URL\", webPkg: { name: \"$PLUGIN_ID\", version: \"$PLUGIN_VERSION\", main: \"dist/index.html\", author: \"e2e\", installedFromUserWebUrl: \"$PLUGIN_URL\", logseq: { id: \"$PLUGIN_ID\", title: \"$PLUGIN_ID\", main: \"dist/index.html\" } } }))" >/dev/null
sleep 5
REG=$(ev "JSON.stringify(Array.from(LSPluginCore._registeredPlugins.keys()))")
[[ "$REG" == *"$PLUGIN_ID"* ]] || { echo "plugin did not register: $REG"; exit 3; }

echo "→ seeding Callout Matrix page"
playwright-cli eval "$(payload scripts/e2e/seed.browser.js)" >/dev/null 2>&1
SEED=$(result __seedResult 24); echo "   $SEED"
sleep 3

echo "→ running 32 permutations × $(node -e "console.log(Object.keys($EXPECT).length)") callouts (about 2 minutes)"
playwright-cli eval "$(payload scripts/e2e/matrix.browser.js)" >/dev/null 2>&1
REPORT=$(result __matrixResult 60)
echo "$REPORT" | node -e '
  const raw = require("fs").readFileSync(0, "utf8").trim()
  let r; try { r = JSON.parse(raw) } catch { console.error("unreadable report:", raw); process.exit(4) }
  if (r.fatal) { console.error("FATAL:", r.fatal); process.exit(4) }
  console.log(`   permutations: ${r.permutations}, block checks: ${r.blocksChecked}, failures: ${r.failures.length}`)
  for (const f of r.failures) console.log("   ✗ " + f)
  process.exit(r.failures.length ? 1 : 0)'
STATUS=$?
[[ "${KEEP:-}" == "1" ]] || playwright-cli close >/dev/null 2>&1 || true
exit $STATUS
