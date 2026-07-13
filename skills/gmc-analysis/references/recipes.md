# Recipes

Placeholders use `<...>`. Always add `--json`. Commands and parameters are
authoritative in `gmc schema --json`; these recipes encode strategy, not
syntax.

## R1. Cohort complaints / praises ("what do players dislike about <cohort>?")

```bash
# 1. Denominators (2 requests)
gmc games count --source steam <filters> --json
gmc games count --source steam <filters> --coverage full,partial --json

# 2. Bounded cross-game attempt (1 + N requests)
gmc reviews patterns --source steam <filters> --coverage full,partial \
  --limit 15 --max-topics-per-game 8 --preset summary --json
```

Read `data.patterns[].appearsInGames`. If no pattern appears in 2+ games
(common — see pitfalls P1), pivot to per-game themes:

```bash
# 3. Per-game named themes (N requests; theme labels are written text)
gmc games analysis --source steam <appid> --sections reviews --json
# extract sections.reviews.negativeThemes[]: {label, frequency, playerCount}
```

Cluster the theme labels yourself (semantic grouping is your job), then
report: cluster -> games count / usable games, with 2-3 quoted example
labels per cluster and the skipped/missing counts.

## R2. Full-cohort map-reduce (cohort larger than one page)

Cost: ~(pages + N) requests. Check quota headroom first (see quota.md).

1. **Collect the cohort**: page `gmc games search <filters> --coverage
   full,partial --sort reviews_desc --limit 100 --offset <0,100,...>
   --fields appid,title,reviews --json` until `pagination.nextOffset` is
   null. Run `gmc games count` first when you need the denominator; add
   `--include-total` to search only when the exact total must travel with the
   row page.
2. **Fan out** `gmc games analysis --source steam <appid> --sections
   reviews --json` per game with bounded concurrency (<= 8 parallel
   processes). Write each response to a temp file; tolerate individual
   failures and count them.
3. **Project before reading**: extract only what you need (e.g.
   `negativeThemes` label/frequency/playerCount) into one compact JSON/NDJSON
   file. A 100+ game cohort fits in a few tens of KB after projection.
4. **Cluster semantically** over the projected labels. Crude keyword
   bucketing is acceptable as a first pass, but review the "other" bucket
   and misclassifications yourself before reporting.
5. **Report with denominators**: cohort size, games with analysis, games
   skipped (by reason), cluster -> game counts, examples, and the caveat
   that this is researched-cohort evidence, not full-market measurement.

When the cohort exceeds ~100 games or projected evidence would overflow your
context, chunk the appid list across subagents (e.g. 20 games each), have
each return its projected themes, then merge and cluster in the lead agent.

## R3. Single-title deep dive ("why did <game> work?")

```bash
gmc games resolve --source steam --query <title> --json   # if appid unknown
gmc games detail --source steam <appid> --json
gmc games analysis --source steam <appid> --sections reviews,marketing,creators,media --json
gmc games success-report --source steam <appid> --json    # long-form narrative
gmc campaigns signals --source steam <appid> --json       # cross-channel timeline
```

Use `--fields` on detail to keep output small. Respect preview/locked rules
(pitfalls P3) on every response.

## R4. Market sizing and distribution

```bash
gmc games count --source steam <filters> --json
gmc games aggregate --source steam --metric count,median_reviews \
  --group-by release_year <filters> --json
gmc games aggregate --source steam --metric count --group-by coverage <filters> --json
```

`data.basis = server_aggregate` means market-wide for the filter set (within
GMC source coverage) — unlike evidence packs, these are not page-bounded.

**Price/distribution questions belong here, not in `cohort pricing`.** Run
the aggregate with explicit buckets first (e.g.
`--bucket price:0,5,10,15,20,25,30,40,60`); `gmc cohort pricing` is
returned-page (top ~20) texture, useful only as a supplement and must be
labeled as page-bounded evidence.

Per-bucket "hit rate" pattern (one request per condition): pair the same
bucket spec with shared filters — `--reviews-min 500 --metric count` gives
reach per price band; `--reviews-min 10 --rating-min 80 --metric count`
gives the well-rated share. Divide by the unconditional bucket counts.
Never read unconditional rating aggregates in low-traction buckets
(pitfall P5).

## R5. Repeatable cohort via a saved Game List

When a cohort filter will be reused across a session or a recurring
digest, persist it once instead of re-sending the inline filter on every
call.

```bash
# 1. Create the filter-kind list once
gmc lists create --name "<label>" --kind filter \
  --filter '{"tags":["<tag>"],"reviewsMin":<n>}' --json   # -> data.id

# 2. Reference it on every follow-up call instead of the inline filter
gmc reviews patterns --source steam --list <id> --json
gmc cohort brief --source steam --list <id> --json
```

Over MCP, `create_game_list` once, then pass its `id` as `game_list_id` to
`list_games` / `market_aggregate` / `cohort_review_categories` /
`cohort_evidence` on every follow-up call. Check `game_list.definition_hash`
on each response — a changed hash means the stored DEFINITION was edited;
re-state the cohort definition before comparing numbers. A stable hash does
not freeze the population: filter lists re-evaluate live, so denominators
can still move between calls. Composite (union) lists only work with `list_games`/
`cohort_evidence` (this recipe's map-reduce sibling, R2); manual lists are
not a `game_list_id` input over MCP (the CLI `--list <id>` flag does accept
them) — read their membership with `gmc lists games <id>` / `get_game_list`.

## Output contract for every analysis

Always include in your final answer: the cohort definition and size, how many
games carried the evidence (usable vs skipped, with reasons), which plan/
entitlement context applied, notable `warnings`, and a clear line between
data and your synthesis.
