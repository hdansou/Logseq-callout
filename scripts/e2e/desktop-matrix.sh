#!/usr/bin/env bash
# Live acceptance matrix in the Logseq DESKTOP app, driven over CDP through the
# owner's test-logseq-desktop skill (a second app instance with its own profile).
#
#   S=~/.claude/skills/test-logseq-desktop/scripts
#   logseq graph create -g callout-desktop-test
#   $S/launch.sh 9333 && node $S/cdp.mjs --port 9333 graph callout-desktop-test
#   pnpm build                       # the dev install loads dist/ from this folder
#   pnpm e2e:desktop [port]          # defaults to 9333
#   $S/stop.sh 9333 && logseq graph remove -g callout-desktop-test
#
# The instance window is usually hidden behind other windows; Chromium then
# throttles timers (the plugin's debounce included) to once a minute after a
# few minutes, and the matrix crawls. Launch the instance with
#   --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding
# (append them to launch.sh's nohup line, or launch by hand) or keep the window
# visible. The runner measures a 1 s timer and warns when it is throttled.
#
# Settings permutations are applied by overriding the plugin frame's in-memory
# settings; the shared ~/.logseq/settings file is never written, so the user's
# running Logseq is not affected. Refuses to run on a graph that is not named
# like a throwaway (contains "test").
set -euo pipefail
cd "$(dirname "$0")/../.."
PORT=${1:-9333}
CDP=${CDP:-$HOME/.claude/skills/test-logseq-desktop/scripts/cdp.mjs}
[[ -f "$CDP" ]] || { echo "cdp.mjs not found at $CDP (test-logseq-desktop skill)"; exit 2; }
curl -sf -o /dev/null --max-time 3 "http://127.0.0.1:$PORT/json" || { echo "no CDP instance on port $PORT (launch.sh first)"; exit 2; }

PLUGIN_ID=$(node -e 'console.log(require("./package.json").logseq.id)')
EXPECT=$(node --no-warnings -e '
  import("./src/callouts.ts").then(m => {
    const out = {}
    for (const [tag, d] of Object.entries(m.DEFAULT_CALLOUTS)) out[tag] = { label: d.label, code: m.TABLER_ICON_CODES[d.icon], iconId: d.iconId }
    console.log(JSON.stringify(out))
  })')
ev() { node "$CDP" --port "$PORT" eval -e "$1" 2>&1 | tail -1; }
payload() { sed -e "s|__EXPECT__|$EXPECT|" -e "s|__PLUGIN_ID__|$PLUGIN_ID|" -e "s|__APPLY__|override|" -e "s|__FRAME__|$(basename "$PWD")/dist|" "$1"; }

GRAPH=$(ev 'return (await logseq.api.get_current_graph()).name')
[[ "$GRAPH" == *test* ]] || { echo "refusing: instance is on graph $GRAPH (switch to a throwaway graph with cdp.mjs graph <name>)"; exit 3; }
LOADED=$(ev "return String(LSPluginCore.registeredPlugins.get(\"$PLUGIN_ID\")?.loaded)")
[[ "$LOADED" == "true" ]] || { echo "plugin $PLUGIN_ID is not loaded in the instance (is it a dev install from this folder?)"; exit 3; }
ORIGIN=$(ev 'return [...document.querySelectorAll("iframe")].map(f => f.src).find(s => /callout/.test(s)) || ""')
TIMER=$(ev 'const t0 = performance.now(); await new Promise(r => setTimeout(r, 1000)); return Math.round(performance.now() - t0)')
HIDDEN=$(ev 'return String(document.hidden)')
if (( TIMER > 2500 )); then echo "⚠ timers are throttled (1 s timer took ${TIMER} ms, window hidden=$HIDDEN): relaunch with --disable-background-timer-throttling or bring the window to the front"; fi
echo "→ graph: $GRAPH (window hidden=$HIDDEN, 1 s timer = ${TIMER} ms)"
echo "→ plugin: $ORIGIN"

TMP=$(mktemp -d -t callout-matrix)/payload.js
payload scripts/e2e/seed.browser.js > "$TMP"; node "$CDP" --port "$PORT" eval "$TMP" >/dev/null 2>&1 || true
for ((i = 0; i < 24; i++)); do r=$(ev 'return window.__seedResult ? JSON.stringify(window.__seedResult) : null'); [[ "$r" != "null" && -n "$r" ]] && break; sleep 5; done
echo "→ seed: $r"
sleep 3
payload scripts/e2e/matrix.browser.js > "$TMP"; node "$CDP" --port "$PORT" eval "$TMP" >/dev/null 2>&1 || true
echo "→ running 32 permutations (the desktop app takes 5-6 minutes)"
last=""
for ((i = 0; i < 120; i++)); do
  r=$(ev 'return window.__matrixResult ? JSON.stringify(window.__matrixResult) : null'); [[ "$r" != "null" && -n "$r" ]] && break
  p=$(ev 'return String(window.__matrixProgress)'); [[ "$p" != "$last" ]] && { echo "   $p"; last=$p; }
  sleep 10
done
rm -rf "$(dirname "$TMP")"
echo "$r" | node -e '
  let raw = require("fs").readFileSync(0, "utf8").trim()
  let r; try { r = JSON.parse(raw); if (typeof r === "string") r = JSON.parse(r) } catch { console.error("unreadable report:", raw); process.exit(4) }
  if (r.fatal) { console.error("FATAL:", r.fatal); process.exit(4) }
  console.log(`   permutations: ${r.permutations}, block checks: ${r.blocksChecked}, failures: ${r.failures.length}`)
  for (const f of r.failures) console.log("   ✗ " + f)
  process.exit(r.failures.length ? 1 : 0)'
