/**
 * Garde-fou CI : interdit les tokens C1-C10 hardcodés en CSS en dehors de leur fichier source.
 *
 * Règle : les valeurs hex des tokens C1-C10 ne doivent apparaître que dans
 * src/styles/index.css (définitions fallback). Partout ailleurs, utiliser var(--color-c*).
 *
 * Exceptions autorisées (non vérifiées par ce script) :
 *   - #FFFFFF / #fff / #ffffff : blanc pur (exception explicite, fond modal/chip/card)
 *   - Couleurs de statut (rouge erreur, jaune alerte, bleu info) : ne font pas partie de C1-C10
 *   - rgba() pour les ombres et overlays
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const CSS_SOURCE_FILE = 'src/styles/index.css';

// Valeurs hex des tokens C1-C10, lues depuis la source de vérité
function readTokenColorsFromTheme() {
  const content = readFileSync(join(ROOT, 'src/settings/theme.ts'), 'utf-8');
  const blockMatch = content.match(/export const DEFAULT_COLORS[\s\S]*?\{([\s\S]*?)\};/);
  if (!blockMatch) throw new Error('Cannot find DEFAULT_COLORS in src/settings/theme.ts');
  const colors = [];
  const re = /c\d+:\s*['"]?(#[0-9A-Fa-f]{3,8})['"]?/g;
  let m;
  while ((m = re.exec(blockMatch[1])) !== null) {
    colors.push(m[1]);
  }
  if (colors.length === 0) throw new Error('No colors found in DEFAULT_COLORS');
  return colors;
}

const TOKEN_COLORS = readTokenColorsFromTheme();

const TOKEN_PATTERN = new RegExp(TOKEN_COLORS.join('|'), 'gi');

function collectCssFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
      files.push(...collectCssFiles(fullPath));
    } else if (entry.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

const cssFiles = collectCssFiles(join(ROOT, 'src'));
const violations = [];

for (const file of cssFiles) {
  const relPath = relative(ROOT, file).replace(/\\/g, '/');
  if (relPath === CSS_SOURCE_FILE) continue; // fichier source autorisé

  const lines = readFileSync(file, 'utf-8').split('\n');
  lines.forEach((line, i) => {
    const matches = line.match(TOKEN_PATTERN);
    if (matches) {
      violations.push(`  ${relPath}:${i + 1}  "${matches.join(', ')}" → utiliser var(--color-c*)`);
    }
  });
}

if (violations.length > 0) {
  console.error('check:css-colors ❌  Tokens C1-C10 hardcodés en dehors de src/styles/index.css :');
  violations.forEach((v) => console.error(v));
  console.error('');
  console.error('  Remplacer par var(--color-c1) … var(--color-c10)');
  process.exit(1);
} else {
  console.log('check:css-colors ✅');
}
