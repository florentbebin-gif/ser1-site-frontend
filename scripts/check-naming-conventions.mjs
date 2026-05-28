#!/usr/bin/env node
// Usage: npm run check:naming-conventions

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SCANNED_DIRS = ['src'];
const EXTENSIONS = new Set(['.ts', '.tsx']);
const LEGACY_DIRECTORY_ALLOWLIST = new Map();
const FORBIDDEN_DIRECTORY_NAMES = new Set(['__spike__', '_raw']);
const FORBIDDEN_PATTERNS = [
  {
    pattern: /\bsuccessionAvFiscal\b/,
    message: 'utiliser successionAssuranceVieFiscal',
  },
];

function normalizeRelativePath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (!entry.isFile() || !EXTENSIONS.has(path.extname(entry.name))) return [];
    return [fullPath];
  });
}

const violations = [];

for (const dir of SCANNED_DIRS) {
  for (const file of listFiles(path.join(ROOT, dir))) {
    const source = fs.readFileSync(file, 'utf8');
    const relativePath = normalizeRelativePath(file);
    for (const { pattern, message } of FORBIDDEN_PATTERNS) {
      if (pattern.test(source)) {
        violations.push(`${relativePath}: ${message}`);
      }
    }
  }
}

const directoriesToVisit = SCANNED_DIRS.map((dir) => path.join(ROOT, dir));
while (directoriesToVisit.length > 0) {
  const directory = directoriesToVisit.pop();
  if (!directory || !fs.existsSync(directory)) continue;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const fullPath = path.join(directory, entry.name);
    const relativePath = normalizeRelativePath(fullPath);
    directoriesToVisit.push(fullPath);

    if (entry.name === 'legacy' && !LEGACY_DIRECTORY_ALLOWLIST.has(relativePath)) {
      violations.push(
        `${relativePath}: dossier legacy interdit ; isoler la compatibilite dans migrations/compat avec preuve d'usage`,
      );
    }
    if (FORBIDDEN_DIRECTORY_NAMES.has(entry.name)) {
      violations.push(`${relativePath}: dossier temporaire interdit dans src`);
    }
  }
}

if (violations.length > 0) {
  console.error('check:naming-conventions ❌');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('check:naming-conventions ✅');
