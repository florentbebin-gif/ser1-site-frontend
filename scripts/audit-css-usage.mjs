// Usage: node scripts/audit-css-usage.mjs — Audit ponctuel des fichiers CSS et de leur consommation dans le repo.
/**
 * Audit CSS usage for repo-owned styles.
 *
 * Purpose:
 * - inventory CSS files and defined class selectors
 * - map likely owners/scopes from file paths
 * - flag classes with no obvious runtime reference in TS/TSX/JS/JSX
 *
 * This script is informative: "unused" means "suspect", not "safe to delete".
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const CSS_EXT = '.css';
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir, predicate) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(fullPath, predicate));
      continue;
    }
    if (predicate(fullPath)) output.push(fullPath);
  }
  return output;
}

function normalizePath(filePath) {
  return relative(ROOT, filePath).replace(/\\/g, '/');
}

function getOwner(relPath) {
  if (relPath.startsWith('src/styles/')) return 'styles';
  if (relPath.startsWith('src/components/')) return 'components';
  if (relPath.startsWith('src/pages/settings/')) return 'pages/settings';
  if (relPath.startsWith('src/pages/')) return 'pages';
  if (relPath.startsWith('src/features/')) return relPath.split('/').slice(0, 3).join('/');
  return 'unknown';
}

function getScope(relPath) {
  if (relPath.includes('/settings/')) return 'settings';
  if (relPath.includes('/audit/')) return 'audit';
  if (relPath.includes('/credit/') || relPath.includes('/ir/') || relPath.includes('/placement/') || relPath.includes('/succession/') || relPath.includes('/per/')) {
    return 'sim';
  }
  if (relPath.startsWith('src/styles/')) return 'global/shared';
  return 'local';
}

function extractCssClasses(content) {
  const classes = new Set();
  const re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const className = match[1];
    const prev = content[match.index - 1];
    if (prev === '#' || prev === ':' || prev === '@') continue;
    if (className.endsWith('css')) continue;
    classes.add(className);
  }
  return [...classes].sort();
}

function buildCodeIndex(codeFiles) {
  return codeFiles.map((filePath) => ({
    relPath: normalizePath(filePath),
    content: readFileSync(filePath, 'utf-8'),
  }));
}

function findCodeRefs(className, codeIndex) {
  const refs = [];
  for (const file of codeIndex) {
    if (!file.content.includes(className)) continue;
    refs.push(file.relPath);
  }
  return refs;
}

const cssFiles = walk(SRC_DIR, (filePath) => filePath.endsWith(CSS_EXT));
const codeFiles = walk(SRC_DIR, (filePath) => CODE_EXTENSIONS.has(filePath.slice(filePath.lastIndexOf('.'))));
const codeIndex = buildCodeIndex(codeFiles);

const files = [];
const suspectClasses = [];

for (const cssFile of cssFiles) {
  const relPath = normalizePath(cssFile);
  const content = readFileSync(cssFile, 'utf-8');
  const classes = extractCssClasses(content);
  const lineCount = content.split('\n').length;

  const classReport = classes.map((className) => {
    const refs = findCodeRefs(className, codeIndex);
    const entry = {
      className,
      refs,
      status: refs.length > 0 ? 'used_or_referenced' : 'suspect_unused',
    };
    if (entry.status === 'suspect_unused') {
      suspectClasses.push({
        file: relPath,
        className,
      });
    }
    return entry;
  });

  files.push({
    file: relPath,
    owner: getOwner(relPath),
    scope: getScope(relPath),
    lines: lineCount,
    classCount: classes.length,
    classes: classReport,
  });
}

files.sort((a, b) => b.lines - a.lines);
suspectClasses.sort((a, b) => a.file.localeCompare(b.file) || a.className.localeCompare(b.className));

const summary = {
  cssFileCount: files.length,
  totalLines: files.reduce((sum, file) => sum + file.lines, 0),
  suspectClassCount: suspectClasses.length,
  files,
  suspectClasses,
};

console.log(JSON.stringify(summary, null, 2));
