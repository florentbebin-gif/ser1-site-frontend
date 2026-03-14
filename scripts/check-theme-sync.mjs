/**
 * Garde-fou CI : vérifie que les tokens C1-C10 sont synchronisés
 * entre les 3 fichiers qui les déclarent.
 *
 * Source de vérité : src/settings/theme.ts → DEFAULT_COLORS
 * Copies nécessaires (anti-FOUC) :
 *   - index.html (inline JS bootstrap)
 *   - src/styles/index.css (fallback CSS)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// --- Extraction helpers ---

/** Read DEFAULT_COLORS from src/settings/theme.ts (source of truth) */
function readThemeTs() {
  const content = readFileSync(join(ROOT, 'src/settings/theme.ts'), 'utf-8');
  const blockMatch = content.match(/export const DEFAULT_COLORS[\s\S]*?\{([\s\S]*?)\};/);
  if (!blockMatch) throw new Error('Cannot find DEFAULT_COLORS in src/settings/theme.ts');
  return parseColorBlock(blockMatch[1]);
}

/** Read DEFAULT_COLORS from index.html inline JS */
function readIndexHtml() {
  const content = readFileSync(join(ROOT, 'index.html'), 'utf-8');
  const blockMatch = content.match(/var DEFAULT_COLORS\s*=\s*\{([\s\S]*?)\};/);
  if (!blockMatch) throw new Error('Cannot find DEFAULT_COLORS in index.html');
  return parseColorBlock(blockMatch[1]);
}

/** Read --color-c* from src/styles/index.css */
function readIndexCss() {
  const content = readFileSync(join(ROOT, 'src/styles/index.css'), 'utf-8');
  const colors = {};
  const re = /--color-(c\d+):\s*(#[0-9A-Fa-f]{3,8})/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    colors[m[1]] = m[2].toUpperCase();
  }
  return colors;
}

/** Parse a JS/TS object block like "c1: '#2B3E37', c2: ..." into { c1: '#2B3E37', ... } */
function parseColorBlock(block) {
  const colors = {};
  const re = /(c\d+):\s*['"]?(#[0-9A-Fa-f]{3,8})['"]?/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    colors[m[1]] = m[2].toUpperCase();
  }
  return colors;
}

// --- Main ---

const EXPECTED_TOKENS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'];

try {
  const source = readThemeTs();
  const html = readIndexHtml();
  const css = readIndexCss();

  const errors = [];

  // Check completeness
  for (const token of EXPECTED_TOKENS) {
    if (!source[token]) errors.push(`theme.ts: missing ${token}`);
    if (!html[token]) errors.push(`index.html: missing ${token}`);
    if (!css[token]) errors.push(`index.css: missing ${token}`);
  }

  // Check sync
  for (const token of EXPECTED_TOKENS) {
    if (source[token] && html[token] && source[token] !== html[token]) {
      errors.push(`index.html drift on ${token}: expected ${source[token]}, got ${html[token]}`);
    }
    if (source[token] && css[token] && source[token] !== css[token]) {
      errors.push(`index.css drift on ${token}: expected ${source[token]}, got ${css[token]}`);
    }
  }

  if (errors.length > 0) {
    console.error('check:theme-sync ❌  Tokens C1-C10 désynchronisés :');
    errors.forEach((e) => console.error(`  ${e}`));
    console.error('');
    console.error('  Source de vérité : src/settings/theme.ts → DEFAULT_COLORS');
    process.exit(1);
  } else {
    console.log('check:theme-sync ✅');
  }
} catch (err) {
  console.error('check:theme-sync ❌  Erreur :', err.message);
  process.exit(1);
}
