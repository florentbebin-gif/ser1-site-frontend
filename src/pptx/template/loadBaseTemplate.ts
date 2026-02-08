/**
 * Chargement du template PowerPoint de base
 * 
 * Stratégie "Conservateur+" : Template codé via PptxGenJS defineSlideMaster().
 * Les masters définissent les backgrounds et éléments statiques.
 * Les builders ajoutent le contenu dynamique (texte, données, footer avec slideIndex).
 * 
 * Masters définis :
 * - SERENITY_COVER   : Fond bgMain (color1) — slide de couverture
 * - SERENITY_CHAPTER : Fond blanc — slides de chapitre
 * - SERENITY_CONTENT : Fond blanc — slides de contenu/synthèse
 * - SERENITY_END     : Fond bgMain (color1) — slide de fin/mentions légales
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles } from '../theme/types';
import { SLIDE_SIZE } from '../designSystem/serenity';
import { DEBUG_PPTX } from '../../utils/debugFlags';

export interface BaseTemplateConfig {
  title: string;
  author: string;
  company: string;
}

/**
 * Noms des slide masters Serenity
 * Utilisés par les builders via pptx.addSlide({ masterName })
 */
export const MASTER_NAMES = {
  COVER: 'SERENITY_COVER',
  CHAPTER: 'SERENITY_CHAPTER',
  CONTENT: 'SERENITY_CONTENT',
  END: 'SERENITY_END',
} as const;

export type MasterName = typeof MASTER_NAMES[keyof typeof MASTER_NAMES];

/**
 * Charge le template de base depuis le fichier PPTX
 * 
 * @param config - Configuration du template
 * @returns Instance PptxGenJS pré-configurée
 * 
 * TODO(#17): Spike timeboxé pour évaluer le chargement réel d'un fichier PPTX.
 * Voir ADR-001 pour la décision architecture.
 */
export function loadBaseTemplate(config: BaseTemplateConfig): PptxGenJS {
  const pptx = new PptxGenJS();
  
  // Configuration de base
  pptx.title = config.title;
  pptx.author = config.author;
  pptx.company = config.company;
  
  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX] loadBaseTemplate: using coded template (Conservateur+ strategy)');
  }
  
  return pptx;
}

/**
 * Définit les 4 slide masters Serenity sur une instance PptxGenJS.
 * 
 * Chaque master fournit :
 * - Background (couleur de fond)
 * - Margin (marge par défaut)
 * 
 * Les éléments dynamiques (footer, header, contenu) restent dans les builders
 * car ils dépendent du slideIndex et des données.
 * 
 * @param pptx - Instance PptxGenJS
 * @param theme - Thème PPTX résolu (pour bgMain)
 */
export function defineSlideMasters(pptx: PptxGenJS, theme: PptxThemeRoles): void {
  // COVER : fond sombre (bgMain = color1)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.COVER,
    background: { color: theme.bgMain.replace('#', '') },
    margin: 0,
  });
  
  // CHAPTER : fond blanc (panel + image ajoutés par le builder)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.CHAPTER,
    background: { color: 'FFFFFF' },
    margin: 0,
  });
  
  // CONTENT : fond blanc (utilisé par content, synthesis, annexe, amortization)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.CONTENT,
    background: { color: 'FFFFFF' },
    margin: 0,
  });
  
  // END : fond sombre (bgMain = color1)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.END,
    background: { color: theme.bgMain.replace('#', '') },
    margin: 0,
  });
  
  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX] defineSlideMasters: 4 masters defined (COVER, CHAPTER, CONTENT, END)');
  }
}

/**
 * @deprecated Utilisez defineSlideMasters() à la place.
 * Conservé pour compatibilité arrière.
 */
export function reconstructBaseTemplate(config: BaseTemplateConfig): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.title = config.title;
  pptx.author = config.author;
  pptx.company = config.company;
  pptx.layout = SLIDE_SIZE.layout;
  return pptx;
}

/**
 * Vérifie la disponibilité du template file
 * 
 * @returns Promise<boolean> - true si le fichier template existe
 */
export async function isTemplateAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/pptx/templates/serenity-base.pptx', { method: 'HEAD' });
    const available = response.ok;
    
    if (DEBUG_PPTX) {
      // eslint-disable-next-line no-console
      console.debug(`📁 Template check: ${available ? 'found' : 'not found'}`);
    }
    
    return available;
  } catch {
    // En cas d'erreur réseau, on suppose que le fichier n'est pas disponible
    if (DEBUG_PPTX) {
      // eslint-disable-next-line no-console
      console.debug('📁 Template check: error (assuming not available)');
    }
    return false;
  }
}

export default {
  loadBaseTemplate,
  defineSlideMasters,
  reconstructBaseTemplate,
  isTemplateAvailable,
  MASTER_NAMES,
};
