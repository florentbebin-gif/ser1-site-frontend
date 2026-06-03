#!/usr/bin/env node
/**
 * check-modal-canon.mjs
 *
 * Garde-fou CI : interdit de redéfinir une largeur de modale en dur dans une
 * feature. Les largeurs de modale passent uniquement par les classes canoniques
 * (`sim-modal--sm/md/lg/xl`) ou le `size` de SettingsModalShell.
 *
 * Règle : aucune feuille de style sous src/features ou src/pages ne doit déclarer
 * `max-width` / `width: <px|min()>` sur un sélecteur de modale RACINE
 * (`.xxx-modal { … }` ou `.xxx-modal-shell { … }`). Les sous-éléments
 * (`.xxx-modal__body`, etc.) restent libres. Le fichier canonique du shell
 * Settings est la seule source autorisée de largeurs de shell.
 *
 * Usage : node scripts/check-modal-canon.mjs [--root <chemin>]
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync } from 'fs';
import { extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));

const SCAN_DIRS = ['src/features', 'src/pages'];

// Source canonique des largeurs de shell Settings (sm/md/lg/xl + base).
const ALLOWED_FILES = new Set(['src/pages/settings/styles/modals.css'].map((p) => p));

// Sélecteur de modale racine : se termine par `-modal` ou `-modal-shell`
// (pas de sous-élément `__`, pas de descendant, pas de modificateur `--`).
const ROOT_MODAL_SELECTOR = /\.[\w-]*-modal(-shell)?\s*$/;
// Largeur « bucket » fixe : max-width en px, ou width: min(<px>…). On ignore
// width:100%, width:auto, max-width:none et les largeurs viewport (calc(100vw…)).
const WIDTH_DECL = /(max-width\s*:\s*\d+\s*px)|(width\s*:\s*min\(\s*\d+\s*px)/;

function normalizeRel(path) {
  return path.replace(/\\/g, '/');
}

function walkCss(dir, results = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      walkCss(full, results);
    } else if (entry.isFile() && extname(entry.name) === '.css') {
      results.push(full);
    }
  }
  return results;
}

function collectViolations(content, relPath) {
  const violations = [];
  // Découpe naïve en blocs `sélecteur { déclarations }`.
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = ruleRegex.exec(content)) !== null) {
    const selector = match[1].trim().split(',').pop()?.trim() ?? '';
    const body = match[2];
    if (!ROOT_MODAL_SELECTOR.test(selector)) continue;
    if (!WIDTH_DECL.test(body)) continue;
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    violations.push({ file: relPath, line, selector });
  }
  return violations;
}

export function findModalCanonViolations({ root = ROOT, scanDirs = SCAN_DIRS } = {}) {
  const resolvedRoot = resolve(root);
  const violations = [];
  for (const dir of scanDirs) {
    for (const file of walkCss(join(resolvedRoot, dir))) {
      const rel = normalizeRel(relative(resolvedRoot, file));
      if (ALLOWED_FILES.has(rel)) continue;
      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      violations.push(...collectViolations(content, rel));
    }
  }
  return violations;
}

function parseArgs(argv) {
  let root = ROOT;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value) throw new Error('Argument --root sans chemin.');
      root = resolve(value);
      i += 1;
      continue;
    }
    throw new Error(`Argument inconnu : ${argv[i]}`);
  }
  return { root };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[check:modal-canon] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const violations = findModalCanonViolations(args);
  if (violations.length > 0) {
    console.error('\n[check:modal-canon] largeur de modale en dur détectée :\n');
    for (const v of violations) {
      console.error(`- ${v.file}:${v.line} -> ${v.selector}`);
    }
    console.error(
      '\nUtiliser une classe canonique (sim-modal--sm/md/lg/xl) ou le size de SettingsModalShell.',
    );
    process.exitCode = 1;
    return;
  }
  console.log('[check:modal-canon] Aucune largeur de modale ad hoc.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
