import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslintConfig from '../eslint.config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const MIN_LINES = 400;
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

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) return listSourceFiles(absolutePath);
      if (!entry.isFile()) return [];
      if (!EXTENSIONS.has(path.extname(entry.name))) return [];

      return [absolutePath];
    }),
  );

  return files.flat();
}

function countPhysicalLines(source) {
  if (source.length === 0) return 0;

  const normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const newlineCount = normalized.match(/\n/g)?.length ?? 0;

  return newlineCount + (normalized.endsWith('\n') ? 0 : 1);
}

const maxLinesExemptions = getMaxLinesExemptions();
const sourceFiles = await listSourceFiles(SRC_DIR);
const rows = await Promise.all(
  sourceFiles.map(async (absolutePath) => {
    const source = await readFile(absolutePath, 'utf8');
    const relativePath = normalizePath(path.relative(ROOT, absolutePath));
    const lines = countPhysicalLines(source);

    return {
      path: relativePath,
      lines,
      gapTo500: MAX_LINES - lines,
      maxLinesExempt: maxLinesExemptions.has(relativePath),
    };
  }),
);

const largeFiles = rows
  .filter((row) => row.lines >= MIN_LINES)
  .sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));

console.log('path\tlines\tgap_to_500\tmax_lines_exempt');

for (const row of largeFiles) {
  console.log(`${row.path}\t${row.lines}\t${row.gapTo500}\t${row.maxLinesExempt}`);
}
