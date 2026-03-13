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

// Valeurs hex des tokens C1-C10 (insensible à la casse)
const TOKEN_COLORS = [
  '#2B3E37', // c1
  '#709B8B', // c2
  '#9FBDB2', // c3
  '#CFDED8', // c4
  '#788781', // c5
  '#CEC1B6', // c6
  '#F5F3F0', // c7
  '#D9D9D9', // c8
  '#7F7F7F', // c9
  '#000000', // c10
];

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
