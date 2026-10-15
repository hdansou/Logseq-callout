// Runs inside the Logseq host page (injected by callouts-matrix.sh via
// `playwright-cli eval`). Must stay a single expression with no top-level
// semicolon and no arrow functions (playwright-cli wraps it in `() => (...)`).
// __EXPECT__ is replaced with the callout table; __PLUGIN_ID__ with the id.
void (window.__matrixResult = null, (async function () {
  var EXPECT = __EXPECT__
  var PAGE = "Callout Matrix"
  var api = window.logseq.api
  var plugin = LSPluginCore._registeredPlugins.get("__PLUGIN_ID__")
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  var glyph = function (code) { return String.fromCharCode(parseInt(code, 16)) }

  // One block per callout, each with one child so cascade is observable.
  var tree = (await api.get_page_blocks_tree(PAGE)) || []
  var byTag = {}
  for (var i = 0; i < tree.length; i++) {
    // Tags are stored as #[[uuid]] in the title, so blocks are identified by the seeded prefix.
    var m = /^callout:([a-z]+) /.exec(tree[i].title || "")
    if (m) byTag[m[1]] = tree[i].uuid
  }
  var missing = Object.keys(EXPECT).filter(function (t) { return !byTag[t] })
  if (missing.length) return { fatal: "blocks missing on " + PAGE + ": " + missing.join(", ") }

  var modes = ["inline", "container", "icon", "admonition"]
  var bools = [true, false]
  var failures = []
  var checked = 0

  for (var mi = 0; mi < modes.length; mi++)
    for (var ci = 0; ci < 2; ci++)
      for (var li = 0; li < 2; li++)
        for (var ii = 0; ii < 2; ii++) {
          var s = { displayMode: modes[mi], cascadeToChildren: bools[ci], showLabel: bools[li], showIcon: bools[ii] }
          plugin.settings.set("displayMode", s.displayMode)
          plugin.settings.set("cascadeToChildren", s.cascadeToChildren)
          plugin.settings.set("showLabel", s.showLabel)
          plugin.settings.set("showIcon", s.showIcon)
          var native = s.displayMode === "icon" || s.displayMode === "admonition"
          await sleep(native ? 4000 : 1500)
          var name = s.displayMode + " cascade=" + s.cascadeToChildren + " label=" + s.showLabel + " icon=" + s.showIcon

          for (var tag in EXPECT) {
            var def = EXPECT[tag]
            var el = document.querySelector('.ls-block[blockid="' + byTag[tag] + '"]')
            var main = el && el.querySelector(":scope > .block-main-container")
            var ctl = main && main.querySelector(".block-control-wrap")
            var kids = el && el.querySelector(":scope > .block-children-container")
            var fail = function (what, got) { failures.push(name + " #" + tag + ": " + what + " (got " + JSON.stringify(got) + ")") }
            checked++
            if (!main || !ctl || !kids) { fail("block DOM not found", null); continue }

            var parts = []
            if (s.showIcon) parts.push(glyph(def.code))
            if (s.showLabel) parts.push(def.label)
            var badge = parts.length ? JSON.stringify(parts.join(" ")) : "none"
            var ms = getComputedStyle(main)
            var transparent = "rgba(0, 0, 0, 0)"

            if (s.displayMode === "inline") {
              if (ms.backgroundColor === transparent) fail("no background", ms.backgroundColor)
              var after = getComputedStyle(ctl, "::after").content
              if (after !== badge) fail("badge " + badge, after)
            } else if (s.displayMode === "container") {
              if (ms.borderTopStyle !== "solid" && !(s.cascadeToChildren)) fail("no border", ms.borderTopStyle)
              if (ms.borderLeftStyle !== "solid") fail("no left border", ms.borderLeftStyle)
              var before = getComputedStyle(main, "::before").content
              if (before !== badge) fail("badge " + badge, before)
            } else if (s.displayMode === "icon") {
              if (ms.borderLeftWidth !== "3px") fail("left border 3px", ms.borderLeftWidth)
            } else {
              var bar = getComputedStyle(ctl, "::before")
              if (bar.width !== "3px") fail("accent bar 3px", bar.width)
            }

            var hasIcon = ctl.classList.contains("is-with-icon")
            if (hasIcon !== native) fail("native icon " + native, hasIcon)

            var ks = getComputedStyle(kids)
            var wantMargin = s.cascadeToChildren ? (s.displayMode === "admonition" ? "18px" : "0px") : "29px"
            if (ks.marginLeft !== wantMargin) fail("children margin-left " + wantMargin, ks.marginLeft)
            if (s.cascadeToChildren && (s.displayMode === "inline" || s.displayMode === "container") && ks.backgroundColor === transparent)
              fail("children background", ks.backgroundColor)
          }
        }
  return { done: true, permutations: 32, blocksChecked: checked, failures: failures }
})().then(function (v) { window.__matrixResult = v }, function (e) { window.__matrixResult = { fatal: String(e) } }))
