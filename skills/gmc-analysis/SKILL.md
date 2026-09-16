---
name: gmc-analysis
description: >-
  Use when analyzing Steam game market data with Game Market Copilot (the
  gmc CLI or the GMC MCP tools) — cross-game cohort analysis (common
  complaints, marketing patterns, pricing), single-title deep dives, market
  sizing, or any question about Steam games, reviews, creators, showcases,
  or campaigns that GMC can answer — including turning results into
  publish-ready branded chart cards.
metadata:
  version: 0.16.0
---

# GMC Analysis

The gmc CLI is a JSON-first client for the Game Market Copilot API (Steam
market analytics). The division of labor: the server owns data and access
gates, the CLI owns mechanical collection and bounded aggregation, and YOU
(the agent) own semantic interpretation. The CLI will not cluster meanings
across games — that is your job.

## Setup check (run once per session)

```bash
gmc --version                 # gmcp / game-market-copilot are the same CLI
gmc auth status --json        # anonymous => redacted previews + tiny quota
gmc schema --json             # the authoritative command/endpoint reference
```

Authenticated access (CLI login, API keys, MCP) requires a paid GMC plan
(Starter or Pro); Free workspaces cannot mint credentials. Anonymous CLI
use works but returns redacted previews with a tiny quota.

Never guess flags: `gmc schema --json` is the source of truth for commands
and parameters. Endpoint query params are camelCase and the matching CLI
flag is the kebab-case equivalent (`priceMin` -> `--price-min`,
`reviewsGt` -> `--reviews-gt`). Per-command `--help` currently prints one
generic usage list, so trust the schema. Always pass `--json`.

## MCP-only setups (no CLI installed)

If you have the GMC MCP connection instead of the CLI, do NOT attempt gmc
commands — use the MCP tools; every workflow and honesty rule in this skill
applies identically. Mechanics map as follows:

- Sizing and denominators (`gmc games count` / `games aggregate`) ->
  `market_aggregate` (population-true; prefer it over paginating
  `list_games`).
- Coverage pre-check -> `coverage_check` before fanning out `game_profile`
  on more than 3 titles.
- Cohort evidence (`reviews patterns`, `cohort ...`) -> `cohort_evidence`,
  `cohort_review_categories`, `search_review_claims`.
- Single-title drill-down (`games detail` / `games analysis`) ->
  `game_profile`; name resolution -> `resolve`; showcase submission
  candidates -> `showcase_fit`; per-title participation history ->
  `showcase_history`; Steam store-page neighbours (`games more-like-this`)
  -> `more_like_this`; review topics by review language (`games
  language-topics`) -> `game_language_topics`; review-count history with
  its lifecycle/announcement/discount context (`games review-history`) ->
  `game_review_history`; per-title AI-disclosure text and change history
  (`games ai-disclosure`) -> `game_profile` with `ai_disclosure` in
  `sections`.
