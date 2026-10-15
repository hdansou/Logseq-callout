// Seeds the "Callout Matrix" page: one block per callout with one child.
void (window.__seedResult = null, (async function () {
  var EXPECT = __EXPECT__
  var PAGE = "Callout Matrix"
  var api = window.logseq.api
  var tree = (await api.get_page_blocks_tree(PAGE)) || []
  if (tree.length === 0) await api.create_page(PAGE, null, { redirect: false })
  var have = {}
  for (var i = 0; i < tree.length; i++) { var m = /^callout:([a-z]+) /.exec(tree[i].title || ""); if (m) have[m[1]] = true }
  var added = 0, errors = []
  for (var tag in EXPECT) {
    if (have[tag]) continue
    try {
      var b = await api.append_block_in_page(PAGE, "callout:" + tag + " sample block #" + tag)
      await api.insert_block(b.uuid, "Child of " + tag, { sibling: false })
      added++
    } catch (e) { errors.push(tag + ": " + e) }
  }
  await api.push_state("page", { name: PAGE })
  return { added: added, errors: errors }
})().then(function (v) { window.__seedResult = v }, function (e) { window.__seedResult = { fatal: String(e) } }))
