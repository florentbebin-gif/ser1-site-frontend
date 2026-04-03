import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const errors = [];

function normalize(filePath) {
  return filePath.replace(/\\/g, '/');
}

function resolveRepoPath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(resolveRepoPath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(resolveRepoPath(relativePath));
}

function walk(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return walk(entryPath);
    }
    return [entryPath];
  });
}

function getCodeFiles() {
  return walk(srcDir).filter((filePath) => /\.(ts|tsx|js|jsx)$/.test(filePath));
}

function getStyleFiles() {
  return walk(srcDir).filter((filePath) => filePath.endsWith('.css'));
}

function getCssImports(relativeFilePath) {
  const content = read(relativeFilePath);
  const matches = [...content.matchAll(/import\s+(?:[^'"]*from\s+)?['"]([^'"]+\.css)['"];?/g)];
  return matches.map((match) => match[1]);
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function assertIncludes(relativeFilePath, expectedImport) {
  const imports = getCssImports(relativeFilePath);
  assert(imports.includes(expectedImport), `${relativeFilePath} doit importer "${expectedImport}"`);
}

function assertNoReference(needle) {
  const scannedFiles = [...getCodeFiles(), ...getStyleFiles()];
  for (const absoluteFilePath of scannedFiles) {
    const relativeFilePath = normalize(path.relative(root, absoluteFilePath));
    const content = fs.readFileSync(absoluteFilePath, 'utf8');
    if (content.includes(needle)) {
      errors.push(`Référence interdite détectée dans ${relativeFilePath} -> ${needle}`);
    }
  }
}

function getFeatureNameFromPath(relativeFilePath) {
  const match = relativeFilePath.match(/^src\/features\/([^/]+)\//);
  return match ? match[1] : null;
}

function resolveImport(fromRelativePath, importPath) {
  if (importPath.startsWith('@/')) {
    return normalize(path.join('src', importPath.slice(2)));
  }
  if (importPath.startsWith('.')) {
    const resolvedPath = path.resolve(path.dirname(resolveRepoPath(fromRelativePath)), importPath);
    return normalize(path.relative(root, resolvedPath));
  }
  return null;
}

assert(!/@import\b/.test(read('src/styles/index.css')), 'src/styles/index.css ne doit plus importer de CSS de domaine');

const removedFiles = [
  'src/components/TopBar.css',
  'src/components/simulator/SimulatorShell.css',
  'src/styles/home.css',
  'src/styles/settings.css',
  'src/styles/premium-components.css',
];

for (const removedFile of removedFiles) {
  assert(!exists(removedFile), `${removedFile} ne doit plus exister`);
  assertNoReference(removedFile);
}

const mainCssImports = getCssImports('src/main.tsx');
const expectedMainImports = [
  './styles/index.css',
  './styles/app/index.css',
  './styles/premium-shared.css',
];

assert(
  mainCssImports.length === expectedMainImports.length
    && expectedMainImports.every((importPath) => mainCssImports.includes(importPath)),
  `src/main.tsx doit importer uniquement ${expectedMainImports.join(', ')}`,
);

for (const absoluteFilePath of getCodeFiles()) {
  const relativeFilePath = normalize(path.relative(root, absoluteFilePath));
  if (relativeFilePath === 'src/main.tsx') {
    continue;
  }
  const content = fs.readFileSync(absoluteFilePath, 'utf8');
  if (content.includes('premium-shared.css')) {
    errors.push(`Import interdit de premium-shared.css hors main.tsx: ${relativeFilePath}`);
  }
}

const simEntries = [
  ['src/features/credit/Credit.tsx', './styles/index.css'],
  ['src/features/ir/components/IrSimulatorContainer.tsx', '../styles/index.css'],
  ['src/features/placement/components/PlacementSimulatorPage.tsx', '../styles/index.css'],
  ['src/features/per/components/potentiel/PerPotentielSimulator.tsx', '../../styles/index.css'],
  ['src/features/succession/SuccessionSimulator.tsx', './styles/index.css'],
];

for (const [entryFile, localImport] of simEntries) {
  assertIncludes(entryFile, '@/styles/sim/index.css');
  assertIncludes(entryFile, localImport);
}

assertIncludes('src/pages/SettingsShell.tsx', './settings/styles/index.css');
assertIncludes('src/features/audit/AuditWizard.tsx', './styles/index.css');

for (const absoluteFilePath of getCodeFiles()) {
  const relativeFilePath = normalize(path.relative(root, absoluteFilePath));
  const featureName = getFeatureNameFromPath(relativeFilePath);
  if (!featureName) {
    continue;
  }

  for (const importPath of getCssImports(relativeFilePath)) {
    const resolvedImport = resolveImport(relativeFilePath, importPath);
    if (!resolvedImport) {
      continue;
    }

    const importedFeatureName = getFeatureNameFromPath(resolvedImport);
    if (importedFeatureName && importedFeatureName !== featureName) {
      errors.push(`Import CSS cross-feature interdit: ${relativeFilePath} -> ${resolvedImport}`);
    }
  }
}

if (errors.length > 0) {
  console.error('check:css-structure ❌');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('check:css-structure ✅');
