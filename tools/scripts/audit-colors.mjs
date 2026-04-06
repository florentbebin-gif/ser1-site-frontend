#!/usr/bin/env node
// Usage: node tools/scripts/audit-colors.mjs — Audit ponctuel des couleurs hardcodées dans le repo (complément de check:css-colors).
/**
 * Script d'audit des couleurs SER1
 *
 * Analyse le codebase pour détecter:
 * - Les couleurs hardcodées non autorisées
 * - Les usages des tokens C1-C10
 * - La couverture des composants tokenisés
 *
 * Usage: node tools/scripts/audit-colors.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SRC_DIR = join(__dirname, '../../src');

// Patterns de détection
const HEX_COLOR_PATTERN = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/gi;
const RGB_COLOR_PATTERN = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi;
const TOKEN_PATTERN = /colors\.(c[1-9]|c10)\b|semantic\[['"][a-z-]+['"]\]|getSemanticColors\(\)/gi;
const UI_COMPONENT_PATTERN = /from\s+['"]\.\/\.\.\/components\/ui['"]|from\s+['"]@\/components\/ui['"]/g;

// Couleurs autorisées (exceptions)
const ALLOWED_COLORS = ['#ffffff', '#fff', '#996600', '#ffffff80'];

/**
 * Vérifie si une couleur est autorisée
 */
function isAllowedColor(color) {
  const normalized = color.toLowerCase().replace(/#/g, '');
  const normalizedHex = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  return ALLOWED_COLORS.includes('#' + normalizedHex) ||
         ALLOWED_COLORS.includes('#' + normalized);
}

/**
 * Parcourt récursivement un répertoire
 */
function walkDir(dir, callback) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkDir(path, callback);
    } else {
      callback(path);
    }
  }
}

/**
 * Analyse un fichier
 */
function analyzeFile(filepath) {
  const ext = extname(filepath);
  if (!['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'].includes(ext)) {
    return null;
  }

  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  const findings = {
    path: filepath,
    hardcodedColors: [],
    tokensUsed: [],
    uiComponents: false,
    lineCount: lines.length,
  };

  lines.forEach((line, index) => {
    // Détecte les couleurs hex
    const hexMatches = line.match(HEX_COLOR_PATTERN);
    if (hexMatches) {
      hexMatches.forEach(color => {
        if (!isAllowedColor(color)) {
          findings.hardcodedColors.push({
            line: index + 1,
            color,
            context: line.trim(),
          });
        }
      });
    }

    // Détecte les tokens sémantiques
    const tokenMatches = line.match(TOKEN_PATTERN);
    if (tokenMatches) {
      findings.tokensUsed.push(...tokenMatches);
    }

    // Détecte l'utilisation des composants UI
    if (UI_COMPONENT_PATTERN.test(line)) {
      findings.uiComponents = true;
    }
  });

  // Déduplique les tokens
  findings.tokensUsed = [...new Set(findings.tokensUsed)];

  return findings;
}

/**
 * Génère le rapport
 */
function generateReport(results) {
  const validResults = results.filter(r => r !== null);

  const totalFiles = validResults.length;
  const filesWithHardcodes = validResults.filter(r => r.hardcodedColors.length > 0);
  const filesUsingTokens = validResults.filter(r => r.tokensUsed.length > 0);
  const filesUsingUI = validResults.filter(r => r.uiComponents);

  const allHardcodes = filesWithHardcodes.flatMap(r =>
    r.hardcodedColors.map(h => ({ ...h, file: r.path }))
  );

  const colorFrequency = {};
  allHardcodes.forEach(h => {
    colorFrequency[h.color] = (colorFrequency[h.color] || 0) + 1;
  });

  console.log('\n' + '='.repeat(70));
  console.log('📊 RAPPORT D\'AUDIT COULEURS SER1');
  console.log('='.repeat(70));

  console.log('\n📁 Vue d\'ensemble:');
  console.log(`   Fichiers analysés: ${totalFiles}`);
  console.log(`   Fichiers avec hardcodes: ${filesWithHardcodes.length}`);
  console.log(`   Fichiers avec tokens C1-C10: ${filesUsingTokens.length}`);
  console.log(`   Fichiers utilisant composants UI: ${filesUsingUI.length}`);

  if (allHardcodes.length > 0) {
    console.log('\n⚠️  Couleurs hardcodées détectées:');
    console.log(`   Total: ${allHardcodes.length} occurrences`);

    console.log('\n   Top couleurs hardcodées:');
    Object.entries(colorFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([color, count]) => {
        console.log(`     ${color}: ${count} occurrences`);
      });

    console.log('\n   Détails (premiers 10):');
    allHardcodes.slice(0, 10).forEach(h => {
      const relativePath = h.file.replace(SRC_DIR, 'src');
      console.log(`     ${relativePath}:${h.line} -> ${h.color}`);
      console.log(`       ${h.context.substring(0, 60)}...`);
    });
  } else {
    console.log('\n✅ Aucune couleur hardcodée non autorisée détectée!');
  }

  console.log('\n📈 Adoption des tokens:');
  const adoptionRate = Math.round((filesUsingTokens.length / totalFiles) * 100);
  console.log(`   Taux d'adoption: ${adoptionRate}% (${filesUsingTokens.length}/${totalFiles})`);

  console.log('\n' + '='.repeat(70));
  console.log('Recommandations:');
  console.log('  1. Utiliser getSemanticColors() pour les nouveaux composants');
  console.log('  2. Migrer les hardcodes vers les tokens C1-C10');
  console.log('  3. Privilégier les composants UI tokenisés (Button, Card, etc.)');
  console.log('='.repeat(70) + '\n');

  return {
    totalFiles,
    hardcodedCount: allHardcodes.length,
    tokenUsageCount: filesUsingTokens.length,
    topHardcodes: Object.entries(colorFrequency).slice(0, 5),
  };
}

// Exécution
console.log('🔍 Analyse du codebase SER1...');
const results = [];
walkDir(SRC_DIR, (filepath) => {
  const result = analyzeFile(filepath);
  if (result) results.push(result);
});

generateReport(results);
