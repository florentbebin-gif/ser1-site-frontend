#!/usr/bin/env node

/**
 * Normalisation des icônes business exportées depuis PowerPoint
 * 
 * Processus :
 * 1. Lit les SVG bruts depuis src/icons/business/_raw/
 * 2. Applique la normalisation (viewBox, fill="currentColor", nettoyage)
 * 3. Génère les fichiers normalisés dans src/icons/business/svg/
 * 4. Copie vers public/pptx/icons/ pour usage PPTX
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Mapping des noms de fichiers
const nameMapping = {
  'Image1.svg': 'icon-money.svg',
  'Image2.svg': 'icon-cheque.svg',
  'Image3.svg': 'icon-bank.svg',
  'Image4.svg': 'icon-calculator.svg',
  'Image5.svg': 'icon-checklist.svg',
  'Image6.svg': 'icon-buildings.svg',
  'Image7.svg': 'icon-gauge.svg',
  'Image8.svg': 'icon-pen.svg',
  'Image9.svg': 'icon-chart-down.svg',
  'Image10.svg': 'icon-chart-up.svg',
  'Image11.svg': 'icon-balance.svg',
  'Image12.svg': 'icon-tower.svg'
};

/**
 * Normalise un SVG brut
 */
function normalizeSvg(svgContent) {
  let normalized = svgContent;
  
  // 1. Retirer width et height de la balise <svg>
  normalized = normalized.replace(/<svg([^>]*)\s+width="[^"]*"\s+height="[^"]*"([^>]*)>/g, '<svg$1$2>');
  normalized = normalized.replace(/<svg([^>]*)\s+height="[^"]*"\s+width="[^"]*"([^>]*)>/g, '<svg$1$2>');
  
  // 2. Ajouter viewBox si absent
  if (!normalized.includes('viewBox=')) {
    // Extraire width/height depuis le SVG original s'ils existent
    const widthMatch = svgContent.match(/width="(\d+)"/);
    const heightMatch = svgContent.match(/height="(\d+)"/);
    
    if (widthMatch && heightMatch) {
      const width = widthMatch[1];
      const height = heightMatch[1];
      normalized = normalized.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
    } else {
      // Fallback : viewBox par défaut
      normalized = normalized.replace('<svg', '<svg viewBox="0 0 24 24"');
    }
  }
  
  // 3. Ajouter fill="currentColor" à la balise <svg>
  if (!normalized.includes('fill=')) {
    normalized = normalized.replace('<svg', '<svg fill="currentColor"');
  } else if (!normalized.includes('fill="currentColor"')) {
    // Remplacer les fill existants par currentColor
    normalized = normalized.replace(/fill="[^"]*"/g, 'fill="currentColor"');
  }
  
  // 4. Nettoyer les attributs superflus (sans casser l'affichage)
  normalized = normalized.replace(/\s+xmlns:xlink="[^"]*"/g, '');
  normalized = normalized.replace(/\s+overflow="[^"]*"/g, '');
  normalized = normalized.replace(/\s+xml:space="[^"]*"/g, '');
  
  // 5. Nettoyer les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized.trim();
}

/**
 * Crée les répertoires de destination
 */
function ensureDirectories() {
  const dirs = [
    path.join(projectRoot, 'src/icons/business/svg'),
    path.join(projectRoot, 'public/pptx/icons')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Créé : ${dir}`);
    }
  });
}

/**
 * Traite tous les fichiers SVG
 */
function processIcons() {
  const rawDir = path.join(projectRoot, 'src/icons/business/_raw');
  const svgDir = path.join(projectRoot, 'src/icons/business/svg');
  const pptxDir = path.join(projectRoot, 'public/pptx/icons');
  
  console.log('🔄 Normalisation des icônes business...\n');
  
  let processedCount = 0;
  
  Object.entries(nameMapping).forEach(([sourceName, targetName]) => {
    const sourcePath = path.join(rawDir, sourceName);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  Fichier manquant : ${sourceName}`);
      return;
    }
    
    try {
      // Lire le SVG brut
      const rawSvg = fs.readFileSync(sourcePath, 'utf8');
      
      // Normaliser
      const normalizedSvg = normalizeSvg(rawSvg);
      
      // Écrire dans src/icons/business/svg/
      const targetSvgPath = path.join(svgDir, targetName);
      fs.writeFileSync(targetSvgPath, normalizedSvg, 'utf8');
      
      // Copier vers public/pptx/icons/
      const pptxPath = path.join(pptxDir, targetName);
      fs.writeFileSync(pptxPath, normalizedSvg, 'utf8');
      
      console.log(`✅ ${sourceName} → ${targetName}`);
      processedCount++;
      
    } catch (error) {
      console.error(`❌ Erreur traitement ${sourceName}:`, error.message);
    }
  });
  
  console.log(`\n🎉 Terminé : ${processedCount} icônes normalisées`);
}

/**
 * Point d'entrée principal
 */
function main() {
  try {
    ensureDirectories();
    processIcons();
    console.log('\n✨ Normalisation terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la normalisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
