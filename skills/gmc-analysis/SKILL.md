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
  version: 0.7.0
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
  `showcase_history`.
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
  `remove`, `delete`) or the MCP tools `list_game_lists` / `get_game_list` /
  `create_game_list` / `update_game_list` / `add_game_list_items` /
  `remove_game_list_item` / `delete_game_list`. All are 0-credit and scoped
  to the caller's own workspace.
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

Sharp edges:

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