- Per-family collection status ("has GMC actually collected X for this
  game?") has no CLI command yet and is MCP-only: `game_collection_status`
  (see the dedicated section below).
- Publisher/developer questions ("what else has this studio shipped", how
  often they release, how big their audience is) have no CLI command yet
  and are MCP-only: `entity_resolve` turns a raw Steam publisher/developer
  string into a stable `entityId`, then `entity_profile` returns that
  entity's portfolio, composition, release cadence and audience footprint.
  Always resolve first — a game record credits names, never ids — and pass
  the id, since one entity commonly has several raw spellings and a
  name-keyed lookup silently omits the titles credited to the siblings.
  `resolved: null` means that exact string (case-sensitive, whitespace
  included) is not in the master tables; it never means the entity has no
  titles. Read `aggregatesAvailability` before anything else:
  `not_collected` means the aggregates were not computed yet, so the block
  is absent rather than zero, and it never means the studio has published
  nothing — `pagination.total` still carries the live title count. A null
  `totalFollowers` is not collected, never zero, and follower counts can
  never be summed across platforms.
- The response envelope differs from the CLI: MCP tool responses carry
  `meta.quota` = `{ used, limit, remaining, resets_at }` (credits) plus
  `meta.credits_charged`, `meta.basis`, `meta.denominator`,
  `meta.coverage`, and `meta.warnings` — there is no `meta.entitlements`
  wrapper. The read-before-you-spend and honesty rules apply unchanged.
- CLI-only mechanics (pagination flags, `--fields` projection, map-reduce
  recipes) may have no MCP equivalent — stay within the tool contracts
  instead of simulating them.
- A `PLAN_REQUIRED` tool error means the workspace plan has no API access
  (e.g. Free) — retrying or waiting will not help; tell the user an
  upgrade at gamemarketcopilot.com/plans is required. Only
  `QUOTA_EXCEEDED` is the wait-for-monthly-reset condition.

References in this skill use CLI syntax; translate to the matching MCP
tool. Chart-card rules (references/charts.md) apply to both paths
unchanged.

## Core workflow for cohort questions

1. **Size the cohort and its research coverage first** (1-2 requests):
   `gmc games count --source steam <filters> --json`, then again with
   `--coverage full,partial`. Deep analysis exists only for researched
   titles; most of the catalog is `basic` (catalog + snapshot only). This
   tells you the denominator and the fan-out cost before you spend quota.
2. **Try the bounded cross-game workflow** that matches the question
   (`gmc reviews patterns`, `gmc marketing patterns`, `gmc cohort ...`) with
   `--coverage full,partial` in the filters.
3. **Pivot when the workflow under-delivers** — see the pitfalls reference.
   The most common pivot: per-game `gmc games analysis --sections reviews`
   over the cohort, then cluster the named theme labels yourself.
4. **Drill into exemplars**: `gmc games detail`, `gmc games analysis`,
   `gmc games success-report`, `gmc campaigns signals` on 2-5 representative
   titles to add texture to the synthesis.

For cohorts beyond one page, and for the full-cohort map-reduce procedure
(pagination, bounded concurrency, `--fields` projection, subagent chunking),
follow the recipes reference.

Search commands are optimized for row retrieval. Do not expect
`pagination.total` from `gmc games search` or CLI-composed evidence packs
unless you explicitly pass `--include-total`; for count-only questions use
`gmc games count` instead.

## Saved Game Lists (reusable cohort definitions)

A Game List is a workspace-scoped, reusable cohort input — persist a filter
(or an explicit appid set) once instead of re-sending a large inline filter
on every call.

- Manage lists via `gmc lists ...` (`list`, `create`, `show`, `games`, `add`,
  `remove`, `delete`, `resolve`, `materialize`) or the MCP tools
  `list_game_lists` / `get_game_list` / `create_game_list` /
  `update_game_list` / `add_game_list_items` / `remove_game_list_item` /
  `delete_game_list` / `resolve_game_list` / `materialize_game_list`. All are
  scoped to the caller's own workspace. The first seven are 0-credit;
  `resolve_game_list` and `materialize_game_list` cost 2 each (see
  "Query-backed lists" below).
- Two kinds: `manual` (explicit appid membership) and `filter` (a stored
  `GameFilter`, re-evaluated live against current data on every read). The
  MCP `game_list_id` input accepts `filter`-kind lists only; the CLI
  `--list <id>` flag resolves membership server-side and accepts BOTH kinds.
- Pass a filter-kind list's `id` as `game_list_id` to `list_games`,
  `market_aggregate`, `cohort_review_categories`, or `cohort_evidence`
  instead of re-sending the inline filter — mutually exclusive with
  `filter` (`INVALID_INPUT` if both or neither are given). CLI equivalent:
  `--list <id>` on `gmc reviews patterns`, `gmc marketing patterns`, and
  `gmc cohort ...` (cohort-evidence-shaped commands only — `gmc games
  count`/`gmc games aggregate` have no `--list` flag; use `market_aggregate`
  with `game_list_id` over MCP for that).
- The response's `game_list.definition_hash` (a SHA-256 over `{kind,
  filter, sort}`) tells you whether the stored definition changed between
  calls — diff hashes across calls instead of re-diffing the filter
  yourself.

### Query-backed lists (structured plus natural language)

A `filter` list's definition may also be the version 2 query envelope:

```json
{"version":2,"mode":"query",
 "structured":{"tags":["cozy"],"reviewsMin":500},
 "semanticQuery":"games about running a shop",
 "semanticMode":"rank"}
