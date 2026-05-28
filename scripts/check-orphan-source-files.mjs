#!/usr/bin/env node
// Usage: npm run check:orphan-source-files

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const EXTENSIONS = ['.ts', '.tsx'];
const IGNORED_PATTERNS = [
  /(^|\/)__tests__\//,
  /\.(test|spec)\.tsx?$/,
  /\.stories\.tsx?$/,
  /\.d\.ts$/,
  /\/vite-env\.d\.ts$/,
];
const ENTRY_PATTERNS = [
  /\/main\.tsx$/,
  /(^|\/)__tests__\//,
  /\.(test|spec)\.tsx?$/,
  /\.stories\.tsx?$/,
];
const EXPLICIT_ENTRYPOINTS = [
  'src/routes/appRoutes.ts',
  'src/routes/settingsRoutes.ts',
  'src/reporting/snapshot/snapshotMigrations.ts',
];

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(absolutePath);
    if (!entry.isFile() || !EXTENSIONS.includes(path.extname(entry.name))) return [];
    return [absolutePath];
  });
}

function candidatePaths(importer, specifier) {
  if (specifier.startsWith('@/')) {
    const relative = specifier.slice(2);
    return [path.join(SRC_DIR, relative)];
  }
  if (specifier.startsWith('.')) {
    return [path.resolve(path.dirname(importer), specifier)];
  }
  return [];
}

function resolveImport(importer, specifier) {
  for (const candidate of candidatePaths(importer, specifier)) {
    for (const extension of EXTENSIONS) {
      const withExtension = `${candidate}${extension}`;
      if (fs.existsSync(withExtension)) return withExtension;
    }
    for (const extension of EXTENSIONS) {
      const indexFile = path.join(candidate, `index${extension}`);
      if (fs.existsSync(indexFile)) return indexFile;
    }
  }
  return null;
}

function collectImports(file) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const imports = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(ast);
  return imports;
}

const allFiles = listSourceFiles(SRC_DIR);
const allSourceFiles = new Set(allFiles);
const reachable = new Set();
const queue = allFiles.filter((file) => {
  const relativePath = normalize(path.relative(ROOT, file));
  return (
    ENTRY_PATTERNS.some((pattern) => pattern.test(relativePath)) ||
    EXPLICIT_ENTRYPOINTS.includes(relativePath)
  );
});

while (queue.length > 0) {
  const file = queue.shift();
  if (!file || reachable.has(file)) continue;
  reachable.add(file);

  for (const specifier of collectImports(file)) {
    const resolved = resolveImport(file, specifier);
    if (resolved && allSourceFiles.has(resolved) && !reachable.has(resolved)) {
      queue.push(resolved);
    }
  }
}

const violations = allFiles
  .map((file) => normalize(path.relative(ROOT, file)))
  .filter((relativePath) => !IGNORED_PATTERNS.some((pattern) => pattern.test(relativePath)))
  .filter((relativePath) => !reachable.has(path.join(ROOT, relativePath)));

if (violations.length > 0) {
  console.error('check:orphan-source-files ❌');
  for (const file of violations.sort()) {
    console.error(`- ${file}: non atteint depuis main/routes/tests/stories/snapshot entrypoints`);
  }
  process.exit(1);
}

console.log('check:orphan-source-files ✅');
