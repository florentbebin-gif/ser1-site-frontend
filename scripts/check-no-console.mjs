import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const FORBIDDEN_CONSOLE = /console\.(log|debug|info|trace)\s*\(/;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function shouldSkipFile(filePath) {
  const normalized = filePath.replaceAll(path.sep, '/');
  return normalized.includes('/__tests__/')
    || normalized.includes('.test.')
    || normalized.includes('debugFlags');
}

function shouldSkipLine(line, previousLine) {
  return line.includes('eslint-disable')
    || line.includes('import.meta.env.DEV')
    || previousLine.includes('eslint-disable');
}

const violations = [];

for (const file of walk(SRC_DIR)) {
  if (shouldSkipFile(file)) continue;
  if (!statSync(file).isFile()) continue;

  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (shouldSkipLine(line, lines[index - 1] ?? '')) return;
    if (!FORBIDDEN_CONSOLE.test(line)) return;
    violations.push({
      file: path.relative(ROOT, file).replaceAll(path.sep, '/'),
      line: index + 1,
      content: line.trim(),
    });
  });
}

if (violations.length > 0) {
  console.error('check:no-console ❌ console.log/debug/info/trace interdits en production');
  violations.forEach((violation) => {
    console.error(`- ${violation.file}:${violation.line} ${violation.content}`);
  });
  process.exit(1);
}

console.log('check:no-console ✅');
