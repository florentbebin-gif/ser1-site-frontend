import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const LOGOS_DIR = path.join(ROOT, 'public', 'logos', 'compagnies');
const MANIFEST_PATH = path.join(LOGOS_DIR, 'manifest.json');
const GENERATED_PATH = path.join(
  ROOT,
  'src',
  'pages',
  'settings',
  'components',
  'companyLogoManifest.generated.ts',
);

const VALID_BACKGROUNDS = new Set(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
const VALID_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp']);

function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

function formatTsString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function formatTsKey(value) {
  return /^[A-Za-z_$][\w$]*$/.test(value) ? value : formatTsString(value);
}

function validateManifest(manifest) {
  const errors = [];
  if (!manifest || !Array.isArray(manifest.items)) {
    return ['manifest.json doit contenir un tableau items.'];
  }

  const slugs = new Set();
  const manifestFiles = new Set();

  for (const item of manifest.items) {
    if (!item.slug) errors.push(`Entrée sans slug : ${JSON.stringify(item)}`);
    if (slugs.has(item.slug)) errors.push(`Slug dupliqué : ${item.slug}`);
    slugs.add(item.slug);

    if (!item.file) continue;
    const extension = path.extname(item.file).toLowerCase();
    if (!VALID_EXTENSIONS.has(extension)) {
      errors.push(`Extension logo non supportée pour ${item.slug} : ${item.file}`);
    }
    if (!existsSync(path.join(LOGOS_DIR, item.file))) {
      errors.push(`Fichier logo manquant pour ${item.slug} : ${item.file}`);
    }
    if (manifestFiles.has(item.file)) errors.push(`Fichier logo dupliqué : ${item.file}`);
    manifestFiles.add(item.file);

    const overrides = item.displayOverrides;
    if (!overrides) continue;
    if (
      overrides.scale !== undefined &&
      (!Number.isFinite(overrides.scale) || overrides.scale <= 0 || overrides.scale > 100)
    ) {
      errors.push(`displayOverrides.scale invalide pour ${item.slug} : ${overrides.scale}`);
    }
    if (overrides.background !== undefined && !VALID_BACKGROUNDS.has(overrides.background)) {
      errors.push(
        `displayOverrides.background invalide pour ${item.slug} : ${overrides.background}`,
      );
    }
  }

  for (const file of readdirSync(LOGOS_DIR)) {
    if (file === 'manifest.json') continue;
    if (!VALID_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    if (!manifestFiles.has(file)) {
      errors.push(`Fichier logo non référencé dans manifest.json : ${file}`);
    }
  }

  return errors;
}

function generateFile(manifest) {
  const entries = manifest.items
    .filter((item) => item.file)
    .map((item) => {
      const lines = [`    file: ${formatTsString(item.file)},`];
      if (item.displayOverrides) {
        lines.push('    displayOverrides: {');
        if (item.displayOverrides.scale !== undefined) {
          lines.push(`      scale: ${item.displayOverrides.scale},`);
        }
        if (item.displayOverrides.background !== undefined) {
          lines.push(`      background: ${formatTsString(item.displayOverrides.background)},`);
        }
        lines.push('    },');
      }
      return `  ${formatTsKey(item.slug)}: {\n${lines.join('\n')}\n  },`;
    })
    .join('\n');

  return `// @generated - ne pas éditer manuellement. Lancez npm run logos:generate.\n\nexport type CompanyLogoBackground = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6';\n\nexport interface CompanyLogoAssetConfig {\n  file: string;\n  displayOverrides?: {\n    scale?: number;\n    background?: CompanyLogoBackground;\n  };\n}\n\nexport const COMPANY_LOGO_ASSETS = {\n${entries}\n} as const satisfies Record<string, CompanyLogoAssetConfig>;\n`;
}

function main() {
  const mode = process.argv[2];
  if (!['--write', '--check'].includes(mode)) {
    console.error('Usage: node scripts/generate-company-logo-manifest.mjs --write|--check');
    process.exit(1);
  }

  const manifest = readManifest();
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    console.error('check:company-logos ❌');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const generated = generateFile(manifest);
  if (mode === '--write') {
    mkdirSync(path.dirname(GENERATED_PATH), { recursive: true });
    writeFileSync(GENERATED_PATH, generated, 'utf8');
    console.log('logos:generate ✅');
    return;
  }

  const current = existsSync(GENERATED_PATH) ? readFileSync(GENERATED_PATH, 'utf8') : '';
  if (current !== generated) {
    console.error('check:company-logos ❌ fichier généré désynchronisé.');
    console.error('Lancer npm run logos:generate.');
    process.exit(1);
  }

  console.log('check:company-logos ✅');
}

main();
