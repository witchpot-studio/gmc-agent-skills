# gmc-analysis skill changelog

## 0.15.0 - 2026-09-14

- New "AI disclosure state" section in SKILL.md (NAK-773): the tri-state
  Steam store AI-disclosure read, how to filter on it
  (`--ai-disclosure` / `filter.ai_disclosure`), group by it
  (`--group-by ai_disclosure`, cross-tabs with `release_month`), and read one
  title's state from `detail.aiDisclosure`.
- Adds the interpretation guardrails as honesty rules: `absent` is an
  observation that no disclosure block was found, never proof a title uses no
  generative AI; `unconfirmed` means not yet successfully observed (it includes
  titles never checked) and must be reported as its own bucket rather than
  folded into `absent`; `observedAt` is the read date, not the release date;
  `aiDisclosure: null` means the read model was unreachable, not "not
  disclosed".
- Records that `cohort_review_categories` and `compare_as_of` refuse the filter
  outright, so disclosure cohorts are sized with `market_aggregate`.

## 0.14.0 - 2026-08-20

- New "Query-backed lists (structured plus natural language)" section in
  SKILL.md (NAK-525): documents the version 2 query envelope, the rule that
  `structured` decides membership while `semanticQuery` only orders results
  inside it under the default `rank` mode, and the `total_kind` vocabulary
  (`exact` / `approximate` / `at_least` / `lexical_only` / `clipped`) with the
  honesty rule that anything but `exact` must be reported as approximate.
- Adds the two new tools to the Game List inventory: `resolve_game_list`
  (non-destructive, answers `RESOLUTION_REQUIRED`, 2 credits every call
  including a reuse) and `materialize_game_list` (freezes membership, requires
  `confirm: true`, 2 credits, never speculative). CLI equivalents:
  `gmc lists resolve <id>` and `gmc lists materialize <id> --confirm`.
- New sharp edge: `market_aggregate` / `cohort_review_categories` /
  `cohort_evidence` reject a `semanticQuery` list with
  `SEMANTIC_LIST_UNSUPPORTED_FOR_TOOL`, uniformly across `semanticMode`; a
  structured-only v2 envelope behaves exactly like a flat filter.
- Records `membership`, `definition_revision` and `last_resolved_at` on the
  list read tools, and what a frozen (`snapshot`) list does.
- Warns that `sort` and `as_of` are refused (not ignored) when reading a
  `semanticQuery` list or a frozen one.
- Documents the resolve conflict outcomes (`CONFLICT` /
  `definition_revision_mismatch`, `NOT_FOUND`, `SNAPSHOT_IS_FROZEN`) for a list
  edited, deleted or frozen while a resolve is running.

## 0.13.0 - 2026-08-20

- New "Per-family collection status" section in SKILL.md (NAK-596): documents
  the new MCP-only `game_collection_status` tool — no CLI command yet, same
  deferred posture as `game_language_support` (NAK-571) — agent-surface
  parity for `GET /api/v1/games/:appid/collection-status` (NAK-444).
- Adds the interpretation guardrails as honesty rules: `unknown` differs from
  `not_collected` in kind, not degree, and must never be restated as
  uncollected; `available: false` and the `collection_status_unavailable`
  warning token are coupled one-for-one; `requestable` states only whether
  requesting analysis routes demand to that family today (only `research`
  is), never a statement about any other family's schedule; the tool is
  read-only and never enqueues collection work; an unknown appid charges the
  weight-1 credit before returning `NOT_FOUND`.
- MCP-only mapping updated: per-family collection status ->
  `game_collection_status`.

## 0.12.0 - 2026-08-12

- Adds "Which review count you are looking at" (NAK-531): Steam returns two
  review totals depending on `purchase_type`, and they can differ by orders
  of magnitude. `purchase_type=all` is GMC's headline current total and is
  served by `game_profile` as `detail.reviewCounts`; every plain `reviews`
  field elsewhere stays the narrower `purchase_type=steam` family.
