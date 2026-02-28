#!/usr/bin/env node
/**
 * check-no-hardcoded-fiscal-values.mjs
 *
 * Garde-fou CI : interdit les valeurs fiscales révisables en dur dans
 * les zones critiques (moteur + features). Ces valeurs ne doivent vivre
 * que dans src/constants/settingsDefaults.ts (ou dans les tests).
 *
 * Usage : node scripts/check-no-hardcoded-fiscal-values.mjs
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Valeurs fiscales interdites (sensibles / révisables) ────────────────────
// Mot-clé + pattern regex pour limiter les faux-positifs.
const FORBIDDEN_VALUES = [
  {
    label: 'taux PS patrimoine',
    pattern: /\b17\.2\b/,
  },
  {
    label: 'abattement enfant DMTG (ligne directe)',
    pattern: /\b100000\b/,
  },
  {
    label: 'abattement frère/sœur DMTG',
    pattern: /\b15932\b/,
  },
];

// ─── Répertoires à scanner (relatifs à ROOT) ──────────────────────────────────
const SCAN_DIRS = [
  'src/engine',
  'src/features',
];

// ─── Fichiers/répertoires autorisés (exclus du contrôle) ─────────────────────
// 1. Source unique des valeurs fiscales par défaut
const ALLOWED_EXACT = [
  'src/constants/settingsDefaults.ts',
];

// 2. Répertoires de tests (toujours exclus)
const ALLOWED_DIR_PATTERNS = [
  /__tests__[/\\]/,
];

// 3. Extensions de fichiers tests
const ALLOWED_FILE_SUFFIXES = [
  '.test.ts',
  '.test.tsx',
  '.test.js',
  '.test.jsx',
  '.spec.ts',
  '.spec.tsx',
  '.spec.js',
  '.spec.jsx',
];

// ─── Extensions de fichiers à scanner ────────────────────────────────────────
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

// ─────────────────────────────────────────────────────────────────────────────

function getExt(filename) {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot) : '';
}

function isAllowedPath(absPath) {
  const rel = relative(ROOT, absPath).replace(/\\/g, '/');

  // Exact allowlist
  if (ALLOWED_EXACT.some((p) => rel === p)) return true;

  // Directory patterns
  const relWithSep = rel + '/';
  if (ALLOWED_DIR_PATTERNS.some((pat) => pat.test(relWithSep) || pat.test(rel))) return true;

  // File suffix patterns
  const base = absPath.split(/[/\\]/).pop() ?? '';
  if (ALLOWED_FILE_SUFFIXES.some((suf) => base.endsWith(suf))) return true;

  return false;
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
    } else if (SCAN_EXTS.has(getExt(entry))) {
      results.push(full);
    }
  }
  return results;
}

// ─── Scan ─────────────────────────────────────────────────────────────────────

const violations = [];

for (const dir of SCAN_DIRS) {
  const absDir = join(ROOT, dir);
  const files = walkDir(absDir);

  for (const file of files) {
    if (isAllowedPath(file)) continue;

    let content;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');

    for (const { label, pattern } of FORBIDDEN_VALUES) {
      lines.forEach((line, idx) => {
        // Ignorer les lignes de commentaires
        const trimmed = line.trimStart();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }

        if (pattern.test(line)) {
          const rel = relative(ROOT, file).replace(/\\/g, '/');
          violations.push({
            file: rel,
            line: idx + 1,
            label,
            lineContent: line.trim().slice(0, 120),
          });
        }
      });
    }
  }
}

// ─── Rapport ──────────────────────────────────────────────────────────────────

if (violations.length > 0) {
  console.error('\n❌  Valeurs fiscales en dur détectées dans des fichiers interdits :\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.label}]`);
    console.error(`    → ${v.lineContent}`);
  }
  console.error(`
  ✅  Ces valeurs doivent vivre uniquement dans :
      src/constants/settingsDefaults.ts
  ✅  Les fichiers __tests__ et *.test.* sont exclus de cette règle.
  ✅  Ref: ROADMAP.md PR-P1-06-09 — garde-fous "source unique"\n`);
  process.exit(1);
} else {
  const scanned = SCAN_DIRS.join(', ');
  console.log(`✅  Aucune valeur fiscale en dur trouvée dans : ${scanned}`);
}
