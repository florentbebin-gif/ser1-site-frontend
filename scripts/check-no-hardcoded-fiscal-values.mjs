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
    pattern: /\b17[,.]2\b|\b0[,.]172\b/,
  },
  {
    label: 'taux PS patrimoine courant',
    pattern: /\b18[,.]6\b|\b0[,.]186\b/,
  },
  {
    label: 'taux PS retraite maximal',
    pattern: /\b9[,.]1\b|\b0[,.]091\b/,
  },
  {
    label: 'taux IR PFU',
    pattern: /\b12[,.]8\b|\b0[,.]128\b/,
  },
  {
    label: 'libellé PFU figé',
    pattern: /\bPFU\s*30\s*%/i,
  },
  {
    label: 'taux fiscal 30 %',
    pattern:
      /(?:taux|PFU|TMI|abattement|imposable|réduction|reduction|IR|PS)[^'"]{0,80}\b30\s*%|\b30\s*%[^'"]{0,80}(?:taux|PFU|TMI|abattement|imposable|réduction|reduction|IR|PS)/i,
  },
  {
    label: 'TMI 30 %',
    pattern: /\b0\.30\b|>=\s*30\b|value=["']30["']|(?:rate|taux):\s*30\b/,
  },
  {
    label: 'abattement enfant DMTG (ligne directe)',
    pattern: /\b100[\s_]?000\b/,
  },
  {
    label: 'abattement 990 I assurance-vie',
    pattern: /\b152[\s_]?500\b/,
  },
  {
    label: 'abattement 757 B assurance-vie',
    pattern: /\b30[\s_]?500\b/,
  },
  {
    label: 'abattement frère/sœur DMTG',
    pattern: /\b15932\b/,
  },
  {
    label: 'don familial 790 G',
    pattern: /\b31_?865\b/,
  },
  {
    label: 'plafond déduction PER (10% PASS 2024)',
    pattern: /\b35194\b/,
  },
  {
    label: 'PASS 2019',
    pattern: /\b40524\b/,
  },
  {
    label: 'PASS 2020-2022',
    pattern: /\b41136\b/,
  },
  {
    label: 'PASS 2023',
    pattern: /\b43992\b/,
  },
  {
    label: 'PASS 2024',
    pattern: /\b46368\b/,
  },
  {
    label: 'PASS 2025',
    pattern: /\b47100\b/,
  },
  {
    label: 'abattement retraites current plafond',
    pattern: /\b4399\b/,
  },
  {
    label: 'abattement retraites current plancher',
    pattern: /\b450\b/,
  },
  {
    label: 'abattement retraites previous plafond',
    pattern: /\b4321\b/,
  },
  {
    label: 'abattement retraites previous plancher',
    pattern: /\b442\b/,
  },
  {
    label: 'seuil mensuel petite rente',
    pattern:
      /(?:petite\s*rente|rente\s*mensuelle|monthly\s*rent|monthly\s*annuity|monthly\s*threshold|seuil)[^'"]{0,80}\b110\b|\b110\b[^'"]{0,80}(?:petite\s*rente|rente\s*mensuelle|monthly\s*rent|monthly\s*annuity|monthly\s*threshold|seuil)/i,
  },
  {
    label: 'seuil annuel petite rente',
    pattern:
      /(?:petite\s*rente|rente\s*annuelle|annual\s*rent|annual\s*annuity|annual\s*threshold|seuil)[^'"]{0,80}\b1320\b|\b1320\b[^'"]{0,80}(?:petite\s*rente|rente\s*annuelle|annual\s*rent|annual\s*annuity|annual\s*threshold|seuil)/i,
  },
];

// ─── Répertoires à scanner (relatifs à ROOT) ──────────────────────────────────
const SCAN_DIRS = [
  'src/engine',
  'src/domain/base-contrat/rules',
  'src/features',
  'src/hooks',
  'src/pages/settings',
  'src/pptx',
];

// ─── Fichiers/répertoires autorisés (exclus du contrôle) ─────────────────────
// 1. Source unique des valeurs fiscales par défaut
const ALLOWED_EXACT = [
  'src/constants/settingsDefaults.ts',
  // Valeurs OOXML de gradient PowerPoint, sans lien fiscal.
  'src/pptx/theme/themeBuilder.ts',
];

// 2. Répertoires de tests (toujours exclus)
const ALLOWED_DIR_PATTERNS = [/__tests__[/\\]/];

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

const BASE_CONTRAT_LIBRARY_PREFIX = 'src/domain/base-contrat/rules/library/';
const BASE_CONTRAT_FISCAL_KEYWORDS =
  /\b(plafond|plafonds|seuil|seuils|limite|abattement|déficit|deficit|surtaxe|cotisation|cotisations|exonération|exoneration)\b/i;
const BASE_CONTRAT_AMOUNT_LITERAL =
  /\b\d{1,3}(?:[\s_]\d{3})+(?:[,.]\d+)?\s*(?:€|EUR|euros?|M€)|\b\d+\s*M€/i;
const CONFIRMATION_MARKER = /(?:À|A) confirmer/i;
const BASE_CONTRAT_GENERIC_ALLOWLIST = [
  {
    pattern: /Droits de mutation à titre onéreux \(DMTO\) : environ 5 à 6 %/i,
    reason: 'ordre de grandeur de frais d’acquisition, hors plafond révisable en euros',
  },
];

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

function stripInlineComment(line) {
  const index = line.indexOf('//');
  return index >= 0 ? line.slice(0, index) : line;
}

function relativePath(absPath) {
  return relative(ROOT, absPath).replace(/\\/g, '/');
}

function isBaseContratLibraryPath(absPath) {
  return relativePath(absPath).startsWith(BASE_CONTRAT_LIBRARY_PREFIX);
}

function isAllowedBaseContratGenericLine(line) {
  if (CONFIRMATION_MARKER.test(line)) return true;
  return BASE_CONTRAT_GENERIC_ALLOWLIST.some(({ pattern }) => pattern.test(line));
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
    const scansBaseContratLibrary = isBaseContratLibraryPath(file);

    for (const { label, pattern } of FORBIDDEN_VALUES) {
      lines.forEach((line, idx) => {
        // Ignorer les lignes de commentaires
        const trimmed = line.trimStart();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }

        const code = stripInlineComment(line);
        if (pattern.test(code)) {
          const rel = relativePath(file);
          violations.push({
            file: rel,
            line: idx + 1,
            label,
            lineContent: line.trim().slice(0, 120),
          });
        }
      });
    }

    if (scansBaseContratLibrary) {
      lines.forEach((line, idx) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }

        const code = stripInlineComment(line);
        if (
          BASE_CONTRAT_FISCAL_KEYWORDS.test(code) &&
          BASE_CONTRAT_AMOUNT_LITERAL.test(code) &&
          !isAllowedBaseContratGenericLine(code)
        ) {
          violations.push({
            file: relativePath(file),
            line: idx + 1,
            label: 'valeur révisable Base-Contrat sans mention À confirmer',
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
  ✅  Ref: garde-fous "source unique" des paramètres fiscaux\n`);
  process.exit(1);
} else {
  const scanned = SCAN_DIRS.join(', ');
  console.log(`✅  Aucune valeur fiscale en dur trouvée dans : ${scanned}`);
}
