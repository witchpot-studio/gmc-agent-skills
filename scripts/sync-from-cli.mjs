#!/usr/bin/env node
/**
 * Sync the gmc-analysis skill from its canonical source in the GMC repo
 * (packages/gmc-cli/skill/gmc-analysis) into this distribution repo.
 *
 * This repo is a distribution mirror — never edit skills/ here directly.
 *
 * Usage:
 *   node scripts/sync-from-cli.mjs            # copy from ../GMC (or GMC_REPO_DIR)
 *   node scripts/sync-from-cli.mjs --check    # exit 1 if this repo has drifted
 */
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gmcRepo = process.env.GMC_REPO_DIR ?? path.join(repoRoot, "..", "GMC");
const source = path.join(gmcRepo, "packages", "gmc-cli", "skill", "gmc-analysis");
const target = path.join(repoRoot, "skills", "gmc-analysis");
const checkOnly = process.argv.includes("--check");

if (!existsSync(path.join(source, "SKILL.md"))) {
  console.error(`Canonical skill not found at ${source} (set GMC_REPO_DIR to your GMC checkout).`);
  process.exit(2);
}

function listFiles(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full, base) : [path.relative(base, full)];
  });
}

if (checkOnly) {
  const drift = [];
  const sourceFiles = listFiles(source).sort();
  const targetFiles = existsSync(target) ? listFiles(target).sort() : [];
  for (const file of sourceFiles) {
    const targetFile = path.join(target, file);
    if (!existsSync(targetFile) || !statSync(targetFile).isFile()) drift.push(`missing: ${file}`);
    else if (!readFileSync(path.join(source, file)).equals(readFileSync(targetFile)))
      drift.push(`differs: ${file}`);
  }
  for (const file of targetFiles) {
    if (!sourceFiles.includes(file)) drift.push(`extra: ${file}`);
  }
  if (drift.length > 0) {
    console.error("skills/gmc-analysis has drifted from the canonical GMC copy:");
    for (const line of drift) console.error(`  ${line}`);
    console.error("Run: node scripts/sync-from-cli.mjs");
    process.exit(1);
  }
  console.log("skills/gmc-analysis is in sync with the canonical GMC copy.");
} else {
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  console.log(`Synced ${source} -> ${target}`);
}
