#!/usr/bin/env node
// Usage: npm run check:tresorerie-v6-runtime

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SCANNED_ROOTS = [
  path.join(ROOT, 'src', 'features', 'tresorerie-societe'),
  path.join(ROOT, 'src', 'engine', 'tresorerie', 'types.ts'),
];

const FORBIDDEN_PATTERNS = [
  /\bTresoInputsV2\b/,
  /\bTresoInputsV3\b/,
  /\bTresoInputsV4\b/,
  /\bTresoInputsV5\b/,
  /\bTresoInputsRuntime\b/,
  /src[\\/]engine[\\/]tresorerie[\\/]legacy/,
  /@\/engine\/tresorerie\/legacy/,
  /\blegacy\b/i,
];

const SOURCE_FILE_RE = /\.(ts|tsx)$/;

function listFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return SOURCE_FILE_RE.test(target) ? [target] : [];

  const files = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') {
      continue;
    }
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (SOURCE_FILE_RE.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const failures = [];

for (const root of SCANNED_ROOTS) {
  for (const file of listFiles(root)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          failures.push({
            file: path.relative(ROOT, file),
            line: index + 1,
            pattern: pattern.toString(),
            text: line.trim(),
          });
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error('check:tresorerie-v6-runtime ❌');
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.pattern} :: ${failure.text}`);
  }
  process.exit(1);
}

console.log('check:tresorerie-v6-runtime ✅');
console.log('- features/tresorerie-societe et engine/tresorerie/types.ts restent en V6 runtime');
