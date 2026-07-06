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
- Keep everything in English.