- Records the honesty rules that go with it: name the family and the
  observation date with any count; `allAvailable: false` means not collected
  rather than zero; compare the families only through
  `steamAtAllObservation`, because the top-level `steam` observation can be
  newer than `all`; derive a positive rate inside one family; never splice
  the families into one series, so a steam history's last point being
  smaller than the all-family headline is not a decline; and neither family
  is sales.

## 0.11.0 - 2026-08-10

- MCP-only mapping extended with the publisher/developer surface (NAK-383):
  `entity_resolve` (raw Steam publisher/developer string -> stable
  `entityId`) and `entity_profile` (that entity's portfolio, composition,
  release cadence and audience footprint). There is no CLI equivalent yet,
  so the entry states the resolve-then-profile order explicitly rather than
  mapping from a command.
- Adds the interpretation guardrails as honesty rules: resolve before
  profiling because a game record credits names and one entity commonly has
  several raw spellings, so a name-keyed lookup omits the titles credited to
  the siblings; `resolved: null` means that exact case-sensitive,
  whitespace-significant string is unknown to the master tables and never
  that the entity has no titles; `aggregatesAvailability: not_collected`
  means the aggregates have not been computed yet, so the block is absent
  rather than zero, and never that the studio has published nothing (the
  live `pagination.total` is still the real title count); a null
  `totalFollowers` is not collected rather than zero, and follower counts
  can never be summed across platforms.

## 0.10.0 - 2026-08-09

- New "Review-count history and the events around it" section in SKILL.md
  (NAK-428): documents `gmc games review-history` (MCP:
  `game_review_history`), and states that it has no flags because the
  endpoint has no query parameters — the full daily series is always
  returned and the agent windows it.
- Adds the interpretation guardrails as honesty rules: scale by date and
  never by array index because collection has real gaps; the series is
  published-run-only and contamination-filtered at a 2% tolerance, so
  differences are safe to report but the last point can lag the headline
  review count; an empty series is no collected history, not a review count
  of zero; empty `data.events` / `data.discountWindows` are collection
  states, never "no announcements" or "never discounted"; announcements are
  official-feed only and capped at the most recent 1000 items; a discount
  window is an observed >=20%-threshold state, not an exact Steam sale
  period, whose `endDate` is the first below-threshold observation and is
  not part of the window (with gaps in the observations, the actual last
  discounted day cannot be inferred from it) and whose `discountPercent` is
  the opening observation; events support temporal comparison only, never
  causal attribution.
- MCP-only mapping updated: review-count history with its
  lifecycle/announcement/discount context -> `game_review_history`.

## 0.9.0 - 2026-08-08

- New "Review topics by review language" section in SKILL.md (NAK-455):
  documents `gmc games language-topics` (MCP: `game_language_topics`), its
  two flags (`--min-reviews` 10-200, `--include-insufficient`), and the
  fact that this is the whole parameter surface because it is the API's.
- Adds the interpretation guardrails as honesty rules: read
  `data.evidenceState` first and never report `insufficient_evidence` or
  `not_analyzed` as zero; the population is the analyzed subset (about
  2,500 titles), not the Steam catalog; review language is never a country,
  region, market, or culture; observed `counts`/`rates` and sample-expanded
  `estimates` stay separate; name which of the four denominators a
  percentage is over; date every claim with `data.snapshot`; `coverage`
  survives the `reviews.topicLanguages.full` plan lock.
- MCP-only mapping updated: review topics by review language ->
  `game_language_topics`.

## 0.8.0 - 2026-08-06

- New "Steam \"More Like This\" neighbours" section in SKILL.md (NAK-459):
  documents `gmc games more-like-this` (MCP: `more_like_this`), the six
  collected storefront countries with the `us` default, and its use as a
  cohort seed that feeds `coverage_check` and the cohort workflows.
- Adds the interpretation guardrails as honesty rules: `position` is
  Steam's display order and never a similarity score or ranking;
  `observed_empty` (carousel collected and empty) must be told apart from
  `not_observed` (not collected yet), and neither may be reported as "this
  game has no similar games"; `stale: true` means date the claim rather
  than drop it or present it as current; candidates with
  `resolved: false` stay in the set as unresolved rather than being
  silently dropped.
- MCP-only mapping updated: single-title drill-down now also lists Steam
  store-page neighbours -> `more_like_this`.

