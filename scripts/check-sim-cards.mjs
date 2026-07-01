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
const CSS_SCAN_DIRS = [
  path.join(ROOT, 'src', 'features'),
  path.join(ROOT, 'src', 'pages'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'src', 'styles'),
];

async function listTsxFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

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

async function listCssFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) return [];
        return listCssFiles(absolutePath);
      }

      return entry.isFile() && entry.name.endsWith('.css') ? [absolutePath] : [];
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
// élevée (docs/AUDIT_COCKPIT.md §10). On contrôle la définition canonique et
// les overrides applicatifs : aucune exception locale.
const FLAT_SURFACE_BASES = ['.sim-band', '.sim-kpi-line', '.sim-tile-flat'];
// `.audit-related-card` (pile de cartes famille Filiation), `.audit-repeatable-card`
// (mini-fiches répétables compactes) et `.audit-subject-panel` (panneaux sujet non élevés)
// suivent la même règle d'absence d'élévation sur leur propre surface, sans
// adopter la recette `.sim-band` (délimitation par bordure conservée pour une
// pile ajoutable/supprimable). Contrairement aux bases ci-dessus, elles
// contiennent des contrôles interactifs légitimes (focus/hover) dans leurs
// descendants et modificateurs BEM : on ne contrôle donc que le sélecteur
// racine, jamais `.audit-related-card .x` ni `.audit-repeatable-card__x`.
const ROOT_ONLY_FLAT_SURFACES = [
  '.audit-related-card',
  '.audit-repeatable-card',
  '.audit-subject-panel',
];
const BOX_SHADOW_DECL = /\bbox-shadow\s*:\s*([^;]+);?/g;

function selectorTargetsFlatSurface(selector) {
  const matchesBroadSurface = FLAT_SURFACE_BASES.some((base) =>
    new RegExp(`${base.replace('.', '\\.')}(?:$|[\\s.:#\\[]|--|__)`).test(selector),
  );
  if (matchesBroadSurface) return true;
  return ROOT_ONLY_FLAT_SURFACES.some((base) =>
    new RegExp(`^${base.replace('.', '\\.')}(?:$|[:\\[])`).test(selector.trim()),
  );
}

function hasNonNeutralBoxShadow(body) {
  BOX_SHADOW_DECL.lastIndex = 0;
  for (const match of body.matchAll(BOX_SHADOW_DECL)) {
    const value = match[1].trim().toLowerCase();
    if (value !== 'none' && value !== 'none !important') return true;
  }
  return false;
}

function collectFlatSurfaceFailures(content, filePath) {
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
      if (!selectorTargetsFlatSurface(selector)) continue;
      if (hasNonNeutralBoxShadow(body)) {
        found.push({ filePath, selector, lineNumber });
      }
    }
  }
  return found;
}

async function collectFlatSurfaceCssFailures() {
  const cssFilesByPath = new Map();
  for (const dir of CSS_SCAN_DIRS) {
    for (const filePath of await listCssFiles(dir)) {
      cssFilesByPath.set(filePath, filePath);
    }
  }

  const found = [];
  for (const filePath of cssFilesByPath.keys()) {
    const content = await readFile(filePath, 'utf8');
    found.push(...collectFlatSurfaceFailures(content, filePath));
  }
  return found;
}

const surfaceFailures = await collectFlatSurfaceCssFailures();

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
    console.error('Taxonomie des surfaces plates non respectée (aucune ombre autorisée) :');
    surfaceFailures.forEach(({ filePath, selector, lineNumber }) => {
      const relativePath = path.relative(ROOT, filePath).replaceAll(path.sep, '/');
      console.error(`- ${relativePath}:${lineNumber} ${selector} porte box-shadow`);
    });
    console.error(
      'Une bande / ligne KPI / micro-tuile reste non élevée : retire box-shadow ou utilise une carte.',
    );
  }

  process.exit(1);
}

console.log('Contrat cards /sim/* OK.');
