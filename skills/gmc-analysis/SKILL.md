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
  version: 0.3.0
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
  `game_profile`; name resolution -> `resolve`; showcases ->
  `showcase_fit`.
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
- **Separate API facts from your synthesis.** Quote theme labels and player
  counts as data; label your clustering and conclusions as your analysis.
- **Pace your quota.** Read `meta.entitlements.quota` (`used`/`limit`)
  before fanning out and keep headroom; on HTTP 429 respect `Retry-After`.
  Details in the quota reference.
- Preserve `meta.requestId` values for anything you may need to report.

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
