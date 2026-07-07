# GMC Agent Skills

Agent Skills for AI agents (Claude Code, OpenAI Codex, Cursor, and other
[Agent Skills](https://agentskills.io)-compatible tools) working with
[Game Market Copilot](https://gamemarketcopilot.com) — Steam market
analytics built on observed, regularly collected data.

The `gmc-analysis` skill teaches an agent the proven GMC workflow: cohort
sizing and coverage checks before fan-out, bounded cross-game analysis,
honest handling of missing/locked data, quota etiquette, and — since
v0.3.0 — publish-ready, correctly attributed chart cards (fixed source
label, brand lockup, denominator + observation window on every chart).

## Prerequisites

Connect the GMC MCP server (or the `gmc` CLI) first — the skill is the
knowledge layer on top of that connection:

- **MCP (recommended)**: follow https://gamemarketcopilot.com/connect
  (endpoint: `https://gamemarketcopilot.com/api/mcp/mcp`)
- **CLI**: `npm install -g @witchpot/gmc`

**A paid GMC plan (Starter or Pro) is required** for API, CLI, and MCP
access — Free workspaces cannot connect. See
https://gamemarketcopilot.com/plans. The skill itself installs fine
without an account; it just has nothing to talk to until the connection
exists.

## Install the skill

### Any Agent Skills-compatible agent (Claude Code, Codex, Cursor, ...)

```bash
npx skills add witchpot-studio/gmc-agent-skills
```

Run it from your project root — the installer writes into the project's
agent skill directories (e.g. `.claude/skills/`, `.agents/skills/`).

### Claude Code plugin (MCP connection + skill in one step)

```
/plugin marketplace add witchpot-studio/gmc-agent-skills
/plugin install gmc@gmc
```

The plugin bundles the remote MCP server configuration and the skill
together. On first use, authenticate with your GMC account when prompted
(or configure your API key per the connect page).

### OpenAI Codex

The plugin/`.mcp.json` above is Claude Code-specific; on Codex, install
the skill and add the MCP server separately:

```bash
npx skills add witchpot-studio/gmc-agent-skills --agent codex
codex mcp add gmc --url https://gamemarketcopilot.com/api/mcp/mcp
codex mcp login gmc     # OAuth sign-in with your GMC account
```

The skill lands in `.agents/skills/`, which Codex reads natively. If you
prefer an API key over OAuth, create one in the GMC settings and use
`codex mcp add gmc --url ... --bearer-token-env-var GMC_API_KEY` instead
of `codex mcp login`.

### Manual

Copy `skills/gmc-analysis/` into your agent's skill directory, e.g.
`.claude/skills/gmc-analysis/` (project) or `~/.claude/skills/gmc-analysis/`
(global). For AGENTS.md-based agents without skill support, CLI users can
run `gmc skill print --format agents-md >> AGENTS.md`.

## Skills

| Skill | Description |
|---|---|
| [gmc-analysis](skills/gmc-analysis/SKILL.md) | Steam market analysis with GMC: cohort analysis, market sizing, single-title deep dives, and branded chart-card generation. |

## Data usage and attribution

GMC data is observed, not estimated. If you publish numbers or charts
derived from it, follow the citation guidelines: denominator, observation
window, and source type on every figure; no causal claims the data cannot
support. The chart-card reference bundled in the skill produces compliant
charts by construction. Republishing terms: see the GMC Terms of Use
(press/analyst republishing section).

## Repository layout

This repo is a distribution mirror. The canonical skill source lives in
the GMC product repo (`packages/gmc-cli/skill/gmc-analysis/`) and ships
identically inside the `@witchpot/gmc` npm package. Do not edit `skills/`
here directly — changes are synced with `scripts/sync-from-cli.mjs` and
drift fails the release check.

## Support

Issues and feedback: https://gamemarketcopilot.com (contact@witchpot.com)