```

Read it exactly this way, and say it this way to the user:

- **`structured` decides membership.** Under the default `semanticMode:"rank"`
  the natural-language part only ORDERS results inside that universe; it never
  adds a game the structured conditions exclude. Under `"narrow"` it also
  narrows membership.
- **The total may not be a catalog count.** `meta.resolution.total_kind` says
  which: `exact`, `approximate`, `at_least` (a floor), `lexical_only` (the total
  counts the lexical population while the page is wider), or `clipped`. Anything
  other than `exact` must be reported as approximate. Never restate it as an
  exact number.
- **A `semanticQuery` list needs a resolution before its games can be read.**
  `list_games` / `get_game_list` / `gmc lists games <id>` answer
  `RESOLUTION_REQUIRED` until `resolve_game_list` (CLI: `gmc lists resolve <id>`)
  has run. Resolve costs 2 credits every call, including when an existing
  resolution is reused, and it never changes membership.
- **Do not pass `sort` or `as_of` when reading a `semanticQuery` list or a
  frozen one.** Both are refused with `INVALID_INPUT`: such a list is served in
  its resolved ranking order or its stored order, so a sort you supplied could
  only be ignored. Omit them.
- **If a resolve comes back `CONFLICT`, someone edited the list while it ran.**
  Re-read the list and resolve again; `details.reason` is
  `definition_revision_mismatch`. `NOT_FOUND` or `SNAPSHOT_IS_FROZEN` from a
  resolve means the list was deleted or frozen mid-flight.
- **`materialize_game_list` is not the same operation.** It FREEZES the current
  members, so the list stops following its definition, and the only way back is
  to discard the frozen rows. It costs 2 credits, requires `confirm: true` (CLI:
  `--confirm`), and must never be called speculatively — if the user only wants
  the list evaluated now, `resolve_game_list` is the non-destructive option.

Sharp edges:

- **A `semanticQuery` list cannot be aggregated.** `market_aggregate` and
  `cohort_review_categories` (and `cohort_evidence`) reject it with
  `SEMANTIC_LIST_UNSUPPORTED_FOR_TOOL`, in `rank` mode as well as `narrow`.
  They could only aggregate the structured half, which is a different population
  from the one the list contains — a wrong number, not a degraded one. Use
  `list_games` with the `game_list_id` to read its games. A **structured-only**
  v2 envelope has no such limit and behaves exactly like a flat filter.
- **Composite (union) lists** work only with `list_games`/`cohort_evidence`;
  `market_aggregate`/`cohort_review_categories` reject them with
  `COMPOSITE_LIST_UNSUPPORTED_FOR_TOOL` (those two are single aggregate
  calls that cannot be bound to an explicit appid population).
- **Manual lists cannot be used as `game_list_id`** (MCP only) — a
  `kind:"manual"` list fails `GAME_LIST_KIND_UNSUPPORTED` there. Use the
  CLI `--list <id>` flag (which accepts manual lists), or read membership
  directly (`gmc lists games <id>` / `get_game_list`).
- `delete_game_list` is destructive and, over MCP, uses a confirm-by-
  exact-name two-call contract: a call without `confirm` fails
  `CONFIRMATION_REQUIRED`, naming the list; only pass `confirm` set to that
  exact name after the user has explicitly asked to delete it — never
  guess or pre-fill it speculatively.
- `list_game_lists` reports `membership` per row and `get_game_list` adds
  `definition_revision` and `last_resolved_at`. A `membership:"snapshot"` list
  is frozen: it serves stored rows, ignores its definition, and answers
  `SNAPSHOT_IS_FROZEN` if you try to resolve it.

## Showcase workflows (fit + history)

Two complementary surfaces; use them as a pair for "where should we
submit?" questions:

- **Forward-looking fit**: `gmc showcases fit --source steam <externalId>
  --json` (MCP: `showcase_fit`) — tag-overlap candidates from the public
  showcase directory, filtered to currently recommendable entries.
- **Participation history**: `gmc showcases history --source steam
  <externalId> --json` (MCP: `showcase_history`) — which showcases/events a
  title actually appeared in, with a `directory` link (series, next
  edition, submission window) attached when the event name resolves to the
  directory. The chain "similar games -> which showcases did they attend ->
  next edition deadline" is: resolve the cohort, run history per title,
  then read the next-edition field on the linked rows.
- Field casing differs by transport: the CLI keeps the API's camelCase
  (`directory.nextEdition.submissionCloses`), while the MCP tool emits
  snake_case (`directory.next_edition.submission_closes`). Look for the
  casing that matches the surface you called before concluding a field is
  absent.

Interpretation guardrails (these are honesty rules, not suggestions):

- Read the response's warnings/caveats BEFORE interpreting missing
  `directory` fields. On plan-limited responses the appearance rows remain
  but every directory link is redacted (the CLI summary then reports
  `linkedToDirectoryCount: null`, and a plan-limited warning is attached) —
  that state is **indeterminate**, not "unlinked". The same applies when a
  directory-lookup warning is present.
- Absent such warnings, a row without `directory` means the event name is
  **not linked** to the directory (unresolved alias, or a non-showcase
  event such as an award show) — it NEVER means the appearance didn't
  happen. Do not drop unlinked rows from the story; label them as
  unlinked.
- Over MCP, `showcase_history` merges a second source (`steam_event`,
  Steam-operated events like Next Fest). A `meta.warnings` entry saying the
  steam_event source is unavailable means that source was NOT collected —
  report "research-source only", never "zero Steam event participations".
  The CLI command covers the research source only and says so in its
  warnings.
- The next-edition data depends on the directory's edition coverage,
  which is still sparse for submission windows — absence of the
  next-edition field (or of its submission-close date) means "window
  unknown", not "no upcoming edition". When present, check the
  submission-close date against today before recommending a submission.

## Steam "More Like This" neighbours

`gmc games more-like-this --source steam <externalId> --json` (MCP:
`more_like_this`) returns the games Steam itself showed in a title's
store-page "More Like This" carousel, for one storefront country.
`--country` accepts `de`, `fr`, `gb`, `jp`, `kr`, `us` and defaults to
`us`; omit the flag unless the question is about a specific storefront.

Use it as a cohort seed — "who does Steam put next to this game?" — then
feed the candidate appids into `coverage_check` and the cohort workflows
above. It is an observation of Steam's storefront, not a computed
similarity model, so it answers "what does Steam associate?" and not "what
is objectively similar?".

Interpretation guardrails (honesty rules, not suggestions):

- `position` is the order Steam displayed the candidate. It is **not** a
  similarity score and not a relevance ranking. Never sort by it as if it
  measured closeness, and never say "the most similar game is X" because X
  sat at position 1.
- An empty candidate list is ambiguous until you read `availability`.
  `observed_empty` means the store page was collected and the carousel was
  empty; `not_observed` means that game and country pair has not been
  collected yet. Report the second as missing collection — presenting it as
  "this game has no similar games" states a collection gap as a fact about
  the market.
- `stale: true` means the observation is older than `staleAfterDays`. The
  candidates are still returned in full; date the claim ("as observed in
  <month>") instead of dropping it or presenting it as current.
- Candidates with `resolved: false` are part of the observed set but have
  no catalog details (delisted, or not a game-type app). Keep them in the
  count and label them unresolved; do not silently drop them.

## Review topics by review language

`gmc games language-topics --source steam <externalId> --json` (MCP:
`game_language_topics`) breaks one game's review topics down by the
language each review was written in — one row per topic cluster x
language. `--min-reviews <10-200>` moves the evidence floor (server
default 30); `--include-insufficient` also returns the rows below it,
capped by the server. Those two flags are the whole parameter surface,
matching the API exactly: there is no language filter, topic filter, or row
limit, so narrow by reading the rows rather than by inventing a flag.

Use it for "which topics land differently depending on the language players
review in?" — a localization and community-priority question, not a
market-sizing one.

Field paths differ by surface: the CLI and REST wrap the payload, so read
`data.evidenceState` / `data.snapshot` / `data.coverage`. The MCP tool
returns the same fields at the top level, so read `evidenceState` /
`snapshot` / `coverage`. The guardrails below name the CLI path; drop the
`data.` prefix over MCP.

Interpretation guardrails (honesty rules, not suggestions):

- **Read `data.evidenceState` first.** `ready` = at least one topic x
  language row cleared the floor. `insufficient_evidence` = rows exist but
  none cleared it — thin evidence, not absent sentiment. `not_analyzed` =
  no rows exist — no data, not zero mentions. Neither of the last two is
  ever a zero, and neither may be reported as "no complaints in that
  language".
- **The population is the analyzed subset**, about 2,500 titles today,
  selected for review analysis rather than sampled from the catalog. Say so
  every time, and never extrapolate a share of Steam from it.
- **Review language is not geography.** It is the language the text was
  written in — never a country, a region, a market, or a culture. "Reviews
  written in German" is a claim you can make; "German players" is not.
- **Observed and estimated are separate objects.** `counts`/`rates` are
  observed; `estimates` are sample-expanded and carry
  `samplingWeightMethod`. Never combine them in one figure, and always say
  which one a number came from.
- **Name the denominator.** `counts.sourceReviews`, `sampledReviews`,
  `analyzedReviews`, and `distinctReviews` are four different bases;
  `min_reviews` is applied to `distinctReviews`.
- **Date the claim.** `data.snapshot` carries `periodStart`/`periodEnd`,
  `analysisVersion`, and `generatedAt`. The aggregate is refreshed by the
  reviews pipeline, so report it as a snapshot rather than as current.
- **`data.coverage` survives the plan lock.** When
  `reviews.topicLanguages.full` is locked you receive at most 5 rows with
  `estimates` reduced to `samplingWeightMethod`, but `coverage` still
  states how much evidence exists — present the rows as a preview and name
  the lock key.

## Which review count you are looking at

Steam's `appreviews` endpoint returns two different totals depending on
`purchase_type`, and the gap is not a rounding difference. Measured
2026-07-28: appid 570 came back with 14,375 under the default and 2,746,987
with `purchase_type=all`.

- `steam` is the endpoint DEFAULT and counts only reviewers who activated the
  game on Steam. **Every plain `reviews` field in every tool and CLI payload
  is this family**, including list rows, the `reviews_desc` sort, the
  `reviews_min`/`reviews_max` filters, `market_aggregate`'s `*_reviews`
  metrics, and the entity portfolio aggregates.
- `all` counts every reviewer and is a strict superset. It is GMC's headline
  current total and is served by `game_profile` as `detail.reviewCounts`.

Rules:
- **Name the family and the observation date** with any count you report.
  "2.7M reviews across all purchase types, observed 2026-08-11" is a claim;
  "2.7M reviews" is not.
- **`allAvailable: false` means not collected.** The wider count does not
  exist for that title yet. It is never zero, and the steam number beside it
  must not be presented as if it were the wide one.
- **Compare the families only through `steamAtAllObservation`.** The
  top-level `steam` observation can be newer than `all`, so a share taken
  across the two would mix dates. `steamShare` is already computed from the
  same-row pair.
- **Derive a positive rate inside one family.** `snapshot.rating` is the
  steam-derived percentage; pairing it with an all-family total is a
  mixed-family figure.
- **Never splice the families into one series.** The all family only starts
  at its capture epoch, so a joined line shows a jump that never happened.
  `game_review_history` and `game_profile.series` both carry
  `family: "steam"` for their whole length, which means their last point is
  normally SMALLER than the all-family headline. They are not
  interchangeable, and a difference between them is not a decline.
- **Neither family is sales.** A review count is not units, owners, copies,
  or revenue.

## Review-count history and the events around it

`gmc games review-history --source steam <externalId> --json` (MCP:
`game_review_history`) returns one game's full daily total-review series
plus the collected market context beside it: `events` (release,
early-access, demo lifecycle points and clustered official announcements)
and `discountWindows` (observed major-discount states).

There are no flags. The endpoint takes no query parameters, so the whole
series comes back every time — window it yourself when the question has a
range, and say which window you chose. Do not look for a `--range` or
`--from`/`--to`; narrowing belongs in your reading, not in the request. The
CLI rejects those flags with a usage error rather than ignoring them, so
that failure is not transient — drop the flag and window the result.

Use it for "how did this title's reviews accumulate, and what was going on
around the jumps?" — a timeline question. It answers what was OBSERVED near
a movement, never what caused it.

Field paths differ by surface: the CLI and REST wrap the payload, so read
`data.series` / `data.events` / `data.discountWindows`. The MCP tool returns
the same fields at the top level. The guardrails below name the CLI path;
drop the `data.` prefix over MCP.

Interpretation guardrails (honesty rules, not suggestions):

- **Scale by date, never by array index.** Collection has real gaps, so two
  adjacent entries are not two adjacent days. A chart or a rate computed on
  index positions is wrong.
- **The series is cleaned, and it can lag.** It is published-run-only and
  contamination-filtered: an observation more than 2% below the highest
  earlier one for the same game is withheld as invalid. Differences taken
  from it are safe to report, but its last point can be OLDER than the
  game's headline review count until that day's run is published. Date the
  claim. An empty series means no published daily observation has covered
  the title yet — not a review count of zero.
- **Empty event arrays are collection states.** An empty `data.events` or
  `data.discountWindows` means nothing was COLLECTED for that source. Never
  report it as "no announcements", "no updates", or "never discounted".
- **The announcement list is capped.** Official Steam feeds only, most
  recent 1000 items before clustering, one cluster per UTC day (`count` is
  the cluster size). For a long-lived game the oldest announcements are
  absent, so this is not its complete announcement history.
- **A discount window is a threshold observation, not a sale.** It is an
  observed state at the >=20% collection threshold. `endDate` is the first
  observation back below the threshold and is NOT part of the window, and
  because observations have gaps you cannot infer the actual last discounted
  day from it. `endDate: null` means no end has been observed yet;
  `discountPercent` is the opening observation, not the deepest or final
  depth.
- **Temporal comparison only.** "Reviews rose in the week after the update"
  is a claim you can make; "the update caused the rise" is not.

## Per-family collection status

`game_collection_status` (MCP-only, no CLI command) returns per-signal-family
collection status for one appid: `families[]` always carries all six —
`metadata`, `reviews`, `research`, `followers`, `social`, `ccu` — each with a
`state` of `not_collected`, `enrolled`, `current`, `stale`, `unsupported`, or
`unknown`. Use it for "has GMC actually collected X for this game yet?"
questions before treating a thin or empty result from another tool as a real
finding about the title.

Interpretation guardrails (honesty rules, not suggestions):

- **`unknown` is not `not_collected`.** They differ in KIND, not degree.
  `not_collected` is a positive finding — nothing has been collected for that
  family. `unknown` means the status itself could not be determined (the read
  model was unreachable, or a preceding catalogue read failed) and is
  evidence of neither collection nor non-collection. Never restate an
  `unknown` family as uncollected.
- **`available: false` and the `collection_status_unavailable` warning are
  coupled.** When the whole status could not be determined, every family
  reports `unknown` and the bare token `collection_status_unavailable`
  appears in `warnings` if and only if `available` is `false` — branch on
  either alone.
- **`requestable` is narrow.** It says only whether the product's
  detailed-analysis request routes demand to that family TODAY — only
  `research` is `true`. It is never a statement about any other family's own
  collection schedule, and requesting analysis never starts collecting a
  family whose `requestable` is `false`.
- **Read-only.** Calling this tool never enqueues, enrolls, or prioritizes
  collection work, no matter how many times it is called — it is a status
  read, not a collection request.
- An unknown appid returns `NOT_FOUND`, with the fixed weight-1 credit
  already charged — resolve the appid with `resolve`/`list_games` first
  rather than probing.

## AI disclosure state

Every title carries a tri-state AI-disclosure read from its Steam store page:
`disclosed`, `absent`, or `unconfirmed`. Filter a cohort with
`--ai-disclosure <state>` (CLI) or `filter.ai_disclosure` (MCP) on games
search/count and `market_aggregate`; group with
`--group-by ai_disclosure` (it cross-tabs with `release_month`); read one
title's state from `detail.aiDisclosure` (`state`, `observedAt`,
`rawCategoryValue`). The text and history behind that flag are a separate
surface — see the subsection below.

Interpretation guardrails (honesty rules, not suggestions):

- **`absent` is an observation, not a verdict.** It means a read of the store
  page found no disclosure block. Steam requires disclosure only in defined
  cases and disclosure text can be edited away, so `absent` must never be
  reported as "this title uses no generative AI".
- **`unconfirmed` is not a finding.** It means not yet successfully observed,
  and it includes titles nobody has checked. Report it as its own bucket with
  its count; never fold it into `absent` and never drop it from a share, or
  the remaining two states become a claim about the whole cohort.
- **The date matters.** `observedAt` is when the read happened, not the
  release date, and the state is the latest observed one. A title can disclose
  today and not have when it shipped.
- **`aiDisclosure: null` on a detail read** means only that the read model
  could not be reached; the response also carries `ai_disclosure_unavailable`.
  Never report it as "not disclosed".
- `cohort_review_categories` and `compare_as_of` refuse this filter outright
  (the underlying rollups have no disclosure predicate). Size disclosure
  cohorts with `market_aggregate` instead.

### Disclosure text and change history

`gmc games ai-disclosure <appid> --json` (MCP: `game_profile` with
`ai_disclosure` in `sections`) returns what sits behind that flag: the
developer's disclosure text, the store page it was read from, the first and
latest observation dates, and the observed change history. The CLI command
takes the appid and nothing else — no `--source`, no query parameters. Over
MCP the section is opt-in, so a call that does not name it performs no extra
read, and it stays in the raw-read weight class: asking for it beside `detail`
leaves the per-appid cost at 1.

Interpretation guardrails (honesty rules, not suggestions):

- **The text is the developer's, never ours.** `disclosureText` is their own
  wording as read from the store page, normalized only for whitespace. Game
  Market Copilot never classifies it, scores it, or infers from it how much AI
  was used. Quote it and attribute it to the developer; never paraphrase it
  into a verdict of your own. It is `null` whenever `state` is not
  `disclosed`.
- **Each event is an observed change, so date it as a window.** The store page
  is read periodically, not continuously, so a change happened SOMEWHERE
  between `previousObservedAt` and `observedAt`. Say "between those two
  reads"; never say it happened on either date.
- **An empty `events` array is not "nothing ever changed".** A title's FIRST
  observation is a baseline and never appears as an event, so an empty array
  means only that no change has been observed between two reads. `events` can
  also be non-empty while `state` is `unconfirmed` — history outlives a later
  read that failed.
- **`unconfirmed` still includes never checked.** This surface has no
  existence check, so an appid never observed comes back `unconfirmed` with no
  events rather than an error. That is a statement about what has been
  observed, never about the title.
- **A `null` payload is unavailability.** It carries
  `ai_disclosure_detail_unavailable` and means the read could not be reached.
  Never report it as "not disclosed", and never as not collected.

## Hard rules

- **Missing data is not absent sentiment.** Report `cohort.usableGames`,
  `cohort.skippedGames`, and `cohort.skippedReasons`. "No review topics
  collected" must never be presented as "players have no complaints".
- **Locked is locked.** When `meta.entitlements.locked` or `preview: true`
  appears, present what you got as a preview, name the lock key (e.g.
  `success_report.full`), and never imply you read the full content.
- **Bounded evidence, not market truth.** Carry the CLI's own caveats:
  evidence packs are sampled/returned-page evidence. Always state
  denominators ("87 of 107 analyzed titles") and preserve `warnings`.
- **Pass the validity checklist before handing off numbers.** Every
  reported share carries its denominator, N, observation window, and tag
  counting basis; small-N groups are labeled directional; group
  comparisons are stratified for obvious confounds (publisher axis, price,
  release year) or the unchecked confound is named; scanned-extreme
  findings disclose the scan. Details in the validity reference.
- **Claim safety.** No causal verbs for observational associations; label
  estimates not derived from gmc data as external with a source;
  `not_collected` means not collected, never zero or absent. Details in
  the validity reference.
- **Separate API facts from your synthesis.** Quote theme labels and player
  counts as data; label your clustering and conclusions as your analysis.
- **Pace your quota.** Read `meta.entitlements.quota` (`used`/`limit`)
  before fanning out and keep headroom; on HTTP 429 respect `Retry-After`.
  Details in the quota reference.
- Preserve `meta.requestId` values for anything you may need to report.

## Product documentation (gmc-docs)

Public product documentation lives at `https://docs.gamemarketcopilot.com`
(read-only, no auth). It covers product features, setup, plans/credits,
API/CLI/MCP usage, troubleshooting, and methodology definitions (what a
field like `coverage` or `primary_market_tag` means); it carries no market
data.

