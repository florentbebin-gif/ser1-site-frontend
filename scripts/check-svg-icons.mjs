#!/usr/bin/env node
/**
 * check-svg-icons.mjs
 *
 * Garde-fou CI : interdit les petits SVG inline dans les features simulateurs.
 * Les icones UI doivent vivre dans src/icons/ui. Les SVG metier (donut,
 * timeline, organigramme, schema) restent autorises localement.
 *
 * Usage : node scripts/check-svg-icons.mjs [--root <chemin>]
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));

const SCAN_DIRS = ['src/features'];
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const INLINE_ICON_LINE_LIMIT = 30;

const BUSINESS_SVG_PATTERNS = [
  /donut/i,
  /chart/i,
  /graph/i,
  /orgchart/i,
  /org-chart/i,
  /timeline/i,
  /schema/i,
  /sparkline/i,
  /visual/i,
  /track/i,
  // Illustrations d'avatars du foyer (portraits dessinés, pas des icônes UI).
  /avatar/i,
];

function normalizeRel(path) {
  return path.replace(/\\/g, '/');
}

function walkDir(dir, results = []) {
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
      walkDir(full, results);
    } else if (SCAN_EXTS.has(extname(entry))) {
      results.push(full);
    }
  }

  return results;
}

function isBusinessSvg(relPath, snippet) {
  const haystack = `${relPath}\n${snippet}`;
  return BUSINESS_SVG_PATTERNS.some((pattern) => pattern.test(haystack));
}

function collectSvgBlocks(file, content, root) {
  const rel = normalizeRel(relative(root, file));
  const lines = content.split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].includes('<svg')) continue;

    let end = index;
    while (end < lines.length && !lines[end].includes('</svg>')) {
      end += 1;
    }

    if (end >= lines.length) end = index;

    const snippet = lines.slice(index, end + 1).join('\n');
    blocks.push({
      file: rel,
      line: index + 1,
      lineCount: end - index + 1,
      snippet,
    });
  }

  return blocks;
}

export function findInlineSvgIconViolations({ root = ROOT, scanDirs = SCAN_DIRS } = {}) {
  const resolvedRoot = resolve(root);
  const violations = [];

  for (const dir of scanDirs) {
    const absDir = join(resolvedRoot, dir);

    for (const file of walkDir(absDir)) {
      const rel = normalizeRel(relative(resolvedRoot, file));
      if (rel.startsWith('src/icons/')) continue;

      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      for (const block of collectSvgBlocks(file, content, resolvedRoot)) {
        if (block.lineCount >= INLINE_ICON_LINE_LIMIT) continue;
        if (isBusinessSvg(block.file, block.snippet)) continue;

        violations.push({
          file: block.file,
          line: block.line,
          lineCount: block.lineCount,
          snippet: block.snippet.split(/\r?\n/)[0]?.trim() ?? '<svg>',
        });
      }
    }
  }

  return violations;
}

function parseArgs(argv) {
  let root = ROOT;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Argument --root sans chemin.');
      }
      root = resolve(value);
      index += 1;
      continue;
    }

    throw new Error(`Argument inconnu : ${arg}`);
  }

  return { root };
}

function printViolations(violations) {
  console.error('\n[check:svg-icons] SVG inline d icone detecte dans src/features :\n');

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} (${violation.lineCount} lignes) -> ${violation.snippet}`,
    );
  }

  console.error('\nDeplacer l icone vers src/icons/ui ou justifier un SVG metier nomme.');
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[check:svg-icons] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const violations = findInlineSvgIconViolations(args);

  if (violations.length > 0) {
    printViolations(violations);
    process.exitCode = 1;
    return;
  }

  console.log('[check:svg-icons] Aucun petit SVG inline d icone dans src/features.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
