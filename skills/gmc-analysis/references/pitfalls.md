# Pitfalls and pivots

Known failure modes observed in real field tests, with the correct response.
Entries carry an observation date; behavior may improve in later releases.

## P1. `reviews patterns` may aggregate nothing across games (2026-06)

Cross-game pattern keys are derived from per-game topic labels and cluster
IDs, which rarely match between games. A run where `data.patterns` has zero
entries with `appearsInGames >= 2` is an EXPECTED outcome on many cohorts —
it does not mean the service is broken and it does not mean the games share
no complaints.

**Pivot**: per-game `gmc games analysis --sections reviews`, then cluster
the `negativeThemes`/`positiveThemes` labels yourself (recipe R1/R2).

## P2. Research coverage does not guarantee review topics (2026-06)

A game with `coverage: full` can still return no review topics;
`cohort.skippedReasons.no_matching_review_topics` is common (observed 10 of
15 on one researched cohort). Theme-level analysis
(`analysis --sections reviews`) has broader coverage than topic explorer
data.

**Pivot**: prefer themes over topics for cohort work; report skipped games
as "topics not collected", never as "no complaints found".

## P3. Preview and locked payloads

Anonymous and Free callers receive redacted previews. Markers:
`meta.entitlements.locked` (lock keys like `success_report.full`,
`reviews.topics.full`), `preview: true` fields, truncated summaries.

**Rule**: present previews as previews, name the lock, and suggest the plan
that unlocks it if the user asks. Never extrapolate locked content.

## P4. Anonymous sessions look broken but are just unauthenticated

Without `gmc login` / `GMC_API_KEY`, deep sections come back redacted and
the quota is tiny, which can read as "the API has no data".

**Rule**: run `gmc auth status --json` first; if `authMode` is `anonymous`,
say so in your answer and scope expectations to public preview data.

## P5. Zero-review games carry rating 0 in aggregates (2026-06)

Unconditional `avg_rating` / `median_rating` in low-traction segments (cheap
or free price buckets) is crushed by zero-review games aggregating as
rating 0 (observed: a free bucket with avg_rating 11.1). This misreads as
"cheap games are hated" when it actually means "most cheap games have no
reviews".

**Pivot**: pair rating metrics with `--reviews-min` (e.g. 10). For "share of
well-rated games per bucket", run `--metric count` twice over the same
bucket spec — once unconditional, once with `--reviews-min 10
--rating-min 80` — and divide.

## P6. Snapshot prices include active discounts (2026-06)

`price` is the current store price, not the launch/list price; a discounted
title lands in a lower price bucket (observed: a $34.99 list price counted
as $23.44 at -33%). Game rows carry a `discount` field.

**Rule**: when price-band conclusions matter, check `discount` on the
exemplar rows and caveat bucket assignments, especially during sale seasons.

## P7. Don't paginate by brute force

List endpoints cap at `limit=100`. For "how many" questions use
`gmc games count`; for distributions use `gmc games aggregate` — both are
single-request server aggregates. Reserve pagination loops for when you
actually need the rows (recipe R2). `gmc games search` is optimized for rows
and may omit `pagination.total`; pass `--include-total` only when a row page
also needs an exact count.

## P8. Wide aggregations can time out (2026-07)

Aggregate calls that request many metrics and/or two `group_by` dimensions
over the full catalog can exceed the server-side query timeout. Over MCP this
surfaces as an `UPSTREAM_TIMEOUT` tool error (older builds: a generic
`UPSTREAM_ERROR`); via the CLI as a failed request. A timeout is a load
limit, not a data problem — the cohort itself is fine, and retrying the same
call unchanged will usually time out again.

**Rule**: split the request instead of retrying as-is — fewer metrics per
call, one `group_by` dimension at a time, or a narrower filter (e.g. a
shorter release window) — then combine the results. Splits are safe: each
call returns population-true numbers for its slice, so recombined totals stay
consistent. Note the substitution in your analysis log so reviewers know the
numbers came from split calls.
