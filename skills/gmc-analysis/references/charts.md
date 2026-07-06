# Chart cards

Turn gmc CLI / MCP outputs into publish-ready, correctly attributed GMC
chart cards (self-contained HTML -> PNG). Follow this reference whenever a
chart, graph, or shareable visual is requested from GMC data. A chart that
violates the non-negotiables below must not carry GMC attribution.

## Non-negotiables (every card)

1. **Footer, left**: the fixed source label `GMC database` plus at most one
   short factual note (collection method, cutoff, exclusions). Japanese
   edition: `GMCデータベース`. Never change, translate loosely, or omit the
   label.
2. **Footer, right**: the brand lockup — icon + wordmark, one image:
   `https://gamemarketcopilot.com/assets/gmc-lockup.svg`. Never the icon
   alone, never a retyped wordmark, never someone else's logo.
3. **Caption (top-left of the card)**: denominator + observation window,
   e.g. `1,204 of 20,994 titles released 2025 / aggregated as of
   2026-07-06`. Take denominators from `gmc games count` (or the tool's own
   `cohort.usableGames`), not from page sizes. The caption is the card's
   denominator disclosure — exports must never crop it (or the footer) off.
4. **Title**: state the observed fact — a level, difference, share, or
   rank. No causal verbs (`drove`, `boosted`, `caused`, `led to`,
   `because`); the data supports co-occurrence, not causation. No hype
   metaphors. Correlation phrasing is fine.
5. **Data honesty**: `not_collected` is never charted as zero. Locked or
   `preview: true` payloads are never charted as full data. Small
   denominators (n < 30) are presented as individual cases, not a trend
   bar. `skippedGames` / `skippedReasons` go in the footnote when they
   change the reading.
6. **External estimates stay outside the label**: units multipliers,
   wishlist folklore, or any non-GMC number never appear under the
   `GMC database` label — prefer leaving them off a GMC-branded card
   entirely. If one must appear, add a second, visually separate footnote
   line: `External estimate: <source> — not GMC data`.
7. **Opaque background** (`#fafaf7` page, `#ffffff` card). Never export
   transparent PNGs. Recommended export: X 1200x675, LinkedIn 1200x627,
   or the natural 720px card width at 2x.

## Picking the chart type from gmc output shapes

| Output | Shape | Chart |
|---|---|---|
| `gmc games aggregate --group-by <dim>` / MCP `market_aggregate` | 6+ groups, rank matters | Horizontal bar, sorted desc |
| same | 2-5 groups | Vertical column |
| same, time buckets (release windows, months) | series over time | Line (single/few series) or column |
| MCP `market_aggregate` with `segment_filter` | segment vs base | Two big numbers + ratio, or grouped bar |
| `gmc reviews patterns` / MCP `cohort_evidence` / clustered `negativeThemes` | theme -> game counts | Horizontal bar; caption carries `x of N usable games` |
| MCP `coverage_check` / `gmc games count --group-by coverage` | composition, 2-4 segments | Donut with absolute counts printed, or one 100% stacked bar |
| single KPI (one count, one median, one share) | one number | Hero number card (no chart canvas) |

Rules of thumb: when unsure, use a horizontal bar. One message per card.
Never: 3D, dual axes, cropped bar baselines, pie with 5+ slices, line
charts for non-time data.

## Color

Neutrals (fixed): page `#fafaf7`, card `#ffffff`, ink `#1a1d20`, muted
`#3e454d`, faint `#818d9a`, grid `rgba(26,29,32,0.06)`.

- **Single series / ranking**: accent ladder only — Ember `#EC7336` at
  alpha 0.85 (lead), 0.55, 0.30, rest `rgba(26,29,32,0.08)`.
- **2-3 categories**: Ember `#EC7336` + Seagrass `#1AA29D` (+ Inkwell
  `#4057C7`). Never distinguish categories by alpha alone.
- **4-5 categories**: add Moss `#3E9C5F`, Mulberry `#9B4ABF`. Max 5 colors;
  gray out non-focus series with `rgba(26,29,32,0.12)`. 6+ categories:
  split the chart or bucket into "other".
- Direct labels beat legends: print values at bar ends / line ends.

## Card template (self-contained)

Fill the `{{...}}` slots, adjust the dataset + type per the table above,
open in a browser, capture the `.card` element as PNG. The template needs
network access for fonts, Chart.js CDN, and the brand lockup.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  :root {
    --bg: #fafaf7; --card: #ffffff;
    --ink: #1a1d20; --ink-muted: #3e454d; --ink-faint: #818d9a;
    --rule: #e8e5de; --accent: #ec7336;
    --sans: 'Inter', system-ui, sans-serif;
    --mono: 'JetBrains Mono', ui-monospace, monospace;
    --serif: 'Instrument Serif', Georgia, serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); font-family: var(--sans); color: var(--ink);
         display: flex; justify-content: center; padding: 40px 16px; }
  .card { width: 720px; max-width: 100%; background: var(--card);
          border: 1px solid var(--rule); display: flex; flex-direction: column; }
  .card-head { display: flex; justify-content: space-between; gap: 12px;
               padding: 18px 20px 12px; border-bottom: 1px solid var(--rule); }
  .card-num { font-family: var(--mono); font-size: 12.5px; font-weight: 500;
              color: var(--accent); max-width: 76%; }
  .card-cat { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
              text-transform: uppercase; color: var(--ink-faint); white-space: nowrap; }
  .card-title { padding: 26px 20px 8px; font-family: var(--serif);
                font-size: 34px; line-height: 1.12; font-weight: 400; }
  .chart-wrap { position: relative; margin: 18px 20px 8px;
                min-height: 470px; height: 470px; }
  .card-foot { display: flex; justify-content: space-between; align-items: center;
               gap: 16px; border-top: 1px solid var(--rule);
               padding: 14px 20px; margin-top: 12px; }
  .foot-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .foot-source { font-family: var(--mono); font-size: 13px; color: var(--ink-muted); }
  .foot-note { font-size: 11.5px; line-height: 1.45; color: var(--ink-faint); }
  .brand-lockup { flex: 0 0 auto; height: 24px; width: auto; display: block; }