## 0.7.0 - 2026-07-20

- New "Showcase workflows (fit + history)" section in SKILL.md (NAK-92 /
  NAK-240): documents `gmc showcases history` (MCP: `showcase_history`)
  alongside `showcases fit`, and the chain "similar games -> which
  showcases did they attend -> next edition deadline" via the appearance
  rows' `directory.next_edition`. Adds the interpretation guardrails as
  honesty rules: missing `directory` = "not linked", never "never
  participated"; a steam_event source-unavailable warning means
  research-source-only history, never zero participations; absent
  next-edition data means "window unknown", and the submission-close date
  must be checked against today before recommending a submission. Documents
  the transport casing split (CLI camelCase `nextEdition.submissionCloses`
  vs MCP snake_case `next_edition.submission_closes`) and that plan-limited
  responses redact directory links (indeterminate, not "unlinked" —
  check warnings first).
- MCP-only mapping updated: showcases now map to both `showcase_fit`
  (submission candidates) and `showcase_history` (participation history).

## 0.6.0 - 2026-07-17

- New "Product documentation (gmc-docs)" section in SKILL.md:
  points at the public docs site (`https://docs.gamemarketcopilot.com`) for
  product features, setup, plans/credits, API/CLI/MCP usage,
  troubleshooting, and methodology definitions; documents the read-only
  Docs MCP (`search_docs`/`get_page`/`list_pages`/`get_navigation`, no
  auth) for clients that support a second MCP connection, and `llms.txt` /
  per-page `.md` fetch over plain HTTP as the no-second-MCP-required
  fallback; requires citing the canonical docs URL when an answer draws on
  it. Keeps the distinction crisp: `gmc-docs` is product documentation, not
  market evidence; this skill remains the source of truth for statistical
  validity, claim safety, and chart guidance, and the docs never override
  it.
- `references/quota.md`: one-line pointer to the published plan/credit page
  (`https://docs.gamemarketcopilot.com/plans.md`) alongside the existing
  "treat as indicative" caveat.

## 0.5.0 - 2026-07-13

- New "Saved Game Lists" section in SKILL.md, plus recipe R5 in
  `references/recipes.md` (NAK-155/NAK-178/NAK-189): documents Game Lists as
  reusable, workspace-scoped cohort inputs — `gmc lists ...` (CLI) or the 7
  MCP tools (`list_game_lists`, `get_game_list`, `create_game_list`,
  `update_game_list`, `add_game_list_items`, `remove_game_list_item`,
  `delete_game_list`), all 0-credit; passing a filter-kind list's id as
  `game_list_id`/`--list <id>` to `list_games`, `market_aggregate`,
  `cohort_review_categories`, or `cohort_evidence` instead of re-sending an
  inline filter; reading `game_list.definition_hash` to detect a changed
  stored definition between calls; the composite-list tool restriction
  (`COMPOSITE_LIST_UNSUPPORTED_FOR_TOOL` on `market_aggregate`/
  `cohort_review_categories`), the manual-list restriction
  (`GAME_LIST_KIND_UNSUPPORTED`), and `delete_game_list`'s MCP confirm-by-
  exact-name two-call contract.
- `references/charts.md` retroactive documentation (NAK-190): this
  changelog entry catches up two content changes that shipped without a
  skill version bump because nothing enforced one at the time (see the new
  content-hash manifest guard below, added in this same release, to prevent
  a repeat):
  - PR #18 (NAK-139..143): new chart types beyond horizontal bar (lollipop,
    grouped column, stacked column, dumbbell, scatter, quadrant with
    computed threshold lines, donut, hero-number card); Steam capsule rows
    for per-game bar charts; wide (16:9, 1200x675) and square (1:1,
    1080x1080) export geometry replacing the earlier vertical (4:5) option.
  - PR #43 (NAK-166/NAK-142): direct-label placement rules (values at bar/
    line ends instead of legends, corner labels on quadrant charts) and the
    embedded brand typography stack (Inter / JetBrains Mono / Quicksand)
    used across card title, footer, and source-label text.
