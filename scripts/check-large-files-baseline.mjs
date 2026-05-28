#!/usr/bin/env node
// Usage: npm run check:large-files-baseline

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'baselines', 'large-files.json');
const MAX_LINES = 500;
const EXTENSIONS = new Set(['.ts', '.tsx']);

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
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

function validateBaselineEntry(relativePath, entry) {
  const missingFields = [];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return ['entrée baseline non structurée'];
  }
  if (!Number.isInteger(entry.maxLines) || entry.maxLines < MAX_LINES + 1) {
    missingFields.push('maxLines entier > 500');
  }
  for (const field of ['category', 'decision', 'justification', 'nextAction']) {
    if (typeof entry[field] !== 'string' || entry[field].trim().length === 0) {
      missingFields.push(field);
    }
  }
  if (entry.justification?.includes('TODO') || entry.nextAction?.includes('TODO')) {
    missingFields.push('justification/nextAction sans TODO');
  }
  return missingFields.map(
    (field) => `${relativePath}: champ baseline manquant/invalide (${field})`,
  );
}

const baseline = await loadBaseline();
const violations = [];
const sourceFiles = await listSourceFiles(SRC_DIR);
const filesByPath = new Map();

for (const absolutePath of sourceFiles) {
  const relativePath = normalizePath(path.relative(ROOT, absolutePath));
  const lines = countPhysicalLines(await readFile(absolutePath, 'utf8'));
  filesByPath.set(relativePath, lines);
  const baselineEntry = baseline[relativePath];

  if (lines > MAX_LINES && baselineEntry == null) {
    violations.push({
      path: relativePath,
      lines,
      message: 'fichier >500 lignes absent de la baseline structurée',
    });
  }

  if (baselineEntry != null) {
    for (const message of validateBaselineEntry(relativePath, baselineEntry)) {
      violations.push({ path: relativePath, lines, message });
    }
  }

  if (baselineEntry != null && lines > baselineEntry.maxLines) {
    violations.push({
      path: relativePath,
      lines,
      message: `dépasse la baseline figée (${baselineEntry.maxLines} lignes)`,
    });
  }
}

for (const [relativePath, entry] of Object.entries(baseline)) {
  const lines = filesByPath.get(relativePath);
  if (lines == null) {
    violations.push({
      path: relativePath,
      lines: 0,
      message: 'entrée baseline sans fichier correspondant',
    });
    continue;
  }
  for (const message of validateBaselineEntry(relativePath, entry)) {
    violations.push({ path: relativePath, lines, message });
  }
  if (lines <= MAX_LINES) {
    violations.push({
      path: relativePath,
      lines,
      message: 'entrée baseline devenue inutile, supprimer la justification',
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
