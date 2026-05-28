#!/usr/bin/env node
// Usage: npm run check:large-files-baseline

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslintConfig from '../eslint.config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'baselines', 'large-files.json');
const MAX_LINES = 500;
const EXTENSIONS = new Set(['.ts', '.tsx']);

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isMaxLinesOff(config) {
  return config?.rules?.['max-lines'] === 'off';
}

function getMaxLinesExemptions() {
  return new Set(
    eslintConfig
      .filter(isMaxLinesOff)
      .flatMap((config) => config.files ?? [])
      .filter((pattern) => pattern.startsWith('src/') && EXTENSIONS.has(path.extname(pattern)))
      .map(normalizePath),
  );
}

async function loadBaseline() {
  return JSON.parse(await readFile(BASELINE_PATH, 'utf8'));
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSourceFiles(absolutePath);
      if (!entry.isFile() || !EXTENSIONS.has(path.extname(entry.name))) return [];
      return [absolutePath];
    }),
  );
  return files.flat();
}

function countPhysicalLines(source) {
  if (source.length === 0) return 0;
  const normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return (normalized.match(/\n/g)?.length ?? 0) + (normalized.endsWith('\n') ? 0 : 1);
}

const exemptions = getMaxLinesExemptions();
const baseline = await loadBaseline();
const violations = [];

for (const absolutePath of await listSourceFiles(SRC_DIR)) {
  const relativePath = normalizePath(path.relative(ROOT, absolutePath));
  const lines = countPhysicalLines(await readFile(absolutePath, 'utf8'));
  const baselineLines = baseline[relativePath];
  if (lines > MAX_LINES && !exemptions.has(relativePath) && baselineLines == null) {
    violations.push({
      path: relativePath,
      lines,
      message: 'nouveau fichier >500 lignes absent de la baseline',
    });
  }
  if (baselineLines != null && lines > baselineLines) {
    violations.push({
      path: relativePath,
      lines,
      message: `dépasse la baseline figée (${baselineLines} lignes)`,
    });
  }
}

if (violations.length > 0) {
  console.error('check:large-files-baseline ❌');
  for (const violation of violations.sort((a, b) => b.lines - a.lines)) {
    console.error(`- ${violation.path}: ${violation.lines} lignes, ${violation.message}`);
  }
  process.exit(1);
}

console.log('check:large-files-baseline ✅');
