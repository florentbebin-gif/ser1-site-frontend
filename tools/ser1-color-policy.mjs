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
  if (!repoPath.startsWith('../')) {
    return repoPath;
  }

  const normalized = filePath.replace(/\\/g, '/');
  for (const scanRoot of ['src', 'scripts', 'tests', 'supabase', 'public', 'tools']) {
    const marker = `/${scanRoot}/`;
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex >= 0) {
      return normalized.slice(markerIndex + 1);
    }
  }
  return repoPath;
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
