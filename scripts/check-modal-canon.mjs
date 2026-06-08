#!/usr/bin/env node
/**
 * check-modal-canon.mjs
 *
 * Garde-fou CI : interdit de redéfinir une largeur ou un style de structure
 * modale canonique en dur dans une feature. Les largeurs de modale passent
 * uniquement par les classes canoniques (`sim-modal--sm/md/lg/xl`) ou le `size`
 * de SettingsModalShell. Les menus gauches de modales et les champs Base CG
 * consomment les primitives partagées.
 *
 * Règles :
 * - aucune feuille de style sous src/features, src/pages ou src/components ne doit déclarer
 * `max-width` / `width: <px|min()>` sur un sélecteur de modale RACINE
 * (`.xxx-modal { … }` ou `.xxx-modal-shell { … }`). Les sous-éléments
 * (`.xxx-modal__body`, etc.) restent libres. Le fichier canonique du shell
 * Settings est la seule source autorisée de largeurs de shell.
 * - les navs de modale locales (`__nav`, `__tabs`, `-modal-nav`) ne portent pas
 * de fond/bordure/rayon/couleur/padding local : le visuel vient de
 * `src/styles/sim/modals.css`.
 * - Base CG retraite ne cible pas `.base-cg-modal input/select/textarea` en
 * bloc large : les champs passent par `SimFieldShell`, `SimSelect` et classes
 * explicites.
 * - les primitives d'input (`.sim-field__control`, `.sim-field__select-trigger`)
 * ne portent pas de fond local : fond gris par défaut, fond blanc par héritage
 * `--sim-input-bg: var(--surface-card)` sur les surfaces colorées.
 *
 * Usage : node scripts/check-modal-canon.mjs [--root <chemin>]
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync } from 'fs';
import { extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));

const SCAN_DIRS = ['src/features', 'src/pages', 'src/components'];

// Source canonique des largeurs de shell Settings (sm/md/lg/xl + base).
const ALLOWED_FILES = new Set(['src/pages/settings/styles/modals.css'].map((p) => p));

// Sélecteur de modale racine : se termine par `-modal` ou `-modal-shell`
// (pas de sous-élément `__`, pas de descendant, pas de modificateur `--`).
const ROOT_MODAL_SELECTOR = /\.[\w-]*-modal(-shell)?\s*$/;
// Idem pour le drawer XL canonique (UX-00b) : la seule source de largeurs de
// drawer est la famille `sim-drawer` de `src/styles/sim/modals.css` (hors scan).
// Toute largeur de drawer racine dans une feature/page/composant est interdite,
// y compris via modificateur (`.audit-drawer.audit-drawer--xl`,
// `.audit-drawer--xl`, `.foo-drawer-shell`).
const ROOT_DRAWER_CLASS = /(?:^|-)drawer(?:-shell)?(?:--[\w-]+)?$/;
// Largeur « bucket » fixe : max-width en px, ou width: min(<px>…). On ignore
// width:100%, width:auto, max-width:none et les largeurs viewport (calc(100vw…)).
const WIDTH_DECL = /(max-width\s*:\s*\d+\s*px)|(width\s*:\s*min\(\s*\d+\s*px)/;
const DRAWER_WIDTH_DECL = /\b(?:width|max-width|inline-size|max-inline-size)\s*:/;
const LOCAL_MODAL_NAV_SELECTOR =
  /(?:__nav(?:[\s.{:#]|$)|__tabs(?:[\s.{:#]|$)|-modal-nav(?:__[\w-]+)?(?:[\s.{:#]|$))/;
const NAV_VISUAL_DECL =
  /\b(?:background(?:-color)?|border(?:-[\w-]+)?|box-shadow|color|padding)\s*:/;
const BASE_CG_MODAL_FIELD_SELECTOR = /\.base-cg-modal\s+(?:input|select|textarea)(?:\b|\[|[.:])/;
const SIM_FIELD_SELECTOR = /\.sim-field__(?:control|select-trigger)(?:\b|[\s[.:#])/;
const FIELD_BACKGROUND_DECL = /\bbackground(?:-color)?\s*:/;

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

function getRuleSelectors(rawSelector) {
  return rawSelector
    .split(',')
    .map((selector) => selector.trim())
    .filter(Boolean);
}

function getTargetCompound(selector) {
  return selector
    .trim()
    .split(/\s+|[>+~]/)
    .filter(Boolean)
    .at(-1);
}

function targetsRootDrawer(selector) {
  const target = getTargetCompound(selector);
  if (!target) return false;

  const classMatches = target.matchAll(/\.([A-Za-z_][\w-]*)/g);
  for (const match of classMatches) {
    const className = match[1];
    if (className.includes('__')) continue;
    if (ROOT_DRAWER_CLASS.test(className)) return true;
  }
  return false;
}

function collectViolations(content, relPath) {
  const violations = [];
  // Découpe naïve en blocs `sélecteur { déclarations }`.
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = ruleRegex.exec(content)) !== null) {
    const selectors = getRuleSelectors(match[1]);
    const body = match[2];
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    for (const selector of selectors) {
      if (ROOT_MODAL_SELECTOR.test(selector) && WIDTH_DECL.test(body)) {
        violations.push({
          file: relPath,
          line,
          selector,
          reason: 'largeur racine de modale en dur',
        });
      }
      if (targetsRootDrawer(selector) && DRAWER_WIDTH_DECL.test(body)) {
        violations.push({
          file: relPath,
          line,
          selector,
          reason: 'largeur racine de drawer en dur',
        });
      }
      if (LOCAL_MODAL_NAV_SELECTOR.test(selector) && NAV_VISUAL_DECL.test(body)) {
        violations.push({
          file: relPath,
          line,
          selector,
          reason: 'style visuel local de nav modale',
        });
      }
      if (BASE_CG_MODAL_FIELD_SELECTOR.test(selector)) {
        violations.push({
          file: relPath,
          line,
          selector,
          reason: 'sélecteur large de champs Base CG',
        });
      }
      if (SIM_FIELD_SELECTOR.test(selector) && FIELD_BACKGROUND_DECL.test(body)) {
        violations.push({
          file: relPath,
          line,
          selector,
          reason: 'fond local de primitive input',
        });
      }
    }
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
    console.error('\n[check:modal-canon] écart de canon modale détecté :\n');
    for (const v of violations) {
      console.error(`- ${v.file}:${v.line} -> ${v.selector} (${v.reason})`);
    }
    console.error(
      '\nUtiliser les classes modales partagées (largeurs, nav latérale, champs Sim*) et poser --sim-input-bg sur le conteneur coloré.',
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    '[check:modal-canon] Aucune largeur de modale ad hoc ; aucun écart nav/champs/inputs.',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
