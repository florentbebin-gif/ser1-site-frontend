#!/usr/bin/env node
// Usage: npm run check:asset-budget

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const UI_ASSETS_DIR = path.join(ROOT, 'public', 'ui');
const DEFAULT_LIMIT_BYTES = 300 * 1024;
const EXTENSIONS = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp']);

const ALLOWLIST = new Map([
  // Format : ['public/ui/exemple/fichier.png', { limitBytes: 450 * 1024, reason: '...' }]
]);

function toRepoPath(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function collectAssets(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectAssets(fullPath);
    if (!entry.isFile()) return [];
    return EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

const failures = [];

for (const file of collectAssets(UI_ASSETS_DIR)) {
  const repoPath = toRepoPath(file);
  const stat = fs.statSync(file);
  const exception = ALLOWLIST.get(repoPath);
  const limitBytes = exception?.limitBytes ?? DEFAULT_LIMIT_BYTES;

  if (stat.size > limitBytes) {
    failures.push({
      repoPath,
      size: stat.size,
      limitBytes,
      reason: exception?.reason,
    });
  }
}

if (failures.length > 0) {
  console.error('check:asset-budget ❌');
  for (const failure of failures) {
    const sizeKb = Math.round(failure.size / 1024);
    const limitKb = Math.round(failure.limitBytes / 1024);
    const reason = failure.reason ? ` (${failure.reason})` : '';
    console.error(`- ${failure.repoPath}: ${sizeKb} Ko > ${limitKb} Ko${reason}`);
  }
  process.exit(1);
}

console.log('check:asset-budget ✅');
