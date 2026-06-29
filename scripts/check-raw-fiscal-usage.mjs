import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const RAW_PATTERN = /_raw_(tax|ps|fiscality)\b/g;

const ALLOWED_FILES = new Set(
  [
    'src/hooks/useFiscalContext.ts',
    'src/hooks/usePlacementSettings.ts',
    'src/utils/fiscalSettingsFingerprints.ts',
    'src/utils/fiscalKpiReferenceLabels.ts',
    'src/domain/base-contrat/rules/fiscalLabels.ts',
    'src/features/succession/successionFiscalContext.ts',
    'src/features/ir/utils/irFiscalSettings.ts',
    'src/features/audit/cockpit/auditIrAdapter.ts',
    'src/features/per/fiscal/perPotentielFiscalAdapter.ts',
    'src/features/tresorerie-societe/hooks/tresorerieFiscalParams.ts',
  ].map((file) => file.replaceAll('/', path.sep)),
);

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

function isTestFile(relativePath) {
  return (
    relativePath.includes(`${path.sep}__tests__${path.sep}`) ||
    /\.test\.(ts|tsx)$/.test(relativePath) ||
    /\.spec\.(ts|tsx)$/.test(relativePath)
  );
}

const violations = [];

for (const file of listSourceFiles(SRC_DIR)) {
  const relativePath = path.relative(ROOT, file);
  if (ALLOWED_FILES.has(relativePath) || isTestFile(relativePath)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (RAW_PATTERN.test(line)) {
      violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
    RAW_PATTERN.lastIndex = 0;
  });
}

if (violations.length > 0) {
  console.error('Accès _raw_* non autorisés hors adaptateurs fiscaux :');
  violations.forEach((violation) => console.error(`  ${violation}`));
  process.exit(1);
}

console.log('check:raw-fiscal-usage ✅');
