# gmc-analysis skill changelog

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
