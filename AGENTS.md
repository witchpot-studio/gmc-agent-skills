# gmc-agent-skills

Public distribution repo for Game Market Copilot agent skills.

- `skills/` is a synced mirror of `GMC/packages/gmc-cli/skill/` (canonical).
  Never edit skill content here — edit the canonical copy in the GMC repo,
  then run `node scripts/sync-from-cli.mjs` from this repo root.
- `node scripts/sync-from-cli.mjs --check` must pass before pushing; the GMC
  CLI release check also runs it when this repo is checked out as a sibling.
- This repo is public. Only distribution content belongs here: skill docs,
  plugin/marketplace manifests, the remote MCP client config, and the sync
  script. No product code, no collection internals, no secrets, no tokens.
- The repo doubles as a plugin for BOTH Claude Code and Codex:
  `.claude-plugin/{plugin,marketplace}.json` (Claude Code),
  `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json` (Codex).
  Both point at the same `skills/` and `.mcp.json` — keep name/version in
  the manifests aligned with the skill's frontmatter version when syncing.
- Codex installs resolve from the GitHub default branch (the native
  marketplace manifest uses the repo's git URL). To QA changes before they
  land on main, push a branch and use
  `codex plugin marketplace add witchpot-studio/gmc-agent-skills --ref <branch>`.
- Keep everything in English.
