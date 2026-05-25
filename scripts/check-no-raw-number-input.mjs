#!/usr/bin/env node
/**
 * check-no-raw-number-input.mjs
 *
 * Garde-fou CI : interdit les <input type="number"> bruts dans les surfaces
 * simulateurs et composants partagés. Les saisies numériques doivent passer par
 * SimAmountInputEuro, SimAmountInputPercent ou SimAmountInputNumeric.
 *
 * Usage : node scripts/check-no-raw-number-input.mjs [--root <chemin>]
 * Exit  : 0 si aucune violation, 1 sinon.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));

const SCAN_DIRS = ['src/features', 'src/components', 'src/pages'];

const ALLOWED_DIRS = [
  // Les reglages admin conservent encore des champs HTML natifs dedies a la saisie de baremes.
  'src/pages/settings',
  'src/components/settings',
];

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
];

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function normalizeRel(path) {
  return path.replace(/\\/g, '/');
}

function startsWithDir(relPath, dir) {
  return relPath === dir || relPath.startsWith(`${dir}/`);
}

function isAllowedPath(absPath, root) {
  const rel = normalizeRel(relative(root, absPath));

  if (ALLOWED_DIRS.some((dir) => startsWithDir(rel, dir))) return true;

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

function isNumberTypeAttribute(attribute) {
  if (!ts.isJsxAttribute(attribute) || attribute.name.text !== 'type') return false;

  const initializer = attribute.initializer;
  if (!initializer) return false;

  if (ts.isStringLiteral(initializer)) {
    return initializer.text === 'number';
  }

  if (ts.isJsxExpression(initializer) && initializer.expression) {
    const expression = initializer.expression;
    return ts.isStringLiteral(expression) && expression.text === 'number';
  }

  return false;
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

    if (isInputOpening && node.attributes.properties.some(isNumberTypeAttribute)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );
      const lines = content.split(/\r?\n/);
      violations.push({
        file: normalizeRel(relative(root, file)),
        line: line + 1,
        column: character + 1,
        snippet: lines[line]?.trim() ?? '<input>',
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

export function findRawNumberInputViolations({ root = ROOT, scanDirs = SCAN_DIRS } = {}) {
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
  console.error('\n[check:no-raw-number-input] <input type="number"> brut detecte :\n');

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line}:${violation.column} -> ${violation.snippet}`,
    );
  }

  console.error(
    '\nUtiliser SimAmountInputEuro, SimAmountInputPercent ou SimAmountInputNumeric selon le cas.',
  );
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[check:no-raw-number-input] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const violations = findRawNumberInputViolations(args);

  if (violations.length > 0) {
    printViolations(violations);
    process.exitCode = 1;
    return;
  }

  console.log('[check:no-raw-number-input] Aucun <input type="number"> brut hors settings.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
