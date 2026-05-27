#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const BASELINE = 109;
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const DEEP_IMPORT_PATTERN = /\bfrom\s+['"]\.\.\/\.\.\/\.\.\//;

function normalizePath(filePath) {
  return filePath.replaceAll(path.sep, '/');
}

function isTestFile(filePath) {
  const normalized = normalizePath(filePath);
  return (
    normalized.includes('/__tests__/') ||
    /\.test\.[jt]sx?$/.test(normalized) ||
    /\.spec\.[jt]sx?$/.test(normalized)
  );
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (
      entry.isFile() &&
      SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
      !isTestFile(fullPath)
    ) {
      out.push(fullPath);
    }
  }
  return out;
}

const findings = [];

for (const file of walk(SRC_DIR)) {
  const source = readFileSync(file, 'utf8');
  const relativePath = normalizePath(path.relative(ROOT, file));
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!DEEP_IMPORT_PATTERN.test(line)) return;
    findings.push({ file: relativePath, line: index + 1, importLine: line.trim() });
  });
}

if (findings.length > BASELINE) {
  console.error(
    `check:deep-imports ❌ ${findings.length} imports ../../../ hors tests, baseline autorisée ${BASELINE}.`,
  );
  console.error('Utiliser @/ pour les nouveaux imports cross-module au-delà de 2 niveaux.');
  findings.slice(BASELINE).forEach((finding) => {
    console.error(`- ${finding.file}:${finding.line} ${finding.importLine}`);
  });
  process.exit(1);
}

console.log(`check:deep-imports ✅ ${findings.length}/${BASELINE}`);
