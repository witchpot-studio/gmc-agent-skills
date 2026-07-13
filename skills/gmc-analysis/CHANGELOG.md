# gmc-analysis skill changelog

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
