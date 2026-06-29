import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

export const COLOR_POLICY_ROOTS = ['src', 'scripts', 'tests/e2e', 'supabase/functions'];

export const COLOR_POLICY_EXTENSIONS = new Set([
  '.css',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const COLOR_LITERAL_PATTERN =
  /#[0-9A-Fa-f]{3,8}\b|rgba?\(\s*(?:\d+\s*,\s*){2}\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|rgba?\(\s*\d+\s+\d+\s+\d+(?:\s*\/\s*[\d.]+%)?\s*\)|hsla?\([^)]*\)/gi;

const RAW_THEME_VAR_PATTERN = /var\(--color-c(?:4|5|6)\)/gi;
const REPO_PATH_MARKERS = ['src', 'scripts', 'tests', 'supabase', 'public', 'tools'];

// Fichier tokens : seule source des fallbacks hex C1-C10, mais les tokens
// data-viz --viz-* doivent rester dérivés du thème (UX-00b).
export const COLOR_POLICY_TOKENS_FILE = 'src/styles/index.css';
const VIZ_DECL_PATTERN = /(--viz-[\w-]+)\s*:\s*([^;]+);/;
const VIZ_RADAR_TOKENS = new Set(['--viz-current', '--viz-scenario']);
const VIZ_COPPER_REF_PATTERN = /var\(\s*--color-c6\s*\)|var\(\s*--accent-signature\s*\)/i;

const PATH_ALLOWLIST = [
  {
    label: 'source theme',
    test: (path) =>
      path === 'src/settings/theme.ts' ||
      path === 'src/settings/presets.ts' ||
      path === 'src/settings/theme/paletteGenerator.ts' ||
      path === 'src/styles/index.css',
  },
  {
    label: 'showroom palette',
    test: (path) => path === 'src/pages/settings/SettingsDesignSystemColorPreview.tsx',
  },
  {
    label: 'tests et fixtures',
    test: (path) =>
      path.includes('/__tests__/') ||
      /\.test\.[cm]?[jt]sx?$/.test(path) ||
      path.startsWith('tests/') ||
      path.includes('/fixtures/') ||
      path.endsWith('.stories.tsx') ||
      path.endsWith('.stories.ts'),
  },
  {
    label: 'exports controles',
    test: (path) => path.startsWith('src/pptx/') || path.startsWith('src/reporting/'),
  },
  {
    label: 'migrations palette',
    test: (path) => path.startsWith('supabase/migrations/'),
  },
  {
    label: 'assets de marque externes',
    test: (path) => path.startsWith('public/logos/'),
  },
];

export function toRepoPath(filePath, root = process.cwd()) {
  if (!filePath || filePath === '<input>') {
    return filePath;
  }
  const repoPath = relative(root, filePath).replace(/\\/g, '/');
  const normalizedRepoPath = extractRepoPath(repoPath);
  if (normalizedRepoPath === repoPath) {
    return repoPath;
  }
  const hasWindowsDrivePrefix = /^[A-Za-z]:\//.test(repoPath);
  if (!repoPath.startsWith('../') && !hasWindowsDrivePrefix) {
    return repoPath;
  }

  if (normalizedRepoPath) {
    return normalizedRepoPath;
  }

  const normalized = filePath.replace(/\\/g, '/');
  const normalizedFilePath = extractRepoPath(normalized);
  if (normalizedFilePath) {
    return normalizedFilePath;
  }
  return repoPath;
}

function extractRepoPath(path) {
  for (const scanRoot of REPO_PATH_MARKERS) {
    if (path === scanRoot || path.startsWith(`${scanRoot}/`)) {
      return path;
    }
    const marker = `/${scanRoot}/`;
    const markerIndex = path.indexOf(marker);
    if (markerIndex >= 0) {
      return path.slice(markerIndex + 1);
    }
  }
  return null;
}

export function getColorPolicyAllowance(repoPath) {
  return PATH_ALLOWLIST.find((entry) => entry.test(repoPath)) ?? null;
}

export function isColorPolicyPathAllowed(repoPath) {
  return getColorPolicyAllowance(repoPath) !== null;
}

export function findColorPolicyViolationsInText(text, repoPath) {
  if (isColorPolicyPathAllowed(repoPath)) {
    return [];
  }

  const violations = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    COLOR_LITERAL_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(COLOR_LITERAL_PATTERN)) {
      violations.push({
        kind: 'hardcoded-color',
        line: index + 1,
        value: match[0],
        message:
          'Couleur hardcodee interdite : utiliser un alias semantique ou documenter une exception dans tools/ser1-color-policy.mjs.',
      });
    }

    RAW_THEME_VAR_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(RAW_THEME_VAR_PATTERN)) {
      violations.push({
        kind: 'raw-theme-var',
        line: index + 1,
        value: match[0],
        message:
          'Usage direct C4/C5/C6 interdit : utiliser --surface-active, --data-secondary, --accent-signature ou --state-warning.',
      });
    }
  });

  return violations;
}

// Garde-fou data-viz (UX-00b) : appliqué au fichier tokens même s'il est
// allowlisté pour les fallbacks C1-C10. Deux règles :
// 1. aucun --viz-* ne porte un littéral hex/rgb/hsl (doit être dérivé du thème) ;
// 2. les séries du radar (--viz-current / --viz-scenario) n'utilisent pas le cuivre.
export function findVizTokenViolations(text) {
  const violations = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = VIZ_DECL_PATTERN.exec(line);
    if (!match) return;
    const [, token, rawValue] = match;
    const value = rawValue.trim();

    COLOR_LITERAL_PATTERN.lastIndex = 0;
    if (COLOR_LITERAL_PATTERN.test(value)) {
      violations.push({
        kind: 'viz-hardcoded-color',
        line: index + 1,
        value: token,
        message:
          'Token --viz-* doit être dérivé du thème (var/color-mix), sans littéral hex/rgb/hsl.',
      });
    }

    if (VIZ_RADAR_TOKENS.has(token) && VIZ_COPPER_REF_PATTERN.test(value)) {
      violations.push({
        kind: 'viz-radar-copper',
        line: index + 1,
        value: token,
        message:
          'Le cuivre (--color-c6 / --accent-signature) n’entre pas dans le radar : choisir une autre dérivation.',
      });
    }
  });

  return violations;
}

export function collectColorPolicyFiles(root = process.cwd(), roots = COLOR_POLICY_ROOTS) {
  const files = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', 'coverage', '.git'].includes(entry)) {
          walk(fullPath);
        }
        continue;
      }
      if (COLOR_POLICY_EXTENSIONS.has(extname(entry))) {
        files.push(fullPath);
      }
    }
  }

  for (const scanRoot of roots) {
    walk(join(root, scanRoot));
  }

  return files;
}

export function scanColorPolicy(root = process.cwd(), roots = COLOR_POLICY_ROOTS) {
  const findings = [];
  for (const file of collectColorPolicyFiles(root, roots)) {
    const repoPath = toRepoPath(file, root);
    const text = readFileSync(file, 'utf8');
    const violations = findColorPolicyViolationsInText(text, repoPath);
    for (const violation of violations) {
      findings.push({ file: repoPath, ...violation });
    }
  }
  return findings;
}
