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
  | 'tower'
  | 'percent'
  | 'close'
  | 'checkbox'
  | 'user-remove'
  | 'user-add'
  | 'network'
  | 'book'
  | 'bar-chart'
  | 'table'
  | 'books'
  | 'hierarchy'
  | 'cloud'
  | 'tool'
  | 'team'
  | 'institution'
  | 'location'
  | 'couple'
  | 'family'
  | 'search-target'
  | 'clipboard'
  | 'family-children';

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
import percentSvg from './svg/icon-percent.svg?raw';
import closeSvg from './svg/icon-close.svg?raw';
import checkboxSvg from './svg/icon-checkbox.svg?raw';
import userRemoveSvg from './svg/icon-user-remove.svg?raw';
import userAddSvg from './svg/icon-user-add.svg?raw';
import networkSvg from './svg/icon-network.svg?raw';
import bookSvg from './svg/icon-book.svg?raw';
import barChartSvg from './svg/icon-bar-chart.svg?raw';
import tableSvg from './svg/icon-table.svg?raw';
import booksSvg from './svg/icon-books.svg?raw';
import hierarchySvg from './svg/icon-hierarchy.svg?raw';
import cloudSvg from './svg/icon-cloud.svg?raw';
import toolSvg from './svg/icon-tool.svg?raw';
import teamSvg from './svg/icon-team.svg?raw';
import institutionSvg from './svg/icon-institution.svg?raw';
import locationSvg from './svg/icon-location.svg?raw';
import coupleSvg from './svg/icon-couple.svg?raw';
import familySvg from './svg/icon-family.svg?raw';
import searchTargetSvg from './svg/icon-search-target.svg?raw';
import clipboardSvg from './svg/icon-clipboard.svg?raw';
import familyChildrenSvg from './svg/icon-family-children.svg?raw';

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
  'tower': towerSvg,
  'percent': percentSvg,
  'close': closeSvg,
  'checkbox': checkboxSvg,
  'user-remove': userRemoveSvg,
  'user-add': userAddSvg,
  'network': networkSvg,
  'book': bookSvg,
  'bar-chart': barChartSvg,
  'table': tableSvg,
  'books': booksSvg,
  'hierarchy': hierarchySvg,
  'cloud': cloudSvg,
  'tool': toolSvg,
  'team': teamSvg,
  'institution': institutionSvg,
  'location': locationSvg,
  'couple': coupleSvg,
  'family': familySvg,
  'search-target': searchTargetSvg,
  'clipboard': clipboardSvg,
  'family-children': familyChildrenSvg,
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