</style>
</head>
<body>
<article class="card">
  <div class="card-head">
    <div class="card-num">{{DENOMINATOR AND WINDOW, e.g. 1,204 of 20,994 titles released 2025 / as of 2026-07-06}}</div>
    <div class="card-cat">{{CHART TYPE, e.g. RANKED BAR}}</div>
  </div>
  <h2 class="card-title">{{FACTUAL TITLE — observed level/difference/share, no causal verbs}}</h2>
  <div class="chart-wrap"><canvas id="chart"></canvas></div>
  <div class="card-foot">
    <div class="foot-meta">
      <div class="foot-source">GMC database</div>
      <div class="foot-note">{{ONE-LINE NOTE: method, cutoff, exclusions, skipped counts}}</div>
    </div>
    <img class="brand-lockup" src="https://gamemarketcopilot.com/assets/gmc-lockup.svg" alt="Game Market Copilot">
  </div>
</article>
<script>
  const ink = (a) => `rgba(26, 29, 32, ${a})`;
  const accent = (a) => `rgba(236, 115, 54, ${a})`;
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.color = '#3e454d';

  // Direct value labels at bar ends (skip for line charts; use point labels there).
  const valueLabels = {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const horizontal = chart.options.indexAxis === 'y';
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((el, i) => {
          const v = ds.data[i];
          if (v == null) return;
          ctx.save();
          ctx.font = "500 12px 'JetBrains Mono', monospace";
          ctx.fillStyle = '#3e454d';
          ctx.textBaseline = 'middle';
          if (horizontal) { ctx.textAlign = 'left'; ctx.fillText(v.toLocaleString(), el.x + 8, el.y); }
          else { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(v.toLocaleString(), el.x, el.y - 6); }
          ctx.restore();
        });
      });
    }
  };

  const labels = ['{{GROUP A}}', '{{GROUP B}}', '{{GROUP C}}'];   // sorted desc for rankings
  const values = [0, 0, 0];                                       // real aggregates only
  new Chart(document.getElementById('chart'), {
    type: 'bar',                       // ranked bar. Column: drop indexAxis. Line: type 'line'.
    data: { labels, datasets: [{
      data: values,
      // Ranking ladder — lead bar strongest, tail neutral:
      backgroundColor: values.map((_, i) => [accent(0.85), accent(0.55), accent(0.30)][i] ?? ink(0.08)),
      borderRadius: 2, barPercentage: 0.72
    }]},
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 64 } },   // room for end-of-bar labels
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: ink(0.06) }, border: { color: ink(0.18) } },
        y: { grid: { display: false }, border: { color: ink(0.18) } }
      },
      animation: { onComplete: () => { window.__animComplete = true; } }
    },
    plugins: [valueLabels]
  });
</script>
</body>
</html>
```

Variants:

- **Column** (2-5 groups): remove `indexAxis`, move padding to `top`,
  labels render above bars automatically via the plugin.
- **Line** (time buckets): `type: 'line'`, `borderColor: accent(0.85)`,
  `pointRadius: 3`, `fill: false` (always false when more than one dataset
  or when combined with bars), label only first/last/inflection points.
- **Donut** (coverage split, max 4 segments): `type: 'doughnut'`,
  `cutout: '62%'`, colors Ember/Seagrass/Inkwell + gray; print
  `label — count (share%)` per segment as direct labels or a compact list
  under the chart; absolute counts are mandatory, share alone is not
  enough.
- **Hero number** (single KPI): replace `.chart-wrap` with
  `<div style="padding:56px 20px 40px; text-align:center;">
  <div style="font-size:96px; font-weight:600; letter-spacing:-0.04em;
  color:var(--accent);">{{VALUE}}</div>
  <div style="font-size:15px; color:var(--ink-muted); margin-top:8px;">
  {{ONE-LINE QUALIFIER}}</div></div>` and delete the chart script. The
  caption and footer rules still apply unchanged.

Japanese edition: add `&family=Noto+Sans+JP:wght@400;500;600` to the fonts
URL, append `'Noto Sans JP'` to `--sans`, set `<html lang="ja">`, and use
`GMCデータベース` as the source label. Steam tags in JA charts:
`English Tag(日本語タグ名)` on first appearance.

## Capture

Any browser screenshot of the `.card` element works. Headless example:

```bash
npx playwright screenshot --wait-for-timeout 2500 --full-page card.html card.png
```

then crop to the card, or capture the element via a driver that waits for
`window.__animComplete === true`. Verify before publishing: bars/labels not
clipped, text legible at mobile size (12px+ effective), background opaque.

## Pre-publish checklist

- [ ] Title is factual, no causal verbs, no hype
- [ ] Caption has denominator AND observation window
- [ ] `GMC database` label + brand lockup both present, unmodified
- [ ] Every number comes from a real gmc/MCP response in this session
      (no remembered or estimated values); re-run the query if stale
- [ ] `not_collected` / locked data not charted; skipped counts disclosed
      when they change the reading
- [ ] External estimates (if any) credited separately in the footnote
- [ ] Colors follow the tier rules; max 5 colors; opaque background
