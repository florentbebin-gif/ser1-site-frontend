#!/usr/bin/env node
/**
 * check-sim-kpi-border.mjs
 *
 * Garde-fou CI : les cartes KPI / synthèse des simulateurs gardent un liseré C3 unique.
 *
 * Usage : node scripts/check-sim-kpi-border.mjs [--root <chemin>]
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));
const args = process.argv.slice(2);
const rootArgIndex = args.indexOf('--root');
const ROOT =
  rootArgIndex >= 0 && args[rootArgIndex + 1] ? resolve(args[rootArgIndex + 1]) : DEFAULT_ROOT;

const SCAN_DIRS = ['src/features', 'src/styles/sim'];
const TRACKED_SELECTOR_PATTERN =
  /(summary|kpi|hero|sidebar|side-card|sim-summary-card|associate-insights)/i;
const BORDER_LEFT_PATTERN = /border-left(?:-color)?\s*:\s*([^;]+);/g;
const ALLOWLIST = new Set([]);

function normalizeRel(path) {
  return path.replace(/\\/g, '/');
}

function walkCssFiles(dir, results = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkCssFiles(full, results);
    } else if (extname(entry) === '.css') {
      results.push(full);
    }
  }

  return results;
}

function shouldScanFile(filePath) {
  const rel = normalizeRel(relative(ROOT, filePath));
  return rel.startsWith('src/styles/sim/') || rel.includes('/styles/');
}

function collectBlocks(content) {
  const blocks = [];
  const blockPattern = /([^{}]+)\{([^{}]+)\}/g;
  let match;

  while ((match = blockPattern.exec(content)) !== null) {
    blocks.push({
      selector: match[1].trim(),
      body: match[2],
    });
  }

  return blocks;
}

function isTrackedSelector(selector) {
  return TRACKED_SELECTOR_PATTERN.test(selector);
}

function isAllowed(relPath, selector, declaration) {
  return ALLOWLIST.has(`${relPath}::${selector}::${declaration}`);
}

function collectFailures(filePath) {
  const relPath = normalizeRel(relative(ROOT, filePath));
  const content = readFileSync(filePath, 'utf8');
  const failures = [];

  for (const { selector, body } of collectBlocks(content)) {
    if (!isTrackedSelector(selector)) continue;

    for (const match of body.matchAll(BORDER_LEFT_PATTERN)) {
      const declaration = match[0].trim();
      const value = match[1].trim();
      if (!value.includes('var(--color-')) continue;
      if (value.includes('var(--color-c3)')) continue;
      if (isAllowed(relPath, selector, declaration)) continue;

      failures.push({ relPath, selector, declaration });
    }
  }

  return failures;
}

const failures = [];

for (const scanDir of SCAN_DIRS) {
  const absoluteDir = join(ROOT, scanDir);
  for (const filePath of walkCssFiles(absoluteDir)) {
    if (shouldScanFile(filePath)) {
      failures.push(...collectFailures(filePath));
    }
  }
}

if (failures.length > 0) {
  console.error('Liserés KPI /sim/* non conformes :');
  failures.forEach(({ relPath, selector, declaration }) => {
    console.error(`- ${relPath} ${selector} -> ${declaration}`);
  });
  console.error('Utiliser var(--color-c3) ou documenter une exception dans ALLOWLIST.');
  process.exit(1);
}

console.log('Liserés KPI /sim/* OK.');
