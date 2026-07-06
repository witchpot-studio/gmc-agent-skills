# Quota etiquette

Quotas are monthly, workspace-level credit allowances enforced for bearer
credentials (API keys / CLI credentials / MCP tokens). As of 2026-07:
Starter 5,000 credits/month, Pro 25,000; the counter resets at 00:00 UTC on
the first of each month. Anonymous public preview is far smaller. Credits
are charged when a request is accepted at the gate, so requests that later
fail validation or 404 still consume — validate appids before batch
fan-outs. Treat these numbers as indicative — the response metadata is the
source of truth.

## Rules

1. **Read before you spend.** Every bearer response carries
   `meta.entitlements.quota` = `{ used, limit, remaining, exceeded,
   resetsAt }` in credits. Check it at the start of a
   session and after each fan-out. Exception: CLI-composed evidence packs
   (`cohort ...`, `reviews patterns`, `games benchmark`, ...) expose quota
   per upstream call instead — read the last entry of
   `meta.upstreamRequests[].entitlements.quota`.
2. **Estimate fan-out cost first.** A cohort sweep costs roughly
   `search pages + (1 per game per section call)`. A 114-game cohort with one
   analysis call each ~= 120 requests. Compare against remaining quota and
   keep at least ~20% headroom for drill-downs and retries.
3. **Shrink the cohort before shrinking the question.** Use
   `--coverage full,partial` and tighter filters so requests are not spent on
   titles that would be skipped anyway.
4. **On HTTP 429 (`QUOTA_EXCEEDED`)**: stop fanning out, respect the
   `Retry-After` header / `error.retryAfterSeconds` (the allowance resets at
   00:00 UTC on the first of the next month; a short `Retry-After` means the
   separate burst backstop), and tell the user how much of the analysis
   completed.
5. **Prefer server aggregates** (`count`, `aggregate`) over row pagination —
   they answer sizing questions in one request.
6. **Keep totals explicit.** Search commands prioritize fast row pages and
   exact totals are opt-in (`--include-total`). Use `games count` for
   denominators so row collection stays cheap.
