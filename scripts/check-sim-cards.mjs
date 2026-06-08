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

const SIM_CARD_CLASS_EXCEPTIONS = [
  {
    fragment: 'sim-summary-card',
    reason: 'carte de synthèse canonique, pas une carte de saisie simulateur',
  },
  {
    fragment: 'sim-state-card',
    reason: 'état vide/chargement canonique partagé par les simulateurs',
  },
  {
    fragment: 'premium-card-compact',
    reason: 'format compact de ligne KPI, sans contrat visuel sim-card--guide',
  },
  {
    fragment: 'ir-detail-card',
    reason: 'carte de détail IR interne à la restitution, sans shell premium-card racine',
  },
  {
    fragment: 'per-madelin-modal-card',
    reason: 'carte interne de modale PER Madelin, hors carte de page /sim',
  },
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
  return SIM_CARD_CLASS_EXCEPTIONS.some(({ fragment }) => line.includes(fragment));
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

// Extension UX-00b : la taxonomie des surfaces plates (bande, ligne KPI,
// micro-tuile) ne doit jamais être élevée — aucune ombre dans une surface non
// élevée (docs/AUDIT_COCKPIT.md §10). On contrôle la définition canonique.
const SURFACES_CSS = path.join(ROOT, 'src', 'styles', 'sim', 'surfaces.css');
const FLAT_SURFACE_BASES = ['.sim-band', '.sim-kpi-line', '.sim-tile-flat'];

function collectFlatSurfaceFailures(content) {
  const found = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let ruleMatch;
  while ((ruleMatch = ruleRegex.exec(content)) !== null) {
    const selectors = ruleMatch[1]
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean);
    const body = ruleMatch[2];
    const lineNumber = content.slice(0, ruleMatch.index).split(/\r?\n/).length;
    for (const selector of selectors) {
      const isFlat = FLAT_SURFACE_BASES.some(
        (base) =>
          selector === base || selector.startsWith(`${base}--`) || selector.startsWith(`${base}__`),
      );
      if (!isFlat) continue;
      if (/\bbox-shadow\s*:/.test(body) && !/\bbox-shadow\s*:\s*none\b/.test(body)) {
        found.push({ selector, lineNumber });
      }
    }
  }
  return found;
}

let surfaceFailures = [];
try {
  const surfacesContent = await readFile(SURFACES_CSS, 'utf8');
  surfaceFailures = collectFlatSurfaceFailures(surfacesContent);
} catch {
  // surfaces.css absent : rien à vérifier côté taxonomie.
}

if (failures.length > 0 || surfaceFailures.length > 0) {
  if (failures.length > 0) {
    console.error('Contrat cards /sim/* non respecté :');
    failures.forEach(({ filePath, lineNumber, line }) => {
      const relativePath = path.relative(ROOT, filePath).replaceAll(path.sep, '/');
      console.error(`- ${relativePath}:${lineNumber} ${line}`);
    });
    console.error(
      'Ajoute premium-card--guide + sim-card--guide ou documente une exception nommée dans scripts/check-sim-cards.mjs.',
    );
  }

  if (surfaceFailures.length > 0) {
    const relativeSurfaces = path.relative(ROOT, SURFACES_CSS).replaceAll(path.sep, '/');
    console.error('Taxonomie des surfaces plates non respectée (aucune ombre autorisée) :');
    surfaceFailures.forEach(({ selector, lineNumber }) => {
      console.error(`- ${relativeSurfaces}:${lineNumber} ${selector} porte box-shadow`);
    });
    console.error(
      'Une bande / ligne KPI / micro-tuile reste non élevée : retire box-shadow ou utilise une carte.',
    );
  }

  process.exit(1);
}

console.log('Contrat cards /sim/* OK.');