Consult it BEFORE answering when you need current product behavior, setup
steps, plan/credit limits, or a definition you are not confident is still
accurate:

- Docs MCP (when the client supports a second MCP connection): connect to
  `https://docs.gamemarketcopilot.com/mcp` (no auth) and call `search_docs`,
  `get_page`, `list_pages`, or `get_navigation`.
- Otherwise, plain HTTP (no second MCP connection is required): fetch
  `https://docs.gamemarketcopilot.com/llms.txt` for the page index, or
  append `.md` to any docs page URL to fetch it as Markdown (e.g.
  `https://docs.gamemarketcopilot.com/plans.md`).

Cite the canonical docs URL (the page without `.md`) whenever an answer
draws on it.

Keep the distinction crisp: `gmc-docs` is product documentation; the GMC
MCP/CLI is market data. Product docs are never market evidence, and they
never override this skill; it remains the source of truth for statistical
validity, claim safety, and chart guidance (hard rules and references
above).

## Chart cards

When the user wants a shareable or publish-ready visual of gmc results,
follow the charts reference. Its rules are part of GMC attribution: a chart
under the GMC label must carry the fixed source label, the brand lockup,
and a denominator + observation window caption, and its title must not
make causal claims. Never emit a GMC-attributed chart that skips these.

## References

- `references/recipes.md` — step-by-step playbooks (cohort complaints,
  full-cohort map-reduce, single-title deep dive, market sizing).
- `references/pitfalls.md` — known failure modes and the correct pivots.
- `references/validity.md` — statistical-validity checklist and
  claim-safety rules for any published number.
- `references/quota.md` — quota model and cost estimation.
- `references/charts.md` — branded chart cards: attribution rules, chart
  type mapping from gmc output shapes, self-contained HTML template.

(In the AGENTS.md edition of this skill the references are inlined below.)

## When recipes fail

If a documented recipe fails or you discover a better workaround, record a
learning entry so the skill can be improved:

```markdown
- Source: field usage
- Task: <the analysis question>
- What happened: <observed behavior, requestIds>
- Gap or win: <missing knowledge / what worked>
- Proposed rule: <one-sentence candidate rule>
```

Suggest the user submits it through the GMC feedback channel (template in
the gmc user guide).
