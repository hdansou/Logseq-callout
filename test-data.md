# Callout Plugin Test Data

Paste each top-level bullet as a block in Logseq. Indented bullets are child blocks.

## All 28 Callouts (flat)

- This is a quote from a famous author #quote
- Citing a reference source here #cite
- Be careful with this operation #warning
- Proceed with caution when editing #caution
- This requires your immediate attention #attention
- How does this feature work? #question
- Need help with configuration? #help
- Frequently asked question about setup #faq
- Operation completed successfully #success
- All items verified and checked #check
- Task is done and ready for review #done
- Brief overview of the document #abstract
- Summary of key findings below #summary
- Too long; didn't read version #tldr
- This is critically important #important
- This action is dangerous and irreversible #danger
- Here's a helpful tip for productivity #tip
- Take note of this for later #note
- Here's an example of usage #example
- Source code snippet follows #src
- Database query results below #query
- Mathematical formula: E = mc² #latex
- This item is pinned to the top #pinned
- Data exported for external use #export
- Roses are red, violets are blue #verse
- ASCII art and text diagrams here #ascii
- This content is centered #center
- A comment for reviewers to read #comment

## Cascade Tests (with children)

- PostgreSQL or DynamoDB for user service? #question
  - Need complex joins → leaning PostgreSQL
  - DynamoDB better for key-value lookups
    - But we also need full-text search

- Deployment checklist before release #warning
  - Run all unit tests
  - Check database migrations
  - Verify environment variables
  - Smoke test staging environment

- Architecture decision: event sourcing #important
  - Pros: full audit trail, replay capability
  - Cons: increased complexity, storage costs
    - Mitigation: use snapshots every 1000 events

- Steps to configure the project #tip
  - Clone the repository
  - Copy `.env.example` to `.env`
  - Run `npm install`
    - Use Node 20+ for compatibility

- The quick brown fox #quote
  - jumped over the lazy dog
  - and then sat down for tea
    - with biscuits and jam

- API response format #example
  - Returns JSON with `data` and `meta` fields
  - Pagination via `cursor` parameter
  - Rate limited to 100 requests/minute

- Migration guide v2 → v3 #danger
  - Breaking change: `userId` renamed to `user_id`
  - Remove deprecated `getAll()` calls
    - Replace with `list()` with pagination

- Sprint retrospective notes #note
  - What went well: faster CI pipeline
  - What to improve: code review turnaround
  - Action items for next sprint
    - Set up review rotation schedule
    - Add PR size limits

- Project summary for stakeholders #summary
  - Phase 1 complete: core API
  - Phase 2 in progress: admin dashboard
    - Expected completion: end of month
  - Phase 3 planned: mobile app

- Build completed successfully #success
  - 142 tests passed, 0 failed
  - Bundle size: 48kb gzipped
  - Deployed to staging
    - URL: staging.example.com
