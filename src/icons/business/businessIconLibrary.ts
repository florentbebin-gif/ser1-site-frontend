/**
 * Bibliothèque d'icônes business pour SER1
 * 
 * Fournit un accès centralisé aux icônes normalisées
 * avec support pour la recoloration et les exports PPTX
 */

// Types des icônes business disponibles
export type BusinessIconName = 
  | 'money'
  | 'cheque'
  | 'bank'
  | 'calculator'
  | 'checklist'
  | 'buildings'
  | 'gauge'
  | 'pen'
  | 'chart-down'
  | 'chart-up'
  | 'balance'
  | 'tower';

// Import des SVG normalisés via Vite raw import
import moneySvg from './svg/icon-money.svg?raw';
import chequeSvg from './svg/icon-cheque.svg?raw';
import bankSvg from './svg/icon-bank.svg?raw';
import calculatorSvg from './svg/icon-calculator.svg?raw';
import checklistSvg from './svg/icon-checklist.svg?raw';
import buildingsSvg from './svg/icon-buildings.svg?raw';
import gaugeSvg from './svg/icon-gauge.svg?raw';
import penSvg from './svg/icon-pen.svg?raw';
import chartDownSvg from './svg/icon-chart-down.svg?raw';
import chartUpSvg from './svg/icon-chart-up.svg?raw';
import balanceSvg from './svg/icon-balance.svg?raw';
import towerSvg from './svg/icon-tower.svg?raw';

// Mapping des noms vers les SVG
const svgMap: Record<BusinessIconName, string> = {
  'money': moneySvg,
  'cheque': chequeSvg,
  'bank': bankSvg,
  'calculator': calculatorSvg,
  'checklist': checklistSvg,
  'buildings': buildingsSvg,
  'gauge': gaugeSvg,
  'pen': penSvg,
  'chart-down': chartDownSvg,
  'chart-up': chartUpSvg,
  'balance': balanceSvg,
  'tower': towerSvg
};

/**
 * Options pour la génération d'icônes
 */
interface BusinessIconOptions {
  /** Couleur personnalisée (hex, rgb, var(--...)). Si non spécifié, utilise currentColor */
  color?: string;
}

/**
 * Retourne le SVG d'une icône business
 * 
 * @param name - Nom de l'icône
 * @param opts - Options (couleur personnalisée)
 * @returns String SVG avec la couleur appliquée
 */
export function getBusinessIconSvg(name: BusinessIconName, opts?: BusinessIconOptions): string {
  const svg = svgMap[name];
  
  if (!svg) {
    throw new Error(`Icône business inconnue: ${name}`);
  }
  
  // Si une couleur personnalisée est spécifiée, remplacer currentColor
  if (opts?.color) {
    return svg.replace(/fill="currentColor"/g, `fill="${opts.color}"`);
  }
  
  return svg;
}

/**
 * Retourne l'icône business en Data URI (base64)
 * Utile pour PPTXGenJS addImage({ data })
 * 
 * @param name - Nom de l'icône
 * @param opts - Options (couleur personnalisée)
 * @returns Data URI SVG encodé en base64
 */
export function getBusinessIconDataUri(name: BusinessIconName, opts?: BusinessIconOptions): string {
  const svg = getBusinessIconSvg(name, opts);
  
  // Encoder en base64 (compatible navigateur)
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Liste toutes les icônes business disponibles
 */
export function getAvailableBusinessIcons(): BusinessIconName[] {
  return Object.keys(svgMap) as BusinessIconName[];
}

/**
 * Vérifie si une icône business existe
 */
export function hasBusinessIcon(name: string): name is BusinessIconName {
  return name in svgMap;
}

/**
 * Export par défaut pour usage facile
 */
export default {
  getBusinessIconSvg,
  getBusinessIconDataUri,
  getAvailableBusinessIcons,
  hasBusinessIcon
};
