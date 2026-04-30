# Lessons

Corrections and patterns accumulated during development on this project.
Read at the start of every session. Updated after every correction.

---

<!-- Format:
## [Date] — [Category]
**Mistake**: What went wrong
**Correction**: What should have happened
**Rule**: Preventive rule for the future
-->

## 2026-04-29 — DB graph SDK shape

**Mistake**: Tag detection assumed `block.tags` and `block.refs` from
`logseq.Editor.getBlock()` always carry `{ originalName, name }`. In DB
graphs they don't — they come back as `{ id: <number> }` references only.
The plugin found "tag-shaped data" but couldn't match any callout, so
container/inline styling silently produced no CSS while `setBlockIcon`
(which had been called separately) left a stray persisted icon. Easy to
mistake for "only icon mode is working."

**Correction**: Resolve the entity id via `Editor.getTag(id)` to get the
`PageEntity` whose `originalName` / `name` carries the actual tag name.
Cache the resolution per session — entity ids are stable.

**Rule**: When a Logseq SDK call returns objects that look like entity
references (`{ id: number }` / `{ db/id: ... }`), assume the name fields
are NOT included. Resolve via the matching `getX(id)` API and cache the
result. Don't read `originalName` / `name` directly off ref objects
without first verifying the shape on a real DB graph.
