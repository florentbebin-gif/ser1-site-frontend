import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCANNED_DIRS = ['src', 'api'];
const violations = [];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
      continue;
    }
    if (/\.(js|jsx)$/.test(entry.name)) {
      violations.push(path.relative(ROOT, fullPath));
    }
  }
}

SCANNED_DIRS.forEach((dir) => scan(path.join(ROOT, dir)));

if (violations.length > 0) {
  console.error('Plain .js/.jsx files found in src/ or api/ (use .ts/.tsx):');
  violations.forEach((file) => console.error(`  ${file}`));
  process.exit(1);
}

console.log('check:no-js ✅');
