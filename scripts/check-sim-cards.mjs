import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const FEATURE_ROOT = path.join(ROOT, 'src', 'features');
const SIM_FEATURES = [
  'credit',
  'ir',
  'succession',
  'prevoyance',
  'tresorerie-societe',
  'per',
  'placement',
];

const ALLOWED_CLASS_FRAGMENTS = [
  'sim-summary-card',
  'sim-state-card',
  'premium-card-compact',
  'ir-detail-card',
  'per-madelin-modal-card',
];

const IGNORED_DIRS = new Set(['__tests__']);

async function listTsxFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) return [];
        return listTsxFiles(absolutePath);
      }

      return entry.isFile() && entry.name.endsWith('.tsx') ? [absolutePath] : [];
    }),
  );

  return files.flat();
}

function isAllowed(line) {
  return ALLOWED_CLASS_FRAGMENTS.some((fragment) => line.includes(fragment));
}

function checkLine(filePath, line, index) {
  if (!line.includes('className') || !line.includes('premium-card')) return null;
  if (isAllowed(line)) return null;

  const hasPremiumGuide = line.includes('premium-card--guide');
  const hasSimGuide = line.includes('sim-card--guide');

  if (hasPremiumGuide && hasSimGuide) return null;

  return {
    filePath,
    lineNumber: index + 1,
    line: line.trim(),
  };
}

const failures = [];

for (const feature of SIM_FEATURES) {
  const featureDir = path.join(FEATURE_ROOT, feature);
  const files = await listTsxFiles(featureDir);

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const failure = checkLine(filePath, line, index);
      if (failure) failures.push(failure);
    });
  }
}

if (failures.length > 0) {
  console.error('Contrat cards /sim/* non respecté :');
  failures.forEach(({ filePath, lineNumber, line }) => {
    const relativePath = path.relative(ROOT, filePath).replaceAll(path.sep, '/');
    console.error(`- ${relativePath}:${lineNumber} ${line}`);
  });
  console.error(
    'Ajoute premium-card--guide + sim-card--guide ou documente une exception dans scripts/check-sim-cards.mjs.',
  );
  process.exit(1);
}

console.log('Contrat cards /sim/* OK.');