- Added `packages/gmc-cli/scripts/gen-skill-manifest.mjs` and
  `packages/gmc-cli/src/skill-manifest.test.js` (NAK-190): a content-hash
  manifest (`skill/gmc-analysis.manifest.json`, outside the synced skill
  directory) that fails `npm run test:cli` whenever `skill/gmc-analysis/**`
  content changes without a matching `metadata.version` bump and manifest
  regeneration (`npm run skill:manifest`) — the gap that let the two chart
  entries above ship unversioned.

## 0.4.0 - 2026-07-09

- Added `references/validity.md` (NAK-82): statistical-validity checklist
  (denominator + N on every share, observation window, counting basis,
  N<30 warning, effect size over bare significance, confound
  stratification for publisher axis / price / release year, multiple-
  comparison disclosure) and claim-safety rules (no causal verbs for
  observational associations, external-estimate labeling, `not_collected`
  means not collected), with a compliant output example. Wired into the
  SKILL.md hard rules and the AGENTS.md edition.
- New pitfall P9 (NAK-81): single-assignment (`primary_market_tag`) vs
  multi-assignment (`tag` grouping / `tags` filter) tag counting bases
  diverge sharply — pick one basis per question, name it next to the
  denominator, never mix or compare across bases.

## 0.3.1 - 2026-07-08

- quota.md: updated the paid allowances to the resized uniform per-credit
  pricing (Starter 2,500 / Pro 7,000 credits per month, NAK-110); reset and
  gate-time charging semantics unchanged.

## 0.3.0 - 2026-07-07

- Added `references/charts.md`: publish-ready branded chart cards from gmc
  CLI / MCP outputs (NAK-89). Bakes attribution into the artifact — fixed
  `GMC database` source label, brand lockup (icon + wordmark), denominator
  + observation window caption, no causal titles — and maps gmc output
  shapes (market aggregates, cohort evidence, coverage checks, single
  KPIs) to chart types with a self-contained HTML/Chart.js template.
- SKILL.md: new "Chart cards" section wiring the reference into the
  workflow and into the AGENTS.md edition.
- SKILL.md: new "MCP-only setups" section mapping the CLI workflow onto
  the GMC MCP tools (market_aggregate, coverage_check, cohort_evidence,
  game_profile, ...) so agents with only the MCP connection do not attempt
  gmc commands (NAK-98).
- quota.md: corrected to the monthly credit model (Starter 5,000 / Pro
  25,000 credits per month, reset on the 1st at 00:00 UTC, gate-time
  charging) — the per-UTC-day request caps it described were outdated.
- Documented the paid-plan requirement (Starter/Pro) for authenticated
  access, and the `PLAN_REQUIRED` vs `QUOTA_EXCEEDED` distinction for
  MCP tool errors (upgrade vs wait-for-reset).

## 0.2.0 - 2026-06-12

- Folded in the five learnings from the first field test (2025 city
  builders, price-band vs rating/review analysis; 7/7 rubric pass):
  - setup: documented the camelCase-query -> kebab-case-flag mapping and
    that per-command `--help` is currently generic;
  - new pitfall P5: zero-review games aggregate as rating 0 — pair rating
    metrics with `--reviews-min`, derive per-bucket hit rates from counts;
  - new pitfall P6: snapshot prices include active discounts — check the
    `discount` field before price-band conclusions;
  - recipe R4: price/distribution questions route to aggregate with
    explicit buckets first; `cohort pricing` is page-bounded texture only;
  - quota: composed evidence packs carry quota under
    `meta.upstreamRequests[].entitlements`, not at the top level.

## 0.1.0 - 2026-06-12

- Initial release, seeded from the 2026-06-12 field test (roguelike cohort
  complaint analysis over 114 games):
  - core workflow: coverage pre-estimation -> bounded workflow -> pivot ->
    exemplar drill-down;
  - pitfalls P1-P5 including the cross-game pattern aggregation pivot and
    the coverage-vs-topics distinction;
  - full-cohort map-reduce recipe with `--fields` projection and subagent
    chunking;
  - quota etiquette and honesty rules (skippedReasons, locked/preview,
    bounded-evidence caveats).
