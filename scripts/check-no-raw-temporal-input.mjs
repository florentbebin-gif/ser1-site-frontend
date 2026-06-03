#!/usr/bin/env node
/**
 * check-no-raw-temporal-input.mjs
 *
 * Garde-fou CI : interdit les <input type="date"> et <input type="month"> bruts
 * dans les surfaces simulateurs et composants partagés. Les saisies temporelles
 * doivent passer par SimTemporalField (valeur ISO interne, visuel champ unifié).
 *
 * Périmètre : src/features, src/components, src/pages.
 * Exceptions : la primitive canonique SimTemporalField implémente le contrôle HTML
 * natif ; l'admin (src/pages/settings, src/components/settings) conserve des champs
 * natifs de gestion. Les surfaces applicatives n'ont plus d'allowlist.
 *
 * Usage : node scripts/check-no-raw-temporal-input.mjs [--root <chemin>]
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));

const SCAN_DIRS = ['src/features', 'src/components', 'src/pages'];

const ALLOWED_DIRS = [
  // L'UI admin conserve des champs HTML natifs dédiés à la saisie de barèmes.
  'src/pages/settings',
  'src/components/settings',
];

const PRIMITIVE_FILES = new Set(['src/components/ui/sim/SimTemporalField.tsx']);

const ALLOWED_FILES = new Set();

const ALLOWED_DIR_PATTERNS = [/__tests__[/\\]/];

const ALLOWED_FILE_SUFFIXES = [
  '.test.ts',
  '.test.tsx',
  '.test.js',
  '.test.jsx',
  '.spec.ts',
  '.spec.tsx',
  '.spec.js',
  '.spec.jsx',
  '.stories.tsx',
];

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const TEMPORAL_TYPES = new Set(['date', 'month']);

function normalizeRel(path) {
  return path.replace(/\\/g, '/');
}

function startsWithDir(relPath, dir) {
  return relPath === dir || relPath.startsWith(`${dir}/`);
}

function isAllowedPath(absPath, root) {
  const rel = normalizeRel(relative(root, absPath));

  if (ALLOWED_DIRS.some((dir) => startsWithDir(rel, dir))) return true;
  if (PRIMITIVE_FILES.has(rel)) return true;
  if (ALLOWED_FILES.has(rel)) return true;

  const relWithSep = `${rel}/`;
  if (ALLOWED_DIR_PATTERNS.some((pattern) => pattern.test(relWithSep) || pattern.test(rel))) {
    return true;
  }

  const base = absPath.split(/[/\\]/).pop() ?? '';
  return ALLOWED_FILE_SUFFIXES.some((suffix) => base.endsWith(suffix));
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

function getScriptKind(file) {
  const ext = extname(file);
  if (ext === '.tsx') return ts.ScriptKind.TSX;
  if (ext === '.jsx') return ts.ScriptKind.JSX;
  if (ext === '.js') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function getJsxTagName(node) {
  if (ts.isIdentifier(node.tagName)) return node.tagName.text;
  return undefined;
}

function getTemporalType(attribute) {
  if (!ts.isJsxAttribute(attribute) || attribute.name.text !== 'type') return undefined;

  const initializer = attribute.initializer;
  if (!initializer) return undefined;

  if (ts.isStringLiteral(initializer)) return getTemporalTypeFromExpression(initializer);

  if (ts.isJsxExpression(initializer) && initializer.expression) {
    return getTemporalTypeFromExpression(initializer.expression);
  }

  return undefined;
}

function getTemporalTypeFromExpression(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return TEMPORAL_TYPES.has(expression.text) ? expression.text : undefined;
  }

  if (ts.isParenthesizedExpression(expression)) {
    return getTemporalTypeFromExpression(expression.expression);
  }

  if (
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression)
  ) {
    return getTemporalTypeFromExpression(expression.expression);
  }

  if (ts.isConditionalExpression(expression)) {
    return (
      getTemporalTypeFromExpression(expression.whenTrue) ??
      getTemporalTypeFromExpression(expression.whenFalse)
    );
  }

  return undefined;
}

function collectViolations(file, content, root) {
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(file),
  );
  const violations = [];

  function visit(node) {
    const isInputOpening =
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      getJsxTagName(node) === 'input';

    if (isInputOpening) {
      for (const attribute of node.attributes.properties) {
        const temporalType = getTemporalType(attribute);
        if (!temporalType) continue;

        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile),
        );
        const lines = content.split(/\r?\n/);
        violations.push({
          file: normalizeRel(relative(root, file)),
          line: line + 1,
          column: character + 1,
          type: temporalType,
          snippet: lines[line]?.trim() ?? '<input>',
        });
        break;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

export function findRawTemporalInputViolations({ root = ROOT, scanDirs = SCAN_DIRS } = {}) {
  const resolvedRoot = resolve(root);
  const violations = [];

  for (const dir of scanDirs) {
    const absDir = join(resolvedRoot, dir);
    const files = walkDir(absDir);

    for (const file of files) {
      if (isAllowedPath(file, resolvedRoot)) continue;

      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      violations.push(...collectViolations(file, content, resolvedRoot));
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
  console.error('\n[check:no-raw-temporal-input] <input type="date|month"> brut détecté :\n');

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line}:${violation.column} (type="${violation.type}") -> ${violation.snippet}`,
    );
  }

  console.error('\nUtiliser SimTemporalField (granularity "day" ou "month").');
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[check:no-raw-temporal-input] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const violations = findRawTemporalInputViolations(args);

  if (violations.length > 0) {
    printViolations(violations);
    process.exitCode = 1;
    return;
  }

  console.log(
    '[check:no-raw-temporal-input] Aucun <input type="date|month"> brut hors exceptions.',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
