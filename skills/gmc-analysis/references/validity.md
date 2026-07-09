# Statistical validity and claim safety

Every number you publish from gmc data — in an internal doc, a chat answer,
or a chart card — must pass this checklist. These rules exist because QA on
real analysis output repeatedly caught bad denominators, small-N
generalizations, confounded comparisons, and causal overclaims before they
reached readers. Run the checklist before handing off, not after.

## Validity checklist (apply to every reported number)

1. **Denominator and N on every share.** Never report a bare percentage.
   State what the share is out of and how many that is: "34% (412 of 1,204
   titles matching the filter)". If the denominator is a subset (analyzed
   games, usable games), say so — `cohort.usableGames` vs the plain cohort
   count are different denominators (see the pitfalls reference).
2. **Counting basis named.** A tag/genre share must say whether it is
   single-assignment (`primary_market_tag`) or multi-assignment (`tag`
   grouping / `tags` filter). The two bases are not comparable — pitfall P9.
3. **Observation window stated.** Every metric is a snapshot or a windowed
   observation. State the window or snapshot date next to the number
   ("releases 2024-01..2024-12, snapshot as of the response's
   `meta.snapshot`/`generatedAt`"). Numbers without a window cannot be
   reproduced or compared later.
4. **Small-N warning.** If a group has N < 30, label the finding as
   directional/anecdotal and do not generalize from it ("only 12 titles in
   this bucket — treat as anecdote, not a segment truth"). Do not silently
   drop small groups either; show them with the warning.
5. **Effect size over bare significance.** Report the magnitude of a
   difference, not just that one exists. On large N, tiny differences look
   "real" but mean nothing for decisions; on small N, large-looking
   differences may be noise. Ask: would this gap change anyone's decision?
6. **Stratify obvious confounds before comparing groups.** Before claiming
   "group A outperforms group B", check whether the gap survives splitting
   by the usual suspects: publisher axis (`self_published`), price band,
   and release year. If you cannot stratify (quota, missing dimension),
   state the unchecked confound explicitly.
7. **Disclose multiple comparisons.** If you scanned many tags, buckets, or
   metrics and are reporting the extremes ("the top tag by rating"),
   say that the winner came from a scan of K groups. Top-of-scan findings
   are selection-biased; confirm them on an independent slice or label them
   as hypotheses.

## Claim-safety rules

- **No causal verbs without causal evidence.** gmc aggregates are
  observational. "Drives", "boosts", "causes", "leads to", "because of" are
  off-limits for correlations; write "is associated with", "co-occurs
  with", "titles with X tend to Y". This matches the chart-card rule that
  titles must not make causal claims (charts reference) — apply it to prose
  too.
- **Label external estimates.** Any figure not computed from gmc responses
  — units-per-review multipliers, wishlist conversion folklore, revenue
  guesses, industry benchmarks — must be labeled as an external estimate
  with its source, and must never be blended into gmc-derived numbers as if
  measured.
- **`not_collected` means not collected.** Missing research coverage,
  skipped games, and `not_collected` markers must never be reported as zero
  events or absent sentiment ("no complaints"). Report them as "not
  collected" with the skipped count — see the hard rules in SKILL.md and
  pitfall P2.
- **Locked/preview data stays partial.** Never extrapolate what a locked or
  preview payload "probably" contains (pitfall P3).

## Compliant output example

> Of the 1,204 titles released 2024-01-01..2024-12-31 with >= 10 reviews
> (snapshot 2026-07-08), 412 (34%) carry the roguelike-deckbuilder tag
> (multi-assignment basis: the same title also counts toward its other
> tags' shares, so per-tag shares do not sum to 100%).
> Median review count is 86 for these vs 54 for the rest; the gap holds
> within the self-published stratum (78 vs 51, N=301) but not for
> publisher-backed titles (N=23 — too few to call, directional only).
> This is an observed association; nothing here shows the tag causes
> higher review counts.

Every share above carries a denominator, an N, a window/snapshot, and a
named counting basis; comparisons are stratified or flagged; language stays
associational. That is the bar for skill-produced output.
